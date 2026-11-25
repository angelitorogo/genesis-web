import {describe,expect,it} from 'vitest';
import * as THREE from 'three';
import {attachColvis3ColonyGroundContactT7o,colvis3GroundingCorrectionT7o,
  colvis3SupportCorrectionT7p,colvis3ContactClearanceT7q} from './colvis3-colony-ground-contact-t7o';

function fixture(groundRadius=1,siteHeight=1.08){
  const scene=new THREE.Scene();
  const sphere=new THREE.Mesh(new THREE.SphereGeometry(1,48,32),new THREE.MeshStandardMaterial());
  sphere.scale.setScalar(groundRadius);scene.add(sphere);
  const site=new THREE.Group();site.position.y=siteHeight;scene.add(site);
  const boxes=new THREE.InstancedMesh(new THREE.BoxGeometry(.06,.2,.06),new THREE.MeshStandardMaterial(),2);
  // First module is on the soil; second is intentionally raised. The old
  // correction moved only the first and left the second floating far above it.
  const lifts=[0,.15];
  boxes.userData['colvis2GroundEligibleT7o']=[true,false];
  boxes.userData['colvis2SupportLiftSceneT7p']=lifts;
  boxes.setMatrixAt(0,new THREE.Matrix4().makeTranslation(0,.1,0));
  boxes.setMatrixAt(1,new THREE.Matrix4().makeTranslation(.18,.1+lifts[1]!,0));
  boxes.instanceMatrix.needsUpdate=true;
  site.add(boxes);scene.updateMatrixWorld(true);
  return {scene,sphere,site,boxes,lifts};
}
function lowerWorldY(instance:THREE.InstancedMesh,index:number):number{
  instance.updateWorldMatrix(true,false);
  instance.geometry.computeBoundingBox();
  const low=instance.geometry.boundingBox!.min.y;
  const matrix=new THREE.Matrix4();instance.getMatrixAt(index,matrix);
  const point=new THREE.Vector3(0,low,0).applyMatrix4(matrix);
  instance.localToWorld(point);return point.y;
}
function clean({sphere,site,boxes}:ReturnType<typeof fixture>):void{
  boxes.geometry.dispose();(boxes.material as THREE.Material).dispose();
  sphere.geometry.dispose();(sphere.material as THREE.Material).dispose();
  site.clear();
}

describe('GENESIS 38.bis-T7p · contacto íntegro y coherente de colonias',()=>{
  it('T7q evita contacto coplanar con margen estrictamente acotado',()=>{
    for(const footprint of [.00001,.0002,.04,.2]){
      for(const bodyRadius of [.32,1,5]){
        const gap=colvis3ContactClearanceT7q(footprint,bodyRadius)!;
        expect(gap).toBeGreaterThanOrEqual(footprint*.0025-1e-12);
        expect(gap).toBeLessThanOrEqual(footprint*.0100001);
        expect(gap).toBeGreaterThan(0);
      }
    }
    expect(colvis3ContactClearanceT7q(0,1)).toBeNull();
    expect(colvis3ContactClearanceT7q(.01,Infinity)).toBeNull();
  });
  it('conserva los límites conservadores T7o y el límite ampliado validado T7p',()=>{
    expect(colvis3GroundingCorrectionT7o(1.04,1,.2)).toBeCloseTo(-.04);
    expect(colvis3GroundingCorrectionT7o(1.8,1,.2)).toBeNull();
    expect(colvis3SupportCorrectionT7p(1.025,1,.1,1)).toBeCloseTo(-.025);
    expect(colvis3SupportCorrectionT7p(1.50,1,.1,1)).toBeNull();
    expect(colvis3SupportCorrectionT7p(NaN,1,.1,1)).toBeNull();
  });
  it('fija el pivote y corrige todas las piezas preservando los lifts previstos',()=>{
    const f=fixture();const beforeSite=f.site.position.clone();
    const before0=new THREE.Matrix4(),before1=new THREE.Matrix4();
    f.boxes.getMatrixAt(0,before0);f.boxes.getMatrixAt(1,before1);
    const binding=attachColvis3ColonyGroundContactT7o(f.sphere,f.site,.2);
    expect(binding.tested).toBe(2);
    expect(f.site.position.y).toBeCloseTo(1,2);
    // The support is intentionally a tiny amount ABOVE the surface, never
    // co-planar with it; high structures preserve their own lift.
    const gap=colvis3ContactClearanceT7q(.2,1)!;
    expect(lowerWorldY(f.boxes,0)).toBeCloseTo(1+gap,4);
    // Ground contact is resolved against the actual tessellated mesh. Its
    // triangular chord is slightly lower than the ideal analytic sphere.
    const ray=new THREE.Raycaster(new THREE.Vector3(.18,2,0),new THREE.Vector3(0,-1,0));
    const surfaceHit=ray.intersectObject(f.sphere,false)[0];
    expect(surfaceHit).toBeDefined();
    expect(lowerWorldY(f.boxes,1)).toBeCloseTo(surfaceHit!.point.y+.15+gap,4);
    binding.dispose();binding.dispose();
    expect(f.site.position.equals(beforeSite)).toBe(true);
    const after0=new THREE.Matrix4(),after1=new THREE.Matrix4();
    f.boxes.getMatrixAt(0,after0);f.boxes.getMatrixAt(1,after1);
    expect(after0.equals(before0)).toBe(true);
    expect(after1.equals(before1)).toBe(true);
    clean(f);
  });
  it('funciona en una luna a escala distinta sin desnivel entre módulos',()=>{
    const f=fixture(.78,.94);
    const binding=attachColvis3ColonyGroundContactT7o(f.sphere,f.site,.2);
    expect(binding.tested).toBe(2);
    expect(lowerWorldY(f.boxes,0)).toBeCloseTo(.78,2);
    expect(lowerWorldY(f.boxes,1)).toBeCloseTo(Math.sqrt(.78*.78-.18*.18)+.15,2);
    binding.dispose();clean(f);
  });
  it('la geometría antigua sin lift mantiene compatibilidad con los flags T7o',()=>{
    const f=fixture();delete f.boxes.userData['colvis2SupportLiftSceneT7p'];
    const previous=new THREE.Matrix4();f.boxes.getMatrixAt(1,previous);
    const binding=attachColvis3ColonyGroundContactT7o(f.sphere,f.site,.2);
    expect(binding.tested).toBe(1);
    const after=new THREE.Matrix4();f.boxes.getMatrixAt(1,after);
    expect(after.equals(previous)).toBe(true);
    binding.dispose();clean(f);
  });
  it('no modifica instancias sin metadatos ni afecta a la persistencia',()=>{
    const f=fixture();delete f.boxes.userData['colvis2SupportLiftSceneT7p'];
    delete f.boxes.userData['colvis2GroundEligibleT7o'];
    const originalSite=f.site.position.clone();
    const binding=attachColvis3ColonyGroundContactT7o(f.sphere,f.site,.2);
    expect(binding.tested).toBe(0);
    expect(f.site.position.equals(originalSite)).toBe(true);
    binding.dispose();clean(f);
  });
});
