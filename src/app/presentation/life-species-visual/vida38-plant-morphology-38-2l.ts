/** GENESIS 38.2l — reconstrucción vegetal; hipótesis VISUAL, no atributos VIDA nuevos. */
import type { Vida38SpeciesVisualContract } from './vida38-species-visual-contract';

export const VIDA38_PLANT_REVISION = 'VIDA.38.2l/plant-architecture/v1' as const;
export const VIDA38_PLANT_FORMS = ['HERB','SHRUB','TREE'] as const;
export type Vida38PlantForm38L = typeof VIDA38_PLANT_FORMS[number];
export const VIDA38_PLANT_ARCHETYPES = [
  'ROSETTE', 'GRASS_TUFT', 'BROADLEAF_HERB', 'FERN', 'SUCCULENT', 'SPIKE',
  'DENSE_BUSH', 'OPEN_SHRUB', 'FLOWERING_SHRUB', 'CANE_SHRUB', 'SPRAWLING_SHRUB',
  'ROUND_TREE', 'COLUMNAR_TREE', 'UMBRELLA_TREE', 'WEEPING_TREE', 'PALMIFORM_TREE',
  'TWISTED_TREE', 'CONICAL_TREE', 'SPREADING_TREE',
] as const;
export type Vida38PlantArchetype38L = typeof VIDA38_PLANT_ARCHETYPES[number];
export type Vida38PlantLeafShape38L = 'LANCEOLATE'|'OVATE'|'ROUND'|'NEEDLE'|'STRAP'|'LOBED'|'SUCCULENT';
export interface Vida38PlantMorphology38L {
  readonly revision: typeof VIDA38_PLANT_REVISION;
  readonly speciesId: string;
  readonly seed: number;
  readonly fingerprint: string;
  readonly sourceHeightMeters: number;
  readonly form: Vida38PlantForm38L;
  readonly archetype: Vida38PlantArchetype38L;
  readonly leafShape: Vida38PlantLeafShape38L;
  readonly stemCount: number;
  readonly height: number;
  readonly stemRadius: number;
  readonly trunkFraction: number;
  readonly canopyRadius: number;
  readonly canopyDensity: number;
  readonly spread: number;
  readonly curvature: number;
  readonly droop: number;
  readonly branchLevel: number;
  readonly leafLength: number;
  readonly leafWidth: number;
  readonly leafInclination: number;
  readonly flowering: 'NONE'|'FLOWERS'|'SPIKES'|'CAPSULES';
  readonly reproductiveDensity: number;
  readonly habitat: Vida38SpeciesVisualContract['ecology']['habitat'];
  readonly sourceBodyPlan: Vida38SpeciesVisualContract['morphology']['bodyPlan'];
  readonly provenance: 'ARTISTIC_HYPOTHESIS_NOT_OBSERVED';
}
function hash32(s: string): number { let h=2166136261; for(let i=0;i<s.length;i++) h=Math.imul(h^s.charCodeAt(i),16777619)>>>0;return h>>>0; }
function unit(seed:number,salt:number):number {let x=(seed^Math.imul(salt+173,0x9e3779b9))>>>0; x^=x>>>16; x=Math.imul(x,0x7feb352d); x^=x>>>15;x=Math.imul(x,0x846ca68b);x^=x>>>16;return (x>>>0)/4294967295;}
const range=(s:number,k:number,lo:number,hi:number)=>lo+(hi-lo)*unit(s,k);
const clamp=(n:number,lo:number,hi:number)=>Math.max(lo,Math.min(hi,n));
const HERBS = ['ROSETTE','GRASS_TUFT','BROADLEAF_HERB','FERN','SUCCULENT','SPIKE'] as const;
const SHRUBS = ['DENSE_BUSH','OPEN_SHRUB','FLOWERING_SHRUB','CANE_SHRUB','SPRAWLING_SHRUB'] as const;
const TREES = ['ROUND_TREE','COLUMNAR_TREE','UMBRELLA_TREE','WEEPING_TREE','PALMIFORM_TREE','TWISTED_TREE','CONICAL_TREE','SPREADING_TREE'] as const;

