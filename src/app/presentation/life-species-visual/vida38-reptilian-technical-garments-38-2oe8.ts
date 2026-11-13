/**
 * GENESIS · VIDA.38.2o.e8 — prendas técnicas y protección anatómica.
 * Placas curvilíneas, blindaje estratificado, subtraje SDF 360° y botas/grebas
 * perfectamente ajustadas a la malla de piel. Sin cajas, Math.random ni persistencia.
 * No interviene en las prendas blandas ya aceptadas (38.2o.e7c).
 */
import * as THREE from 'three';
import type { Vida38HumanoidAnatomy, Vida38HumanoidQuality } from './vida38-humanoid-organic-field-38-2e';

export const VIDA38_TECH_GARMENT_REVISION_38OE8 = 'VIDA.38.2o.e8a/technical-armor/stabilized-v2' as const;
export type Vida38TechArmorFamily38OE8 = 'SEGMENTED_ARMOR' | 'COLONIAL_RIG';
export type Vida38TechArmorMaterial38OE8 = 'NANOCERAMIC' | 'BRUSHED_ALLOY' | 'COMPOSITE_LAMINATE';
export type Vida38TechArmorSilhouette38OE8 = 'CARAPACE' | 'TACTICAL_LAMELLAR' | 'INDUSTRIAL_HARNESS' | 'FIELD_EXPLORER';
export type Vida38TechArmorDiscipline38OE8 = 'MILITARY_SEGMENTED' | 'TACTICAL_EXPLORER' | 'COLONIAL_INDUSTRIAL' | 'TECHNO_PRIEST_ARMORED' | 'CEREMONIAL_NOBLE';

export interface Vida38TechArmorPlan38OE8 {
  readonly revision: typeof VIDA38_TECH_GARMENT_REVISION_38OE8;
  readonly family: Vida38TechArmorFamily38OE8;
  readonly silhouette: Vida38TechArmorSilhouette38OE8;
  readonly discipline: Vida38TechArmorDiscipline38OE8;
  readonly materialKind: Vida38TechArmorMaterial38OE8;
  readonly primaryHex: string;
  readonly secondaryHex: string;
  readonly glowHex: string;
  readonly plateCount: number;
  readonly widthScale: number;
  readonly shellThickness: number;
  readonly segmentSpacing: number;
  readonly shoulderScale: number;
  readonly asymmetry: number;
  readonly panelFlowPhase: number;
  readonly collarHeight: number;
  readonly waistTaper: number;
  readonly bootBulk: number;
  readonly gauntletBulk: number;
  readonly dorsalWrap: number;
  readonly signature: string;
}

function hash32(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619) >>> 0;
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b) >>> 0;
  h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35) >>> 0;
  h ^= h >>> 16;
  return h >>> 0;
}
const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));
const mix = (a: number, b: number, t: number): number => a + (b-a)*t;

