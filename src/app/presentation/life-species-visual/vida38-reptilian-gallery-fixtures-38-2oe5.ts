/**
 * GENESIS 38.2o.e5/e9 — catálogo de comparación visual del laboratorio.
 * No genera entidades del universo ni escribe en IndexedDB.
 * Selecciona muestras reproducibles con cobertura morfológica/cultural,
 * ampliando en e9 la diversidad de longitud, silueta, material y adorno.
 */
import { VIDA38_SPECIES_VISUAL_REVISION, type Vida38SpeciesVisualContract } from './vida38-species-visual-contract';
import {
  selectVida38ReptilianVariation38OE1,
  type Vida38ReptilianVariation38OE1,
} from './vida38-civilized-reptilian-variation-38-2oe1';
import { deriveVida38ReptilianAccessoryPlan38OE3 } from './vida38-civilized-reptilian-accessories-38-2oe3';
import { deriveVida38CulturalDiversityPlan38OE9, type Vida38CulturalDiversityPlan38OE9 } from './vida38-reptilian-cultural-diversity-38-2oe9';

export const VIDA38_REPTILIAN_GALLERY_REVISION_38OE5 = 'VIDA.38.2o.e5/reptilian-comparison-gallery/v2-e9' as const;
export type Vida38ReptilianGallerySize38OE5 = 12 | 24;

export interface Vida38ReptilianGalleryEntry38OE5 {
  readonly ordinal: number;
  readonly contract: Vida38SpeciesVisualContract;
  readonly profile: Vida38ReptilianVariation38OE1['profile'];
  readonly garmentLine: Vida38ReptilianVariation38OE1['garmentLine'];
  readonly culture: Vida38ReptilianVariation38OE1['culture'];
  readonly eyewear: string;
  readonly handheld: string;
  readonly diversityPlan38OE9: Vida38CulturalDiversityPlan38OE9;
}
const SKINS: ReadonlyArray<readonly [string, string]> = [
  ['#62837a','#aeb49f'], ['#829a8b','#c8bc9c'], ['#677688','#9caeb7'],
  ['#a18d76','#c2ae93'], ['#555e65','#839ca1'], ['#867e69','#b0a187'],
  ['#386e68','#80aca4'], ['#756e80','#aba6b5'], ['#6c815c','#abc18b'],
  ['#877666','#bca18b'], ['#4b7b87','#86acb9'], ['#6a857f','#c0b4a2'],
];
function seed32(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619) >>> 0;
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b) >>> 0;
  h ^= h >>> 13;
  return h >>> 0;
}
function candidate(serial: number): Vida38ReptilianGalleryEntry38OE5 {
  const speciesId = `LAB-38OE5-REPTILIAN-${String(serial).padStart(5,'0')}`;
  const appearanceFingerprint = `lab38oe5:v1:${speciesId}`;
  const variation = selectVida38ReptilianVariation38OE1(speciesId, appearanceFingerprint);
  const accessory = deriveVida38ReptilianAccessoryPlan38OE3({
    speciesId, appearanceFingerprint,
    profile:variation.profile, garmentLine:variation.garmentLine, culture:variation.culture,
  });
  const skin = SKINS[seed32(`skin:${speciesId}`) % SKINS.length]!;
  const size = 1.65 + (seed32(`size:${speciesId}`) % 151) / 100;
  const contract: Vida38SpeciesVisualContract = {
    revision: VIDA38_SPECIES_VISUAL_REVISION,
    speciesId,
    speciesName: `Reptiliano de laboratorio ${serial}`,
    variantSeedUint32: seed32(`seed:${speciesId}`),
    appearanceFingerprint,
    provenance: {
      status: 'CONFIRMED_SYSTEM_CT0',
      representation: 'SCIENTIFIC_PROCEDURAL_RECONSTRUCTION',
      observedImageAvailable: false,
      bodyStorageKey: 'LAB_ONLY:VIDA38:38OE5',
      ecosystemDigest: 'LAB_ONLY:NOT_UNIVERSE_DATA',
    },
    morphology: { group:'REPTILES', bodyPlan:'TETRAPOD', covering:'SCALES', appendagePairs:2 },
    ecology: { habitat:'SURFACE_WET_MARGIN', nutrition:'OMNIVORE', niche:'SURFACE_WET_MARGIN/OMNIVORE' },
    locomotion:'WALKING', bodyLengthMeters:size,
    pigmentation: { primaryColorHex:skin[0], secondaryColorHex:skin[1], pattern:'BANDS', bioluminescent:false },
    adaptations:['SENSORY_ORIENTATION'],
    intelligence: { lineage:'REPTILIAN',civilizationLevel:'VERY_ADVANCED' } as unknown as NonNullable<Vida38SpeciesVisualContract['intelligence']>,
  };
  const diversityPlan38OE9 = deriveVida38CulturalDiversityPlan38OE9(contract);
  return Object.freeze({ ordinal:serial,contract,profile:variation.profile,garmentLine:variation.garmentLine,
    culture:variation.culture,eyewear:accessory.eyewear,handheld:accessory.handheld,diversityPlan38OE9 });
}
/** Selección greedy de cobertura equilibrada y determinista. En e9 la puntuación
 * incorpora también longitud, silueta, material y adorno para forzar más lectura
 * cultural y no solo cobertura de perfiles/líneas originales. */
