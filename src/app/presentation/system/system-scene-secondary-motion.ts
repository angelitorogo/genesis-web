/**
 * GENESIS MOONCAD.3 — inspectable lunar motion (presentation only).
 *
 * The former 12–30 s cadence controlled angular velocity but NOT travel
 * speed: an outer moon covers a much longer arc in those 30 seconds.
 *
 * The new contract uses each host's PHYSICAL orbital semi-major axis as a
 * stable, common ratio across SystemScene and the scientific body preview.
 * An inner circular moon takes >=30 s; the farthest distinct moon takes
 * >=120 s; a single moon takes >=60 s. Intermediate ranks interpolate.
 * More importantly, T >= 30 * (a/a_inner) * sqrt((1+e)/(1-e)) so the maximum
 * Keplerian periapsis speed does not exceed the reference circular speed
 * of the innermost orbit. Large outer orbits are allowed to last minutes.
 *
 * No camera-dependent playback, cap on long cycles, mutation of orbital
 * elements, or change to planetary, solar or lunar axial spin timekeeping.
 */
export const SCIENTIFIC_MOON_INNER_MIN_CYCLE_REAL_SECONDS_V3 = 30;
export const SCIENTIFIC_MOON_OUTER_MIN_CYCLE_REAL_SECONDS_V3 = 120;
export const SCIENTIFIC_MOON_SINGLE_MIN_CYCLE_REAL_SECONDS_V3 = 60;

export function scientificMoonOrbitCycleRealSecondsV3(
  semiMajorAxis: number,
  groupSemiMajorAxes: readonly number[],
  eccentricity: number,
): number {
  assertPositiveFinite(semiMajorAxis, 'moon semi-major axis');
  if (!Number.isFinite(eccentricity) || eccentricity < 0 || eccentricity >= 1) {
    throw new RangeError(`moon eccentricity must be in [0,1): ${eccentricity}.`);
  }
  if (groupSemiMajorAxes.length === 0) {
    throw new RangeError('Moon cadence requires at least one orbital axis.');
  }
  const axes = [...new Set(groupSemiMajorAxes.map(axis => {
    assertPositiveFinite(axis, 'group moon semi-major axis');
    return axis;
  }))].sort((a, b) => a - b);
  const rank = axes.indexOf(semiMajorAxis);
  if (rank < 0) {
    throw new RangeError('The moon must belong to its host group.');
  }
  const progress = axes.length === 1 ? 0.5 : rank / (axes.length - 1);
  const rankMinimum = axes.length === 1
    ? SCIENTIFIC_MOON_SINGLE_MIN_CYCLE_REAL_SECONDS_V3
    : SCIENTIFIC_MOON_INNER_MIN_CYCLE_REAL_SECONDS_V3 + progress *
      (SCIENTIFIC_MOON_OUTER_MIN_CYCLE_REAL_SECONDS_V3 -
        SCIENTIFIC_MOON_INNER_MIN_CYCLE_REAL_SECONDS_V3);
  const relativeSemiMajorAxis = semiMajorAxis / axes[0]!;
  // In a Kepler ellipse: v_periapsis / v_circular(a) = sqrt((1+e)/(1-e)).
  const periapsisSpeedFactor = Math.sqrt((1 + eccentricity) / (1 - eccentricity));
  const linearSpeedMinimum = SCIENTIFIC_MOON_INNER_MIN_CYCLE_REAL_SECONDS_V3 *
    relativeSemiMajorAxis * periapsisSpeedFactor;
  const cycle = Math.max(rankMinimum, linearSpeedMinimum);
  if (!Number.isFinite(cycle)) {
    throw new RangeError('Moon visual cycle exceeds the finite numeric range.');
  }
  return cycle;
}

/** Local phase rate for the fiche; scientific period remains unchanged. */
export function scientificMoonDaysPerRealSecondV3(
  orbitalPeriodDays: number,
  semiMajorAxis: number,
  groupSemiMajorAxes: readonly number[],
  eccentricity: number,
): number {
  assertPositiveFinite(orbitalPeriodDays, 'moon orbital periodDays');
  return orbitalPeriodDays /
    scientificMoonOrbitCycleRealSecondsV3(semiMajorAxis, groupSemiMajorAxes, eccentricity);
}

