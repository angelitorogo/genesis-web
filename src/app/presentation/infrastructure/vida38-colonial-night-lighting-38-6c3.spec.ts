import * as THREE from 'three';
import {
  VIDA38_INFRASTRUCTURE_REVISION_386,
  vida38InfrastructureAnchor386,
  type Vida38InfrastructurePlan386,
} from './vida38-infrastructure-plan-38-6';
import { createVida38InfrastructureSurfaceVisual386 } from './vida38-infrastructure-render-38-6';
import {
  vida38ColonialDirectStellarExposure386c3,
  vida38ColonialLampOpacity386c3,
} from './vida38-colonial-night-lighting-38-6c3';

function colony(seed=0x386c3): Vida38InfrastructurePlan386 {
  return Object.freeze({
    revision:VIDA38_INFRASTRUCTURE_REVISION_386,
    id:'real-VIDA8-colony-in-confirmed-moon',
    provenance:'VIDA8_COLONIAL_SETTLEMENT' as const,
    bodyStorageKey:'0:1:2:8:MOON:3', seedUint32:seed,
    locationStatus:'RECONSTRUCTED_NOT_OBSERVED' as const,
    ...vida38InfrastructureAnchor386(seed),
    form:'COLONIAL_HABITAT' as const,scale:'OUTPOST' as const,
    tier:'COLONIAL' as const,lineage:'HUMANOID' as const,
    habitat:'SUBSURFACE_VAULT',purpose:'RESEARCH',
    habitatTechnology:'SUBSURFACE_VAULT' as const,
  });
}
function lamps(group:THREE.Group):THREE.InstancedMesh[] {
  const found:THREE.InstancedMesh[]=[];
  group.traverse(object => {
    if(object instanceof THREE.InstancedMesh && object.userData['colonialNightIndicators386c3']===true) found.push(object);
  });
  return found;
}
function cleanup(visual:ReturnType<typeof createVida38InfrastructureSurfaceVisual386>) {
  visual.resources.forEach(r=>r.dispose());
}

