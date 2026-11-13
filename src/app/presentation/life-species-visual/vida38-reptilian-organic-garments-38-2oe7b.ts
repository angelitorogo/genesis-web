/**
 * VIDA 38.2o.e7b — vestimenta blanda tridimensional para reptilianos civilizados.
 * Mallas envolventes continuas, sin «cajas-faldón», con abertura anatómica de cola.
 * Reproducibilidad CT-0: hash estable de identidad; nunca azar no determinista ni estado global.
 * Geometría independiente del renderer para pruebas de topología rápidas.
 */
import * as THREE from 'three';
import type { Vida38HumanoidAnatomy } from './vida38-humanoid-organic-field-38-2e';

export type Vida38OrganicGarmentKind38OE7B =
  | 'PRIEST_TUNIC' | 'TECHNO_HABIT' | 'NOBLE_MANTLE'
  | 'COLONIAL_OVERCOAT' | 'PELAGIC_VEIL';
export type Vida38OrganicGarmentLength38OE7B = 'THIGH' | 'KNEE' | 'ANKLE';

export interface Vida38OrganicGarmentPlan38OE7B {
  readonly kind: Vida38OrganicGarmentKind38OE7B;
  readonly length: Vida38OrganicGarmentLength38OE7B;
  readonly flare: number;
  readonly pleatCount: number;
  readonly phase: number;
  readonly thickness: number;
  readonly primaryColor: string;
  readonly accentColor: string;
  readonly culture: string;
  readonly signature: string;
}

interface OrganicGarmentParams38OE7B {
  readonly speciesId: string;
  readonly appearanceFingerprint: string;
  readonly garmentFamily: string;
  readonly garmentLine: string;
  readonly culture: string;
  readonly primaryColor: string;
  readonly accentColor: string;
}

function fnv32(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) h = Math.imul(h ^ value.charCodeAt(i), 16777619) >>> 0;
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b) >>> 0;
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35) >>> 0;
  h ^= h >>> 16;
  return h >>> 0;
}
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
const clamp = (v: number, a: number, b: number): number => Math.max(a, Math.min(b, v));
const smooth = (v: number): number => v * v * (3 - 2 * v);

export function deriveVida38OrganicGarmentPlan38OE7B(p: OrganicGarmentParams38OE7B): Vida38OrganicGarmentPlan38OE7B {
  const basis = `${p.speciesId}|${p.appearanceFingerprint}|${p.garmentFamily}|${p.garmentLine}|${p.culture}|38.2o.e7b`;
  const h = fnv32(basis);
  let kind: Vida38OrganicGarmentKind38OE7B;
  if (p.garmentFamily === 'CEREMONIAL_ROBES') kind = p.garmentLine === 'TECHNO_PRIEST' || p.culture === 'BASILICA_TECHNOCRACY' ? 'TECHNO_HABIT' : 'PRIEST_TUNIC';
  else if (p.garmentFamily === 'NOBLE_REGALIA') kind = 'NOBLE_MANTLE';
  else if (p.garmentFamily === 'PELAGIC_DRAPE') kind = 'PELAGIC_VEIL';
  else kind = 'COLONIAL_OVERCOAT';
  const levels: readonly Vida38OrganicGarmentLength38OE7B[] = kind === 'TECHNO_HABIT' ? ['KNEE', 'ANKLE', 'ANKLE']
    : kind === 'PRIEST_TUNIC' ? ['THIGH', 'KNEE', 'ANKLE']
    : kind === 'NOBLE_MANTLE' ? ['THIGH', 'KNEE', 'ANKLE']
    : kind === 'PELAGIC_VEIL' ? ['THIGH', 'KNEE', 'KNEE']
    : ['THIGH', 'THIGH', 'KNEE'];
  const length = levels[(h >>> 5) % levels.length]!;
  const flare = (kind === 'NOBLE_MANTLE' ? 0.46 : kind === 'PELAGIC_VEIL' ? 0.40 : 0.31) + ((h >>> 9) % 11) / 100;
  const pleatCount = 7 + ((h >>> 15) % 7);
  const phase = (h % 359) / 359 * Math.PI * 2;
  const thickness = 0.009 + ((h >>> 21) % 5) * 0.0015;
  return {
    kind, length, flare, pleatCount, phase, thickness,
    primaryColor: p.primaryColor, accentColor: p.accentColor, culture: p.culture,
    signature: `${kind}:${length}:${flare.toFixed(3)}:${pleatCount}:${phase.toFixed(5)}:${thickness.toFixed(4)}:${p.culture}`,
  };
}

