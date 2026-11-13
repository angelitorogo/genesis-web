/**
 * GENESIS 38.2o.e4 — ojo reptiliano volumétrico para linajes civilizados.
 * Usa la superficie SDF ya deformada de 38.2o para colocar globos ovoides
 * discretos y la misma solución de iris/pupila curvados de 38.2p2a.
 * No modifica el generador de especies ni el inventario físico de VIDA.
 */
import * as THREE from 'three';
import {
  deriveVida38HumanoidFaceLandmarks38GC,
  type Vida38HumanoidAnatomy,
} from './vida38-humanoid-organic-field-38-2e';

export const VIDA38_CIVIL_REPTILIAN_EYE_REVISION_38OE4 = 'VIDA.38.2o.e4/civil-reptilian-orbital-globe/v1' as const;
export interface Vida38CivilReptilianEyeTraits38OE4 {
  readonly eyeSizeScale: number;
  readonly eyeSpacingScale: number;
  readonly eyeHueHex: string;
}
export interface Vida38CivilReptilianOrbitalFrame38OE4 {
  readonly side: -1 | 1;
  readonly center: THREE.Vector3;
  readonly gaze: THREE.Vector3;
  readonly radiusX: number;
  readonly radiusY: number;
  readonly radiusZ: number;
  readonly skinPoint: THREE.Vector3;
}

/** Localiza primero la superficie real del rostro, evitando medir contra el hocico. */
export function deriveVida38CivilReptilianOrbitalFrame38OE4(
  body: THREE.Mesh,
  anatomy: Vida38HumanoidAnatomy,
  traits: Vida38CivilReptilianEyeTraits38OE4,
  side: -1 | 1,
): Vida38CivilReptilianOrbitalFrame38OE4 | null {
  const { eyeY } = deriveVida38HumanoidFaceLandmarks38GC(anatomy);
  const x = side * anatomy.eyeSpacing * traits.eyeSpacingScale;
  // El visor 38.2 normaliza subject (posición/escala) DESPUÉS de generar la
  // malla. Raycaster trabaja en WORLD, mientras que los landmarks anatómicos,
  // los ojos y sus accesorios necesitan permanecer en LOCAL de body.
  // Actualizar también los ancestros antes de convertir coordenadas.
  body.updateWorldMatrix(true, false);
  const direction = new THREE.Vector3(0, 0, -1).transformDirection(body.matrixWorld);
  const xFactors = [1, 0.92, 1.08];
  const yDeltas = [0, -0.03, 0.03, -0.06, 0.06];
  let skinPoint: THREE.Vector3 | null = null;
  let normal: THREE.Vector3 | null = null;
  search: for (const dy of yDeltas) {
    for (const xf of xFactors) {
      const originLocal = new THREE.Vector3(x * xf, eyeY + dy, 3);
      const originWorld = body.localToWorld(originLocal);
      const raycaster = new THREE.Raycaster(originWorld, direction, 0, 8);
      const hit = raycaster.intersectObject(body, false)[0];
      if (!hit) continue;
      const localHit = body.worldToLocal(hit.point.clone());
      // La búsqueda tolera diferencias faciales entre familias, pero no
      // acepta accidentalmente un impacto remoto en el tronco.
      if (Math.abs(localHit.y - eyeY) > Math.max(0.20, anatomy.headHeight * 0.54)) continue;
      skinPoint = localHit;
      normal = hit.face?.normal.clone().normalize() ?? new THREE.Vector3(0, 0, 1);
      break search;
    }
  }

  // Fallback determinista en vértices locales: los tests pueden consultar
  // con eyeSpacingScale=1 mientras el individuo usa otra variación genética.
  // No inventar un ojo desconectado: elegir una superficie REAL de la cabeza.
  if (!skinPoint) {
    const position = (body.geometry as THREE.BufferGeometry).getAttribute('position');
    if (!position || position.count === 0) return null;
    let bestScore = Number.POSITIVE_INFINITY;
    let bestIndex = -1;
    const yTolerance = Math.max(0.22, anatomy.headHeight * 0.65);
    for (let i = 0; i < position.count; i++) {
      const vx = position.getX(i), vy = position.getY(i), vz = position.getZ(i);
      if (Math.abs(vy - eyeY) > yTolerance || vx * side < 0 || vz < -0.07) continue;
      const score = Math.abs(vx - x) * 3.2 + Math.abs(vy - eyeY) * 2.2 - vz * 0.18;
      if (score < bestScore) { bestScore = score; bestIndex = i; }
    }
    if (bestIndex < 0) {
      // Segunda búsqueda limitada al hemisferio craneal superior cuando
      // el generador ha desplazado verticalmente los landmarks de referencia.
      const geometry = body.geometry as THREE.BufferGeometry;
      geometry.computeBoundingBox();
      const bounds = geometry.boundingBox;
      if (!bounds) return null;
      const topHeadMinimum = bounds.max.y - Math.max(anatomy.headHeight * 1.25, 0.35);
      for (let i = 0; i < position.count; i++) {
        const vx = position.getX(i), vy = position.getY(i), vz = position.getZ(i);
        if (vy < topHeadMinimum || vx * side < 0 || vz < -0.07) continue;
        const score = Math.abs(vx - x) * 3.2 + Math.abs(vy - eyeY) * 1.3 - vz * 0.18;
        if (score < bestScore) { bestScore = score; bestIndex = i; }
      }
    }
    if (bestIndex < 0) return null;
    skinPoint = new THREE.Vector3(position.getX(bestIndex), position.getY(bestIndex), position.getZ(bestIndex));
    const normals = (body.geometry as THREE.BufferGeometry).getAttribute('normal');
    normal = normals && normals.count > bestIndex
      ? new THREE.Vector3(normals.getX(bestIndex), normals.getY(bestIndex), normals.getZ(bestIndex)).normalize()
      : new THREE.Vector3(0, 0, 1);
  }
  if (!skinPoint || !normal) return null;
  const hitPoint = skinPoint;
  // Mantener lectura de frente; perfil con componente lateral moderada.
  const gaze = normal.clone().lerp(new THREE.Vector3(side * 0.26, 0, 0.965).normalize(), 0.76);
  gaze.z = Math.max(0.72, gaze.z);
  gaze.normalize();
  const r = anatomy.eyeRadius * traits.eyeSizeScale;
  const radiusX = r * 0.78;
  const radiusY = r * 0.68;
  const radiusZ = r * 0.67;
  // La córnea solo sobresale unos milímetros del reborde; el volumen de la
  // esfera rellena la cavidad por detrás, evitando ojos de muñeco saltones.
  const center = hitPoint.clone().addScaledVector(gaze, -radiusZ + 0.009);
  return { side, center, gaze, radiusX, radiusY, radiusZ, skinPoint: hitPoint.clone() };
}

