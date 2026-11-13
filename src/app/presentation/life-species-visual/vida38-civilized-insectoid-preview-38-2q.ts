/**
 * GENESIS VIDA.38.2q — reconstrucción vertical de insectoides MUY AVANZADOS.
 * No sustituye los insectos naturales 38.2k; respeta appendagePairs del contrato.
 * Anatomía y vestuario son hipótesis artísticas deterministas, no observaciones.
 */
import * as THREE from 'three';
import type { Vida38SpeciesVisualContract } from './vida38-species-visual-contract';
import {
  VIDA38_INSECTOID_ORGANIC_REVISION_38Q1B,
  deriveVida38InsectoidAnatomicalStyle38Q1B,
  deriveVida38InsectoidEyeAnchor38Q1B,
  deriveVida38InsectoidAuxiliaryEyeAnchors38Q1B,
  deriveVida38InsectoidAntennaRoot38Q1B,
  deriveVida38InsectoidMandibleRoot38Q1B,
  buildVida38InsectoidHead38Q1B,
  buildVida38InsectoidWings38Q1B,
  buildVida38InsectoidStinger38Q1B,
  deriveVida38InsectoidShoulderFrame38Q1C,
} from './vida38-civilized-insectoid-organic-anatomy-38-2q1b';
import {
  VIDA38_INSECTOID_OCULAR_COXAL_REVISION_38Q1D,
  deriveVida38InsectoidDarkEyePlan38Q1D,
  deriveVida38InsectoidCoxalFrame38Q1D,
  buildVida38InsectoidPelvis38Q1D,
  buildVida38InsectoidCoxalScute38Q1D,
} from './vida38-civilized-insectoid-ocular-coxal-38-2q1d';
import {
  VIDA38_INSECTOID_FLY_EYE_REVISION_38Q1E,
  deriveVida38InsectoidFlyEyeSpec38Q1E,
} from './vida38-civilized-insectoid-compound-eye-38-2q1e';
import {
  VIDA38_INSECTOID_OCULAR_DIVERSITY_REVISION_38Q1F,
  createVida38InsectoidDiversePrimaryEye38Q1F,
  buildVida38InsectoidSpecialEyes38Q1F,
  deriveVida38InsectoidOcularPlan38Q1F,
  collectVida38InsectoidOcularSignature38Q1F,
} from './vida38-civilized-insectoid-ocular-diversity-38-2q1f';
import {
  VIDA38_INSECTOID_WARDROBE_REVISION_38Q2,
  deriveVida38InsectoidWardrobeStyle38Q2,
  buildVida38InsectoidWardrobe38Q2,
} from './vida38-civilized-insectoid-wardrobe-38-2q2';

export const VIDA38_CIV_INSECTOID_REVISION_38Q = 'VIDA.38.2q/civilized-insectoid-upright/v1' as const;
export const VIDA38_INSECTOID_JOINT_FIX_REVISION_38Q1C = 'VIDA.38.2q1c/stinger-shoulder-continuity/v1' as const;
export const VIDA38_CIV_INSECTOID_ARCHETYPES_38Q = [
  'MANTID_SENTINEL','BEETLE_BASTION','WASP_DIPLOMAT','ANT_ENGINEER',
  'MOTH_ORACLE','DRAGONFLY_EXPLORER','CICADA_ARCHIVIST','STICK_SCHOLAR',
] as const;
export const VIDA38_CIV_INSECTOID_CULTURES_38Q = [
  'CRYSTAL_CONCLAVE','HIVE_SYNDICATE','MYCELIAL_REPUBLIC','NEBULA_ORDER',
  'IRON_SWARM','PELAGIC_CHORUS',
] as const;
export const VIDA38_CIV_INSECTOID_ROLES_38Q = [
  'SCIENTIST','MILITARY','NOBLE','EXPLORER','TECHNO_PRIEST','INDUSTRIAL_COLONIZER',
] as const;
export const VIDA38_CIV_INSECTOID_WARDROBES_38Q = [
  'EXO_SUIT','SEGMENTED_BIO_ARMOR','SCIENTIFIC_HARNESS',
  'ROYAL_MANTLE','CEREMONIAL_VESTMENTS','EXPLORER_KIT',
] as const;
export type Vida38CivilizedInsectoidArchetype38Q = typeof VIDA38_CIV_INSECTOID_ARCHETYPES_38Q[number];
export type Vida38CivilizedInsectoidCulture38Q = typeof VIDA38_CIV_INSECTOID_CULTURES_38Q[number];
export type Vida38CivilizedInsectoidWardrobe38Q = typeof VIDA38_CIV_INSECTOID_WARDROBES_38Q[number];
export type Vida38CivilizedInsectoidRole38Q = typeof VIDA38_CIV_INSECTOID_ROLES_38Q[number];
export type Vida38CivilizedInsectoidQuality38Q = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Vida38CivilizedInsectoidPlan38Q {
  readonly revision: typeof VIDA38_CIV_INSECTOID_REVISION_38Q;
  readonly speciesId: string;
  readonly archetype: Vida38CivilizedInsectoidArchetype38Q;
  readonly culture: Vida38CivilizedInsectoidCulture38Q;
  readonly role: Vida38CivilizedInsectoidRole38Q;
  readonly wardrobe: Vida38CivilizedInsectoidWardrobe38Q;
  readonly pairCount: number;
  readonly armPairs: number;
  readonly armCount: number;
  readonly silhouette: 'SLENDER' | 'REGAL' | 'ROBUST' | 'AERODYNAMIC';
  readonly headScale: number;
  readonly thoraxScale: number;
  readonly abdomenScale: number;
  readonly antennaLength: number;
  readonly armLengthScale: number;
  readonly shinLengthScale: number;
  readonly garmentLength: number;
  readonly armorDensity: number;
  readonly ornament: 'MINIMAL' | 'GLYPHIC' | 'LUMINOUS' | 'CEREMONIAL';
  readonly shellHex: string;
  readonly shellSecondaryHex: string;
  readonly garmentHex: string;
  readonly armorHex: string;
  readonly neonHex: string;
  readonly materialKind: 'BIOCERAMIC' | 'FLEXWEAVE' | 'LUMINOUS_CHITIN' | 'BRUSHED_ALLOY';
  readonly accessory: 'DATA_SPHERE' | 'CEREMONIAL_STAFF' | 'HOLOGRAPHIC_VISOR' | 'WRIST_CONSOLE' | 'NONE';
  readonly wings: boolean;
  readonly wingPairs: 0 | 1 | 2;
  readonly extraEyes: 0 | 2 | 3 | 4;
  readonly stinger: 'NONE' | 'SHORT' | 'LANCET';
  readonly signature: string;
}