export function buildVida38ReptilianGallery38OE5(count:Vida38ReptilianGallerySize38OE5):readonly Vida38ReptilianGalleryEntry38OE5[] {
  const pool = Array.from({length:360},(_,i)=>candidate(i+1));
  const selected:Vida38ReptilianGalleryEntry38OE5[]=[];
  const profiles=new Set<string>(), garments=new Set<string>(), cultures=new Set<string>();
  const eyes=new Set<string>(), tools=new Set<string>();
  const skintones=new Set<string>();
  const lengths=new Set<string>(), silhouettes=new Set<string>(), materials=new Set<string>(), adornments=new Set<string>();
  const used=new Set<string>();
  while(selected.length<count) {
    let winner:Vida38ReptilianGalleryEntry38OE5|null=null;
    let best=-Infinity;
    for(const entry of pool) {
      if(used.has(entry.contract.speciesId))continue;
      const plan = entry.diversityPlan38OE9;
      const score=(profiles.has(entry.profile)?0:10000)
        +(garments.has(entry.garmentLine)?0:2600)
        +(cultures.has(entry.culture)?0:2400)
        +(lengths.has(plan.length)?0:1800)
        +(silhouettes.has(plan.silhouette)?0:1600)
        +(materials.has(plan.material)?0:1400)
        +(adornments.has(plan.adornment)?0:1100)
        +(eyes.has(entry.eyewear)?0:600)
        +(tools.has(entry.handheld)?0:400)
        +(skintones.has(entry.contract.pigmentation.primaryColorHex)?0:160)
        -(selected.filter(s=>s.profile===entry.profile).length*80)
        -(selected.filter(s=>s.garmentLine===entry.garmentLine).length*40)
        -(selected.filter(s=>s.diversityPlan38OE9.silhouette===plan.silhouette).length*35)
        -(selected.filter(s=>s.diversityPlan38OE9.material===plan.material).length*30)
        -(selected.filter(s=>s.diversityPlan38OE9.adornment===plan.adornment).length*20)
        -entry.ordinal*0.0001;
      if(score>best){best=score;winner=entry;}
    }
    if(winner===null)throw new Error('No se pudo completar la galería reptiliana 38.2o.e5/e9');
    selected.push(winner);used.add(winner.contract.speciesId);
    profiles.add(winner.profile);garments.add(winner.garmentLine);cultures.add(winner.culture);
    eyes.add(winner.eyewear);tools.add(winner.handheld);skintones.add(winner.contract.pigmentation.primaryColorHex);
    lengths.add(winner.diversityPlan38OE9.length); silhouettes.add(winner.diversityPlan38OE9.silhouette);
    materials.add(winner.diversityPlan38OE9.material); adornments.add(winner.diversityPlan38OE9.adornment);
  }
  return Object.freeze(selected);
}
