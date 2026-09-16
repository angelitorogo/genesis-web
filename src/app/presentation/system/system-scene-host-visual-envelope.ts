export interface SystemSceneHostVisualStarInputV3 {
  readonly id:
    string;

  /** Existing point-24.5 exaggerated photosphere radius. */
  readonly baseRadiusScene:
    number;

  /** Maximum scene-space excursion from the HZ anchor over the orbit. */
  readonly maxCenterExcursionScene:
    number;

  /** False for a tertiary that does not belong to the circumbinary HZ host. */
  readonly participatesInHabitableZoneHost:
    boolean;
}

export interface SystemSceneHostVisualStarLayoutV3 {
  readonly id:
    string;

  /** Photosphere radius actually rendered after envelope limiting. */
  readonly radiusScene:
    number;

  /** Radius used by optical sprites so glow tracks star downsizing without collapsing. */
  readonly opticalRadiusScene:
    number;

  readonly maxCenterExcursionScene:
    number;

  readonly limited:
    boolean;
}

export interface SystemSceneHostVisualEnvelopeV3 {
  readonly version:
    3;

  readonly habitableZoneInnerRadiusScene:
    number | null;

  readonly maxAllowedEnvelopeRadiusScene:
    number | null;

  readonly nearestPlanetPeriapsisRadiusScene:
    number | null;

  readonly maxAllowedPlanetaryEnvelopeRadiusScene:
    number | null;

  readonly hostVisualEnvelopeRadiusScene:
    number;

  readonly limited:
    boolean;

  readonly stars:
    readonly SystemSceneHostVisualStarLayoutV3[];
}

const MIN_RENDERED_STAR_RADIUS_SCENE =
  0.075;

const MAX_STAR_TO_HZ_INNER_RATIO =
  0.30;

const MAX_HOST_ENVELOPE_TO_HZ_INNER_RATIO =
  0.72;

const MIN_HZ_CLEARANCE_SCENE =
  0.16;

const MAX_STAR_TO_INNER_PLANET_RATIO =
  0.22;

const MAX_HOST_ENVELOPE_TO_INNER_PLANET_RATIO =
  0.48;

const MIN_PLANET_CLEARANCE_SCENE =
  0.14;

const MIN_OPTICAL_TO_PHOTOSPHERE_RATIO =
  1.08;

const MAX_OPTICAL_TO_PHOTOSPHERE_RATIO =
  1.42;

const MIN_OPTICAL_RETENTION_FACTOR =
  0.62;

const MAX_OPTICAL_TO_HZ_INNER_RATIO =
  0.42;

const MAX_OPTICAL_TO_INNER_PLANET_RATIO =
  0.36;

/**
 * Phase-26 renderer-only host envelope limiter.
 *
 * The HZ owns its scientifically projected radius. If an exaggerated stellar
 * photosphere would consume too much of that radius, only the photosphere is
 * reduced. The optical radius is reduced more gently than the photosphere so
 * corona/bloom/glare remain visually present without preserving the oversized
 * pre-limit halo.
 */
