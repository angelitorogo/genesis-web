/**
 * 38.2s8 — indumentaria avanzada contemporánea y escafandras con ajuste a cráneo real.
 * Única ruta: REPTILIAN + ADVANCED. No se invoca en VERY_ADVANCED.
 */
import * as THREE from 'three';
import type { Vida38HumanoidAnatomy } from './vida38-humanoid-organic-field-38-2e';
import type { Vida38AdvancedReptilianPlan38S } from './vida38-advanced-reptilian-plan-38-2s';
import { vida38Hash38S } from './vida38-advanced-reptilian-plan-38-2s';
import { deriveVida38AdvancedReptilianWardrobe38S4 } from './vida38-advanced-reptilian-wardrobe-38-2s4';

export const VIDA38_ADV_REPT_DIVERSITY_REVISION_38S8 = 'VIDA.38.2s8/reptilian-advanced-cultural-clothing/v1' as const;
export const VIDA38_ADV_REPT_STYLES_38S8 = [
  'CIVIC_MODERN', 'INDUSTRIAL_WORKWEAR', 'FIELD_RESEARCH', 'FRONTIER_EXPLORER',
  'TACTICAL_SECURITY', 'EVA_PRESSURE', 'FLIGHT_CREW', 'DIPLOMATIC_FORMAL',
  'MEDICAL_RESPONSE', 'ACADEMIC_CEREMONIAL',
] as const;
export type Vida38AdvancedReptilianStyle38S8 = typeof VIDA38_ADV_REPT_STYLES_38S8[number];
export type Vida38AdvancedReptilianHelmet38S8 =
  'EVA_TRANSPARENT' | 'EVA_FACETED' | 'PRESSURE_HOOD' | 'PILOT_OPEN' | 'RESPIRATOR' | 'NONE';

export interface Vida38AdvancedReptilianDesign38S8 {
  readonly revision: typeof VIDA38_ADV_REPT_DIVERSITY_REVISION_38S8;
  readonly style: Vida38AdvancedReptilianStyle38S8;
  readonly helmet: Vida38AdvancedReptilianHelmet38S8;
  readonly hemLength: number;
  readonly shoulderSpread: number;
  readonly layerVolume: number;
  readonly detailVariant: number;
  readonly culturalContrast: number;
  readonly signature: string;
}

const choose = (p: Vida38AdvancedReptilianPlan38S, key: string) =>
  vida38Hash38S(`${p.speciesId}|38s8|${key}|${p.culture}`);
const unit = (p: Vida38AdvancedReptilianPlan38S, key: string) => choose(p, key) / 0xffffffff;
const clamp = (v: number, low: number, high: number) => Math.min(high, Math.max(low, v));