/** Perfil de cuerpo central: evita tomar la cola o las manos como silueta del torso. */
interface TorsoCrossSection38OE7B { readonly width: number; readonly front: number; readonly back: number; }
function sampleTorsoCrossSection38OE7B(body: THREE.Mesh, y: number, halfWidth: number): TorsoCrossSection38OE7B {
  const geometry = body.geometry as THREE.BufferGeometry;
  const positions = geometry.getAttribute('position');
  let width = 0, front = 0, back = 0, matches = 0;
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i), vy = positions.getY(i), z = positions.getZ(i);
    if (Math.abs(vy - y) > 0.07 || Math.abs(x) > halfWidth || z < -0.36 || z > 0.42) continue;
    width = Math.max(width, Math.abs(x));
    front = Math.max(front, z);
    back = Math.max(back, -z);
    matches++;
  }
  return {
    width: matches >= 5 ? width : halfWidth * 0.82,
    front: matches >= 5 ? Math.max(front, 0.10) : 0.15,
    back: matches >= 5 ? Math.max(back, 0.10) : 0.15,
  };
}

export interface Vida38SoftShellStats38OE7B {
  readonly vertexCount: number;
  readonly triangleCount: number;
  readonly rearTailOpening: boolean;
  readonly length: Vida38OrganicGarmentLength38OE7B;
  readonly closedThickness: boolean;
  readonly minimumHemY: number;
  readonly maximumShoulderY: number;
}

/**
 * Funda continua alrededor de torso, caderas y piernas.
 * Superficies interna y externa + paredes de contorno en un solo BufferGeometry.
 * La abertura posterior se recorta en el tejido, no en la cola.
 */
