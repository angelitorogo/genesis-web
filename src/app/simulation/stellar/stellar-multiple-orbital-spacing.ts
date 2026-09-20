/**
 * Pure, deterministic analytic screening shared by laboratory and future real-universe
 * multiple-system generation. No planetary generator, mutable state or renderer.
 * An approximate clearance is not an N-body stability certificate.
 */

/**
 * Approximate critical S-type semimajor axis / stellar separation, using the
 * empirical coplanar prograde binary fit. Both hosts are checked separately.
 * We enforce the source orbital apastron against the critical semi-major axis
 * (conservative screening), with a family-dependent additional safety margin.
 */
export function circumstellarCriticalFraction(
  companionMassFraction: number,
  eccentricity: number,
): number {
  if (!(companionMassFraction > 0 && companionMassFraction < 1) ||
      !(eccentricity >= 0 && eccentricity < 0.8)) {
    throw new RangeError('Invalid mass fraction or eccentricity for S-type clearance.');
  }
  const mu = companionMassFraction;
  const e = eccentricity;
  return 0.464 - 0.380 * mu - 0.631 * e + 0.586 * mu * e +
    0.150 * e * e - 0.198 * mu * e * e;
}

export function multipleBinarySemiMajorAxisAu(
  extentA: number,
  extentB: number,
  massA: number,
  massB: number,
  eccentricity: number,
  safetyFactor: number,
): number {
  if ([extentA, extentB, massA, massB, safetyFactor].some(value =>
    !Number.isFinite(value) || value <= 0) || safetyFactor < 1) {
    throw new RangeError('Binary spacing requires positive extents, masses and safety.');
  }
  const massSum = massA + massB;
  const stableA = circumstellarCriticalFraction(massB / massSum, eccentricity);
  const stableB = circumstellarCriticalFraction(massA / massSum, eccentricity);
  if (stableA <= 0 || stableB <= 0) {
    throw new RangeError('No positive S-type stability window for this binary.');
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
export function multipleTripleOuterSemiMajorAxisAu(
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
  const outerCriticalAB = circumstellarCriticalFraction(massC / (massAB + massC), outerEccentricity);
  const outerCriticalC = circumstellarCriticalFraction(massAB / (massAB + massC), outerEccentricity);
  if (outerCriticalAB <= 0 || outerCriticalC <= 0) {
    throw new RangeError('No positive outer S-type window for this triple.');
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