describe('38.6c3 — luces artificiales coloniales: oscuridad sin reflexiones falsas',()=>{
  it('noche total sin estrellas: lámparas brillantes, no una fuente que ilumine el suelo',()=>{
    const normal=new THREE.Vector3(0,1,0);
    const exposure=vida38ColonialDirectStellarExposure386c3(normal,
      [new THREE.Vector3(0,-1,0)],new THREE.Vector3(1,0,0));
    expect(exposure).toBe(0);
    expect(vida38ColonialLampOpacity386c3(exposure)).toBe(1);
    expect(vida38ColonialLampOpacity386c3(NaN)).toBe(1);
  });
  it('cara diurna: el mismo cuerpo recibe luz natural y las lámparas son discretas',()=>{
    const exposure=vida38ColonialDirectStellarExposure386c3(new THREE.Vector3(0,1,0),
      [new THREE.Vector3(0,1,0)],new THREE.Vector3(1,0,0));
    expect(exposure).toBe(1);
    expect(vida38ColonialLampOpacity386c3(exposure)).toBeCloseTo(.18);
  });
  it('binaria/triple: la segunda estrella ilumina parcialmente la región oscura para la principal',()=>{
    const n=new THREE.Vector3(0,1,0);
    const sources=[new THREE.Vector3(0,-1,0),new THREE.Vector3(0,1,0),new THREE.Vector3(-1,0,0)];
    const partial=vida38ColonialDirectStellarExposure386c3(n,sources,new THREE.Vector3(.7,.3,0));
    expect(partial).toBeCloseTo(.3,6);
    expect(vida38ColonialLampOpacity386c3(partial)).toBeGreaterThan(.18);
    expect(vida38ColonialLampOpacity386c3(partial)).toBeLessThan(1);
    expect(vida38ColonialDirectStellarExposure386c3(n,sources,new THREE.Vector3(0,1,0))).toBe(1);
  });
  it('sin evidencia VIDA.8: no hay nuevos focos ni infraestructuras emisivas',()=>{
    const base=colony();
    const native={...base,id:'native',provenance:'VIDA7_NATIVE_SETTLEMENT' as const,
      tier:'ADVANCED' as const,form:'MODULAR_CITY' as const,scale:'MEDIUM' as const,
      habitatTechnology:null};
    for(const plans of [[],[native]]) {
      const visual=createVida38InfrastructureSurfaceVisual386(plans,1,null,null,true);
      expect(lamps(visual.group)).toHaveLength(0);
      expect(visual.group.getObjectByProperty('type','PointLight')).toBeUndefined();
      cleanup(visual);
    }
  });
  it('opt-in exclusivo de SystemScene: no modifica por defecto la ficha aprobada',()=>{
    const visual=createVida38InfrastructureSurfaceVisual386([colony()],1);
    expect(lamps(visual.group)).toHaveLength(0);
    cleanup(visual);
  });
  it('Aaras A-9 IV y VI: puntos luminosos anclados al relieve irregular sin atravesar la luna',()=>{
    for(const radiusEarth of [.007,.013]) {
      const terrain=new THREE.SphereGeometry(1,24,18);
      const visual=createVida38InfrastructureSurfaceVisual386([colony()],1,null,{
        geometry:terrain,geometryScale:1,radiusEarth,
      },true);
      expect(lamps(visual.group)).toHaveLength(3);
      for(const light of lamps(visual.group)) {
        for(let i=0;i<light.count;i++) {
          const matrix=new THREE.Matrix4();
          light.getMatrixAt(i,matrix);
          const position=new THREE.Vector3().setFromMatrixPosition(matrix);
          expect(position.toArray().every(Number.isFinite)).toBe(true);
          expect(position.length()).toBeGreaterThan(0);
        }
      }
      cleanup(visual);
      terrain.dispose();
    }
  });
  it('la colonia confirmada conserva centro y CT-0; lámparas en cada LOD sin añadir objetos científicos',()=>{
    const plan=colony();
    const serialized=JSON.stringify(plan);
    const visual=createVida38InfrastructureSurfaceVisual386([plan],1,null,null,true);
    expect(visual.siteCount).toBe(1);
    const allLamps=lamps(visual.group);
    expect(allLamps).toHaveLength(3);
    expect(allLamps.map(l=>l.count).sort((a,b)=>a-b)).toEqual([1,2,5]);
    for(const mesh of allLamps) {
      expect(mesh.material).toBeInstanceOf(THREE.MeshBasicMaterial);
      const mat=mesh.material as THREE.MeshBasicMaterial;
      expect(mat.depthTest).toBe(true);
      expect(mat.depthWrite).toBe(false);
      expect(mat.toneMapped).toBe(false);
    }
    expect(JSON.stringify(plan)).toBe(serialized);
    expect(visual.group.children[0]).toBeInstanceOf(THREE.Group);
    expect(visual.group.children[1]).toBeInstanceOf(THREE.Group);
    for(const diameter of [80,250,600]){
      visual.updateProjectedDiameterPixels(diameter);
      const active=visual.group.children.filter(g=>g.visible);
      expect(active).toHaveLength(1);
      expect(lamps(active[0] as THREE.Group)).toHaveLength(1);
    }
    visual.group.updateMatrixWorld(true);
    const site=visual.group.children[1]!.children[0]!;
    const normal=new THREE.Vector3(0,1,0).applyQuaternion(site.getWorldQuaternion(new THREE.Quaternion()));
    visual.updateColonialNightLighting386c3([normal.clone().negate()],new THREE.Vector3(1,0,0),new THREE.Matrix4());
    expect((allLamps[0]!.material as THREE.MeshBasicMaterial).opacity).toBeCloseTo(1);
    visual.updateColonialNightLighting386c3([normal],new THREE.Vector3(1,0,0),new THREE.Matrix4());
    expect((allLamps[0]!.material as THREE.MeshBasicMaterial).opacity).toBeCloseTo(.18);
    cleanup(visual);
  });
});
