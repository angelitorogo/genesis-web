/**
 * Auditoría 38.4: pruebas de reproducibilidad CT-0 para las nueve ramas civilizadas.
 * No prueba (ni declara) la justificación biológica de cada variante espacial.
 */
import {describe,expect,it} from 'vitest';
import {describeVida38SpeciesPreviewV1} from './vida38-species-visual-preview-scene';
import {buildVida38ReptilianGallery38OE5} from './vida38-reptilian-gallery-fixtures-38-2oe5';
import {buildVida38AdvancedReptilianGallery38S} from './vida38-advanced-reptilian-fixtures-38-2s';
import {buildVida38PrimitiveReptilianGallery38U} from './vida38-primitive-reptilian-fixtures-38-2u';
import {buildVida38InsectoidGallery38Q} from './vida38-civilized-insectoid-fixtures-38-2q';
import {buildVida38AdvancedInsectoidGallery38T} from './vida38-advanced-insectoid-fixtures-38-2t';
import {buildVida38PrimitiveInsectoidGallery38V} from './vida38-primitive-insectoid-fixtures-38-2v';
import {buildVida38HumanoidGallery38R} from './vida38-civilized-humanoid-fixtures-38-2r';
import {buildVida38AdvancedHumanoidGallery38W} from './vida38-advanced-humanoid-fixtures-38-2w';
import {buildVida38PrimitiveHumanoidGallery38X} from './vida38-primitive-humanoid-fixtures-38-2x';

const families=[
  ['reptilianos muy avanzados',buildVida38ReptilianGallery38OE5],
  ['reptilianos avanzados',buildVida38AdvancedReptilianGallery38S],
  ['reptilianos primitivos',buildVida38PrimitiveReptilianGallery38U],
  ['insectoides muy avanzados',buildVida38InsectoidGallery38Q],
  ['insectoides avanzados',buildVida38AdvancedInsectoidGallery38T],
  ['insectoides primitivos',buildVida38PrimitiveInsectoidGallery38V],
  ['humanoides muy avanzados',buildVida38HumanoidGallery38R],
  ['humanoides avanzados',buildVida38AdvancedHumanoidGallery38W],
  ['humanoides primitivos',buildVida38PrimitiveHumanoidGallery38X],
] as const;

describe('GENESIS 38.4 — determinismo de contratos visuales (9 ramas)',()=>{
  for(const [name, build] of families){
    it(`reconstruye identidad y aspecto procedimental reproducibles: ${name}`,()=>{
      const first=build(12);
      const second=build(12);
      expect(first.length).toBe(12);
      expect(second.length).toBe(12);
      for(let n=0;n<12;n++){
        const a=first[n]!;const b=second[n]!;
        expect(a.contract.speciesId).toBe(b.contract.speciesId);
        expect(a.contract.appearanceFingerprint).toBe(b.contract.appearanceFingerprint);
        expect(a.contract.variantSeedUint32).toBe(b.contract.variantSeedUint32);
        const planOf=(entry:unknown):unknown=>entry!==null&&typeof entry==='object'&&'plan' in entry?(entry as {plan:unknown}).plan:null;
        expect(JSON.stringify(planOf(a))).toBe(JSON.stringify(planOf(b)));
        expect(describeVida38SpeciesPreviewV1(a.contract)).toEqual(describeVida38SpeciesPreviewV1(b.contract));
        // Metadatos del contenedor espacial no son rasgos biológicos.
        const withUnrelatedLocation={...a.contract,viewOnlyLocation:'TEST_SECTOR_B'};
        expect(describeVida38SpeciesPreviewV1(withUnrelatedLocation)).toEqual(describeVida38SpeciesPreviewV1(a.contract));
      }
    });
  }
});
