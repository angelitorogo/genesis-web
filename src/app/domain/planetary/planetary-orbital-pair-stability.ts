import {
  PlanetaryOrbitalPairStabilityRegime,
} from './planetary-orbital-pair-stability-regime';

/**
 * Point-18.5 diagnostic for two adjacent mature planets.
 *
 * The mutual-Hill calculation uses the inherited point-18.2 solid-core masses
 * as the currently frozen dynamical mass proxy. Phase 19 has not yet generated
 * final total planetary masses, so this result must not be read as an N-body
 * proof for a later, materially heavier planet.
 */
export class PlanetaryOrbitalPairStability {

  constructor(
    readonly innerPlanetOrdinal:
      number,

    readonly outerPlanetOrdinal:
      number,

    readonly innerSemiMajorAxisAu:
      number,

    readonly outerSemiMajorAxisAu:
      number,

    readonly innerApoastronAu:
      number,

    readonly outerPeriastronAu:
      number,

    readonly radialClearanceAu:
      number,

    readonly innerReferenceMassEarth:
      number,

    readonly outerReferenceMassEarth:
      number,

    readonly mutualHillRadiusAu:
      number,

    readonly separationMutualHillRadii:
      number,

    readonly periodRatio:
      number,

    readonly mutualInclinationDegrees:
      number,

    readonly regime:
      PlanetaryOrbitalPairStabilityRegime,
  ) {
    if (
      !Number.isInteger(
        innerPlanetOrdinal,
      ) ||
      innerPlanetOrdinal <=
        0 ||
      outerPlanetOrdinal !==
        innerPlanetOrdinal +
          1
    ) {
      throw new RangeError(
        'Point-18.5 pair ordinals must identify two contiguous mature planets.',
      );
    }

    assertPositiveFinite(
      innerSemiMajorAxisAu,
      'innerSemiMajorAxisAu',
    );

    assertPositiveFinite(
      outerSemiMajorAxisAu,
      'outerSemiMajorAxisAu',
    );

    if (
      outerSemiMajorAxisAu <=
      innerSemiMajorAxisAu
    ) {
      throw new RangeError(
        'outerSemiMajorAxisAu must be greater than innerSemiMajorAxisAu.',
      );
    }

    assertPositiveFinite(
      innerApoastronAu,
      'innerApoastronAu',
    );

    assertPositiveFinite(
      outerPeriastronAu,
      'outerPeriastronAu',
    );

    if (
      !Number.isFinite(
        radialClearanceAu,
      ) ||
      !approximatelyEqual(
        radialClearanceAu,
        outerPeriastronAu -
          innerApoastronAu,
      )
    ) {
      throw new RangeError(
        'radialClearanceAu must exactly match outerPeriastronAu - innerApoastronAu.',
      );
    }

    assertPositiveFinite(
      innerReferenceMassEarth,
      'innerReferenceMassEarth',
    );

    assertPositiveFinite(
      outerReferenceMassEarth,
      'outerReferenceMassEarth',
    );

    assertPositiveFinite(
      mutualHillRadiusAu,
      'mutualHillRadiusAu',
    );

    assertNonNegativeFinite(
      separationMutualHillRadii,
      'separationMutualHillRadii',
    );

    if (
      !approximatelyEqual(
        separationMutualHillRadii,
        (
          outerSemiMajorAxisAu -
          innerSemiMajorAxisAu
        ) /
          mutualHillRadiusAu,
      )
    ) {
      throw new RangeError(
        'separationMutualHillRadii must match the semi-major-axis separation divided by mutualHillRadiusAu.',
      );
    }

    if (
      !Number.isFinite(
        periodRatio,
      ) ||
      periodRatio <=
        1
    ) {
      throw new RangeError(
        'periodRatio must be finite and greater than 1 for an adjacent ordered pair.',
      );
    }

    if (
      !Number.isFinite(
        mutualInclinationDegrees,
      ) ||
      mutualInclinationDegrees <
        0 ||
      mutualInclinationDegrees >
        180
    ) {
      throw new RangeError(
        'mutualInclinationDegrees must be finite and in [0, 180].',
      );
    }

    if (
      !Object.values(
        PlanetaryOrbitalPairStabilityRegime,
      ).includes(
        regime,
      )
    ) {
      throw new RangeError(
        'regime must be a known PlanetaryOrbitalPairStabilityRegime.',
      );
    }
  }

  get isStable():
    boolean {

    return this.regime ===
      PlanetaryOrbitalPairStabilityRegime.STABLE;
  }

  get isMarginal():
    boolean {

    return this.regime ===
      PlanetaryOrbitalPairStabilityRegime.MARGINAL;
  }

  get isUnstable():
    boolean {

    return this.regime ===
      PlanetaryOrbitalPairStabilityRegime.UNSTABLE;
  }
}

function assertPositiveFinite(
  value:
    number,

  propertyName:
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
      `${propertyName} must be finite and greater than 0: ${value}.`,
    );
  }
}

function assertNonNegativeFinite(
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
      0
  ) {
    throw new RangeError(
      `${propertyName} must be finite and non-negative: ${value}.`,
    );
  }
}

function approximatelyEqual(
  first:
    number,

  second:
    number,
): boolean {

  return (
    Math.abs(
      first -
      second,
    ) <=
    1e-12 *
      Math.max(
        1,
        Math.abs(
          first,
        ),
        Math.abs(
          second,
        ),
      )
  );
}
