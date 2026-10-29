import { describe, expect, it, vi } from 'vitest';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { ensureVida9PlanetsInBackground } from './vida9-background-materializer';

describe('Indexación biológica fuera del hilo de Angular', () => {
  it('comparte la tarea por semilla y conjunto confirmado, sin producir un cero provisional', async () => {
    const events: Record<string,(event:unknown)=>void> = {};
    const sent:unknown[]=[];
    const created:WorkerOptions[]=[];
    let autoReply=true;
    let terminated=0;
    class FakeWorker {
      constructor(_url:URL, options:WorkerOptions){created.push(options);}
      addEventListener(kind:string,handler:(event:unknown)=>void){events[kind]=handler;}
      postMessage(message:unknown){
        sent.push(message);
        const request=message as {requestId:number};
        if(autoReply)queueMicrotask(()=>events['message']?.({data:{kind:'done',requestId:request.requestId,
          value:{indexed:2,expected:2,missingPhysical:0,candidates:['0:1:2:3:PLANET:-']}}}));
      }
      terminate(){terminated++;}
    }
    vi.stubGlobal('Worker',FakeWorker);
    vi.stubGlobal('indexedDB',{});
    try {
      const key=new UniverseGenerationKey(
        UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5'),GeneratorVersion.V3);
      const confirmed=new Set(['0/1/2']);
      const one=ensureVida9PlanetsInBackground(key,0n,confirmed);
      const two=ensureVida9PlanetsInBackground(key,0n,confirmed);
      expect(one).toBe(two);
      expect((await one)?.candidates).toEqual(['0:1:2:3:PLANET:-']);
      expect(sent).toHaveLength(1);
      expect(created).toHaveLength(1);
      expect(created[0]).toMatchObject({type:'module',name:'genesis-vida9-background'});
      expect((sent[0] as {systems:string[]}).systems).toEqual(['0/1/2']);
      expect((await one)?.problems).toBeUndefined();

      // The browser may reject a worker during loading. A rejected job must
      // release the shared instance so the next navigation can retry.
      autoReply=false;
      const second=new Set(['0/2/4']);
      const failed=ensureVida9PlanetsInBackground(key,0n,second);
      expect(failed).not.toBeNull();
      events['error']?.({message:'Fallo simulado de carga del Worker'});
      await expect(failed).rejects.toThrow('Fallo simulado');
      expect(terminated).toBe(1);
      autoReply=true;
      const retry=ensureVida9PlanetsInBackground(key,0n,second);
      expect((await retry)?.indexed).toBe(2);
      expect(created).toHaveLength(2);
      expect(created[1]).toMatchObject({type:'module',name:'genesis-vida9-background'});
    } finally {vi.unstubAllGlobals();}
  });
});
