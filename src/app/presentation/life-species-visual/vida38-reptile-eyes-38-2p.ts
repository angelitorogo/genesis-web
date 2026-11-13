/**
 * GENESIS 38.2p2a — globo ocular reptiliano centrado en la cavidad SDF.
 * Corrige la ocultación frontal 38.2p2: el iris/pupila siguen la curvatura
 * del globo y no se colocan tras su propia superficie.
 * No modifica la anatomía ni atribuye observaciones a la simulación.
 */
import * as THREE from 'three';
import type { Vida38ReptileMorphologyV1 } from './vida38-reptile-morphology-38-2j';
import { evaluateVida38ReptileField38J, type Vida38ReptileLandmarks38J } from './vida38-reptile-organic-field-38-2j';

export const VIDA38_REPTILE_EYE_REVISION_38P = 'VIDA.38.2p2a/reptile-sdf-cavity-globe/v1' as const;
export type Vida38ReptileIris38P = 'AMBER' | 'COPPER' | 'OLIVE' | 'SEA_GREEN' | 'ICE_BLUE';

export interface Vida38ReptileEyePlan38P {
  readonly iris: Vida38ReptileIris38P;
  readonly irisHex: string;
  readonly globeHex: string;
  readonly eyeWidth: number;
  readonly eyeHeight: number;
  readonly slitWidth: number;
  readonly eyebrowAngle: number;
  readonly globeInset: number;
}

/** Centro/radios calculados a partir de la cavidad real tallada en 38.2j. */
export interface Vida38ReptileOrbitalFrame38P2A {
  readonly center: THREE.Vector3;
  readonly gaze: THREE.Vector3;
  readonly radiusX: number;
  readonly radiusY: number;
  readonly radiusZ: number;
}

function scramble32(h: number): number {
  h ^= h >>> 16;
  h = Math.imul(h, 0x7feb352d) >>> 0;
  h ^= h >>> 15;
  h = Math.imul(h, 0x846ca68b) >>> 0;
  h ^= h >>> 16;
  return h >>> 0;
}
function colorMix(a: string, b: string, t: number): string {
  return `#${new THREE.Color(a).lerp(new THREE.Color(b), t).getHexString()}`;
}

export function deriveVida38ReptileEyePlan38P(m: Vida38ReptileMorphologyV1): Vida38ReptileEyePlan38P {
  const h = scramble32(m.identitySeed ^ 0x38_02_20);
  const colors = [
    ['AMBER', '#e1b956'], ['COPPER', '#d58c5f'], ['OLIVE', '#b5c763'],
    ['SEA_GREEN', '#61d5ac'], ['ICE_BLUE', '#8ed8ee'],
  ] as const;
  const palette = colors[h % colors.length]!;
  // La cavidad SDF de 38.2j se escala con eyeSize, NO con headSize.
  // Esto corrige la esfera excesivamente pequeña en cráneos reducidos.
  const socketScale = m.eyeSize;
  const radiusX = 0.045 * socketScale;
  const radiusY = 0.049 * socketScale;
  const reddish = ['#90645f', '#86605b', '#9b6b63', '#825d59'][(h >>> 21) % 4]!;
  return {
    iris: palette[0],
    irisHex: palette[1],
    globeHex: colorMix('#c3b2a7', reddish, 0.44),
    eyeWidth: radiusX * 2,
    eyeHeight: radiusY * 2,
    slitWidth: radiusX * (0.18 + ((h >>> 17) % 5) * 0.020),
    eyebrowAngle: ((h >>> 24) % 7 - 3) * 0.026,
    globeInset: 0.0060 + 0.0012 * socketScale,
  };
}

/**
 * La misma fórmula de ubicación ex/ey/ez que genera las cavidades oculares
 * del SDF de 38.2j. No se toma un hit arbitrario en la superficie exterior:
 * desde delante ese hit podía ocultar el globo entero tras el borde craneal.
 */
export function deriveVida38ReptileOrbitalFrame38P2A(
  m: Vida38ReptileMorphologyV1,
  a: Vida38ReptileLandmarks38J,
  side: -1 | 1,
): Vida38ReptileOrbitalFrame38P2A {
  const rx = 0.045 * m.eyeSize;
  const ry = 0.049 * m.eyeSize;
  const rz = 0.055 * m.eyeSize;
  const ex = side * .77 * a.headRadius * m.skullWidth * m.eyeLateralness;
  const ey = a.headY + .065 * m.headSize;
  const ez = a.headZ + .12 * m.headSize;
  const center = new THREE.Vector3(ex + side * rx * 0.11, ey, ez + rz * 0.09);
  // Una fracción lateral para conservar la lectura de perfil, mientras que
  // la componente frontal garantiza que el iris se vea también de cara.
  const lateral = THREE.MathUtils.clamp(0.34 + (m.eyeLateralness - 1) * 0.12, 0.27, 0.43);
  const gaze = new THREE.Vector3(side * lateral, 0.016, Math.sqrt(1 - lateral * lateral - 0.016 * 0.016)).normalize();
  return { center, gaze, radiusX: rx, radiusY: ry, radiusZ: rz };
}

