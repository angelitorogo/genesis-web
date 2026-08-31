import {
  AsteroidBeltRegion,
} from './asteroid-belt-region';

const CONSISTENCY_TOLERANCE =
  1e-12;

/**
 * Point-22.3 osculating-style V1 orbit for one relevant asteroid.
 *
 * The full radial excursion is constrained to remain inside the frozen point
 * 22.2 statistical belt interval. No resonance, close-encounter integration or
 * long-term N-body evolution is claimed here.
 */
export class AsteroidOrbitalElements {

  constructor(
    readonly beltRegion:
      AsteroidBeltRegion,

    readonly asteroidOrdinal:
      number,

    readonly sourceInnerEdgeAu:
      number,

    readonly sourceOuterEdgeAu:
      number,

    readonly sourcePeakAu:
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
  ) {
    if (
      !Object.values(
        AsteroidBeltRegion,
      ).includes(
        beltRegion,
      )
    ) {
      throw new RangeError(
        'beltRegion must be a known AsteroidBeltRegion.',
      );
    }

    if (
      !Number.isInteger(
        asteroidOrdinal,
      ) ||
      asteroidOrdinal <=
        0
    ) {
      throw new RangeError(
        'asteroidOrdinal must be a positive integer.',
      );
    }

    for (
      const [
        name,
        value,
      ] of [
        [
          'sourceInnerEdgeAu',
          sourceInnerEdgeAu,
        ],
        [
          'sourceOuterEdgeAu',
          sourceOuterEdgeAu,
        ],
        [
          'sourcePeakAu',
          sourcePeakAu,
        ],
        [
          'semiMajorAxisAu',
          semiMajorAxisAu,
        ],
      ] as const
    ) {
      if (
        !Number.isFinite(
          value,
        ) ||
        value <=
          0
      ) {
        throw new RangeError(
          `${name} must be positive and finite.`,
        );
      }
    }

    if (
      sourceInnerEdgeAu >=
        sourceOuterEdgeAu ||
      sourcePeakAu <
        sourceInnerEdgeAu ||
      sourcePeakAu >
        sourceOuterEdgeAu ||
      semiMajorAxisAu <
        sourceInnerEdgeAu ||
      semiMajorAxisAu >
        sourceOuterEdgeAu
    ) {
      throw new RangeError(
        'Point-22.3 asteroid orbit must preserve and remain inside its point-22.2 belt geometry.',
      );
    }

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
        'eccentricity must be finite in [0, 1).',
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

    if (
      this.periapsisAu <
        sourceInnerEdgeAu -
          CONSISTENCY_TOLERANCE ||
      this.apoapsisAu >
        sourceOuterEdgeAu +
          CONSISTENCY_TOLERANCE
    ) {
      throw new RangeError(
        'Point-22.3 asteroid apsides must remain inside the source belt interval.',
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
