/**
 * Scientific-status marker for the Galactic Habitable Zone model.
 *
 * SPECULATIVE_SIMPLIFIED is deliberately part of the domain result so callers
 * cannot mistake this procedural heuristic for an empirical astronomical
 * observation or evidence of life.
 */
export enum GalacticHabitabilityModelStatus {
  SPECULATIVE_SIMPLIFIED =
    'SPECULATIVE_SIMPLIFIED',
}

/**
 * Broad interpretation band for the simplified galactic habitability
 * potential.
 *
 * These bands express procedural potential only. They do not assert that a
 * sector contains life, habitable planets or even individual planetary
 * systems.
 */
export enum GalacticHabitabilityBand {
  LOW_POTENTIAL =
    'LOW_POTENTIAL',

  MARGINAL =
    'MARGINAL',

  FAVORED =
    'FAVORED',

  HIGH_POTENTIAL =
    'HIGH_POTENTIAL',
}

/**
 * Simplified speculative Galactic Habitable Zone profile at sector scale.
 *
 * IMPORTANT SCIENTIFIC DISCLAIMER:
 *
 * This is a deliberately simplified procedural model for GENESIS. It is not
 * an empirical astronomical measurement, does not constitute a scientific
 * claim that a Galactic Habitable Zone exists with these exact boundaries,
 * and does not imply the presence of life or habitable planets.
 *
 * Every numeric component is a normalized heuristic in [0, 1].
 */
export class GalacticHabitabilityProfile {

  constructor(
    readonly modelStatus:
      GalacticHabitabilityModelStatus,

    readonly planetFormationSupport:
      number,

    readonly stableHostStarSupport:
      number,

    readonly stellarOpportunityIndex:
      number,

    readonly crowdingHazard:
      number,

    readonly massiveStarHazard:
      number,

    readonly environmentalSafety:
      number,

    readonly habitabilityPotential:
      number,

    readonly band:
      GalacticHabitabilityBand,
  ) {
    assertNormalized(
      planetFormationSupport,
      'planetFormationSupport',
    );

    assertNormalized(
      stableHostStarSupport,
      'stableHostStarSupport',
    );

    assertNormalized(
      stellarOpportunityIndex,
      'stellarOpportunityIndex',
    );

    assertNormalized(
      crowdingHazard,
      'crowdingHazard',
    );

    assertNormalized(
      massiveStarHazard,
      'massiveStarHazard',
    );

    assertNormalized(
      environmentalSafety,
      'environmentalSafety',
    );

    assertNormalized(
      habitabilityPotential,
      'habitabilityPotential',
    );

    if (
      !Object.values(
        GalacticHabitabilityModelStatus,
      ).includes(
        modelStatus,
      )
    ) {
      throw new RangeError(
        `Unknown GalacticHabitabilityModelStatus: ${String(modelStatus)}.`,
      );
    }

    if (
      !Object.values(
        GalacticHabitabilityBand,
      ).includes(
        band,
      )
    ) {
      throw new RangeError(
        `Unknown GalacticHabitabilityBand: ${String(band)}.`,
      );
    }
  }
}

function assertNormalized(
  value:
    number,

  propertyName:
    string,
): void {

  if (
    !Number.isFinite(
      value,
    ) ||
    value <
      0.0 ||
    value >
      1.0
  ) {
    throw new RangeError(
      `${propertyName} must be finite and in range [0, 1]: ${value}.`,
    );
  }
}
