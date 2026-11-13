/** Esqueleto botánico CPU independiente de Three.js; usado por render y auditorías. */
import type { Vida38PlantMorphology38L } from './vida38-plant-morphology-38-2l';
export type PlantPoint38L = readonly [number,number,number];
export interface Vida38PlantStem38L {readonly points:readonly PlantPoint38L[];readonly radius:number;readonly depth:number;}
export interface Vida38PlantLeafAnchor38L {readonly position:PlantPoint38L;readonly direction:PlantPoint38L;readonly size:number;readonly twist:number;readonly branchIndex:number;}
export interface Vida38PlantArchitecture38L {
 readonly stems:readonly Vida38PlantStem38L[];
 readonly leaves:readonly Vida38PlantLeafAnchor38L[];
 readonly flowers:readonly Vida38PlantLeafAnchor38L[];
 readonly bounds:Readonly<{min:PlantPoint38L;max:PlantPoint38L}>;
}
const add=(a:PlantPoint38L,b:PlantPoint38L):PlantPoint38L=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]];
const sub=(a:PlantPoint38L,b:PlantPoint38L):PlantPoint38L=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
const times=(a:PlantPoint38L,n:number):PlantPoint38L=>[a[0]*n,a[1]*n,a[2]*n];
const normalize=(a:PlantPoint38L):PlantPoint38L=>{const m=Math.hypot(...a)||1;return times(a,1/m);};
const mix=(a:PlantPoint38L,b:PlantPoint38L,t:number):PlantPoint38L=>add(times(a,1-t),times(b,t));
const clamp=(x:number,a:number,b:number)=>Math.max(a,Math.min(b,x));
function unit(seed:number,salt:number):number {let x=(seed^Math.imul(salt+173,0x9e3779b9))>>>0;x^=x>>>16;x=Math.imul(x,0x7feb352d);x^=x>>>15;x=Math.imul(x,0x846ca68b);x^=x>>>16;return (x>>>0)/4294967295;}