/** El valor VIDA se conserva. El porte físico se clasifica antes de normalizar el visor. */
export function deriveVida38PlantMorphology38L(contract:Vida38SpeciesVisualContract,debugArchetype?:Vida38PlantArchetype38L):Vida38PlantMorphology38L {
  if(contract.morphology.group!=='PLANTS_TREES' || !(contract.bodyLengthMeters>0)) throw new Error('38.2l: especie vegetal VIDA inválida');
  const meters=contract.bodyLengthMeters;
  const form:Vida38PlantForm38L=meters<=1?'HERB':meters<=2?'SHRUB':'TREE';
  const seed=hash32(`${VIDA38_PLANT_REVISION}|${contract.speciesId}|${contract.variantSeedUint32}|${contract.ecology.habitat}|${contract.ecology.niche}|${contract.morphology.bodyPlan}|${contract.adaptations.slice().sort().join(',')}`);
  const choices:readonly Vida38PlantArchetype38L[]=form==='HERB'?HERBS:form==='SHRUB'?SHRUBS:TREES;
  if(debugArchetype && !choices.includes(debugArchetype)) throw new Error('38.2l: arquetipo incompatible con el porte VIDA');
  let archetype:Vida38PlantArchetype38L=debugArchetype??choices[Math.min(choices.length-1,Math.floor(unit(seed,2)*choices.length))]!;
  if(!debugArchetype && form==='HERB' && contract.morphology.bodyPlan==='FROND' && unit(seed,3)<.58) archetype='FERN';
  const wet=contract.ecology.habitat==='SURFACE_WET_MARGIN';
  const rocky=contract.ecology.habitat==='SURFACE_ROCK_SHELTER';
  const canopy=contract.ecology.habitat==='SURFACE_CANOPY';
  const herb=form==='HERB',shrub=form==='SHRUB',tree=form==='TREE';
  const palm=archetype==='PALMIFORM_TREE', column=archetype==='COLUMNAR_TREE',umbrella=archetype==='UMBRELLA_TREE';
  const weeping=archetype==='WEEPING_TREE',spread=archetype==='SPREADING_TREE'||archetype==='SPRAWLING_SHRUB';
  const dense=archetype==='DENSE_BUSH'||archetype==='ROUND_TREE'||archetype==='CONICAL_TREE';
  const rosette=archetype==='ROSETTE'||archetype==='SUCCULENT';
  const leafStyles:readonly Vida38PlantLeafShape38L[]=['LANCEOLATE','OVATE','ROUND','NEEDLE','STRAP','LOBED','SUCCULENT'];
  const leafShape:Vida38PlantLeafShape38L = rosette?'SUCCULENT':archetype==='GRASS_TUFT'||palm?'STRAP':archetype==='FERN'?'LANCEOLATE':archetype==='SPIKE'||column?'NEEDLE':leafStyles[Math.floor(unit(seed,11)*leafStyles.length)]!;
  const flowering:Vida38PlantMorphology38L['flowering'] = unit(seed,13)<(archetype==='FLOWERING_SHRUB'?.85:.34)?'FLOWERS':unit(seed,14)<.13?'SPIKES':unit(seed,15)<.12?'CAPSULES':'NONE';
  const canopyRadius=(herb?range(seed,21,.45,.85):shrub?range(seed,21,.75,1.10):range(seed,21,.70,1.22)) * (column?.44:umbrella?1.48:spread?1.38:palm?.96:1) * (rocky?.86:1);
  const stemCount=tree?(unit(seed,31)>.85?2:1):shrub?2+Math.floor(unit(seed,31)*5):rosette?5+Math.floor(unit(seed,31)*6):archetype==='GRASS_TUFT'?9+Math.floor(unit(seed,31)*7):2+Math.floor(unit(seed,31)*5);
  return Object.freeze({
    revision:VIDA38_PLANT_REVISION,speciesId:contract.speciesId,seed,
    fingerprint:`${VIDA38_PLANT_REVISION}:${seed.toString(16).padStart(8,'0')}:${archetype}`,
    sourceHeightMeters:meters,form,archetype,leafShape,stemCount,height:2.18,
    stemRadius:tree?range(seed,35,.075,.17)*(rocky?1.2:1):shrub?range(seed,35,.026,.055):range(seed,35,.012,.033),
    trunkFraction:tree?(palm?.82:umbrella?.70:weeping?.62:range(seed,41,.39,.64)):shrub?range(seed,41,.1,.24):range(seed,41,.07,.18),
    canopyRadius:clamp(canopyRadius,.2,1.8),
    canopyDensity:clamp(range(seed,43,.62,1.36)*(wet?1.15:rocky?.76:1)*(dense?1.26:1),.42,1.65),
    spread:clamp(range(seed,45,.75,1.25)*(spread?1.25:column?.50:1),.35,1.65),
    curvature:range(seed,47,-.16,.16)+(rocky?.16:0),
    droop:weeping?range(seed,49,.55,.85):palm?range(seed,49,.3,.55):range(seed,49,-.07,.21),
    branchLevel:tree?(palm?1:archetype==='TWISTED_TREE'?3:2):shrub?2:1,
    leafLength:clamp(range(seed,51,.14,.32)*(wet?1.2:1)*(leafShape==='NEEDLE'?.64:leafShape==='STRAP'?1.55:1),.06,.55),
    leafWidth:clamp(range(seed,53,.34,.76)*(leafShape==='NEEDLE'?.17:leafShape==='STRAP'?.4:leafShape==='SUCCULENT'?1.4:1),.055,1.2),
    leafInclination:range(seed,55,.26,1.02),flowering,
    reproductiveDensity:flowering==='NONE'?0:range(seed,57,.3,.9),
    habitat:contract.ecology.habitat,sourceBodyPlan:contract.morphology.bodyPlan,
    provenance:'ARTISTIC_HYPOTHESIS_NOT_OBSERVED',
  });
}
