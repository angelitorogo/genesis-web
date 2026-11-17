import * as THREE from 'three';
import {
  VIDA38_INFRASTRUCTURE_REVISION_386,
  vida38InfrastructureAnchor386,
  type Vida38InfrastructurePlan386,
} from './vida38-infrastructure-plan-38-6';
import {
  createVida38InfrastructureSurfaceVisual386,
  vida38MoonVisibleInfrastructurePlans386c2,
  vida38SmallMoonColonyOpticalScale386c2,
} from './vida38-infrastructure-render-38-6';
import { buildSystemSceneMoonPresentationV1 } from '../system/system-scene-moon-presentation';
import { createSystemSceneMoonRenderableV1 } from '../system/system-scene-moon-renderable';

function authorizedColony(seed = 0x386c2): Vida38InfrastructurePlan386 {
  return Object.freeze({
    revision: VIDA38_INFRASTRUCTURE_REVISION_386,
    id: 'VIDA.8|confirmed-destination|one-colony',
    provenance: 'VIDA8_COLONIAL_SETTLEMENT' as const,
    bodyStorageKey: '0:1:2:8:MOON:3', seedUint32: seed,
    locationStatus: 'RECONSTRUCTED_NOT_OBSERVED' as const,
    ...vida38InfrastructureAnchor386(seed),
    form: 'COLONIAL_HABITAT' as const, scale: 'OUTPOST' as const,
    tier: 'COLONIAL' as const, lineage: 'HUMANOID' as const,
    habitat: 'SUBSURFACE_VAULT', purpose: 'RESEARCH',
    habitatTechnology: 'SUBSURFACE_VAULT' as const,
  });
}
function presentation(radiusEarth: number) {
  return buildSystemSceneMoonPresentationV1({
    moonIdentity: `Aaras A-9 | ${radiusEarth}`,
    hostPlanetType: 'ROCKY', radiusEarth,
    massEarth: radiusEarth === .007 ? 1.12e-7 : 6.52e-7,
    meanDensityGramsPerCubicCentimeter: 1.65,
    surfaceGravityEarth: .003,
    atmosphereRetentionIndex01: 0, atmosphereRegime: 'NONE',
    waterInventoryIndex01: .72, inferredIceRichnessIndex01: .92,
    subsurfaceOceanPotentialIndex01: .1, surfaceLiquidWaterPotentialIndex01: 0,
    waterRegime: 'SURFACE_ICE', estimatedSurfaceTemperatureKelvin: 51.5,
    geologicalActivityIndex01: 0, tidalHeatingIndex01: 0,
    geologyRegime: 'INERT', overallHabitabilityIndex01: 0,
    isPotentiallyHabitable: false,
    giantHostSpecialization: false, giantCompositionRegime: 'NOT_APPLICABLE',
    isLargeGiantMoon: false, isTidallyActiveGiantMoon: false,
    isOceanBearingGiantMoonCandidate: false,
  });
}
function cleanup(view: ReturnType<typeof createVida38InfrastructureSurfaceVisual386>,
  moon: ReturnType<typeof createSystemSceneMoonRenderableV1>):void {
  view.resources.forEach(resource=>resource.dispose());
  moon.resources.forEach(resource=>resource.dispose());
}
function colonialMeshes(group:THREE.Group):THREE.InstancedMesh[] {
  const meshes:THREE.InstancedMesh[]=[];
  group.traverse(object=>{
    if (object instanceof THREE.InstancedMesh && object.userData['colonialVisual386c']) meshes.push(object);
  });
  return meshes;
}

