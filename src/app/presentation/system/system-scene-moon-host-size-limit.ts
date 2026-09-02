import {
  type SystemSceneMoonPresentationV1,
} from './system-scene-moon-presentation';

export const SYSTEM_SCENE_MOON_MAX_HOST_RADIUS_RATIO_V1 =
  0.40;

/**
 * Point-25.11 presentation-only host-relative moon size guard.
 *
 * Phase 21 remains authoritative for physical moon radius. This helper only
 * constrains the scene projection so a moon never visually dominates the
 * planet it orbits. The returned presentation remains immutable and preserves
 * every scientific source value unchanged.
 */
export function limitSystemSceneMoonPresentationToHostV1(
  presentation:
    SystemSceneMoonPresentationV1,

  hostPlanetRadiusScene:
    number,
): SystemSceneMoonPresentationV1 {

  if (
    !Number.isFinite(
      hostPlanetRadiusScene,
    ) ||
    hostPlanetRadiusScene <=
      0
  ) {
    throw new RangeError(
      `hostPlanetRadiusScene must be finite and > 0: ${hostPlanetRadiusScene}.`,
    );
  }

  const maximumMoonRadiusScene =
    hostPlanetRadiusScene *
    SYSTEM_SCENE_MOON_MAX_HOST_RADIUS_RATIO_V1;

  if (
    presentation.presentationRadiusScene <=
      maximumMoonRadiusScene
  ) {
    return presentation;
  }

  return Object.freeze({
    ...presentation,
    presentationRadiusScene:
      maximumMoonRadiusScene,
  });
}
