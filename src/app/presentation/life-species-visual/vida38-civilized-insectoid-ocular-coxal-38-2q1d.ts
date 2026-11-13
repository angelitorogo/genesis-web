/**
 * GENESIS / VIDA.38.2q1d — ojos compuestos obsidiana y pelvis/cápsulas coxales.
 * Exige contrato estable: no modifica la especie ni la persistencia.
 * Toda variación proviene de la identidad procedural del renderer 38.2q.
 */
import * as THREE from 'three';
import type { Vida38CivilizedInsectoidPlan38Q, Vida38CivilizedInsectoidQuality38Q } from './vida38-civilized-insectoid-preview-38-2q';

export const VIDA38_INSECTOID_OCULAR_COXAL_REVISION_38Q1D =
  'VIDA.38.2q1d/obsidian-eyes-coxal-transition/v1' as const;

export const VIDA38_INSECTOID_DARK_EYE_PALETTE_38Q1D = [
  '#050607', // negro profundo
  '#0b0d10', // grafito
  '#12161a', // obsidiana
  '#191e22', // antracita
] as const;

export interface Vida38InsectoidDarkEyePlan38Q1D {
  readonly revision: typeof VIDA38_INSECTOID_OCULAR_COXAL_REVISION_38Q1D;
  readonly baseHex: typeof VIDA38_INSECTOID_DARK_EYE_PALETTE_38Q1D[number];
  readonly facetHex: string;
  readonly roughness: number;
  readonly clearcoat: number;
  readonly facetVariation: number;
  readonly signature: string;
}
export interface Vida38InsectoidCoxalFrame38Q1D {
  readonly side: -1 | 1;
  readonly inside: THREE.Vector3;
  readonly articular: THREE.Vector3;
  readonly exit: THREE.Vector3;
  readonly femurStart: THREE.Vector3;
  readonly pelvisSurfaceX: number;
  readonly embedDepth: number;
}

function hash32(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619) >>> 0;
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b) >>> 0;
  h ^= h >>> 13;
  return h >>> 0;
}
function unit(seed: string): number { return hash32(seed) / 0xffffffff; }
function lerp(a: number, b: number, f: number): number { return a + (b - a) * f; }
function smooth(f: number): number { const t = Math.max(0, Math.min(1, f)); return t * t * (3 - 2 * t); }

/** Paleta NO dependiente de la pigmentación, la cultura ni los colores neón del traje. */
export function deriveVida38InsectoidDarkEyePlan38Q1D(plan: Vida38CivilizedInsectoidPlan38Q): Vida38InsectoidDarkEyePlan38Q1D {
  const seed = `${plan.speciesId}|${plan.signature}|EYE38Q1D`;
  const baseHex = VIDA38_INSECTOID_DARK_EYE_PALETTE_38Q1D[hash32(`${seed}|tone`) % 4]!;
  const base = new THREE.Color(baseHex);
  // El contraste de facetas se limita a un gris casi negro: nada de cian, neón o esmeralda.
  const facetHex = base.clone().lerp(new THREE.Color('#2b3135'), .24 + unit(`${seed}|facet`) * .18).getStyle();
  const roughness = .40 + unit(`${seed}|roughness`) * .12;
  const clearcoat = .16 + unit(`${seed}|clearcoat`) * .12;
  const facetVariation = .16 + unit(`${seed}|microfacet`) * .12;
  return {revision: VIDA38_INSECTOID_OCULAR_COXAL_REVISION_38Q1D,
    baseHex, facetHex, roughness, clearcoat, facetVariation,
    signature: `${baseHex}|${facetHex}|${roughness.toFixed(6)}|${clearcoat.toFixed(6)}|${facetVariation.toFixed(6)}`};
}

// Perfil ovoide inferior orgánico: diseñado para solaparse bajo el abdomen,
// estrecharse hacia abajo y prolongar los puntos de inserción de ambas patas.
const PELVIS_BANDS_38Q1D = [
  [.83, .055, .047],
  [.87, .110, .084],
  [.92, .172, .116],
  [.99, .211, .143],
  [1.05, .218, .158],
  [1.12, .213, .162],
  [1.21, .187, .144],
  [1.26, .170, .133],
] as const;

function pelvicRadius(y: number): { rx: number; rz: number } {
  if (y <= PELVIS_BANDS_38Q1D[0]![0]) return {rx:.055, rz:.047};
  for (let i = 1; i < PELVIS_BANDS_38Q1D.length; i++) {
    const upper = PELVIS_BANDS_38Q1D[i]!;
    if (y > upper[0]) continue;
    const lower = PELVIS_BANDS_38Q1D[i - 1]!;
    const t = smooth((y - lower[0]) / (upper[0] - lower[0]));
    return {rx: lerp(lower[1], upper[1], t), rz: lerp(lower[2], upper[2], t)};
  }
  return {rx:.170, rz:.133};
}

export function deriveVida38InsectoidCoxalFrame38Q1D(
  plan: Vida38CivilizedInsectoidPlan38Q, side: -1 | 1,
): Vida38InsectoidCoxalFrame38Q1D {
  const robust = plan.archetype === 'BEETLE_BASTION' || plan.silhouette === 'ROBUST';
  const slim = plan.archetype === 'STICK_SCHOLAR' || plan.silhouette === 'SLENDER';
  const hipWidth = slim ? .15 : robust ? .18 : .17;
  const y = robust ? 1.025 : 1.01;
  const surface = pelvicRadius(y).rx;
  const inside = new THREE.Vector3(side * (hipWidth * .68), y + .095, -.008);
  const articular = new THREE.Vector3(side * (hipWidth * 1.04), y + .020, -.006);
  const exit = new THREE.Vector3(side * (hipWidth + .062), y - .046, -.016);
  const femurStart = new THREE.Vector3(side * (hipWidth + .061), y - .047, -.016);
  return {side, inside, articular, exit, femurStart, pelvisSurfaceX:surface,
    embedDepth: surface - Math.abs(inside.x)};
}

