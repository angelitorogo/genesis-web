import {
  CometActivityState,
} from '../../domain/planetary/comet-activity-state';

import {
  cometActivityRegimeV1,
} from '../../domain/planetary/comet-activity-regime';

import {
  type RelevantComet,
} from '../../domain/planetary/relevant-comet';

const DISTANCE_TOLERANCE_AU =
  1e-9;

const EQUILIBRIUM_TEMPERATURE_REFERENCE_KELVIN =
  278.33;

/**
 * Point-22.6 pure distance-dependent activity projection.
 *
 * The stellar reference luminosity converts physical AU into a solar-equivalent
 * irradiation distance. V1 then combines a water-ice support branch, dominant
 * in the warm inner system, with a weaker supervolatile branch that can survive
 * much farther out. No exact production rate, jet geometry, thermal lag or
 * volatile chemistry is claimed here.
 */
export class CometActivityEngine {

  private constructor() {}

  static evaluate(
    comet:
      RelevantComet,

    referenceLuminositySolar:
      number,

    distanceAu:
      number,
  ): CometActivityState {

    if (
      !Number.isFinite(
        referenceLuminositySolar,
      ) ||
      referenceLuminositySolar <=
        0
    ) {
      throw new RangeError(
        'CometActivityEngine requires a positive finite host reference luminosity.',
      );
    }

    if (
      !Number.isFinite(
        distanceAu,
      ) ||
      distanceAu <=
        0
    ) {
      throw new RangeError(
        'Comet activity distance must be positive and finite.',
      );
    }

    if (
      distanceAu <
        comet.orbit.periapsisAu -
          DISTANCE_TOLERANCE_AU ||
      distanceAu >
        comet.orbit.apoapsisAu +
          DISTANCE_TOLERANCE_AU
    ) {
      throw new RangeError(
        'Point-22.6 activity can only be evaluated at a distance reachable by the comet orbit.',
      );
    }

    const incidentFluxEarth =
      referenceLuminositySolar /
      distanceAu **
        2;

    const solarEquivalentDistanceAu =
      distanceAu /
      Math.sqrt(
        referenceLuminositySolar,
      );

    const waterIceActivitySupportIndex01 =
      waterIceActivitySupportV1(
        solarEquivalentDistanceAu,
      );

    const supervolatileActivitySupportIndex01 =
      supervolatileActivitySupportV1(
        solarEquivalentDistanceAu,
      );

    const diameterSupport =
      0.72 +
      0.28 *
        clamp01(
          Math.log1p(
            comet.diameterKilometers,
          ) /
          Math.log1p(
            50,
          ),
        );

    const activityIndex01 =
      clamp01(
        comet
          .nucleusProperties
          .volatileRichnessIndex01 *
        diameterSupport *
        (
          0.70 *
            waterIceActivitySupportIndex01 +
          0.30 *
            supervolatileActivitySupportIndex01
        ),
      );

    const equilibriumTemperatureKelvin =
      EQUILIBRIUM_TEMPERATURE_REFERENCE_KELVIN *
      (
        incidentFluxEarth *
        (
          1 -
          comet
            .nucleusProperties
            .geometricAlbedo
        )
      ) **
        0.25;

    return new CometActivityState(
      comet.cometOrdinal,
      distanceAu,
      referenceLuminositySolar,
      solarEquivalentDistanceAu,
      incidentFluxEarth,
      equilibriumTemperatureKelvin,
      waterIceActivitySupportIndex01,
      supervolatileActivitySupportIndex01,
      activityIndex01,
      cometActivityRegimeV1(
        activityIndex01,
      ),
      activityIndex01 >=
        0.04,
      activityIndex01 >=
        0.12,
      activityIndex01 >=
        0.28,
    );
  }
}

function waterIceActivitySupportV1(
  solarEquivalentDistanceAu:
    number,
): number {

  if (
    solarEquivalentDistanceAu <=
    1.5
  ) {
    return 1;
  }

  if (
    solarEquivalentDistanceAu >=
    4.5
  ) {
    return 0;
  }

  return clamp01(
    (
      4.5 -
      solarEquivalentDistanceAu
    ) /
    3,
  );
}

function supervolatileActivitySupportV1(
  solarEquivalentDistanceAu:
    number,
): number {

  if (
    solarEquivalentDistanceAu <=
    3
  ) {
    return 1;
  }

  if (
    solarEquivalentDistanceAu >=
    25
  ) {
    return 0;
  }

  return clamp01(
    (
      25 -
      solarEquivalentDistanceAu
    ) /
    22,
  );
}

function clamp01(
  value:
    number,
): number {

  return Math.min(
    1,
    Math.max(
      0,
      value,
    ),
  );
}