/** API pública 38.2p conservada: localiza un punto real de piel. */
export function locateVida38ReptileEyeOnSkin38P(
  body: THREE.Mesh,
  m: Vida38ReptileMorphologyV1,
  a: Vida38ReptileLandmarks38J,
  side: -1 | 1,
): { readonly point: THREE.Vector3; readonly outward: THREE.Vector3 } | null {
  const eyeX = side * .77 * a.headRadius * m.skullWidth * m.eyeLateralness;
  const eyeY = a.headY + .065 * m.headSize;
  const eyeZ = a.headZ + .12 * m.headSize;
  const target = new THREE.Vector3(eyeX, eyeY, eyeZ);
  const trials = [
    new THREE.Vector3(side * 0.84, 0.0, 0.54).normalize(),
    new THREE.Vector3(side * 0.96, 0.06, 0.26).normalize(),
    new THREE.Vector3(side, 0, 0),
  ];
  body.updateMatrixWorld(true);
  for (const outward of trials) {
    const origin = target.clone().addScaledVector(outward, 1.2);
    const raycaster = new THREE.Raycaster(origin, outward.clone().negate(), 0, 2.2);
    const hit = raycaster.intersectObject(body, false)[0];
    if (!hit) continue;
    const actualNormal = hit.face?.normal.clone().normalize() ?? outward;
    const candidate = actualNormal.dot(outward) > 0.24 ? actualNormal.lerp(outward, 0.38).normalize() : outward;
    if (Math.abs(hit.point.z - eyeZ) > Math.max(.20, a.headRadius * 1.25)) continue;
    if (Math.abs(hit.point.y - eyeY) > Math.max(.12, a.headRadius * 0.85)) continue;
    return { point: hit.point.clone(), outward: candidate };
  }
  for (const outward of trials) {
    const origin = target.clone().addScaledVector(outward, 1.2);
    const direction = outward.clone().negate();
    let previousT = 0;
    let previousField = evaluateVida38ReptileField38J(m, origin.x, origin.y, origin.z);
    for (let t = .008; t < 1.85; t += .008) {
      const p = origin.clone().addScaledVector(direction, t);
      const field = evaluateVida38ReptileField38J(m, p.x, p.y, p.z);
      if (previousField > 0 && field <= 0) {
        let low = previousT, high = t;
        for (let i = 0; i < 9; i++) {
          const mid = (low + high) * .5;
          const q = origin.clone().addScaledVector(direction, mid);
          const d = evaluateVida38ReptileField38J(m, q.x, q.y, q.z);
          if (d <= 0) high = mid; else low = mid;
        }
        const hit = origin.clone().addScaledVector(direction, (low + high) * .5);
        if (Math.abs(hit.z - eyeZ) <= Math.max(.20, a.headRadius * 1.25)
          && Math.abs(hit.y - eyeY) <= Math.max(.12, a.headRadius * .85)) {
          const eps = .003;
          const f = (x: number, y: number, z: number): number => evaluateVida38ReptileField38J(m, x, y, z);
          const normal = new THREE.Vector3(
            f(hit.x + eps, hit.y, hit.z) - f(hit.x - eps, hit.y, hit.z),
            f(hit.x, hit.y + eps, hit.z) - f(hit.x, hit.y - eps, hit.z),
            f(hit.x, hit.y, hit.z + eps) - f(hit.x, hit.y, hit.z - eps),
          ).normalize();
          return { point: hit, outward: (normal.lengthSq() > .01 ? normal : outward).normalize() };
        }
        break;
      }
      previousT = t;
      previousField = field;
    }
  }
  return null;
}

