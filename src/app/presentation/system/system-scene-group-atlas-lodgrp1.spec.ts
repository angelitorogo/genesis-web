import {describe,expect,it} from 'vitest';
import {buildLodgrpAtlasV1,lodgrpAtlasByteSizeV1} from './system-scene-group-atlas-lodgrp1';
import {buildSystemSceneMoonPresentationV1,
  type SystemSceneMoonPresentationInputV1} from './system-scene-moon-presentation';

const moonInput:SystemSceneMoonPresentationInputV1={
  moonIdentity:'LODGRP1-REAL-PRESENTATION',hostPlanetType:'GAS_GIANT',
  radiusEarth:.27,massEarth:.025,meanDensityGramsPerCubicCentimeter:2.8,
  surfaceGravityEarth:.24,atmosphereRetentionIndex01:.01,
  atmosphereRegime:'NONE',atmosphereScenarioPressurePascal:null,
  atmosphereScenarioSpecies:[],waterInventoryIndex01:.34,
  inferredIceRichnessIndex01:.41,subsurfaceOceanPotentialIndex01:.20,
  surfaceLiquidWaterPotentialIndex01:0,waterRegime:'NONE',
  estimatedSurfaceTemperatureKelvin:145,geologicalActivityIndex01:.35,
  tidalHeatingIndex01:.15,geologyRegime:'ACTIVE',overallHabitabilityIndex01:.05,
  isPotentiallyHabitable:false,giantHostSpecialization:true,
  giantCompositionRegime:'MIXED_ROCK_ICE',isLargeGiantMoon:false,
  isTidallyActiveGiantMoon:false,isOceanBearingGiantMoonCandidate:false,
};

describe('GENESIS LODGRP.1 — atlas calculado fuera del render',()=>{
  it('preserva el atlas de luna D.3 y los mapas de normal y rugosidad',()=>{
    const presentation=buildSystemSceneMoonPresentationV1(moonInput);
    const atlas=buildLodgrpAtlasV1({type:'moon',generation:4,bodyId:'moon-test',presentation});
    expect(atlas.width).toBe(1024);
    expect(atlas.height).toBe(512);
    expect(atlas.maps.albedo?.byteLength).toBe(1024*512*4);
    expect(atlas.maps.normal?.byteLength).toBe(1024*512*4);
    expect(atlas.maps.roughness?.byteLength).toBe(1024*512*4);
    expect(lodgrpAtlasByteSizeV1(atlas)).toBe(1024*512*4*3);
  },15000);
  it('refina un planeta no sólido en nivel 512 sin volver a introducir 1024',()=>{
    const rgba=new Uint8Array(256*128*4);
    for(let i=0;i<rgba.length;i+=4){rgba[i]=37;rgba[i+1]=91;rgba[i+2]=143;rgba[i+3]=255;}
    const atlas=buildLodgrpAtlasV1({type:'planet',generation:2,bodyId:'planet-gas',
      seed:12345,solidSeed:12345,giantAtmosphere:null,solidSource:null,
      source:{albedo:{width:256,height:128,pixels:rgba}}});
    expect(atlas.width).toBe(512);
    expect(atlas.height).toBe(256);
    expect(atlas.maps.albedo?.length).toBe(512*256*4);
    expect(atlas.maps.normal).toBeUndefined();
  });
});
