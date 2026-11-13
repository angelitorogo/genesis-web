/** Galería 38.2v: contratos sintéticos, no persistidos en el universo. */
import { VIDA38_SPECIES_VISUAL_REVISION, type Vida38SpeciesVisualContract } from './vida38-species-visual-contract';
import { deriveVida38PrimitiveInsectPlan38V, type Vida38PrimitiveInsectPlan38V } from './vida38-primitive-insectoid-plan-38-2v';
import {vida38Hash38T} from './vida38-advanced-insectoid-plan-38-2t';

export type Vida38PrimitiveInsectoidGallerySize38V = 12|24;
export interface Vida38PrimitiveInsectoidGalleryEntry38V {
  readonly serial:number;
  readonly contract:Vida38SpeciesVisualContract;
  readonly plan:Vida38PrimitiveInsectPlan38V;
}
const SKINS:ReadonlyArray<readonly [string,string]>=[
  ['#755b49','#b39f7e'],['#576b58','#94a789'],['#63777f','#9bb6ba'],
  ['#6d6657','#b8ab88'],['#51686c','#96b6b7'],['#745e66','#b2a2aa'],
  ['#667b57','#b1c19c'],['#786a56','#b7a48a'],['#4b676a','#80a3a9'],
  ['#6e6d74','#b0a9b7'],['#666f52','#aab28c'],['#756d5d','#b7ae9c'],
];
export function makeVida38PrimitiveInsectoidLaboratory38V(serial:number):Vida38PrimitiveInsectoidGalleryEntry38V {
  if(!Number.isInteger(serial)||serial<1)throw new Error('38.2v: ordinal inválido');
  const speciesId=`LAB-38V-INSECTOID-${String(serial).padStart(5,'0')}`;
  const appearanceFingerprint=`LAB_ONLY/38V/${speciesId}`;
  const skin=SKINS[vida38Hash38T(speciesId+'|skin')%SKINS.length]!;
  const pairs=vida38Hash38T(speciesId+'|pairs')%4===0?4:3;
  const winged=vida38Hash38T(speciesId+'|flying')%5===0;
  const contract:Vida38SpeciesVisualContract={
    revision:VIDA38_SPECIES_VISUAL_REVISION,speciesId,
    speciesName:`Insectoide avanzado de laboratorio ${serial}`,
    variantSeedUint32:vida38Hash38T(speciesId+'|seed'),appearanceFingerprint,
    provenance:{status:'CONFIRMED_SYSTEM_CT0',representation:'SCIENTIFIC_PROCEDURAL_RECONSTRUCTION',
      observedImageAvailable:false,bodyStorageKey:'LAB_ONLY:VIDA38:38V',ecosystemDigest:'LAB_ONLY:NOT_UNIVERSE_DATA'},
    morphology:{group:'INSECTS',bodyPlan:winged?'WINGED':'TETRAPOD',covering:'CHITINOUS',appendagePairs:pairs},
    ecology:{habitat:'SURFACE_CANOPY',nutrition:'OMNIVORE',niche:'SURFACE_CANOPY/OMNIVORE'},
    locomotion:winged?'FLYING':'WALKING',
    bodyLengthMeters:1.52+(vida38Hash38T(speciesId+'|height')%134)/100,
    pigmentation:{primaryColorHex:skin[0],secondaryColorHex:skin[1],
      pattern:(['SOLID','BANDS','MOTTLED','SPOTS'] as const)[vida38Hash38T(speciesId+'|pattern')%4]!,
      bioluminescent:false},
    adaptations:['SENSORY_ORIENTATION'],
    intelligence:{lineage:'INSECTOID',civilizationTier:'PRIMITIVE'} as NonNullable<Vida38SpeciesVisualContract['intelligence']>,
  };
  return Object.freeze({serial,contract,plan:deriveVida38PrimitiveInsectPlan38V(contract)});
}
export function buildVida38PrimitiveInsectoidGallery38V(
  count:Vida38PrimitiveInsectoidGallerySize38V,
):readonly Vida38PrimitiveInsectoidGalleryEntry38V[]{
  const pool=Array.from({length:480},(_,i)=>makeVida38PrimitiveInsectoidLaboratory38V(i+1));
  const selected:Vida38PrimitiveInsectoidGalleryEntry38V[]=[],used=new Set<number>();
  const seen={anatomy:new Set<string>(),culture:new Set<string>(),role:new Set<string>(),
    wear:new Set<string>(),arms:new Set<number>(),wings:new Set<number>(),equipment:new Set<string>()};
  const counts=new Map<string,number>();
  while(selected.length<count){
    let best:Vida38PrimitiveInsectoidGalleryEntry38V|null=null,bestScore=-Infinity;
    for(const entry of pool){
      if(used.has(entry.serial))continue;
      const p=entry.plan;
      const score=(seen.anatomy.has(p.archetype)?0:1100)+(seen.culture.has(p.culture)?0:900)+
        (seen.role.has(p.role)?0:850)+(seen.wear.has(p.wear)?0:1300)+
        (seen.arms.has(p.armCount)?0:360)+(seen.wings.has(p.wingPairs)?0:220)+
        (seen.equipment.has(p.accessories[0]!)?0:210)-
        (counts.get(p.wear)??0)*120-(counts.get(p.culture)??0)*60-entry.serial*.00001;
      if(score>bestScore){bestScore=score;best=entry;}
    }
    if(!best)throw new Error('38.2v: galería incompleta');
    selected.push(best);used.add(best.serial);
    const p=best.plan;
    seen.anatomy.add(p.archetype);seen.culture.add(p.culture);seen.role.add(p.role);seen.wear.add(p.wear);
    seen.arms.add(p.armCount);seen.wings.add(p.wingPairs);seen.equipment.add(p.accessories[0]!);
    counts.set(p.wear,(counts.get(p.wear)??0)+1);counts.set(p.culture,(counts.get(p.culture)??0)+1);
  }
  return Object.freeze(selected);
}
