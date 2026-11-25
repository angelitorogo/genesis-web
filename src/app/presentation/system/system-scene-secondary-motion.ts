/**
 * Visual moon cadence shared by scientific fiches and SystemScene.
 * The slowest satellite displayed around a planet completes one orbit every
 * 90 real seconds; inner moons keep their physical relative angular speeds.
 * Scientific orbital elements, epochs and periods are never rewritten.
 */
export const SCIENTIFIC_MOON_OUTERMOST_CYCLE_REAL_SECONDS_V1 = 90;

export function scientificMoonGroupDaysPerRealSecondV1(
  visibleOrbitalPeriodsDays: readonly number[],
): number {
  if (visibleOrbitalPeriodsDays.length === 0) {
    throw new RangeError('Moon group cadence requires at least one visible moon.');
  }
  let outerPeriodDays = 0;
  for (const periodDays of visibleOrbitalPeriodsDays) {
    assertPositiveFinite(periodDays, 'moon orbital periodDays');
    outerPeriodDays = Math.max(outerPeriodDays, periodDays);
  }
  return outerPeriodDays / SCIENTIFIC_MOON_OUTERMOST_CYCLE_REAL_SECONDS_V1;
}

/** Multiplier applied ONLY to the local lunar motion contribution.
 * The host planet and star continue to use the existing SystemScene clock.
 */
export function systemSceneMoonGroupPresentationTimeScaleV1(
  visibleOrbitalPeriodsDays: readonly number[],
  playbackDaysPerRealSecond: number,
): number {
  assertPositiveFinite(playbackDaysPerRealSecond, 'playbackDaysPerRealSecond');
  return scientificMoonGroupDaysPerRealSecondV1(visibleOrbitalPeriodsDays) /
    playbackDaysPerRealSecond;
}

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
