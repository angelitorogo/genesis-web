import {
  type CometActivityRegime,
  cometActivityRegimeV1,
} from './comet-activity-regime';

/**
 * Point-22.6 distance-specific activity projection for one frozen comet.
 *
 * `activityIndex01` and the water/supervolatile supports are comparative model
 * indices only. They are not exact gas/dust production rates. The state is
 * intentionally evaluated on demand because one comet traverses a wide radial
 * range during its orbit.
 */
export class CometActivityState {

  constructor(
    readonly cometOrdinal:
      number,

    readonly sourceDistanceAu:
      number,

    readonly sourceReferenceLuminositySolar:
      number,

    readonly solarEquivalentDistanceAu:
      number,

    readonly incidentFluxEarth:
      number,

    readonly equilibriumTemperatureKelvin:
      number,

    readonly waterIceActivitySupportIndex01:
      number,

    readonly supervolatileActivitySupportIndex01:
      number,

    readonly activityIndex01:
      number,

    readonly activityRegime:
      CometActivityRegime,

    readonly hasComa:
      boolean,

    readonly hasDustTail:
      boolean,

    readonly hasIonTail:
      boolean,
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

    for (
      const [
        name,
        value,
      ] of [
        [
          'sourceDistanceAu',
          sourceDistanceAu,
        ],
        [
          'sourceReferenceLuminositySolar',
          sourceReferenceLuminositySolar,
        ],
        [
          'solarEquivalentDistanceAu',
          solarEquivalentDistanceAu,
        ],
        [
          'incidentFluxEarth',
          incidentFluxEarth,
        ],
        [
          'equilibriumTemperatureKelvin',
          equilibriumTemperatureKelvin,
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

    for (
      const [
        name,
        value,
      ] of [
        [
          'waterIceActivitySupportIndex01',
          waterIceActivitySupportIndex01,
        ],
        [
          'supervolatileActivitySupportIndex01',
          supervolatileActivitySupportIndex01,
        ],
        [
          'activityIndex01',
          activityIndex01,
        ],
      ] as const
    ) {
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
          `${name} must be inside [0, 1].`,
        );
      }
    }

    if (
      activityRegime !==
      cometActivityRegimeV1(
        activityIndex01,
      )
    ) {
      throw new RangeError(
        'activityRegime must match the frozen point-22.6 activity thresholds.',
      );
    }

    if (
      hasComa !==
        (
          activityIndex01 >=
          0.04
        ) ||
      hasDustTail !==
        (
          activityIndex01 >=
          0.12
        ) ||
      hasIonTail !==
        (
          activityIndex01 >=
          0.28
        )
    ) {
      throw new RangeError(
        'Comet activity morphology flags must match the point-22.6 normalized activity index.',
      );
    }
  }
}
