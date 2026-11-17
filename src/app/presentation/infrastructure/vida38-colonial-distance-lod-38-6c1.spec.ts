import * as THREE from 'three';
import {
  VIDA38_INFRASTRUCTURE_REVISION_386,
  vida38InfrastructureAnchor386,
  type Vida38InfrastructurePlan386,
} from './vida38-infrastructure-plan-38-6';
import {
  createVida38InfrastructureSurfaceVisual386,
  vida38ColonialDistantScale386c1,
} from './vida38-infrastructure-render-38-6';

function colony(seed = 0x38c6c1): Vida38InfrastructurePlan386 {
  return Object.freeze({
    revision: VIDA38_INFRASTRUCTURE_REVISION_386,
    id: 'VIDA8:confirmed-outpost',
    provenance: 'VIDA8_COLONIAL_SETTLEMENT' as const,
    bodyStorageKey: '0:1:2:10:MOON:0',
    seedUint32: seed,
    locationStatus: 'RECONSTRUCTED_NOT_OBSERVED' as const,
    ...vida38InfrastructureAnchor386(seed),
    form: 'COLONIAL_HABITAT' as const,
    scale: 'OUTPOST' as const,
    tier: 'COLONIAL' as const,
    lineage: 'HUMANOID' as const,
    habitat: 'SUBSURFACE_VAULT' as const,
    purpose: 'RESEARCH',
    habitatTechnology: 'SUBSURFACE_VAULT' as const,
  });
}
function native(): Vida38InfrastructurePlan386 {
  return {...colony(), id:'native-city', provenance:'VIDA7_NATIVE_SETTLEMENT',
    tier:'ADVANCED', form:'MODULAR_CITY', scale:'MEDIUM', habitatTechnology:null};
}
function dispose(view:ReturnType<typeof createVida38InfrastructureSurfaceVisual386>):void {
  view.resources.forEach(resource=>resource.dispose());
}
function colonialMeshes(group:THREE.Group):THREE.InstancedMesh[] {
  const result: THREE.InstancedMesh[] = [];
  group.traverse(object=>{
    if(object instanceof THREE.InstancedMesh && object.userData['colonialVisual386c']) result.push(object);
  });
  return result;
}

