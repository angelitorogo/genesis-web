import type * as THREE from 'three';

/**
 * VISCIV.5c — Artificial orbit traces are guides, not orbital infrastructure.
 * Apply the global ORBITS layer separately from satellite/station meshes and
 * physical (constructed) megastructure rings.
 */
export function applySystemSceneArtificialOrbitGuideVisibilityV1(
  guides: readonly THREE.LineLoop[],
  layers: Readonly<{
    orbits?: boolean;
    planets: boolean;
    artificialSatellites: boolean;
  }>,
): void {
  const visible =
    (layers.orbits ?? true) &&
    layers.planets &&
    layers.artificialSatellites;

  for (const guide of guides) {
    guide.visible = visible;
  }
}