/** Estética y complejidad se derivan de identidad + contexto cultural estable. */
export function deriveVida38TechArmorPlan38OE8(args: {
  speciesId: string;
  appearanceFingerprint: string;
  family: Vida38TechArmorFamily38OE8;
  garmentLine: string;
  culture: string;
}): Vida38TechArmorPlan38OE8 {
  const identity = `${args.speciesId}|${args.appearanceFingerprint}|${args.family}|${args.garmentLine}|${args.culture}|38.2oe8a`;
  const morphologySeed = hash32(`SHAPE:${identity}`);
  const materialSeed = hash32(`MATERIAL:${identity}`);
  const detailSeed = hash32(`DETAIL:${identity}`);
  const materials: readonly Vida38TechArmorMaterial38OE8[] = ['NANOCERAMIC','BRUSHED_ALLOY','COMPOSITE_LAMINATE'];
  const materialKind = materials[materialSeed % materials.length]!;
  const military = args.garmentLine === 'MILITARY';
  const explorer = args.garmentLine === 'EXPLORER';
  const industrial = args.garmentLine === 'INDUSTRIAL_COLONIZER';
  const noble = args.garmentLine === 'NOBLE';
  const technoPriest = args.garmentLine === 'TECHNO_PRIEST' || args.culture === 'BASILICA_TECHNOCRACY';
  const discipline: Vida38TechArmorDiscipline38OE8 = technoPriest
    ? 'TECHNO_PRIEST_ARMORED'
    : (industrial ? 'COLONIAL_INDUSTRIAL'
      : (explorer ? 'TACTICAL_EXPLORER'
        : (noble || args.culture === 'STAR_KINGDOM' ? 'CEREMONIAL_NOBLE'
          : (military || args.family === 'SEGMENTED_ARMOR' ? 'MILITARY_SEGMENTED' : 'TACTICAL_EXPLORER'))));
  const silhouette: Vida38TechArmorSilhouette38OE8 = discipline === 'COLONIAL_INDUSTRIAL'
    ? 'INDUSTRIAL_HARNESS'
    : discipline === 'TACTICAL_EXPLORER'
      ? 'FIELD_EXPLORER'
      : (discipline === 'TECHNO_PRIEST_ARMORED' ? 'CARAPACE' : ((morphologySeed & 1) === 0 ? 'TACTICAL_LAMELLAR' : 'CARAPACE'));
  const culture = args.culture;
  const primaryHex = culture === 'OBSIDIAN_CLAN' ? '#19212b'
    : culture === 'FRONTIER_HEGEMONY' ? '#233543'
    : culture === 'PELAGIC_CONCORD' ? '#184450'
    : culture === 'DUNE_MANDATE' ? '#334149'
    : culture === 'STAR_KINGDOM' ? '#29354c'
    : culture === 'BASILICA_TECHNOCRACY' ? '#1d242d'
    : '#263642';
  const secondaryHex = materialKind === 'BRUSHED_ALLOY' ? '#809aaa'
    : materialKind === 'NANOCERAMIC' ? '#748a99' : '#527b86';
  const glowHex = culture === 'PELAGIC_CONCORD' ? '#6cf6ed'
    : culture === 'FRONTIER_HEGEMONY' ? '#47d7a9'
    : culture === 'STAR_KINGDOM' ? '#72cafa'
    : culture === 'BASILICA_TECHNOCRACY' ? '#4aeaca'
    : (detailSeed & 1) ? '#54c9eb' : '#59f0cc';
  const plateCount = discipline === 'MILITARY_SEGMENTED' ? 4 + (detailSeed % 2)
    : discipline === 'TECHNO_PRIEST_ARMORED' ? 3
    : args.family === 'SEGMENTED_ARMOR' ? 3 + (detailSeed % 2)
    : 2 + (detailSeed % 2);
  const widthScale = 0.95 + ((morphologySeed >>> 4) % 8) * 0.017 + (discipline === 'CEREMONIAL_NOBLE' ? 0.018 : 0);
  const shellThickness = 0.008 + ((morphologySeed >>> 9) % 5) * 0.002 + (discipline === 'MILITARY_SEGMENTED' ? 0.002 : 0);
  const segmentSpacing = 0.012 + ((detailSeed >>> 5) % 4) * 0.003;
  const shoulderScale = 0.96 + ((detailSeed >>> 11) % 8) * 0.023 + (discipline === 'CEREMONIAL_NOBLE' ? 0.05 : discipline === 'MILITARY_SEGMENTED' ? 0.03 : 0);
  const asymmetry = ((detailSeed >>> 16) % 9 - 4) * 0.011;
  const panelFlowPhase = hash32(`FLOW:${identity}`) / 0xffffffff * Math.PI * 2;
  const collarHeight = discipline === 'TECHNO_PRIEST_ARMORED' ? 0.14 : discipline === 'CEREMONIAL_NOBLE' ? 0.11 : discipline === 'TACTICAL_EXPLORER' ? 0.06 : 0.08;
  const waistTaper = discipline === 'COLONIAL_INDUSTRIAL' ? 0.10 : discipline === 'TACTICAL_EXPLORER' ? 0.08 : 0.04;
  const bootBulk = discipline === 'COLONIAL_INDUSTRIAL' ? 1.10 : discipline === 'MILITARY_SEGMENTED' ? 1.08 : 1.00;
  const gauntletBulk = discipline === 'MILITARY_SEGMENTED' ? 1.12 : discipline === 'TECHNO_PRIEST_ARMORED' ? 1.04 : 0.98;
  const dorsalWrap = discipline === 'CEREMONIAL_NOBLE' ? 1.08 : discipline === 'TACTICAL_EXPLORER' ? 0.92 : 1.0;
  const signature = [discipline,silhouette,materialKind,plateCount,widthScale.toFixed(4),shellThickness.toFixed(4),
    segmentSpacing.toFixed(4),shoulderScale.toFixed(4),asymmetry.toFixed(4),panelFlowPhase.toFixed(6),
    collarHeight.toFixed(4),waistTaper.toFixed(4),bootBulk.toFixed(4),gauntletBulk.toFixed(4),dorsalWrap.toFixed(4),
    primaryHex,secondaryHex,glowHex].join('|');
  return {revision:VIDA38_TECH_GARMENT_REVISION_38OE8, family:args.family,silhouette,discipline,materialKind,
    primaryHex,secondaryHex,glowHex,plateCount,widthScale,shellThickness,segmentSpacing,
    shoulderScale,asymmetry,panelFlowPhase,collarHeight,waistTaper,bootBulk,gauntletBulk,dorsalWrap,signature};
}

