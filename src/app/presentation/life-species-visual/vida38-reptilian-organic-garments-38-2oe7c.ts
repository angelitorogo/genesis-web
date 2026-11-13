/**
 * GENESIS · VIDA.38.2o.e7c — confección anatómica de prendas blandas.
 * Compatible con 38.2o.e7b, sin cambiar contratos, cuerpo SDF ni la cola.
 * La superficie se adapta a cortes transversales del cuerpo y la abertura
 * caudal se recorta mediante intersección subcelular (no se borran quads).
 * No hay Math.random(), texturas externas ni escrituras persistentes.
 */
import * as THREE from 'three';
import type { Vida38HumanoidAnatomy, Vida38HumanoidQuality } from './vida38-humanoid-organic-field-38-2e';
import type { Vida38OrganicGarmentPlan38OE7B } from './vida38-reptilian-organic-garments-38-2oe7b';

type Anatomy38OE7C = Pick<Vida38HumanoidAnatomy, 'legLength' | 'torsoLength' | 'shoulderWidth' | 'hipWidth'>;
export type Vida38TailOpeningCut38OE7C = 'OVAL' | 'TEARDROP' | 'REINFORCED_SLIT';
export type Vida38SoftGarmentSilhouette38OE7C =
  'PRIESTLY_COLUMN' | 'TECHNO_LITURGY' | 'ROYAL_MANTLE' | 'COLONIAL_SPLIT' | 'PELAGIC_FLOW';

export interface Vida38OrganicGarmentFit38OE7C {
  readonly tailRootY: number;
  readonly tailHalfAngle: number;
  readonly tailHalfHeight: number;
  readonly rearDepth: number;
  readonly hemY: number;
  readonly shoulderY: number;
  readonly sleeveDip: number;
  readonly necklineDip: number;
  readonly widthAtHem: number;
  readonly widthAtWaist: number;
  readonly opening: Vida38TailOpeningCut38OE7C;
  readonly silhouette: Vida38SoftGarmentSilhouette38OE7C;
}

export interface Vida38SoftGarmentGeometryStats38OE7C {
  readonly triangleCount: number;
  readonly vertices: number;
  readonly openBoundaryEdges: number;
  readonly nonManifoldEdges: number;
  readonly tailOpeningEdges: number;
  readonly tailOpeningLoop: boolean;
  readonly hemWidth: number;
  readonly necklineWidth: number;
  readonly frontAndBack: boolean;
  readonly cut: Vida38TailOpeningCut38OE7C;
  readonly silhouette: Vida38SoftGarmentSilhouette38OE7C;
}

const clamp = (v: number, min: number, max: number): number => Math.min(max, Math.max(min, v));
const mix = (a: number, b: number, t: number): number => a + (b - a) * t;
const smooth = (v: number): number => { const t = clamp(v, 0, 1); return t*t*(3-2*t); };

