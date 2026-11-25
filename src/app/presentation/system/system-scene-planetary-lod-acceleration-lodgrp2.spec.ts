import {describe,it,expect} from 'vitest';
import {LodgrpTimingsV2,lodgrpProximityV2,lodgrpPrioritiseMoonsV2,
  lodgrpUnstagedAtlasesV2,lodgrpTerminateWorkerV2}
  from './system-scene-planetary-lod-acceleration-lodgrp2';
import {PlanetaryLodGroupControllerV1,lodgrpEstimateBytesV1}
  from './system-scene-planetary-lod-group-lodgrp1';
import type {LodgrpAtlasResultV1} from './system-scene-group-atlas-lodgrp1';

const atlas=(id:string,generation:number):LodgrpAtlasResultV1=>({
  type:id.startsWith('planet')?'planet':'moon',bodyId:id,generation,
  width:512,height:256,solid:false,maps:{albedo:new Uint8Array(64)},
});

describe('GENESIS LODGRP.2 — preparación anticipada y activación rápida',()=>{
  it('prepara desde mayor distancia, con histéresis y seguimiento inmediato',()=>{
    expect(lodgrpProximityV2(115,false,'OUT')).toBe('PREPARING');
    expect(lodgrpProximityV2(75,false,'OUT')).toBe('OUT');
    expect(lodgrpProximityV2(165,false,'PREPARING')).toBe('IN');
    expect(lodgrpProximityV2(87,false,'IN')).toBe('IN');
    expect(lodgrpProximityV2(70,false,'IN')).toBe('PREPARING');
    expect(lodgrpProximityV2(40,false,'PREPARING')).toBe('OUT');
    expect(lodgrpProximityV2(0,true,'OUT')).toBe('IN');
  });
  it('prioriza la luna seguida y después las más cercanas sin modificar la entrada',()=>{
    const members=['moon-a','moon-b','moon-c'];
    const scores=new Map([['moon-a',-80],['moon-b',-12],['moon-c',-35]]);
    expect(lodgrpPrioritiseMoonsV2(members,'moon-c',scores))
      .toEqual(['moon-c','moon-b','moon-a']);
    expect(members).toEqual(['moon-a','moon-b','moon-c']);
  });
  it('cambiar de luna no reinicia el grupo, aunque cambie el orden de preparación',()=>{
    const c=new PlanetaryLodGroupControllerV1();
    const g={hostId:'planet',moonIds:['moon-a','moon-b'],requestedBytes:lodgrpEstimateBytesV1(2)};
    c.begin(g);
    const gen=c.status.generation;
    c.accept(atlas('planet',gen));c.accept(atlas('moon-a',gen));c.accept(atlas('moon-b',gen));
    c.activate();
    expect(c.begin({...g,moonIds:['moon-b','moon-a']})).toBe(false);
    expect(c.status.phase).toBe('HIGH');
    expect(c.status.generation).toBe(gen);
  });
  it('permite preparar GPU mientras CPU aún está generando otras lunas',()=>{
    const c=new PlanetaryLodGroupControllerV1();
    c.begin({hostId:'planet',moonIds:['moon-a','moon-b'],requestedBytes:lodgrpEstimateBytesV1(2)});
    const gen=c.status.generation;
    const staged=new Set<string>();
    c.accept(atlas('planet',gen));
    expect(c.status.phase).toBe('PREPARING');
    expect(lodgrpUnstagedAtlasesV2(c.prepared,staged).map(a=>a.bodyId)).toEqual(['planet']);
    staged.add('planet');
    expect(lodgrpUnstagedAtlasesV2(c.prepared,staged)).toHaveLength(0);
    c.accept(atlas('moon-a',gen));
    expect(lodgrpUnstagedAtlasesV2(c.prepared,staged).map(a=>a.bodyId)).toEqual(['moon-a']);
    staged.add('moon-a');
    c.accept(atlas('moon-b',gen));
    expect(c.status.phase).toBe('READY');
    expect(lodgrpUnstagedAtlasesV2(c.prepared,staged).map(a=>a.bodyId)).toEqual(['moon-b']);
  });
  it('reutiliza worker inactivo y termina el trabajo obsoleto',()=>{
    expect(lodgrpTerminateWorkerV2(false,false)).toBe(false);
    expect(lodgrpTerminateWorkerV2(true,false)).toBe(true);
    expect(lodgrpTerminateWorkerV2(false,true)).toBe(true);
  });
  it('registra por separado CPU, ida/vuelta worker, GPU y activación',()=>{
    const t=new LodgrpTimingsV2();t.begin(1000);
    t.generated(37,49,1049);t.uploaded(4);
    t.generated(50,59,1108);t.cpuCompleted(1108);
    t.uploaded(7);t.gpuCompleted(1117);t.activated(1118);
    expect(t.snapshot(1120)).toEqual({
      sinceStartMs:120,firstAtlasMs:49,generatedAtlases:2,totalCpuMs:87,
      totalWorkerRoundtripMs:108,totalGpuUploadMs:11,maxGpuUploadMs:7,
      uploadedMaps:2,cpuFinishedAtMs:108,gpuFinishedAtMs:117,activatedAtMs:118,
    });
  });
  it('descarta muestras negativas por seguridad',()=>{
    const t=new LodgrpTimingsV2();t.begin(90);
    t.generated(-3,-5,95);t.uploaded(-7);
    expect(t.snapshot(100).totalCpuMs).toBe(0);
    expect(t.snapshot(100).totalWorkerRoundtripMs).toBe(0);
    expect(t.snapshot(100).totalGpuUploadMs).toBe(0);
  });
});
