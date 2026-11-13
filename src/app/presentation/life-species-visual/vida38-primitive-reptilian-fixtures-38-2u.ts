import { VIDA38_SPECIES_VISUAL_REVISION, type Vida38SpeciesVisualContract } from './vida38-species-visual-contract';
import { deriveVida38PrimitiveReptilianPlan38U, vida38PrimitiveHash38U, type Vida38PrimitiveReptilianPlan38U } from './vida38-primitive-reptilian-plan-38-2u';

export type Vida38PrimitiveReptilianGallerySize38U = 12|24;
export interface Vida38PrimitiveReptilianGalleryEntry38U {
  readonly serial:number;
  readonly contract:Vida38SpeciesVisualContract;
  readonly plan:Vida38PrimitiveReptilianPlan38U;
}

const SKINS:ReadonlyArray<readonly [string,string]>=[
  ['#6e6b59','#b0ad92'],['#78614d','#b29a7e'],['#556c5d','#8ca08f'],
  ['#635a6c','#9d95b1'],['#6f5449','#b08677'],['#577273','#8fb0b0'],
  ['#75684f','#bea47a'],['#4b6560','#86a18d'],['#6a6a73','#a8a7bb'],
  ['#7a5f55','#bd9386'],['#59614d','#96a089'],['#6f7161','#bab79c'],
];

export function makeVida38PrimitiveReptilianLaboratory38U(serial:number):Vida38PrimitiveReptilianGalleryEntry38U{
  if(!Number.isInteger(serial)||serial<1)throw new Error('38.2u: ordinal inválido');
  const speciesId=`LAB-38U-REPTILIAN-${String(serial).padStart(5,'0')}`;
  const appearanceFingerprint=`LAB_ONLY/38U/${speciesId}`;
  const skin=SKINS[vida38PrimitiveHash38U(speciesId+'|skin')%SKINS.length]!;
  const contract:Vida38SpeciesVisualContract={
    revision:VIDA38_SPECIES_VISUAL_REVISION,speciesId,
    speciesName:`Reptiliano primitivo de laboratorio ${serial}`,
    variantSeedUint32:vida38PrimitiveHash38U(speciesId+'|seed'),appearanceFingerprint,
    provenance:{status:'CONFIRMED_SYSTEM_CT0',representation:'SCIENTIFIC_PROCEDURAL_RECONSTRUCTION',
      observedImageAvailable:false,bodyStorageKey:'LAB_ONLY:VIDA38:38U',ecosystemDigest:'LAB_ONLY:NOT_UNIVERSE_DATA'},
    morphology:{group:'REPTILES',bodyPlan:'BIPED',covering:'SCALES',appendagePairs:2},
    ecology:{habitat:'SURFACE_ROCK_SHELTER',nutrition:'OMNIVORE',niche:'SURFACE_ROCK_SHELTER/OMNIVORE'},
    locomotion:'WALKING',
    bodyLengthMeters:1.58+(vida38PrimitiveHash38U(speciesId+'|height')%119)/100,
    pigmentation:{primaryColorHex:skin[0],secondaryColorHex:skin[1],
      pattern:(['SOLID','BANDS','MOTTLED','SPOTS'] as const)[vida38PrimitiveHash38U(speciesId+'|pattern')%4]!,
      bioluminescent:false},
    adaptations:['ARMORED_HIDE','SENSORY_ORIENTATION'],
    intelligence:{lineage:'REPTILIAN',civilizationTier:'PRIMITIVE'} as NonNullable<Vida38SpeciesVisualContract['intelligence']>,
  };
  return Object.freeze({serial,contract,plan:deriveVida38PrimitiveReptilianPlan38U(contract)});
}

export function buildVida38PrimitiveReptilianGallery38U(count:Vida38PrimitiveReptilianGallerySize38U):readonly Vida38PrimitiveReptilianGalleryEntry38U[]{
  const pool=Array.from({length:480},(_,i)=>makeVida38PrimitiveReptilianLaboratory38U(i+1));
  const selected:Vida38PrimitiveReptilianGalleryEntry38U[]=[],used=new Set<number>();
  const seen={wear:new Set<string>(),culture:new Set<string>(),role:new Set<string>(),silhouette:new Set<string>(),crest:new Set<string>(),acc:new Set<string>(),
    torso:new Set<string>(),shoulder:new Set<string>(),ornament:new Set<number>(),features:new Set<string>()};
  const counts=new Map<string,number>();
  while(selected.length<count){
    let best:Vida38PrimitiveReptilianGalleryEntry38U|null=null,bestScore=-Infinity;
    for(const entry of pool){
      if(used.has(entry.serial))continue;
      const p=entry.plan;
      const v=p.visual;
      const visualFeatures=[v.collar?'COLLAR':'NO_COLLAR',v.headpiece?'HEADPIECE':'NO_HEADPIECE',
        v.satchel?'SATCHEL':'NO_SATCHEL',v.staff?'STAFF':'NO_STAFF',v.beltDecor?'BELT_DECOR':'NO_BELT_DECOR'];
      const score=(seen.wear.has(p.wear)?0:1900)+(seen.culture.has(p.culture)?0:450)+(seen.role.has(p.role)?0:560)+
        (seen.silhouette.has(p.silhouette)?0:340)+(seen.crest.has(p.crest)?0:240)+(seen.acc.has(p.accessories[0]!)?0:180)+
        (seen.torso.has(v.torsoCoverage)?0:520)+(seen.shoulder.has(v.shoulderCoverage)?0:520)+
        (seen.ornament.has(Math.min(3,Math.floor(v.visibleOrnaments/4)))?0:360)+
        visualFeatures.reduce((sum,feature)=>sum+(seen.features.has(feature)?0:95),0)-
        (counts.get(p.wear)??0)*120-(counts.get(p.culture)??0)*60-entry.serial*.00001;
      if(score>bestScore){bestScore=score;best=entry;}
    }
    if(!best)throw new Error('38.2u: galería incompleta');
    selected.push(best);used.add(best.serial);
    const p=best.plan;
    seen.wear.add(p.wear);seen.culture.add(p.culture);seen.role.add(p.role);seen.silhouette.add(p.silhouette);seen.crest.add(p.crest);seen.acc.add(p.accessories[0]!);
    seen.torso.add(p.visual.torsoCoverage);seen.shoulder.add(p.visual.shoulderCoverage);
    seen.ornament.add(Math.min(3,Math.floor(p.visual.visibleOrnaments/4)));
    for(const feature of [p.visual.collar?'COLLAR':'NO_COLLAR',p.visual.headpiece?'HEADPIECE':'NO_HEADPIECE',
      p.visual.satchel?'SATCHEL':'NO_SATCHEL',p.visual.staff?'STAFF':'NO_STAFF',p.visual.beltDecor?'BELT_DECOR':'NO_BELT_DECOR'])seen.features.add(feature);
    counts.set(p.wear,(counts.get(p.wear)??0)+1);counts.set(p.culture,(counts.get(p.culture)??0)+1);
  }
  return Object.freeze(selected);
}