function hash32(text: string): number {
  let h=2166136261;
  for(let i=0;i<text.length;i++) h=Math.imul(h^text.charCodeAt(i),16777619)>>>0;
  h^=h>>>16;h=Math.imul(h,0x85ebca6b)>>>0;h^=h>>>13;
  return h>>>0;
}
const n=(s:string,k:string):number=>hash32(`${k}|${s}`)/4294967295;
const pick=<T>(items:readonly T[],s:string,k:string):T=>items[Math.min(items.length-1,Math.floor(n(s,k)*items.length))]!;
const lerp=(a:number,b:number,t:number):number=>a+(b-a)*t;
const clamp=(v:number,a:number,b:number):number=>Math.max(a,Math.min(b,v));

/** Solo los insectoides MUY AVANZADOS toman esta rama; los insectos normales conservan 38.2k. */
export function isVida38VeryAdvancedInsectoid38Q(contract: Vida38SpeciesVisualContract): boolean {
  if (contract.morphology.group !== 'INSECTS') return false;
  const i = contract.intelligence as unknown as Record<string, unknown> | null;
  if (String(i?.['lineage'] ?? '').toUpperCase() !== 'INSECTOID') return false;
  const keys=['civilizationLevel', 'civilisationLevel', 'societyLevel', 'stage', 'civilizationStage'];
  if(keys.some(key => String(i?.[key] ?? '').toUpperCase() === 'VERY_ADVANCED'))return true;
  const nested=i?.['civilization'] as Record<string,unknown>|undefined;
  const society=i?.['society'] as Record<string,unknown>|undefined;
  if(String(nested?.['level']??'').toUpperCase()==='VERY_ADVANCED'||String(society?.['level']??'').toUpperCase()==='VERY_ADVANCED')return true;
  return JSON.stringify(i ?? {}).toUpperCase().includes('VERY_ADVANCED');
}