function armorMaterial(plan: Vida38TechArmorPlan38OE8, kind: 'PLATE'|'TRIM'|'UNDERLAY'): THREE.MeshPhysicalMaterial {
  const spec = plan.materialKind === 'BRUSHED_ALLOY'
    ? {roughness:0.34,metalness:0.77,clearcoat:0.14}
    : plan.materialKind === 'NANOCERAMIC'
      ? {roughness:0.44,metalness:0.24,clearcoat:0.35}
      : {roughness:0.51,metalness:0.18,clearcoat:0.18};
  if (kind === 'UNDERLAY') return new THREE.MeshPhysicalMaterial({color:'#101f2d',roughness:0.84,metalness:0.04,side:THREE.DoubleSide});
  if (kind === 'TRIM') return new THREE.MeshPhysicalMaterial({color:plan.glowHex,roughness:0.27,metalness:0.33,
    emissive:plan.glowHex,emissiveIntensity:0.26,clearcoat:0.35,side:THREE.DoubleSide});
  return new THREE.MeshPhysicalMaterial({color:plan.primaryHex,...spec,side:THREE.DoubleSide});
}

/** Cada pieza llega al visor con metadatos equivalentes a los anteriores. */
function label(mesh: THREE.Mesh, part: string, plan: Vida38TechArmorPlan38OE8, kind: string): THREE.Mesh {
  mesh.name = 'VIDA38_2OD_REPTILIAN_GARMENT';
  mesh.userData['garmentPart38OE6'] = part;
  mesh.userData['garmentGeom38OE8'] = kind;
  mesh.userData['garmentMaterial38OE8'] = plan.materialKind;
  mesh.userData['garmentRevision38OE8'] = VIDA38_TECH_GARMENT_REVISION_38OE8;
  mesh.userData['garmentPlan38OE8'] = plan.signature;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

type ArmorAnatomy = Pick<Vida38HumanoidAnatomy,'legLength'|'torsoLength'|'shoulderWidth'|'hipWidth'|'hipSpacing'>;
interface CrossSection38OE8 { w: number; front: number; back: number; }
interface TorsoSample38OE8 { y: number; section: CrossSection38OE8; }
/** Medida de la piel real por secciones. Las extremidades y la cola no inflan el torso. */
function sectionAt38OE8(body: THREE.Mesh, a:ArmorAnatomy, y:number): CrossSection38OE8 {
  const pos = body.geometry.getAttribute('position');
  let front = 0, back = 0, width = 0, seen = 0;
  const tolerance = Math.max(0.035,a.torsoLength*0.055);
  for(let i=0;i<pos.count;i++){
    const x=pos.getX(i), py=pos.getY(i), z=pos.getZ(i);
    if(Math.abs(py-y)>tolerance || Math.abs(x)>a.shoulderWidth*0.91 || Math.abs(z)>0.55)continue;
    if(Math.abs(x)<a.shoulderWidth*0.58){front=Math.max(front,z);back=Math.max(back,-z);}
    width=Math.max(width,Math.abs(x));seen++;
  }
  return {w:seen>6?Math.max(a.hipWidth*0.82,width):Math.max(a.hipWidth*0.88,a.shoulderWidth*0.78),
    front:Math.max(0.13,front),back:Math.max(0.13,back)};
}
function sampleTorso38OE8(body: THREE.Mesh, a:ArmorAnatomy): TorsoSample38OE8[] {
  const output:TorsoSample38OE8[]=[];
  for(let k=0;k<13;k++){
    const y=a.legLength+a.torsoLength*mix(0.10,0.90,k/12);
    output.push({y,section:sectionAt38OE8(body,a,y)});
  }
  return output;
}
function interpolate38OE8(samples:readonly TorsoSample38OE8[], y:number):CrossSection38OE8{
  if(y<=samples[0]!.y)return samples[0]!.section;
  for(let i=1;i<samples.length;i++){
    const b=samples[i]!,a=samples[i-1]!;
    if(y>b.y)continue;
    const t=clamp((y-a.y)/Math.max(1e-4,b.y-a.y),0,1);
    return {w:mix(a.section.w,b.section.w,t),front:mix(a.section.front,b.section.front,t),back:mix(a.section.back,b.section.back,t)};
  }
  return samples[samples.length-1]!.section;
}

interface PlateConfig38OE8{
  readonly fromY:number; readonly toY:number;
  readonly centerAngle:number; readonly halfAngle:number;
  readonly offset:number; readonly taper:number; readonly flare:number;
  readonly part:string; readonly material:'PLATE'|'TRIM';
}
/**
 * Placa arqueada de doble cara, con superficie interior y espesor sellado.
 * La sección es elíptica y sigue el tronco SDF en cada banda; sin BoxGeometry.
 */
function curvedPlate38OE8(_body:THREE.Mesh,a:ArmorAnatomy,plan:Vida38TechArmorPlan38OE8,
  samples:readonly TorsoSample38OE8[],c:PlateConfig38OE8,quality:Vida38HumanoidQuality):THREE.Mesh{
  const nAround=quality==='LOW'?12:22,nVertical=quality==='LOW'?5:8;
  const vertices:number[]=[]; const index:number[]=[];
  const ncols=nAround+1,nrows=nVertical+1;
  const h=Math.max(0.010,c.toY-c.fromY);
  for(let shell=0;shell<2;shell++)for(let j=0;j<nrows;j++){
    const v=j/nVertical;
    const y=c.fromY+v*h;
    const section=interpolate38OE8(samples,y);
    for(let i=0;i<ncols;i++){
      const u=i/nAround*2-1;
      const taper=1-c.taper*v*v;
      const theta=c.centerAngle+u*c.halfAngle*taper;
      const sectionW=section.w*plan.widthScale + c.offset + (shell===0?plan.shellThickness:0);
      const sectionFront=section.front + c.offset + (shell===0?plan.shellThickness:0);
      const sectionBack=section.back + c.offset + (shell===0?plan.shellThickness:0);
      const d=Math.cos(theta)>=0?sectionFront:sectionBack;
      const contour=Math.sin(Math.PI*(v+.02))*c.flare;
      const microRelief=0.0032*Math.sin(theta*4+plan.panelFlowPhase+v*1.35);
      const x=Math.sin(theta)*(sectionW+contour+microRelief);
      const z=Math.cos(theta)*(d+contour*.35+microRelief);
      const yy=y+(1-Math.abs(u))*Math.sin(v*Math.PI)*c.flare*.18;
      vertices.push(x,yy,z);
    }
  }
  const base=ncols*nrows;
  for(let j=0;j<nVertical;j++)for(let i=0;i<nAround;i++){
    const a0=j*ncols+i,b0=a0+1,c0=a0+ncols,d0=c0+1;
    index.push(a0,b0,c0,b0,d0,c0);
    index.push(base+c0,base+b0,base+a0,base+c0,base+d0,base+b0);
  }
  const connect=(a0:number,b0:number):void=>{index.push(a0,b0,base+a0,b0,base+b0,base+a0);};
  for(let i=0;i<nAround;i++){connect(i,i+1);connect(nVertical*ncols+i+1,nVertical*ncols+i);}
  for(let j=0;j<nVertical;j++){
    connect((j+1)*ncols,j*ncols);
    connect(j*ncols+nAround,(j+1)*ncols+nAround);
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  geo.setIndex(index); geo.computeVertexNormals(); geo.computeBoundingSphere();
  const plateMaterial=armorMaterial(plan,c.material);
  if(c.material==='PLATE' && (c.part==='BACKPLATE' || c.part.includes('PAULDRON') || c.part.endsWith('_1'))) {
    plateMaterial.color.lerp(new THREE.Color(plan.secondaryHex),c.part.includes('PAULDRON')?0.30:0.17);
  }
  const mesh=new THREE.Mesh(geo,plateMaterial);
  mesh.userData['armorCurvedSections38OE8']=nrows;
  mesh.userData['armorSealedThickness38OE8']=plan.shellThickness;
  return label(mesh,c.part,plan,'ANATOMICAL_CURVED_PLATE');
}

/** Domo arqueado, no esfera completa ni hombrera rectangular flotante. */
function shoulderCap38OE8(a:ArmorAnatomy,plan:Vida38TechArmorPlan38OE8,side:-1|1,
  quality:Vida38HumanoidQuality):THREE.Mesh {
  const sectors=quality==='LOW'?14:22,rows=quality==='LOW'?6:10;
  const verts:number[]=[],indices:number[]=[];
  const radius=0.125*plan.shoulderScale*(plan.silhouette==='CARAPACE'?1.13:1);
  const centerX=side*(a.shoulderWidth+0.035),centerY=a.legLength+a.torsoLength*.78;
  for(let j=0;j<=rows;j++){
    const v=j/rows;
    const phi=(0.14+v*.85)*Math.PI*.5;
    for(let i=0;i<=sectors;i++){
      const angle=i/sectors*Math.PI*2;
      const x=centerX+Math.cos(angle)*Math.sin(phi)*radius*(1.0+plan.asymmetry*side);
      const z=Math.sin(angle)*Math.sin(phi)*radius*.90+0.008;
      const y=centerY+Math.cos(phi)*radius*.66;
      verts.push(x,y,z);
    }
  }
  for(let j=0;j<rows;j++)for(let i=0;i<sectors;i++){
    const p=j*(sectors+1)+i,q=p+1,r=p+sectors+1,s=r+1;
    indices.push(p,q,r,q,s,r);
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));g.setIndex(indices);g.computeVertexNormals();
  return label(new THREE.Mesh(g,armorMaterial(plan,'PLATE')),side<0?'LEFT_PAULDRON':'RIGHT_PAULDRON',plan,'CURVED_SHOULDER_CAP');
}


interface LimbShellConfig38OE8 {
  readonly center: THREE.Vector3;
  readonly height: number;
  readonly radiusXTop: number;
  readonly radiusZTop: number;
  readonly radiusXBottom: number;
  readonly radiusZBottom: number;
  readonly thetaStart: number;
  readonly thetaLength: number;
  readonly leanZ: number;
  readonly part: string;
  readonly material: 'PLATE' | 'TRIM';
}
function limbShell38OE8(plan: Vida38TechArmorPlan38OE8, config: LimbShellConfig38OE8,
  quality: Vida38HumanoidQuality): THREE.Mesh {
  const radial = quality === 'LOW' ? 16 : 26;
  const vertical = quality === 'LOW' ? 4 : 8;
  const g = new THREE.CylinderGeometry(1, 1, 1, radial, vertical, true, config.thetaStart, config.thetaLength);
  const pos = g.getAttribute('position') as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const rawX = pos.getX(i);
    const rawY = pos.getY(i);
    const rawZ = pos.getZ(i);
    const angle = Math.atan2(rawZ, rawX);
    const v = clamp(rawY + 0.5, 0, 1);
    const rx = mix(config.radiusXTop, config.radiusXBottom, 1 - v);
    const rz = mix(config.radiusZTop, config.radiusZBottom, 1 - v);
    const x = Math.cos(angle) * rx;
    const z = Math.sin(angle) * rz + mix(-config.leanZ, config.leanZ, 1 - v);
    const y = (v - 0.5) * config.height;
    pos.setXYZ(i, x, y, z);
  }
  g.computeVertexNormals();
  g.computeBoundingSphere();
  const mesh = new THREE.Mesh(g, armorMaterial(plan, config.material));
  mesh.position.copy(config.center);
  mesh.userData['armorOpenShell38OE8'] = true;
  return label(mesh, config.part, plan, 'ANATOMICAL_LIMB_SHELL');
}

