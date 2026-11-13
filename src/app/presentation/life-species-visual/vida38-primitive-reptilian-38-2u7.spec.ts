import {describe,expect,it} from 'vitest';
import * as THREE from 'three';
import {
  sectionFromSdfMesh38U7,armLoop38U7,makeSurfaceCuff38U7,
  VIDA38_PRIMITIVE_SURFACE_REVISION_38U7,
} from './vida38-primitive-reptilian-surface-fit-38-2u7';
import {buildVida38PrimitiveReptilianGallery38U} from './vida38-primitive-reptilian-fixtures-38-2u';
import {createVida38SpeciesPreviewModelV1} from './vida38-species-visual-preview-scene';

describe('38.2u7 — anclaje real sobre geometría SDF',()=>{
  it('extrae contornos separados sin usar radios anatómicos supuesto',()=>{
    const cylinders=[{x:0,r:.23},{x:.58,r:.095},{x:-.57,r:.125}];
    const parts:number[]=[];
    for(const c of cylinders){
      const g=new THREE.CylinderGeometry(c.r,c.r,1.4,48,8).toNonIndexed();
      const p=g.getAttribute('position');
      for(let i=0;i<p.count;i++)parts.push(p.getX(i)+c.x,p.getY(i),p.getZ(i));
      g.dispose();
    }
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(parts,3));
    const body=new THREE.Mesh(g,new THREE.MeshBasicMaterial());
    const slices=[-.04,0,.04].map(y=>sectionFromSdfMesh38U7(body,y));
    expect(slices.every(s=>s.loops.length>=3)).toBe(true);
    expect(slices.every(s=>armLoop38U7(s,1)!==null&&armLoop38U7(s,-1)!==null)).toBe(true);
    const fitted=makeSurfaceCuff38U7(slices,1,'TEST_SDF_BAND','#c3b798',.08,.02);
    expect(fitted).not.toBeNull();
    const p=fitted!.geometry.getAttribute('position');
    for(let i=0;i<p.count;i++){
      const d=Math.hypot(p.getX(i)-.58,p.getZ(i));
      expect(d).toBeGreaterThan(.105);
    }
    expect(fitted!.userData['vida38PrimitiveSurfaceFit38U7']).toBe(VIDA38_PRIMITIVE_SURFACE_REVISION_38U7);
    fitted!.geometry.dispose();(fitted!.material as THREE.Material).dispose();
    g.dispose();(body.material as THREE.Material).dispose();
  });
  it('la integración primitiva conserva la malla orgánica y no mantiene brazaletes cerrados aproximados',()=>{
    const e=buildVida38PrimitiveReptilianGallery38U(24).find(x=>x.plan.wear==='WARRIOR_LEATHERS')!;
    const model=createVida38SpeciesPreviewModelV1(e.contract,{humanoidQuality:'LOW'});
    try{
      expect(model.subject.getObjectByName('VIDA38_2OD_REPTILIAN_BODY')).toBeDefined();
      expect(model.subject.userData['vida38PrimitiveReptilianOriginalSdf38U']).toBe(true);
      expect(model.subject.userData['vida38PrimitiveSurfaceFit38U7']).toBeTruthy();
      expect(model.subject.getObjectByName('VIDA38_U_BICEPS_RING_1')).toBeUndefined();
      expect(model.subject.getObjectByName('VIDA38_U_FOREARM_RING_-1')).toBeUndefined();
      expect(model.subject.getObjectByName('VIDA38_U_LEATHER_CUFF_1')).toBeUndefined();
    }finally{model.dispose();}
  },60_000);
});