export function deriveVida38AdvancedReptilianDesign38S8(p: Vida38AdvancedReptilianPlan38S): Vida38AdvancedReptilianDesign38S8 {
  let style: Vida38AdvancedReptilianStyle38S8 = 'CIVIC_MODERN';
  switch (p.role) {
    case 'PILOT': style = choose(p, 'space-or-flight') % 5 === 0 ? 'FLIGHT_CREW' : 'EVA_PRESSURE'; break;
    case 'SCIENTIST': style = 'FIELD_RESEARCH'; break;
    case 'MEDIC': style = 'MEDICAL_RESPONSE'; break;
    case 'SECURITY': style = 'TACTICAL_SECURITY'; break;
    case 'ENGINEER': style = choose(p, 'industry-space') % 4 === 0 ? 'FLIGHT_CREW' : 'INDUSTRIAL_WORKWEAR'; break;
    case 'TECHNICIAN': style = choose(p, 'mechanic') % 3 === 0 ? 'FLIGHT_CREW' : 'INDUSTRIAL_WORKWEAR'; break;
    case 'EXPLORER': case 'COLONIST': style = 'FRONTIER_EXPLORER'; break;
    case 'DIPLOMAT': style = 'DIPLOMATIC_FORMAL'; break;
    case 'SCHOLAR': style = 'ACADEMIC_CEREMONIAL'; break;
    case 'ADMINISTRATOR': style = 'CIVIC_MODERN'; break;
    case 'ANALYST': style = choose(p, 'analyst') % 4 === 0 ? 'FIELD_RESEARCH' : 'CIVIC_MODERN'; break;
  }
  if (p.culture === 'ORBITAL_SYNDICATE' && style === 'INDUSTRIAL_WORKWEAR' && choose(p,'orbital') % 3 === 0)
    style = 'FLIGHT_CREW';
  let helmet: Vida38AdvancedReptilianHelmet38S8 = 'NONE';
  if (style === 'EVA_PRESSURE') helmet = (['EVA_TRANSPARENT','EVA_FACETED','PRESSURE_HOOD'] as const)[choose(p,'helmet') % 3]!;
  else if (style === 'FLIGHT_CREW') helmet = 'PILOT_OPEN';
  else if (style === 'FRONTIER_EXPLORER' && choose(p,'respirator') % 3 === 0) helmet = 'RESPIRATOR';
  const hemLength = ({
    CIVIC_MODERN:.11, INDUSTRIAL_WORKWEAR:.07, FIELD_RESEARCH:.41, FRONTIER_EXPLORER:.29,
    TACTICAL_SECURITY:.06, EVA_PRESSURE:.04, FLIGHT_CREW:.04, DIPLOMATIC_FORMAL:.26,
    MEDICAL_RESPONSE:.37, ACADEMIC_CEREMONIAL:.52,
  } as Record<Vida38AdvancedReptilianStyle38S8,number>)[style] + unit(p, 'hem') * .09;
  const shoulderSpread = .016 + unit(p,'shoulders')*.065 +
    (style==='TACTICAL_SECURITY'||style==='EVA_PRESSURE'?.105:style==='DIPLOMATIC_FORMAL'?.055:0);
  const layerVolume = .027 + unit(p,'volume')*.055 +
    (style==='ACADEMIC_CEREMONIAL'||style==='FRONTIER_EXPLORER'?.07:0);
  const detailVariant = choose(p,'details')%8;
  const culturalContrast = unit(p,'contrast');
  return Object.freeze({revision:VIDA38_ADV_REPT_DIVERSITY_REVISION_38S8,style,helmet,
    hemLength,shoulderSpread,layerVolume,detailVariant,culturalContrast,
    signature:[style,helmet,hemLength.toFixed(5),shoulderSpread.toFixed(5),layerVolume.toFixed(5),detailVariant,p.culture,p.role].join('|'),
  });
}

function material(hex:string,finish:'FABRIC'|'TECH'|'ARMOR'|'GLASS'='FABRIC'):THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color:hex,roughness:finish==='FABRIC'?.9:finish==='TECH'?.48:finish==='ARMOR'?.39:.12,
    metalness:finish==='ARMOR'?.30:finish==='TECH'?.09:0,
    clearcoat:finish==='GLASS'?.82:.03,
    transparent:finish==='GLASS',opacity:finish==='GLASS'?.23:1,
    depthWrite:finish!=='GLASS',side:finish==='GLASS'?THREE.FrontSide:THREE.DoubleSide,
  });
}
function add(out:THREE.Object3D[],object:THREE.Object3D,name:string,d:Vida38AdvancedReptilianDesign38S8):void {
  object.name=`VIDA38_S8_${name}`;
  object.userData['vida38AdvancedReptilianDiversity38S8']=VIDA38_ADV_REPT_DIVERSITY_REVISION_38S8;
  object.userData['vida38AdvancedReptilianDiversityStyle38S8']=d.style;
  if(object instanceof THREE.Mesh)object.castShadow=true;
  out.push(object);
}
function bead(x:number,y:number,z:number,rx:number,ry:number,rz:number,hex:string,finish:'FABRIC'|'TECH'|'ARMOR'='FABRIC'):THREE.Mesh {
  const o=new THREE.Mesh(new THREE.SphereGeometry(1,16,10),material(hex,finish));
  o.position.set(x,y,z);o.scale.set(rx,ry,rz);return o;
}
function tube(points:readonly THREE.Vector3[],radius:number,hex:string,finish:'FABRIC'|'TECH'|'ARMOR'='TECH'):THREE.Mesh {
  return new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([...points]),24,radius,7,false),material(hex,finish));
}
function caseMesh(w:number,h:number,depth:number,hex:string,finish:'FABRIC'|'TECH'|'ARMOR'='TECH'):THREE.Mesh {
  const shape=new THREE.Shape(),r=Math.min(w,h)*.19;
  shape.moveTo(-w/2+r,-h/2);shape.lineTo(w/2-r,-h/2);shape.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r);
  shape.lineTo(w/2,h/2-r);shape.quadraticCurveTo(w/2,h/2,w/2-r,h/2);
  shape.lineTo(-w/2+r,h/2);shape.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r);
  shape.lineTo(-w/2,-h/2+r);shape.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2);
  const obj=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelThickness:.008,bevelSize:.009,bevelSegments:2,steps:1,curveSegments:5}),material(hex,finish));
  return obj;
}