function hash32(s: string): number {
  let h = 2166136261;
  for (let i=0;i<s.length;i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0;
  h ^= h >>> 16; h=Math.imul(h,0x85ebca6b)>>>0; h ^= h >>> 13;
  h=Math.imul(h,0xc2b2ae35)>>>0; h ^= h>>>16;
  return h >>> 0;
}

interface CrossSection38OE7C { w:number; front:number; back:number; }
/** Lectura robusta del tronco, ignorando extremidades y cola larga. */
function readTorsoSection(body:THREE.Mesh, y:number, a:Anatomy38OE7C): CrossSection38OE7C {
  const pos=(body.geometry as THREE.BufferGeometry).getAttribute('position');
  const maxX=Math.max(0.28,a.shoulderWidth*0.93);
  let w=0, front=0, back=0, seen=0;
  for(let i=0;i<pos.count;i++) {
    const x=pos.getX(i), py=pos.getY(i), z=pos.getZ(i);
    if(Math.abs(py-y)>0.042 || Math.abs(x)>maxX || z < -0.36 || z > 0.44) continue;
    w=Math.max(w,Math.abs(x)); front=Math.max(front,z); back=Math.max(back,-z); seen++;
  }
  return {
    w:seen>9?Math.max(0.16,w):Math.max(0.16,a.hipWidth*0.93),
    front:seen>9?Math.max(.115,front):.16,
    back:seen>9?Math.max(.11,back):.16,
  };
}

interface BodyMeasures38OE7C {waist:CrossSection38OE7C; chest:CrossSection38OE7C; neck:CrossSection38OE7C; tailY:number;}
function readBodyMeasures38OE7C(body:THREE.Mesh,a:Anatomy38OE7C): BodyMeasures38OE7C {
  const p=a.legLength;
  const waist=readTorsoSection(body,p+0.055,a);
  const chest=readTorsoSection(body,p+a.torsoLength*.49,a);
  const neck=readTorsoSection(body,p+a.torsoLength*.80,a);
  const pos=(body.geometry as THREE.BufferGeometry).getAttribute('position');
  const ys:number[]=[];
  // Muestras al salir de la pelvis hacia -Z: localizan la implantación caudal,
  // sin confundir la punta de la cola con la profundidad de la espalda.
  const rear=waist.back;
  for(let i=0;i<pos.count;i++) {
    const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i);
    if(Math.abs(x)<.16 && z<-(rear+.09) && z>-(rear+.24) && y>p-.20 && y<p+.14) ys.push(y);
  }
  ys.sort((a,b)=>a-b);
  const estimated=ys.length>=8 ? ys[Math.floor(ys.length*.5)]! : p-.055;
  return {waist,chest,neck,tailY:clamp(estimated,p-.15,p+.055)};
}

export function deriveVida38OrganicGarmentFit38OE7C(
  body:THREE.Mesh,a:Anatomy38OE7C,plan:Vida38OrganicGarmentPlan38OE7B,
):Vida38OrganicGarmentFit38OE7C {
  const measures=readBodyMeasures38OE7C(body,a),p=a.legLength;
  const seed=hash32(plan.signature);
  const hem=plan.length==='ANKLE'?Math.max(.12,p*.16):plan.length==='KNEE'?Math.max(.19,p*.47):Math.max(.24,p*.72);
  const silhouette:Vida38SoftGarmentSilhouette38OE7C=plan.kind==='PRIEST_TUNIC'?'PRIESTLY_COLUMN'
    :plan.kind==='TECHNO_HABIT'?'TECHNO_LITURGY':plan.kind==='NOBLE_MANTLE'?'ROYAL_MANTLE'
    :plan.kind==='COLONIAL_OVERCOAT'?'COLONIAL_SPLIT':'PELAGIC_FLOW';
  const opening:Vida38TailOpeningCut38OE7C= ['OVAL','TEARDROP','REINFORCED_SLIT'][seed%3] as Vida38TailOpeningCut38OE7C;
  const halfX=0.105+(seed>>>5)%7*.006;
  const rearDepth=Math.max(.18,measures.waist.back*1.18+.027);
  const halfAngle=clamp(Math.atan2(halfX,rearDepth),.26,.46);
  const height= .125+(seed>>>9)%6*.007;
  const waistW=Math.max(a.hipWidth*1.15,measures.waist.w*1.20,.24);
  const chestW=Math.max(a.shoulderWidth*.97,measures.chest.w*1.17,.27);
  const silhouettes={
    PRIESTLY_COLUMN: .50, TECHNO_LITURGY:.63, ROYAL_MANTLE:.91,
    COLONIAL_SPLIT:.39, PELAGIC_FLOW:.79,
  } as const;
  const hemW=waistW*(1+silhouettes[silhouette]*1.08+(seed>>>18)%7*.012);
  return {
    tailRootY:measures.tailY,tailHalfAngle:halfAngle,tailHalfHeight:height,
    rearDepth,hemY:hem,shoulderY:p+a.torsoLength*.93,
    sleeveDip:.12+((seed>>>21)%6)*.006,necklineDip:.05+((seed>>>25)%5)*.009,
    widthAtHem:hemW,widthAtWaist:waistW,opening,silhouette,
  };
}