/** Superficie coxal con continuidad 360°, dos lóbulos anatómicos laterales y material quitinoso. */
export function buildVida38InsectoidPelvis38Q1D(
  plan: Vida38CivilizedInsectoidPlan38Q, quality: Vida38CivilizedInsectoidQuality38Q,
): THREE.Mesh {
  const around = quality === 'LOW' ? 24 : quality === 'MEDIUM' ? 36 : 52;
  const rows = quality === 'LOW' ? 32 : quality === 'MEDIUM' ? 48 : 64;
  const vertices: number[] = [], colors: number[] = [], triangles: number[] = [];
  const shell = new THREE.Color(plan.shellHex);
  const secondary = new THREE.Color(plan.shellSecondaryHex);
  for (let j = 0; j <= rows; j++) {
    const t = j / rows;
    const y = lerp(.83,1.26,t);
    const {rx,rz} = pelvicRadius(y);
    const lobe = Math.exp(-Math.pow((y - 1.015)/.094, 2));
    for (let i = 0; i <= around; i++) {
      const a = i / around * Math.PI * 2;
      const side = Math.sin(a), front = Math.cos(a);
      const hipLobe = 1 + .11*lobe*Math.pow(Math.abs(side), 6);
      const ventral = .018*Math.pow(Math.max(0,front), 2)*Math.exp(-Math.pow((y-.98)/.12,2));
      const seam = .003 * Math.cos(a * 4) * lobe;
      const x = side * rx * hipLobe;
      const z = front * (rz + ventral) - .018 + seam;
      vertices.push(x,y,z);
      const pigment = .18 + .20*lobe*Math.abs(side) + .06*Math.cos(a*4) + .05*Math.sin((y-.83)*32);
      const c=shell.clone().lerp(secondary,Math.max(0,Math.min(.46,pigment)));
      colors.push(c.r,c.g,c.b);
      if(j>0&&i>0){
        const b=j*(around+1)+i;
        // Cara anterior: la normal radial es exterior, nunca hacia el cuerpo.
        triangles.push(b, b-1, b-around-2, b, b-around-2, b-around-1);
      }
    }
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  g.setIndex(triangles);g.computeVertexNormals();
  const material=new THREE.MeshPhysicalMaterial({color:'#ffffff',vertexColors:true,roughness:.47,metalness:.04,clearcoat:.14,side:THREE.DoubleSide});
  const mesh=new THREE.Mesh(g,material);
  mesh.name='VIDA38_Q1D_CONTINUOUS_PELVIC_SADDLE';
  mesh.userData['vida38CoxalBridge38Q1D']=true;
  mesh.userData['vida38CoxalBridgeTop38Q1D']=1.26;
  mesh.userData['vida38CoxalBridgeBottom38Q1D']=.83;
  mesh.castShadow=true;
  return mesh;
}

/** Pequeño escudo coxal conformado en la propia superficie del faldón ventral.
 * No crea una rótula esférica ni tapa flotante: sigue el ovoide de la pelvis. */
export function buildVida38InsectoidCoxalScute38Q1D(
  plan: Vida38CivilizedInsectoidPlan38Q, side: -1 | 1,
  quality: Vida38CivilizedInsectoidQuality38Q,
): THREE.Mesh {
  const rows = quality === 'LOW' ? 8 : 14;
  const columns = quality === 'LOW' ? 12 : 20;
  const positions:number[]=[],faces:number[]=[];
  for(let j=0;j<=rows;j++) {
    const v=j/rows;
    const y=.922+.174*v;
    const {rx,rz}=pelvicRadius(y);
    const lobe=Math.exp(-Math.pow((y-1.015)/.094,2));
    for(let i=0;i<=columns;i++) {
      const u=i/columns*2-1;
      const angle=side*Math.PI/2 + u*(.35+.05*Math.sin(v*Math.PI));
      const sin=Math.sin(angle), cos=Math.cos(angle);
      const x=sin*rx*(1+.11*lobe*Math.pow(Math.abs(sin),6));
      const z=cos*(rz+.018*Math.pow(Math.max(0,cos),2)*Math.exp(-Math.pow((y-.98)/.12,2)))-.018+.003*Math.cos(angle*4)*lobe;
      const edgeFade=Math.pow(Math.max(0,1-u*u),.55)*Math.sin(Math.PI*v);
      positions.push(x+sin*(.003+.006*edgeFade), y, z+cos*(.003+.006*edgeFade));
      if(j>0&&i>0) {
        const b=j*(columns+1)+i;
        faces.push(b,b-1,b-columns-2,b,b-columns-2,b-columns-1);
      }
    }
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geo.setIndex(faces);geo.computeVertexNormals();
  const primary=new THREE.Color(plan.shellHex),secondary=new THREE.Color(plan.shellSecondaryHex);
  const material=new THREE.MeshPhysicalMaterial({color:primary.lerp(secondary,.42),roughness:.53,metalness:.07,clearcoat:.13,side:THREE.DoubleSide});
  const mesh=new THREE.Mesh(geo,material);
  mesh.name=side<0?'VIDA38_Q1D_LEFT_CONFORMAL_COXAL_SCUTE':'VIDA38_Q1D_RIGHT_CONFORMAL_COXAL_SCUTE';
  mesh.userData['vida38CoxalScute38Q1D']=true;
  mesh.userData['vida38CoxalScuteSide38Q1D']=side;
  mesh.castShadow=true;
  return mesh;
}
