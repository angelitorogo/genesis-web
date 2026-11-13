import { VIDA38_SPECIES_VISUAL_REVISION, type Vida38SpeciesVisualContract } from './vida38-species-visual-contract';
import { deriveVida38AdvancedReptilianPlan38S, vida38Hash38S, type Vida38AdvancedReptilianPlan38S } from './vida38-advanced-reptilian-plan-38-2s';

export type Vida38AdvancedReptilianGallerySize38S = 12 | 24;
export interface Vida38AdvancedReptilianGalleryEntry38S {
  readonly ordinal:number;
  readonly contract:Vida38SpeciesVisualContract;
  readonly plan:Vida38AdvancedReptilianPlan38S;
}

const SKIN:ReadonlyArray<readonly [string,string]>=[
  ['#6a7c57','#b7b28d'],['#596e5b','#9eb38b'],['#6f786c','#bbc0b0'],['#76856b','#c1b49e'],
  ['#5e7c7e','#9eb3bc'],['#7f6a61','#bda496'],['#66765b','#a4c38f'],['#6c6b7e','#b4b2c5'],
  ['#7a8160','#d2c38f'],['#5b7366','#9fbba9'],['#7d715f','#c9b095'],['#557985','#95b8c1'],
];
const PATTERNS:ReadonlyArray<Vida38SpeciesVisualContract['pigmentation']['pattern']>=[
  'SOLID','BANDS','SPOTS','MOTTLED'
];
function candidate(serial:number):Vida38AdvancedReptilianGalleryEntry38S {
  const speciesId=`LAB-38S-REPTILIAN-${String(serial).padStart(5,'0')}`;
  const appearanceFingerprint=`LAB_ONLY/38S/${speciesId}`;
  const skin=SKIN[vida38Hash38S(`${speciesId}|skin`)%SKIN.length]!;
  const contract:Vida38SpeciesVisualContract={
    revision:VIDA38_SPECIES_VISUAL_REVISION,
    speciesId,
    speciesName:`Reptiliano avanzado de laboratorio ${serial}`,
    variantSeedUint32:vida38Hash38S(`${speciesId}|seed`),
    appearanceFingerprint,
    provenance:{
      status:'CONFIRMED_SYSTEM_CT0',representation:'SCIENTIFIC_PROCEDURAL_RECONSTRUCTION',
      observedImageAvailable:false,bodyStorageKey:'LAB_ONLY:VIDA38:38S',ecosystemDigest:'LAB_ONLY:NOT_UNIVERSE_DATA',
    },
    morphology:{group:'REPTILES',bodyPlan:'TETRAPOD',covering:'SCALES',appendagePairs:2},
    ecology:{habitat:'SURFACE_WET_MARGIN',nutrition:'OMNIVORE',niche:'SURFACE_WET_MARGIN/OMNIVORE'},
    locomotion:'WALKING',
    bodyLengthMeters:1.48+(vida38Hash38S(`${speciesId}|height`)%142)/100,
    pigmentation:{
      primaryColorHex:skin[0],secondaryColorHex:skin[1],pattern:PATTERNS[vida38Hash38S(`${speciesId}|pattern`)%PATTERNS.length]!,bioluminescent:false,
    },
    adaptations:['SENSORY_ORIENTATION'],
    intelligence:{lineage:'REPTILIAN',civilizationTier:'ADVANCED'},
  };
  return Object.freeze({ordinal:serial,contract,plan:deriveVida38AdvancedReptilianPlan38S(contract)});
}

export function buildVida38AdvancedReptilianGallery38S(count:Vida38AdvancedReptilianGallerySize38S):readonly Vida38AdvancedReptilianGalleryEntry38S[]{
  const pool=Array.from({length:480},(_,i)=>candidate(i+1));
  const selected:Vida38AdvancedReptilianGalleryEntry38S[]=[];
  const used=new Set<number>();
  const seen={a:new Set<string>(),c:new Set<string>(),r:new Set<string>(),o:new Set<string>(),m:new Set<string>(),x:new Set<string>()};
  while(selected.length<count){
    let best:Vida38AdvancedReptilianGalleryEntry38S|null=null,bestScore=-Infinity;
    for(const entry of pool){
      if(used.has(entry.ordinal))continue;
      const p=entry.plan;
      const score=(seen.a.has(p.archetype)?0:1200)+(seen.c.has(p.culture)?0:900)+(seen.r.has(p.role)?0:950)
        +(seen.o.has(p.outfit)?0:1100)+(seen.m.has(p.material)?0:420)+(seen.x.has(p.accessory)?0:240)
        -selected.filter(it=>it.plan.outfit===p.outfit).length*90
        -selected.filter(it=>it.plan.role===p.role).length*75
        -selected.filter(it=>it.plan.culture===p.culture).length*60
        -entry.ordinal*.00001;
      if(score>bestScore){bestScore=score;best=entry;}
    }
    if(!best)throw new Error('38.2s: galería reptiliana avanzada incompleta');
    selected.push(best);used.add(best.ordinal);
    const p=best.plan;seen.a.add(p.archetype);seen.c.add(p.culture);seen.r.add(p.role);seen.o.add(p.outfit);seen.m.add(p.material);seen.x.add(p.accessory);
  }
  return Object.freeze(selected);
}