interface Sample38OE7C {theta:number; t:number; f:number;}
interface ClothContext38OE7C {
  readonly a:Anatomy38OE7C;
  readonly plan:Vida38OrganicGarmentPlan38OE7B;
  readonly fit:Vida38OrganicGarmentFit38OE7C;
  readonly measures:BodyMeasures38OE7C;
}
function topAt(ctx:ClothContext38OE7C,theta:number):number {
  const sx=Math.sin(theta), cz=Math.cos(theta);
  const atSide=Math.pow(Math.abs(sx),6);
  const front=Math.max(0,cz);
  return ctx.fit.shoulderY - ctx.a.torsoLength*(ctx.fit.sleeveDip*atSide + ctx.fit.necklineDip*front);
}
function softPosition(ctx:ClothContext38OE7C,theta:number,t:number,inset=0):THREE.Vector3 {
  const {a,fit,plan,measures}=ctx,p=a.legLength;
  const y=mix(fit.hemY,topAt(ctx,theta),t);
  const chestT=smooth((y-p)/Math.max(.02,a.torsoLength*.70));
  const lowT=smooth((p+0.07-y)/Math.max(.09,p-fit.hemY));
  const torsoW=mix(fit.widthAtWaist,Math.max(a.shoulderWidth*.98,measures.chest.w*1.23),chestT);
  const w=mix(torsoW,fit.widthAtHem,lowT);
  const front=mix(measures.waist.front*1.21+.025,measures.chest.front*1.22+.03,chestT)*(1+lowT*(plan.kind==='NOBLE_MANTLE'?.70:.48));
  const back=mix(measures.waist.back*1.22+.033,measures.chest.back*1.23+.035,chestT)*(1+lowT*(plan.kind==='NOBLE_MANTLE'?.78:.50));
  const wave= Math.sin(theta*plan.pleatCount+plan.phase+lowT*1.35)*(.005+lowT*.020)
    +Math.sin(theta*(plan.pleatCount+3)-plan.phase*.7+lowT*2.4)*(.002+lowT*.010);
  const sx=Math.sin(theta),cz=Math.cos(theta);
  const x=sx*(w+wave-inset);
  const z=cz*((cz>=0?front:back)+wave*.52-inset);
  return new THREE.Vector3(x,y,z);
}
function sampleAt(ctx:ClothContext38OE7C,theta:number,t:number):Sample38OE7C {
  const y=mix(ctx.fit.hemY,topAt(ctx,theta),t);
  const diff=Math.atan2(Math.sin(theta-Math.PI),Math.cos(theta-Math.PI));
  const tear=ctx.fit.opening==='TEARDROP'?clamp((y-ctx.fit.tailRootY)/ctx.fit.tailHalfHeight,-1,1):0;
  const width=ctx.fit.tailHalfAngle * (ctx.fit.opening==='TEARDROP'?(1-.14*tear):1);
  const height=ctx.fit.tailHalfHeight*(ctx.fit.opening==='REINFORCED_SLIT'?.76:1);
  const f=(diff/width)**2+((y-ctx.fit.tailRootY)/height)**2-1;
  return {theta,t,f};
}
const mixSample=(a:Sample38OE7C,b:Sample38OE7C,alpha:number):Sample38OE7C=>({
  theta:mix(a.theta,b.theta,alpha),t:mix(a.t,b.t,alpha),f:mix(a.f,b.f,alpha),
});
/** Intersección lineal de cada triángulo paramétrico con la isocurva del orificio.
 * Así el contorno es suave y no se eliminan quads enteros (38.2o.e7b).
 */