describe('38.6c1 — colonia siempre visible en su hemisferio sin corte por LOD',()=>{
  it('añade únicamente para colonias autorizadas el LOD distante, conservando medium/high originales',()=>{
    const p=colony();
    const view=createVida38InfrastructureSurfaceVisual386([p],1);
    expect(view.siteCount).toBe(1);
    expect(view.group.children).toHaveLength(3);
    const [medium,high,far]=view.group.children as THREE.Group[];
    expect(medium.visible).toBe(false);
    expect(high.visible).toBe(false);
    expect(far.visible).toBe(false); // no camera projection calculated yet
    view.updateProjectedDiameterPixels(75);
    expect(far.visible).toBe(true);
    expect(medium.visible).toBe(false);
    expect(high.visible).toBe(false);
    expect(colonialMeshes(far).length).toBeGreaterThan(0);
    expect(far.children[0]?.position.toArray()).toEqual(medium.children[0]?.position.toArray());
    expect(far.children[0]?.quaternion.toArray()).toEqual(medium.children[0]?.quaternion.toArray());
    expect(p.latitudeRadians).toBe(vida38InfrastructureAnchor386(p.seedUint32).latitudeRadians);
    dispose(view);
  });

  it('cambia de LOD de forma continua a 200px y conserva el detalle alto a partir de 380px',()=>{
    const view=createVida38InfrastructureSurfaceVisual386([colony()],1);
    const [medium,high,far]=view.group.children as THREE.Group[];
    view.updateProjectedDiameterPixels(199.99);
    expect(far.visible).toBe(true);
    expect(far.children[0]?.scale.x).toBeCloseTo(1,3);
    const distantMeshes=colonialMeshes(far);
    const mediumMeshes=colonialMeshes(medium);
    expect(distantMeshes.map(x=>x.count)).toEqual(mediumMeshes.map(x=>x.count));
    expect(distantMeshes.map(x=>x.name)).toEqual(mediumMeshes.map(x=>x.name));
    view.updateProjectedDiameterPixels(200);
    expect(far.visible).toBe(false);
    expect(medium.visible).toBe(true);
    view.updateProjectedDiameterPixels(379.99);
    expect(medium.visible).toBe(true);
    view.updateProjectedDiameterPixels(380);
    expect(medium.visible).toBe(false);
    expect(high.visible).toBe(true);
    expect(colonialMeshes(high).length).toBeGreaterThan(0);
    dispose(view);
  });

  it('aumenta su tamaño aparente al acercar el zoom incluso dentro del LOD lejano',()=>{
    const diameters=[20,45,90,150,199];
    const apparent=diameters.map(d=>d*vida38ColonialDistantScale386c1(d));
    for(let i=1;i<apparent.length;i++)expect(apparent[i]).toBeGreaterThan(apparent[i-1]!);
    expect(vida38ColonialDistantScale386c1(200)).toBe(1);
    expect(vida38ColonialDistantScale386c1(5)).toBeLessThanOrEqual(3.5);
    const view=createVida38InfrastructureSurfaceVisual386([colony()],1);
    const far=view.group.children[2] as THREE.Group;
    view.updateProjectedDiameterPixels(45);
    const smaller=far.children[0]!.scale.x;
    view.updateProjectedDiameterPixels(150);
    expect(far.visible).toBe(true);
    expect(far.children[0]!.scale.x).toBeLessThan(smaller);
    // World-space magnification decreases at near zoom, projected size grows.
    expect(45*smaller).toBeLessThan(150*far.children[0]!.scale.x);
    dispose(view);
  });

  it('no añade edificios distantes en mundos nativos, estériles ni colonias inconsistentes',()=>{
    for(const plans of [[],[native()], [{...colony(),locationStatus:'OBSERVED' as never}],
      [{...colony(),habitatTechnology:null}]]){
      const view=createVida38InfrastructureSurfaceVisual386(plans,1);
      expect(view.group.children).toHaveLength(2);
      view.updateProjectedDiameterPixels(50);
      expect(view.group.children.every(child=>!child.visible)).toBe(true);
      dispose(view);
    }
  });

  it('es determinista tras serialización, no emite luz, y libera los buffers de InstancedMesh',()=>{
    const p=colony(19761);
    const saved=JSON.stringify(p);
    const a=createVida38InfrastructureSurfaceVisual386([p],1);
    const b=createVida38InfrastructureSurfaceVisual386([JSON.parse(saved) as Vida38InfrastructurePlan386],1);
    a.updateProjectedDiameterPixels(65);
    b.updateProjectedDiameterPixels(65);
    const af=a.group.children[2] as THREE.Group;
    const bf=b.group.children[2] as THREE.Group;
    expect(af.children[0]?.position.toArray()).toEqual(bf.children[0]?.position.toArray());
    expect(af.children[0]?.quaternion.toArray()).toEqual(bf.children[0]?.quaternion.toArray());
    expect(af.children[0]?.scale.toArray()).toEqual(bf.children[0]?.scale.toArray());
    expect(colonialMeshes(af).map(m=>m.name+'|'+m.count))
      .toEqual(colonialMeshes(bf).map(m=>m.name+'|'+m.count));
    expect(a.group.getObjectsByProperty('isLight',true)).toHaveLength(0);
    for(const mesh of colonialMeshes(af)){
      const mat=mesh.material as THREE.MeshStandardMaterial;
      expect(mat.emissive.getHex()).toBe(0);
      const matrix=new THREE.Matrix4();
      mesh.getMatrixAt(0,matrix);
      expect(matrix.elements.every(Number.isFinite)).toBe(true);
    }
    expect(JSON.stringify(p)).toBe(saved);
    dispose(a);dispose(b);
  });
});
