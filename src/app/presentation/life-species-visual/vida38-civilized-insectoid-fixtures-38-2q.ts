/** Muestras de laboratorio exclusivamente artísticas y deterministas. Nunca persistidas. */
import { VIDA38_SPECIES_VISUAL_REVISION, type Vida38SpeciesVisualContract } from './vida38-species-visual-contract';
import { deriveVida38CivilizedInsectoidPlan38Q, type Vida38CivilizedInsectoidPlan38Q } from './vida38-civilized-insectoid-preview-38-2q';
export type Vida38InsectoidGallerySize38Q=12|24;
export interface Vida38InsectoidGalleryEntry38Q {
  readonly serial:number;
  readonly contract:Vida38SpeciesVisualContract;
  readonly plan:Vida38CivilizedInsectoidPlan38Q;
}
function hash32(s:string):number{
  let h=2166136261;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619)>>>0;return h>>>0;
}
const skins:ReadonlyArray<readonly [string,string]>=[
  ['#486a73','#799b9f'],['#3d7567','#66a18e'],['#536b58','#8ba18c'],
  ['#637c8b','#8badb7'],['#405662','#839aa6'],['#66888c','#a9c5bc'],
  ['#5b715e','#9bab8a'],['#567385','#8cafb9'],['#466e6d','#9dc0b7'],
  ['#50616d','#a7b4c0'],['#5e7a7c','#8faeab'],['#40627f','#8aadc0'],
];
function candidate(serial:number):Vida38InsectoidGalleryEntry38Q{
  const speciesId=`LAB-38Q-INSECTOID-${String(serial).padStart(5,'0')}`;
  const appearanceFingerprint=`lab38q:v1:${speciesId}`;
  const skin=skins[hash32(speciesId)%skins.length]!;
  const extraPairs=hash32('pairs:'+speciesId)%5===0?4:3;
  const wingSeed=hash32('flight:'+speciesId)%6;
  const bodyPlan=wingSeed<=1?'WINGED':'TETRAPOD';
  const locomotion=wingSeed===0?'FLYING':'WALKING';
  const adaptations=['SENSORY_ORIENTATION'];
  if(bodyPlan==='WINGED')adaptations.push('AERIAL_MANEUVERING');
  if(hash32('sting:'+speciesId)%3===0)adaptations.push('VENOMOUS_STING');
  const contract:Vida38SpeciesVisualContract={
    revision:VIDA38_SPECIES_VISUAL_REVISION,
    speciesId,speciesName:`Insectoide de laboratorio ${serial}`,
    variantSeedUint32:hash32('seed:'+speciesId),appearanceFingerprint,
    provenance:{status:'CONFIRMED_SYSTEM_CT0',representation:'SCIENTIFIC_PROCEDURAL_RECONSTRUCTION',
      observedImageAvailable:false,bodyStorageKey:'LAB_ONLY:VIDA38:38Q',ecosystemDigest:'LAB_ONLY:NOT_UNIVERSE_DATA'},
    morphology:{group:'INSECTS',bodyPlan,covering:'CHITINOUS',appendagePairs:extraPairs},
    ecology:{habitat:'SURFACE_CANOPY',nutrition:'OMNIVORE',niche:'SURFACE_CANOPY/OMNIVORE'},
    locomotion,bodyLengthMeters:1.75+(hash32('length:'+speciesId)%146)/100,
    pigmentation:{primaryColorHex:skin[0],secondaryColorHex:skin[1],pattern:'BANDS',bioluminescent:false},
    adaptations,
    intelligence:{lineage:'INSECTOID',civilizationLevel:'VERY_ADVANCED'} as unknown as NonNullable<Vida38SpeciesVisualContract['intelligence']>,
  };
  const plan=deriveVida38CivilizedInsectoidPlan38Q(contract);
  return Object.freeze({serial,contract,plan});
}
/** Greedy: busca cobertura de anatomía, cultura, rol, ropa y accesorio. */
export function buildVida38InsectoidGallery38Q(count:Vida38InsectoidGallerySize38Q):readonly Vida38InsectoidGalleryEntry38Q[]{
  const pool=Array.from({length:400},(_,i)=>candidate(i+1));
  const picked:Vida38InsectoidGalleryEntry38Q[]=[],used=new Set<number>();
  const seen={anatomy:new Set<string>(),culture:new Set<string>(),role:new Set<string>(),wardrobe:new Set<string>(),material:new Set<string>(),accessory:new Set<string>()};
  while(picked.length<count){
    let best:Vida38InsectoidGalleryEntry38Q|null=null,scoreBest=-Infinity;
    for(const e of pool){
      if(used.has(e.serial))continue;
      const p=e.plan;
      const score=(seen.anatomy.has(p.archetype)?0:1200)+(seen.culture.has(p.culture)?0:1000)
        +(seen.role.has(p.role)?0:800)+(seen.wardrobe.has(p.wardrobe)?0:900)
        +(seen.material.has(p.materialKind)?0:360)+(seen.accessory.has(p.accessory)?0:260)
        -picked.filter(item=>item.plan.archetype===p.archetype).length*80
        -picked.filter(item=>item.plan.culture===p.culture).length*65
        -e.serial*.00001;
      if(score>scoreBest){scoreBest=score;best=e;}
    }
    if(!best)throw new Error('38.2q: galería incompleta');
    picked.push(best);used.add(best.serial);
    seen.anatomy.add(best.plan.archetype);seen.culture.add(best.plan.culture);
    seen.role.add(best.plan.role);seen.wardrobe.add(best.plan.wardrobe);
    seen.material.add(best.plan.materialKind);seen.accessory.add(best.plan.accessory);
  }
  return Object.freeze(picked);
}
