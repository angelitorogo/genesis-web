import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { buildVida38HumanoidGallery38R } from './vida38-civilized-humanoid-fixtures-38-2r';
import { createVida38CivilizedHumanoidPreview38R } from './vida38-civilized-humanoid-preview-38-2r';
import { deriveVida38HumanoidAnatomy, buildVida38HumanoidRawMesh } from './vida38-humanoid-organic-field-38-2e';
import {
  VIDA38_CIV_HUMANOID_ORAL_REVISION_38R1A,
  deriveVida38CivilHumanoidOralPlan38R1A,
  findVida38CivilHumanoidFaceZ38R1A,
  sampleVida38CivilHumanoidOralSurface38R1A,
  sculptVida38CivilHumanoidOralRaw38R1A,
} from './vida38-civilized-humanoid-oral-shape-38-2r1a';
import { createVida38CivilHumanoidOralMeshes38R1A } from './vida38-civilized-humanoid-oral-mesh-38-2r1a';

function release(objects:readonly THREE.Object3D[]):void{
  const gs=new Set<THREE.BufferGeometry>();const ms=new Set<THREE.Material>();
  for(const o of objects){if(!(o instanceof THREE.Mesh))continue;gs.add(o.geometry);
    for(const m of Array.isArray(o.material)?o.material:[o.material])ms.add(m);
  }
  for(const g of gs)g.dispose();for(const m of ms)m.dispose();
}

describe('38.2r1a — reconstrucción oral y tercio facial inferior',()=>{
  const gallery=buildVida38HumanoidGallery38R(12);

  it('usa los landmarks reales del SDF y produce perfiles deterministas distintos',()=>{
    const signatures=new Set<string>();
    const phenotypes=new Set<string>();
    for(const entry of gallery){
      const a=deriveVida38HumanoidAnatomy(entry.contract);
      const mouth=deriveVida38CivilHumanoidOralPlan38R1A(a,entry.plan);
      expect(mouth).toEqual(deriveVida38CivilHumanoidOralPlan38R1A(a,entry.plan));
      expect(mouth.revision).toBe(VIDA38_CIV_HUMANOID_ORAL_REVISION_38R1A);
      expect(mouth.halfWidth).toBeGreaterThanOrEqual(.067);
      expect(mouth.halfWidth).toBeLessThanOrEqual(.149);
      expect(mouth.cleftHalfHeight).toBeGreaterThanOrEqual(.007);
      expect(mouth.fullness).toBeGreaterThan(.010);
      signatures.add(mouth.signature); phenotypes.add(mouth.phenotype);
    }
    expect(signatures.size).toBe(12);
    expect(phenotypes.size).toBeGreaterThanOrEqual(4);
  });

  it('sitúa la abertura y ambos labios POR FUERA de la superficie facial, con geometría finita',()=>{
    for(const entry of gallery.slice(0,3)){
      const a=deriveVida38HumanoidAnatomy(entry.contract);
      const mouth=deriveVida38CivilHumanoidOralPlan38R1A(a,entry.plan);
      for(const u of [-.75,0,.75]){
        const x=u*mouth.halfWidth;
        const z=findVida38CivilHumanoidFaceZ38R1A(a,x,mouth.y);
        const z2=sampleVida38CivilHumanoidOralSurface38R1A(a,mouth,x,mouth.y);
        expect(Number.isFinite(z)).toBe(true);
        expect(z2).toBeGreaterThan(z-.015);
      }
      const surfaces=createVida38CivilHumanoidOralMeshes38R1A(a,mouth,entry.contract);
      try{
        expect(surfaces).toHaveLength(3);
        expect(new Set(surfaces.map(s=>s.userData['vida38CivilHumanoidOralPart38R1A'])).size).toBe(3);
        for(const surface of surfaces){
          const geometry=surface.geometry;
          expect(geometry.index?.count).toBeGreaterThan(500);
          const pos=geometry.getAttribute('position') as THREE.BufferAttribute;
          for(let i=0;i<pos.count;i++){
            expect(Number.isFinite(pos.getX(i))).toBe(true);
            expect(Number.isFinite(pos.getY(i))).toBe(true);
            expect(Number.isFinite(pos.getZ(i))).toBe(true);
          }
          const bb=new THREE.Box3().setFromBufferAttribute(pos);
          expect(bb.max.x-bb.min.x).toBeGreaterThan(.10);
          expect(bb.max.z).toBeGreaterThan(.12);
        }
      }finally{release(surfaces);}
    }
  },15000);

  it('esculpe labios y mentón solamente en el tercio inferior del rostro',()=>{
    const entry=gallery[0]!;
    const a=deriveVida38HumanoidAnatomy(entry.contract);
    const raw=buildVida38HumanoidRawMesh(a,'LOW');
    const mouth=deriveVida38CivilHumanoidOralPlan38R1A(a,entry.plan);
    const sculpted=sculptVida38CivilHumanoidOralRaw38R1A(raw,mouth);
    expect(sculpted.positions).not.toBe(raw.positions);
    expect(sculpted.positions.length).toBe(raw.positions.length);
    let changed=0;
    for(let i=0;i<raw.positions.length;i+=3){
      const x=raw.positions[i]!,y=raw.positions[i+1]!,z=raw.positions[i+2]!;
      const delta=sculpted.positions[i+2]!-z;
      expect(Math.abs(delta)).toBeLessThan(.050);
      if(y < mouth.y-.15||y > mouth.y+.12||Math.abs(x)>mouth.halfWidth*2||z<.09){
        expect(delta).toBe(0);
      }
      if(Math.abs(delta)>.00001)changed++;
    }
    expect(changed).toBeGreaterThan(5);
  },15000);

  it('regresión: un único cuerpo continuo, boca nueva y galería existente',()=>{
    const entry=gallery[1]!;
    const subject=new THREE.Group();
    const created=createVida38CivilizedHumanoidPreview38R(subject,entry.contract,'LOW');
    try{
      expect(created.filter(o=>o.userData['civHumPart38R']==='CONTINUOUS_BODY')).toHaveLength(1);
      expect(created.filter(o=>o.userData['civHumPart38R']==='MOUTH')).toHaveLength(3);
      expect(subject.userData['vida38CivilHumanoidOralPlan38R1A']).toBeTruthy();
      expect(subject.userData['vida38CivilHumanoidGarment38R']).toBe(entry.plan.garment);
      expect(subject.userData['civilizedRenderer38R']).toBe('HUMANOID');
    }finally{release(created);}
  },15000);
});