/** No introducir un cuarto par si el contrato solo tiene tres: dos brazos por par no locomotor. */
export function deriveVida38CivilizedInsectoidPlan38Q(contract:Vida38SpeciesVisualContract):Vida38CivilizedInsectoidPlan38Q {
  const intelligence=contract.intelligence as unknown as Record<string,unknown>|null;
  const lineage=String(intelligence?.['lineage']??'').toUpperCase();
  if(contract.morphology.group!=='INSECTS'||lineage!=='INSECTOID'||!isVida38VeryAdvancedInsectoid38Q(contract)){
    throw new Error('38.2q: solo insectoides civilizados de nivel VERY_ADVANCED');
  }
  const seed=`${contract.speciesId}|${contract.appearanceFingerprint}|${contract.variantSeedUint32}|VIDA38Q`;
  const archetype=pick(VIDA38_CIV_INSECTOID_ARCHETYPES_38Q,seed,'anatomy');
  const culture=pick(VIDA38_CIV_INSECTOID_CULTURES_38Q,seed,'culture');
  const role=pick(VIDA38_CIV_INSECTOID_ROLES_38Q,seed,'role');
  const familyForRole:Record<Vida38CivilizedInsectoidRole38Q,readonly Vida38CivilizedInsectoidWardrobe38Q[]>={
    SCIENTIST:['SCIENTIFIC_HARNESS','EXO_SUIT','SCIENTIFIC_HARNESS'],
    MILITARY:['SEGMENTED_BIO_ARMOR','EXO_SUIT','SEGMENTED_BIO_ARMOR'],
    NOBLE:['ROYAL_MANTLE','CEREMONIAL_VESTMENTS','ROYAL_MANTLE'],
    EXPLORER:['EXPLORER_KIT','EXO_SUIT','SCIENTIFIC_HARNESS'],
    TECHNO_PRIEST:['CEREMONIAL_VESTMENTS','ROYAL_MANTLE','CEREMONIAL_VESTMENTS'],
    INDUSTRIAL_COLONIZER:['EXPLORER_KIT','EXO_SUIT','SEGMENTED_BIO_ARMOR'],
  };
  const wardrobe=pick(familyForRole[role],seed,'wardrobe');
  const palette:Record<Vida38CivilizedInsectoidCulture38Q,readonly [string,string,string]>={
    CRYSTAL_CONCLAVE:['#101c29','#588fa3','#70ecff'],
    HIVE_SYNDICATE:['#18272d','#4e797e','#5ae8b3'],
    MYCELIAL_REPUBLIC:['#111e27','#537c76','#80f8c6'],
    NEBULA_ORDER:['#131e35','#557aa0','#63cfff'],
    IRON_SWARM:['#101923','#7e97a6','#48dab8'],
    PELAGIC_CHORUS:['#102c36','#3c8895','#73eae9'],
  };
  const [garmentHex,armorHex,neonHex]=palette[culture];
  const pairCount=clamp(Math.trunc(contract.morphology.appendagePairs),2,6);
  const armPairs=pairCount-1;
  const roleSil:Record<Vida38CivilizedInsectoidRole38Q,readonly Vida38CivilizedInsectoidPlan38Q['silhouette'][]>={
    SCIENTIST:['SLENDER','AERODYNAMIC'],MILITARY:['ROBUST','AERODYNAMIC'],
    NOBLE:['REGAL','SLENDER'],EXPLORER:['AERODYNAMIC','SLENDER'],
    TECHNO_PRIEST:['REGAL','ROBUST'],INDUSTRIAL_COLONIZER:['ROBUST','SLENDER'],
  };
  const silhouette=pick(roleSil[role],seed,'silhouette');
  const shellHex=contract.pigmentation.primaryColorHex;
  const shellSecondaryHex=contract.pigmentation.secondaryColorHex;
  const materialKind=pick(['BIOCERAMIC','FLEXWEAVE','LUMINOUS_CHITIN','BRUSHED_ALLOY'] as const,seed,'material');
  const accessories:Record<Vida38CivilizedInsectoidRole38Q,readonly Vida38CivilizedInsectoidPlan38Q['accessory'][]>={
    SCIENTIST:['DATA_SPHERE','HOLOGRAPHIC_VISOR','WRIST_CONSOLE'],
    MILITARY:['WRIST_CONSOLE','HOLOGRAPHIC_VISOR','NONE'],
    NOBLE:['CEREMONIAL_STAFF','DATA_SPHERE','HOLOGRAPHIC_VISOR'],
    EXPLORER:['WRIST_CONSOLE','DATA_SPHERE','HOLOGRAPHIC_VISOR'],
    TECHNO_PRIEST:['CEREMONIAL_STAFF','HOLOGRAPHIC_VISOR','DATA_SPHERE'],
    INDUSTRIAL_COLONIZER:['WRIST_CONSOLE','DATA_SPHERE','NONE'],
  };
  const accessory=pick(accessories[role],seed,'accessory');
  const ornament=pick(['MINIMAL','GLYPHIC','LUMINOUS','CEREMONIAL'] as const,seed,'ornament');
  const headScale=lerp(.78,1.19,n(seed,'head'))*(archetype==='CICADA_ARCHIVIST'?1.13:1);
  const thoraxScale=lerp(.80,1.16,n(seed,'thorax'))*(archetype==='BEETLE_BASTION'?1.19:1);
  const abdomenScale=lerp(.76,1.33,n(seed,'abdomen'))*(archetype==='MANTID_SENTINEL'?.80:1);
  const antennaLength=lerp(.24,.75,n(seed,'antenna'));
  const armLengthScale=lerp(.87,1.20,n(seed,'arms'));
  const shinLengthScale=lerp(.85,1.19,n(seed,'shins'));
  const garmentLength=lerp(.34,1.0,n(seed,'garment-length'));
  const armorDensity=lerp(.48,1.00,n(seed,'armor'));
  const naturalWingedArchetypes=['DRAGONFLY_EXPLORER','WASP_DIPLOMAT','MOTH_ORACLE','CICADA_ARCHIVIST'] as const;
  const wingPairs = (contract.morphology.bodyPlan==='WINGED'||contract.locomotion==='FLYING')
    ? (n(seed,'wing-pairs')>.56?2:1)
    : (naturalWingedArchetypes.includes(archetype as typeof naturalWingedArchetypes[number]) && n(seed,'wing-chance')>.26)
      ? (n(seed,'wing-pairs')>.61?2:1)
      : (n(seed,'vestigial-wings')>.93?1:0);
  const wings=wingPairs>0;
  const extraEyes = archetype==='MOTH_ORACLE'
    ? 3
    : archetype==='CICADA_ARCHIVIST'
      ? 4
      : (role==='SCIENTIST'||role==='TECHNO_PRIEST'||n(seed,'extra-eyes')>.81)
        ? (n(seed,'extra-eyes-count')>.58?2:3)
        : 0;
  const stinger = (archetype==='WASP_DIPLOMAT'||culture==='IRON_SWARM'||role==='MILITARY'||role==='EXPLORER')
    ? (n(seed,'stinger-kind')>.52 ? 'LANCET' : 'SHORT')
    : (n(seed,'stinger-light')>.88 ? 'SHORT' : 'NONE');
  const signature=[archetype,culture,role,wardrobe,pairCount,silhouette,materialKind,ornament,accessory,
    headScale.toFixed(4),thoraxScale.toFixed(4),abdomenScale.toFixed(4),antennaLength.toFixed(4),
    armLengthScale.toFixed(4),shinLengthScale.toFixed(4),garmentLength.toFixed(4),armorDensity.toFixed(4),
    wings,wingPairs,extraEyes,stinger].join('|');
  return {revision:VIDA38_CIV_INSECTOID_REVISION_38Q,speciesId:contract.speciesId,archetype,culture,role,wardrobe,
    pairCount,armPairs,armCount:armPairs*2,silhouette,headScale,thoraxScale,abdomenScale,antennaLength,
    armLengthScale,shinLengthScale,garmentLength,armorDensity,ornament,shellHex,shellSecondaryHex,garmentHex,
    armorHex,neonHex,materialKind,accessory,wings,wingPairs,extraEyes,stinger,signature};
}

