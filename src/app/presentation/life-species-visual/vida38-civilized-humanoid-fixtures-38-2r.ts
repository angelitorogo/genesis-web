/** Contratos de galería 38.2r: muestras ficticias reproducibles, nunca guardadas en VIDA. */
import { VIDA38_SPECIES_VISUAL_REVISION, type Vida38SpeciesVisualContract } from './vida38-species-visual-contract';
import { deriveVida38CivilHumanoidPlan38R,vida38Hash38R,type Vida38CivilHumanoidPlan38R } from './vida38-civilized-humanoid-plan-38-2r';
export type Vida38HumanoidGallerySize38R=12|24;
export interface Vida38HumanoidGalleryEntry38R {
  readonly ordinal:number;
  readonly contract:Vida38SpeciesVisualContract;
  readonly plan:Vida38CivilHumanoidPlan38R;
}
const SKIN:ReadonlyArray<readonly [string,string]>=[
  ['#7e7d91','#b6a8b5'],['#68898c','#b2c2b9'],['#a4957f','#d4baad'],
  ['#757d8f','#abb7be'],['#706d77','#aca6a4'],['#638b81','#b5c3ba'],
  ['#9c8278','#d2ad9f'],['#5d747d','#90aeb1'],['#8d8b74','#b8be99'],
  ['#816d82','#b8a1bd'],['#586876','#a5abb2'],['#998e8b','#c8c5b9'],
];
function candidate(serial:number):Vida38HumanoidGalleryEntry38R {
  const speciesId=`LAB-38R-HUMANOID-${String(serial).padStart(5,'0')}`;
  const fingerprint=`LAB_ONLY/38R/${speciesId}`;
  const skin=SKIN[vida38Hash38R(`${speciesId}|skin`)%SKIN.length]!;
  const contract:Vida38SpeciesVisualContract={
    revision:VIDA38_SPECIES_VISUAL_REVISION,speciesId,
    speciesName:`Humanoide de laboratorio ${serial}`,
    variantSeedUint32:vida38Hash38R(`${speciesId}|seed`),appearanceFingerprint:fingerprint,
    provenance:{status:'CONFIRMED_SYSTEM_CT0',representation:'SCIENTIFIC_PROCEDURAL_RECONSTRUCTION',
      observedImageAvailable:false,bodyStorageKey:'LAB_ONLY:VIDA38:38R',ecosystemDigest:'LAB_ONLY:NOT_UNIVERSE_DATA'},
    morphology:{group:'HUMANOIDS',bodyPlan:'BIPED',covering:'LEATHERY',appendagePairs:2},
    ecology:{habitat:'SURFACE_WET_MARGIN',nutrition:'OMNIVORE',niche:'SURFACE_WET_MARGIN/OMNIVORE'},
    locomotion:'WALKING',bodyLengthMeters:1.55+(vida38Hash38R(`${speciesId}|height`)%171)/100,
    pigmentation:{primaryColorHex:skin[0],secondaryColorHex:skin[1],pattern:'BANDS',bioluminescent:false},
    adaptations:['SENSORY_ORIENTATION'],
    intelligence:{lineage:'HUMANOID',civilizationTier:'VERY_ADVANCED'},
  };
  return Object.freeze({ordinal:serial,contract,plan:deriveVida38CivilHumanoidPlan38R(contract)});
}
export function buildVida38HumanoidGallery38R(count:Vida38HumanoidGallerySize38R):readonly Vida38HumanoidGalleryEntry38R[]{
  const pool=Array.from({length:640},(_,i)=>candidate(i+1));
  const selected:Vida38HumanoidGalleryEntry38R[]=[],used=new Set<number>();
  const seen={a:new Set<string>(),c:new Set<string>(),r:new Set<string>(),g:new Set<string>(),m:new Set<string>(),x:new Set<string>()};
  while(selected.length<count){
    let best:Vida38HumanoidGalleryEntry38R|null=null,bestScore=-Infinity;
    for(const entry of pool){
      if(used.has(entry.ordinal))continue;
      const p=entry.plan;
      const score=(seen.a.has(p.archetype)?0:2200)+(seen.c.has(p.culture)?0:1800)
        +(seen.r.has(p.role)?0:950)+(seen.g.has(p.garment)?0:1700)
        +(seen.m.has(p.material)?0:520)+(seen.x.has(p.accessory)?0:320)
        -selected.filter(it=>it.plan.garment===p.garment).length*110
        -selected.filter(it=>it.plan.culture===p.culture).length*90
        -entry.ordinal*.00001;
      if(score>bestScore){bestScore=score;best=entry;}
    }
    if(!best)throw new Error('38.2r: galería incompleta');
    selected.push(best);used.add(best.ordinal);
    const p=best.plan;seen.a.add(p.archetype);seen.c.add(p.culture);seen.r.add(p.role);
    seen.g.add(p.garment);seen.m.add(p.material);seen.x.add(p.accessory);
  }
  return Object.freeze(selected);
}
