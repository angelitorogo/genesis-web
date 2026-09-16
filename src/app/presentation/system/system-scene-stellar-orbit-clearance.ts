export interface SystemSceneStellarOrbitClearanceStarInputV5 {
  readonly id: string;
  readonly label: string;
  readonly baseRadiusScene: number;
  readonly baseOpticalRadiusScene: number;
  readonly maxCenterExcursionScene: number;
  readonly participatesInPlanetaryHostClearance: boolean;
}

export interface SystemSceneStellarOrbitClearanceStarLayoutV5 {
  readonly id: string;
  readonly label: string;
  readonly radiusScene: number;
  readonly opticalRadiusScene: number;
  readonly maxCenterExcursionScene: number;
  readonly limited: boolean;
}

export interface SystemSceneStellarOrbitClearanceV5 {
  readonly version: 5;
  readonly nearestPlanetPeriapsisRadiusScene: number | null;
  readonly requestedMinimumClearanceScene: number | null;
  readonly maximumOpticalEnvelopeRadiusScene: number | null;
  readonly hostPhotosphereEnvelopeRadiusScene: number;
  readonly hostOpticalEnvelopeRadiusScene: number;
  readonly actualOpticalClearanceScene: number | null;
  readonly clearanceSatisfied: boolean;
  readonly clearanceMode:
    'ENFORCED' |
    'BEST_EFFORT_GEOMETRIC_OVERLAP';
  readonly geometricOverlapDetected: boolean;
  readonly limited: boolean;
  readonly stars: readonly SystemSceneStellarOrbitClearanceStarLayoutV5[];
}

const MIN_RENDERED_STAR_RADIUS_SCENE = 0.018;
const MIN_OPTICAL_CLEARANCE_SCENE = 0.055;
const MAX_OPTICAL_CLEARANCE_SCENE = 0.20;
const OPTICAL_CLEARANCE_TO_PERIAPSIS_RATIO = 0.12;
const MAX_PHOTOSPHERE_TO_AVAILABLE_OPTICAL_RATIO = 0.58;
const MAX_PHOTOSPHERE_TO_PERIAPSIS_RATIO = 0.14;
const TARGET_OPTICAL_TO_PHOTOSPHERE_RATIO = 1.24;
const BEST_EFFORT_OPTICAL_TO_PHOTOSPHERE_RATIO = 1.10;
const VALUE_TOLERANCE = 1e-9;

/**
 * Renderer-only V5 stellar/orbit clearance.
 *
 * This is deliberately presentation-only: it never changes AU values, orbital
 * elements, stability limits or the simulation. It only shrinks rendered
 * stellar photospheres and their optical halo so the nearest visible planetary
 * periapsis cannot be visually swallowed by the host when the projected host
 * centre envelope leaves geometric room. Legacy/persisted multi-star scenes
 * whose stellar-centre envelope already overlaps the nearest projected
 * periapsis fall back to the smallest useful photosphere/halo instead of
 * crashing the scene; V5 never moves scientific orbits to fake clearance.
 */