function clipOutsideHole38OE7C(vertices:readonly Sample38OE7C[]):Sample38OE7C[]{
  const output:Sample38OE7C[]=[];
  for(let i=0;i<vertices.length;i++){
    const a=vertices[i]!,b=vertices[(i+1)%vertices.length]!;
    if(a.f>=0)output.push(a);
    if((a.f<0&&b.f>0)||(a.f>0&&b.f<0)){
      const alpha=clamp(a.f/(a.f-b.f),0,1);
      output.push(mixSample(a,b,alpha));
    }
  }
  return output;
}

interface Edge38OE7C {count:number;a:number;b:number;}
export function createVida38ReptilianTailoredShell38OE7C(
  body:THREE.Mesh,a:Anatomy38OE7C,plan:Vida38OrganicGarmentPlan38OE7B, quality:Vida38HumanoidQuality = 'HIGH',
):THREE.Mesh {
  const fit=deriveVida38OrganicGarmentFit38OE7C(body,a,plan);
  const ctx:ClothContext38OE7C={a,plan,fit,measures:readBodyMeasures38OE7C(body,a)};
  const around=quality==='LOW'?76:112,vertical=quality==='LOW'?50:72;
  const vertices:number[]=[];
  const uvs:number[]=[];
  const indices:number[]=[];
  const cached=new Map<string,number>();
  const edgeMap=new Map<string,Edge38OE7C>();
  const paired=(v:Sample38OE7C):number=>{
    const th=Math.abs(v.theta-2*Math.PI)<1e-7?0:v.theta;
    const key=`${Math.round(th*1e7)}:${Math.round(v.t*1e7)}`;
    const existing=cached.get(key);if(existing!==undefined)return existing;
    const index=vertices.length/3;
    const outer=softPosition(ctx,th,v.t);
    const inner=softPosition(ctx,th,v.t,plan.thickness);
    vertices.push(outer.x,outer.y,outer.z,inner.x,inner.y,inner.z);
    uvs.push(th/(2*Math.PI),v.t,th/(2*Math.PI),v.t);
    cached.set(key,index);return index;
  };
  const push=(a0:number,b0:number,c0:number):void=>{
    if(a0===b0||b0===c0||c0===a0)return;
    const av=new THREE.Vector3(vertices[a0*3]!,vertices[a0*3+1]!,vertices[a0*3+2]!);
    const bv=new THREE.Vector3(vertices[b0*3]!,vertices[b0*3+1]!,vertices[b0*3+2]!);
    const cv=new THREE.Vector3(vertices[c0*3]!,vertices[c0*3+1]!,vertices[c0*3+2]!);
    if(bv.sub(av).cross(cv.sub(av)).lengthSq()<1e-13)return;
    indices.push(a0,b0,c0,c0+1,b0+1,a0+1);
    for(const [a1,b1] of [[a0,b0],[b0,c0],[c0,a0]]){
      const key=`${Math.min(a1,b1)}:${Math.max(a1,b1)}`;
      const prior=edgeMap.get(key);
      if(prior)prior.count++;
      else edgeMap.set(key,{count:1,a:a1,b:b1});
    }
  };
  for(let r=0;r<vertical;r++){
    const t0=r/vertical,t1=(r+1)/vertical;
    for(let c=0;c<around;c++){
      const th0=c/around*2*Math.PI,th1=(c+1)/around*2*Math.PI;
      const a0=sampleAt(ctx,th0,t0),b0=sampleAt(ctx,th1,t0);
      const c0=sampleAt(ctx,th0,t1),d0=sampleAt(ctx,th1,t1);
      for(const tri of [[a0,b0,c0],[b0,d0,c0]]){
        const polygon=clipOutsideHole38OE7C(tri);
        if(polygon.length<3)continue;
        const base=paired(polygon[0]!);
        for(let i=1;i<polygon.length-1;i++)push(base,paired(polygon[i]!),paired(polygon[i+1]!));
      }
    }
  }
  let openingEdges=0;
  for(const edge of edgeMap.values()){
    if(edge.count!==1)continue;
    const a0=edge.a,b0=edge.b;
    indices.push(a0,a0+1,b0,b0,a0+1,b0+1);
    const ay=vertices[a0*3+1]!,by=vertices[b0*3+1]!;
    const az=vertices[a0*3+2]!,bz=vertices[b0*3+2]!;
    if(Math.abs((ay+by)/2-fit.tailRootY)<fit.tailHalfHeight+.025 && az<-.06&&bz<-.06)openingEdges++;
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();geometry.computeBoundingBox();geometry.computeBoundingSphere();
  const fabric=new THREE.MeshPhysicalMaterial({
    color:plan.primaryColor,
    roughness:plan.kind==='PELAGIC_VEIL'?.50:plan.kind==='NOBLE_MANTLE'?.71:.91,
    metalness:plan.kind==='PELAGIC_VEIL'?.09:plan.kind==='NOBLE_MANTLE'?.045:.008,
    side:THREE.DoubleSide,clearcoat:plan.kind==='PELAGIC_VEIL'?.17:.02,
  });
  const mesh=new THREE.Mesh(geometry,fabric);
  mesh.name='VIDA38_2OD_REPTILIAN_GARMENT';mesh.castShadow=true;mesh.receiveShadow=true;
  mesh.userData['garmentPart38OE6']=`OE7B_ROBE_${plan.kind}_FULL_WRAP`;
  mesh.userData['garmentGeom38OE7']=true;
  mesh.userData['garmentGeomKind38OE7']='CONTINUOUS_360_THICK_SHELL';
  mesh.userData['garmentGeomKind38OE7C']='ANATOMIC_CONTINUOUS_SHELL';
  mesh.userData['garmentPlan38OE7B']=plan.signature;
  mesh.userData['garmentCoverage38OE7B']='TORSO_BACK_HIPS_360';
  mesh.userData['tailOpening38OE7B']=true;
  mesh.userData['vida38TailoredFit38OE7C']=fit;
  mesh.userData['garmentStats38OE7B']={
    vertexCount:vertices.length/3,triangleCount:indices.length/3,rearTailOpening:true,
    length:plan.length,closedThickness:true,minimumHemY:fit.hemY,maximumShoulderY:fit.shoulderY,
  };
  mesh.userData['garmentStats38OE7C']={
    triangleCount:indices.length/3,vertices:vertices.length/3,
    openBoundaryEdges:0,nonManifoldEdges:[...edgeMap.values()].filter(e=>e.count>2).length,
    tailOpeningEdges:openingEdges,tailOpeningLoop:openingEdges>8,
    hemWidth:fit.widthAtHem,necklineWidth:fit.widthAtWaist,frontAndBack:true,
    cut:fit.opening,silhouette:fit.silhouette,
  } satisfies Vida38SoftGarmentGeometryStats38OE7C;
  return mesh;
}

function softMaterial38OE7C(color:string,roughness:number,opacity=1):THREE.MeshPhysicalMaterial{
  return new THREE.MeshPhysicalMaterial({color,roughness,metalness:.015,side:THREE.DoubleSide,
    transparent:opacity<1,opacity,depthWrite:opacity>=1});
}
function contourTrim38OE7C(points:THREE.Vector3[],color:string,radius:number,tag:string,closed=true):THREE.Mesh{
  const curve=new THREE.CatmullRomCurve3(points,closed,'centripetal');
  const geometry=new THREE.TubeGeometry(curve,Math.max(24,points.length*2),radius,5,closed);
  const mesh=new THREE.Mesh(geometry,softMaterial38OE7C(color,.65));
  mesh.name='VIDA38_2OD_REPTILIAN_GARMENT';
  mesh.userData['garmentGeom38OE7']=true;
  mesh.userData['garmentGeomKind38OE7C']='ANATOMICAL_EDGE_BINDING';
  mesh.userData['garmentPart38OE6']=tag;
  mesh.castShadow=true;
  return mesh;
}

function createCurvedBackDrape38OE7C(
  ctx:ClothContext38OE7C,side:-1|1,length:number,width:number,color:string,tag:string,opacity=1,
):THREE.Mesh {
  const rows=32,columns=22,positions:number[]=[],indices:number[]=[],uvs:number[]=[];
  const {a,fit,plan}=ctx,p=a.legLength;
  const top=p+a.torsoLength*.84;
  const bottom=Math.max(.14,top-length);
  const midTheta=side<0 ? Math.PI*.76 : Math.PI*1.24;
  const halfSpan=width*.64;
  for(let r=0;r<=rows;r++){
    const t=r/rows,y=mix(top,bottom,t);
    const baseLevel=clamp((y-fit.hemY)/Math.max(.1,topAt(ctx,Math.PI)-fit.hemY),0,1);
    for(let c=0;c<=columns;c++){
      const lateral=(c/columns*2-1);
      const theta=midTheta+lateral*halfSpan*(1+.28*t);
      const point=softPosition(ctx,theta,baseLevel);
      const rad=new THREE.Vector3(Math.sin(theta),0,Math.cos(theta));
      point.addScaledVector(rad,.028+.05*t);
      point.y=y;
      point.addScaledVector(rad,Math.sin(lateral*Math.PI*(2+plan.pleatCount%3)+plan.phase+t)*.021*t);
      positions.push(point.x,point.y,point.z);
      uvs.push(c/columns,t);
    }
  }
  for(let r=0;r<rows;r++)for(let c=0;c<columns;c++){
    const first=r*(columns+1)+c,second=first+columns+1;
    // Two-sided fabric with correct winding for both halves.
    indices.push(first,first+1,second,first+1,second+1,second);
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
  geometry.setIndex(indices);geometry.computeVertexNormals();
  const mesh=new THREE.Mesh(geometry,softMaterial38OE7C(color,plan.kind==='PELAGIC_VEIL'?.43:.81,opacity));
  mesh.name='VIDA38_2OD_REPTILIAN_GARMENT';
  mesh.castShadow=true;
  mesh.userData['garmentGeom38OE7']=true;
  mesh.userData['garmentGeomKind38OE7C']='CONFORMAL_DORSAL_DRAPE';
  mesh.userData['garmentPart38OE6']=tag;
  return mesh;
}

/** Producción de las cinco familias blandas: 360°, volumen real, cola libre. */
export function createVida38ReptilianOrganicGarments38OE7C(
  body:THREE.Mesh,a:Vida38HumanoidAnatomy,plan:Vida38OrganicGarmentPlan38OE7B, quality:Vida38HumanoidQuality = 'HIGH',
):THREE.Mesh[]{
  const shell=createVida38ReptilianTailoredShell38OE7C(body,a,plan,quality);
  const fit=shell.userData['vida38TailoredFit38OE7C'] as Vida38OrganicGarmentFit38OE7C;
  const ctx:ClothContext38OE7C={a,plan,fit,measures:readBodyMeasures38OE7C(body,a)};
  const created:THREE.Mesh[]=[shell];
  const topPoints:THREE.Vector3[]=[],hemPoints:THREE.Vector3[]=[];
  for(let i=0;i<96;i++){
    const angle=i/96*2*Math.PI;
    topPoints.push(softPosition(ctx,angle,1));
    hemPoints.push(softPosition(ctx,angle,0));
  }
  created.push(contourTrim38OE7C(topPoints,plan.primaryColor,.006,'OE7C_NECKLINE_TRIM'));
  created.push(contourTrim38OE7C(hemPoints,plan.primaryColor,.008,'OE7C_HEM_TRIM'));
  // El ribete rodea la abertura ovalada y queda por fuera de su borde geométrico.
  const tailPoints:THREE.Vector3[]=[];
  const tailLift=fit.opening==='REINFORCED_SLIT'?.76:1;
  for(let i=0;i<88;i++){
    const phi=i/88*2*Math.PI;
    const y=fit.tailRootY+fit.tailHalfHeight*tailLift*Math.sin(phi);
    const tear=fit.opening==='TEARDROP'?clamp((y-fit.tailRootY)/fit.tailHalfHeight,-1,1):0;
    const th=Math.PI+fit.tailHalfAngle*(1-.14*tear)*Math.cos(phi);
    const lowerTop=topAt(ctx,th);
    const t=clamp((y-fit.hemY)/Math.max(.1,lowerTop-fit.hemY),0,1);
    const pt=softPosition(ctx,th,t);
    pt.addScaledVector(new THREE.Vector3(Math.sin(th),0,Math.cos(th)),.005);
    tailPoints.push(pt);
  }
  created.push(contourTrim38OE7C(tailPoints,plan.primaryColor,.009,'OE7C_TAIL_OUTLET_BINDING'));
  const capeLength=plan.kind==='NOBLE_MANTLE'?a.torsoLength*1.19
    :plan.kind==='TECHNO_HABIT'?a.torsoLength*.92
    :plan.kind==='PRIEST_TUNIC'?a.torsoLength*.66
    :plan.kind==='COLONIAL_OVERCOAT'?a.torsoLength*.80:a.torsoLength*.64;
  const drapeWidth=plan.kind==='NOBLE_MANTLE'?.94:plan.kind==='PELAGIC_VEIL'?.72
    :plan.kind==='COLONIAL_OVERCOAT'?.65:plan.kind==='TECHNO_HABIT'?.64:.48;
  for(const side of [-1,1] as const){
    // Mantos curvados según el volumen dorsal, separados por una franja caudal.
    if(plan.kind!=='PRIEST_TUNIC'||plan.culture==='BASILICA_TECHNOCRACY'){
      created.push(createCurvedBackDrape38OE7C(ctx,side,capeLength,drapeWidth,plan.primaryColor,
        side<0?'OE7B_LEFT_REAR_MANTLE':'OE7B_RIGHT_REAR_MANTLE',1));
    }
    if(plan.kind==='PELAGIC_VEIL'){
      // Membranas curvas laterales; su traslación es parte del cuerpo, no una caja plana.
      const mesh=createCurvedBackDrape38OE7C(ctx,side,a.legLength*.60,.72,plan.accentColor,
        side<0?'PELAGIC_LEFT_VEIL':'PELAGIC_RIGHT_VEIL',.57);
      created.push(mesh);
    }
  }
  if(plan.culture==='BASILICA_TECHNOCRACY'){
    // Insignia tejida sobre el torso: acompaña la curvatura de la túnica.
    for(const side of [-1,1] as const){
      const line:THREE.Vector3[]=[];
      for(let i=0;i<16;i++){
        const t=.60+i/15*.31;
        const theta=(side<0?2*Math.PI:0)+side*.17;
        const v=softPosition(ctx,theta,t);
        v.addScaledVector(new THREE.Vector3(Math.sin(theta),0,Math.cos(theta)),.011);
        line.push(v);
      }
      created.push(contourTrim38OE7C(line,plan.accentColor,.006,'BASILICA_STOLE_FRONT',false));
    }
  }
  if(plan.kind==='COLONIAL_OVERCOAT'){
    // Faldón funcional continuo con costuras horizontales cerca de cadera.
    const line:THREE.Vector3[]=[];
    for(let i=0;i<=44;i++){
      const theta=-Math.PI*.45+i/44*Math.PI*.90;
      const v=softPosition(ctx,theta,.61);
      v.addScaledVector(new THREE.Vector3(Math.sin(theta),0,Math.cos(theta)),.008);
      line.push(v);
    }
    created.push(contourTrim38OE7C(line,plan.accentColor,.005,'OE7C_COLONIAL_SEAM',false));
  }
  for(const mesh of created){
    mesh.userData['garmentPlan38OE7B']=plan.signature;
    mesh.userData['garmentGeom38OE7']=true;
    mesh.userData['garmentRefinement38OE7C']=true;
  }
  return created;
}
