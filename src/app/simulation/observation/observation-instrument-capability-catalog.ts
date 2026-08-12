import {
  ObservationInstrumentType,
} from '../../domain/observation/observation-instrument';

import {
  InstrumentCapabilityProfile,
  InstrumentLevelCapability,
  ObservationInstrumentLevel,
} from '../../domain/observation/observation-instrument-capability';

import {
  ObservationInstrumentCatalogV1,
} from './observation-instrument-catalog';

const SUPPORTED_LEVELS:
  readonly ObservationInstrumentLevel[] =
  Object.freeze([
    ObservationInstrumentLevel
      .LEVEL_1,
    ObservationInstrumentLevel
      .LEVEL_2,
    ObservationInstrumentLevel
      .LEVEL_3,
    ObservationInstrumentLevel
      .LEVEL_4,
    ObservationInstrumentLevel
      .LEVEL_5,
  ]);

const LEVEL_CAPABILITIES:
  readonly InstrumentLevelCapability[] =
  Object.freeze([
    new InstrumentLevelCapability(
      ObservationInstrumentLevel
        .LEVEL_1,
      0.20,
      0.25,
      0.15,
    ),

    new InstrumentLevelCapability(
      ObservationInstrumentLevel
        .LEVEL_2,
      0.40,
      0.45,
      0.32,
    ),

    new InstrumentLevelCapability(
      ObservationInstrumentLevel
        .LEVEL_3,
      0.60,
      0.65,
      0.52,
    ),

    new InstrumentLevelCapability(
      ObservationInstrumentLevel
        .LEVEL_4,
      0.80,
      0.82,
      0.74,
    ),

    new InstrumentLevelCapability(
      ObservationInstrumentLevel
        .LEVEL_5,
      1.00,
      1.00,
      1.00,
    ),
  ]);

validateV1CapabilityTable();

const ALL_PROFILES:
  readonly InstrumentCapabilityProfile[] =
  Object.freeze(
    ObservationInstrumentCatalogV1
      .supportedInstrumentTypes
      .flatMap(
        (
          instrumentType,
        ) =>
          LEVEL_CAPABILITIES
            .map(
              (
                levelCapability,
              ) =>
                new InstrumentCapabilityProfile(
                  instrumentType,
                  levelCapability,
                ),
            ),
      ),
  );

/**
 * Frozen, pure V1 capability catalog.
 *
 * The same normalized maturity curve is intentionally reused for all seven
 * instrument families. Equal coefficients across families do NOT imply equal
 * physical performance.
 */
export class ObservationInstrumentCapabilityCatalogV1 {

  private constructor() {}

  static readonly supportedLevels =
    SUPPORTED_LEVELS;

  static readonly levelCapabilities =
    LEVEL_CAPABILITIES;

  static readonly allProfiles =
    ALL_PROFILES;

  static capabilityForLevel(
    level:
      ObservationInstrumentLevel,
  ): InstrumentLevelCapability {

    const capability =
      LEVEL_CAPABILITIES
        .find(
          (
            candidate,
          ) =>
            candidate.level ===
            level,
        );

    if (
      capability ===
      undefined
    ) {
      throw new RangeError(
        'Unsupported ObservationInstrumentLevel.',
      );
    }

    return capability;
  }

  static profile(
    instrumentType:
      ObservationInstrumentType,

    level:
      ObservationInstrumentLevel,
  ): InstrumentCapabilityProfile {

    ObservationInstrumentCatalogV1
      .instrument(
        instrumentType,
      );

    return new InstrumentCapabilityProfile(
      instrumentType,
      this.capabilityForLevel(
        level,
      ),
    );
  }

  static profilesForInstrument(
    instrumentType:
      ObservationInstrumentType,
  ): readonly InstrumentCapabilityProfile[] {

    ObservationInstrumentCatalogV1
      .instrument(
        instrumentType,
      );

    return Object.freeze(
      LEVEL_CAPABILITIES
        .map(
          (
            levelCapability,
          ) =>
            new InstrumentCapabilityProfile(
              instrumentType,
              levelCapability,
            ),
        ),
    );
  }

  static nextLevel(
    level:
      ObservationInstrumentLevel,
  ): ObservationInstrumentLevel | null {

    if (
      level ===
      ObservationInstrumentLevel
        .LEVEL_1
    ) {
      return ObservationInstrumentLevel
        .LEVEL_2;
    }

    if (
      level ===
      ObservationInstrumentLevel
        .LEVEL_2
    ) {
      return ObservationInstrumentLevel
        .LEVEL_3;
    }

    if (
      level ===
      ObservationInstrumentLevel
        .LEVEL_3
    ) {
      return ObservationInstrumentLevel
        .LEVEL_4;
    }

    if (
      level ===
      ObservationInstrumentLevel
        .LEVEL_4
    ) {
      return ObservationInstrumentLevel
        .LEVEL_5;
    }

    if (
      level ===
      ObservationInstrumentLevel
        .LEVEL_5
    ) {
      return null;
    }

    throw new RangeError(
      'Unsupported ObservationInstrumentLevel.',
    );
  }
}

function validateV1CapabilityTable():
  void {

  if (
    SUPPORTED_LEVELS.length !==
      5 ||
    LEVEL_CAPABILITIES.length !==
      5
  ) {
    throw new Error(
      'V1 instrument capability catalog must contain exactly five levels.',
    );
  }

  if (
    new Set(
      SUPPORTED_LEVELS,
    ).size !==
    SUPPORTED_LEVELS.length
  ) {
    throw new Error(
      'V1 instrument capability levels cannot contain duplicates.',
    );
  }

  for (
    let index =
      0;
    index <
      SUPPORTED_LEVELS.length;
    index +=
      1
  ) {
    const level =
      SUPPORTED_LEVELS[
        index
      ];

    const capability =
      LEVEL_CAPABILITIES[
        index
      ];

    if (
      level.rank !==
        index +
          1 ||
      capability.level !==
        level
    ) {
      throw new Error(
        'V1 instrument capability levels must preserve canonical ranks 1 through 5.',
      );
    }

    if (
      index >
      0
    ) {
      const previous =
        LEVEL_CAPABILITIES[
          index -
            1
        ];

      if (
        capability
          .normalizedSensitivity <=
          previous
            .normalizedSensitivity ||
        capability
          .normalizedPrecision <=
          previous
            .normalizedPrecision ||
        capability
          .normalizedReach <=
          previous
            .normalizedReach
      ) {
        throw new Error(
          'V1 instrument capability metrics must increase strictly with level.',
        );
      }
    }
  }

  const maximum =
    LEVEL_CAPABILITIES[
      LEVEL_CAPABILITIES.length -
        1
    ];

  if (
    maximum.normalizedSensitivity !==
      1.0 ||
    maximum.normalizedPrecision !==
      1.0 ||
    maximum.normalizedReach !==
      1.0
  ) {
    throw new Error(
      'V1 LEVEL_5 capability must be exactly 1.0 for all normalized metrics.',
    );
  }

  if (
    ObservationInstrumentCatalogV1
      .supportedInstrumentTypes
      .length !==
      7
  ) {
    throw new Error(
      'V1 capability catalog requires exactly the seven point-8.2 instrument families.',
    );
  }
}