function limbArmor38OE8(a: ArmorAnatomy, plan: Vida38TechArmorPlan38OE8,
  quality: Vida38HumanoidQuality): THREE.Mesh[] {
  const legX = a.hipWidth * 0.46;
  const armX = a.shoulderWidth * 1.04;
  const shinTop = a.legLength * 0.56;
  const shinBottom = a.legLength * 0.22;
  const forearmTop = a.legLength + a.torsoLength * 0.38;
  const forearmBottom = a.legLength + a.torsoLength * 0.10;
  const bootTop = a.legLength * 0.24;
  const bootBottom = a.legLength * 0.02;
  const meshes: THREE.Mesh[] = [];
  for (const side of [-1, 1] as const) {
    const sideBias = 1 + plan.asymmetry * side;
    meshes.push(limbShell38OE8(plan, {
      center: new THREE.Vector3(side * legX, (shinTop + shinBottom) * 0.5, 0.01),
      height: shinTop - shinBottom,
      radiusXTop: 0.058 * plan.bootBulk * sideBias,
      radiusZTop: 0.048 * plan.bootBulk,
      radiusXBottom: 0.047 * plan.bootBulk * sideBias,
      radiusZBottom: 0.040 * plan.bootBulk,
      thetaStart: -Math.PI * 0.62,
      thetaLength: Math.PI * 1.24,
      leanZ: 0.010,
      part: side < 0 ? 'LEFT_GREAVE_SHELL' : 'RIGHT_GREAVE_SHELL',
      material: 'PLATE',
    }, quality));
    meshes.push(limbShell38OE8(plan, {
      center: new THREE.Vector3(side * legX, (bootTop + bootBottom) * 0.5, 0.032),
      height: Math.max(0.09, bootTop - bootBottom),
      radiusXTop: 0.072 * plan.bootBulk,
      radiusZTop: 0.070 * plan.bootBulk,
      radiusXBottom: 0.082 * plan.bootBulk,
      radiusZBottom: 0.105 * plan.bootBulk,
      thetaStart: -Math.PI * 0.52,
      thetaLength: Math.PI * 1.04,
      leanZ: 0.028,
      part: side < 0 ? 'LEFT_BOOT_SHELL' : 'RIGHT_BOOT_SHELL',
      material: 'PLATE',
    }, quality));
    meshes.push(limbShell38OE8(plan, {
      center: new THREE.Vector3(side * armX, (forearmTop + forearmBottom) * 0.5, 0.01),
      height: forearmTop - forearmBottom,
      radiusXTop: 0.043 * plan.gauntletBulk * sideBias,
      radiusZTop: 0.040 * plan.gauntletBulk,
      radiusXBottom: 0.049 * plan.gauntletBulk,
      radiusZBottom: 0.044 * plan.gauntletBulk,
      thetaStart: -Math.PI * 0.54,
      thetaLength: Math.PI * 1.08,
      leanZ: 0.008,
      part: side < 0 ? 'LEFT_FOREARM_SHELL' : 'RIGHT_FOREARM_SHELL',
      material: 'PLATE',
    }, quality));
  }
  return meshes;
}

