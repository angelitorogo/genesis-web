/**
 * GENESIS 38.2k — contrato anatómico de reconstrucción artística de insectos.
 * No altera VIDA, ni presupone órganos observados. Solo se usa tras 38.1 CT-0.
 */
import type { Vida38SpeciesVisualContract } from './vida38-species-visual-contract';

export const VIDA38_INSECT_REVISION = 'VIDA.38.2k/insect-morphology/v1' as const;
export const VIDA38_INSECT_ARCHETYPES = [
  'BEETLE', 'MANTIS', 'ANT', 'WASP', 'DRAGONFLY', 'GRASSHOPPER',
  'CICADA', 'COCKROACH', 'STICK', 'LARVIFORM',
] as const;
export type Vida38InsectArchetype = (typeof VIDA38_INSECT_ARCHETYPES)[number];
export type Vida38InsectWingStyle = 'NONE' | 'MEMBRANE' | 'LONG' | 'SWEPT' | 'ELYTRA';
export type Vida38InsectAntennaStyle = 'FILIFORM' | 'CLUBBED' | 'FEATHERED' | 'CURVED';
export type Vida38InsectMouthType = 'MANDIBLES' | 'RAPTORIAL' | 'PROBOSCIS' | 'DISCREET';
export type Vida38InsectEyeType = 'PAIR' | 'COMPOUND_LARGE' | 'MULTIPLE_OCELLI';

export interface Vida38InsectMorphology38K {
  readonly revision: typeof VIDA38_INSECT_REVISION;
  readonly speciesId: string;
  readonly identitySeed: number;
  readonly fingerprint: string;
  readonly sourceLengthMeters: number;
  readonly provenance: 'ARTISTIC_HYPOTHESIS_NOT_OBSERVED';
  readonly archetype: Vida38InsectArchetype;
  readonly bodyLength: number;
  readonly abdomenLength: number;
  readonly abdomenWidth: number;
  readonly abdomenHeight: number;
  readonly thoraxSize: number;
  readonly headSize: number;
  readonly headAspect: number;
  readonly waistWidth: number;
  readonly bodyElevation: number;
  readonly headOffsetY: number;
  readonly abdomenTaper: number;
  readonly segmentation: number;
  readonly armored: number;
  readonly legPairs: number;
  readonly legReach: number;
  readonly legThickness: number;
  readonly legSpecialization: 'RUNNER' | 'RAPTORIAL' | 'JUMPER' | 'DIGGER' | 'CLIMBER' | 'GENERAL';
  readonly wingPairs: 0 | 1 | 2;
  readonly wingStyle: Vida38InsectWingStyle;
  readonly wingSpan: number;
  readonly wingChord: number;
  readonly wingSweep: number;
  readonly antennaStyle: Vida38InsectAntennaStyle;
  readonly antennaLength: number;
  readonly eyeType: Vida38InsectEyeType;
  readonly eyeScale: number;
  readonly extraOcelli: number;
  readonly mouthType: Vida38InsectMouthType;
  readonly mouthScale: number;
  readonly bristleDensity: number;
}

// [largo abdomen, ancho abdomen, alto abdomen, tórax, cabeza, cintura, altura, patas, envergadura, ojo]
type Shape = readonly [number,number,number,number,number,number,number,number,number,number];
const SHAPES: Readonly<Record<Vida38InsectArchetype,Shape>> = {
  BEETLE:      [.87,1.64,1.65,.84,.73,.98,.81,.75,.64,.82],
  MANTIS:      [1.26,.47,.64,.62,1.08,.48,1.22,1.13,.72,1.12],
  ANT:         [.83,.92,1.06,.57,1.04,.26,.99,1.06,.36,.86],
  WASP:        [1.20,.68,.66,.75,.72,.24,1.13,1.25,1.27,1.04],
  DRAGONFLY:   [1.86,.43,.55,.89,1.12,.71,1.10,.78,1.92,1.50],
  GRASSHOPPER: [1.19,.93,.92,1.10,.80,.95,.91,1.50,1.02,.89],
  CICADA:      [.86,1.10,.92,1.48,1.32,1.09,.91,.73,1.54,1.16],
  COCKROACH:   [1.72,1.35,.46,.75,.62,1.07,.47,1.08,1.18,.82],
  STICK:       [2.40,.24,.33,.37,.46,.73,1.26,1.53,.41,.73],
  LARVIFORM:   [1.52,1.48,1.31,.42,.69,1.23,.37,.33,.0,.78],
};
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
function fnv(s:string):number{let h=2166136261;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619)>>>0;return h>>>0;}
function unit(s:number,c:number):number{let x=(s^Math.imul(c+193,0x9e3779b9))>>>0;x^=x>>>16;x=Math.imul(x,0x7feb352d);x^=x>>>15;x=Math.imul(x,0x846ca68b);x^=x>>>16;return(x>>>0)/4294967295;}
function between(s:number,c:number,a:number,b:number):number{return a+(b-a)*unit(s,c);}

