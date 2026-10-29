import { afterEach, describe, expect, it, vi } from 'vitest';
import { RegionalTechnosignature37bScanner } from './regional-technosignature-37b.scanner';

const request={seed:'7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5',version:3,galaxyIndex:'8',centerX:1,centerY:2};
const initialWorker=globalThis.Worker;
let workers: FakeWorker[]=[];
class FakeWorker {
  onmessage: ((event:MessageEvent) => void)|null=null;
  onerror: ((event:ErrorEvent) => void)|null=null;
  terminated=false;
  postMessage=vi.fn();
  terminate(){this.terminated=true;}
  constructor(_url:URL, readonly options?:WorkerOptions){workers.push(this);}
  complete(status:'DETECTED'|'NO_SIGNAL'|'INCOMPLETE'){
    this.onmessage?.({data:{kind:'complete',status}} as MessageEvent);
  }
}
afterEach(()=>{globalThis.Worker=initialWorker;workers=[];});
describe('37.B: Worker ES module, cancelación y caché',()=>{
  it('inicia módulo ES y solo publica un estado anónimo',async()=>{
    globalThis.Worker=FakeWorker as unknown as typeof Worker;
    const scanner=new RegionalTechnosignature37bScanner();
    const result=scanner.scan(request);
    expect(workers).toHaveLength(1);
    expect(workers[0].options?.type).toBe('module');
    workers[0].complete('DETECTED');
    expect(await result).toBe('DETECTED');
    expect(workers[0].terminated).toBe(true);
    expect(await scanner.scan(request)).toBe('DETECTED');
    expect(workers).toHaveLength(1);
  });
  it('cancela una respuesta antigua al elegir otra región',async()=>{
    globalThis.Worker=FakeWorker as unknown as typeof Worker;
    const scanner=new RegionalTechnosignature37bScanner();
    const first=scanner.scan(request);
    const firstRejected=expect(first).rejects.toThrow('cancelado');
    const second=scanner.scan({...request,centerX:2});
    expect(workers[0].terminated).toBe(true);
    workers[0].complete('DETECTED');
    workers[1].complete('NO_SIGNAL');
    await firstRejected;
    expect(await second).toBe('NO_SIGNAL');
  });
  it('reutiliza caché entre sectores vecinos del mismo bloque 10×10',async()=>{
    globalThis.Worker=FakeWorker as unknown as typeof Worker;
    const scanner=new RegionalTechnosignature37bScanner();
    const first=scanner.scan(request);workers[0].complete('DETECTED');
    expect(await first).toBe('DETECTED');
    expect(await scanner.scan({...request,centerX:6,centerY:7})).toBe('DETECTED');
    expect(workers).toHaveLength(1);
  });
  it('no cachea una consulta incompleta',async()=>{
    globalThis.Worker=FakeWorker as unknown as typeof Worker;
    const scanner=new RegionalTechnosignature37bScanner();
    const a=scanner.scan(request); workers[0].complete('INCOMPLETE');
    expect(await a).toBe('INCOMPLETE');
    const b=scanner.scan(request); expect(workers).toHaveLength(2);
    workers[1].complete('DETECTED');
    expect(await b).toBe('DETECTED');
  });
});
