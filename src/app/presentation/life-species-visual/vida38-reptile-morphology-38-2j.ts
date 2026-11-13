/**
 * GENESIS 38.2j — perfil morfológico de reptiles, sin estado ni Three.js.
 * Las formas son reconstrucciones hipotéticas: NO añaden hechos a VIDA.
 */
import type { Vida38SpeciesVisualContract } from './vida38-species-visual-contract';

export const VIDA38_REPTILE_REVISION='VIDA.38.2j/reptile-morphology/v1' as const;
export const VIDA38_REPTILE_ARCHETYPES=[
  'LACERTID','IGUANID','GEKKONID','VARANID','CROCODILIAN',
  'ARMORED','LONG_NECK','SPRAWLER','SERPENTIFORM',
] as const;
export type Vida38ReptileArchetype = typeof VIDA38_REPTILE_ARCHETYPES[number];
export type Vida38ReptileDentition = 'NONE_VISIBLE'|'FINE'|'CONICAL'|'FANGS';
export interface Vida38ReptileMorphologyV1 {
  readonly revision:typeof VIDA38_REPTILE_REVISION;
  readonly speciesId:string;
  readonly identitySeed:number;
  readonly fingerprint:string;
  readonly sourceLengthMeters:number;
  readonly archetype:Vida38ReptileArchetype;
  readonly secondaryArchetype:Vida38ReptileArchetype;
  readonly blend:number;
  readonly bodyLength:number;
  readonly bodyDepth:number;
  readonly torsoWidth:number;
  readonly abdomenFullness:number;
  readonly chestDepth:number;
  readonly backArch:number;
  readonly legLength:number;
  readonly legSplay:number;
  readonly frontMuscle:number;
  readonly rearMuscle:number;
  readonly footWidth:number;
  readonly toeLength:number;
  readonly clawLength:number;
  readonly headSize:number;
  readonly skullWidth:number;
  readonly skullDepth:number;
  readonly snoutLength:number;
  readonly snoutWidth:number;
  readonly jawMass:number;
  readonly jawGap:number;
  readonly eyeSize:number;
  readonly eyeLateralness:number;
  readonly neckLength:number;
  readonly neckThickness:number;
  readonly tailLength:number;
  readonly tailThickness:number;
  readonly tailCurve:number;
  readonly scaleSize:number;
  readonly scaleRoughness:number;
  readonly dorsalArmor:number;
  readonly crestHeight:number;
  readonly hornHeight:number;
  readonly dentition:Vida38ReptileDentition;
  readonly toothLength:number;
  readonly digitCount:4|5;
}
// Cuerpo longitudinal; profundidad; ancho; patas; cuello; cabeza; hocico;
// cola; extensión lateral; escudos dorsales. No son mallas prefabricadas.
type Shape=readonly [number,number,number,number,number,number,number,number,number,number];
const SHAPES:Readonly<Record<Vida38ReptileArchetype,Shape>>={
  LACERTID:    [1.19,.64,.65,.88,.42,.70,.78,1.32,1.00,.05],
  IGUANID:    [1.34,.95,.95,.77,.64,1.03,.90,1.55,1.12,.34],
  GEKKONID:   [.88,.58,.90,.53,.23,1.25,.36,.82,1.31,.06],
  VARANID:    [1.68,.87,.82,1.05,.71,.80,1.49,1.73,.94,.10],
  CROCODILIAN:[1.96,.66,1.30,.47,.28,1.13,1.95,1.66,1.37,.82],
  ARMORED:    [1.28,1.18,1.55,.40,.28,.83,.57,.84,1.28,.95],
  LONG_NECK:  [1.10,.65,.69,1.17,1.67,.75,.62,1.71,.89,.08],
  SPRAWLER:   [1.47,.56,1.27,.39,.25,.98,1.08,1.40,1.70,.31],
  SERPENTIFORM:[2.38,.40,.44,.32,.29,.58,1.13,2.26,.70,.04],
};
const clamp=(v:number,min:number,max:number)=>Math.min(max,Math.max(min,v));
function fnv32(text:string):number{let h=2166136261;for(let i=0;i<text.length;i++)h=Math.imul(h^text.charCodeAt(i),16777619)>>>0;return h>>>0;}
function unit(seed:number,salt:number):number{let x=(seed^Math.imul(salt+151,0x9e3779b9))>>>0;x^=x>>>16;x=Math.imul(x,0x7feb352d);x^=x>>>15;x=Math.imul(x,0x846ca68b);x^=x>>>16;return (x>>>0)/4294967295;}
const lerp=(a:number,b:number,t:number)=>a+(b-a)*t;
const range=(s:number,k:number,a:number,b:number)=>lerp(a,b,unit(s,k));