/**
 * SDF original desplazado 8–14 mm: todos los protectores de pie, antebrazo,
 * espinilla y el subtraje siguen EXACTAMENTE las superficies corporales.
 * Fragmentos recortados en shader para evitar bordes dentados por triángulos.
 */
function conformalLayer38OE8(body:THREE.Mesh,a:ArmorAnatomy,plan:Vida38TechArmorPlan38OE8,
  protective:boolean): THREE.Mesh {
  const geo=(body.geometry as THREE.BufferGeometry).clone();
  const pos=geo.getAttribute('position') as THREE.BufferAttribute;
  const normal=geo.getAttribute('normal') as THREE.BufferAttribute;
  const distance=protective?0.017:0.009;
  for(let i=0;i<pos.count;i++){
    const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i);
    pos.setXYZ(i,x+normal.getX(i)*distance,y+normal.getY(i)*distance,z+normal.getZ(i)*distance);
  }
  pos.needsUpdate=true;geo.computeBoundingSphere();
  const mat=protective?armorMaterial(plan,'PLATE'):armorMaterial(plan,'UNDERLAY');
  const params={
    uVidaArmorMeasurements:{value:new THREE.Vector4(a.legLength,a.torsoLength,a.shoulderWidth,a.hipWidth)},
    uVidaArmorTrim:{value:new THREE.Color(plan.glowHex)},
  };
  mat.onBeforeCompile=(shader:{vertexShader:string;fragmentShader:string;uniforms:Record<string,{value:unknown}>})=>{
    Object.assign(shader.uniforms,params);
    shader.vertexShader=shader.vertexShader
      .replace('#include <common>','#include <common>\nvarying vec3 vVidaArmorPosition;')
      .replace('#include <begin_vertex>','#include <begin_vertex>\nvVidaArmorPosition=position;');
    shader.fragmentShader=shader.fragmentShader
      .replace('#include <common>',`#include <common>
        varying vec3 vVidaArmorPosition;
        uniform vec4 uVidaArmorMeasurements;
        uniform vec3 uVidaArmorTrim;`)
      .replace('#include <color_fragment>',`#include <color_fragment>
        vec3 pt=vVidaArmorPosition;
        float p=uVidaArmorMeasurements.x;
        float torso=uVidaArmorMeasurements.y;
        float shoulder=uVidaArmorMeasurements.z;
        float hip=uVidaArmorMeasurements.w;
        float tailOpening=(1.0-smoothstep(0.12,0.22,abs(pt.x)))
          * (1.0-smoothstep(-0.34,-0.22,pt.z))
          * smoothstep(p-0.48,p-0.24,pt.y)
          * (1.0-smoothstep(p+0.08,p+0.22,pt.y));
        float cuff=step(p+torso*0.12,pt.y)*(1.0-step(p+torso*0.44,pt.y))
          *step(shoulder*0.76,abs(pt.x));
        float greave=step(p*0.23,pt.y)*(1.0-step(p*0.53,pt.y))
          *step(hip*0.30,abs(pt.x));
        float boot=(1.0-step(p*0.22,pt.y))*step(hip*0.24,abs(pt.x));
        float suit=1.0-step(p+torso*0.95,pt.y);
        if(${protective?'(cuff+greave+boot)<0.5':'suit<0.5 || tailOpening>0.5'})discard;
        float seam=exp(-pow((pt.y-p*0.19)/0.018,2.0))
          +exp(-pow((pt.y-p*0.51)/0.015,2.0))
          +exp(-pow((pt.y-(p+torso*0.42))/0.013,2.0));
        diffuseColor.rgb=mix(diffuseColor.rgb,uVidaArmorTrim,clamp(seam*0.23,0.0,0.30));`);
  };
  mat.customProgramCacheKey=()=>protective?'vida38-oe8-conformal-guards-v1':'vida38-oe8-conformal-undersuit-v1';
  const mesh=new THREE.Mesh(geo,mat);
  mesh.userData['armorSurfaceFit38OE8']='EXACT_BODY_SDF';
  return label(mesh,protective?'ARM_GUARDS_GREAVES_BOOTS':'TECHNICAL_UNDERSUIT',plan,
    protective?'CONFORMAL_BRACERS_GREAVES_BOOTS':'CONFORMAL_TECHNICAL_FABRIC');
}

