import * as THREE from 'three';
import {vi} from 'vitest';
import { VIDA38_INFRASTRUCTURE_REVISION_386,
  vida38InfrastructureAnchor386,type Vida38InfrastructurePlan386,
  vida38InfrastructurePlansFromConfirmed386 } from './vida38-infrastructure-plan-38-6';
import { vida38ColonialComplexLayout386c } from './vida38-colonial-complex-38-6c';
import { createVida38InfrastructureSurfaceVisual386 } from './vida38-infrastructure-render-38-6';

const technologyTypes=['SUBSURFACE_VAULT','SEALED_SURFACE','ENVIRONMENTAL_SHIELD'] as const;
function colony(technology:typeof technologyTypes[number]='SUBSURFACE_VAULT',
  scale:'OUTPOST'|'SETTLEMENT'|'CITY'|'NETWORK'='OUTPOST',seed=0x38c386):Vida38InfrastructurePlan386 {
  return Object.freeze({revision:VIDA38_INFRASTRUCTURE_REVISION_386,
    id:'confirmed-colony-38-6c',provenance:'VIDA8_COLONIAL_SETTLEMENT' as const,
    bodyStorageKey:'0:1:2:10:MOON:0',seedUint32:seed,
    locationStatus:'RECONSTRUCTED_NOT_OBSERVED' as const,
    ...vida38InfrastructureAnchor386(seed),form:'COLONIAL_HABITAT' as const,
    scale,tier:'COLONIAL' as const,lineage:'HUMANOID' as const,
    habitat:technology,purpose:'RESEARCH',habitatTechnology:technology});
}
function native():Vida38InfrastructurePlan386 {
  return {...colony(),provenance:'VIDA7_NATIVE_SETTLEMENT',tier:'ADVANCED',
    form:'MODULAR_CITY',habitatTechnology:null,scale:'MEDIUM'};
}
function colonialInstances(group:THREE.Group):THREE.InstancedMesh[] {
  const meshes:THREE.InstancedMesh[]=[];
  group.traverse(o=>{if(o instanceof THREE.InstancedMesh && o.userData['colonialVisual386c'])meshes.push(o);});
  return meshes;
}
function colonialMatrices(group:THREE.Group):readonly number[][] {
  return colonialInstances(group).map(mesh=>{
    const result:number[]=[];
    const matrix=new THREE.Matrix4();
    for(let i=0;i<mesh.count;i++){
      mesh.getMatrixAt(i,matrix);
      result.push(...matrix.elements);
    }
    return result;
  });
}
function dispose(visual:ReturnType<typeof createVida38InfrastructureSurfaceVisual386>):void {
  visual.resources.forEach(resource=>resource.dispose());
}