function mat(color:string,roughness=.50,metalness=.1,glow?:string):THREE.MeshPhysicalMaterial{
  return new THREE.MeshPhysicalMaterial({color,roughness,metalness,clearcoat:metalness>.3?.38:.17,
    emissive:glow??'#000000',emissiveIntensity:glow?.52:0,side:THREE.DoubleSide});
}
function push(parent:THREE.Group,objects:THREE.Object3D[],object:THREE.Object3D,name:string,part:string):void{
  object.name=name;object.userData['civInsectoidPart38Q']=part;object.userData['artisticHypothesis38Q']=true;
  parent.add(object);objects.push(object);
}
function vessel(pts:readonly THREE.Vector3[],radii:readonly number[],sides=10):THREE.BufferGeometry{
  const path=new THREE.CatmullRomCurve3([...pts]);
  const positions:number[]=[],uvs:number[]=[],faces:number[]=[];
  const rows=Math.max(9,pts.length*5),up=new THREE.Vector3(),cross=new THREE.Vector3(),tan=new THREE.Vector3();
  for(let j=0;j<=rows;j++){
    const t=j/rows,center=path.getPoint(t);
    tan.copy(path.getTangent(t)).normalize();
    up.set(0,0,1);if(Math.abs(tan.dot(up))>.88)up.set(0,1,0);
    up.addScaledVector(tan,-tan.dot(up)).normalize();cross.crossVectors(tan,up).normalize();
    const fraction=t*(radii.length-1),k=Math.min(radii.length-2,Math.floor(fraction));
    const radius=lerp(radii[k]!,radii[k+1]!,fraction-k);
    for(let i=0;i<=sides;i++){
      const a=i/sides*Math.PI*2;
      const v=center.clone().addScaledVector(up,Math.cos(a)*radius).addScaledVector(cross,Math.sin(a)*radius);
      positions.push(v.x,v.y,v.z);uvs.push(i/sides,t);
      if(j>0&&i>0){const b=j*(sides+1)+i;faces.push(b,b-1,b-sides-2,b,b-sides-2,b-sides-1);}
    }
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));g.setIndex(faces);g.computeVertexNormals();return g;
}
/** Longitudinal radial loft: un tronco torácico y abdomen conectados con relieves tergales. */
function organicCore(plan:Vida38CivilizedInsectoidPlan38Q,quality:Vida38CivilizedInsectoidQuality38Q):THREE.BufferGeometry{
  const around=quality==='LOW'?18:quality==='MEDIUM'?28:40;
  const rows=quality==='LOW'?34:quality==='MEDIUM'?56:78;
  const positions:number[]=[],colors:number[]=[],indices:number[]=[];
  const first=new THREE.Color(plan.shellHex),secondary=new THREE.Color(plan.shellSecondaryHex);
  const radiusAt=(t:number):number=>{
    const waist=.14 + .05*Math.sin(t*Math.PI);
    const thorax=.25*plan.thoraxScale*Math.exp(-Math.pow((t-.71)/.23,2));
    const abdomen=.22*plan.abdomenScale*Math.exp(-Math.pow((t-.30)/.24,2));
    return waist+thorax+abdomen-.095;
  };
  for(let j=0;j<=rows;j++){
    const t=j/rows,y=.91+1.03*t;
    const r=radiusAt(t);
    const depth=(.79+.09*Math.cos(Math.PI*t));
    const ring=.008*Math.cos(t*18*Math.PI+plan.armorDensity*3);
    const thoraxBand=Math.exp(-Math.pow((t-.70)/.11,2));
    const abdomenBand=Math.exp(-Math.pow((t-.30)/.12,2));
    const dorsalKeel=.020*Math.exp(-Math.pow((t-.54)/.32,2));
    const segmentWave=.020*Math.sin((t*7.4+0.08)*Math.PI);
    for(let k=0;k<=around;k++){
      const a=k/around*Math.PI*2;
      const sideFactor=Math.sin(a);
      const dorsal=Math.max(0,Math.cos(a));
      const ventral=Math.max(0,-Math.cos(a));
      const rib=1+.035*Math.cos(a*4+plan.armLengthScale);
      const thoraxShoulder=1+.18*thoraxBand*Math.pow(Math.abs(sideFactor),1.35)*(1-.20*ventral);
      const abdomenBulge=1+.11*abdomenBand*(.35+.65*dorsal);
      const lateralNotch=1-.10*Math.exp(-Math.pow((t-.52)/.18,2))*Math.pow(Math.abs(sideFactor),3);
      const rr=(r+ring+segmentWave*(.5+.5*dorsal))*rib*thoraxShoulder*abdomenBulge*lateralNotch;
      const x=Math.sin(a)*rr;
      const z=Math.cos(a)*(r*depth+ring*.55)-.040*(1-t)+dorsal*dorsalKeel-ventral*.01;
      positions.push(x,y,z);
      const plateShade=clamp(.11+.16*Math.sin(14*t)+.09*Math.cos(a*3)+.08*thoraxBand*dorsal+.05*abdomenBand, .02,.44);
      const c=first.clone().lerp(secondary,plateShade);
      colors.push(c.r,c.g,c.b);
      if(j>0&&k>0){const b=j*(around+1)+k;indices.push(b,b-around-2,b-1,b,b-around-1,b-around-2);}
    }
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setIndex(indices);g.computeVertexNormals();return g;
}
function addEye(parent:THREE.Group,created:THREE.Object3D[],plan:Vida38CivilizedInsectoidPlan38Q,side:-1|1,quality:Vida38CivilizedInsectoidQuality38Q,head?:THREE.Mesh):void{
  // 38.2q1e: omatidios hexagonales oscuros sobre una superficie continua,
  // no una canica facetada de caras grandes. La cadera 38.2q1d no cambia.
  const eye=createVida38InsectoidDiversePrimaryEye38Q1F(plan,side,quality,head);
  push(parent,created,eye,'VIDA38_Q1E_DIPTERAN_COMPOUND_EYE','COMPOUND_EYE');
}

function addAuxiliaryEyes(parent:THREE.Group,created:THREE.Object3D[],plan:Vida38CivilizedInsectoidPlan38Q):void{
  const points=deriveVida38InsectoidAuxiliaryEyeAnchors38Q1B(plan);
  if(points.length===0)return;
  const eyePlan=deriveVida38InsectoidDarkEyePlan38Q1D(plan);
  const auxMat=new THREE.MeshPhysicalMaterial({color:eyePlan.facetHex,roughness:eyePlan.roughness,
    metalness:.02,clearcoat:eyePlan.clearcoat,emissive:'#000000',emissiveIntensity:0});
  for(const point of points){
    const eye=new THREE.Mesh(new THREE.SphereGeometry(.025*plan.headScale,12,8),auxMat);
    eye.position.copy(point);eye.scale.set(.90,.85,.43);
    eye.userData['vida38InsectoidDarkEyeHex38Q1D']=eyePlan.facetHex;
    push(parent,created,eye,'VIDA38_Q1D_DARK_OCELLUS','AUX_EYE');
  }
}

function addSpecialEyes(parent:THREE.Group,created:THREE.Object3D[],plan:Vida38CivilizedInsectoidPlan38Q,head?:THREE.Mesh):void{
  for(const eye of buildVida38InsectoidSpecialEyes38Q1F(plan,head)){
    push(parent,created,eye,eye.name || 'VIDA38_Q1F_SPECIAL_EYE','SPECIAL_EYE');
  }
}

function addCrestAndAntennae(parent:THREE.Group,created:THREE.Object3D[],plan:Vida38CivilizedInsectoidPlan38Q,shell:THREE.Material):void{
  for(const side of [-1,1] as const){
    const anchor=deriveVida38InsectoidAntennaRoot38Q1B(plan,side);
    const stem=new THREE.Mesh(vessel([
      anchor,
      anchor.clone().add(new THREE.Vector3(side*.07,.09,.06)),
      anchor.clone().add(new THREE.Vector3(side*(.16+plan.antennaLength*.17),.12+plan.antennaLength*.32,.13)),
      anchor.clone().add(new THREE.Vector3(side*(.18+plan.antennaLength*.32),.16+plan.antennaLength*.64,.14)),
    ],[.030,.023,.013,.003]),shell);
    push(parent,created,stem,'VIDA38_Q1B_SENSORY_ANTENNA','ANTENNA');
    const root=deriveVida38InsectoidMandibleRoot38Q1B(plan,side);
    const robust=plan.archetype==='ANT_ENGINEER'||plan.archetype==='WASP_DIPLOMAT'||plan.archetype==='BEETLE_BASTION';
    const curve=new THREE.Vector3(side*(robust?.14:.10),-.075,robust?.087:.068);
    const mandible=new THREE.Mesh(vessel([
      root,
      root.clone().add(new THREE.Vector3(side*.065,-.035,.058)),
      root.clone().add(curve),
      root.clone().add(new THREE.Vector3(side*(robust?.027:.016),-.094,robust?.149:.12)),
    ],robust?[.049,.048,.029,.004]:[.034,.028,.015,.003]),shell);
    push(parent,created,mandible,'VIDA38_Q1B_CURVED_MANDIBLE','MANDIBLE');
    if(plan.archetype==='MOTH_ORACLE'||plan.archetype==='CICADA_ARCHIVIST'){
      const sens=new THREE.Mesh(vessel([
        root.clone().add(new THREE.Vector3(side*.027,-.025,.02)),
        root.clone().add(new THREE.Vector3(side*.058,-.090,.09)),
        root.clone().add(new THREE.Vector3(side*.083,-.14,.12)),
      ],[.017,.011,.002],7),shell);
      push(parent,created,sens,'VIDA38_Q1B_SENSORY_PALP','MANDIBLE');
    }
  }
}
function shellMaterial(plan:Vida38CivilizedInsectoidPlan38Q):THREE.MeshPhysicalMaterial{
  return new THREE.MeshPhysicalMaterial({color:'#ffffff',roughness:.34,metalness:.07,
    clearcoat:.32,vertexColors:true,side:THREE.DoubleSide});
}
function addLegs(parent:THREE.Group,created:THREE.Object3D[],plan:Vida38CivilizedInsectoidPlan38Q,
  shell:THREE.Material,armor:THREE.Material,quality:Vida38CivilizedInsectoidQuality38Q):void{
  // Una base ventral continua ancla ambas coxas; el solape alto está oculto por el abdomen.
  push(parent,created,buildVida38InsectoidPelvis38Q1D(plan,quality),
    'VIDA38_Q1D_CONTINUOUS_PELVIC_SADDLE','PELVIS');
  const legFamily=(()=>{
    switch(plan.archetype){
      case 'MANTID_SENTINEL': return {hipX:.17,hipY:1.00,hipZ:-.01,femurY:.79,kneeY:.57,ankleY:.18,stepZ:.02,shinCurve:-.10,footZ:.17,clawSpread:.040,thigh:[.068,.098,.078,.056],shin:[.054,.050,.040,.030],tarsus:[.034,.040,.034],boot:.92};
      case 'BEETLE_BASTION': return {hipX:.18,hipY:1.01,hipZ:.00,femurY:.82,kneeY:.60,ankleY:.16,stepZ:-.01,shinCurve:-.06,footZ:.15,clawSpread:.036,thigh:[.082,.116,.090,.064],shin:[.060,.055,.046,.034],tarsus:[.036,.044,.036],boot:1.05};
      case 'WASP_DIPLOMAT': return {hipX:.16,hipY:1.01,hipZ:-.01,femurY:.78,kneeY:.54,ankleY:.17,stepZ:-.03,shinCurve:-.12,footZ:.21,clawSpread:.046,thigh:[.060,.088,.068,.046],shin:[.046,.043,.034,.026],tarsus:[.028,.034,.028],boot:.86};
      case 'ANT_ENGINEER': return {hipX:.17,hipY:1.01,hipZ:.00,femurY:.80,kneeY:.57,ankleY:.16,stepZ:-.02,shinCurve:-.08,footZ:.18,clawSpread:.040,thigh:[.068,.098,.074,.050],shin:[.052,.047,.038,.029],tarsus:[.032,.038,.030],boot:.92};
      case 'MOTH_ORACLE': return {hipX:.16,hipY:1.02,hipZ:.01,femurY:.79,kneeY:.56,ankleY:.17,stepZ:.00,shinCurve:-.09,footZ:.20,clawSpread:.042,thigh:[.058,.084,.064,.044],shin:[.044,.040,.032,.024],tarsus:[.028,.034,.027],boot:.82};
      case 'DRAGONFLY_EXPLORER': return {hipX:.17,hipY:1.00,hipZ:-.01,femurY:.78,kneeY:.55,ankleY:.18,stepZ:.02,shinCurve:-.11,footZ:.22,clawSpread:.044,thigh:[.060,.090,.068,.047],shin:[.046,.043,.034,.026],tarsus:[.028,.034,.028],boot:.86};
      case 'CICADA_ARCHIVIST': return {hipX:.17,hipY:1.01,hipZ:.01,femurY:.81,kneeY:.58,ankleY:.16,stepZ:-.01,shinCurve:-.07,footZ:.18,clawSpread:.040,thigh:[.066,.094,.072,.050],shin:[.050,.046,.037,.028],tarsus:[.030,.037,.029],boot:.90};
      default: return {hipX:.15,hipY:1.00,hipZ:.00,femurY:.80,kneeY:.55,ankleY:.18,stepZ:.02,shinCurve:-.07,footZ:.19,clawSpread:.038,thigh:[.054,.078,.060,.042],shin:[.040,.036,.030,.022],tarsus:[.026,.030,.024],boot:.78};
    }
  })();
  for(const side of [-1,1] as const){
    const frame=deriveVida38InsectoidCoxalFrame38Q1D(plan,side);
    const hip=frame.inside;
    const coxaEnd=frame.exit;
    const upperMid=new THREE.Vector3(side*(legFamily.hipX+.085),legFamily.femurY,.02+legFamily.stepZ);
    const knee=new THREE.Vector3(side*(legFamily.hipX+.12),legFamily.kneeY,-.11+legFamily.stepZ);
    const shinMid=new THREE.Vector3(side*(legFamily.hipX+.13),lerp(legFamily.kneeY,legFamily.ankleY,.52),legFamily.shinCurve);
    const ankle=new THREE.Vector3(side*(legFamily.hipX+.10),legFamily.ankleY,.03);
    const tarsus=new THREE.Vector3(side*(legFamily.hipX+.13),.10,legFamily.footZ*.62);
    const foot=new THREE.Vector3(side*(legFamily.hipX+.17),.06,legFamily.footZ);
    const coxa=new THREE.Mesh(vessel([
      hip,frame.articular,coxaEnd,
    ],[.078,.086,.070],12),shell);
    coxa.userData['vida38CoxalEmbedded38Q1D']=true;
    coxa.userData['vida38CoxalEmbedDepth38Q1D']=frame.embedDepth;
    coxa.userData['vida38CoxalSide38Q1D']=side;
    push(parent,created,coxa,'VIDA38_Q1D_ANATOMICAL_COXA','LEG');
    push(parent,created,buildVida38InsectoidCoxalScute38Q1D(plan,side,quality),
      side<0?'VIDA38_Q1D_LEFT_COXAL_SCUTE':'VIDA38_Q1D_RIGHT_COXAL_SCUTE','COXAL_SCUTE');
    const femur=new THREE.Mesh(vessel([frame.femurStart,upperMid,knee],legFamily.thigh as [number,number,number,number],10),shell);
    push(parent,created,femur,'VIDA38_Q1B_FEMUR','LEG');
    const kneeNode=new THREE.Mesh(new THREE.SphereGeometry(legFamily.thigh[2],10,8),shell);
    kneeNode.position.copy(knee).add(new THREE.Vector3(side*.006,.00,-.005));
    kneeNode.scale.set(1.0,.86,.78);
    push(parent,created,kneeNode,'VIDA38_Q1B_KNEE_NODE','LEG');
    const tibia=new THREE.Mesh(vessel([knee,shinMid,ankle],legFamily.shin as [number,number,number,number],10),shell);
    push(parent,created,tibia,'VIDA38_Q1B_TIBIA','LEG');
    const tarsusMesh=new THREE.Mesh(vessel([ankle,tarsus,foot],legFamily.tarsus as [number,number,number],9),armor);
    tarsusMesh.scale.set(1,1,legFamily.boot);
    push(parent,created,tarsusMesh,'VIDA38_Q1B_TARSUS_BOOT','BOOT');
    for(let digit=-1;digit<=1;digit++){
      const toe=new THREE.Mesh(vessel([foot,
        foot.clone().add(new THREE.Vector3(side*digit*legFamily.clawSpread,.00,.07)),
        foot.clone().add(new THREE.Vector3(side*digit*legFamily.clawSpread*1.25,-.014,.12))],[.018,.013,.0025],7),shell);
      push(parent,created,toe,'VIDA38_Q1B_TARSAL_CLAW','CLAW');
    }
    const greave=new THREE.Mesh(vessel([
      knee.clone().lerp(ankle,.10).add(new THREE.Vector3(side*.008,.00,-.01)),
      knee.clone().lerp(ankle,.48).add(new THREE.Vector3(side*.010,.00,.005)),
      ankle.clone().lerp(tarsus,.34).add(new THREE.Vector3(side*.006,.00,.012)),
    ],[legFamily.shin[1]*1.02,legFamily.shin[2]*1.10,legFamily.tarsus[0]*1.08],9),armor);
    push(parent,created,greave,'VIDA38_Q1B_GREAVE','GREAVE');
  }
}
interface HandAnchor38Q {side:-1|1;index:number;pos:THREE.Vector3}
/**
 * 38.2q1c: raíces de los brazos calculadas sobre el contorno REAL del tórax.
 * Los arranques quedan enterrados, los manguitos rebasan la piel sin dejar
 * a la vista tapas abiertas de cilindros y no se alteran los brazos/manos.
 */
function addArms(parent:THREE.Group,created:THREE.Object3D[],plan:Vida38CivilizedInsectoidPlan38Q,shell:THREE.Material,armor:THREE.Material):HandAnchor38Q[]{
  const hands:HandAnchor38Q[]=[];
  for(let index=0;index<plan.armPairs;index++){
    const fraction=plan.armPairs===1?.3:index/Math.max(1,plan.armPairs-1);
    const y=1.72-fraction*.38;
    for(const side of [-1,1] as const){
      const frame=deriveVida38InsectoidShoulderFrame38Q1C(plan,index,side);
      const elbowDistance=Math.max((.44+index*.045)*plan.armLengthScale,frame.torsoRadius+.145);
      const wristDistance=Math.max((.48+index*.055)*plan.armLengthScale,elbowDistance+.025);
      const elbow=new THREE.Vector3(side*elbowDistance,y-.22+fraction*.07,.10+fraction*.10);
      const wrist=new THREE.Vector3(side*wristDistance,y-.40+fraction*.10,.18+fraction*.16);
      // Primer anillo profundo dentro del tórax; el manguito acompaña
      // la dirección del húmero y se diluye bajo la quitina circundante.
      const socketPath=[
        frame.inside,
        frame.inside.clone().lerp(frame.surface,.72),
        frame.surface.clone().lerp(frame.outside,.62),
        frame.outside.clone().lerp(elbow,.21),
      ];
      const shoulder=new THREE.Mesh(vessel(socketPath,[.068,.094,.085,.060],12),shell);
      shoulder.userData['vida38InsectoidShoulderEmbedded38Q1C']=true;
      shoulder.userData['vida38InsectoidShoulderSurfaceRadius38Q1C']=frame.torsoRadius;
      shoulder.userData['vida38InsectoidShoulderLevel38Q1C']=index;
      push(parent,created,shoulder,'VIDA38_Q1C_INTEGRATED_THORACIC_COXA','SHOULDER');
      const humerus=new THREE.Mesh(vessel([
        frame.surface.clone().lerp(frame.outside,.28),
        frame.outside.clone().lerp(elbow,.54),
        elbow,
      ],[.077-fraction*.008,.062,.038],12),shell);
      push(parent,created,humerus,'VIDA38_Q_UPPER_ARM','ARM');
      const forearm=new THREE.Mesh(vessel([elbow,elbow.clone().lerp(wrist,.56),wrist],[.043,.037,.022]),shell);
      push(parent,created,forearm,'VIDA38_Q_FOREARM','ARM');
      const bracer=new THREE.Mesh(vessel([elbow.clone().lerp(wrist,.22),elbow.clone().lerp(wrist,.52),elbow.clone().lerp(wrist,.82)],[.045,.044,.028]),armor);
      push(parent,created,bracer,'VIDA38_Q_TECH_BRACER','BRACER');
      for(let finger=0;finger<3;finger++){
        const spread=(finger-1)*.033;
        const claw=new THREE.Mesh(vessel([wrist,
          wrist.clone().add(new THREE.Vector3(side*spread,-.047,.045)),
          wrist.clone().add(new THREE.Vector3(side*spread*1.4,-.080,.085))],[.015,.012,.003],7),shell);
        push(parent,created,claw,'VIDA38_Q_MANIPULATOR','FINGER');
      }
      hands.push({side,index,pos:wrist});
    }
  }
  return hands;
}
function addWings(parent:THREE.Group,created:THREE.Object3D[],plan:Vida38CivilizedInsectoidPlan38Q,
  quality:Vida38CivilizedInsectoidQuality38Q):void{
  for(const item of buildVida38InsectoidWings38Q1B(plan,quality)){
    push(parent,created,item.mesh,item.name,item.part);
  }
}

function addStinger(parent:THREE.Group,created:THREE.Object3D[],plan:Vida38CivilizedInsectoidPlan38Q):void{
  for(const item of buildVida38InsectoidStinger38Q1B(plan)){
    push(parent,created,item.mesh,item.name,item.part);
  }
}
/** 38.2q2 — seis familias de ropa independientes, con mallas de tejido continuo. */
function addWardrobe(parent: THREE.Group, created: THREE.Object3D[],
  plan: Vida38CivilizedInsectoidPlan38Q, quality: Vida38CivilizedInsectoidQuality38Q): void {
  for (const piece of buildVida38InsectoidWardrobe38Q2(plan, quality)) {
    push(parent, created, piece.mesh, piece.name, piece.part);
  }
}
function addAccessories(parent:THREE.Group,created:THREE.Object3D[],plan:Vida38CivilizedInsectoidPlan38Q,
  hands:readonly HandAnchor38Q[]):void{
  const light=mat(plan.neonHex,.18,.24,plan.neonHex);
  const metal=mat(plan.armorHex,.3,.69);
  const upper=hands.find(h=>h.index===0&&h.side===1);
  if(!upper)return;
  if(plan.accessory==='DATA_SPHERE'){
    const orb=new THREE.Mesh(new THREE.IcosahedronGeometry(.078,1),light);
    orb.position.copy(upper.pos).add(new THREE.Vector3(.08,.045,.075));
    push(parent,created,orb,'VIDA38_Q_DATA_SPHERE','ACCESSORY');
    for(let k=0;k<2;k++){
      const ring=new THREE.Mesh(new THREE.TorusGeometry(.11+k*.017,.006,6,28),light);
      ring.position.copy(orb.position);ring.rotation.set(k*.7,k*.8,0);
      push(parent,created,ring,'VIDA38_Q_DATA_RING','ACCESSORY');
    }
  }else if(plan.accessory==='CEREMONIAL_STAFF'){
    const position=upper.pos.clone();
    const staff=new THREE.Mesh(vessel([
      new THREE.Vector3(position.x, .11,position.z+.08),
      new THREE.Vector3(position.x+.01,.75,position.z+.08),
      new THREE.Vector3(position.x,1.72,position.z+.08),
    ],[.020,.027,.010]),metal);
    push(parent,created,staff,'VIDA38_Q_STAFF','ACCESSORY');
    const crown=new THREE.Mesh(new THREE.OctahedronGeometry(.072),light);
    crown.position.set(position.x,1.78,position.z+.08);
    push(parent,created,crown,'VIDA38_Q_STAFF_CROWN','ACCESSORY');
  }else if(plan.accessory==='HOLOGRAPHIC_VISOR'){
    const bridge=new THREE.Mesh(vessel([
      new THREE.Vector3(-.31*plan.headScale,2.18,.27),new THREE.Vector3(0,2.22,.30),
      new THREE.Vector3(.31*plan.headScale,2.18,.27),
    ],[.012,.014,.012]),light);
    push(parent,created,bridge,'VIDA38_Q_HOLO_VISOR','ACCESSORY');
  }else if(plan.accessory==='WRIST_CONSOLE'){
    const device=new THREE.Mesh(new THREE.OctahedronGeometry(.049,1),light);
    device.position.copy(upper.pos).add(new THREE.Vector3(upper.side*.012,.025,.023));
    push(parent,created,device,'VIDA38_Q_WRIST_CONSOLE','ACCESSORY');
  }
}

export function createVida38CivilizedInsectoidPreview38Q(subject:THREE.Group,contract:Vida38SpeciesVisualContract,
  quality:Vida38CivilizedInsectoidQuality38Q='HIGH'):THREE.Object3D[]{
  const plan=deriveVida38CivilizedInsectoidPlan38Q(contract),created:THREE.Object3D[]=[];
  const chitin=mat(plan.shellSecondaryHex,.36,.13);
  const armor=mat(plan.armorHex,plan.materialKind==='BRUSHED_ALLOY'?.29:.48,.45);
  const core=new THREE.Mesh(organicCore(plan,quality),shellMaterial(plan));
  push(subject,created,core,'VIDA38_Q_INTEGRATED_CORE','CONTINUOUS_TORSO');
  let cranium:THREE.Mesh|undefined;
  for(const item of buildVida38InsectoidHead38Q1B(plan,quality)){
    push(subject,created,item.mesh,item.name,item.part);
    if(item.part==='HEAD')cranium=item.mesh;
  }
  for(const side of [-1,1] as const)addEye(subject,created,plan,side,quality,cranium);
  addAuxiliaryEyes(subject,created,plan);
  addSpecialEyes(subject,created,plan,cranium);
  addCrestAndAntennae(subject,created,plan,chitin);
  addLegs(subject,created,plan,chitin,armor,quality);
  const hands=addArms(subject,created,plan,chitin,armor);
  addWardrobe(subject,created,plan,quality);
  addAccessories(subject,created,plan,hands);
  addWings(subject,created,plan,quality);
  addStinger(subject,created,plan);
  subject.userData['civilizedRenderer38Q']='INSECTOID';
  subject.userData['civilizationLevel38Q']='VERY_ADVANCED';
  subject.userData['vida38CivilInsectoidRevision38Q']=VIDA38_CIV_INSECTOID_REVISION_38Q;
  subject.userData['vida38CivilInsectoidPlan38Q']=plan;
  subject.userData['vida38InsectoidWardrobeRevision38Q2']=VIDA38_INSECTOID_WARDROBE_REVISION_38Q2;
  subject.userData['vida38InsectoidWardrobeStyle38Q2']=deriveVida38InsectoidWardrobeStyle38Q2(plan);
  subject.userData['vida38CivilInsectoidSignature38Q']=plan.signature;
  subject.userData['vida38CivilInsectoidArmPairs38Q']=plan.armPairs;
  subject.userData['vida38CivilInsectoidLegPairs38Q']=1;
  subject.userData['vida38CivilInsectoidWingPairs38Q']=plan.wingPairs;
  subject.userData['vida38CivilInsectoidExtraEyes38Q']=plan.extraEyes;
  subject.userData['vida38CivilInsectoidStinger38Q']=plan.stinger;
  subject.userData['vida38CivilInsectoidOrganicRevision38Q1B']=VIDA38_INSECTOID_ORGANIC_REVISION_38Q1B;
  subject.userData['vida38InsectoidJointFixRevision38Q1C']=VIDA38_INSECTOID_JOINT_FIX_REVISION_38Q1C;
  subject.userData['vida38InsectoidOcularCoxalRevision38Q1D']=VIDA38_INSECTOID_OCULAR_COXAL_REVISION_38Q1D;
  subject.userData['vida38InsectoidDarkEyePlan38Q1D']=deriveVida38InsectoidDarkEyePlan38Q1D(plan).signature;
  subject.userData['vida38InsectoidFlyEyeRevision38Q1E']=VIDA38_INSECTOID_FLY_EYE_REVISION_38Q1E;
  subject.userData['vida38InsectoidFlyEyePlan38Q1E']=deriveVida38InsectoidFlyEyeSpec38Q1E(plan,quality).signature;
  subject.userData['vida38InsectoidOcularDiversityRevision38Q1F']=VIDA38_INSECTOID_OCULAR_DIVERSITY_REVISION_38Q1F;
  subject.userData['vida38InsectoidOcularDiversityPlan38Q1F']=deriveVida38InsectoidOcularPlan38Q1F(plan).signature;
  subject.userData['vida38InsectoidOcularDiversitySignature38Q1F']=collectVida38InsectoidOcularSignature38Q1F(plan,quality);
  subject.userData['vida38CivilInsectoidOrganicStyle38Q1B']=deriveVida38InsectoidAnatomicalStyle38Q1B(plan);
  subject.userData['vida38ScientificObservedImage']=false;
  return created;
}
