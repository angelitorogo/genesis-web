import type { SystemSceneSnapshot } from '../../system/system-scene-snapshot';
import type { StellarSystemLaboratoryFamilyId } from './stellar-system-laboratory-fixtures';

/**
 * LAB only. Deterministic spacing of complete, independently generated SINGLE
 * sources. No planetary engine, planet filtering or orbital-period rewrite.
 * These are conservative analytic screening rules, NOT an N-body proof. In
 * particular long-period comets/captured objects can still be perturbed.
 */
export interface LaboratoryOrbitalSpacingProfile {
  readonly label: 'Compacto' | 'Intermedio' | 'Amplio' | 'Muy amplio';
  readonly safetyFactor: number;
  readonly innerDisplayPeriastronScene: number;
  readonly outerDisplayPeriastronScene: number;
}

const PROFILES: Readonly<Record<StellarSystemLaboratoryFamilyId, LaboratoryOrbitalSpacingProfile>> =
  Object.freeze({
    A: Object.freeze({ label: 'Compacto', safetyFactor: 1.12, innerDisplayPeriastronScene: 5.65, outerDisplayPeriastronScene: 11.2 }),
    B: Object.freeze({ label: 'Compacto', safetyFactor: 1.18, innerDisplayPeriastronScene: 5.85, outerDisplayPeriastronScene: 11.5 }),
    C: Object.freeze({ label: 'Intermedio', safetyFactor: 1.43, innerDisplayPeriastronScene: 6.45, outerDisplayPeriastronScene: 12.4 }),
    D: Object.freeze({ label: 'Intermedio', safetyFactor: 1.57, innerDisplayPeriastronScene: 6.8, outerDisplayPeriastronScene: 12.9 }),
    E: Object.freeze({ label: 'Amplio', safetyFactor: 1.92, innerDisplayPeriastronScene: 7.5, outerDisplayPeriastronScene: 14.0 }),
    F: Object.freeze({ label: 'Amplio', safetyFactor: 2.14, innerDisplayPeriastronScene: 8.0, outerDisplayPeriastronScene: 14.8 }),
    G: Object.freeze({ label: 'Muy amplio', safetyFactor: 2.72, innerDisplayPeriastronScene: 9.0, outerDisplayPeriastronScene: 16.3 }),
    H: Object.freeze({ label: 'Muy amplio', safetyFactor: 3.05, innerDisplayPeriastronScene: 9.6, outerDisplayPeriastronScene: 17.3 }),
  });

export function laboratoryOrbitalSpacingProfile(
  familyId: StellarSystemLaboratoryFamilyId,
): LaboratoryOrbitalSpacingProfile {
  return PROFILES[familyId];
}

/**
 * Extent protected when composing complete SINGLE sources into a LAB binary.
 * Preserve real planetary apastra and asteroid-belt edges. A radiative HZ is
 * not an occupied orbit: for a source with neither planets nor belts it must
 * not force an otherwise empty host hundreds of AU away from its companion.
 * Its HZ remains in the source and the composed render; only spacing changes.
 * The 0.2 AU floor is an existing conservative LAB clearance, not a stellar
 * radius estimate or an N-body stability guarantee. Long-period comets remain
 * outside this approximate stability screen, as in V1.
 */
export function laboratoryProtectedSingleExtentAu(source: SystemSceneSnapshot): number {
  const motions = new Map(source.motions.map(motion => [motion.id, motion]));
  const belts = source.asteroidBelts ?? [];
  const hasOccupiedRegion = source.planets.length > 0 || belts.length > 0;
  return Math.max(
    0.2,
    hasOccupiedRegion ? (source.habitableZone?.radiativeOuterEdgeAu ?? 0) : 0,
    ...source.planets.map(planet => {
      const planetMotion = planet.motionContributions.find(part => part.motionId.startsWith('planet-'));
      const motion = planetMotion === undefined ? undefined : motions.get(planetMotion.motionId);
      return motion === undefined ? 0 : motion.semiMajorAxisAu * (1 + motion.eccentricity);
    }),
    ...belts.map(belt => belt.outerEdgeAu),
  );
}

