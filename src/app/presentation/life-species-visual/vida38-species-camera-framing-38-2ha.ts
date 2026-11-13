import * as THREE from 'three';

/**
 * GENESIS 38.2h.a — encuadre de la reconstrucción biológica, no del decorado.
 *
 * El cuerpo se normaliza según su dimensión mayor en 38.2, por lo que un
 * cuadrúpedo bajo puede quedar centrado muy por debajo del origen de la escena.
 * Una altura de cámara fija recorta y desplaza visualmente estas especies.
 *
 * Esta función trabaja con el bounding box MUNDIAL de model.subject, sin el
 * pedestal/rocas/agua de model.root. Conserva íntegra la geometría y VIDA.
 */
export interface Vida38SpeciesCameraFramingV1 {
  readonly focus: THREE.Vector3;
  readonly distance: number;
  readonly minDistance: number;
  readonly maxDistance: number;
  readonly projectedRadius: number;
}

export interface Vida38SpeciesCameraFramingInputV1 {
  readonly bounds: THREE.Box3;
  readonly verticalFovDegrees: number;
  readonly aspect: number;
  readonly yaw: number;
  readonly pitch: number;
}

const DEFAULT_BOUNDS = new THREE.Box3(
  new THREE.Vector3(-0.5, -0.66, -0.5),
  new THREE.Vector3(0.5, 1.29, 0.5),
);

/**
 * Distancia conservadora para cualquier orientación de rotación Y del animal.
 * A diferencia de encuadrar un único fotograma, evita que un animal alargado
 * quede cortado cuando gira; los controles de órbita no alteran este encuadre.
 */
export function computeVida38SpeciesCameraFramingV1(
  input: Vida38SpeciesCameraFramingInputV1,
): Vida38SpeciesCameraFramingV1 {
  const b = input.bounds;
  const valid = !b.isEmpty() && [
    b.min.x, b.min.y, b.min.z, b.max.x, b.max.y, b.max.z,
  ].every(Number.isFinite);
  const bounds = valid ? b : DEFAULT_BOUNDS;
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());

  // Un pequeño sesgo inferior en el objetivo coloca el cuerpo algo MÁS ALTO
  // en la pantalla, no más bajo. No confundir altura de cámara con target.
  const focus = new THREE.Vector3(center.x, center.y - size.y * 0.045, center.z);
  const verticalExtent = Math.max(
    Math.abs(bounds.min.y - focus.y),
    Math.abs(bounds.max.y - focus.y),
  );
  const radialExtent = Math.hypot(size.x * 0.5, size.z * 0.5);
  const pitch = Number.isFinite(input.pitch) ? THREE.MathUtils.clamp(input.pitch, -1.3, 1.3) : 0.18;
  const sinPitch = Math.abs(Math.sin(pitch));
  const cosPitch = Math.abs(Math.cos(pitch));

  // Se reserva un 18 % de margen en pantalla: íntegro incluso al girar.
  const fill = 0.82;
  const vFov = THREE.MathUtils.degToRad(
    THREE.MathUtils.clamp(Number.isFinite(input.verticalFovDegrees) ? input.verticalFovDegrees : 34, 15, 85),
  );
  const aspect = Math.max(0.35, Number.isFinite(input.aspect) ? input.aspect : 1);
  const verticalTangent = Math.tan(vFov / 2);
  const horizontalTangent = verticalTangent * aspect;
  const projectedVertical = verticalExtent * cosPitch + radialExtent * sinPitch;
  const projectedHorizontal = radialExtent;
  // Distancia entre el plano focal y el punto más próximo al observador.
  const foregroundDepth = verticalExtent * sinPitch + radialExtent * cosPitch;
  const distanceForHeight = projectedVertical / (verticalTangent * fill);
  const distanceForWidth = projectedHorizontal / (horizontalTangent * fill);
  const distance = Math.max(
    1.0,
    foregroundDepth + Math.max(distanceForHeight, distanceForWidth),
  );
  const minDistance = Math.max(0.5, foregroundDepth + 0.12);
  const maxDistance = Math.max(distance * 3.4, distance + 3.5);

  return Object.freeze({
    focus,
    distance,
    minDistance,
    maxDistance,
    projectedRadius: Math.max(projectedVertical, projectedHorizontal),
  });
}