/** Local lunar contribution only; shared time rule for all SystemScene hosts. */
export function systemSceneMoonPresentationTimeScaleV3(
  orbitalPeriodDays: number,
  semiMajorAxis: number,
  groupSemiMajorAxes: readonly number[],
  playbackDaysPerRealSecond: number,
  eccentricity: number,
): number {
  assertPositiveFinite(playbackDaysPerRealSecond, 'playbackDaysPerRealSecond');
  return scientificMoonDaysPerRealSecondV3(
    orbitalPeriodDays, semiMajorAxis, groupSemiMajorAxes, eccentricity,
  ) / playbackDaysPerRealSecond;
}

/**
 * Legacy MOONCAD.2 — visual-only lunar period, per moon, shared by
 * the scientific body preview and all SystemScene projection variants.
 * Ordered by the physical orbital semi-major axis, NOT by the compressed
 * on-screen radius, orbital period ratio or current camera selection.
 *
 * For N >= 2 distinct radii: inner moon completes in 12 real seconds,
 * outer moon in 30 real seconds, equally spaced intermediate ranks.
 * A lone moon uses the midpoint (21 seconds). Equal axes share a cadence.
 * Scientific orbital elements, phases and rotations remain unchanged.
 */
export const SCIENTIFIC_MOON_MIN_CYCLE_REAL_SECONDS_V2 = 12;
export const SCIENTIFIC_MOON_MAX_CYCLE_REAL_SECONDS_V2 = 30;

export function scientificMoonOrbitCycleRealSecondsV2(
  semiMajorAxis: number,
  groupSemiMajorAxes: readonly number[],
): number {
  assertPositiveFinite(semiMajorAxis, 'moon semi-major axis');
  if (groupSemiMajorAxes.length === 0) {
    throw new RangeError('Moon cadence requires at least one orbital axis.');
  }
  const axes = [...new Set(groupSemiMajorAxes.map(axis => {
    assertPositiveFinite(axis, 'group moon semi-major axis');
    return axis;
  }))].sort((a, b) => a - b);
  const index = axes.indexOf(semiMajorAxis);
  if (index < 0) {
    throw new RangeError('The moon must belong to its host group.');
  }
  const progress = axes.length === 1 ? 0.5 : index / (axes.length - 1);
  return SCIENTIFIC_MOON_MIN_CYCLE_REAL_SECONDS_V2 +
    progress * (SCIENTIFIC_MOON_MAX_CYCLE_REAL_SECONDS_V2 -
      SCIENTIFIC_MOON_MIN_CYCLE_REAL_SECONDS_V2);
}

/** Days of Keplerian lunar motion per real second, for the scientific fiche. */
export function scientificMoonDaysPerRealSecondV2(
  orbitalPeriodDays: number,
  semiMajorAxis: number,
  groupSemiMajorAxes: readonly number[],
): number {
  assertPositiveFinite(orbitalPeriodDays, 'moon orbital periodDays');
  return orbitalPeriodDays /
    scientificMoonOrbitCycleRealSecondsV2(semiMajorAxis, groupSemiMajorAxes);
}

/** Local lunar contribution only. Host planet and star clocks are unaffected. */
export function systemSceneMoonPresentationTimeScaleV2(
  orbitalPeriodDays: number,
  semiMajorAxis: number,
  groupSemiMajorAxes: readonly number[],
  playbackDaysPerRealSecond: number,
): number {
  assertPositiveFinite(playbackDaysPerRealSecond, 'playbackDaysPerRealSecond');
  return scientificMoonDaysPerRealSecondV2(
    orbitalPeriodDays, semiMajorAxis, groupSemiMajorAxes,
  ) / playbackDaysPerRealSecond;
}

/**
 * Legacy MOONCAD.1 group clock retained for older laboratory contracts.
 * NOT used by the scientific fiche or SystemScene since MOONCAD.2, because
 * its 90-second outer orbit can make inner satellites spin around their host
 * in less than two seconds. Never rewrite scientific orbital elements.
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
