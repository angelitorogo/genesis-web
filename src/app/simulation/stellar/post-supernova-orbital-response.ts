export const PostSupernovaMassLossRegime = Object.freeze({
  NONE: 'NONE',
  ADIABATIC: 'ADIABATIC',
  IMPULSIVE: 'IMPULSIVE',
  TRANSITIONAL: 'TRANSITIONAL',
} as const);

export type PostSupernovaMassLossRegime =
  typeof PostSupernovaMassLossRegime[keyof typeof PostSupernovaMassLossRegime];

export const PostSupernovaOrbitDisposition = Object.freeze({
  UNCHANGED: 'UNCHANGED',
  BOUND_RECONFIGURED: 'BOUND_RECONFIGURED',
  EJECTED: 'EJECTED',
  HOST_DISRUPTED: 'HOST_DISRUPTED',
} as const);

export type PostSupernovaOrbitDisposition =
  typeof PostSupernovaOrbitDisposition[keyof typeof PostSupernovaOrbitDisposition];

export interface PostSupernovaKeplerOrbit {
  readonly semiMajorAxisAu: number;
  readonly eccentricity: number;
  readonly periodYears: number;
  readonly periastronAu: number;
  readonly apoastronAu: number;
  /** Inclination relative to the pre-event orbital plane. */
  readonly inclinationChangeDegrees: number;
}

export interface PostSupernovaImpulseInput {
  readonly semiMajorAxisAu: number;
  readonly eccentricity: number;
  readonly preEventMassSolar: number;
  readonly postEventMassSolar: number;
  readonly natalKickKmS: number;
  /** Stable identity used only to materialize the otherwise absent orbital phase/kick direction. */
  readonly deterministicKey: string;
}

export interface PostSupernovaImpulseResult {
  readonly disposition: 'BOUND_RECONFIGURED' | 'EJECTED';
  readonly orbit: PostSupernovaKeplerOrbit | null;
  readonly eventRadiusAu: number;
  readonly trueAnomalyDegrees: number;
  readonly kickVectorKmS: Readonly<{ x: number; y: number; z: number }>;
}

export interface PostSupernovaMoonStabilityInput {
  readonly planetSemiMajorAxisAu: number;
  readonly planetEccentricity: number;
  readonly planetMassEarth: number;
  readonly planetRadiusEarth: number;
  readonly currentHostMassSolar: number;
  readonly moonSemiMajorAxisPlanetRadii: number;
  readonly moonEccentricity: number;
}

export interface PostSupernovaMoonStabilityResult {
  readonly hillSphereRadiusPlanetRadii: number;
  readonly progradeStableLimitPlanetRadii: number;
  readonly survives: boolean;
}

const TWO_PI = 2 * Math.PI;
const GAUSSIAN_G_AU3_SOLAR_YR2 = 4 * Math.PI * Math.PI;
const KM_S_TO_AU_YR = 365.25 * 86_400 / 149_597_870.7;
const EARTH_MASS_SOLAR = 3.00348959632e-6;
const AU_KM = 149_597_870.7;
const EARTH_RADIUS_KM = 6_371.0088;

/**
 * 29.1E-g primitive: slow isotropic mass loss. In the adiabatic limit the
 * semimajor axis expands as M_before / M_after while eccentricity is retained.
 */
export function resolveAdiabaticPostStellarMassLoss(
  semiMajorAxisAu: number,
  eccentricity: number,
  preMassSolar: number,
  postMassSolar: number,
): PostSupernovaKeplerOrbit {
  assertOrbit(semiMajorAxisAu, eccentricity);
  assertMass(preMassSolar, 'preMassSolar');
  assertMass(postMassSolar, 'postMassSolar');
  if (postMassSolar > preMassSolar) {
    throw new RangeError('Adiabatic stellar mass loss cannot increase gravitating mass.');
  }
  const semiMajor = semiMajorAxisAu * preMassSolar / postMassSolar;
  return orbitFromElements(semiMajor, eccentricity, postMassSolar, 0);
}

/**
 * 29.1E-g primitive: instantaneous isotropic mass loss plus a natal kick of
 * the remnant. The planet is treated as a test particle. Because phase 18 did
 * not freeze an anomaly, the event phase and isotropic kick direction are
 * materialized deterministically from the body/event identity rather than from
 * wall clock or a new mutable PRNG stream.
 */