describe('38.6c — Complejos coloniales visibles, sin alterar VIDA.8 ni CT-0',()=>{
  it('convierte una sola colonia subsuperficial OUTPOST en tres accesos, módulo, auxiliares, mástil y conectores',()=>{
    const source=colony();
    const before=JSON.stringify(source);
    const layout=vida38ColonialComplexLayout386c(source)!;
    expect(layout.siteId).toBe(source.id);
    expect(layout.seedUint32).toBe(source.seedUint32);
    expect(layout.high.filter(part=>part.role==='ACCESS' && part.shape==='CYLINDER')).toHaveLength(3);
    expect(layout.high.filter(part=>part.role==='MAIN_MODULE' && part.shape==='BOX').length).toBeGreaterThanOrEqual(1);
    expect(layout.high.filter(part=>part.role==='AUXILIARY' && part.shape==='BOX').length).toBeGreaterThanOrEqual(2);
    expect(layout.high.some(part=>part.role==='ANTENNA' && part.shape==='MAST')).toBe(true);
    expect(layout.high.some(part=>part.role==='CONNECTION')).toBe(true);
    expect(layout.medium.length).toBeGreaterThan(2);
    expect(JSON.stringify(source)).toBe(before); // No mutation of location, tier, colony or population.
  });
  it('mantiene 2–5 accesos, más detalle según escala y una huella acotada',()=>{
    const outpost=vida38ColonialComplexLayout386c(colony())!;
    const settlement=vida38ColonialComplexLayout386c(colony('SUBSURFACE_VAULT','SETTLEMENT'))!;
    const city=vida38ColonialComplexLayout386c(colony('SUBSURFACE_VAULT','CITY'))!;
    for(const [layout,accesses] of [[outpost,3],[settlement,4],[city,5]] as const){
      expect(layout.high.filter(p=>p.role==='ACCESS'&&p.shape==='CYLINDER')).toHaveLength(accesses);
      expect(layout.high.length).toBeLessThan(90);
      expect(layout.high.every(p=>[p.x,p.z,p.width,p.height,p.depth,p.yaw,p.lift].every(Number.isFinite))).toBe(true);
      expect(layout.high.every(p=>Math.hypot(p.x,p.z)<4.5)).toBe(true);
    }
    expect(outpost.high.length).toBeLessThan(settlement.high.length);
    expect(settlement.high.length).toBeLessThan(city.high.length);
    expect(outpost.visualScaleMultiplier).toBeLessThan(city.visualScaleMultiplier);
  });
  it('colonias selladas y con escudo: cúpulas, módulos y accesos, sin convertirse en ciudades inventadas',()=>{
    for(const tech of ['SEALED_SURFACE','ENVIRONMENTAL_SHIELD'] as const){
      const layout=vida38ColonialComplexLayout386c(colony(tech))!;
      expect(layout.high.some(p=>p.role==='PRESSURIZED_DOME')).toBe(true);
      expect(layout.high.some(p=>p.role==='MAIN_MODULE')).toBe(true);
      expect(layout.high.some(p=>p.role==='ACCESS')).toBe(true);
      expect(layout.high.some(p=>p.role==='AUXILIARY')).toBe(true);
      expect(layout.high.some(p=>p.role==='ANTENNA')).toBe(true);
    }
  });
  it('no genera complejos para ausencia de colonia, cuerpos nativos ni planes inválidos',()=>{
    expect(vida38ColonialComplexLayout386c(native())).toBeNull();
    expect(vida38ColonialComplexLayout386c({...colony(),habitatTechnology:null})).toBeNull();
    expect(vida38ColonialComplexLayout386c({...colony(),locationStatus:'OBSERVED' as never})).toBeNull();
    expect(vida38ColonialComplexLayout386c({...colony(),tier:'PRIMITIVE'})).toBeNull();
    const empty=createVida38InfrastructureSurfaceVisual386([],1);
    expect(empty.siteCount).toBe(0);
    expect(colonialInstances(empty.group)).toHaveLength(0);
    dispose(empty);
    expect(vida38InfrastructurePlansFromConfirmed386(null)).toHaveLength(0);
  });
  it('mantiene determinismo y no altera el centro de anclaje tras serialización',()=>{
    const p=colony('SUBSURFACE_VAULT','OUTPOST',972341);
    const cloned=JSON.parse(JSON.stringify(p)) as Vida38InfrastructurePlan386;
    expect(vida38ColonialComplexLayout386c(cloned)).toEqual(vida38ColonialComplexLayout386c(p));
    const a=createVida38InfrastructureSurfaceVisual386([p],1);
    const b=createVida38InfrastructureSurfaceVisual386([cloned],1);
    const [am,ah]=a.group.children as THREE.Group[];
    const [bm,bh]=b.group.children as THREE.Group[];
    expect(am.children[0]?.position.toArray()).toEqual(bm.children[0]?.position.toArray());
    expect(ah.children[0]?.position.toArray()).toEqual(bh.children[0]?.position.toArray());
    expect(ah.children[0]?.position.length()).toBeCloseTo(1.0007,6);
    expect(colonialMatrices(ah)).toEqual(colonialMatrices(bh));
    dispose(a);dispose(b);
  });
  it('respeta LOD, crea mallas instanciadas con matrices finitas y libera buffers y materiales',()=>{
    const view=createVida38InfrastructureSurfaceVisual386([colony()],1);
    const [medium,high]=view.group.children as THREE.Group[];
    expect(medium.visible).toBe(false);expect(high.visible).toBe(false);
    view.updateProjectedDiameterPixels(275);
    expect(medium.visible).toBe(true);expect(high.visible).toBe(false);
    expect(colonialInstances(medium).length).toBeGreaterThan(0);
    view.updateProjectedDiameterPixels(680);
    expect(medium.visible).toBe(false);expect(high.visible).toBe(true);
    const meshes=colonialInstances(high);
    expect(meshes.length).toBeGreaterThan(2);
    expect(meshes.reduce((sum,m)=>sum+m.count,0)).toBeGreaterThan(16);
    expect(colonialMatrices(high).every(row=>row.every(Number.isFinite))).toBe(true);
    expect(meshes.every(m=>!(m.material as THREE.MeshStandardMaterial).emissiveIntensity ||
      (m.material as THREE.MeshStandardMaterial).emissive.getHex()===0)).toBe(true);
    // One dispose per resource; all buffers are included, no per-frame allocations.
    const disposeSpy=vi.spyOn(meshes[0]!,'dispose');
    dispose(view);expect(disposeSpy).toHaveBeenCalledTimes(1);
  });
  it('los apoyos quedan sobre la esfera local y no flotan sobre la luna',()=>{
    const view=createVida38InfrastructureSurfaceVisual386([colony()],1);
    view.group.updateMatrixWorld(true);
    const high=(view.group.children[1] as THREE.Group).children[0]!;
    high.updateWorldMatrix(true,true);
    const meshes=colonialInstances(high as THREE.Group);
    let grounded=0; let elements=0;
    for(const mesh of meshes){
      mesh.geometry.computeBoundingBox();
      const minY=mesh.geometry.boundingBox?.min.y??-.5;
      const instance=new THREE.Matrix4();
      for(let i=0;i<mesh.count;i++){
        mesh.getMatrixAt(i,instance);
        const contact=new THREE.Vector3(0,minY,0).applyMatrix4(instance).applyMatrix4(mesh.matrixWorld);
        expect(contact.length()).toBeGreaterThan(.998);
        expect(contact.length()).toBeLessThan(1.085);
        if(contact.length()<1.006)grounded++;
        elements++;
      }
    }
    expect(elements).toBeGreaterThan(16);
    expect(grounded).toBeGreaterThan(9);
    dispose(view);
  });
  it('no altera geometría ni luces de asentamientos nativos y no crea luz nocturna adicional',()=>{
    const nativePlan=native();
    const pre=createVida38InfrastructureSurfaceVisual386([nativePlan],1);
    const mixed=createVida38InfrastructureSurfaceVisual386([nativePlan,colony()],1);
    const preHigh=(pre.group.children[1] as THREE.Group).children[0]!;
    const mixedHigh=(mixed.group.children[1] as THREE.Group).children[0]!;
    expect(preHigh.position.toArray()).toEqual(mixedHigh.position.toArray());
    expect(preHigh.children.length).toBe(mixedHigh.children.length);
    expect(colonialInstances(pre.group)).toHaveLength(0);
    expect(colonialInstances(mixed.group).length).toBeGreaterThan(0);
    // No light objects or emissive materials anywhere in the new colony subtree.
    let lightCount=0;mixed.group.traverse(o=>{if(o instanceof THREE.Light)lightCount++;});
    expect(lightCount).toBe(0);
    dispose(pre);dispose(mixed);
  });
});
