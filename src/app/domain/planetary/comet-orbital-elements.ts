import {
  type CometPeriodRegime,
  cometPeriodRegimeV1,
} from './comet-period-regime';

const CONSISTENCY_TOLERANCE =
  1e-9;

/**
 * Point-22.6 bound Keplerian-style orbit for one relevant comet.
 *
 * The orbit is deliberately elliptical (`e < 1`) and therefore remains bound
 * to its parent stellar system. Parabolic/hyperbolic trajectories are excluded
 * until point 22.8. `orbitalPeriodYears` is host-dominated and is validated
 * against the supplied gravitating mass through Kepler's third law.
 */
export class CometOrbitalElements {

  constructor(
    readonly cometOrdinal:
      number,

    readonly gravitatingMassSolar:
      number,

    readonly semiMajorAxisAu:
      number,

    readonly eccentricity:
      number,

    readonly inclinationDegrees:
      number,

    readonly longitudeAscendingNodeDegrees:
      number,

    readonly argumentOfPeriapsisDegrees:
      number,

    readonly meanAnomalyDegrees:
      number,

    readonly orbitalPeriodYears:
      number,

    readonly periodRegime:
      CometPeriodRegime,
  ) {
    if (
      !Number.isInteger(
        cometOrdinal,
      ) ||
      cometOrdinal <=
        0
    ) {
      throw new RangeError(
        'cometOrdinal must be a positive integer.',
      );
    }

    assertPositiveFinite(
      gravitatingMassSolar,
      'gravitatingMassSolar',
    );

    assertPositiveFinite(
      semiMajorAxisAu,
      'semiMajorAxisAu',
    );

    if (
      !Number.isFinite(
        eccentricity,
      ) ||
      eccentricity <
        0 ||
      eccentricity >=
        1
    ) {
      throw new RangeError(
        'Comet eccentricity must be finite in [0, 1) for point-22.6 bound orbits.',
      );
    }

    if (
      !Number.isFinite(
        inclinationDegrees,
      ) ||
      inclinationDegrees <
        0 ||
      inclinationDegrees >
        180
    ) {
      throw new RangeError(
        'inclinationDegrees must be finite in [0, 180].',
      );
    }

    for (
      const [
        name,
        value,
      ] of [
        [
          'longitudeAscendingNodeDegrees',
          longitudeAscendingNodeDegrees,
        ],
        [
          'argumentOfPeriapsisDegrees',
          argumentOfPeriapsisDegrees,
        ],
        [
          'meanAnomalyDegrees',
          meanAnomalyDegrees,
        ],
      ] as const
    ) {
      if (
        !Number.isFinite(
          value,
        ) ||
        value <
          0 ||
        value >=
          360
      ) {
        throw new RangeError(
          `${name} must be finite in [0, 360).`,
        );
      }
    }

    assertPositiveFinite(
      orbitalPeriodYears,
      'orbitalPeriodYears',
    );

    const expectedPeriodYears =
      Math.sqrt(
        semiMajorAxisAu **
          3 /
        gravitatingMassSolar,
      );

    if (
      !approximatelyEqual(
        orbitalPeriodYears,
        expectedPeriodYears,
      )
    ) {
      throw new RangeError(
        'Comet orbitalPeriodYears must satisfy the point-22.6 host-dominated Kepler relation.',
      );
    }

    if (
      periodRegime !==
      cometPeriodRegimeV1(
        orbitalPeriodYears,
      )
    ) {
      throw new RangeError(
        'Comet periodRegime must match the exact point-22.6 200-year classification.',
      );
    }
  }

  get periapsisAu():
    number {

    return (
      this.semiMajorAxisAu *
      (
        1 -
        this.eccentricity
      )
    );
  }

  get apoapsisAu():
    number {

    return (
      this.semiMajorAxisAu *
      (
        1 +
        this.eccentricity
      )
    );
  }
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
      `${label} must be positive and finite.`,
    );
  }
}

function approximatelyEqual(
  first:
    number,

  second:
    number,
): boolean {

  const scale =
    Math.max(
      1,
      Math.abs(
        first,
      ),
      Math.abs(
        second,
      ),
    );

  return Math.abs(
    first -
      second,
  ) <=
    CONSISTENCY_TOLERANCE *
      scale;
}
