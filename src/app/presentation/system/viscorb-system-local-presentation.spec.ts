import * as THREE from 'three';
import { describe,it,expect } from 'vitest';
import { ViscorbSystemLocalPresentationV1,viscorbOrbitGeometryRadiiV1 } from './viscorb-system-local-presentation';
import type {SystemSceneBodySnapshot,SystemSceneMoonSnapshot,SystemSceneOrbitSnapshot,SystemSceneScaleSnapshot} from './system-scene-snapshot';
import { buildSystemSceneMoonPresentationV1 } from './system-scene-moon-presentation';

function scenario() {
  const planet={id:'planet-b',kind:'planet',radiusScene:0.30,specialPresentation:null} as SystemSceneBodySnapshot;
  // Real, fully typed presentation from the approved moon visual builder;
  // no partial mock and no TS2352 / double assertion.
  const moon: SystemSceneMoonSnapshot = {
    id:'moon-b-1',kind:'moon',label:'Luna B-I',title:'Luna B-I',
    hostPlanetId:'planet-b',hostPlanetOrdinal:2,colorHex:'#869bb7',radiusScene:0.07,
    orbitId:'orbit-moon-1',position:{x:1.2,y:0,z:0},motionContributions:[],
    spin:{source:'MOON_21_4',rotationPeriodHours:120,axialTiltDegrees:0,
      isRetrograde:false,isSynchronized:true,epochPhaseDegrees:0},
    visualPresentation: buildSystemSceneMoonPresentationV1({
      moonIdentity:'moon-b-1',hostPlanetType:'ROCKY',radiusEarth:0.12,
      massEarth:0.002,meanDensityGramsPerCubicCentimeter:3.2,
      surfaceGravityEarth:0.08,atmosphereRetentionIndex01:0.02,
      atmosphereRegime:'NONE',waterInventoryIndex01:0.04,
      inferredIceRichnessIndex01:0.08,subsurfaceOceanPotentialIndex01:0.02,
      surfaceLiquidWaterPotentialIndex01:0,waterRegime:'NONE',
      estimatedSurfaceTemperatureKelvin:250,geologicalActivityIndex01:0.04,
      tidalHeatingIndex01:0.01,geologyRegime:'INERT',overallHabitabilityIndex01:0,
      isPotentiallyHabitable:false,giantHostSpecialization:false,
      giantCompositionRegime:'NOT_APPLICABLE',isLargeGiantMoon:false,
      isTidallyActiveGiantMoon:false,isOceanBearingGiantMoonCandidate:false,
    }),
  };
  const planetGroup=new THREE.Group();
  const moonGroup=new THREE.Group();moonGroup.position.set(1.2,0,0);
  const geometry=new THREE.BufferGeometry().setFromPoints(Array.from({length:160},(_,i)=>{
    const a=i*Math.PI*2/160;return new THREE.Vector3(Math.cos(a)*1.2,0,Math.sin(a)*0.85);
  }));
  const line=new THREE.LineLoop(geometry,new THREE.LineBasicMaterial({opacity:0.3,transparent:true}));
  const orbit={id:'orbit-moon-1',kind:'moon',anchorMotionContributions:[]} as unknown as SystemSceneOrbitSnapshot;
  return {planet,moon,orbit,planetGroup,moonGroup,line};
}

describe('GENESIS VISCORB.1 · escena local sin duplicación de cuerpos',()=>{
  it('deriva los radios de la elipse sin circularizarla',()=>{
    const data=scenario();const radii=viscorbOrbitGeometryRadiiV1(data.line.geometry)!;
    expect(radii.periapsis).toBeCloseTo(0.85,1);
    expect(radii.apoapsis).toBeCloseTo(1.2,1);
  });
  it('reutiliza instancias de luna y guía, vuelve a la posición global al salir',()=>{
    const d=scenario();const controller=new ViscorbSystemLocalPresentationV1();
    const objects=new Map([[d.planet.id,d.planetGroup],[d.moon.id,d.moonGroup]]);
    const lines=new Map([[d.orbit.id,d.line]]);
    const extent=controller.begin(d.planet,[d.planet],[d.moon],[d.orbit],{} as SystemSceneScaleSnapshot,objects,lines);
    expect(extent).toBeGreaterThan(0);
    const projector=()=>new THREE.Vector3(1.2,0,0);
    for(let ms=0;ms<=640;ms+=80) controller.update(0,ms,projector);
    expect(controller.hostId).toBe('planet-b');
    expect(d.moonGroup.position.x).toBeCloseTo(d.line.scale.x*1.2,5);
    expect(d.moonGroup.scale.x).toBeGreaterThan(0);
    // At 0.30 host radius the revised presentation keeps the moon below
    // the previous maximum apparent radius, without changing its ellipse.
    expect(d.moonGroup.scale.x * d.moon.radiusScene / d.planet.radiusScene)
      .toBeLessThan(0.26);
    controller.release();
    for(let ms=720;ms<=1440;ms+=80) controller.update(0,ms,projector);
    expect(controller.hostId).toBeNull();
    expect(d.moonGroup.position.x).toBeCloseTo(1.2,6);
    expect(d.moonGroup.scale.x).toBe(1);
    expect(d.line.scale.x).toBe(1);
    expect((d.line.material as THREE.LineBasicMaterial).opacity).toBeCloseTo(0.3);
  });
  it('no fabrica lunas para un planeta sin satélites conocidos',()=>{
    const d=scenario(); const controller=new ViscorbSystemLocalPresentationV1();
    expect(controller.begin(d.planet,[d.planet],[],[],{} as SystemSceneScaleSnapshot,
      new Map([[d.planet.id,d.planetGroup]]),new Map())).toBeNull();
  });
});
