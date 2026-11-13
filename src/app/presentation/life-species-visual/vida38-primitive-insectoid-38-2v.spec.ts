import {describe,it,expect} from 'vitest';
import {buildVida38PrimitiveInsectoidGallery38V,makeVida38PrimitiveInsectoidLaboratory38V} from './vida38-primitive-insectoid-fixtures-38-2v';
import {isVida38PrimitiveInsectoid38V,deriveVida38PrimitiveInsectPlan38V,
  VIDA38_PRIMITIVE_INSECT_WEAR_38V} from './vida38-primitive-insectoid-plan-38-2v';
import {VIDA38_PRIMITIVE_INSECT_RENDERER_REVISION_38V,inspectVida38PrimitiveInsectoid38V} from './vida38-primitive-insectoid-preview-38-2v';
import {createVida38SpeciesPreviewModelV1} from './vida38-species-visual-preview-scene';

describe('38.2v — civilizaciones insectoides primitivas',()=>{
  const entries=buildVida38PrimitiveInsectoidGallery38V(24);

  it('la galería 12/24 es CT-0 y contiene las ocho familias de atuendo',()=>{
    expect(entries.length).toBe(24);
    expect(buildVida38PrimitiveInsectoidGallery38V(12).map(e=>e.serial)).toEqual(entries.slice(0,12).map(e=>e.serial));
    expect(new Set(entries.map(e=>e.plan.wear)).size).toBe(VIDA38_PRIMITIVE_INSECT_WEAR_38V.length);
    expect(new Set(entries.map(e=>e.plan.signature)).size).toBe(24);
    expect(new Set(entries.map(e=>e.plan.culture)).size).toBe(6);
    expect(entries.some(e=>e.plan.armCount===4)).toBe(true);
    expect(entries.some(e=>e.plan.armCount===6)).toBe(true);
  });

  it('el guard nunca captura insectos silvestres ni ADVANCED/VERY_ADVANCED',()=>{
    const c=makeVida38PrimitiveInsectoidLaboratory38V(1).contract;
    expect(isVida38PrimitiveInsectoid38V(c)).toBe(true);
    expect(isVida38PrimitiveInsectoid38V({...c,intelligence:null})).toBe(false);
    expect(isVida38PrimitiveInsectoid38V({...c,intelligence:{lineage:'INSECTOID',civilizationTier:'ADVANCED'}})).toBe(false);
    expect(isVida38PrimitiveInsectoid38V({...c,intelligence:{lineage:'INSECTOID',civilizationTier:'VERY_ADVANCED'}})).toBe(false);
    expect(deriveVida38PrimitiveInsectPlan38V(c).signature).toBe(deriveVida38PrimitiveInsectPlan38V(c).signature);
  });

  it('la galería y la ficha usan el mismo cuerpo civilizado y la indumentaria primitiva',()=>{
    for(const wear of VIDA38_PRIMITIVE_INSECT_WEAR_38V){
      const e=entries.find(x=>x.plan.wear===wear)!;
      const model=createVida38SpeciesPreviewModelV1(e.contract,{humanoidQuality:'LOW'});
      try{
        expect(model.subject.userData['vida38PrimitiveInsectoidRenderer38V']).toBe(VIDA38_PRIMITIVE_INSECT_RENDERER_REVISION_38V);
        const result=inspectVida38PrimitiveInsectoid38V(model.subject);
        expect(result.anatomyCount).toBeGreaterThanOrEqual(2);
        expect(result.wardrobeCount).toBeGreaterThanOrEqual(2);
        expect(result.legacyCount).toBe(0);
      }finally{model.dispose();}
    }
  },60_000);

  it('todos los amuletos de 38.2v se generan con su soporte visible',()=>{
    for(const e of entries.filter(x=>x.plan.wear==='CEREMONIAL_BEADS'||x.plan.wear==='ELDER_MANTLE')){
      const model=createVida38SpeciesPreviewModelV1(e.contract,{humanoidQuality:'LOW'});
      try{
        const names:string[]=[];model.subject.traverse(o=>names.push(o.name));
        for(const name of names.filter(x=>x.startsWith('VIDA38_V_NECK_BEAD_')||x.startsWith('VIDA38_V_TALISMAN_'))){
          if(name.endsWith('_CORD'))continue;
          expect(names).toContain(`${name}_CORD`);
        }
      }finally{model.dispose();}
    }
  },60_000);

  it('las variantes con manto, arnés o ceremonia no se quedan solo en la parte frontal',()=>{
    for(const wear of ['HIDE_SHOULDER_CLOAK','FORAGER_HARNESS','CEREMONIAL_BEADS','ELDER_MANTLE','CHITIN_WARRIOR_PANELS'] as const){
      const e=entries.find(x=>x.plan.wear===wear)!;
      const model=createVida38SpeciesPreviewModelV1(e.contract,{humanoidQuality:'LOW'});
      try{
        const names:string[]=[];model.subject.traverse(o=>names.push(o.name));
        if(wear==='HIDE_SHOULDER_CLOAK' || wear==='FORAGER_HARNESS' || wear==='CEREMONIAL_BEADS' || wear==='ELDER_MANTLE') {
          expect(names).toContain('VIDA38_V_BACK_HIDE_LOINCLOTH');
        }
        expect(names.some(n=>n.includes('BACK_')||n.includes('_FLANK_'))).toBe(true);
      }finally{model.dispose();}
    }
  },60_000);
});
