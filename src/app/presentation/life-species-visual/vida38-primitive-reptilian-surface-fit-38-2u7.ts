/** 38.2u7 — accesorios apoyados en secciones de la MALLA SDF real.
 * No se modifican vertices ni materiales del cuerpo y no se usa un radio humanoide supuesto.
 * Secciones calculadas bajo demanda y descartadas al terminar la fábrica del ejemplar.
 */
import * as THREE from 'three';
import type { Vida38HumanoidAnatomy } from './vida38-humanoid-organic-field-38-2e';
import type { Vida38PrimitiveReptilianPlan38U } from './vida38-primitive-reptilian-plan-38-2u';

export const VIDA38_PRIMITIVE_SURFACE_REVISION_38U7 = 'VIDA.38.2u7/sdf-surface-attachment/v1' as const;
type XY = Readonly<{x:number;z:number}>;
export type SurfaceSlice38U7 = Readonly<{y:number; loops:readonly (readonly XY[])[]}>;
const EPS=0.00016;
const key=(v:XY)=>`${Math.round(v.x/EPS)},${Math.round(v.z/EPS)}`;
const dist2=(a:XY,b:XY)=>(a.x-b.x)**2+(a.z-b.z)**2;
const avg=(points:readonly XY[])=>({x:points.reduce((s,p)=>s+p.x,0)/points.length,z:points.reduce((s,p)=>s+p.z,0)/points.length});
const material=(hex:string)=>new THREE.MeshStandardMaterial({color:hex,roughness:.82,metalness:0,side:THREE.DoubleSide});