/** Tejido envolvente continuo por bandas; abierto por cola cuando cae bajo cintura. */
function drape(top:number,bottom:number,rxTop:number,rxBottom:number,rzTop:number,rzBottom:number,
  hex:string,seed:number,params:{gapFront?:number;tailOpen?:boolean;folds?:number;waist?:number;shoulderSpread?:number}={}):THREE.Mesh {
  const rings=20,vertices:number[]=[],idx:number[]=[];
  const frontGap=params.gapFront??0;
  const tailOpen=params.tailOpen??false;
  // Cuando hay abertura frontal Y caudal, construir dos paños anatómicos;
  // cada paño sigue siendo una superficie continua con costado, no tiras rígidas.
  const sections:readonly (readonly [number,number])[] = frontGap>0 && tailOpen
    ? [[frontGap,Math.PI-.16],[Math.PI+.16,2*Math.PI-frontGap]]
    : frontGap>0 ? [[frontGap,2*Math.PI-frontGap]]
      : tailOpen ? [[Math.PI+.16,Math.PI*3-.16]] : [[0,Math.PI*2]];
  for(const [thetaStart,thetaEnd] of sections){
    const sectors=sections.length===2?26:48;
    const vertexOffset=vertices.length/3;
    for(let j=0;j<=rings;j++){
      const v=j/rings;
      const y=top+(bottom-top)*v;
      const flare=Math.pow(v,1.45);
      const rx=rxTop+(rxBottom-rxTop)*flare+(params.shoulderSpread??0)*Math.pow(1-v,3);
      const rz=rzTop+(rzBottom-rzTop)*flare;
      const waisting=params.waist===undefined?0:.028*Math.max(0,1-Math.abs(y-params.waist)/.3);
      for(let i=0;i<=sectors;i++){
        const t=thetaStart+(thetaEnd-thetaStart)*i/sectors;
        const fold=(Math.sin((params.folds??9)*t+seed*.00017)+.36*Math.sin(13*t+seed*.00021))*.013*v;
        const hem=j===rings?Math.sin(t*(params.folds??9)+seed*.00007)*.011:0;
        vertices.push((rx-waisting+fold)*Math.sin(t),y+hem,(rz+fold*.7)*Math.cos(t));
        if(i>0&&j>0){const n=vertexOffset+j*(sectors+1)+i;
          idx.push(n,n-1,n-sectors-2,n,n-sectors-2,n-sectors-1);}
      }
    }
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setIndex(idx);g.computeVertexNormals();
  return new THREE.Mesh(g,material(hex,'FABRIC'));
}

export interface Vida38AdvancedReptilianCranialEnvelope38S8 {
  readonly center:readonly [number,number,number];
  readonly radius:readonly [number,number,number];
  readonly sampledVertices:number;
  readonly peakNormalizedRadius:number;
}
/**
 * Medir el cráneo realmente deformado por 38.2o, incluido hocico: no usar solo anatomy.headWidth.
 * El casco es un elipsoide cerrado que contiene todos los vértices cefálicos considerados.
 */
export function deriveVida38AdvancedReptilianCranialEnvelope38S8(body:THREE.Mesh,a:Vida38HumanoidAnatomy,
  cranialParts:readonly THREE.Object3D[]=[]):Vida38AdvancedReptilianCranialEnvelope38S8 {
  const pos=body.geometry.getAttribute('position');
  if(!pos)throw new Error('38.2s8: cuerpo SDF sin posiciones cefálicas');
  const eyeY=a.legLength+(1.18+(a.neckLength-1)*.14)*a.torsoLength;
  const minSampleY=eyeY-Math.max(a.headHeight*.70,.17);
  let xmin=Infinity,ymin=Infinity,zmin=Infinity,xmax=-Infinity,ymax=-Infinity,zmax=-Infinity,count=0;
  // Análisis una vez por ejemplar; se usa el mismo cuerpo SDF que el visor.
  for(let i=0;i<pos.count;i++){
    const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i);
    if(y<minSampleY)continue;
    xmin=Math.min(xmin,x);xmax=Math.max(xmax,x);
    ymin=Math.min(ymin,y);ymax=Math.max(ymax,y);
    zmin=Math.min(zmin,z);zmax=Math.max(zmax,z);count++;
  }
  const ornamentCorners:THREE.Vector3[]=[];
  for(const part of cranialParts){
    if(!/(?:REPTILIAN_CREST|REPTILIAN_HORN|REPTILIAN_PLATE|REPTILIAN_BARBEL|REPTILIAN_EYE)/.test(part.name))continue;
    const bb=new THREE.Box3().setFromObject(part);
    if(bb.isEmpty()||bb.max.y<minSampleY)continue;
    for(const px of [bb.min.x,bb.max.x])for(const py of [bb.min.y,bb.max.y])
      for(const pz of [bb.min.z,bb.max.z]){
        const point=new THREE.Vector3(px,py,pz);ornamentCorners.push(point);
        xmin=Math.min(xmin,px);xmax=Math.max(xmax,px);
        ymin=Math.min(ymin,py);ymax=Math.max(ymax,py);
        zmin=Math.min(zmin,pz);zmax=Math.max(zmax,pz);
      }
  }
  if(count<30)throw new Error('38.2s8: no se pudo medir el cráneo reptiliano del SDF');
  const cx=(xmin+xmax)/2,cy=(ymin+ymax)/2,cz=(zmin+zmax)/2;
  let rx=(xmax-xmin)/2+.074,ry=(ymax-ymin)/2+.099,rz=(zmax-zmin)/2+.096;
  let maxQ=0;
  for(let i=0;i<pos.count;i++){
    const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i);
    if(y<minSampleY)continue;
    const q=((x-cx)/rx)**2+((y-cy)/ry)**2+((z-cz)/rz)**2;
    maxQ=Math.max(maxQ,q);
  }
  for(const corner of ornamentCorners){
    const q=((corner.x-cx)/rx)**2+((corner.y-cy)/ry)**2+((corner.z-cz)/rz)**2;
    maxQ=Math.max(maxQ,q);
  }
  // Elipsoide real debe contener incluso la comisura del hocico en tres cuartos.
  const safe=Math.sqrt(Math.max(1,maxQ))*1.045;
  rx*=safe;ry*=safe;rz*=safe;
  return Object.freeze({center:[cx,cy,cz] as const,radius:[rx,ry,rz] as const,sampledVertices:count,peakNormalizedRadius:1/1.045});
}