export function buildSystemSceneHostVisualEnvelopeV3(
  stars:
    readonly SystemSceneHostVisualStarInputV3[],

  habitableZoneInnerRadiusScene:
    number | null,

  nearestPlanetPeriapsisRadiusScene:
    number | null = null,
): SystemSceneHostVisualEnvelopeV3 {

  const safeStars =
    stars.map(
      star =>
        Object.freeze({
          ...star,
          baseRadiusScene:
            positiveFiniteOr(
              star.baseRadiusScene,
              MIN_RENDERED_STAR_RADIUS_SCENE,
            ),
          maxCenterExcursionScene:
            nonNegativeFiniteOr(
              star.maxCenterExcursionScene,
              0,
            ),
        }),
    );

  const hasHzConstraint =
    habitableZoneInnerRadiusScene !==
      null &&
    Number.isFinite(
      habitableZoneInnerRadiusScene,
    ) &&
    habitableZoneInnerRadiusScene >
      0;

  const hasPlanetConstraint =
    nearestPlanetPeriapsisRadiusScene !==
      null &&
    Number.isFinite(
      nearestPlanetPeriapsisRadiusScene,
    ) &&
    nearestPlanetPeriapsisRadiusScene >
      0;

  if (
    !hasHzConstraint &&
    !hasPlanetConstraint
  ) {
    const layouts =
      Object.freeze(
        safeStars.map(
          star =>
            Object.freeze({
              id:
                star.id,
              radiusScene:
                star.baseRadiusScene,
              opticalRadiusScene:
                star.baseRadiusScene,
              maxCenterExcursionScene:
                star.maxCenterExcursionScene,
              limited:
                false,
            }),
        ),
      );

    return Object.freeze({
      version:
        3 as const,
      habitableZoneInnerRadiusScene:
        null,
      maxAllowedEnvelopeRadiusScene:
        null,
      nearestPlanetPeriapsisRadiusScene:
        null,
      maxAllowedPlanetaryEnvelopeRadiusScene:
        null,
      hostVisualEnvelopeRadiusScene:
        envelopeRadius(
          layouts,
          safeStars,
        ),
      limited:
        false,
      stars:
        layouts,
    });
  }

  const hzInner =
    hasHzConstraint
      ? habitableZoneInnerRadiusScene!
      : null;

  const planetPeriapsis =
    hasPlanetConstraint
      ? nearestPlanetPeriapsisRadiusScene!
      : null;

  const hzEnvelopeLimit =
    hzInner === null
      ? Number.POSITIVE_INFINITY
      : Math.max(
          MIN_RENDERED_STAR_RADIUS_SCENE,
          Math.min(
            hzInner *
              MAX_HOST_ENVELOPE_TO_HZ_INNER_RATIO,
            hzInner -
              Math.min(
                MIN_HZ_CLEARANCE_SCENE,
                hzInner *
                  0.22,
              ),
          ),
        );

  const maxAllowedPlanetaryEnvelopeRadiusScene =
    planetPeriapsis === null
      ? null
      : Math.max(
          MIN_RENDERED_STAR_RADIUS_SCENE,
          Math.min(
            planetPeriapsis *
              MAX_HOST_ENVELOPE_TO_INNER_PLANET_RATIO,
            planetPeriapsis -
              Math.min(
                MIN_PLANET_CLEARANCE_SCENE,
                planetPeriapsis *
                  0.18,
              ),
          ),
        );

  const maxAllowedEnvelopeRadiusScene =
    Math.min(
      hzEnvelopeLimit,
      maxAllowedPlanetaryEnvelopeRadiusScene ??
        Number.POSITIVE_INFINITY,
    );

  const hzPhotosphereLimit =
    hzInner === null
      ? Number.POSITIVE_INFINITY
      : hzInner *
        MAX_STAR_TO_HZ_INNER_RATIO;

  const planetPhotosphereLimit =
    planetPeriapsis === null
      ? Number.POSITIVE_INFINITY
      : planetPeriapsis *
        MAX_STAR_TO_INNER_PLANET_RATIO;

  const maxPhotosphereRadiusScene =
    Math.max(
      MIN_RENDERED_STAR_RADIUS_SCENE,
      Math.min(
        hzPhotosphereLimit,
        planetPhotosphereLimit,
      ),
    );

  const layouts =
    Object.freeze(
      safeStars.map(
        star => {
          if (
            !star.participatesInHabitableZoneHost
          ) {
            return Object.freeze({
              id:
                star.id,
              radiusScene:
                star.baseRadiusScene,
              opticalRadiusScene:
                star.baseRadiusScene,
              maxCenterExcursionScene:
                star.maxCenterExcursionScene,
              limited:
                false,
            });
          }

          const excursionAllowance =
            Math.max(
              MIN_RENDERED_STAR_RADIUS_SCENE,
              maxAllowedEnvelopeRadiusScene -
                star.maxCenterExcursionScene,
            );

          const radiusScene =
            Math.max(
              MIN_RENDERED_STAR_RADIUS_SCENE,
              Math.min(
                star.baseRadiusScene,
                maxPhotosphereRadiusScene,
                excursionAllowance,
              ),
            );

          const opticalRadiusScene =
            deriveOpticalRadiusScene(
              star.baseRadiusScene,
              radiusScene,
              hzInner,
              planetPeriapsis,
            );

          return Object.freeze({
            id:
              star.id,
            radiusScene,
            opticalRadiusScene,
            maxCenterExcursionScene:
              star.maxCenterExcursionScene,
            limited:
              radiusScene <
              star.baseRadiusScene -
                1e-9,
          });
        }),
    );

  return Object.freeze({
    version:
      3 as const,
    habitableZoneInnerRadiusScene:
      hzInner,
    maxAllowedEnvelopeRadiusScene:
      Number.isFinite(maxAllowedEnvelopeRadiusScene)
        ? maxAllowedEnvelopeRadiusScene
        : null,
    nearestPlanetPeriapsisRadiusScene:
      planetPeriapsis,
    maxAllowedPlanetaryEnvelopeRadiusScene,
    hostVisualEnvelopeRadiusScene:
      envelopeRadius(
        layouts,
        safeStars,
      ),
    limited:
      layouts.some(
        star =>
          star.limited,
      ),
    stars:
      layouts,
  });
}

