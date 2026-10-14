import {
  PlanetType,
} from '../../domain/planetary/planet-type';

/**
 * L.1 — Deterministic distribution of an ALREADY BOUNDED relevant-moon mass
 * budget. This never changes moon counts, identities, orbits or the host's
 * available satellite mass. It only changes the relative allocation.
 *
 * A diversity of mass hierarchies is sampled per host: relatively even,
 * staggered, dominant and rare highly concentrated configurations. No body
 * type, seed or ordinal receives an exceptional hard-coded mass.
 *
 * Masses are NOT evidence of moon formation or capture histories. The
 * orbital/mutual-stability and material-composition refinements belong to L.2.
 */
export function moonMassHierarchyWeightsL1(
  hostType: PlanetType,
  hierarchySample01: number,
  moonSamples01: readonly number[],
): readonly number[] {
  if (
    moonSamples01.length === 0
  ) {
    return Object.freeze([]);
  }

  assertUnitSample(hierarchySample01);
  for (const sample of moonSamples01) {
    assertUnitSample(sample);
  }

  if (moonSamples01.length === 1) {
    return Object.freeze([1]);
  }

  const giantFamily =
    hostType === PlanetType.GAS_GIANT ||
    hostType === PlanetType.ICE_GIANT;
  const miniNeptune =
    hostType === PlanetType.MINI_NEPTUNE;

  const concentration = giantFamily
    ? (hierarchySample01 < 0.18
        ? 0.8
        : hierarchySample01 < 0.62
          ? 2.8
          : hierarchySample01 < 0.93
            ? 6.5
            : 11.5)
    : miniNeptune
      ? (hierarchySample01 < 0.25
          ? 0.85
          : hierarchySample01 < 0.70
            ? 2.8
            : hierarchySample01 < 0.95
              ? 5.8
              : 9)
      : (hierarchySample01 < 0.55
          ? 0.9
          : hierarchySample01 < 0.90
            ? 2
            : 4);

  // Positive exponential weights have a long tail at high concentrations,
  // but retain a non-zero finite mass for every characterized moon.
  // Ordinal has only a weak statistical preference; a large moon can
  // legitimately appear at any ordinal, without reshuffling stable IDs.
  const rawWeights = moonSamples01.map((sample, index) =>
    Math.exp(-concentration * (1 - sample)) /
    Math.pow(index + 1, 0.10),
  );
  const total = rawWeights.reduce((sum, weight) => sum + weight, 0);
  return Object.freeze(rawWeights.map(weight => weight / total));
}

function assertUnitSample(value: number): void {
  if (!Number.isFinite(value) || value < 0 || value >= 1) {
    throw new RangeError('L.1 moon mass samples must be finite in [0, 1).');
  }
}