/** Escafandra cerrada: tamaño derivado de la cabeza real, con sello y zonas translúcidas. */
export function buildVida38AdvancedReptilianHelmet38S8(body:THREE.Mesh,a:Vida38HumanoidAnatomy,
  d:Vida38AdvancedReptilianDesign38S8,hex:string,trim:string,
  cranialParts:readonly THREE.Object3D[]=[]):THREE.Object3D[] {
  if(d.helmet==='NONE')return [];
  const out:THREE.Object3D[]=[];
  const mount=(o:THREE.Object3D,label:string)=>add(out,o,`HELMET_${label}`,d);
  const env=deriveVida38AdvancedReptilianCranialEnvelope38S8(body,a,cranialParts);
  const [cx,cy,cz]=env.center,[rx,ry,rz]=env.radius;
  const full=d.helmet==='EVA_TRANSPARENT'||d.helmet==='EVA_FACETED'||d.helmet==='PRESSURE_HOOD';
  if(full){
    const shell=new THREE.Mesh(new THREE.SphereGeometry(1,d.helmet==='EVA_FACETED'?20:32,22),material('#c4d5e2','GLASS'));
    shell.scale.set(rx,ry,rz);shell.position.set(cx,cy,cz);shell.renderOrder=3;
    mount(shell,'CLOSED_GLASS_DOME');
    // La cúpula queda entera; la base cervical queda por debajo de la barbilla.
    const rim=new THREE.Mesh(new THREE.TorusGeometry(rx*.89,.024,9,44),material(hex,'ARMOR'));
    rim.rotation.x=Math.PI/2;rim.scale.y=rz/rx*.84;
    rim.position.set(cx,cy-ry*.83,cz);mount(rim,'SEALED_NECK_RING');
    for(const side of [-1,1] as const){
      mount(bead(cx+side*rx*.95,cy-.04,cz,.034,.083,.052,trim,'ARMOR'),'SIDE_LATCH');
    }
    if(d.helmet==='PRESSURE_HOOD'){
      const top=new THREE.Mesh(new THREE.SphereGeometry(1,24,12,0,Math.PI*2,0,Math.PI*.55),material(hex,'FABRIC'));
      top.scale.set(rx*1.025,ry*1.01,rz*1.015);top.position.set(cx,cy+.01,cz);
      mount(top,'SOFT_HOOD_CAP');
    }
    if(d.helmet==='EVA_FACETED'){
      for(const side of [-1,1] as const){
        mount(tube([new THREE.Vector3(cx+side*rx*.79,cy-ry*.43,cz+rz*.36),
          new THREE.Vector3(cx+side*rx*.75,cy+ry*.05,cz+rz*.55),
          new THREE.Vector3(cx+side*rx*.43,cy+ry*.61,cz+rz*.51)],.012,trim,'ARMOR'),'FACET_FRAME');
      }
    }
  } else if(d.helmet==='PILOT_OPEN'){
    const upper=new THREE.Mesh(new THREE.SphereGeometry(1,26,12,0,Math.PI*2,0,Math.PI*.46),material(hex,'ARMOR'));
    upper.scale.set(rx*1.015,ry*1.05,rz*1.01);upper.position.set(cx,cy+.025,cz);mount(upper,'OPEN_PILOT_CAP');
    const visor=bead(cx,cy+ry*.08,cz+rz*.85,rx*.79,ry*.25,.035,'#3f667c','TECH');
    mount(visor,'PILOT_VISOR');
  } else {
    const respirator=bead(cx,cy-ry*.40,cz+rz*.92,rx*.46,ry*.24,.048,hex,'ARMOR');
    mount(respirator,'FILTER_MASK');
  }
  return out;
}

