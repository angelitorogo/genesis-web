import { MinorBodyKind, type MinorBodyKindValue } from '../../domain/planetary/minor-body-kind';

/** Presentation clock only. Scientific orbital periods and orbital elements never change. */
const VISUAL_SECONDS = Object.freeze({
  [MinorBodyKind.ASTEROID.code]: [240, 420],
  [MinorBodyKind.COMET.code]: [300, 540],
  [MinorBodyKind.TRANS_NEPTUNIAN_OBJECT.code]: [480, 720],
  [MinorBodyKind.CAPTURED_EXTRASOLAR_OBJECT.code]: [300, 600],
} as const);

const TWO_PI = 2 * Math.PI;
export const V2_COMET_PHASE_WARP = 0.5;
const COMET_ARC_SAMPLES = 2048;
const COMET_ARC_CACHE_LIMIT = 64;

interface CometArcClock {
  readonly elapsed: Float64Array;
  readonly total: number;
}

// Computed once per eccentricity/warp, not on every animation frame. These
// tables contain presentation geometry only and are never persisted.
const cometArcClocks = new Map<string, CometArcClock>();

/** Rank is determined independently per physical stellar host AND minor-body family. */
export function v2MinorBodyOrbitSeconds(
  kind: MinorBodyKindValue, radialRank: number, familyCount: number, proceduralId: string,
): number {
  if (!Number.isSafeInteger(radialRank) || radialRank < 1 ||
      !Number.isSafeInteger(familyCount) || familyCount < 1 || radialRank > familyCount ||
      proceduralId.trim().length === 0) {
    throw new RangeError('V2 minor-body cadence requires valid rank, family size and identity.');
  }
  const range = VISUAL_SECONDS[kind.code as keyof typeof VISUAL_SECONDS];
  if (!range) {
    throw new RangeError(`No closed-orbit cadence is defined for minor-body kind ${kind.name}.`);
  }
  const [minSeconds, maxSeconds] = range;
  const nominal = familyCount === 1 ? (minSeconds + maxSeconds) / 2 :
    minSeconds + (maxSeconds - minSeconds) * (radialRank - 1) / (familyCount - 1);
  // FNV-1a on the frozen procedural ID: no PRNG draw, no generator-seed change.
  let hash = 0x811c9dc5;
  for (const char of `${kind.code}|${proceduralId}`) {
    hash = Math.imul(hash ^ char.charCodeAt(0), 0x01000193);
  }
  const variation = ((hash >>> 0) / 0xffffffff * 2 - 1) * 0.05;
  return Math.min(maxSeconds, Math.max(minSeconds, nominal * (1 + variation)));
}

export function v2MinorBodyTimeScale(
  physicalPeriodDays: number, playbackDaysPerRealSecond: number,
  kind: MinorBodyKindValue, radialRank: number, familyCount: number, proceduralId: string,
): number {
  if (!Number.isFinite(physicalPeriodDays) || physicalPeriodDays <= 0 ||
      !Number.isFinite(playbackDaysPerRealSecond) || playbackDaysPerRealSecond <= 0) {
    throw new RangeError('V2 minor-body presentation requires positive physical period and playback.');
  }
  return physicalPeriodDays / (playbackDaysPerRealSecond *
    v2MinorBodyOrbitSeconds(kind, radialRank, familyCount, proceduralId));
}

/**
 * Optional COMET-ONLY phase mapping for an already-bound elliptical orbit.
 * Travel the ACTUAL ellipse with a bounded LINEAR speed: ds/dt is proportional
 * to (1 + strength*cos(true anomaly)), so the comet visibly moves faster near
 * the star and slower far from it. The former true-anomaly clock bounded only
 * angular speed; on eccentric orbits r*d(theta)/dt was actually much smaller
 * at periapsis, making the comet appear to accelerate at apoapsis instead.
 * A cached cumulative arc-time table converts visual elapsed time into the
 * original orbit's eccentric/mean anomaly. Epoch position, period and physical
 * orbit stay unchanged. All callers (body, tail, stellar flux) use this clock.
 */