function armorPanels38OE8(body:THREE.Mesh,a:ArmorAnatomy,plan:Vida38TechArmorPlan38OE8,
  quality:Vida38HumanoidQuality):THREE.Mesh[]{
  const sampled=sampleTorso38OE8(body,a);
  const p=a.legLength,t=a.torsoLength;
  const meshes:THREE.Mesh[]=[];
  const carapace=plan.silhouette==='CARAPACE';
  const militarized = plan.discipline === 'MILITARY_SEGMENTED';
  const ceremonial = plan.discipline === 'CEREMONIAL_NOBLE';
  const technoPriest = plan.discipline === 'TECHNO_PRIEST_ARMORED';
  meshes.push(curvedPlate38OE8(body,a,plan,sampled,{fromY:p+t*(technoPriest ? .48 : (carapace ? .50 : .54)),toY:p+t*(technoPriest ? .86 : .82),
    centerAngle:0,halfAngle:technoPriest?0.96:carapace?1.14:(ceremonial?1.06:1.02),offset:.021,taper:carapace ? .10 : .06,
    flare:militarized ? .010 : (ceremonial ? .020 : .012),part:'CUIRASS',material:'PLATE'},quality));
  meshes.push(curvedPlate38OE8(body,a,plan,sampled,{fromY:p+t*.50,toY:p+t*(technoPriest ? .88 : .82),
    centerAngle:Math.PI,halfAngle:(carapace?1.02:.93)*plan.dorsalWrap,offset:.021,taper:.05,
    flare:ceremonial ? .014 : .008,part:'BACKPLATE',material:'PLATE'},quality));
  const lower = ceremonial ? .20 : .18;
  const upper = technoPriest ? .56 : .52;
  for(let i=0;i<plan.plateCount;i++){
    const top=upper-i*(upper-lower)/plan.plateCount;
    const bottom=upper-(i+1)*(upper-lower)/plan.plateCount;
    meshes.push(curvedPlate38OE8(body,a,plan,sampled,{fromY:p+t*(bottom+.010),toY:p+t*(top-.008),
      centerAngle:0,halfAngle:technoPriest ? .64 : (ceremonial ? .74 : .80),offset:.023,taper:-.020-plan.waistTaper*.12,flare:.006,
      part:`ABDOMEN_LAMELLA_${i}`,material:'PLATE'},quality));
  }
  for (const side of [-1,1] as const) {
    meshes.push(curvedPlate38OE8(body,a,plan,sampled,{fromY:p+t*.40,toY:p+t*.70,
      centerAngle:side*(Math.PI*.5-0.16),halfAngle:technoPriest ? .18 : (ceremonial ? .20 : .17),offset:.020,taper:.06,flare:.004,
      part:side<0?'LEFT_SIDE_RIB':'RIGHT_SIDE_RIB',material:'PLATE'},quality));
  }
  meshes.push(curvedPlate38OE8(body,a,plan,sampled,{fromY:p+t*.15,toY:p+t*.22,
    centerAngle:0,halfAngle:1.06,offset:.016,taper:.00,flare:.004,part:'WAIST_GUARD',material:'PLATE'},quality));
  if (technoPriest) {
    meshes.push(curvedPlate38OE8(body,a,plan,sampled,{fromY:p+t*.84,toY:p+t*(.84+plan.collarHeight*.60),
      centerAngle:0,halfAngle:.95,offset:.025,taper:-.02,flare:.002,part:'GORGET_COLLAR',material:'PLATE'},quality));
    meshes.push(curvedPlate38OE8(body,a,plan,sampled,{fromY:p+t*.57,toY:p+t*.78,
      centerAngle:0,halfAngle:.15,offset:.032,taper:.0,flare:.002,part:'RITUAL_SPINE_TRIM',material:'TRIM'},quality));
  } else {
    meshes.push(shoulderCap38OE8(a,plan,-1,quality),shoulderCap38OE8(a,plan,1,quality));
  }
  const collar=curvedPlate38OE8(body,a,plan,sampled,{fromY:p+t*.83,toY:p+t*(.83+plan.collarHeight*.42),
    centerAngle:0,halfAngle:ceremonial?1.10:.94,offset:.015,taper:.02,flare:.001,part:'CHEST_TRIM',material:'TRIM'},quality);
  meshes.push(collar);
  return meshes;
}