/** Construye un disco curvo sobre un elipsoide, no una lámina plana que se oculte. */
function curvedOcularPatch38OE4(
  frame: Vida38CivilReptilianOrbitalFrame38OE4,
  width: number,
  height: number,
  offset: number,
): THREE.BufferGeometry {
  const sectors = 24;
  const rings = 5;
  const positions: number[] = [];
  const indices: number[] = [];
  for (let ring = 0; ring <= rings; ring++) {
    const t = ring / rings;
    for (let sector = 0; sector <= sectors; sector++) {
      const angle = sector / sectors * Math.PI * 2;
      const x = width * t * Math.cos(angle);
      const y = height * t * Math.sin(angle);
      const z = frame.radiusZ * Math.sqrt(Math.max(0.005,
        1 - (x / frame.radiusX) ** 2 - (y / frame.radiusY) ** 2,
      )) + offset;
      positions.push(x, y, z);
      if (ring < rings && sector < sectors) {
        const a = ring * (sectors + 1) + sector;
        const b = a + sectors + 1;
        indices.push(a, b, a + 1, a + 1, b, b + 1);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/** Los tres componentes se mantienen identificables para regresiones/depuración. */
export function createVida38CivilReptilianEyeMeshes38OE4(
  frame: Vida38CivilReptilianOrbitalFrame38OE4,
  eyeHueHex: string,
): THREE.Mesh[] {
  const eyeMaterial = new THREE.MeshPhysicalMaterial({
    color: '#a88376', roughness: 0.43, metalness: 0, clearcoat: 0.26, clearcoatRoughness: 0.3,
  });
  const irisMaterial = new THREE.MeshPhysicalMaterial({
    color: eyeHueHex, side: THREE.DoubleSide, roughness: 0.22, metalness: 0,
    clearcoat: 0.42,
  });
  const pupilMaterial = new THREE.MeshBasicMaterial({ color: '#05090b', side: THREE.DoubleSide });
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), frame.gaze);
  const make = (mesh: THREE.Mesh, kind: string): THREE.Mesh => {
    mesh.position.copy(frame.center);
    mesh.quaternion.copy(q);
    mesh.name = `VIDA38_2OE4_REPTILIAN_${kind}_${frame.side}`;
    mesh.userData['ocularRevision38OE4'] = VIDA38_CIVIL_REPTILIAN_EYE_REVISION_38OE4;
    mesh.userData['side38OE4'] = frame.side;
    mesh.userData['reconstructionHypothesis'] = true;
    return mesh;
  };
  const globe = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), eyeMaterial);
  globe.scale.set(frame.radiusX, frame.radiusY, frame.radiusZ);
  const iris = new THREE.Mesh(curvedOcularPatch38OE4(
    frame, frame.radiusX * 0.67, frame.radiusY * 0.70, 0.0012,
  ), irisMaterial);
  const pupil = new THREE.Mesh(curvedOcularPatch38OE4(
    frame, frame.radiusX * 0.125, frame.radiusY * 0.49, 0.0024,
  ), pupilMaterial);
  return [make(globe, 'GLOBE'), make(iris, 'IRIS'), make(pupil, 'PUPIL')];
}
