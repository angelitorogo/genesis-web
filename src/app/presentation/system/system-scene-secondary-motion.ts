const TARGET_MINIMUM_MOON_ORBIT_REAL_SECONDS =
  8;

const TARGET_MINIMUM_MINOR_BODY_ORBIT_REAL_SECONDS =
  12;

const MINIMUM_MOON_PRESENTATION_TIME_SCALE =
  0.001;

const MINIMUM_MINOR_BODY_PRESENTATION_TIME_SCALE =
  0.002;

/**
 * Point-24.6 presentation-only cadence limiter for moon motion.
 *
 * Moon periods remain the phase-21 Ground Truth values. The returned factor
 * only slows the moon contribution inside the accelerated SystemScene clock,
 * so very short satellite periods remain visually inspectable while the
 * already-validated stellar/planetary playback cadence stays unchanged.
 */
export function systemSceneMoonPresentationTimeScale(
  orbitalPeriodDays:
    number,

  playbackDaysPerRealSecond:
    number,
): number {

  assertPositiveFinite(
    orbitalPeriodDays,
    'orbitalPeriodDays',
  );

  assertPositiveFinite(
    playbackDaysPerRealSecond,
    'playbackDaysPerRealSecond',
  );

  const unscaledRealOrbitSeconds =
    orbitalPeriodDays /
    playbackDaysPerRealSecond;

  if (
    unscaledRealOrbitSeconds >=
      TARGET_MINIMUM_MOON_ORBIT_REAL_SECONDS
  ) {
    return 1;
  }

  return clamp(
    unscaledRealOrbitSeconds /
      TARGET_MINIMUM_MOON_ORBIT_REAL_SECONDS,
    MINIMUM_MOON_PRESENTATION_TIME_SCALE,
    1,
  );
}

/**
 * Point-24.6 presentation-only cadence limiter for minor-body motion.
 *
 * Very short-period inner asteroids/comets keep their phase-22 physical
 * orbital periods, but their displayed contribution is slowed down so the
 * orbit remains readable in the accelerated SystemScene clock.
 */
export function systemSceneMinorBodyPresentationTimeScale(
  orbitalPeriodDays:
    number,

  playbackDaysPerRealSecond:
    number,
): number {

  assertPositiveFinite(
    orbitalPeriodDays,
    'orbitalPeriodDays',
  );

  assertPositiveFinite(
    playbackDaysPerRealSecond,
    'playbackDaysPerRealSecond',
  );

  const unscaledRealOrbitSeconds =
    orbitalPeriodDays /
    playbackDaysPerRealSecond;

  if (
    unscaledRealOrbitSeconds >=
      TARGET_MINIMUM_MINOR_BODY_ORBIT_REAL_SECONDS
  ) {
    return 1;
  }

  return clamp(
    unscaledRealOrbitSeconds /
      TARGET_MINIMUM_MINOR_BODY_ORBIT_REAL_SECONDS,
    MINIMUM_MINOR_BODY_PRESENTATION_TIME_SCALE,
    1,
  );
}

function assertPositiveFinite(
  value:
    number,

  label:
    string,
): void {

  if (
    !Number.isFinite(
      value,
    ) ||
    value <=
      0
  ) {
    throw new RangeError(
      `${label} must be finite and greater than zero: ${value}.`,
    );
  }
}

function clamp(
  value:
    number,

  minimum:
    number,

  maximum:
    number,
): number {

  return Math.min(
    maximum,
    Math.max(
      minimum,
      value,
    ),
  );
}