export function v2CometPresentationDay(
  presentationDay: number, periodDays: number, eccentricity: number,
  epochMeanAnomalyDegrees: number, strength = V2_COMET_PHASE_WARP,
): number {
  if (![presentationDay, periodDays, eccentricity, epochMeanAnomalyDegrees, strength]
      .every(Number.isFinite) || periodDays <= 0 || eccentricity < 0 || eccentricity >= 1 ||
      strength < 0 || strength > 0.6) {
    throw new RangeError('V2 comet phase requires a bound ellipse, finite time and bounded warp.');
  }
  // A circle has no distinguished periapsis: keep uniform motion. For nearly
  // circular ellipses gently fade in the contrast rather than inventing a
  // conspicuous speed burst at an arbitrary orbital longitude.
  if (strength === 0 || eccentricity === 0) return presentationDay;
  const visualStrength = strength * Math.min(1, eccentricity / 0.2);
  const epochMean = normalize(epochMeanAnomalyDegrees * Math.PI / 180);
  const epochEccentric = eccentricAnomalyAtMean(epochMean, eccentricity);
  const clock = cometArcClock(eccentricity, visualStrength);
  const epochElapsed = clockTimeAtEccentric(clock, epochEccentric);
  const phase = normalizeUnit(presentationDay / periodDays);
  const targetElapsed = (epochElapsed + phase * clock.total) % clock.total;
  const eccentricAnomaly = eccentricAtClockTime(clock, targetElapsed);
  const visualMean = eccentricAnomaly - eccentricity * Math.sin(eccentricAnomaly);
  // The authoritative Kepler projector expects a day relative to the original
  // epoch; it normalizes the mean anomaly, so cycle wrapping is equivalent.
  return (visualMean - epochMean) * periodDays / TWO_PI;
}

function normalize(angle: number): number {
  return ((angle % TWO_PI) + TWO_PI) % TWO_PI;
}

function normalizeUnit(value: number): number {
  return ((value % 1) + 1) % 1;
}

/** Kepler's equation is monotonic for every bound ellipse, including e≈1. */
function eccentricAnomalyAtMean(mean: number, eccentricity: number): number {
  if (mean === 0) return 0;
  let lower = 0;
  let upper = TWO_PI;
  for (let index = 0; index < 54; index++) {
    const middle = (lower + upper) / 2;
    if (middle - eccentricity * Math.sin(middle) < mean) lower = middle;
    else upper = middle;
  }
  return (lower + upper) / 2;
}

function cometArcClock(eccentricity: number, strength: number): CometArcClock {
  const key = `${eccentricity}:${strength}`;
  const cached = cometArcClocks.get(key);
  if (cached !== undefined) return cached;

  const elapsed = new Float64Array(COMET_ARC_SAMPLES + 1);
  const step = TWO_PI / COMET_ARC_SAMPLES;
  // dt/dE = (ds/dE) / v(E). Using arc length, rather than true-anomaly
  // increments, gives periapsis a larger *visible displacement per second*.
  // Midpoints avoid singular sample locations at extremely high eccentricity.
  for (let index = 1; index <= COMET_ARC_SAMPLES; index++) {
    const eccentricAnomaly = (index - 0.5) * step;
    const cosine = Math.cos(eccentricAnomaly);
    const sine = Math.sin(eccentricAnomaly);
    const cosTrue = (cosine - eccentricity) / (1 - eccentricity * cosine);
    const arcDerivative = Math.hypot(sine,
      Math.sqrt(1 - eccentricity * eccentricity) * cosine);
    elapsed[index] = elapsed[index - 1]! +
      step * arcDerivative / (1 + strength * cosTrue);
  }
  const clock = { elapsed, total: elapsed[COMET_ARC_SAMPLES]! };
  if (cometArcClocks.size >= COMET_ARC_CACHE_LIMIT) {
    const oldest = cometArcClocks.keys().next().value;
    if (oldest !== undefined) cometArcClocks.delete(oldest);
  }
  cometArcClocks.set(key, clock);
  return clock;
}

function clockTimeAtEccentric(clock: CometArcClock, eccentricAnomaly: number): number {
  const sample = eccentricAnomaly / TWO_PI * COMET_ARC_SAMPLES;
  const index = Math.min(COMET_ARC_SAMPLES - 1, Math.floor(sample));
  const fraction = sample - index;
  return clock.elapsed[index]! +
    fraction * (clock.elapsed[index + 1]! - clock.elapsed[index]!);
}

function eccentricAtClockTime(clock: CometArcClock, elapsed: number): number {
  let lower = 0;
  let upper = COMET_ARC_SAMPLES;
  while (upper - lower > 1) {
    const middle = (lower + upper) >>> 1;
    if (clock.elapsed[middle]! <= elapsed) lower = middle;
    else upper = middle;
  }
  const duration = clock.elapsed[upper]! - clock.elapsed[lower]!;
  const fraction = duration === 0 ? 0 : (elapsed - clock.elapsed[lower]!) / duration;
  return (lower + fraction) * TWO_PI / COMET_ARC_SAMPLES;
}