export function createVida38ReptilianSoftShell38OE7B(
  body: THREE.Mesh,
  anatomy: Pick<Vida38HumanoidAnatomy, 'legLength' | 'torsoLength' | 'shoulderWidth' | 'hipWidth'>,
  plan: Vida38OrganicGarmentPlan38OE7B,
): THREE.Mesh {
  const p = anatomy.legLength;
  const top = p + anatomy.torsoLength * 0.83;
  const hem = plan.length === 'ANKLE' ? Math.max(0.13, p * 0.14)
    : plan.length === 'KNEE' ? Math.max(0.20, p * 0.48)
    : Math.max(0.29, p * 0.72);
  const chest = sampleTorsoCrossSection38OE7B(body, p + anatomy.torsoLength * 0.52, anatomy.shoulderWidth * 0.86);
  const waist = sampleTorsoCrossSection38OE7B(body, p + anatomy.torsoLength * 0.10, anatomy.shoulderWidth * 0.78);
  const topW = Math.max(anatomy.shoulderWidth * 0.76, chest.width * 1.06, 0.20);
  const waistW = Math.max(anatomy.hipWidth * 1.10, waist.width * 1.10, 0.18);
  const topFront = Math.max(0.15, chest.front * 1.13);
  const topBack = Math.max(0.15, chest.back * 1.13);
  const waistFront = Math.max(0.16, waist.front * 1.14);
  const waistBack = Math.max(0.16, waist.back * 1.14);
  const radialSteps = 72;
  const verticalSteps = 45;
  const positions: number[] = [];
  const uv: number[] = [];
  const triangles: number[] = [];
  const outerFaceEdges = new Map<string, { count: number; a: number; b: number }>();
  const tailCenter = p - 0.025;
  const tailHeight = Math.min(0.23, p * 0.33);
  const tailHalfAngle = clamp(Math.atan2(0.20, waistW), 0.45, 0.78);

  const yAt = (r: number): number => lerp(hem, top, r / verticalSteps);
  const thetaAt = (c: number): number => c / radialSteps * 2 * Math.PI;
  const insideTailOpening = (r: number, c: number): boolean => {
    const y = yAt(r);
    const theta = thetaAt(c);
    const da = Math.atan2(Math.sin(theta - Math.PI), Math.cos(theta - Math.PI));
    return (da / tailHalfAngle) ** 2 + ((y - tailCenter) / tailHeight) ** 2 < 1;
  };

  for (let r = 0; r <= verticalSteps; r++) {
    const y = yAt(r);
    const upperT = clamp((y - p) / Math.max(0.05, top - p), 0, 1);
    const lowerT = clamp((p - y) / Math.max(0.05, p - hem), 0, 1);
    const raised = smooth(upperT);
    const flared = smooth(lowerT);
    const w = lerp(waistW, topW, raised) * (1 + plan.flare * flared);
    const zFront = lerp(waistFront, topFront, raised) * (1 + plan.flare * 0.56 * flared);
    const zBack = lerp(waistBack, topBack, raised) * (1 + plan.flare * 0.56 * flared);
    const foldGain = 0.004 + 0.027 * (0.20 + 0.80 * flared);
    for (let c = 0; c < radialSteps; c++) {
      const theta = thetaAt(c);
      const sx = Math.sin(theta), cz = Math.cos(theta);
      const wave = Math.sin(theta * plan.pleatCount + plan.phase + lowerT * 0.60);
      const secondary = Math.sin(theta * (plan.pleatCount + 3) + plan.phase * 0.53 - upperT);
      const fold = foldGain * (0.70 * wave + 0.30 * secondary);
      const offsetW = w + fold;
      const zRad = cz >= 0 ? zFront : zBack;
      const outerX = sx * offsetW;
      const outerZ = cz * (zRad + fold * 0.66);
      const thickness = plan.thickness;
      for (let surface = 0; surface < 2; surface++) {
        const inward = surface === 1 ? thickness : 0;
        positions.push(outerX - sx * inward, y, outerZ - cz * inward);
        uv.push(c / radialSteps, r / verticalSteps);
      }
    }
  }

  const vertex = (r: number, c: number, inner: number): number => (r * radialSteps + (c + radialSteps) % radialSteps) * 2 + inner;
  const edgeKey = (a: number, b: number): string => a < b ? `${a}:${b}` : `${b}:${a}`;
  const addFace = (a: number, b: number, c: number): void => {
    triangles.push(a, b, c, c + 1, b + 1, a + 1); // cara externa e interna
    for (const [u, v] of [[a, b], [b, c], [c, a]]) {
      const key = edgeKey(u, v);
      const item = outerFaceEdges.get(key);
      if (item) item.count++;
      else outerFaceEdges.set(key, { count: 1, a: u, b: v });
    }
  };
  for (let r = 0; r < verticalSteps; r++) {
    for (let c = 0; c < radialSteps; c++) {
      const cNext = (c + 1) % radialSteps;
      const holeCount = Number(insideTailOpening(r, c))
        + Number(insideTailOpening(r, cNext))
        + Number(insideTailOpening(r + 1, c))
        + Number(insideTailOpening(r + 1, cNext));
      if (holeCount > 0) continue; // no invadir la raíz de la cola
      const a = vertex(r, c, 0), b = vertex(r, cNext, 0);
      const cTop = vertex(r + 1, c, 0), d = vertex(r + 1, cNext, 0);
      addFace(a, b, cTop);
      addFace(b, d, cTop);
    }
  }
  // Cada arista frontera (cuello, dobladillo y abertura caudal) tiene pared de grosor.
  for (const edge of outerFaceEdges.values()) {
    if (edge.count !== 1) continue;
    triangles.push(edge.a, edge.a + 1, edge.b, edge.b, edge.a + 1, edge.b + 1);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(triangles);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  const fabric = new THREE.MeshPhysicalMaterial({
    color: plan.primaryColor,
    roughness: plan.kind === 'PELAGIC_VEIL' ? 0.40 : plan.kind === 'NOBLE_MANTLE' ? 0.62 : 0.87,
    metalness: plan.kind === 'NOBLE_MANTLE' ? 0.08 : 0.015,
    side: THREE.DoubleSide,
    clearcoat: plan.kind === 'PELAGIC_VEIL' ? 0.16 : 0.015,
  });
  const garment = new THREE.Mesh(geometry, fabric);
  garment.name = 'VIDA38_2OD_REPTILIAN_GARMENT';
  garment.castShadow = true;
  garment.receiveShadow = true;
  garment.userData['garmentPart38OE6'] = `OE7B_ROBE_${plan.kind}_FULL_WRAP`;
  garment.userData['garmentGeom38OE7'] = true;
  garment.userData['garmentGeomKind38OE7'] = 'CONTINUOUS_360_THICK_SHELL';
  garment.userData['garmentPlan38OE7B'] = plan.signature;
  garment.userData['garmentCoverage38OE7B'] = 'TORSO_BACK_HIPS_360';
  garment.userData['tailOpening38OE7B'] = true;
  garment.userData['garmentStats38OE7B'] = {
    vertexCount: positions.length / 3, triangleCount: triangles.length / 3,
    rearTailOpening: true, length: plan.length,
    closedThickness: true, minimumHemY: hem, maximumShoulderY: top,
  } satisfies Vida38SoftShellStats38OE7B;
  return garment;
}

/** Panel suave con caída/arrugas, no una caja. Capa independiente y continua. */
export function createVida38SoftDrape38OE7B(
  width: number, length: number, color: string, options: {
    phase: number; pleats: number; depth?: number; flare?: number;
    opacity?: number; roughness?: number; metalness?: number;
  },
): THREE.Mesh {
  const n = 24, m = 22;
  const vertices: number[] = [];
  const indices: number[] = [];
  for (let r = 0; r <= m; r++) {
    const t = r / m;
    for (let c = 0; c <= n; c++) {
      const s = c / n * 2 - 1;
      const spread = (1 + (options.flare ?? 0.27) * t) * (0.90 + 0.10 * Math.sin(Math.PI * Math.min(1, t + 0.18)));
      const ripple = (options.depth ?? 0.026) * t * (
        0.70 * Math.sin(s * options.pleats * Math.PI + options.phase + t * 0.6) +
        0.30 * Math.sin(s * (options.pleats + 2) * Math.PI + t * 1.2)
      );
      vertices.push(s * width * 0.5 * spread, -length * t, ripple - 0.04 * t * t);
    }
  }
  for (let r = 0; r < m; r++) {
    for (let c = 0; c < n; c++) {
      const a = r * (n + 1) + c;
      const b = a + 1;
      const d = a + (n + 1);
      indices.push(a, b, d, b, d + 1, d);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const opacity = options.opacity ?? 1;
  const mat = new THREE.MeshPhysicalMaterial({
    color, roughness: options.roughness ?? 0.76, metalness: options.metalness ?? 0.02,
    side: THREE.DoubleSide, transparent: opacity < 1, opacity,
    depthWrite: opacity >= 1,
  });
  const mesh = new THREE.Mesh(geometry, mat);
  mesh.name = 'VIDA38_2OD_REPTILIAN_GARMENT';
  mesh.castShadow = true;
  mesh.userData['garmentGeom38OE7'] = true;
  mesh.userData['garmentGeomKind38OE7'] = 'ORGANIC_FOLDED_DRAPE';
  return mesh;
}

export function createVida38ReptilianOrganicGarments38OE7B(
  body: THREE.Mesh,
  anatomy: Vida38HumanoidAnatomy,
  plan: Vida38OrganicGarmentPlan38OE7B,
): THREE.Mesh[] {
  const p = anatomy.legLength;
  const chest = sampleTorsoCrossSection38OE7B(body, p + anatomy.torsoLength * 0.52, anatomy.shoulderWidth * 0.86);
  const frontDrapeZ = Math.max(0.205, chest.front * 1.15 + 0.028);
  const backDrapeZ = -Math.max(0.195, chest.back * 1.14 + 0.030);
  const created = [createVida38ReptilianSoftShell38OE7B(body, anatomy, plan)];
  const add = (mesh: THREE.Mesh, name: string, x: number, y: number, z: number): void => {
    mesh.position.set(x, y, z);
    mesh.userData['garmentPart38OE6'] = `OE7B_${name}`;
    mesh.userData['garmentPlan38OE7B'] = plan.signature;
    created.push(mesh);
  };
  const dorsalLength = plan.kind === 'NOBLE_MANTLE' ? anatomy.torsoLength * 1.22
    : plan.kind === 'COLONIAL_OVERCOAT' ? anatomy.torsoLength * 0.91
    : anatomy.torsoLength * 0.72;
  if (plan.kind === 'NOBLE_MANTLE' || plan.kind === 'TECHNO_HABIT' || plan.kind === 'PRIEST_TUNIC') {
    // Dos paños dorsales anchos: separación central libre para la cola.
    for (const side of [-1, 1] as const) {
      const cape = createVida38SoftDrape38OE7B(
        anatomy.shoulderWidth * (plan.kind === 'NOBLE_MANTLE' ? 0.93 : 0.72), dorsalLength,
        plan.primaryColor, { phase: plan.phase + side * 0.42, pleats: 3 + plan.pleatCount % 3,
          flare: 0.22, depth: 0.025, roughness: 0.76 },
      );
      const center = side * anatomy.shoulderWidth * 0.51;
      add(cape, side < 0 ? 'LEFT_REAR_MANTLE' : 'RIGHT_REAR_MANTLE',
        center, p + anatomy.torsoLength * 0.78, backDrapeZ);
    }
    // Costuras/palas del frente con verdadera curvatura, no tiras rectangulares.
    for (const side of [-1, 1] as const) {
      const fall = createVida38SoftDrape38OE7B(
        anatomy.shoulderWidth * 0.30, anatomy.torsoLength * 0.64,
        plan.accentColor,
        { phase: plan.phase + side * 0.33, pleats: 3, flare: 0.08,
          depth: 0.011, roughness: 0.72 },
      );
      add(fall, side < 0 ? 'LEFT_FRONT_FOLD' : 'RIGHT_FRONT_FOLD',
        side * anatomy.shoulderWidth * 0.38, p + anatomy.torsoLength * 0.71, frontDrapeZ);
    }
  }
  if (plan.culture === 'BASILICA_TECHNOCRACY') {
    const stole = createVida38SoftDrape38OE7B(anatomy.shoulderWidth * 0.24,
      anatomy.torsoLength * 0.82, plan.accentColor,
      { phase: plan.phase, pleats: 3, depth: 0.011, flare: 0.06,
        roughness: 0.54, opacity: 0.90 });
    stole.position.set(0, p + anatomy.torsoLength * 0.75, frontDrapeZ + 0.008);
    stole.userData['garmentPart38OE6'] = 'BASILICA_STOLE_FRONT';
    stole.userData['garmentPlan38OE7B'] = plan.signature;
    created.push(stole);
  }
  if (plan.kind === 'PELAGIC_VEIL') {
    for (const side of [-1, 1] as const) {
      const veil = createVida38SoftDrape38OE7B(anatomy.shoulderWidth * 0.55, anatomy.legLength * 0.85,
        plan.accentColor, { phase: plan.phase + side * 0.65, pleats: 4, depth: 0.025, flare: 0.38, roughness: 0.40, opacity: 0.76 });
      veil.rotation.z = side * 0.11;
      add(veil, side === -1 ? 'LEFT_PELAGIC_VEIL' : 'RIGHT_PELAGIC_VEIL',
        side * anatomy.shoulderWidth * 0.80, p + anatomy.torsoLength * 0.50, backDrapeZ * 0.18);
      veil.userData['garmentPart38OE6'] = side === -1 ? 'PELAGIC_LEFT_VEIL' : 'PELAGIC_RIGHT_VEIL';
    }
  }
  if (plan.culture === 'PELAGIC_CONCORD' && plan.kind !== 'PELAGIC_VEIL') {
    const veil = createVida38SoftDrape38OE7B(anatomy.shoulderWidth * 0.60,
      anatomy.torsoLength * 0.92, plan.accentColor,
      { phase: plan.phase, pleats: 4, flare: 0.25, depth: 0.016,
        roughness: 0.38, opacity: 0.72 });
    add(veil, 'PELAGIC_CULTURE_VEIL', -anatomy.shoulderWidth * 0.70,
      p + anatomy.torsoLength * 0.65, backDrapeZ * 0.20);
    veil.userData['garmentPart38OE6'] = 'PELAGIC_CULTURE_VEIL';
  }
  if (plan.kind === 'COLONIAL_OVERCOAT') {
    for (const side of [-1, 1] as const) {
      const rear = createVida38SoftDrape38OE7B(anatomy.shoulderWidth * 0.60,
        anatomy.torsoLength * 0.91, plan.primaryColor,
        { phase: plan.phase + side * 0.40, pleats: 4, flare: 0.18,
          depth: 0.021, roughness: 0.82 });
      add(rear, side < 0 ? 'LEFT_COLONIAL_REAR_OVERCOAT' : 'RIGHT_COLONIAL_REAR_OVERCOAT',
        side * anatomy.shoulderWidth * 0.42, p + anatomy.torsoLength * 0.67, backDrapeZ);
    }
  }
  return created;
}