/** El segundo argumento es exclusivamente para las galerías y tests; producción no lo usa. */
export function deriveVida38ReptileMorphology38J(
  contract:Vida38SpeciesVisualContract,debugArchetype?:Vida38ReptileArchetype,
):Vida38ReptileMorphologyV1{
  if(contract.morphology.group!=='REPTILES'||contract.morphology.bodyPlan!=='TETRAPOD'){
    throw new Error('VIDA 38.2j: solo reptiles cuadrúpedos confirmados');
  }
  // No incorporar pigmentos a la semilla: recolorear nunca cambia anatomía.
  const identitySeed=fnv32(`${VIDA38_REPTILE_REVISION}|${contract.speciesId}|${contract.variantSeedUint32}|${contract.morphology.bodyPlan}|${contract.ecology.habitat}|${contract.ecology.niche}|${contract.ecology.nutrition}|${contract.locomotion}|${contract.adaptations.slice().sort().join(',')}`);
  const archetype=debugArchetype??VIDA38_REPTILE_ARCHETYPES[Math.floor(unit(identitySeed,3)*VIDA38_REPTILE_ARCHETYPES.length)]!;
  const secondaryArchetype=VIDA38_REPTILE_ARCHETYPES[Math.floor(unit(identitySeed,7)*VIDA38_REPTILE_ARCHETYPES.length)]!;
  const blend=range(identitySeed,9,.035,.17);
  const base=SHAPES[archetype],secondary=SHAPES[secondaryArchetype];
  const v=(i:number,salt:number,jitter:number)=>lerp(base[i]!,secondary[i]!,blend)*range(identitySeed,salt,1-jitter,1+jitter);
  const predator=contract.ecology.nutrition==='PREDATOR';
  const herbivore=contract.ecology.nutrition==='HERBIVORE';
  const wet=contract.ecology.habitat==='SURFACE_WET_MARGIN';
  const open=contract.ecology.habitat==='SURFACE_OPEN_TERRAIN';
  const canopy=contract.ecology.habitat==='SURFACE_CANOPY';
  const rocky=contract.ecology.habitat==='SURFACE_ROCK_SHELTER';
  const armored=['CROCODILIAN','ARMORED'].includes(archetype);
  const toothRoll=unit(identitySeed,132);
  const dentition:Vida38ReptileDentition=predator
    ?(toothRoll>.34?'FANGS':'CONICAL')
    :herbivore?(toothRoll>.82?'FINE':'NONE_VISIBLE')
    :toothRoll>.82?'CONICAL':toothRoll>.36?'FINE':'NONE_VISIBLE';
  const bodyLength=clamp(v(0,11,.17),.70,2.85);
  const legLength=clamp(v(3,31,.16)*(open?1.08:wet?.91:1),.22,1.52);
  const torsoWidth=clamp(v(2,21,.17),.37,1.85);
  const headSize=clamp(v(5,51,.20),.43,1.65);
  return Object.freeze({
    revision:VIDA38_REPTILE_REVISION,speciesId:contract.speciesId,identitySeed,
    fingerprint:`${VIDA38_REPTILE_REVISION}:${identitySeed.toString(16).padStart(8,'0')}:${archetype}`,
    sourceLengthMeters:contract.bodyLengthMeters,archetype,secondaryArchetype,blend,
    bodyLength,bodyDepth:clamp(v(1,15,.17),.32,1.55),torsoWidth,
    abdomenFullness:clamp(range(identitySeed,18,.75,1.29)*(armored?1.12:1),.70,1.55),
    chestDepth:clamp(range(identitySeed,19,.82,1.25)*(predator?1.06:1),.70,1.40),
    backArch:range(identitySeed,25,-.15,.27)+(armored?.12:0),
    legLength,legSplay:clamp(v(8,33,.12)*(canopy?.85:1),.54,2.0),
    frontMuscle:range(identitySeed,35,.78,1.29)*(armored?1.19:1),
    rearMuscle:range(identitySeed,36,.80,1.27)*(open?1.12:1),
    footWidth:range(identitySeed,37,.76,1.32)*(canopy?1.09:1),
    toeLength:range(identitySeed,39,.72,1.35)*(canopy?1.15:1),
    clawLength:range(identitySeed,40,.65,1.40)*(predator||rocky?1.19:1),
    headSize,skullWidth:range(identitySeed,53,.75,1.32),
    skullDepth:range(identitySeed,54,.75,1.34),
    snoutLength:clamp(v(6,55,.24)*(predator?1.11:1),.28,2.48),
    snoutWidth:range(identitySeed,56,.72,1.31)*(herbivore?1.11:1),
    jawMass:range(identitySeed,57,.70,1.48)*(predator?1.13:1),
    jawGap:range(identitySeed,58,.012,.060)*(dentition==='FANGS'?1.25:1),
    eyeSize:range(identitySeed,60,.65,1.38)*(archetype==='GEKKONID'?1.28:1),
    eyeLateralness:range(identitySeed,61,.72,1.29),
    neckLength:clamp(v(4,64,.18),.16,2.10),
    neckThickness:range(identitySeed,65,.74,1.29)*(armored?1.22:1),
    tailLength:clamp(v(7,71,.20),.40,2.94),
    tailThickness:range(identitySeed,73,.67,1.39)*(armored?1.28:1),
    tailCurve:range(identitySeed,74,-.49,.65),
    scaleSize:range(identitySeed,81,.75,1.54),
    scaleRoughness:range(identitySeed,82,.82,1.19),
    dorsalArmor:clamp(v(9,85,.19)*(rocky?1.12:1),.0,1.14),
    crestHeight:archetype==='IGUANID'||archetype==='ARMORED'||archetype==='LONG_NECK'
      ?range(identitySeed,91,.08,.30)*(unit(identitySeed,90)>.23?1:0):0,
    hornHeight:archetype==='ARMORED'||archetype==='IGUANID'
      ?range(identitySeed,95,.07,.27)*(unit(identitySeed,94)>.67?1:0):0,
    dentition,toothLength:dentition==='FANGS'?range(identitySeed,134,.055,.115)
      :dentition==='CONICAL'?range(identitySeed,134,.032,.067)
      :dentition==='FINE'?range(identitySeed,134,.017,.037):0,
    digitCount:unit(identitySeed,110)>.70?4:5,
  });
}