export function resolvePostSupernovaImpulse(
  input: PostSupernovaImpulseInput,
): PostSupernovaImpulseResult {
  assertOrbit(input.semiMajorAxisAu, input.eccentricity);
  assertMass(input.preEventMassSolar, 'preEventMassSolar');
  assertMass(input.postEventMassSolar, 'postEventMassSolar');
  if (input.postEventMassSolar >= input.preEventMassSolar) {
    throw new RangeError('A supernova impulse requires postEventMassSolar < preEventMassSolar.');
  }
  if (!Number.isFinite(input.natalKickKmS) || input.natalKickKmS < 0) {
    throw new RangeError('natalKickKmS must be finite and non-negative.');
  }
  if (input.deterministicKey.trim().length === 0) {
    throw new RangeError('deterministicKey cannot be blank.');
  }

  const meanAnomaly = TWO_PI * deterministicUnit(`${input.deterministicKey}|phase`);
  const eccentricAnomaly = solveEccentricAnomaly(meanAnomaly, input.eccentricity);
  const trueAnomaly = 2 * Math.atan2(
    Math.sqrt(1 + input.eccentricity) * Math.sin(eccentricAnomaly / 2),
    Math.sqrt(1 - input.eccentricity) * Math.cos(eccentricAnomaly / 2),
  );
  const p = input.semiMajorAxisAu * (1 - input.eccentricity ** 2);
  const radius = p / (1 + input.eccentricity * Math.cos(trueAnomaly));
  const muBefore = GAUSSIAN_G_AU3_SOLAR_YR2 * input.preEventMassSolar;
  const muAfter = GAUSSIAN_G_AU3_SOLAR_YR2 * input.postEventMassSolar;
  const speedScale = Math.sqrt(muBefore / p);

  const r = vec(radius * Math.cos(trueAnomaly), radius * Math.sin(trueAnomaly), 0);
  const v = vec(
    -speedScale * Math.sin(trueAnomaly),
    speedScale * (input.eccentricity + Math.cos(trueAnomaly)),
    0,
  );
  const kickDirection = isotropicDirection(`${input.deterministicKey}|kick`);
  const kickAuYr = input.natalKickKmS * KM_S_TO_AU_YR;
  // A positive natal kick belongs to the remnant; in the remnant frame the
  // pre-existing planet receives the opposite relative-velocity impulse.
  const relativeVelocity = subtract(v, scale(kickDirection, kickAuYr));
  const speedSquared = dot(relativeVelocity, relativeVelocity);
  const specificEnergy = speedSquared / 2 - muAfter / radius;
  const kickVectorKmS = Object.freeze({
    x: kickDirection.x * input.natalKickKmS,
    y: kickDirection.y * input.natalKickKmS,
    z: kickDirection.z * input.natalKickKmS,
  });

  if (specificEnergy >= 0) {
    return Object.freeze({
      disposition: 'EJECTED' as const,
      orbit: null,
      eventRadiusAu: radius,
      trueAnomalyDegrees: normalizeDegrees(trueAnomaly * 180 / Math.PI),
      kickVectorKmS,
    });
  }

  const semiMajorAxisAu = -muAfter / (2 * specificEnergy);
  const angularMomentum = cross(r, relativeVelocity);
  const hMagnitude = magnitude(angularMomentum);
  const eVector = subtract(
    scale(cross(relativeVelocity, angularMomentum), 1 / muAfter),
    scale(r, 1 / radius),
  );
  const eccentricity = magnitude(eVector);

  if (!Number.isFinite(eccentricity) || eccentricity >= 1) {
    return Object.freeze({
      disposition: 'EJECTED' as const,
      orbit: null,
      eventRadiusAu: radius,
      trueAnomalyDegrees: normalizeDegrees(trueAnomaly * 180 / Math.PI),
      kickVectorKmS,
    });
  }

  const inclination = hMagnitude === 0
    ? 0
    : Math.acos(clamp(angularMomentum.z / hMagnitude, -1, 1)) * 180 / Math.PI;
  return Object.freeze({
    disposition: 'BOUND_RECONFIGURED' as const,
    orbit: orbitFromElements(
      semiMajorAxisAu,
      clamp(eccentricity, 0, 0.999999999999),
      input.postEventMassSolar,
      inclination,
    ),
    eventRadiusAu: radius,
    trueAnomalyDegrees: normalizeDegrees(trueAnomaly * 180 / Math.PI),
    kickVectorKmS,
  });
}

