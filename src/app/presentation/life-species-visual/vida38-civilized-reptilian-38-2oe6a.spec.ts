import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { createVida38CivilizedReptilianPreview38O } from './vida38-civilized-reptilian-preview-38-2o';
import { findVida38ReptilianTestEntry38S8C } from './vida38-reptilian-test-fixtures-38-2s8c';

function dispose(created:readonly THREE.Object3D[]):void {
  const geometries=new Set<THREE.BufferGeometry>();
  const materials=new Set<THREE.Material>();
  for(const obj of created){
    if(!(obj instanceof THREE.Mesh))continue;
    geometries.add(obj.geometry);
    for(const m of Array.isArray(obj.material)?obj.material:[obj.material])materials.add(m);
  }
  geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());
}

describe('38.2o.e6a — coherencia cultural tras 38.2o.e7c/e9',()=>{
  it('distingue BASILICA_TECHNOCRACY y PELAGIC_CONCORD sin exigir parches decorativos retirados en e7c',()=>{
    const signatures=new Set<string>();
    for(const culture of ['BASILICA_TECHNOCRACY','PELAGIC_CONCORD'] as const){
      const entry=findVida38ReptilianTestEntry38S8C(e=>e.culture===culture, `cultura ${culture}`);
      const group=new THREE.Group();
      const created=createVida38CivilizedReptilianPreview38O(group,entry.contract,'LOW');
      try{
        expect(group.userData['vida38ReptilianCulture38OE']).toBe(culture);
        const plan=group.userData['vida38CulturalDiversityPlan38OE9'] as {visualSignature?:string}|undefined;
        expect(plan?.visualSignature).toBeTruthy();
        signatures.add(plan!.visualSignature!);
        const garments=created.filter(o=>o instanceof THREE.Mesh && o.name==='VIDA38_2OD_REPTILIAN_GARMENT');
        expect(garments.length).toBeGreaterThan(0);
        // Las prendas culturales actuales se mallan con geometría real, no son solo etiquetas.
        expect(garments.some(o=>o instanceof THREE.Mesh && o.geometry.getAttribute('position').count>20)).toBe(true);
      }finally{dispose(created);}
    }
    expect(signatures.size).toBe(2);
  },60_000);
});
