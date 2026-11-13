/**
 * GENESIS 38.2h — diversidad morfoanatómica mamífera.
 * Reconstrucción ARTÍSTICA estable; no añade caracteres biológicos a VIDA.
 * La morfología se deriva exclusivamente de datos confirmados, jamás del color.
 */
import type { Vida38SpeciesVisualContract } from './vida38-species-visual-contract';

export const VIDA38_MAMMAL_REVISION = 'VIDA.38.2h/mammal-morphology/v1' as const;
export const VIDA38_MAMMAL_ARCHETYPES = [
  'RODENT', 'CANID', 'FELID', 'BOVID', 'PROBOSCIDEAN', 'CERVID',
  'URSID', 'HIPPOPOTAMOID', 'MUSTELID', 'LEAPER', 'PRIMATOID',
] as const;
export type Vida38MammalArchetype = typeof VIDA38_MAMMAL_ARCHETYPES[number];
export type Vida38MammalSupport = 'PLANTIGRADE' | 'DIGITIGRADE' | 'UNGULIGRADE';
export interface Vida38MammalMorphologyV1 {
  readonly revision: typeof VIDA38_MAMMAL_REVISION;
  readonly speciesId: string;
  readonly identitySeed: number;
  readonly fingerprint: string;
  readonly sourceLengthMeters: number;
  readonly archetype: Vida38MammalArchetype;
  readonly secondaryArchetype: Vida38MammalArchetype;
  readonly blend: number;
  readonly support: Vida38MammalSupport;
  readonly bodyLength: number;
  readonly bodyHeight: number;
  readonly torsoWidth: number;
  readonly chestWidth: number;
  readonly abdomenWidth: number;
  readonly shoulderRise: number;
  readonly hipRise: number;
  readonly muscle: number;
  readonly legHeight: number;
  readonly frontLegThickness: number;
  readonly rearLegThickness: number;
  readonly hindLegBias: number;
  readonly neckLength: number;
  readonly neckWidth: number;
  readonly headScale: number;
  readonly skullLength: number;
  readonly skullWidth: number;
  readonly muzzleLength: number;
  readonly muzzleWidth: number;
  readonly jawDepth: number;
  readonly eyeSeparation: number;
  readonly eyeRadius: number;
  readonly eyeLateralness: number;
  readonly earSize: number;
  readonly earAspect: number;
  readonly tailLength: number;
  readonly tailWidth: number;
  readonly tailCurve: number;
  readonly hornSize: number;
  readonly trunkLength: number;
  readonly tuskSize: number;
  readonly digitCount: number;
  readonly furDensity: number;
  readonly furLength: number;
  readonly asymmetry: number;
}

type Shape = readonly [number,number,number,number,number,number,number,number,number,number];
// body length, height, width, leg height, neck reach, head size, muzzle length,
// tail length, shoulder rise, hip rise. Cada familia es un RANGO, no un modelo fijo.
const SHAPES: Readonly<Record<Vida38MammalArchetype,Shape>> = {
  RODENT: [1.18,.69,.81,.51,.26,.63,.82,1.23,.74,.70],
  CANID: [1.61,.69,.72,1.25,.58,.73,1.25,1.10,1.00,.94],
  FELID: [1.30,.82,1.01,.90,.39,1.01,.52,1.17,1.18,1.10],
  BOVID: [1.58,1.27,1.24,.98,.63,1.08,.92,.43,1.26,.99],
  PROBOSCIDEAN: [1.65,1.50,1.38,1.03,.33,1.36,.58,.30,1.06,1.05],
  CERVID: [1.30,.62,.60,1.60,1.24,.65,.87,.39,1.05,.91],
  URSID: [1.31,1.37,1.45,.71,.29,1.15,.64,.12,1.20,1.08],
  HIPPOPOTAMOID: [1.57,1.64,1.51,.48,.21,1.36,1.23,.18,1.04,1.00],
  MUSTELID: [2.12,.51,.58,.45,.35,.57,.58,1.10,.80,.78],
  LEAPER: [1.14,.65,.73,1.24,.26,.72,.55,.40,.78,1.20],
  PRIMATOID: [1.12,1.07,1.06,.86,.27,1.27,.39,.59,1.20,.96],
};
const clamp = (x:number,a:number,b:number) => Math.max(a,Math.min(b,x));
function fnv(s:string):number {let h=2166136261;for(let i=0;i<s.length;i++) h=Math.imul(h^s.charCodeAt(i),16777619)>>>0;return h>>>0;}
function unit(seed:number,salt:number):number {let x=(seed^Math.imul(salt+157,0x9e3779b9))>>>0;x^=x>>>16;x=Math.imul(x,0x7feb352d);x^=x>>>15;x=Math.imul(x,0x846ca68b);x^=x>>>16;return (x>>>0)/4294967295;}
const lerp=(a:number,b:number,t:number)=>a+(b-a)*t;
function range(seed:number,salt:number,lo:number,hi:number):number{return lerp(lo,hi,unit(seed,salt));}

