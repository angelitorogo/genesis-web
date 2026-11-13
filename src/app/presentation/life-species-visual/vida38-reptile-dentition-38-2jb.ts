/**
 * GENESIS 38.2j.b — anclaje de labios y dientes al SDF real.
 * Reconstrucción artística determinista: no introduce nuevos hechos en VIDA.
 */
import type {Vida38ReptileMorphologyV1} from './vida38-reptile-morphology-38-2j';
import type {Vida38SpeciesVisualContract} from './vida38-species-visual-contract';
import {deriveVida38ReptileLandmarks38J,evaluateVida38ReptileField38J} from './vida38-reptile-organic-field-38-2j';

export const VIDA38_REPTILE_DENTITION_REVISION='VIDA.38.2j.b/reptile-dentition/surface-anchored-v1' as const;
type V3=readonly [number,number,number];
export type Vida38ReptileDentalRow='UPPER'|'LOWER';
export type Vida38ReptileDentalDiet='PREDATORY'|'MIXED'|'DISCRETE';
export interface Vida38ReptileTooth38JB {
  readonly side:-1|1;
  readonly row:Vida38ReptileDentalRow;
  readonly index:number;
  readonly base:V3;
  readonly tip:V3;
  readonly radius:number;
  readonly exposedLength:number;
  readonly emergence:number;
}
export interface Vida38ReptileJaw38JB{
  readonly revision:typeof VIDA38_REPTILE_DENTITION_REVISION;
  readonly diet:Vida38ReptileDentalDiet;
  readonly exposure:'HIDDEN'|'SUBTLE'|'MODERATE'|'PRONOUNCED';
  readonly mouthGap:number;
  readonly seam:readonly (readonly V3[])[];
  readonly lowerLip:readonly (readonly V3[])[];
  readonly teeth:readonly Vida38ReptileTooth38JB[];
}
const clamp=(value:number,min:number,max:number)=>Math.max(min,Math.min(max,value));
function sample(seed:number,salt:number):number {
  let x=(seed^Math.imul(salt+0x7f4a7c15,0x9e3779b9))>>>0;
  x^=x>>>16;x=Math.imul(x,0x7feb352d);x^=x>>>15;
  x=Math.imul(x,0x846ca68b);x^=x>>>16;
  return (x>>>0)/4294967295;
}
/**
 * Intersección EXTERIOR de un rayo desde el eje medial hasta el lateral del
 * hocico. No aproximar la piel mediante snoutWidth: en un geco y un varano
 * esas aproximaciones entierran dientes o los dejan flotando.
 */
export function findVida38ReptileOuterJawX38JB(
  morphology:Vida38ReptileMorphologyV1,y:number,z:number,
):number|null {
  const f=(x:number)=>evaluateVida38ReptileField38J(morphology,x,y,z);
  const outside=Math.max(1.0,.85*morphology.torsoWidth,.80*morphology.headSize);
  // Alrededor del extremo anterior puede no existir sección a esta altura.
  // El cliente debe omitir el punto, nunca inventar un anclaje.
  if(f(0)>=0)return null;
  let inside=0;
  for(let step=1;step<=30;step++){
    let high=outside*step/30;
    if(f(high)<0){inside=high;continue;}
    let low=inside;
    for(let i=0;i<12;i++){
      const mid=(low+high)*.5;
      if(f(mid)<0)low=mid;else high=mid;
    }
    return (low+high)*.5;
  }
  return null;
}
function localJawSurface(
  m:Vida38ReptileMorphologyV1,side:-1|1,y:number,z:number,outset:number,
):V3|null {
  const x=findVida38ReptileOuterJawX38JB(m,y,z);
  return x===null?null:[side*(x+outset),y,z];
}

