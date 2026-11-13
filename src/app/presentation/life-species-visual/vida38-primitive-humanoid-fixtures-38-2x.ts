import {VIDA38_SPECIES_VISUAL_REVISION,type Vida38SpeciesVisualContract} from './vida38-species-visual-contract';
import {buildVida38HumanoidGallery38R} from './vida38-civilized-humanoid-fixtures-38-2r';
import {deriveVida38PrimitiveHumanoidPlan38X,hashVida38X,type Vida38PrimitiveHumanoidPlan38X} from './vida38-primitive-humanoid-plan-38-2x';
const VALID_COVERING=buildVida38HumanoidGallery38R(12)[0]!.contract.morphology.covering;
export type Vida38PrimitiveHumanoidGallerySize38X=12|24;
export interface Vida38PrimitiveHumanoidEntry38X {readonly serial:number;readonly contract:Vida38SpeciesVisualContract;readonly plan:Vida38PrimitiveHumanoidPlan38X;}
const SKINS:ReadonlyArray<readonly [string,string]>=[['#936c54','#bc977e'],['#977b69','#ceaa90'],['#665347','#a58470'],['#b68b76','#e4bcab'],['#6a5954','#a0897d'],['#ae856c','#dfb59f'],['#7d6b68','#b1a09d'],['#765645','#bc8a72'],['#6c7957','#9eab86'],['#5e8276','#93b9ab']];
export function makeVida38PrimitiveHumanoidLaboratory38X(serial:number):Vida38PrimitiveHumanoidEntry38X{
 if(!Number.isInteger(serial)||serial<1)throw new Error('38.2x: ordinal inválido');
 const speciesId=`LAB-38X-HUMANOID-${String(serial).padStart(5,'0')}`;
 const seed=hashVida38X(speciesId+'|seed');const skin=SKINS[hashVida38X(speciesId+'|skin')%SKINS.length]!;
 const contract:Vida38SpeciesVisualContract={revision:VIDA38_SPECIES_VISUAL_REVISION,speciesId,speciesName:`Humanoide primitivo de laboratorio ${serial}`,
  variantSeedUint32:seed,appearanceFingerprint:`LAB_ONLY/38X/${speciesId}`,
  provenance:{status:'CONFIRMED_SYSTEM_CT0',representation:'SCIENTIFIC_PROCEDURAL_RECONSTRUCTION',observedImageAvailable:false,bodyStorageKey:'LAB_ONLY:VIDA38:38X',ecosystemDigest:'LAB_ONLY:NOT_UNIVERSE_DATA'},
  morphology:{group:'HUMANOIDS',bodyPlan:'BIPED',covering:VALID_COVERING,appendagePairs:2},
  ecology:{habitat:'SURFACE_ROCK_SHELTER',nutrition:'OMNIVORE',niche:'SURFACE_ROCK_SHELTER/OMNIVORE'},locomotion:'WALKING',
  bodyLengthMeters:1.55+(hashVida38X(speciesId+'|height')%125)/100,
  pigmentation:{primaryColorHex:skin[0],secondaryColorHex:skin[1],pattern:(['SOLID','MOTTLED','SPOTS','BANDS'] as const)[hashVida38X(speciesId+'|pattern')%4]!,bioluminescent:false},
  adaptations:['SENSORY_ORIENTATION'],intelligence:{lineage:'HUMANOID',civilizationTier:'PRIMITIVE'} as NonNullable<Vida38SpeciesVisualContract['intelligence']>};
 return Object.freeze({serial,contract,plan:deriveVida38PrimitiveHumanoidPlan38X(contract)});
}
export function buildVida38PrimitiveHumanoidGallery38X(count:Vida38PrimitiveHumanoidGallerySize38X):readonly Vida38PrimitiveHumanoidEntry38X[]{
 const pool=Array.from({length:120},(_,i)=>makeVida38PrimitiveHumanoidLaboratory38X(i+1));
 const selected:Vida38PrimitiveHumanoidEntry38X[]=[],used=new Set<number>(),seenWear=new Set<string>(),seenCulture=new Set<string>(),seenRole=new Set<string>(),seenShape=new Set<string>();
 while(selected.length<count){let best:Vida38PrimitiveHumanoidEntry38X|null=null;let bestScore=-Infinity;
  for(const e of pool){if(used.has(e.serial))continue;const p=e.plan;
   const score=(seenWear.has(p.wear)?0:1300)+(seenCulture.has(p.culture)?0:850)+(seenRole.has(p.role)?0:750)+(seenShape.has(p.silhouette)?0:230)-e.serial*.0001;
   if(score>bestScore){bestScore=score;best=e;}
  }
  if(!best)throw new Error('38.2x: galería incompleta');selected.push(best);used.add(best.serial);seenWear.add(best.plan.wear);seenCulture.add(best.plan.culture);seenRole.add(best.plan.role);seenShape.add(best.plan.silhouette);
 }
 return Object.freeze(selected);
}