/** Cortar los triángulos existentes con un plano horizontal. No se deducen radios de hombros. */
export function sectionFromSdfMesh38U7(body:THREE.Mesh,y:number):SurfaceSlice38U7{
  body.updateMatrix();
  const geometry=body.geometry as THREE.BufferGeometry;
  const positions=geometry.getAttribute('position');
  if(!positions)return {y,loops:[]};
  const index=geometry.getIndex();
  const edges:{a:XY;b:XY}[]=[];
  const cache=new Map<number,THREE.Vector3>();
  const point=(i:number)=>{
    let p=cache.get(i);
    if(!p){p=new THREE.Vector3().fromBufferAttribute(positions,i).applyMatrix4(body.matrix);cache.set(i,p);}
    return p;
  };
  const n=index?index.count:positions.count;
  for(let k=0;k+2<n;k+=3){
    const a=point(index?index.getX(k):k),b=point(index?index.getX(k+1):k+1),c=point(index?index.getX(k+2):k+2);
    const crossings:XY[]=[];
    for(const [u,v] of [[a,b],[b,c],[c,a]] as const){
      if((u.y<y&&v.y>=y)||(v.y<y&&u.y>=y)){
        const t=(y-u.y)/(v.y-u.y);crossings.push({x:u.x+(v.x-u.x)*t,z:u.z+(v.z-u.z)*t});
      }
    }
    if(crossings.length===2&&dist2(crossings[0]!,crossings[1]!)>1e-12)edges.push({a:crossings[0]!,b:crossings[1]!});
  }
  // Unir segmentos por extremos cuantizados: la geometría SDF es una superficie indexada cerrada.
  const adjacent=new Map<string,number[]>();
  for(let i=0;i<edges.length;i++)for(const p of [edges[i]!.a,edges[i]!.b]){
    const k=key(p);const indices=adjacent.get(k)??[];indices.push(i);adjacent.set(k,indices);
  }
  const visited=new Set<number>(),loops:XY[][]=[];
  for(let i=0;i<edges.length;i++){
    if(visited.has(i))continue;
    const line:XY[]=[];let current=i;let from=edges[i]!.a;
    for(let safety=0;safety<=edges.length;safety++){
      if(visited.has(current))break;
      visited.add(current);const edge=edges[current]!;
      const next=dist2(edge.a,from)<=dist2(edge.b,from)?edge.b:edge.a;
      if(line.length===0)line.push(from);
      line.push(next);
      if(key(next)===key(line[0]!))break;
      const candidate=(adjacent.get(key(next))??[]).find(j=>!visited.has(j));
      if(candidate===undefined)break;
      current=candidate;from=next;
    }
    if(line.length>=5&&dist2(line[0]!,line[line.length-1]!)<EPS*EPS*16){line.pop();loops.push(line);}
  }
  return {y,loops};
}
function bounds(a:readonly XY[]){
  return {minX:Math.min(...a.map(p=>p.x)),maxX:Math.max(...a.map(p=>p.x)),minZ:Math.min(...a.map(p=>p.z)),maxZ:Math.max(...a.map(p=>p.z))};
}
function area(a:readonly XY[]){let sum=0;for(let i=0;i<a.length;i++){const p=a[i]!,q=a[(i+1)%a.length]!;sum+=p.x*q.z-q.x*p.z;}return Math.abs(sum*.5);}
function inside(points:readonly XY[],p:XY){let yes=false;for(let i=0,j=points.length-1;i<points.length;j=i++){
  const a=points[i]!,b=points[j]!;if((a.z>p.z)!==(b.z>p.z)&&p.x<(b.x-a.x)*(p.z-a.z)/(b.z-a.z)+a.x)yes=!yes;
}return yes;}
function bodyLoop(slice:SurfaceSlice38U7):readonly XY[]|null{
  const loops=slice.loops.filter(l=>{const b=bounds(l);return b.minX<0&&b.maxX>0&&b.minZ<0&&b.maxZ>0&&inside(l,{x:0,z:0});});
  return loops.sort((a,b)=>area(b)-area(a))[0]??null;
}
/** Elige un brazo separado del tronco. Cuando no existe contorno independiente, NO se añade brazalete. */
export function armLoop38U7(slice:SurfaceSlice38U7,side:-1|1):readonly XY[]|null{
  const eligible=slice.loops.map(loop=>({loop,c:avg(loop),b:bounds(loop),area:area(loop)}))
    .filter(x=>side*x.c.x>0.22&&side*(side===1?x.b.maxX:x.b.minX)>0.29&&x.area>0.002&&x.area<0.22);
  eligible.sort((a,b)=>side*b.c.x-side*a.c.x);
  return eligible[0]?.loop??null;
}
/** Muestrea el contorno real con rayos 2D desde su centro; no usa radio idealizado. */
function radiusAt(loop:readonly XY[],center:XY,theta:number):number|null{
  const dx=Math.sin(theta),dz=Math.cos(theta);
  let r=Infinity;
  for(let i=0;i<loop.length;i++){
    const a=loop[i]!,b=loop[(i+1)%loop.length]!;
    const ex=b.x-a.x,ez=b.z-a.z;
    const det=dx*ez-dz*ex;
    if(Math.abs(det)<1e-10)continue;
    const ax=a.x-center.x,az=a.z-center.z;
    const t=(ax*ez-az*ex)/det;
    const u=(ax*dz-az*dx)/det;
    if(t>0&&u>=-0.001&&u<=1.001)r=Math.min(r,t);
  }
  return Number.isFinite(r)?r:null;
}
export function makeSurfaceCuff38U7(
  slices:readonly SurfaceSlice38U7[],side:-1|1,label:string,hex:string,
  verticalHeight:number,margin=0.014,
):THREE.Mesh|null{
  if(slices.length!==3)return null;
  const loops=slices.map(slice=>armLoop38U7(slice,side));
  if(loops.some(x=>x===null))return null;
  const centers=loops.map(loop=>avg(loop!));
  // Semicírculo exterior (suficiente para verse como brazalete) con abertura interior hacia el tronco.
  const segments=28,vertices:number[]=[],indices:number[]=[];
  for(let row=0;row<3;row++){
    const loop=loops[row]!,center=centers[row]!,y=slices[row]!.y;
    for(let i=0;i<=segments;i++){
      const theta=side*Math.PI/2+(i/segments-.5)*Math.PI*1.28;
      const r=radiusAt(loop,center,theta);
      if(r===null)return null;
      const lift=margin+0.002*Math.sin(i*0.8);
      vertices.push(center.x+Math.sin(theta)*(r+lift),y,center.z+Math.cos(theta)*(r+lift));
      if(row>0&&i>0){const k=row*(segments+1)+i;indices.push(k,k-segments-2,k-1,k,k-segments-1,k-segments-2);}
    }
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();
  const mesh=new THREE.Mesh(g,material(hex));mesh.name=`VIDA38_U_${label}`;
  mesh.userData['vida38PrimitiveReptilianPart38U']='ACCESSORY';
  mesh.userData['vida38PrimitiveSurfaceFit38U7']=VIDA38_PRIMITIVE_SURFACE_REVISION_38U7;
  mesh.userData['surfaceGap38U7']=margin;
  mesh.userData['bandHeight38U7']=verticalHeight;
  return mesh;
}

/** Proyecta sobre la silueta exterior del tronco la parte alta de una prenda.
 * Conserva la caída libre del borde inferior; no modifica la malla corporal.
 */
export function fitWearToTorso38U7(body:THREE.Mesh,garment:THREE.Mesh,sliceCache:Map<number,readonly XY[]|null>=new Map()):boolean{
  if(!(garment.geometry instanceof THREE.BufferGeometry))return false;
  const position=garment.geometry.getAttribute('position');
  if(!position||position.count<30)return false;
  const name=garment.name;
  if(!/(TUNIC|MANTLE|SHOULDER_HIDE|SKIRT|CAPE|CHEST_WRAPPING|BACK_WRAPPING)/.test(name))return false;
  const yvals=Array.from({length:position.count},(_,i)=>position.getY(i));
  const ymin=Math.min(...yvals),ymax=Math.max(...yvals);
  const g=garment.geometry.clone();const verts=g.getAttribute('position');
  let fitted=0;
  for(let i=0;i<verts.count;i++){
    const x=verts.getX(i),y=verts.getY(i),z=verts.getZ(i);const r=Math.hypot(x,z);
    if(r<1e-5)continue;
    const yBin=Math.round(y/.09);
    if(!sliceCache.has(yBin))sliceCache.set(yBin,bodyLoop(sectionFromSdfMesh38U7(body,yBin*.09)));
    const loop=sliceCache.get(yBin);if(!loop)continue;
    const surfaceR=radiusAt(loop,{x:0,z:0},Math.atan2(x,z));if(surfaceR===null)continue;
    const fall=Math.max(0,Math.min(1,(ymax-y)/Math.max(.05,ymax-ymin)));
    const gap=.018+.030*fall*fall;
    const target=Math.max(surfaceR+gap,Math.min(r,surfaceR+gap+.075*fall));
    verts.setXYZ(i,x*target/r,y,z*target/r);fitted++;
  }
  if(fitted<verts.count*.30){g.dispose();return false;}
  g.computeVertexNormals();const previous=garment.geometry;garment.geometry=g;previous.dispose();
  garment.userData['vida38PrimitiveSurfaceFit38U7']=VIDA38_PRIMITIVE_SURFACE_REVISION_38U7;
  return true;
}

function addAdornment(out:THREE.Object3D[],piece:THREE.Mesh,name:string){
  piece.name=`VIDA38_U_${name}`;
  piece.userData['vida38PrimitiveReptilianPart38U']='ACCESSORY';
  piece.userData['vida38PrimitiveSurfaceFit38U7']=VIDA38_PRIMITIVE_SURFACE_REVISION_38U7;
  out.push(piece);
}
function tube(points:THREE.Vector3[],r:number,hex:string){
  return new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),Math.max(16,points.length*4),r,6,false),material(hex));
}
function removeOld(out:THREE.Object3D[],predicate:(name:string)=>boolean){
  for(let i=out.length-1;i>=0;i--){const obj=out[i]!;if(predicate(obj.name)){
    out.splice(i,1);obj.traverse(node=>{if(node instanceof THREE.Mesh){node.geometry.dispose();
      for(const m of Array.isArray(node.material)?node.material:[node.material])m.dispose();}});
  }}
}
/** Colgantes unidos a un cordón: no se permiten objetos sueltos sin un cable de soporte. */
function fitNecklace38U7(body:THREE.Mesh,out:THREE.Object3D[],anatomy:Vida38HumanoidAnatomy,plan:Vida38PrimitiveReptilianPlan38U){
  const selected=plan.wear==='CHIEF_REGALIA'||plan.wear==='SHAMAN_REGALIA'||
    plan.accessories.includes('BONE_NECKLACE')||plan.accessories.includes('BEAD_NECKLACE');
  if(!selected)return;
  removeOld(out,name=>/NECKLACE|NECKLACE_TALON|EXTRA_TRIBAL_PENDANT/.test(name));
  const y=anatomy.legLength+anatomy.torsoLength*.86+.015;
  const loop=bodyLoop(sectionFromSdfMesh38U7(body,y));if(!loop)return;
  const center=avg(loop),points:THREE.Vector3[]=[];
  for(let i=0;i<=48;i++){
    const angle=i/48*Math.PI*2,r=radiusAt(loop,center,angle);
    if(r===null)return;
    points.push(new THREE.Vector3(center.x+Math.sin(angle)*(r+.034),y-.022*Math.max(0,Math.cos(angle)),center.z+Math.cos(angle)*(r+.034)));
  }
  addAdornment(out,tube(points,.010,plan.outerHex),'SURFACE_NECKLACE_CORD');
  const front=points[0]!;const bottom=front.clone().add(new THREE.Vector3(0,-.13,.065));
  addAdornment(out,tube([points[3]!,new THREE.Vector3(front.x+.06,y-.055,front.z+.028),bottom,
    new THREE.Vector3(front.x-.06,y-.055,front.z+.028),points[45]!],.008,plan.innerHex),'SURFACE_PENDANT_SUPPORT');
  const pendant=new THREE.Mesh(new THREE.ConeGeometry(.039,.092,7),material(plan.accentHex));
  pendant.position.copy(bottom).add(new THREE.Vector3(0,-.045,0));pendant.rotation.x=Math.PI;
  addAdornment(out,pendant,'SURFACE_ATTACHED_BONE_PENDANT');
}
function fitTotem38U7(out:THREE.Object3D[],anatomy:Vida38HumanoidAnatomy,plan:Vida38PrimitiveReptilianPlan38U){
  if(!plan.accessories.includes('TOTEM'))return;
  removeOld(out,name=>/ACCESSORY_VISIBLE_TOTEM_STAFF|ACCESSORY_TOTEM_CARVING/.test(name));
  // Vara con dos correas visibles conectadas a la prenda: si no hay arnés no se representa flotando.
  const waist=anatomy.legLength+.065,side=plan.wear==='CHIEF_REGALIA'?-1:1;
  const top=new THREE.Vector3(side*.28,waist+.43,-.23),bottom=new THREE.Vector3(side*.29,waist-.14,-.24);
  addAdornment(out,tube([top,bottom],.022,plan.outerHex),'TOTEM_BELT_MOUNTED_STAFF');
  for(const dy of [.08,.28]){
    const center=new THREE.Vector3(side*.28,waist+dy,-.23);
    addAdornment(out,tube([center.clone().add(new THREE.Vector3(-.065,0,.026)),
      center.clone().add(new THREE.Vector3(0,-.015,.075)),
      center.clone().add(new THREE.Vector3(.065,0,.026))],.014,plan.innerHex),`TOTEM_SUPPORT_${dy}`);
  }
}
/** Sustituye únicamente las piezas claramente defectuosas de 38.2u6. */
export function adaptVida38PrimitiveWearToRealSdf38U7(
  body:THREE.Mesh,out:THREE.Object3D[],anatomy:Vida38HumanoidAnatomy,plan:Vida38PrimitiveReptilianPlan38U,
):{cuffs:number;garments:number;supports:number}{
  // No conservar anillos aproximados: si no podemos medir un brazo, lo dejamos sin aro.
  removeOld(out,name=>/BICEPS_RING|FOREARM_RING|LEATHER_CUFF/.test(name));
  let cuffs=0,garments=0;
  const armSlices=new Map<number,SurfaceSlice38U7>();
  const armSection=(y:number):SurfaceSlice38U7=>{
    const k=Math.round(y/.008);
    let section=armSlices.get(k);
    if(!section){section=sectionFromSdfMesh38U7(body,k*.008);armSlices.set(k,section);}
    return section;
  };
  const shoulder=anatomy.legLength+anatomy.torsoLength*.86;
  const chest=(anatomy.legLength+.065+shoulder)/2;
  const wanted=plan.wear==='WARRIOR_LEATHERS'||plan.wear==='SHAMAN_REGALIA'||plan.wear==='CHIEF_REGALIA'||
    plan.wear==='HUNTER_STRAPS'||plan.accessories.includes('WRIST_BINDINGS')||plan.accessories.includes('SHIN_BINDINGS');
  if(wanted){
    for(const side of [-1,1] as const){
      for(const kind of (plan.wear==='WARRIOR_LEATHERS'||plan.wear==='SHAMAN_REGALIA'||plan.wear==='CHIEF_REGALIA' ? ['upper','lower'] : ['upper']) as ('upper'|'lower')[]){
        const nominal=kind==='upper'?chest+(shoulder-chest)*.40:chest-(chest-(anatomy.legLength+.065))*.20;
        const h=kind==='upper'?.078:.068;
        // Buscar alrededor de la altura teórica una sección en la que el brazo sea un contorno independiente.
        let slices:SurfaceSlice38U7[]|null=null;
        for(const shift of [0,-.08,-.16,.05]){
          const candidate=[nominal+shift-h/2,nominal+shift,nominal+shift+h/2].map(armSection);
          if(candidate.every(s=>armLoop38U7(s,side)!==null)){slices=candidate;break;}
        }
        if(!slices)continue;
        const label=`SDF_${kind==='upper'?'BICEPS':'FOREARM'}_CUFF_${side===1?'R':'L'}`;
        const piece=makeSurfaceCuff38U7(slices,side,label,plan.accentHex,h,.018);
        if(piece){out.push(piece);cuffs++;}
      }
    }
  }
  const torsoSlices=new Map<number,readonly XY[]|null>();
  for(const object of [...out]){
    if(object instanceof THREE.Mesh&&object.userData['vida38PrimitiveReptilianPart38U']==='GARMENT'&&fitWearToTorso38U7(body,object,torsoSlices))garments++;
  }
  fitNecklace38U7(body,out,anatomy,plan);
  fitTotem38U7(out,anatomy,plan);
  const supports=out.filter(x=>x.name.includes('SURFACE_NECKLACE_CORD')||x.name.includes('TOTEM_SUPPORT')).length;
  return {cuffs,garments,supports};
}