/**
 * Deterministic materialization of the Giacobbo & Mapelli ejecta/remnant kick
 * scaling. f_H05 is sampled from a 3-D Maxwellian with one-dimensional
 * sigma=265 km/s, then normalized by <M_ej>=9 M☉ and <M_NS>=1.2 M☉.
 * Direct collapse naturally yields zero because its canonical ejecta is zero.
 */
export function deriveDeterministicNatalKickKmS(input: Readonly<{
  remnantKind: 'NEUTRON_STAR' | 'STELLAR_BLACK_HOLE';
  ejectaMassSolar: number;
  remnantMassSolar: number;
  deterministicKey: string;
}>): number {
  assertMass(input.remnantMassSolar, 'remnantMassSolar');
  if (!Number.isFinite(input.ejectaMassSolar) || input.ejectaMassSolar < 0 ||
      input.deterministicKey.trim().length === 0) {
    throw new RangeError('Natal-kick inputs must be finite, non-negative and identified.');
  }
  if (input.ejectaMassSolar === 0) return 0;

  const sigmaKmS = 265;
  const x = deterministicNormal(`${input.deterministicKey}|maxwell-x`) * sigmaKmS;
  const y = deterministicNormal(`${input.deterministicKey}|maxwell-y`) * sigmaKmS;
  const z = deterministicNormal(`${input.deterministicKey}|maxwell-z`) * sigmaKmS;
  const hobbsMagnitudeKmS = Math.sqrt(x * x + y * y + z * z);
  return hobbsMagnitudeKmS *
    (input.ejectaMassSolar / 9) *
    (1.2 / input.remnantMassSolar);
}

export function classifyPostSupernovaMassLossRegime(
  massLossTimescaleDays: number,
  preEventOrbitalPeriodDays: number,
): PostSupernovaMassLossRegime {
  if (!Number.isFinite(massLossTimescaleDays) || massLossTimescaleDays < 0 ||
      !Number.isFinite(preEventOrbitalPeriodDays) || preEventOrbitalPeriodDays <= 0) {
    throw new RangeError('Mass-loss regime requires a non-negative timescale and positive orbital period.');
  }
  if (massLossTimescaleDays === 0) return PostSupernovaMassLossRegime.IMPULSIVE;
  const ratio = massLossTimescaleDays / preEventOrbitalPeriodDays;
  if (ratio <= 0.02) return PostSupernovaMassLossRegime.IMPULSIVE;
  if (ratio < 0.2) return PostSupernovaMassLossRegime.TRANSITIONAL;
  return PostSupernovaMassLossRegime.ADIABATIC;
}

/**
 * Prograde satellite limit from the Domingos/Winter/Yokoyama fit, expressed
 * against the planet's post-SN Hill sphere.
 */
export function resolvePostSupernovaMoonStability(
  input: PostSupernovaMoonStabilityInput,
): PostSupernovaMoonStabilityResult {
  assertOrbit(input.planetSemiMajorAxisAu, input.planetEccentricity);
  assertMass(input.currentHostMassSolar, 'currentHostMassSolar');
  if (!Number.isFinite(input.planetMassEarth) || input.planetMassEarth <= 0 ||
      !Number.isFinite(input.planetRadiusEarth) || input.planetRadiusEarth <= 0 ||
      !Number.isFinite(input.moonSemiMajorAxisPlanetRadii) || input.moonSemiMajorAxisPlanetRadii <= 0 ||
      !Number.isFinite(input.moonEccentricity) || input.moonEccentricity < 0 || input.moonEccentricity >= 1) {
    throw new RangeError('Post-supernova moon stability requires valid planet/moon inputs.');
  }
  const planetMassSolar = input.planetMassEarth * EARTH_MASS_SOLAR;
  const hillAu = input.planetSemiMajorAxisAu * (1 - input.planetEccentricity) *
    Math.cbrt(planetMassSolar / (3 * input.currentHostMassSolar));
  const planetRadiusKm = input.planetRadiusEarth * EARTH_RADIUS_KM;
  const hillPlanetRadii = hillAu * AU_KM / planetRadiusKm;
  const progradeFraction = Math.max(
    0,
    0.4895 * (1 - 1.0305 * input.planetEccentricity - 0.2738 * input.moonEccentricity),
  );
  const stableLimit = hillPlanetRadii * progradeFraction;
  return Object.freeze({
    hillSphereRadiusPlanetRadii: hillPlanetRadii,
    progradeStableLimitPlanetRadii: stableLimit,
    survives: input.moonSemiMajorAxisPlanetRadii < stableLimit,
  });
}