/** Genera todas las hojas insertadas en ramas; no existen partículas 'flotantes'. */
export function buildVida38PlantArchitecture38L(m:Vida38PlantMorphology38L):Vida38PlantArchitecture38L {
 const stems:Vida38PlantStem38L[]=[],leaves:Vida38PlantLeafAnchor38L[]=[],flowers:Vida38PlantLeafAnchor38L[]=[];
 let serial=0;
 const rand=()=>unit(m.seed,201+serial++);
 const angle=(t:number)=>t*2.399963229728653;
 const dir=(a:number,y:number):PlantPoint38L=>normalize([Math.cos(a),y,Math.sin(a)]);
 const leaf=(pos:PlantPoint38L,out:PlantPoint38L,size:number,branchIndex:number):void=>{
   const direction=normalize(out);const anchor={position:pos,direction,size,twist:rand()*Math.PI*2,branchIndex};
   leaves.push(anchor);
   if(m.flowering!=='NONE' && rand()<m.reproductiveDensity*.060)flowers.push(anchor);
 };
 function addStem(points:readonly PlantPoint38L[],radius:number,depth:number,foliage=0):void {
   const branchIndex=stems.length;
   stems.push({points,radius,depth});
   if(!foliage)return;
   const end=points[points.length-1]!,prev=points[points.length-2]!,axis=normalize(sub(end,prev));
   // Filotaxis: bases sobre la rama; las puntas se dirigen lejos del eje.
   for(let j=0;j<foliage;j++){
     const t=clamp(.32+(.67*(j+.35)/foliage),.15,.99);
     const section=Math.min(points.length-2,Math.floor(t*(points.length-1)));
     const point=mix(points[section]!,points[section+1]!,t*(points.length-1)-section);
     const a=angle(j)+rand()*.32;
     const side=dir(a,m.archetype==='WEEPING_TREE'?-.28:.32+rand()*.57);
     const outbound=normalize(add(times(side,.88),times(axis,.34)));
     leaf(point,outbound,m.leafLength*(.69+rand()*.56),branchIndex);
   }
 }
 const tree=m.form==='TREE',shrub=m.form==='SHRUB';
 const spread=m.canopyRadius*m.spread;
 if(tree){
   const trunkTop=m.height*(m.archetype==='PALMIFORM_TREE'?.89:m.archetype==='UMBRELLA_TREE'?.80:.74);
   const trunkPoints:PlantPoint38L[]=[];
   const steps=7;
   for(let i=0;i<=steps;i++){
     const t=i/steps; trunkPoints.push([m.curvature*Math.sin(t*2.6)*.85, trunkTop*t, m.curvature*t*t*.64]);
   }
   addStem(trunkPoints,m.stemRadius,0);
   const radialCount=m.archetype==='PALMIFORM_TREE'?11:m.archetype==='COLUMNAR_TREE'?20:27;
   for(let i=0;i<radialCount;i++){
     const phi=angle(i)+rand()*.34;
     const w=i/radialCount;
     const h=m.archetype==='PALMIFORM_TREE'?trunkTop*(.94+.04*rand()):
       m.archetype==='UMBRELLA_TREE'?trunkTop*(.80+.20*rand()):
       m.archetype==='CONICAL_TREE'?trunkTop*(.24+.73*w):
       trunkTop*(.37+.59*rand());
     const base=mix(trunkPoints[0]!,trunkPoints[steps]!,h/trunkTop);
     const range=m.archetype==='CONICAL_TREE'?spread*(1.12-h/trunkTop*.78):
       m.archetype==='COLUMNAR_TREE'?spread*.65:
       m.archetype==='UMBRELLA_TREE'?spread*1.2:spread;
     const r=range*(.52+rand()*.62);
     const lift=m.archetype==='PALMIFORM_TREE'?.08:m.archetype==='UMBRELLA_TREE'?.25:
       m.archetype==='WEEPING_TREE'?.32: .44+rand()*.34;
     const bending=m.droop*(.21+rand()*.39);
     const p1:PlantPoint38L=[base[0]+Math.cos(phi)*r*.31,base[1]+lift*.6,base[2]+Math.sin(phi)*r*.31];
     const p2:PlantPoint38L=[base[0]+Math.cos(phi)*r*.71,Math.min(m.height*.98,base[1]+lift),base[2]+Math.sin(phi)*r*.71];
     const p3:PlantPoint38L=[base[0]+Math.cos(phi)*r,Math.max(.13,p2[1]+.07-bending),base[2]+Math.sin(phi)*r];
     const branchPoints=[base,p1,p2,p3] as const;
     addStem(branchPoints,m.stemRadius*(.36+rand()*.27),1,m.archetype==='PALMIFORM_TREE'?13:8+Math.round(7*m.canopyDensity));
     if(m.branchLevel>1&&m.archetype!=='PALMIFORM_TREE'){
       for(let b=0;b<2;b++){
         const start=mix(p1,p2,b===0?.39:.79);
         const angle2=phi+(b===0?-.62:.73);
         const len=r*(.26+rand()*.33);
         const mid:PlantPoint38L=[start[0]+Math.cos(angle2)*len*.48,start[1]+len*.36,start[2]+Math.sin(angle2)*len*.48];
         const tip:PlantPoint38L=[start[0]+Math.cos(angle2)*len,start[1]+len*(.36-m.droop*.54),start[2]+Math.sin(angle2)*len];
         addStem([start,mid,tip],m.stemRadius*.14,2,6+Math.round(m.canopyDensity*5));
       }
     }
   }
 } else if(shrub){
   for(let s=0;s<m.stemCount;s++){
     const phi=angle(s)+rand()*.32;
     const reach=spread*(.33+rand()*.57);
     const height=m.height*(.70+rand()*.30);
     const base:PlantPoint38L=[Math.cos(phi)*.07,0,Math.sin(phi)*.07];
     const mid:PlantPoint38L=[Math.cos(phi)*reach*.28,height*.52,Math.sin(phi)*reach*.28];
     const tip:PlantPoint38L=[Math.cos(phi)*reach*.67,height,Math.sin(phi)*reach*.67];
     addStem([base,mid,tip],m.stemRadius*(.70+rand()*.46),0,8+Math.round(m.canopyDensity*7));
     const subCount=m.archetype==='CANE_SHRUB'?2:4;
     for(let b=0;b<subCount;b++){
       const p=mix(mid,tip,.15+b/subCount*.67);
       const theta=phi+(b%2?1:-1)*(.48+rand()*.65);
       const len=spread*(.29+rand()*.42);
       const end:PlantPoint38L=[p[0]+Math.cos(theta)*len,p[1]+len*(m.archetype==='SPRAWLING_SHRUB'?.12:.33),p[2]+Math.sin(theta)*len];
       addStem([p,mix(p,end,.55),end],m.stemRadius*.39,1,6+Math.round(m.canopyDensity*7));
     }
   }
 } else {
   const rosette=m.archetype==='ROSETTE'||m.archetype==='SUCCULENT'||m.archetype==='FERN';
   for(let s=0;s<m.stemCount;s++){
     const phi=angle(s)+rand()*.38;
     const base:PlantPoint38L=[Math.cos(phi)*.05,0,Math.sin(phi)*.05];
     const h=m.height*(rosette?.24+rand()*.24:.54+rand()*.45);
     const r=spread*(rosette?.60+rand()*.39:.23+rand()*.30);
     const mid:PlantPoint38L=[Math.cos(phi)*r*.47,h*.66,Math.sin(phi)*r*.47];
     const tip:PlantPoint38L=[Math.cos(phi)*r,h,Math.sin(phi)*r];
     addStem([base,mid,tip],m.stemRadius*(.5+rand()*.6),0,rosette?3:5+Math.round(m.canopyDensity*3));
     if(rosette){
       // Láminas basales de roseta/helecho nacen en el mismo punto de inserción.
       for(let k=0;k<3;k++)leaf(mix(base,mid,.05+k*.25),dir(phi+.24*(k-1),.4+rand()*.25),m.leafLength*(1.4+rand()*.52),stems.length-1);
     }
   }
 }
 const pMin:[number,number,number]=[Infinity,Infinity,Infinity];
 const pMax:[number,number,number]=[-Infinity,-Infinity,-Infinity];
 const update=(p:PlantPoint38L)=>{for(let i=0;i<3;i++){pMin[i]=Math.min(pMin[i]!,p[i]!);pMax[i]=Math.max(pMax[i]!,p[i]!);}};
 for(const stem of stems)for(const p of stem.points)update(p);
 for(const l of leaves)update(add(l.position,times(l.direction,l.size)));
 return Object.freeze({stems,leaves,flowers,bounds:{min:pMin,max:pMax}});
}
