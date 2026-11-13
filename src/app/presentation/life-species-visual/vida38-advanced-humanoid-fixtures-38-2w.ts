import {VIDA38_SPECIES_VISUAL_REVISION,type Vida38SpeciesVisualContract} from './vida38-species-visual-contract';
import {deriveVida38AdvancedHumanoidPlan38W,hashVida38W,type Vida38AdvancedHumanoidPlan38W} from './vida38-advanced-humanoid-plan-38-2w';
import {buildVida38HumanoidGallery38R} from './vida38-civilized-humanoid-fixtures-38-2r';
/** Cobertura válida tomada de la base humanoide 38.2r aprobada, no un literal nuevo. */
const HUMANOID_COVERING_38W=buildVida38HumanoidGallery38R(12)[0]!.contract.morphology.covering;
export type Vida38AdvancedHumanoidGallerySize38W=12|24;
export interface Vida38AdvancedHumanoidEntry38W{readonly serial:number;readonly contract:Vida38SpeciesVisualContract;readonly plan:Vida38AdvancedHumanoidPlan38W;}
const SKINS:ReadonlyArray<readonly [string,string]>=[['#936c54','#bc977e'],['#977b69','#ceaa90'],['#665347','#a58470'],['#b68b76','#e4bcab'],['#6a5954','#a0897d'],['#ae856c','#dfb59f'],['#7d6b68','#b1a09d'],['#765645','#bc8a72']];
export function makeVida38AdvancedHumanoidLaboratory38W(serial:number):Vida38AdvancedHumanoidEntry38W{
 if(!Number.isInteger(serial)||serial<1)throw new Error('38.2w: serial inválido');
 const speciesId=`LAB-38W-HUMANOID-${String(serial).padStart(5,'0')}`;
 const skin=SKINS[hashVida38W(speciesId+'skin')%SKINS.length]!;
 const contract:Vida38SpeciesVisualContract={revision:VIDA38_SPECIES_VISUAL_REVISION,speciesId,
 speciesName:`Humanoide avanzado de laboratorio ${serial}`,variantSeedUint32:hashVida38W(speciesId+'seed'),appearanceFingerprint:`LAB_ONLY/38W/${speciesId}`,
 provenance:{status:'CONFIRMED_SYSTEM_CT0',representation:'SCIENTIFIC_PROCEDURAL_RECONSTRUCTION',observedImageAvailable:false,bodyStorageKey:'LAB_ONLY:VIDA38:38W',ecosystemDigest:'LAB_ONLY:NOT_UNIVERSE_DATA'},
 morphology:{group:'HUMANOIDS',bodyPlan:'BIPED',covering:HUMANOID_COVERING_38W,appendagePairs:2},ecology:{habitat:'SURFACE_ROCK_SHELTER',nutrition:'OMNIVORE',niche:'SURFACE_ROCK_SHELTER/OMNIVORE'},
 locomotion:'WALKING',bodyLengthMeters:1.55+(hashVida38W(speciesId+'height')%125)/100,
 pigmentation:{primaryColorHex:skin[0],secondaryColorHex:skin[1],pattern:(['SOLID','MOTTLED','SPOTS','BANDS'] as const)[hashVida38W(speciesId+'pattern')%4]!,bioluminescent:false},
 adaptations:['SENSORY_ORIENTATION'],intelligence:{lineage:'HUMANOID',civilizationTier:'ADVANCED'} as NonNullable<Vida38SpeciesVisualContract['intelligence']>};
 return Object.freeze({serial,contract,plan:deriveVida38AdvancedHumanoidPlan38W(contract)});
}
export function buildVida38AdvancedHumanoidGallery38W(count:Vida38AdvancedHumanoidGallerySize38W):readonly Vida38AdvancedHumanoidEntry38W[]{
 const pool=Array.from({length:420},(_,i)=>makeVida38AdvancedHumanoidLaboratory38W(i+1));const selected:Vida38AdvancedHumanoidEntry38W[]=[],used=new Set<number>();
 const seen={wear:new Set<string>(),culture:new Set<string>(),role:new Set<string>(),frame:new Set<string>()};const frequency=new Map<string,number>();
 while(selected.length<count){let best:Vida38AdvancedHumanoidEntry38W|null=null,score=-Infinity;
 for(const e of pool){if(used.has(e.serial))continue;const p=e.plan;const s=(seen.wear.has(p.wear)?0:1400)+(seen.culture.has(p.culture)?0:750)+(seen.role.has(p.role)?0:850)+(seen.frame.has(p.frame)?0:220)-(frequency.get(p.wear)??0)*150-e.serial*.00001;
 if(s>score){score=s;best=e;}}
 if(!best)throw new Error('38.2w: faltan ejemplares');selected.push(best);used.add(best.serial);
 const p=best.plan;seen.wear.add(p.wear);seen.culture.add(p.culture);seen.role.add(p.role);seen.frame.add(p.frame);frequency.set(p.wear,(frequency.get(p.wear)??0)+1);
 }return Object.freeze(selected);
}