export function orbitalPeriodYears(semiMajorAxisAu: number, gravitatingMassSolar: number): number {
  if (!Number.isFinite(semiMajorAxisAu) || semiMajorAxisAu <= 0) {
    throw new RangeError('semiMajorAxisAu must be positive and finite.');
  }
  assertMass(gravitatingMassSolar, 'gravitatingMassSolar');
  return Math.sqrt(semiMajorAxisAu ** 3 / gravitatingMassSolar);
}

function orbitFromElements(
  semiMajorAxisAu: number,
  eccentricity: number,
  gravitatingMassSolar: number,
  inclinationChangeDegrees: number,
): PostSupernovaKeplerOrbit {
  const periodYears = orbitalPeriodYears(semiMajorAxisAu, gravitatingMassSolar);
  return Object.freeze({
    semiMajorAxisAu,
    eccentricity,
    periodYears,
    periastronAu: semiMajorAxisAu * (1 - eccentricity),
    apoastronAu: semiMajorAxisAu * (1 + eccentricity),
    inclinationChangeDegrees,
  });
}

function solveEccentricAnomaly(meanAnomaly: number, eccentricity: number): number {
  let current = eccentricity < 0.8 ? meanAnomaly : Math.PI;
  for (let i = 0; i < 16; i += 1) {
    const f = current - eccentricity * Math.sin(current) - meanAnomaly;
    const fp = 1 - eccentricity * Math.cos(current);
    const next = current - f / fp;
    if (Math.abs(next - current) < 1e-13) return next;
    current = next;
  }
  return current;
}

interface Vector3 { readonly x: number; readonly y: number; readonly z: number }
const vec = (x: number, y: number, z: number): Vector3 => ({ x, y, z });
const add = (a: Vector3, b: Vector3): Vector3 => vec(a.x + b.x, a.y + b.y, a.z + b.z);
const subtract = (a: Vector3, b: Vector3): Vector3 => vec(a.x - b.x, a.y - b.y, a.z - b.z);
const scale = (a: Vector3, s: number): Vector3 => vec(a.x * s, a.y * s, a.z * s);
const dot = (a: Vector3, b: Vector3): number => a.x * b.x + a.y * b.y + a.z * b.z;
const cross = (a: Vector3, b: Vector3): Vector3 => vec(
  a.y * b.z - a.z * b.y,
  a.z * b.x - a.x * b.z,
  a.x * b.y - a.y * b.x,
);
const magnitude = (a: Vector3): number => Math.sqrt(dot(a, a));

function isotropicDirection(key: string): Vector3 {
  const cosTheta = 2 * deterministicUnit(`${key}|polar`) - 1;
  const sinTheta = Math.sqrt(Math.max(0, 1 - cosTheta ** 2));
  const phi = TWO_PI * deterministicUnit(`${key}|azimuth`);
  return vec(sinTheta * Math.cos(phi), sinTheta * Math.sin(phi), cosTheta);
}

function deterministicNormal(key: string): number {
  // Box-Muller with stable, non-zero uniforms. Separate suffixes keep every
  // component independent without introducing mutable RNG state.
  const u1 = Math.max(Number.EPSILON, deterministicUnit(`${key}|u1`));
  const u2 = deterministicUnit(`${key}|u2`);
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(TWO_PI * u2);
}

/** Stable 32-bit FNV-1a-derived scalar in [0,1); no mutable PRNG state. */
function deterministicUnit(value: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  // One final avalanche avoids visible correlation among similar suffixes.
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x7feb352d) >>> 0;
  hash ^= hash >>> 15;
  hash = Math.imul(hash, 0x846ca68b) >>> 0;
  hash ^= hash >>> 16;
  return (hash >>> 0) / 0x1_0000_0000;
}

function assertOrbit(semiMajorAxisAu: number, eccentricity: number): void {
  if (!Number.isFinite(semiMajorAxisAu) || semiMajorAxisAu <= 0 ||
      !Number.isFinite(eccentricity) || eccentricity < 0 || eccentricity >= 1) {
    throw new RangeError('Orbit requires positive finite semi-major axis and eccentricity in [0,1).');
  }
}

function assertMass(value: number, name: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name} must be positive and finite.`);
  }
}

function normalizeDegrees(value: number): number {
  const result = value % 360;
  return result < 0 ? result + 360 : result;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