function envelopeRadius(
  layouts:
    readonly SystemSceneHostVisualStarLayoutV3[],

  inputs:
    readonly SystemSceneHostVisualStarInputV3[],
): number {

  const participating =
    layouts
      .map(
        layout => ({
          layout,
          input:
            inputs.find(
              candidate =>
                candidate.id ===
                layout.id,
            ),
        }),
      )
      .filter(
        entry =>
          entry.input
            ?.participatesInHabitableZoneHost ===
          true,
      );

  if (
    participating.length ===
      0
  ) {
    return 0;
  }

  return Math.max(
    ...participating.map(
      entry =>
        entry.layout.maxCenterExcursionScene +
        entry.layout.radiusScene,
    ),
  );
}


function deriveOpticalRadiusScene(
  baseRadiusScene:
    number,

  radiusScene:
    number,

  habitableZoneInnerRadiusScene:
    number | null,

  nearestPlanetPeriapsisRadiusScene:
    number | null,
): number {

  const safeBaseRadius =
    positiveFiniteOr(
      baseRadiusScene,
      radiusScene,
    );

  const shrinkRatio =
    Math.min(
      1,
      Math.max(
        0,
        radiusScene /
          Math.max(
            safeBaseRadius,
            MIN_RENDERED_STAR_RADIUS_SCENE,
          ),
      ),
    );

  const retainedBaseRadius =
    safeBaseRadius *
    (
      MIN_OPTICAL_RETENTION_FACTOR +
      (1 - MIN_OPTICAL_RETENTION_FACTOR) *
        shrinkRatio
    );

  const hzLimit =
    habitableZoneInnerRadiusScene === null
      ? Number.POSITIVE_INFINITY
      : habitableZoneInnerRadiusScene *
        MAX_OPTICAL_TO_HZ_INNER_RATIO;

  const planetLimit =
    nearestPlanetPeriapsisRadiusScene === null
      ? Number.POSITIVE_INFINITY
      : nearestPlanetPeriapsisRadiusScene *
        MAX_OPTICAL_TO_INNER_PLANET_RATIO;

  const boostedPhotosphereRadius =
    radiusScene *
    Math.min(
      MAX_OPTICAL_TO_PHOTOSPHERE_RATIO,
      Math.max(
        MIN_OPTICAL_TO_PHOTOSPHERE_RATIO,
        1 +
          (1 - shrinkRatio) *
            0.18,
      ),
    );

  return Math.max(
    radiusScene,
    Math.min(
      safeBaseRadius,
      retainedBaseRadius,
      hzLimit,
      planetLimit,
      boostedPhotosphereRadius,
    ),
  );
}

function positiveFiniteOr(
  value:
    number,

  fallback:
    number,
): number {

  return Number.isFinite(
    value,
  ) &&
  value >
    0
    ? value
    : fallback;
}

function nonNegativeFiniteOr(
  value:
    number,

  fallback:
    number,
): number {

  return Number.isFinite(
    value,
  ) &&
  value >=
    0
    ? value
    : fallback;
}