function industrialPanels38OE8(body:THREE.Mesh,a:ArmorAnatomy,plan:Vida38TechArmorPlan38OE8,
  quality:Vida38HumanoidQuality):THREE.Mesh[]{
  const sampled=sampleTorso38OE8(body,a);
  const p=a.legLength,t=a.torsoLength;
  const meshes:THREE.Mesh[]=[];
  const exploratory=plan.discipline==='TACTICAL_EXPLORER' || plan.silhouette==='FIELD_EXPLORER';
  const industrial=plan.discipline==='COLONIAL_INDUSTRIAL';
  meshes.push(curvedPlate38OE8(body,a,plan,sampled,{fromY:p+t*(exploratory ? .34 : .28),toY:p+t*(exploratory ? .68 : .72),
    centerAngle:0,halfAngle:exploratory ? .70 : .92,offset:.016,taper:exploratory ? .15 : .05,
    flare:exploratory ? .004 : .008,part:'UTILITY_VEST',material:'PLATE'},quality));
  meshes.push(curvedPlate38OE8(body,a,plan,sampled,{fromY:p+t*(exploratory ? .36 : .30),toY:p+t*(exploratory ? .70 : .74),
    centerAngle:Math.PI,halfAngle:(exploratory ? .72 : .88)*plan.dorsalWrap,offset:.016,taper:.10,
    flare:exploratory ? .004 : .006,part:'DORSAL_TECH_FRAME',material:'PLATE'},quality));
  for(const side of [-1,1] as const){
    const anchorAngle=side*((exploratory ? .33 : .26)+plan.asymmetry*.6);
    const harness=curvedPlate38OE8(body,a,plan,sampled,{fromY:p+t*.38,toY:p+t*.80,
      centerAngle:anchorAngle,halfAngle:exploratory ? .074 : .086,offset:.030,taper:-.28,flare:.004,
      part:side<0?'HARNESS_LEFT':'HARNESS_RIGHT',material:'TRIM'},quality);
    meshes.push(harness);
    if (industrial) {
      meshes.push(curvedPlate38OE8(body,a,plan,sampled,{fromY:p+t*.20,toY:p+t*.29,
        centerAngle:side*.61,halfAngle:.17,offset:.018,taper:0,flare:.010,
        part:side<0?'LEFT_POUCH':'RIGHT_POUCH',material:'PLATE'},quality));
    }
    meshes.push(curvedPlate38OE8(body,a,plan,sampled,{fromY:p+t*.42,toY:p+t*.59,
      centerAngle:side*(Math.PI*.5-0.20),halfAngle:.14,offset:.018,taper:.02,flare:.003,
      part:side<0?'LEFT_SIDE_FRAME':'RIGHT_SIDE_FRAME',material:'PLATE'},quality));
  }
  meshes.push(curvedPlate38OE8(body,a,plan,sampled,{fromY:p+t*.15,toY:p+t*.21,
    centerAngle:0,halfAngle:1.12,offset:.014,taper:.01,flare:.003,part:'UTILITY_BELT',material:'PLATE'},quality));
  if (exploratory) {
    meshes.push(curvedPlate38OE8(body,a,plan,sampled,{fromY:p+t*.66,toY:p+t*.75,
      centerAngle:0,halfAngle:.48,offset:.022,taper:.04,flare:.002,part:'CHEST_SENSOR_BRIDGE',material:'TRIM'},quality));
  }
  return meshes;
}

/** Resultado preparado para incorporarse a `subject` por el renderer 38.2o. */
export function createVida38ReptilianTechnicalGarments38OE8(
  body:THREE.Mesh,
  anatomy:Vida38HumanoidAnatomy,
  plan:Vida38TechArmorPlan38OE8,
  quality:Vida38HumanoidQuality='HIGH',
):THREE.Mesh[]{
  const meshes=[conformalLayer38OE8(body,anatomy,plan,false),conformalLayer38OE8(body,anatomy,plan,true)];
  meshes.push(...limbArmor38OE8(anatomy,plan,quality));
  if(plan.family==='SEGMENTED_ARMOR')meshes.push(...armorPanels38OE8(body,anatomy,plan,quality));
  else meshes.push(...industrialPanels38OE8(body,anatomy,plan,quality));
  return meshes;
}
