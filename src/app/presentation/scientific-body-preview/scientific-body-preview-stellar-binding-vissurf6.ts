import * as THREE from 'three';
import type { SystemScenePlanetLightBindingV1 } from '../system/system-scene-atmosphere-material';
import type { ScientificPlanetStarLightSourceV1 } from '../scientific/scientific-body-preview';

/**
 * Feed the day/night, twilight and home-star uniforms from the same stellar
 * sources used to create the Three.js DirectionalLights in a scientific fiche.
 * The binding is a mutable render resource: no vectors are allocated per frame.
 */
export function updatePreviewStellarLightBindingVISSURF6(
  binding: SystemScenePlanetLightBindingV1,
  sources: readonly ScientificPlanetStarLightSourceV1[],
  cameraMatrixWorldInverse: THREE.Matrix4,
): void {
  const homeDirections = binding.orbitalHomeDirectionsView;
  const homeFlags = binding.orbitalHomeFlagsView;
  homeFlags?.set(0, 0);
  let homeIndex = 0;
  let w0 = 0;
  let w1 = 0;
  let w2 = 0;
  for (let i = 0; i < 3; i += 1) {
    const source = sources[i];
    const direction = binding.lightDirectionsView[i]!;
    if (source) {
      direction.set(source.x, source.y, source.z)
        .transformDirection(cameraMatrixWorldInverse);
      const weight = Number.isFinite(source.weight01)
        ? Math.max(0, source.weight01)
        : 0;
      if (i === 0) w0 = weight;
      if (i === 1) w1 = weight;
      if (i === 2) w2 = weight;
      if (source.isOrbitalHost && homeDirections && homeFlags && homeIndex < 2) {
        homeDirections[homeIndex]!.copy(direction);
        if (homeIndex === 0) homeFlags.x = 1;
        else homeFlags.y = 1;
        homeIndex += 1;
      }
    } else {
      direction.set(1, 0, 0);
    }
  }
  if (sources.length === 0) {
    // Legacy serialized previews: align the fallback key light and terminator.
    binding.lightDirectionsView[0].set(4.5, 3, 5)
      .transformDirection(cameraMatrixWorldInverse);
    binding.lightWeightsView.set(1, 0, 0);
  } else {
    binding.lightWeightsView.set(w0, w1, w2);
  }
}