describe('38.6c2 — colonias verificadas sobre lunas MINOR_IRREGULAR',()=>{
  it('elimina la exclusión de colonias en Aaras A-9 IV/VI, sin habilitar civilizaciones nativas',()=>{
    const colony=authorizedColony();
    const native={...colony,id:'native',provenance:'VIDA7_NATIVE_SETTLEMENT' as const,
      tier:'ADVANCED' as const,form:'MODULAR_CITY' as const,scale:'MEDIUM' as const,
      habitatTechnology:null};
    expect(vida38MoonVisibleInfrastructurePlans386c2([native,colony],true)).toEqual([colony]);
    expect(vida38MoonVisibleInfrastructurePlans386c2([native,colony],false)).toHaveLength(2);
    expect(vida38MoonVisibleInfrastructurePlans386c2([],true)).toHaveLength(0);
    expect(vida38MoonVisibleInfrastructurePlans386c2(undefined,true)).toHaveLength(0);
    expect(vida38MoonVisibleInfrastructurePlans386c2([native],true)).toHaveLength(0);
  });

  it('una luna de 0,007 R_E recibe mayor escala óptica relativa que otra de 0,013 R_E, con cota',()=>{
    const small=vida38SmallMoonColonyOpticalScale386c2(.007);
    const medium=vida38SmallMoonColonyOpticalScale386c2(.013);
    expect(small).toBeGreaterThan(medium);
    expect(medium).toBeGreaterThan(1);
    expect(vida38SmallMoonColonyOpticalScale386c2(.109)).toBe(1);
    expect(vida38SmallMoonColonyOpticalScale386c2(1e-7)).toBeLessThanOrEqual(3.5);
    expect(vida38SmallMoonColonyOpticalScale386c2(NaN)).toBe(1);
  });

  for(const radiusEarth of [.007,.013]) {
    it(`muestra un puesto colonial en el relieve real de la luna ${radiusEarth} R_E, con LOD lejano y detalle`,()=>{
      const body=presentation(radiusEarth);
      expect(body.shapeClass).toBe('MINOR_IRREGULAR');
      const moon=createSystemSceneMoonRenderableV1(body);
      const colony=authorizedColony(120000 + Math.round(radiusEarth*1e6));
      const frozen=JSON.stringify(colony);
      const radius=body.presentationRadiusScene;
      const view=createVida38InfrastructureSurfaceVisual386([colony],radius,null,{
        geometry:moon.surfaceMesh.geometry,geometryScale:1,radiusEarth,
      });
      expect(view.siteCount).toBe(1);
      const [medium,high,far]=view.group.children as THREE.Group[];
      expect(far).toBeDefined();
      const site=medium.children[0] as THREE.Group;
      expect(site).toBeDefined();
      // Contact radius comes from the same irregular geometry, not an invented sphere.
      const direction=new THREE.Vector3(Math.cos(colony.latitudeRadians)*Math.cos(colony.longitudeRadians),
        Math.sin(colony.latitudeRadians),Math.cos(colony.latitudeRadians)*Math.sin(colony.longitudeRadians));
      const ray=new THREE.Raycaster(direction.clone().multiplyScalar(radius*2.5),direction.clone().negate(),0,radius*2.5);
      moon.surfaceMesh.updateMatrixWorld(true);
      const hits=ray.intersectObject(moon.surfaceMesh,false);
      expect(hits.length).toBeGreaterThan(0);
      expect(site.position.length()).toBeCloseTo(hits[0]!.point.length()+radius*.0007,5);
      expect(site.position.clone().normalize().distanceTo(direction)).toBeLessThan(1e-6);
      view.updateProjectedDiameterPixels(60);
      expect(far.visible).toBe(true);
      expect(colonialMeshes(far).length).toBeGreaterThan(0);
      view.updateProjectedDiameterPixels(300);
      expect(medium.visible).toBe(true);
      expect(colonialMeshes(medium).length).toBeGreaterThan(0);
      view.updateProjectedDiameterPixels(700);
      expect(high.visible).toBe(true);
      expect(colonialMeshes(high).length).toBeGreaterThan(0);
      expect(JSON.stringify(colony)).toBe(frozen);
      cleanup(view,moon);
    });
  }

  it('mantiene el anclaje al ampliar la luna solo para la ficha (escala visual de la malla)',()=>{
    const body=presentation(.007);
    const moon=createSystemSceneMoonRenderableV1(body);
    const scale=17; // ficha 3D: radio normalizado mucho mayor que SystemScene
    const radius=body.presentationRadiusScene*scale;
    const plan=authorizedColony(87111);
    const view=createVida38InfrastructureSurfaceVisual386([plan],radius,null,{
      geometry:moon.surfaceMesh.geometry,geometryScale:scale,radiusEarth:.007,
    });
    const site=(view.group.children[0] as THREE.Group).children[0] as THREE.Group;
    const radial=new THREE.Vector3(Math.cos(plan.latitudeRadians)*Math.cos(plan.longitudeRadians),
      Math.sin(plan.latitudeRadians),Math.cos(plan.latitudeRadians)*Math.sin(plan.longitudeRadians));
    moon.surfaceMesh.scale.setScalar(scale);
    moon.surfaceMesh.updateMatrixWorld(true);
    const hits=new THREE.Raycaster(radial.clone().multiplyScalar(radius*2.5),
      radial.clone().negate(),0,radius*2.5).intersectObject(moon.surfaceMesh);
    expect(hits.length).toBeGreaterThan(0);
    expect(site.position.length()).toBeCloseTo(hits[0]!.point.length()+radius*.0007,5);
    view.updateProjectedDiameterPixels(100);
    expect(view.group.children[2]!.visible).toBe(true);
    cleanup(view,moon);
  });

  it('cambia solo la lectura óptica: serialización estable, sin emisiones ni infraestructura sin colonia',()=>{
    const body=presentation(.007);
    const moon=createSystemSceneMoonRenderableV1(body);
    const radius=body.presentationRadiusScene;
    const opts={geometry:moon.surfaceMesh.geometry,geometryScale:1,radiusEarth:.007};
    const source=authorizedColony(99913);
    const a=createVida38InfrastructureSurfaceVisual386([source],radius,null,opts);
    const b=createVida38InfrastructureSurfaceVisual386(
      [JSON.parse(JSON.stringify(source)) as Vida38InfrastructurePlan386],radius,null,opts);
    const aMedium=a.group.children[0] as THREE.Group;
    const bMedium=b.group.children[0] as THREE.Group;
    expect(aMedium.children[0]!.position.toArray()).toEqual(bMedium.children[0]!.position.toArray());
    expect(colonialMeshes(aMedium).map(m=>[m.name,m.count]))
      .toEqual(colonialMeshes(bMedium).map(m=>[m.name,m.count]));
    expect(a.group.getObjectsByProperty('isLight',true)).toHaveLength(0);
    const empty=createVida38InfrastructureSurfaceVisual386([], radius, null, opts);
    expect(empty.siteCount).toBe(0);
    expect(empty.group.getObjectsByProperty('isInstancedMesh',true)).toHaveLength(0);
    cleanup(a,moon);
    b.resources.forEach(x=>x.dispose());empty.resources.forEach(x=>x.dispose());
  });
});