/** Superficie esférica curvada, no un disco 2D por detrás del globo. */
function curvedOcularPatch38P2A(
  frame: Vida38ReptileOrbitalFrame38P2A,
  width: number,
  height: number,
  surfaceOffset: number,
  tilt: number,
): THREE.BufferGeometry {
  const rings = 6;
  const sectors = 32;
  const positions: number[] = [];
  const indices: number[] = [];
  const ct = Math.cos(tilt), st = Math.sin(tilt);
  for (let ring = 0; ring <= rings; ring++) {
    const radius = ring / rings;
    for (let i = 0; i <= sectors; i++) {
      const angle = (i / sectors) * Math.PI * 2;
      const px = width * radius * Math.cos(angle);
      const py = height * radius * Math.sin(angle);
      const x = px * ct - py * st;
      const y = px * st + py * ct;
      const curvature = Math.max(0.01, 1 - (x / frame.radiusX) ** 2 - (y / frame.radiusY) ** 2);
      const z = frame.radiusZ * Math.sqrt(curvature) + surfaceOffset;
      positions.push(x, y, z);
      if (ring < rings && i < sectors) {
        const a = ring * (sectors + 1) + i;
        const b = a + sectors + 1;
        indices.push(a, b, a + 1, a + 1, b, b + 1);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}

/**
 * Devolver componentes por separado conserva el contrato de ownership de la
 * preview (la liberación de geometrías/materiales la gestiona el visor).
 */
export function createVida38ReptileOcularDetails38P(
  _body: THREE.Mesh,
  m: Vida38ReptileMorphologyV1,
  a: Vida38ReptileLandmarks38J,
): THREE.Mesh[] {
  const plan = deriveVida38ReptileEyePlan38P(m);
  const result: THREE.Mesh[] = [];
  const globeMaterial = new THREE.MeshPhysicalMaterial({
    color: plan.globeHex, roughness: 0.56, metalness: 0, clearcoat: 0.22, clearcoatRoughness: 0.31,
  });
  const irisMaterial = new THREE.MeshPhysicalMaterial({
    color: plan.irisHex, side: THREE.DoubleSide, roughness: 0.26, metalness: 0, clearcoat: 0.35,
  });
  const pupilMaterial = new THREE.MeshBasicMaterial({
    color: '#050808', side: THREE.DoubleSide, depthTest: true,
  });
  for (const side of [-1, 1] as const) {
    const frame = deriveVida38ReptileOrbitalFrame38P2A(m, a, side);
    const orientation = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), frame.gaze);
    const push = (mesh: THREE.Mesh, kind: string): void => {
      mesh.name = `VIDA38_2P_REPTILE_${kind}_${side}`;
      mesh.position.copy(frame.center);
      mesh.quaternion.copy(orientation);
      mesh.userData['reconstructionHypothesis'] = true;
      mesh.userData['reptileEyeRevision38P'] = VIDA38_REPTILE_EYE_REVISION_38P;
      mesh.userData['reptileEyeSide38P'] = side;
      result.push(mesh);
    };

    // Radio casi igual a la cavidad (38.2j: .047/.052/.060*eyeSize),
    // evitando el hueco oscuro y sin sacar la esfera del contorno craneal.
    const globe = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 18), globeMaterial);
    globe.scale.set(frame.radiusX, frame.radiusY, frame.radiusZ);
    push(globe, 'GLOBE');

    // Parche de iris curvado a 1.5 mm (en unidades normalizadas) de la
    // superficie del globo; en 38.2p2 estaba detrás y desaparecía frontalmente.
    const iris = new THREE.Mesh(curvedOcularPatch38P2A(
      frame, frame.radiusX * 0.63, frame.radiusY * 0.63, 0.0014, side * plan.eyebrowAngle,
    ), irisMaterial);
    push(iris, 'IRIS');

    const pupil = new THREE.Mesh(curvedOcularPatch38P2A(
      frame, Math.min(frame.radiusX * 0.17, plan.slitWidth * 0.65), frame.radiusY * 0.43,
      0.0027, side * plan.eyebrowAngle,
    ), pupilMaterial);
    push(pupil, 'PUPIL');
  }
  return result;
}

/** Auditoría geométrica sin WebGL de visibilidad frontal y lateral. */
export function measureVida38ReptileEyeExposure38P2A(
  m: Vida38ReptileMorphologyV1,
  a: Vida38ReptileLandmarks38J,
  side: -1 | 1,
): { readonly frontClear: boolean; readonly sideClear: boolean; readonly cavityClear: boolean } {
  const frame = deriveVida38ReptileOrbitalFrame38P2A(m, a, side);
  const p = frame.center.clone().addScaledVector(frame.gaze, frame.radiusZ);
  const f = (point: THREE.Vector3): number => evaluateVida38ReptileField38J(m, point.x, point.y, point.z);
  const test = (direction: THREE.Vector3): boolean => {
    for (let i = 0; i <= 6; i++) {
      const q = p.clone().addScaledVector(direction, 0.012 * i);
      if (f(q) < -0.002) return false;
    }
    return true;
  };
  return { frontClear: test(new THREE.Vector3(0, 0, 1)), sideClear: test(new THREE.Vector3(side, 0, 0)), cavityClear: f(frame.center) > -0.004 };
}
