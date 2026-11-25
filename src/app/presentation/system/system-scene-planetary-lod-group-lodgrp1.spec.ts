import { describe, expect, it } from 'vitest';
import { PlanetaryLodGroupControllerV1, lodgrpEstimateBytesV1,
  lodgrpProximityV1, LODGRP_MAX_BYTES_V1 } from './system-scene-planetary-lod-group-lodgrp1';
import type { LodgrpAtlasResultV1 } from './system-scene-group-atlas-lodgrp1';

const result=(id:string,generation:number):LodgrpAtlasResultV1=>({
  type:id.startsWith('planet')?'planet':'moon',generation,bodyId:id,
  width:512,height:256,solid:false,
  maps:{albedo:new Uint8Array(512*256*4)},
});

describe('GENESIS LODGRP.1 — LOD planetario coordinado',()=>{
  it('prepara la unidad anfitrión + todas sus lunas y conmuta de una vez',()=>{
    const controller=new PlanetaryLodGroupControllerV1();
    expect(controller.begin({hostId:'planet-A',moonIds:['moon-A1','moon-A2'],
      requestedBytes:lodgrpEstimateBytesV1(2)})).toBe(true);
    const generation=controller.status.generation;
    expect(controller.status.phase).toBe('PREPARING');
    expect(controller.memberIds).toEqual(['planet-A','moon-A1','moon-A2']);
    expect(controller.activate()).toBe(false);
    expect(controller.accept(result('planet-A',generation))).toBe(true);
    expect(controller.status.phase).toBe('PREPARING');
    expect(controller.accept(result('moon-A1',generation))).toBe(true);
    expect(controller.accept(result('moon-A2',generation))).toBe(true);
    expect(controller.status.phase).toBe('READY');
    expect(controller.activate()).toBe(true);
    expect(controller.isHigh).toBe(true);
    expect(controller.begin({hostId:'planet-A',moonIds:['moon-A1','moon-A2'],
      requestedBytes:lodgrpEstimateBytesV1(2)})).toBe(false);
    expect(controller.isHigh).toBe(true);
  });
  it('rechaza respuestas obsoletas al cambiar de anfitrión',()=>{
    const c=new PlanetaryLodGroupControllerV1();
    c.begin({hostId:'planet-A',moonIds:['moon-A1'],requestedBytes:lodgrpEstimateBytesV1(1)});
    const old=c.status.generation;
    c.begin({hostId:'planet-B',moonIds:[],requestedBytes:lodgrpEstimateBytesV1(0)});
    expect(c.accept(result('moon-A1',old))).toBe(false);
    expect(c.memberIds).toEqual(['planet-B']);
    expect(c.status.phase).toBe('PREPARING');
  });
  it('reutiliza CPU cache al regresar y limpia al sustituir sistema',()=>{
    const c=new PlanetaryLodGroupControllerV1();
    const group={hostId:'planet-A',moonIds:['moon-A1'],requestedBytes:lodgrpEstimateBytesV1(1)};
    c.begin(group);
    const gen=c.status.generation;
    c.accept(result('planet-A',gen));c.accept(result('moon-A1',gen));
    c.activate();c.leave();
    expect(c.begin(group)).toBe(true);
    expect(c.status.phase).toBe('READY');
    expect(c.pendingIds).toHaveLength(0);
    expect(c.cacheStats.entries).toBe(2);
    c.reset();
    expect(c.cacheStats.entries).toBe(0);
    expect(c.status.phase).toBe('LOW');
  });
  it('no sobrepasa el presupuesto en un anfitrión con muchas lunas',()=>{
    const c=new PlanetaryLodGroupControllerV1();
    const count=17;
    expect(lodgrpEstimateBytesV1(count)).toBeGreaterThan(LODGRP_MAX_BYTES_V1);
    c.begin({hostId:'planet-big',moonIds:Array.from({length:count},(_,i)=>`moon-${i}`),
      requestedBytes:lodgrpEstimateBytesV1(count)});
    expect(c.status.phase).toBe('BUDGET_LIMITED');
    expect(c.pendingIds).toHaveLength(count+1);
  });
  it('aplica histéresis y mantiene detalle en seguimiento lunar directo',()=>{
    expect(lodgrpProximityV1(72,false,'OUT')).toBe('PREPARING');
    expect(lodgrpProximityV1(105,false,'PREPARING')).toBe('IN');
    expect(lodgrpProximityV1(64,false,'IN')).toBe('IN');
    expect(lodgrpProximityV1(48,false,'IN')).toBe('PREPARING');
    expect(lodgrpProximityV1(20,false,'PREPARING')).toBe('OUT');
    expect(lodgrpProximityV1(1,true,'OUT')).toBe('IN');
  });
  it('no fuerza activación tras un fallo de generación',()=>{
    const c=new PlanetaryLodGroupControllerV1();
    c.begin({hostId:'planet-A',moonIds:[],requestedBytes:lodgrpEstimateBytesV1(0)});
    c.fail();
    expect(c.status.phase).toBe('FAILED');
    expect(c.activate()).toBe(false);
  });
});