export function deriveVida38ReptileJaw38JB(
  m:Vida38ReptileMorphologyV1,nutrition:Vida38SpeciesVisualContract['ecology']['nutrition'],
):Vida38ReptileJaw38JB{
  const a=deriveVida38ReptileLandmarks38J(m);
  const start=a.headZ+.08*m.headSize;
  const span=a.muzzleTipZ-start;
  const upperY=a.muzzleY+.028*m.headSize;
  const diet:Vida38ReptileDentalDiet=nutrition==='PREDATOR'?'PREDATORY':
    nutrition==='OMNIVORE'?'MIXED':'DISCRETE';
  const exposure:Vida38ReptileJaw38JB['exposure']=m.dentition==='NONE_VISIBLE'?'HIDDEN'
    :m.dentition==='FINE'?'SUBTLE'
    :m.dentition==='CONICAL'?'MODERATE':'PRONOUNCED';
  const mouthGap=clamp(m.jawGap*(diet==='PREDATORY'?1.4:1),.01,.105)*m.headSize;
  const seamY=upperY-(.082*m.headSize+mouthGap*.16);
  const seams:V3[][]=[],lowerLips:V3[][]=[];
  const teeth:Vida38ReptileTooth38JB[]=[];
  for(const side of [-1,1] as const){
    const seam:V3[]=[],lip:V3[]=[];
    for(let j=0;j<=16;j++){
      const t=.075+.855*j/16;
      const z=start+span*t;
      const y=seamY-.011*m.headSize*t;
      const anchor=localJawSurface(m,side,y,z,.0025*m.headSize);
      if(anchor)seam.push(anchor);
      const lower=localJawSurface(m,side,y-.029*m.headSize-mouthGap*.24,z,.002*m.headSize);
      if(lower)lip.push(lower);
    }
    seams.push(seam);lowerLips.push(lip);
    if(m.dentition==='NONE_VISIBLE')continue;
    const upperCount=m.dentition==='FANGS'?9:m.dentition==='CONICAL'?8:7;
    const lowerCount=m.dentition==='FANGS'?7:m.dentition==='CONICAL'?6:0;
    for(const row of ['UPPER','LOWER'] as const){
      const count=row==='UPPER'?upperCount:lowerCount;
      for(let i=0;i<count;i++){
        const t=.15+.70*(i+.46)/count;
        const z=start+span*t;
        const y=(row==='UPPER'?seamY+.011*m.headSize:seamY-.035*m.headSize-mouthGap*.2)-.011*m.headSize*t;
        const root=localJawSurface(m,side,y,z,.002*m.headSize);
        if(!root)continue;
        const canine=m.dentition==='FANGS'&&(i===1||i===count-2);
        const variable=.88+.24*sample(m.identitySeed,i+101+(row==='LOWER'?50:0));
        const length=m.toothLength*variable*(canine?1.44:1)*(row==='LOWER'?.60:1);
        const direction=row==='UPPER'?-1:1;
        const tipY=y+direction*length;
        const tipZ=z+(canine?.015:-.008)*m.headSize;
        const tipSurface=findVida38ReptileOuterJawX38JB(m,tipY,tipZ);
        // La raíz toca la piel. El extremo queda delante de cualquier superficie
        // que pueda cruzar su trayectoria; nunca se esconde dentro del mentón.
        const rootAbsX=Math.abs(root[0]);
        const tipX=side*(Math.max(rootAbsX+.008*m.headSize,
          (tipSurface??0)+.009*m.headSize)+length*.105);
        const tip:V3=[tipX,tipY,tipZ];
        const radius=clamp(m.headSize*(m.dentition==='FANGS'?.016:
          m.dentition==='CONICAL'?.013:.009),.004,.023);
        const exposedLength=Math.hypot(tipX-root[0],tipY-y,tipZ-z);
        teeth.push(Object.freeze({side,row,index:i,base:root,tip,radius,exposedLength,
          emergence:Math.abs(root[0])-(findVida38ReptileOuterJawX38JB(m,y,z)??0)}));
      }
    }
  }
  return Object.freeze({revision:VIDA38_REPTILE_DENTITION_REVISION,diet,exposure,
    mouthGap,seam:Object.freeze(seams.map(s=>Object.freeze(s))),
    lowerLip:Object.freeze(lowerLips.map(s=>Object.freeze(s))),teeth:Object.freeze(teeth)});
}
