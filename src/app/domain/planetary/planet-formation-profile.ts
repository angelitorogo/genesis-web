/**
 * Broad V1 planetary-formation regime derived from the local sector
 * metallicity.
 *
 * This is environmental Ground Truth. It is not an individual planetary
 * system and it does not materialize planets.
 */
export enum PlanetFormationRegime {
  SOLID_LIMITED =
    'SOLID_LIMITED',

  ROCKY_FAVORED =
    'ROCKY_FAVORED',

  MIXED =
    'MIXED',

  GIANT_ENHANCED =
    'GIANT_ENHANCED',
}

/**
 * Deterministic environmental profile describing how favorable a sector is
 * to planetary formation.
 *
 * All propensity/probability values are normalized to [0, 1].
 */
export class PlanetFormationProfile {

  constructor(
    readonly metallicitySolarRatio:
      number,

    readonly solidMaterialIndex:
      number,

    readonly overallPlanetFormationProbability:
      number,

    readonly rockyPlanetFormationPropensity:
      number,

    readonly iceRichPlanetFormationPropensity:
      number,

    readonly giantPlanetFormationPropensity:
      number,

    readonly regime:
      PlanetFormationRegime,
  ) {
    if (
      !Number.isFinite(
        metallicitySolarRatio,
      ) ||
      metallicitySolarRatio <
        0
    ) {
      throw new RangeError(
        'metallicitySolarRatio must be finite and non-negative.',
      );
    }

    assertNormalized(
      solidMaterialIndex,
      'solidMaterialIndex',
    );

    assertNormalized(
      overallPlanetFormationProbability,
      'overallPlanetFormationProbability',
    );

    assertNormalized(
      rockyPlanetFormationPropensity,
      'rockyPlanetFormationPropensity',
    );

    assertNormalized(
      iceRichPlanetFormationPropensity,
      'iceRichPlanetFormationPropensity',
    );

    assertNormalized(
      giantPlanetFormationPropensity,
      'giantPlanetFormationPropensity',
    );

    if (
      !Object.values(
        PlanetFormationRegime,
      ).includes(
        regime,
      )
    ) {
      throw new RangeError(
        `Unknown PlanetFormationRegime: ${String(regime)}.`,
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
      0 ||
    value >
      1
  ) {
    throw new RangeError(
      `${propertyName} must be finite and in range [0, 1]: ${value}.`,
    );
  }
}
