import * as THREE from 'three';
import { describe,expect,it } from 'vitest';
import { buildVida38AdvancedReptilianGallery38S } from './vida38-advanced-reptilian-fixtures-38-2s';
import { createVida38AdvancedReptilianPreview38S2,
  VIDA38_ADVANCED_REPTILIAN_RENDER_REVISION_38S2 } from './vida38-advanced-reptilian-preview-38-2s2';
import { isVida38AdvancedReptilian38S } from './vida38-advanced-reptilian-plan-38-2s';

function disposeObjects(objects:readonly THREE.Object3D[]):void{
  const geometries=new Set<THREE.BufferGeometry>();const materials=new Set<THREE.Material>();
  for(const item of objects){
    if(!(item instanceof THREE.Mesh))continue;
    geometries.add(item.geometry);
    for(const m of Array.isArray(item.material)?item.material:[item.material])materials.add(m);
  }
  for(const g of geometries)g.dispose();for(const m of materials)m.dispose();
}

describe('38.2s2 — integración real de reptilianos avanzados',()=>{
  const entries=buildVida38AdvancedReptilianGallery38S(24);
  it('sólo selecciona REPTILIAN/ADVANCED, nunca VERY_ADVANCED, PRIMITIVE ni otros linajes',()=>{
    const original=entries[0]!.contract;
    expect(isVida38AdvancedReptilian38S(original)).toBe(true);
    expect(isVida38AdvancedReptilian38S({...original,intelligence:{lineage:'REPTILIAN',civilizationTier:'VERY_ADVANCED'}})).toBe(false);
    expect(isVida38AdvancedReptilian38S({...original,intelligence:{lineage:'REPTILIAN',civilizationTier:'PRIMITIVE'}})).toBe(false);
    expect(isVida38AdvancedReptilian38S({...original,intelligence:{lineage:'HUMANOID',civilizationTier:'VERY_ADVANCED'}})).toBe(false);
    expect(isVida38AdvancedReptilian38S({...original,intelligence:{lineage:'INSECTOID',civilizationTier:'VERY_ADVANCED'}})).toBe(false);
    expect(isVida38AdvancedReptilian38S({...original,intelligence:null})).toBe(false);
  });
  it('mantiene 10 siluetas, astronautas y tejidos contemporáneos en la galería',()=>{
    expect(new Set(entries.map(x=>x.plan.outfit)).size).toBe(10);
    expect(new Set(entries.map(x=>x.plan.culture)).size).toBe(6);
    expect(entries.some(x=>x.plan.outfit==='PRESSURE_SUIT'&&x.plan.role==='PILOT')).toBe(true);
    expect(entries.some(x=>x.plan.outfit==='LAB_APPAREL')).toBe(true);
    expect(entries.some(x=>x.plan.outfit==='UTILITY_OVERALLS')).toBe(true);
  });
  it('reemplaza prendas antiguas frontales por mallas 360 sin modificar ojos, piel ni cola',()=>{
    const specimen=entries.find(e=>e.plan.outfit==='LAB_APPAREL')!;
    const group=new THREE.Group();
    const created=createVida38AdvancedReptilianPreview38S2(group,specimen.contract,'LOW');
    try{
      const parts=created.filter(x=>typeof x.userData['vida38AdvancedReptilianPart38S2']==='string');
      expect(parts.length).toBeGreaterThanOrEqual(2);
      expect(created.some(x=>x.name==='VIDA38_2OD_REPTILIAN_BODY')).toBe(true);
      expect(created.some(x=>x.name==='VIDA38_2OD_REPTILIAN_GARMENT')).toBe(false);
      expect(group.userData['vida38AdvancedReptilianRenderer38S2']).toBe(VIDA38_ADVANCED_REPTILIAN_RENDER_REVISION_38S2);
      expect(group.userData['vida38IntegratedSdfTail38OD5']).toBe(true);
      expect(created.some(x=>x.userData['vida38AdvancedReptilianPart38S2']==='COAT_360')).toBe(true);
      for(const p of parts){
        if(!(p instanceof THREE.Mesh))continue;
        const positions=p.geometry.getAttribute('position');
        if(!positions)continue;
        for(let i=0;i<positions.count;i+=Math.max(1,Math.floor(positions.count/160))){
          expect(Number.isFinite(positions.getX(i))).toBe(true);
          expect(Number.isFinite(positions.getY(i))).toBe(true);
          expect(Number.isFinite(positions.getZ(i))).toBe(true);
        }
      }
    }finally{disposeObjects(created);}
  },60_000);
  it('no activa el renderer avanzado con una civilización muy avanzada',()=>{
    const specimen=entries[0]!.contract;
    const very={...specimen,intelligence:{lineage:'REPTILIAN' as const,civilizationTier:'VERY_ADVANCED' as const}};
    expect(()=>createVida38AdvancedReptilianPreview38S2(new THREE.Group(),very,'LOW')).toThrow();
  });
});