export function deriveVida38InsectMorphology38K(
  contract:Vida38SpeciesVisualContract,
  /** Solo auditorías/galería; no utilizar para generar una especie de GENESIS. */
  debugArchetype?:Vida38InsectArchetype,
):Vida38InsectMorphology38K {
  if(contract.morphology.group!=='INSECTS')throw new Error('38.2k: solo insectos de contrato confirmado');
  const seed=fnv(`${VIDA38_INSECT_REVISION}|${contract.speciesId}|${contract.variantSeedUint32}|${contract.ecology.habitat}|${contract.ecology.nutrition}|${contract.ecology.niche}|${contract.locomotion}|${contract.morphology.bodyPlan}|${contract.morphology.appendagePairs}|${[...contract.adaptations].sort().join(',')}`);
  const archetype=debugArchetype??VIDA38_INSECT_ARCHETYPES[Math.min(9,Math.floor(unit(seed,1)*10))]!;
  const a=SHAPES[archetype];
  const rand=(i:number,s:number,lo:number,hi:number)=>a[i]!*between(seed,s,lo,hi);
  const predator=contract.ecology.nutrition==='PREDATOR';
  const wet=contract.ecology.habitat==='SURFACE_WET_MARGIN';
  const canopy=contract.ecology.habitat==='SURFACE_CANOPY';
  const flying=contract.locomotion==='FLYING';
  const wingBody=contract.morphology.bodyPlan==='WINGED';
  const wingsPermitted=flying||wingBody;
  // No introducir pares de patas ajenos al contrato 38.1. Dos pares en una
  // criatura que lo especifique son una hipótesis visual incompleta, no seis.
  const legPairs=Math.max(0,Math.min(7,Math.trunc(contract.morphology.appendagePairs)));
  const wingPairs:0|1|2=!wingsPermitted?0:archetype==='LARVIFORM'?0:
    (archetype==='DRAGONFLY'||archetype==='CICADA')?2:
    unit(seed,14)>.33?2:1;
  const wingStyle:Vida38InsectWingStyle=wingPairs===0?'NONE':archetype==='BEETLE'?'ELYTRA':
    archetype==='DRAGONFLY'?'LONG':archetype==='WASP'?'SWEPT':
    ['COCKROACH','GRASSHOPPER'].includes(archetype)&&unit(seed,15)>.35?'ELYTRA':'MEMBRANE';
  const legSpecialization:Vida38InsectMorphology38K['legSpecialization']=
    archetype==='MANTIS'?'RAPTORIAL':archetype==='GRASSHOPPER'?'JUMPER':
    contract.adaptations.includes('EXTERNAL_ARMOR')&&unit(seed,16)>.60?'DIGGER':
    canopy?'CLIMBER':['STICK','COCKROACH','WASP'].includes(archetype)?'RUNNER':'GENERAL';
  const mouthType:Vida38InsectMouthType=predator?(archetype==='MANTIS'?'RAPTORIAL':'MANDIBLES'):
    contract.ecology.nutrition==='HERBIVORE'&&unit(seed,18)>.6?'PROBOSCIS':
    unit(seed,19)>.68?'DISCREET':'MANDIBLES';
  const antennaStyle:Vida38InsectAntennaStyle=['FEATHERED','CURVED','FILIFORM','CLUBBED'][Math.floor(unit(seed,21)*4)] as Vida38InsectAntennaStyle;
  const eyeType:Vida38InsectEyeType=archetype==='DRAGONFLY'||archetype==='CICADA'?'COMPOUND_LARGE':
    unit(seed,23)>.60?'MULTIPLE_OCELLI':'PAIR';
  return Object.freeze({
    revision:VIDA38_INSECT_REVISION,speciesId:contract.speciesId,identitySeed:seed,
    fingerprint:`${VIDA38_INSECT_REVISION}:${seed.toString(16).padStart(8,'0')}:${archetype}`,
    sourceLengthMeters:contract.bodyLengthMeters,
    provenance:'ARTISTIC_HYPOTHESIS_NOT_OBSERVED',archetype,
    bodyLength:clamp(rand(0,26,.85,1.16),.75,2.6),
    abdomenLength:clamp(rand(0,27,.72,1.20),.70,2.70),
    abdomenWidth:clamp(rand(1,28,.78,1.28),.20,1.73),
    abdomenHeight:clamp(rand(2,29,.78,1.29),.30,1.82),
    thoraxSize:clamp(rand(3,30,.81,1.20),.37,1.50),
    headSize:clamp(rand(4,31,.76,1.29)*(predator?1.08:1),.42,1.57),
    headAspect:between(seed,32,.72,1.37),waistWidth:clamp(rand(5,33,.84,1.2),.26,1.35),
    bodyElevation:clamp(rand(6,34,.82,1.21)*(wet?.89:1),.30,1.41),
    headOffsetY:between(seed,36,-.065,.12),
    abdomenTaper:between(seed,37,.35,1.25),
    segmentation:Math.floor(between(seed,38,4,9)),
    armored:archetype==='BEETLE'||archetype==='COCKROACH'?between(seed,39,.67,1):
      contract.adaptations.includes('EXTERNAL_ARMOR')?between(seed,40,.68,1):between(seed,41,.05,.45),
    legPairs,legReach:clamp(rand(7,43,.80,1.26),.36,1.91),legThickness:between(seed,44,.79,1.31),
    legSpecialization,wingPairs,wingStyle,
    wingSpan:clamp(rand(8,45,.8,1.23),.03,2.55),
    wingChord:between(seed,46,.59,1.29),wingSweep:between(seed,47,-.24,.34),
    antennaStyle,antennaLength:between(seed,48,.20,1.09)*(archetype==='STICK'?1.54:1),
    eyeType,eyeScale:clamp(rand(9,49,.80,1.23),.58,2.12),
    extraOcelli:eyeType==='MULTIPLE_OCELLI'?1+Math.floor(unit(seed,50)*4):0,
    mouthType,mouthScale:predator?between(seed,51,.86,1.48):between(seed,52,.43,.94),
    bristleDensity:between(seed,53,.02,contract.morphology.covering==='CHITINOUS'?.52:.20),
  });
}
