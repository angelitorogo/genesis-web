import { describe, expect, it } from 'vitest';
import { buildVida38PrimitiveReptilianGallery38U, makeVida38PrimitiveReptilianLaboratory38U } from './vida38-primitive-reptilian-fixtures-38-2u';
import { deriveVida38PrimitiveReptilianPlan38U, isVida38PrimitiveReptilian38U, VIDA38_PRIMITIVE_REPTILIAN_WEAR_38U } from './vida38-primitive-reptilian-plan-38-2u';
import { createVida38SpeciesPreviewModelV1 } from './vida38-species-visual-preview-scene';
import { inspectVida38PrimitiveReptilianModel38U, validateVida38PrimitiveReptilianModel38U, VIDA38_PRIMITIVE_REPTILIAN_RENDERER_REVISION_38U } from './vida38-primitive-reptilian-preview-38-2u';

describe('38.2u — reptilianos PRIMITIVE, laboratorio y fichas',()=>{
  const entries=buildVida38PrimitiveReptilianGallery38U(24);
  it('la galería 12/24 es reproducible y cubre vestimenta, culturas y roles',()=>{
    expect(entries.length).toBe(24);
    expect(buildVida38PrimitiveReptilianGallery38U(12).map(e=>e.serial)).toEqual(entries.slice(0,12).map(e=>e.serial));
    expect(buildVida38PrimitiveReptilianGallery38U(24).map(e=>e.serial)).toEqual(entries.map(e=>e.serial));
    const wears=new Set(entries.map(e=>e.plan.wear));
    const cultures=new Set(entries.map(e=>e.plan.culture));
    const roles=new Set(entries.map(e=>e.plan.role));
    const signatures=new Set(entries.map(e=>e.plan.signature));
    expect(wears.size).toBe(VIDA38_PRIMITIVE_REPTILIAN_WEAR_38U.length);
    expect(cultures.size).toBe(6);
    expect(roles.size).toBeGreaterThanOrEqual(9);
    expect(signatures.size).toBe(24);
    expect(entries.some(e=>e.plan.wear==='SHAMAN_REGALIA')).toBe(true);
    expect(entries.some(e=>e.plan.wear==='CHIEF_REGALIA')).toBe(true);
    expect(new Set(entries.map(e=>e.plan.visual.torsoCoverage)).size).toBe(3);
    expect(new Set(entries.map(e=>e.plan.visual.shoulderCoverage)).size).toBe(3);
    expect(entries.some(e=>e.plan.visual.headpiece)).toBe(true);
    expect(entries.some(e=>e.plan.visual.satchel)).toBe(true);
    expect(entries.some(e=>e.plan.visual.staff)).toBe(true);
    expect(entries.some(e=>e.plan.visual.visibleOrnaments>=8)).toBe(true);
  });
  it('el guard solo captura REPTILIAN/PRIMITIVE',()=>{
    const original=makeVida38PrimitiveReptilianLaboratory38U(7).contract;
    expect(isVida38PrimitiveReptilian38U(original)).toBe(true);
    expect(deriveVida38PrimitiveReptilianPlan38U(original).signature).toBe(deriveVida38PrimitiveReptilianPlan38U(original).signature);
    expect(isVida38PrimitiveReptilian38U({...original,intelligence:{lineage:'REPTILIAN',civilizationTier:'ADVANCED'}})).toBe(false);
    expect(isVida38PrimitiveReptilian38U({...original,morphology:{...original.morphology,group:'INSECTS'}})).toBe(false);
  });
  it('la fábrica usa el renderer primitivo con anatomía y ropa visibles',()=>{
    const specimen=entries.find(e=>e.plan.wear==='HUNTER_STRAPS')!;
    const model=createVida38SpeciesPreviewModelV1(specimen.contract,{humanoidQuality:'LOW'});
    try{
      expect(model.subject.userData['vida38PrimitiveReptilianRenderer38U']).toBe(VIDA38_PRIMITIVE_REPTILIAN_RENDERER_REVISION_38U);
      const actual=inspectVida38PrimitiveReptilianModel38U(model.subject);
      expect(actual.anatomyCount).toBeGreaterThanOrEqual(1);
      expect(model.subject.getObjectByName('VIDA38_2OD_REPTILIAN_BODY')).toBeDefined();
      expect(model.subject.userData['vida38PrimitiveReptilianOriginalSdf38U']).toBe(true);
      expect(actual.garmentCount).toBeGreaterThanOrEqual(5);
      // La cantidad depende del rol y de la geometría SDF disponible: no imponer una cifra universal.
      expect(actual.accessoryCount).toBeGreaterThanOrEqual(1);
      expect(model.subject.getObjectByName('VIDA38_U_HANDMADE_LEATHER_BELT')).toBeDefined();
      expect(model.subject.getObjectByName('VIDA38_U_CHEST_LEATHER_DIAGONAL')).toBeDefined();
    }finally{model.dispose();}
  },60_000);
  it('los 24 ejemplares cumplen el contrato por vestimenta, incluso los taparrabos mínimos de 3 piezas',()=>{
    for(const entry of entries){
      const model=createVida38SpeciesPreviewModelV1(entry.contract,{humanoidQuality:'LOW'});
      try{
        const validation=validateVida38PrimitiveReptilianModel38U(model.subject,entry.plan.wear);
        expect(validation.problems, `Ejemplar ${entry.serial} / ${entry.plan.wear}`).toEqual([]);
        expect(validation.valid).toBe(true);
      }finally{model.dispose();}
    }
  },60_000);
  it('ocho familias producen construcciones visuales diferentes sin sustituir la malla corporal SDF',()=>{
    const families=new Map<string,Set<string>>();
    for(const e of entries){
      if(families.has(e.plan.wear))continue;
      const model=createVida38SpeciesPreviewModelV1(e.contract,{humanoidQuality:'LOW'});
      try{
        expect(model.subject.getObjectByName('VIDA38_2OD_REPTILIAN_BODY')).toBeDefined();
        expect(model.subject.userData['vida38PrimitiveReptilianOriginalSdf38U']).toBe(true);
        const names=new Set<string>();
        model.subject.traverse(o=>{
          if(o.userData['vida38PrimitiveReptilianPart38U']==='GARMENT')names.add(o.name);
        });
        families.set(e.plan.wear,names);
      }finally{model.dispose();}
    }
    expect(families.size).toBe(8);
    expect(new Set([...families.values()].map(names=>[...names].sort().join('|'))).size).toBe(8);
    expect(families.get('HIDE_TUNIC')?.has('VIDA38_U_TUNIC_CHEST_WRAPPING')).toBe(true);
    expect(families.get('SHOULDER_MANTLE')?.has('VIDA38_U_LEFT_SHOULDER_HIDE')).toBe(true);
    expect(families.get('TRIBAL_SKIRT')?.has('VIDA38_U_SKIRT_FRONT_LAYER')).toBe(true);
    expect(families.get('WARRIOR_LEATHERS')?.has('VIDA38_U_WARRIOR_CHEST_PLATE')).toBe(true);
  },60_000);

  it('los colgantes visibles tienen soporte asociado y no se confunden los soportes con colgantes',()=>{
    const checked = new Set<string>();
    for(const wear of ['HUNTER_STRAPS','SHAMAN_REGALIA','CHIEF_REGALIA','HIDE_TUNIC'] as const){
      const entry=entries.find(e=>e.plan.wear===wear)!;
      const model=createVida38SpeciesPreviewModelV1(entry.contract,{humanoidQuality:'LOW'});
      try{
        const names=new Set<string>();
        model.subject.traverse(o=>{ if(o.name) names.add(o.name); });
        // Contrato 38.2u8: solo los amuletos independientes creados por
        // hangingPendantSupport requieren una pieza hermana *_CORD.
        // SURFACE_PENDANT_SUPPORT (38.2u7) es el soporte, no el amuleto.
        const anchoredPendant=/^VIDA38_U_(?:NECKLACE_TALON_\d+_-?\d+|EXTRA_TRIBAL_PENDANT|BELT_BONE_CHARM_\d+|ACCESSORY_TOTEM_CARVING)$/;
        for(const pendantName of [...names].filter(n=>anchoredPendant.test(n))){
          const cordName=`${pendantName}_CORD`;
          expect(names.has(cordName), `${wear} / ${pendantName} sin cuerda`).toBe(true);
          checked.add(pendantName);
        }
        // Contrato 38.2u7: anclaje sobre la superficie SDF, con cordón
        // alrededor del cuello y sujeción continua al colgante óseo.
        if(names.has('VIDA38_U_SURFACE_ATTACHED_BONE_PENDANT')){
          expect(names.has('VIDA38_U_SURFACE_PENDANT_SUPPORT'), `${wear} sin soporte SDF`).toBe(true);
          expect(names.has('VIDA38_U_SURFACE_NECKLACE_CORD'), `${wear} sin collar SDF`).toBe(true);
          checked.add('SURFACE_ATTACHED_BONE_PENDANT');
        }
      } finally { model.dispose(); }
    }
    expect(checked.size).toBeGreaterThan(0);
  },60_000);

});
