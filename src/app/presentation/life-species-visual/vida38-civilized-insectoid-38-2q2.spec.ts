import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { buildVida38InsectoidGallery38Q } from './vida38-civilized-insectoid-fixtures-38-2q';
import { createVida38CivilizedInsectoidPreview38Q } from './vida38-civilized-insectoid-preview-38-2q';
import {
  VIDA38_INSECTOID_WARDROBE_REVISION_38Q2,
  buildVida38InsectoidWardrobe38Q2,
  deriveVida38InsectoidWardrobeStyle38Q2,
} from './vida38-civilized-insectoid-wardrobe-38-2q2';

function dispose(objects: readonly THREE.Object3D[]): void {
  const geometries=new Set<THREE.BufferGeometry>();
  const materials=new Set<THREE.Material>();
  for(const object of objects){
    if(!(object instanceof THREE.Mesh))continue;
    geometries.add(object.geometry);
    for(const material of Array.isArray(object.material)?object.material:[object.material])materials.add(material);
  }
  for(const g of geometries)g.dispose();
  for(const m of materials)m.dispose();
}

describe('38.2q2 — vestuario insectoide civilizado de seis siluetas',()=>{
  const entries=buildVida38InsectoidGallery38Q(24);

  it('mantiene seis familias y combina identidad cultural con longitud, caída y material',()=>{
    const families=new Set<string>(),cultures=new Set<string>(),textiles=new Set<string>();
    const styles=new Set<string>();
    for(const entry of entries){
      const a=deriveVida38InsectoidWardrobeStyle38Q2(entry.plan);
      const b=deriveVida38InsectoidWardrobeStyle38Q2(entry.plan);
      expect(a).toEqual(b);
      expect(a.revision).toBe(VIDA38_INSECTOID_WARDROBE_REVISION_38Q2);
      expect(a.length).toBeGreaterThan(.4);
      expect(a.flare).toBeGreaterThan(0);
      expect(a.wingOpening).toBe(entry.plan.wingPairs>0);
      families.add(a.family);cultures.add(a.culture);textiles.add(a.textile);
      styles.add(a.signature);
    }
    expect(families.size).toBe(6);
    expect(cultures.size).toBe(6);
    expect(textiles.size).toBeGreaterThanOrEqual(5);
    expect(styles.size).toBe(24);
  });

  it('genera prendas blandas continuas y volúmenes distintos de petos rígidos',()=>{
    const categories=new Set<string>();
    for(const family of ['SCIENTIFIC_HARNESS','ROYAL_MANTLE','CEREMONIAL_VESTMENTS','EXPLORER_KIT'] as const){
      const entry=entries.find(e=>e.plan.wardrobe===family);
      expect(entry).toBeTruthy();
      if(!entry)continue;
      const parts=buildVida38InsectoidWardrobe38Q2(entry.plan,'LOW');
      try{
        const cloth=parts.filter(p=>p.mesh.userData['vida38WardrobeContinuous38Q2']===true);
        expect(cloth.length).toBeGreaterThanOrEqual(2);
        for(const item of cloth){
          const mesh=item.mesh;
          const positions=mesh.geometry.getAttribute('position') as THREE.BufferAttribute;
          expect(positions.count).toBeGreaterThan(400);
          expect(mesh.geometry.index?.count??0).toBeGreaterThan(700);
          const bounds=new THREE.Box3().setFromBufferAttribute(positions);
          // Las piezas secundarias (p. ej. el faldón colonial) nacen más abajo
          // que una bata o un manto: no imponer 1.38 a TODAS las mallas.
          const shape=mesh.userData['vida38WardrobeShape38Q2'] as
            {top:number;bottom:number;wingOpening:boolean;sideSlits:boolean};
          expect(shape).toBeDefined();
          expect(Number.isFinite(shape.top)).toBe(true);
          expect(Number.isFinite(shape.bottom)).toBe(true);
          expect(shape.top).toBeGreaterThan(shape.bottom);
          expect(bounds.max.y).toBeGreaterThan(shape.top-.08);
          expect(bounds.min.y).toBeLessThan(shape.bottom+.08);
          expect(bounds.max.y-bounds.min.y).toBeGreaterThan(.20);
        }
        // La prenda EXTERIOR principal sí debe alcanzar la parte alta del torso
        // y caer por debajo de la cintura; los paños secundarios no.
        const mainName:Record<typeof family,string>={
          SCIENTIFIC_HARNESS:'VIDA38_Q2_OPEN_LAB_COAT',
          ROYAL_MANTLE:'VIDA38_Q2_WIDE_DORSAL_MANTLE',
          CEREMONIAL_VESTMENTS:'VIDA38_Q2_CEREMONIAL_ROBE_360',
          EXPLORER_KIT:'VIDA38_Q2_ASYMMETRIC_FIELD_PONCHO',
        };
        const main=parts.find(p=>p.name===mainName[family]);
        expect(main).toBeDefined();
        if(main){
          const mainBounds=new THREE.Box3().setFromBufferAttribute(
            main.mesh.geometry.getAttribute('position') as THREE.BufferAttribute);
          expect(mainBounds.max.y).toBeGreaterThan(1.38);
          expect(mainBounds.min.y).toBeLessThan(1.14);
        }
        categories.add(parts.find(p=>p.part==='COAT')?.part??parts.find(p=>p.part==='MANTLE')?.part??
          parts.find(p=>p.part==='TUNIC')?.part??parts.find(p=>p.part==='PONCHO')?.part??'');
      }finally{dispose(parts.map(p=>p.mesh));}
    }
    expect(categories.size).toBeGreaterThanOrEqual(3);
  },15000);

  it('respeta abertura dorsal de alas y sisas de múltiples brazos',()=>{
    const candidates=entries.filter(e=>e.plan.wingPairs>0&&e.plan.wardrobe!=='SEGMENTED_BIO_ARMOR');
    expect(candidates.length).toBeGreaterThan(0);
    for(const entry of candidates.slice(0,4)){
      const parts=buildVida38InsectoidWardrobe38Q2(entry.plan,'LOW');
      try{
        const shells=parts.filter(p=>p.mesh.userData['vida38WardrobeContinuous38Q2']===true);
        expect(shells.length).toBeGreaterThan(0);
        expect(shells.some(p=>(p.mesh.userData['vida38WardrobeShape38Q2'] as {wingOpening:boolean}).wingOpening)).toBe(true);
        expect(shells.some(p=>(p.mesh.userData['vida38WardrobeShape38Q2'] as {sideSlits:boolean}).sideSlits)).toBe(true);
      }finally{dispose(parts.map(p=>p.mesh));}
    }
  },15000);


  it('separa realmente las seis siluetas y mantiene geometría finita',()=>{
    const expected: Record<string,string>={
      EXO_SUIT:'VIDA38_Q2_SMART_SKIN_360',
      SEGMENTED_BIO_ARMOR:'VIDA38_Q2_FLEX_PLATE_0',
      SCIENTIFIC_HARNESS:'VIDA38_Q2_OPEN_LAB_COAT',
      ROYAL_MANTLE:'VIDA38_Q2_WIDE_DORSAL_MANTLE',
      CEREMONIAL_VESTMENTS:'VIDA38_Q2_CEREMONIAL_ROBE_360',
      EXPLORER_KIT:'VIDA38_Q2_ASYMMETRIC_FIELD_PONCHO',
    };
    const pieceCounts=new Set<number>();
    for(const [family,marker] of Object.entries(expected)){
      const entry=entries.find(e=>e.plan.wardrobe===family);
      expect(entry).toBeDefined();
      if(!entry)continue;
      const pieces=buildVida38InsectoidWardrobe38Q2(entry.plan,'LOW');
      try{
        expect(pieces.some(piece=>piece.name===marker)).toBe(true);
        pieceCounts.add(pieces.length);
        for(const piece of pieces){
          const position=piece.mesh.geometry.getAttribute('position') as THREE.BufferAttribute;
          for(let i=0;i<position.count;i++){
            expect(Number.isFinite(position.getX(i))).toBe(true);
            expect(Number.isFinite(position.getY(i))).toBe(true);
            expect(Number.isFinite(position.getZ(i))).toBe(true);
          }
        }
      }finally{dispose(pieces.map(p=>p.mesh));}
    }
    expect(pieceCounts.size).toBeGreaterThanOrEqual(4);
  },15000);

  it('integra la nueva vestimenta sin modificar el contrato de ojos, brazos y accesorios',()=>{
    const entry=entries.find(e=>e.plan.wardrobe==='ROYAL_MANTLE')??entries[0]!;
    const subject=new THREE.Group();
    const objects=createVida38CivilizedInsectoidPreview38Q(subject,entry.contract,'LOW');
    try{
      expect(subject.userData['vida38InsectoidWardrobeRevision38Q2']).toBe(VIDA38_INSECTOID_WARDROBE_REVISION_38Q2);
      expect(objects.filter(o=>o.userData['civInsectoidPart38Q']==='COMPOUND_EYE')).toHaveLength(2);
      expect(objects.filter(o=>o.userData['civInsectoidPart38Q']==='ARM')).toHaveLength(entry.plan.armCount*2);
      expect(objects.some(o=>o.userData['vida38WardrobeContinuous38Q2']===true)).toBe(true);
    }finally{dispose(objects);}
  },15000);
});