/**
 * El override es exclusivo de auditorías visuales (galería de once arquetipos).
 * No se debe usar en producción: los perfiles normales usan solo speciesId + VIDA.
 */
export function deriveVida38MammalMorphologyV1(
  contract: Vida38SpeciesVisualContract,
  debugArchetype?: Vida38MammalArchetype,
): Vida38MammalMorphologyV1 {
  if(contract.morphology.group!=='MAMMALS'||contract.morphology.bodyPlan!=='TETRAPOD')
    throw new Error('38.2h: solo mamíferos cuadrúpedos con contrato 38.1 confirmado');
  const identitySeed=fnv(`${VIDA38_MAMMAL_REVISION}|${contract.speciesId}|${contract.variantSeedUint32}|${contract.morphology.bodyPlan}|${contract.ecology.niche}|${contract.ecology.nutrition}|${contract.locomotion}|${contract.ecology.habitat}|${contract.adaptations.slice().sort().join(',')}`);
  const archetype = debugArchetype ?? VIDA38_MAMMAL_ARCHETYPES[Math.floor(unit(identitySeed,3)*VIDA38_MAMMAL_ARCHETYPES.length)]!;
  const secondaryArchetype=VIDA38_MAMMAL_ARCHETYPES[Math.floor(unit(identitySeed,7)*VIDA38_MAMMAL_ARCHETYPES.length)]!;
  const blend=range(identitySeed,9,.02,.22);
  const base=SHAPES[archetype],secondary=SHAPES[secondaryArchetype];
  const v=(index:number,salt:number,variation:number)=>lerp(base[index]!,secondary[index]!,blend)*range(identitySeed,salt,1-variation,1+variation);
  const heavy=['BOVID','PROBOSCIDEAN','URSID','HIPPOPOTAMOID'].includes(archetype);
  const swift=['CANID','FELID','CERVID','LEAPER'].includes(archetype);
  const predator=contract.ecology.nutrition==='PREDATOR';
  const grazing=contract.ecology.nutrition==='HERBIVORE';
  const wet=contract.ecology.habitat==='SURFACE_WET_MARGIN';
  const terrestrial=contract.ecology.habitat==='SURFACE_OPEN_TERRAIN';
  const support:Vida38MammalSupport = heavy && grazing || ['BOVID','CERVID'].includes(archetype) ? 'UNGULIGRADE' : swift ? 'DIGITIGRADE' : 'PLANTIGRADE';
  const fur=contract.morphology.covering==='FUR';
  const skull=clamp(v(5,57,.22),.42,1.62);
  const bodyWidth=clamp(v(2,26,.15),.50,1.75);
  const legHeight=clamp(v(3,31,.15)*(terrestrial?1.07:wet?.94:1),.36,1.85);
  const tail=clamp(v(7,73,.18),.02,1.55);
  const archetypeHorn=['BOVID','CERVID'].includes(archetype);
  const proboscidean=archetype==='PROBOSCIDEAN';
  const hornSize=archetypeHorn && unit(identitySeed,81)>.38 ? range(identitySeed,82,.13,.67) : 0;
  const trunkLength=proboscidean && unit(identitySeed,84)>.12 ? range(identitySeed,85,.44,.92) : 0;
  const tuskSize=proboscidean && unit(identitySeed,88)>.46 ? range(identitySeed,89,.13,.42) : 0;
  const bodyLength=clamp(v(0,12,.17),.88,2.35);
  const neckLength=clamp(v(4,36,.19),.18,1.38);
  const headSize=skull*(predator?1.03:1);
  const muzzle=clamp(v(6,63,.24)*(predator?1.10:1),.28,1.72);
  const furDensity=fur ? clamp(range(identitySeed,110,.35,1)*(wet?.68:1),0,1) : 0;
  return Object.freeze({
    revision:VIDA38_MAMMAL_REVISION,
    speciesId:contract.speciesId,identitySeed,
    fingerprint:`${VIDA38_MAMMAL_REVISION}:${identitySeed.toString(16).padStart(8,'0')}:${archetype}`,
    sourceLengthMeters:contract.bodyLengthMeters,archetype,secondaryArchetype,blend,support,
    bodyLength,
    bodyHeight:clamp(v(1,17,.14),.42,1.85),
    torsoWidth:bodyWidth,
    chestWidth:clamp(bodyWidth*range(identitySeed,19,.95,1.24),.46,2.06),
    abdomenWidth:clamp(bodyWidth*range(identitySeed,21,.82,1.18),.44,1.90),
    shoulderRise:clamp(v(8,22,.17),.48,1.48),
    hipRise:clamp(v(9,24,.16),.54,1.43),
    muscle:clamp(range(identitySeed,28,.78,1.30)*(predator?1.08:1),.72,1.41),
    legHeight,
    frontLegThickness:clamp(range(identitySeed,34,.75,1.18)*(heavy?1.25:1)*(bodyWidth/1.05),.38,1.85),
    rearLegThickness:clamp(range(identitySeed,35,.83,1.24)*(archetype==='LEAPER'?1.34:1)*(bodyWidth/1.05),.43,1.94),
    hindLegBias:archetype==='LEAPER'?.24:range(identitySeed,37,-.07,.10),
    neckLength,
    neckWidth:clamp(range(identitySeed,38,.77,1.27)*(heavy?1.26:1),.67,1.62),
    headScale:headSize,
    skullLength:clamp(range(identitySeed,40,.79,1.32)*(archetype==='MUSTELID'?.83:1),.63,1.45),
    skullWidth:clamp(range(identitySeed,41,.74,1.29),.66,1.4),
    muzzleLength:muzzle,
    muzzleWidth:clamp(range(identitySeed,42,.71,1.32)*(grazing?1.08:1),.63,1.52),
    jawDepth:clamp(range(identitySeed,43,.79,1.37)*(predator?1.15:1),.66,1.62),
    eyeSeparation:range(identitySeed,44,.78,1.20),
    eyeRadius:clamp(range(identitySeed,46,.68,1.22)*(archetype==='RODENT'?1.22:1),.60,1.52),
    eyeLateralness:clamp(range(identitySeed,48,.44,.98)*(grazing?1.12:predator?.77:1),.30,1.18),
    earSize:clamp(range(identitySeed,49,.60,1.35)*(archetype==='LEAPER'?1.78:archetype==='PROBOSCIDEAN'?2.30:1),.40,2.75),
    earAspect:range(identitySeed,50,.64,1.56),
    tailLength:tail,
    tailWidth:clamp(range(identitySeed,75,.55,1.35)*(archetype==='URSID'?.66:1),.38,1.42),
    tailCurve:range(identitySeed,76,-.38,.65),
    hornSize,trunkLength,tuskSize,
    digitCount:support==='UNGULIGRADE'?2:3+Math.floor(unit(identitySeed,93)*3),
    furDensity,furLength:fur?range(identitySeed,111,.35,1.6):0,
    asymmetry:range(identitySeed,118,-.024,.024),
  });
}
