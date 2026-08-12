import {
  ObservationInstrumentLevel,
} from '../../domain/observation/observation-instrument-capability';

import {
  MeasurementUncertaintyProfile,
} from '../../domain/observation/observation-measurement-uncertainty';

import {
  ObservationInstrumentCapabilityCatalogV1,
} from './observation-instrument-capability-catalog';

const PROFILES:
  readonly MeasurementUncertaintyProfile[] =
  Object.freeze([
    new MeasurementUncertaintyProfile(
      ObservationInstrumentLevel
        .LEVEL_1,
      0.20,
    ),

    new MeasurementUncertaintyProfile(
      ObservationInstrumentLevel
        .LEVEL_2,
      0.10,
    ),

    new MeasurementUncertaintyProfile(
      ObservationInstrumentLevel
        .LEVEL_3,
      0.05,
    ),

    new MeasurementUncertaintyProfile(
      ObservationInstrumentLevel
        .LEVEL_4,
      0.02,
    ),

    new MeasurementUncertaintyProfile(
      ObservationInstrumentLevel
        .LEVEL_5,
      0.01,
    ),
  ]);

validateV1UncertaintyCatalog();

/**
 * Frozen deterministic V1 scalar-measurement uncertainty catalog.
 *
 * The same generic normalized quantization curve is deliberately reused across
 * all seven instrument families. A future physical measurement model supplies
 * the referenceScale appropriate to the actual magnitude and instrument.
 */
export class ObservationMeasurementUncertaintyCatalogV1 {

  private constructor() {}

  static readonly profiles =
    PROFILES;

  static profile(
    level:
      ObservationInstrumentLevel,
  ): MeasurementUncertaintyProfile {

    const profile =
      PROFILES
        .find(
          (
            candidate,
          ) =>
            candidate.level ===
            level,
        );

    if (
      profile ===
      undefined
    ) {
      throw new RangeError(
        'Unsupported ObservationInstrumentLevel.',
      );
    }

    return profile;
  }
}

function validateV1UncertaintyCatalog():
  void {

  const supportedLevels =
    ObservationInstrumentCapabilityCatalogV1
      .supportedLevels;

  if (
    PROFILES.length !==
      5 ||
    PROFILES.length !==
      supportedLevels.length
  ) {
    throw new Error(
      'V1 measurement uncertainty catalog must contain exactly five profiles.',
    );
  }

  if (
    new Set(
      PROFILES
        .map(
          (
            profile,
          ) =>
            profile.level,
        ),
    ).size !==
    PROFILES.length
  ) {
    throw new Error(
      'V1 measurement uncertainty levels cannot contain duplicates.',
    );
  }

  for (
    let index =
      0;
    index <
      PROFILES.length;
    index +=
      1
  ) {
    if (
      PROFILES[
        index
      ].level !==
      supportedLevels[
        index
      ]
    ) {
      throw new Error(
        'V1 measurement uncertainty profiles must follow the canonical 8.3 level order.',
      );
    }

    if (
      index >
      0 &&
      PROFILES[
        index
      ].quantizationFraction >=
      PROFILES[
        index -
          1
      ].quantizationFraction
    ) {
      throw new Error(
        'V1 quantization fractions must decrease strictly with instrument level.',
      );
    }
  }

  if (
    PROFILES[
      PROFILES.length -
        1
    ].quantizationFraction !==
    0.01
  ) {
    throw new Error(
      'V1 LEVEL_5 quantization fraction must remain exactly 0.01.',
    );
  }
}
