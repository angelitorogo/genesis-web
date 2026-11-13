/**
 * GENESIS 38.2r1a — tercio facial inferior en humanoides VERY_ADVANCED.
 * Matemática pura; las referencias (lipY) vienen del mismo SDF que modela el cráneo.
 * No altera VIDA, contratos, persistencia ni otros linajes.
 */
import {
  deriveVida38HumanoidFaceLandmarks38GC,
  evaluateVida38HumanoidField,
  type Vida38HumanoidAnatomy,
  type Vida38HumanoidRawMesh,
} from './vida38-humanoid-organic-field-38-2e';
import type { Vida38CivilHumanoidPlan38R } from './vida38-civilized-humanoid-plan-38-2r';

export const VIDA38_CIV_HUMANOID_ORAL_REVISION_38R1A = 'VIDA.38.2r1a/anatomic-lower-face/v1' as const;

export interface Vida38CivilHumanoidOralPlan38R1A {
  readonly revision: typeof VIDA38_CIV_HUMANOID_ORAL_REVISION_38R1A;
  readonly y: number;
  readonly halfWidth: number;
  readonly cleftHalfHeight: number;
  readonly fullness: number;
  readonly chinFullness: number;
  readonly cornerRise: number;
  readonly phenotype: 'NARROW'|'REGULAR'|'BROAD'|'FIRM'|'SOFT';
  readonly signature: string;
}
const clamp=(v:number,lo:number,hi:number)=>Math.max(lo,Math.min(hi,v));
const g=(x:number,s:number)=>Math.exp(-(x*x)/Math.max(.00000001,s*s));
const smooth=(x:number,lo:number,hi:number):number=>{const t=clamp((x-lo)/(hi-lo),0,1);return t*t*(3-2*t);};

export function deriveVida38CivilHumanoidOralPlan38R1A(
  a:Vida38HumanoidAnatomy,p:Vida38CivilHumanoidPlan38R,
):Vida38CivilHumanoidOralPlan38R1A{
  const landmark=deriveVida38HumanoidFaceLandmarks38GC(a);
  const base=clamp(a.jawWidth*.48*a.mouthWidth,.072,.14);
  const width={
    LITHE_DIPLOMAT:.99,ROBUST_COLONIST:1.12,ATHLETIC_VANGUARD:1.02,
    LONGNECK_SEER:.88,COMPACT_ENGINEER:.94,REGAL_HIGHBORN:1.03,
    TALL_ARCHIVIST:.90,BROAD_SENTINEL:1.16,PELAGIC_ENVOY:1.02,ASCETIC_ORACLE:.86,
  }[p.archetype];
  const phenotype:Vida38CivilHumanoidOralPlan38R1A['phenotype'] =
    p.archetype==='ROBUST_COLONIST'||p.archetype==='BROAD_SENTINEL'?'BROAD':
    p.archetype==='ASCETIC_ORACLE'||p.archetype==='LONGNECK_SEER'?'NARROW':
    p.archetype==='ATHLETIC_VANGUARD'?'FIRM':
    p.archetype==='PELAGIC_ENVOY'?'SOFT':'REGULAR';
  const halfWidth=clamp(base*width,.067,.149);
  const cleftHalfHeight=clamp(.0068 + a.face.mouthOpen*.28,.007,.013);
  const fullness=clamp(.0135*a.face.lipFullness*(phenotype==='SOFT'?1.12:phenotype==='FIRM'?.90:1),.011,.022);
  const chinFullness=clamp(.014*a.chinShape*(phenotype==='BROAD'?1.15:1),.012,.027);
  const cornerRise=clamp(a.face.mouthCurve *a.torsoLength,-.012,.012);
  const y=landmark.lipY;
  return {revision:VIDA38_CIV_HUMANOID_ORAL_REVISION_38R1A,
    y,halfWidth,cleftHalfHeight,fullness,chinFullness,cornerRise,phenotype,
    signature:[p.archetype,phenotype,halfWidth,cleftHalfHeight,fullness,chinFullness,cornerRise,y]
      .map(v=>typeof v==='number'?v.toFixed(6):v).join('|')};
}

/** Relieve continuo: área subnasal, labio superior, hendidura, labio inferior y mentón. */
export function evaluateVida38CivilHumanoidOralWarp38R1A(
  plan:Vida38CivilHumanoidOralPlan38R1A,x:number,y:number,z:number,
):number{
  const dx=x/plan.halfWidth;
  const lateral=g(dx,1.08);
  const anterior=smooth(z,.10,.235);
  const by=y-plan.y;
  const subnasal=.0063*g(by-.062,.033);
  const upper=plan.fullness*g(by-.022,.015);
  const lower=plan.fullness*.92*g(by+.021,.017);
  const slit=-.013*g(by,.0085);
  const chin=plan.chinFullness*g(by+.084,.050);
  const corner=.003*g(Math.abs(dx)-.93,.25)*g(by,.018);
  return lateral*anterior*(subnasal+upper+lower+slit+chin+corner);
}

/** Corrige SOLAMENTE los vértices ya existentes del tercio inferior del rostro. */
export function sculptVida38CivilHumanoidOralRaw38R1A(
  raw:Vida38HumanoidRawMesh,plan:Vida38CivilHumanoidOralPlan38R1A,
):Vida38HumanoidRawMesh{
  const positions=new Float32Array(raw.positions);
  for(let i=0;i<positions.length;i+=3){
    const x=positions[i]!,y=positions[i+1]!,z=positions[i+2]!;
    if(y<plan.y-.15||y>plan.y+.12||Math.abs(x)>plan.halfWidth*2||z<.09)continue;
    positions[i+2]=z+evaluateVida38CivilHumanoidOralWarp38R1A(plan,x,y,z);
  }
  return {...raw,positions};
}

/** Intersección con la superficie craneal SDF: no colocar labios por coordenadas Z inventadas. */
export function findVida38CivilHumanoidFaceZ38R1A(a:Vida38HumanoidAnatomy,x:number,y:number):number{
  let lo=.025,hi=.70;
  let found=false;
  // Garantiza un punto INTERIOR; algunos fenotipos tienen el surco oral profundo.
  for(let z=.025;z<=.305;z+=.04){
    if(evaluateVida38HumanoidField(a,x,y,z)<=0){lo=z;found=true;break;}
  }
  if(!found) return NaN;
  if(evaluateVida38HumanoidField(a,x,y,hi)<0)return NaN;
  for(let i=0;i<16;i++){
    const mid=(lo+hi)*.5;
    if(evaluateVida38HumanoidField(a,x,y,mid)<=0)lo=mid;
    else hi=mid;
  }
  return (lo+hi)*.5;
}

/** Coordenadas del punto de boca en el frente facial, incluyendo la deformación del SDF. */
export function sampleVida38CivilHumanoidOralSurface38R1A(
  a:Vida38HumanoidAnatomy,p:Vida38CivilHumanoidOralPlan38R1A,x:number,y:number,standOff=.0025,
):number{
  const z=findVida38CivilHumanoidFaceZ38R1A(a,x,y);
  return Number.isFinite(z)?z+evaluateVida38CivilHumanoidOralWarp38R1A(p,x,y,z)+standOff:NaN;
}