export function buildVida38AdvancedReptilianDiverseClothing38S8(a:Vida38HumanoidAnatomy,
  body:THREE.Mesh,p:Vida38AdvancedReptilianPlan38S,
  cranialParts:readonly THREE.Object3D[]=[]):THREE.Object3D[]{
  const d=deriveVida38AdvancedReptilianDesign38S8(p);
  const base=deriveVida38AdvancedReptilianWardrobe38S4(p),out:THREE.Object3D[]=[];
  const shoulder=a.legLength+a.torsoLength*.86,waist=a.legLength+.065;
  const chest=(shoulder+waist)/2;
  const front=.415;
  const gap=(d.detailVariant%3)*.025;
  const seed=choose(p,'shape');
  const addPart=(o:THREE.Object3D,n:string)=>add(out,o,n,d);
  const longStyle=d.style==='FIELD_RESEARCH'||d.style==='MEDICAL_RESPONSE'||d.style==='ACADEMIC_CEREMONIAL';
  const closed=d.style==='EVA_PRESSURE'||d.style==='FLIGHT_CREW'||d.style==='INDUSTRIAL_WORKWEAR';
  const length=longStyle?d.hemLength:Math.min(d.hemLength,.3);
  const bottom=waist-length;
  const rxTop=.39+d.shoulderSpread*.45, rxBot=.40+d.layerVolume*.9+(longStyle?.065:0);
  const rzTop=.36+d.layerVolume*.42,rzBot=.365+d.layerVolume*.68;

  // Segunda capa de distinta lectura: chaleco corto, abrigo abierto, uniforme, manto, etc.
  const frontGap=longStyle||d.style==='DIPLOMATIC_FORMAL'||d.style==='FRONTIER_EXPLORER'? .20+gap:0;
  const wrap=drape(shoulder+.025,bottom,rxTop,rxBot,rzTop,rzBot,
    d.style==='MEDICAL_RESPONSE'?base.innerHex:d.style==='ACADEMIC_CEREMONIAL'?base.equipmentHex:base.outerHex,
    seed,{gapFront:frontGap,tailOpen:length>.19,folds:longStyle?11:7,waist,shoulderSpread:d.shoulderSpread});
  addPart(wrap,`OUTER_${d.style}_360`);
  addPart(tube([new THREE.Vector3(-.28,shoulder+.025,.29),new THREE.Vector3(0,shoulder+.025,.39),
    new THREE.Vector3(.28,shoulder+.025,.29)],.013,base.trimHex), 'TAILORED_NECK_EDGE');
  if(longStyle||d.style==='DIPLOMATIC_FORMAL'){
    // El paño dorsal es independiente de las solapas pero no sustituye a la prenda envolvente.
    const cape=drape(shoulder-.012,waist-length-.05,.41+d.shoulderSpread,.44+d.layerVolume*1.25,
      .40,.46+d.layerVolume,base.outerHex,seed+15,{gapFront:.83,folds:12,waist});
    cape.rotation.y=Math.PI;
    addPart(cape,'TAILORED_BACK_CAPE');
  }
  if(d.style==='FRONTIER_EXPLORER'){
    const poncho=drape(shoulder+.06,waist-.21,.46+d.shoulderSpread,.55+d.layerVolume,
      .40,.47+d.layerVolume,base.innerHex,seed+12,{gapFront:.63,folds:8});
    addPart(poncho,'EXPEDITION_PONCHO');
  }
  if(d.style==='TACTICAL_SECURITY'||d.style==='EVA_PRESSURE'){
    for(const side of [-1,1] as const){
      addPart(bead(side*(a.shoulderWidth+.09),shoulder-.035,.025,.19+d.shoulderSpread*.30,.11,.22,
        base.equipmentHex,'ARMOR'),'SEGMENTED_SHOULDER');
      addPart(bead(side*(a.hipWidth*.72),a.legLength*.44,.19,.10,.24,.09,
        base.equipmentHex,'ARMOR'),'SHIN_GUARD');
    }
    const chestplate=caseMesh(.40,.29,.022,base.equipmentHex,'ARMOR');
    chestplate.position.set(0,chest+.09,front+.015);addPart(chestplate,'TORSO_PROTECTION');
  }
  if(d.style==='INDUSTRIAL_WORKWEAR'||d.style==='FLIGHT_CREW'){
    for(const side of [-1,1] as const){
      addPart(tube([new THREE.Vector3(side*.24,shoulder,.34),
        new THREE.Vector3(side*.12,chest,.43),new THREE.Vector3(side*.22,waist+.025,.36)],
        .019,base.trimHex),'HARNESS_STRAP');
    }
  }
  if(d.style==='CIVIC_MODERN'||d.style==='DIPLOMATIC_FORMAL'||d.style==='FIELD_RESEARCH'||d.style==='MEDICAL_RESPONSE'){
    for(const side of [-1,1] as const){
      addPart(tube([new THREE.Vector3(side*.095,shoulder+.02,.34),
        new THREE.Vector3(side*.19,chest+.11,.425),new THREE.Vector3(side*.13,waist+.045,.42)],
        d.style==='DIPLOMATIC_FORMAL'?.024:.013,base.trimHex),'PROFESSIONAL_LAPEL');
    }
  }
  // Accesorios coherentes con oficio, con volúmenes visibles en las miniaturas.
  if(d.style==='FIELD_RESEARCH'||d.style==='MEDICAL_RESPONSE'){
    const satchel=caseMesh(.17,.20,.045,base.equipmentHex,'TECH');
    satchel.position.set(-.30,waist-.07,.26);satchel.rotation.y=-.45;
    addPart(satchel,d.style==='MEDICAL_RESPONSE'?'MEDICAL_CARRY_KIT':'SAMPLE_TABLET');
    addPart(bead(.20,chest+.18,front+.03,.054,.054,.02,base.trimHex,'TECH'),'PROFESSION_BADGE');
  }
  if(d.style==='FRONTIER_EXPLORER'||d.style==='EVA_PRESSURE'||d.style==='FLIGHT_CREW'){
    const dimensions=d.style==='EVA_PRESSURE'?[.21,.26,.17] as const:[.19,.24,.12] as const;
    const bag=bead(0,chest,-.43,dimensions[0],dimensions[1],dimensions[2],base.equipmentHex,'TECH');
    addPart(bag,d.style==='EVA_PRESSURE'?'EVA_LIFE_SUPPORT_PACK':'FIELD_BACKPACK');
  }
  if(d.style==='INDUSTRIAL_WORKWEAR'||d.style==='TACTICAL_SECURITY'){
    for(const side of [-1,1] as const){
      const pouch=caseMesh(.13,.14,.04,base.equipmentHex,'TECH');
      pouch.position.set(side*.34,waist-.11,.15);pouch.rotation.y=side*.35;
      addPart(pouch,'SIDE_UTILITY_POCKET');
    }
  }
  if(d.style==='ACADEMIC_CEREMONIAL'||d.style==='DIPLOMATIC_FORMAL'){
    const clasp=bead(0,shoulder-.065,front+.015,.075,.05,.025,base.trimHex,'ARMOR');
    addPart(clasp,'CULTURAL_CLOAK_CLASP');
    for(const side of [-1,1] as const){
      const claspTail=tube([new THREE.Vector3(side*.04,shoulder-.10,front+.018),
        new THREE.Vector3(side*.14,chest+.02,front+.019),new THREE.Vector3(side*.11,waist+.03,front+.017)],
        .012,base.trimHex);addPart(claspTail,'CEREMONIAL_TRIM');
    }
  }
  if(d.style==='FLIGHT_CREW'){
    addPart(bead(0,chest+.11,front+.025,.14,.085,.019,base.trimHex,'TECH'),'COCKPIT_CONTROL_PATCH');
  }
  if(d.style==='CIVIC_MODERN'){
    const badge=caseMesh(.067,.075,.012,base.trimHex,'ARMOR');
    badge.position.set(-.19,shoulder-.20,front+.015);addPart(badge,'CIVIC_ID_BADGE');
  }
  if(!closed&&d.detailVariant%2===0){
    const cuff=tube([new THREE.Vector3(-.34,waist+.04,.22),
      new THREE.Vector3(0,waist+.04,.36),new THREE.Vector3(.34,waist+.04,.22)],.016,base.equipmentHex);
    addPart(cuff,'WAIST_SEAM');
  }
  for(const helmetPart of buildVida38AdvancedReptilianHelmet38S8(body,a,d,base.equipmentHex,base.trimHex,cranialParts))out.push(helmetPart);
  return out;
}
