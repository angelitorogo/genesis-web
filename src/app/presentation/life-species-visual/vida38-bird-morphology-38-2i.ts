/** GENESIS 38.2i.a — refinamiento aviforme hipotética, sin alterar VIDA. */
import type { Vida38SpeciesVisualContract } from './vida38-species-visual-contract';

export const VIDA38_BIRD_REVISION='VIDA.38.2i.a/bird-morphology/v2' as const;
export const VIDA38_BIRD_ARCHETYPES=[
  'PASSERINE','CURSORIAL','RAPTOR','WADER','HEAVY','GLIDER','BURROWER',
] as const;
export type Vida38BirdArchetype=typeof VIDA38_BIRD_ARCHETYPES[number];
export type Vida38BirdBillKind='CONICAL'|'STRAIGHT'|'HOOKED'|'LONG'|'BROAD'|'CHISEL'|'SPEAR'|'CURVED';
export interface Vida38BirdMorphologyV1 {
  readonly revision:typeof VIDA38_BIRD_REVISION;
  readonly speciesId:string;
  readonly fingerprint:string;
  readonly identitySeed:number;
  readonly sourceLengthMeters:number;
  readonly archetype:Vida38BirdArchetype;
  readonly secondaryArchetype:Vida38BirdArchetype;
  readonly blending:number;
  readonly bodyLength:number;
  readonly bodyDepth:number;
  readonly bodyWidth:number;
  readonly breastVolume:number;
  readonly legLength:number;
  readonly legThickness:number;
  readonly neckLength:number;
  readonly neckThickness:number;
  readonly headSize:number;
  readonly skullAspect:number;
  readonly eyeSize:number;
  readonly eyeLateralness:number;
  readonly billLength:number;
  readonly billWidth:number;
  readonly billDepth:number;
  readonly billCurve:number;
  readonly billKind:Vida38BirdBillKind;
  /** Forma de las patas aviares: muslo alto integrado, corvejón y tarsometatarso. */
  readonly hockFlexion:number;
  readonly tarsusLength:number;
  readonly toeSplay:number;
  readonly halluxLength:number;
  readonly footPadWidth:number;
  /** Envergadura y silueta distal de las alas; independiente de la pigmentación. */
  readonly wingLift:number;
  readonly wingSweep:number;
  readonly primaryFeatherLength:number;
  readonly wingDisplay:number;
  readonly tailOrnament:number;
  readonly wingSpan:number;
  readonly wingBreadth:number;
  readonly wingSpread:number;
  readonly tailLength:number;
  readonly tailFan:number;
  readonly toeLength:number;
  readonly clawLength:number;
  readonly featherDensity:number;
  readonly featherLength:number;
  readonly crestHeight:number;
  readonly pose:number;
}
const clamp=(n:number,a:number,b:number)=>Math.max(a,Math.min(b,n));
const mix=(a:number,b:number,t:number)=>a+(b-a)*t;
function hash(value:string):number {let h=2166136261;for(let i=0;i<value.length;i++)h=Math.imul(h^value.charCodeAt(i),16777619)>>>0;return h>>>0;}
function u(seed:number,salt:number):number {let x=(seed^Math.imul(salt+193,0x9e3779b9))>>>0;x^=x>>>16;x=Math.imul(x,0x7feb352d);x^=x>>>15;x=Math.imul(x,0x846ca68b);x^=x>>>16;return (x>>>0)/4294967296;}
function r(seed:number,salt:number,min:number,max:number):number{return mix(min,max,u(seed,salt));}
// Longitud, profundidad, anchura, pata, cuello, cabeza, pico, ala, cola, músculo.
type Shape=readonly [number,number,number,number,number,number,number,number,number,number];
const SHAPES:Readonly<Record<Vida38BirdArchetype,Shape>>={
  PASSERINE:[.78,.81,.81,.48,.47,.97,.54,.91,.68,.84],
  CURSORIAL:[1.28,.91,.82,1.92,1.35,.62,.72,.40,.43,1.12],
  RAPTOR:[1.06,1.18,1.13,1.06,.72,1.04,1.02,1.38,.91,1.36],
  WADER:[.78,.65,.67,2.22,2.14,.67,2.28,.91,.60,.78],
  HEAVY:[1.33,1.60,1.48,.89,.61,1.01,.67,.43,.47,1.50],
  GLIDER:[1.12,.77,.72,.63,.73,.78,1.03,2.54,1.51,.86],
  BURROWER:[.83,1.04,1.00,.77,.56,1.20,1.21,.52,.47,1.18],
};
function select(seed:number,c:Vida38SpeciesVisualContract):Vida38BirdArchetype {
  // Factores de hábitat/locomoción son sesgos, nunca categorías obligatorias.
  const weights=VIDA38_BIRD_ARCHETYPES.map(archetype=>{
    let weight=1;
    if(c.locomotion==='WALKING' && (archetype==='CURSORIAL'||archetype==='HEAVY'||archetype==='BURROWER'))weight*=1.85;
    if(c.locomotion==='FLYING' && (archetype==='GLIDER'||archetype==='RAPTOR'||archetype==='PASSERINE'))weight*=1.6;
    if(c.ecology.habitat==='SURFACE_WET_MARGIN' && archetype==='WADER')weight*=2.1;
    if(c.ecology.habitat==='SURFACE_AIR' && archetype==='GLIDER')weight*=1.45;
    if(c.ecology.habitat==='SURFACE_OPEN_TERRAIN' && archetype==='CURSORIAL')weight*=1.50;
    if(c.ecology.nutrition==='PREDATOR' && archetype==='RAPTOR')weight*=1.65;
    return weight;
  });
  const total=weights.reduce((x,y)=>x+y,0);let sample=u(seed,1)*total;
  for(let i=0;i<weights.length;i++){sample-=weights[i]!;if(sample<0)return VIDA38_BIRD_ARCHETYPES[i]!;}
  return 'PASSERINE';
}
/** Override explícito únicamente para galerías/auditorías, nunca para la ficha. */
export function deriveVida38BirdMorphology38I(c:Vida38SpeciesVisualContract,debugArchetype?:Vida38BirdArchetype):Vida38BirdMorphologyV1 {
  if(c.morphology.group!=='BIRDS')throw new Error('VIDA.38.2i: el perfil aviforme requiere grupo BIRDS');
  const seed=hash([VIDA38_BIRD_REVISION,c.speciesId,c.variantSeedUint32,c.morphology.bodyPlan,
    c.morphology.covering,c.locomotion,c.ecology.habitat,c.ecology.nutrition,c.ecology.niche,
    ...c.adaptations.slice().sort()].join('|'));
  const archetype=debugArchetype??select(seed,c);
  const secondaryArchetype=VIDA38_BIRD_ARCHETYPES[Math.floor(u(seed,2)*VIDA38_BIRD_ARCHETYPES.length)]!;
  const blending=r(seed,3,.02,.16);
  const shape=SHAPES[archetype],secondary=SHAPES[secondaryArchetype];
  const v=(i:number,s:number,jitter:number)=>mix(shape[i]!,secondary[i]!,blending)*r(seed,s,1-jitter,1+jitter);
  const flight=c.locomotion==='FLYING';const wet=c.ecology.habitat==='SURFACE_WET_MARGIN';
  const pred=c.ecology.nutrition==='PREDATOR'; const terrestrial=c.locomotion==='WALKING';
  const billKind:Vida38BirdBillKind=pred?'HOOKED':archetype==='WADER'?(u(seed,40)>.52?'SPEAR':'LONG'):
    archetype==='HEAVY'?'BROAD':archetype==='BURROWER'?'CHISEL':archetype==='PASSERINE'?'CONICAL':
      u(seed,41)>.74?'CURVED':'STRAIGHT';
  // Un subconjunto presenta alas notoriamente amplias. No depende del color.
  const wingDisplay=(archetype==='GLIDER'?u(seed,42)*.64+.42:
    u(seed,42)>.83?r(seed,43,.48,.94):r(seed,43,.03,.21));
  const wingSpan=clamp(v(7,45,.17)*(flight?1.21:terrestrial?.79:1)*(1+wingDisplay*.42),.27,4.80);
  const feather=c.morphology.covering==='FEATHERS';
  return Object.freeze({
    revision:VIDA38_BIRD_REVISION,speciesId:c.speciesId,identitySeed:seed,
    fingerprint:`${VIDA38_BIRD_REVISION}:${seed.toString(16).padStart(8,'0')}:${archetype}`,
    sourceLengthMeters:c.bodyLengthMeters,archetype,secondaryArchetype,blending,
    bodyLength:clamp(v(0,10,.16),.68,1.56),bodyDepth:clamp(v(1,11,.16),.56,1.84),
    bodyWidth:clamp(v(2,12,.17),.56,1.68),breastVolume:clamp(v(9,13,.15),.66,1.67),
    legLength:clamp(v(3,14,.18)*(wet?1.11:1),.35,2.85),
    legThickness:clamp(r(seed,15,.72,1.19)*(terrestrial?1.19:1),.69,1.48),
    neckLength:clamp(v(4,16,.16),.35,2.90),neckThickness:clamp(r(seed,17,.74,1.21)*(archetype==='HEAVY'?1.26:1),.70,1.49),
    headSize:clamp(v(5,18,.16),.51,1.43),skullAspect:r(seed,19,.78,1.33),
    eyeSize:clamp(r(seed,20,.73,1.24)*(archetype==='RAPTOR'?1.09:1),.7,1.37),
    eyeLateralness:r(seed,21,.64,1.14),
    billLength:clamp(v(6,22,.23)*(pred?1.07:1)*(billKind==='SPEAR'||billKind==='LONG'?1.15:1),.30,3.55),
    billWidth:clamp(r(seed,23,.71,1.26)*(billKind==='BROAD'?1.33:1),.63,1.51),
    billDepth:r(seed,24,.75,1.30),billCurve:billKind==='HOOKED'?r(seed,25,.30,.67):billKind==='CURVED'?r(seed,25,.17,.49):r(seed,25,-.07,.13),billKind,
    hockFlexion:clamp(r(seed,46,.65,1.30)*(archetype==='CURSORIAL'?1.16:1),.58,1.48),
    tarsusLength:clamp(r(seed,47,.76,1.32)*(archetype==='WADER'?1.20:1),.70,1.55),
    toeSplay:clamp(r(seed,48,.76,1.34)*(archetype==='WADER'?1.13:1),.72,1.55),
    halluxLength:clamp(r(seed,49,.54,1.25)*(archetype==='RAPTOR'?1.20:1),.48,1.52),
    footPadWidth:clamp(r(seed,50,.76,1.24)*(archetype==='HEAVY'?1.24:1),.75,1.50),
    wingSpan,wingBreadth:clamp(r(seed,26,.62,1.30)*(archetype==='GLIDER'?1.25:1),.58,1.72),
    wingSpread:flight?clamp(r(seed,27,.37,.79)+(archetype==='GLIDER'?.27:0)+wingDisplay*.18,.31,1.20):r(seed,27,.11,.31),
    wingLift:clamp(r(seed,51,-.10,.21)+(archetype==='GLIDER'?.25:0)+wingDisplay*.35,-.13,.82),
    wingSweep:clamp(r(seed,52,.57,1.34)*(archetype==='RAPTOR'?.90:1),.49,1.45),
    primaryFeatherLength:clamp(r(seed,53,.72,1.33)*(1+wingDisplay*.48),.68,1.86),
    wingDisplay,
    tailLength:clamp(v(8,28,.25)*(1+wingDisplay*.26),.22,2.20),
    tailFan:clamp(r(seed,29,.20,1.0)*(archetype==='GLIDER'?1.37:1),.19,1.45),
    tailOrnament:clamp(r(seed,54,.06,.40)+(archetype==='GLIDER'?.35:0)+(u(seed,55)>.86?.55:0),.04,1.25),
    toeLength:clamp(r(seed,30,.76,1.28)*(archetype==='RAPTOR'?1.17:1),.71,1.57),
    clawLength:clamp(r(seed,31,.51,1.09)*(pred?1.28:1),.48,1.52),
    featherDensity:feather?r(seed,32,.44,1):0,
    featherLength:feather?r(seed,33,.68,1.42):0,
    crestHeight:feather && u(seed,34)>.66?r(seed,35,.08,.39):0,
    pose:r(seed,36,-.10,.10),
  });
}