/**
 * Approximate critical S-type semimajor axis / stellar separation, using the
 * empirical coplanar prograde binary fit. Both hosts are checked separately.
 * We enforce the source orbital apastron against the critical semi-major axis
 * (conservative screening), with a family-dependent additional safety margin.
 */
export function laboratoryCircumstellarCriticalFraction(
  companionMassFraction: number,
  eccentricity: number,
): number {
  if (!(companionMassFraction > 0 && companionMassFraction < 1) ||
      !(eccentricity >= 0 && eccentricity < 0.8)) {
    throw new RangeError('Invalid mass fraction or eccentricity for laboratory S-type clearance.');
  }
  const mu = companionMassFraction;
  const e = eccentricity;
  return 0.464 - 0.380 * mu - 0.631 * e + 0.586 * mu * e +
    0.150 * e * e - 0.198 * mu * e * e;
}

export function laboratoryBinarySemiMajorAxisAu(
  extentA: number,
  extentB: number,
  massA: number,
  massB: number,
  eccentricity: number,
  safetyFactor: number,
): number {
  if ([extentA, extentB, massA, massB, safetyFactor].some(value =>
    !Number.isFinite(value) || value <= 0) || safetyFactor < 1) {
    throw new RangeError('Laboratory binary spacing requires positive extents, masses and safety.');
  }
  const massSum = massA + massB;
  const stableA = laboratoryCircumstellarCriticalFraction(massB / massSum, eccentricity);
  const stableB = laboratoryCircumstellarCriticalFraction(massA / massSum, eccentricity);
  if (stableA <= 0 || stableB <= 0) {
    throw new RangeError('No positive S-type stability window for this laboratory binary.');
  }
  return safetyFactor * Math.max(
    extentA / stableA,
    extentB / stableB,
    1.1 * (extentA + extentB) / (1 - eccentricity),
  );
}

/** Outer hierarchy screening: inner apastron, C's own orbital extent and an
 * approximate hierarchical triple separation bound. No claim of long-term
 * stability of a particular orbit, comet or HZ under full 3-body dynamics. */
export function laboratoryTripleOuterSemiMajorAxisAu(
  innerSemiMajorAu: number,
  innerEccentricity: number,
  extentA: number,
  extentB: number,
  extentC: number,
  massA: number,
  massB: number,
  massC: number,
  outerEccentricity: number,
  safetyFactor: number,
): number {
  if ([innerSemiMajorAu, extentA, extentB, extentC, massA, massB, massC, safetyFactor].some(
    value => !Number.isFinite(value) || value <= 0) || safetyFactor < 1) {
    throw new RangeError('Laboratory triple spacing requires positive orbital extents and masses.');
  }
  if (!(innerEccentricity >= 0 && innerEccentricity < 0.8)) {
    throw new RangeError('Invalid inner eccentricity.');
  }
  const massAB = massA + massB;
  const apoInner = innerSemiMajorAu * (1 + innerEccentricity);
  const maxHostExcursion = apoInner * Math.max(massA, massB) / massAB;
  const envelopeAB = maxHostExcursion + Math.max(extentA, extentB);
  const outerCriticalAB = laboratoryCircumstellarCriticalFraction(massC / (massAB + massC), outerEccentricity);
  const outerCriticalC = laboratoryCircumstellarCriticalFraction(massAB / (massAB + massC), outerEccentricity);
  if (outerCriticalAB <= 0 || outerCriticalC <= 0) {
    throw new RangeError('No positive outer S-type window for this laboratory triple.');
  }
  const qOuter = massC / massAB;
  const hierarchyRatio = 2.8 * Math.pow(1 + qOuter, 0.4) *
    Math.pow(1 + outerEccentricity, 0.4) /
    Math.pow(1 - outerEccentricity, 1.2);
  return safetyFactor * Math.max(
    innerSemiMajorAu * hierarchyRatio,
    envelopeAB / outerCriticalAB,
    extentC / outerCriticalC,
    1.15 * (envelopeAB + extentC) / (1 - outerEccentricity),
  );
}