export function buildSystemSceneStellarOrbitClearanceV5(
  stars: readonly SystemSceneStellarOrbitClearanceStarInputV5[],
  nearestPlanetPeriapsisRadiusScene: number | null,
  readabilityTargetRadiusScene: number | null = null,
  firstPlanetBodyRadiusScene: number = 0,
): SystemSceneStellarOrbitClearanceV5 {

  const safeStars = stars.map(star => Object.freeze({
    ...star,
    baseRadiusScene: positiveFiniteOr(
      star.baseRadiusScene,
      MIN_RENDERED_STAR_RADIUS_SCENE,
    ),
    baseOpticalRadiusScene: positiveFiniteOr(
      star.baseOpticalRadiusScene,
      positiveFiniteOr(
        star.baseRadiusScene,
        MIN_RENDERED_STAR_RADIUS_SCENE,
      ),
    ),
    maxCenterExcursionScene: nonNegativeFiniteOr(
      star.maxCenterExcursionScene,
      0,
    ),
  }));

  const hasPlanetConstraint =
    nearestPlanetPeriapsisRadiusScene !== null &&
    Number.isFinite(nearestPlanetPeriapsisRadiusScene) &&
    nearestPlanetPeriapsisRadiusScene > 0;

  if (!hasPlanetConstraint) {
    const layouts = Object.freeze(
      safeStars.map(star => Object.freeze({
        id: star.id,
        label: star.label,
        radiusScene: star.baseRadiusScene,
        opticalRadiusScene: Math.max(
          star.baseRadiusScene,
          star.baseOpticalRadiusScene,
        ),
        maxCenterExcursionScene: star.maxCenterExcursionScene,
        limited: false,
      })),
    );

    return Object.freeze({
      version: 5 as const,
      nearestPlanetPeriapsisRadiusScene: null,
      requestedMinimumClearanceScene: null,
      maximumOpticalEnvelopeRadiusScene: null,
      hostPhotosphereEnvelopeRadiusScene: hostEnvelopeRadius(
        layouts,
        safeStars,
        'radiusScene',
      ),
      hostOpticalEnvelopeRadiusScene: hostEnvelopeRadius(
        layouts,
        safeStars,
        'opticalRadiusScene',
      ),
      actualOpticalClearanceScene: null,
      clearanceSatisfied: true,
      clearanceMode: 'ENFORCED' as const,
      geometricOverlapDetected: false,
      limited: false,
      stars: layouts,
    });
  }

  const periapsis = nearestPlanetPeriapsisRadiusScene!;

  const adaptiveMinimumClearanceScene =
    Math.min(
      MIN_OPTICAL_CLEARANCE_SCENE,
      periapsis * 0.18,
    );

  const legacyRequestedMinimumClearanceScene =
    Math.min(
      MAX_OPTICAL_CLEARANCE_SCENE,
      periapsis * 0.24,
      Math.max(
        adaptiveMinimumClearanceScene,
        periapsis * OPTICAL_CLEARANCE_TO_PERIAPSIS_RATIO,
      ),
    );

  const requestedMinimumClearanceScene =
    readabilityTargetRadiusScene === null
      ? legacyRequestedMinimumClearanceScene
      : 0.14 + Math.max(
          0,
          Number.isFinite(firstPlanetBodyRadiusScene)
            ? firstPlanetBodyRadiusScene
            : 0,
        );

  const maximumOpticalEnvelopeRadiusScene =
    Math.max(
      MIN_RENDERED_STAR_RADIUS_SCENE,
      periapsis - requestedMinimumClearanceScene,
    );

  let geometricOverlapDetected =
    false;

  const layouts = Object.freeze(
    safeStars.map(star => {
      if (!star.participatesInPlanetaryHostClearance) {
        return Object.freeze({
          id: star.id,
          label: star.label,
          radiusScene: star.baseRadiusScene,
          opticalRadiusScene: Math.max(
            star.baseRadiusScene,
            star.baseOpticalRadiusScene,
          ),
          maxCenterExcursionScene: star.maxCenterExcursionScene,
          limited: false,
        });
      }

      const availableOpticalRadiusScene =
        maximumOpticalEnvelopeRadiusScene -
        star.maxCenterExcursionScene;

      if (
        !Number.isFinite(availableOpticalRadiusScene) ||
        availableOpticalRadiusScene <= 0
      ) {
        geometricOverlapDetected =
          true;

        const radiusScene =
          Math.min(
            star.baseRadiusScene,
            MIN_RENDERED_STAR_RADIUS_SCENE,
          );

        const opticalRadiusScene =
          Math.max(
            radiusScene,
            Math.min(
              star.baseOpticalRadiusScene,
              radiusScene *
                BEST_EFFORT_OPTICAL_TO_PHOTOSPHERE_RATIO,
            ),
          );

        return Object.freeze({
          id: star.id,
          label: star.label,
          radiusScene,
          opticalRadiusScene,
          maxCenterExcursionScene: star.maxCenterExcursionScene,
          limited: true,
        });
      }

      const maxPhotosphereRadiusScene =
        Math.max(
          MIN_RENDERED_STAR_RADIUS_SCENE,
          Math.min(
            availableOpticalRadiusScene *
              MAX_PHOTOSPHERE_TO_AVAILABLE_OPTICAL_RATIO,
            periapsis *
              (readabilityTargetRadiusScene === null
                ? MAX_PHOTOSPHERE_TO_PERIAPSIS_RATIO
                : 0.28),
          ),
        );

      const radiusScene =
        Math.max(
          MIN_RENDERED_STAR_RADIUS_SCENE,
          Math.min(
            star.baseRadiusScene,
            maxPhotosphereRadiusScene,
          ),
        );

      const opticalRadiusScene =
        Math.max(
          radiusScene,
          Math.min(
            star.baseOpticalRadiusScene,
            availableOpticalRadiusScene,
            radiusScene *
              TARGET_OPTICAL_TO_PHOTOSPHERE_RATIO,
          ),
        );

      return Object.freeze({
        id: star.id,
        label: star.label,
        radiusScene,
        opticalRadiusScene,
        maxCenterExcursionScene: star.maxCenterExcursionScene,
        limited:
          radiusScene <
            star.baseRadiusScene -
              VALUE_TOLERANCE ||
          opticalRadiusScene <
            star.baseOpticalRadiusScene -
              VALUE_TOLERANCE,
      });
    }),
  );

  const hostPhotosphereEnvelopeRadiusScene =
    hostEnvelopeRadius(
      layouts,
      safeStars,
      'radiusScene',
    );

  const hostOpticalEnvelopeRadiusScene =
    hostEnvelopeRadius(
      layouts,
      safeStars,
      'opticalRadiusScene',
    );

  const actualOpticalClearanceScene =
    periapsis -
    hostOpticalEnvelopeRadiusScene;

  const clearanceSatisfied =
    actualOpticalClearanceScene +
      VALUE_TOLERANCE >=
    requestedMinimumClearanceScene;

  if (!clearanceSatisfied) {
    geometricOverlapDetected =
      true;
  }

  const clearanceMode =
    clearanceSatisfied
      ? 'ENFORCED' as const
      : 'BEST_EFFORT_GEOMETRIC_OVERLAP' as const;

  return Object.freeze({
    version: 5 as const,
    nearestPlanetPeriapsisRadiusScene: periapsis,
    requestedMinimumClearanceScene,
    maximumOpticalEnvelopeRadiusScene,
    hostPhotosphereEnvelopeRadiusScene,
    hostOpticalEnvelopeRadiusScene,
    actualOpticalClearanceScene,
    clearanceSatisfied,
    clearanceMode,
    geometricOverlapDetected,
    limited: layouts.some(star => star.limited),
    stars: layouts,
  });
}

function hostEnvelopeRadius(
  layouts: readonly SystemSceneStellarOrbitClearanceStarLayoutV5[],
  inputs: readonly SystemSceneStellarOrbitClearanceStarInputV5[],
  radiusKey: 'radiusScene' | 'opticalRadiusScene',
): number {

  const participating = layouts
    .map(layout => ({
      layout,
      input: inputs.find(candidate => candidate.id === layout.id),
    }))
    .filter(entry =>
      entry.input?.participatesInPlanetaryHostClearance === true
    );

  if (participating.length === 0) {
    return 0;
  }

  return Math.max(
    ...participating.map(entry =>
      entry.layout.maxCenterExcursionScene +
      entry.layout[radiusKey],
    ),
  );
}

function positiveFiniteOr(value: number, fallback: number): number {
  return Number.isFinite(value) && value > 0
    ? value
    : fallback;
}

function nonNegativeFiniteOr(value: number, fallback: number): number {
  return Number.isFinite(value) && value >= 0
    ? value
    : fallback;
}
