import {afterEach, describe, expect, it, vi} from 'vitest';
import {RegionalTechnosignature37bScanner} from './regional-technosignature-37b.scanner';

/** Certificación 37.C: índices de generación/galaxia, LRU y cancelación. */
const base={seed:'7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5',version:3,
  galaxyIndex:'6',centerX:1,centerY:2};
const original=globalThis.Worker;
const created:ControlledWorker[]=[];
class ControlledWorker {
  onmessage:((message:MessageEvent)=>void)|null=null;
  onerror:((event:ErrorEvent)=>void)|null=null;
  terminated=false;
  readonly postMessage=vi.fn();
  constructor(_url:URL, readonly options?:WorkerOptions){created.push(this);}
  terminate():void {this.terminated=true;}
  reply(status:'DETECTED'|'NO_SIGNAL'|'INCOMPLETE'):void {
    this.onmessage?.({data:{kind:'complete',status}} as MessageEvent);
  }
  fail(message='Error controlado'):void {
    this.onerror?.({message} as ErrorEvent);
  }
}
afterEach(()=>{globalThis.Worker=original;created.length=0;});
const useWorker=()=>{globalThis.Worker=ControlledWorker as unknown as typeof Worker;};

describe('37.C: auditoría del escáner regional',()=>{
  it('aísla el resultado entre galaxias aunque la ventana y seed coincidan',async()=>{
    useWorker();const scanner=new RegionalTechnosignature37bScanner();
    const first=scanner.scan(base);created[0].reply('DETECTED');
    expect(await first).toBe('DETECTED');
    const second=scanner.scan({...base,galaxyIndex:'7'});
    expect(created).toHaveLength(2);created[1].reply('NO_SIGNAL');
    expect(await second).toBe('NO_SIGNAL');
    expect(await scanner.scan(base)).toBe('DETECTED');
    expect(created).toHaveLength(2);
  });
  it('aísla resultados entre universos distintos sin mezclar caches',async()=>{
    useWorker();const scanner=new RegionalTechnosignature37bScanner();
    const first=scanner.scan(base);created[0].reply('DETECTED');await first;
    const second=scanner.scan({...base,seed:'OTRA-SEMILLA'});
    expect(created).toHaveLength(2);created[1].reply('NO_SIGNAL');
    expect(await second).toBe('NO_SIGNAL');
  });
  it('expulsa la ventana más antigua cuando se superan las 16 entradas',async()=>{
    useWorker();const scanner=new RegionalTechnosignature37bScanner();
    for(let i=0;i<17;i++){
      const result=scanner.scan({...base,centerX:i*10,centerY:0});
      expect(created.at(-1)?.options?.type).toBe('module');
      created.at(-1)?.reply('DETECTED');await result;
    }
    const recent=await scanner.scan({...base,centerX:160,centerY:0});
    expect(recent).toBe('DETECTED');
    expect(created).toHaveLength(17);
    const oldest=scanner.scan({...base,centerX:0,centerY:0});
    expect(created).toHaveLength(18);created.at(-1)?.reply('NO_SIGNAL');
    expect(await oldest).toBe('NO_SIGNAL');
  });
  it('un acceso reciente conserva su entrada frente a la expulsión LRU',async()=>{
    useWorker();const scanner=new RegionalTechnosignature37bScanner();
    for(let i=0;i<16;i++){
      const p=scanner.scan({...base,centerX:i*10,centerY:0});
      created.at(-1)?.reply('DETECTED');await p;
    }
    expect(await scanner.scan({...base,centerX:0,centerY:0})).toBe('DETECTED');
    const p=scanner.scan({...base,centerX:160,centerY:0});
    created.at(-1)?.reply('NO_SIGNAL');await p;
    // Se ha utilizado de nuevo la primera ventana; no debe ser expulsada.
    expect(await scanner.scan({...base,centerX:0,centerY:0})).toBe('DETECTED');
    expect(created).toHaveLength(17);
    // Se elimina la segunda, la menos recientemente consultada.
    const older=scanner.scan({...base,centerX:10,centerY:0});
    expect(created).toHaveLength(18);
    created.at(-1)?.reply('NO_SIGNAL');expect(await older).toBe('NO_SIGNAL');
  });
  it('termina el Worker al cancelar y no publica su respuesta tardía',async()=>{
    useWorker();const scanner=new RegionalTechnosignature37bScanner();
    const pending=scanner.scan(base);
    const rejection=expect(pending).rejects.toThrow('cancelado');
    scanner.cancel();expect(created[0].terminated).toBe(true);
    created[0].reply('DETECTED');await rejection;
    const retried=scanner.scan(base);
    expect(created).toHaveLength(2);
    created[1].reply('NO_SIGNAL');expect(await retried).toBe('NO_SIGNAL');
  });
  it('el fallo del módulo permite reintentar y nunca guarda un falso negativo',async()=>{
    useWorker();const scanner=new RegionalTechnosignature37bScanner();
    const first=scanner.scan(base);const rejected=expect(first).rejects.toThrow('Worker no disponible');
    created[0].fail('Worker no disponible');await rejected;
    const second=scanner.scan(base);expect(created).toHaveLength(2);
    created[1].reply('DETECTED');expect(await second).toBe('DETECTED');
  });
  it('no guarda en caché INCOMPLETE, para permitir una reevaluación real',async()=>{
    useWorker();const scanner=new RegionalTechnosignature37bScanner();
    const first=scanner.scan(base);created[0].reply('INCOMPLETE');
    expect(await first).toBe('INCOMPLETE');
    const second=scanner.scan(base);expect(created).toHaveLength(2);
    created[1].reply('DETECTED');expect(await second).toBe('DETECTED');
  });
});
