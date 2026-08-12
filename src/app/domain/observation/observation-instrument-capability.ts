import {
  type DiscoveryStateValue,
} from '../discovery/discovery-state';

import {
  type ProceduralLocator,
} from '../generation/procedural-locator';

import {
  type UniverseGenerationKey,
} from '../generation/universe-generation-key';

import {
  type InstrumentObservationSession,
  type ObservationInstrument,
  ObservationInstrumentType,
} from './observation-instrument';

import {
  type ObservationSession,
  type Observatory,
} from './observatory';

/**
 * Canonical V1 instrument maturity levels.
 *
 * rank is explicit and must never be inferred from declaration order.
 */
export class ObservationInstrumentLevel {

  static readonly LEVEL_1 =
    Object.freeze(
      new ObservationInstrumentLevel(
        'LEVEL_1',
        1,
      ),
    );

  static readonly LEVEL_2 =
    Object.freeze(
      new ObservationInstrumentLevel(
        'LEVEL_2',
        2,
      ),
    );

  static readonly LEVEL_3 =
    Object.freeze(
      new ObservationInstrumentLevel(
        'LEVEL_3',
        3,
      ),
    );

  static readonly LEVEL_4 =
    Object.freeze(
      new ObservationInstrumentLevel(
        'LEVEL_4',
        4,
      ),
    );

  static readonly LEVEL_5 =
    Object.freeze(
      new ObservationInstrumentLevel(
        'LEVEL_5',
        5,
      ),
    );

  static readonly values:
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

  private constructor(
    readonly name:
      string,

    readonly rank:
      number,
  ) {}

  static fromRank(
    rank:
      number,
  ): ObservationInstrumentLevel {

    const level =
      ObservationInstrumentLevel
        .values
        .find(
          (
            candidate,
          ) =>
            candidate.rank ===
            rank,
        );

    if (
      level ===
      undefined
    ) {
      throw new RangeError(
        `Unsupported ObservationInstrumentLevel rank: ${rank}.`,
      );
    }

    return level;
  }
}

/**
 * Relative V1 capability attached to one instrument maturity level.
 *
 * All three values are dimensionless normalized coefficients in [0, 1].
 * They express relative maturity only within an instrument family.
 *
 * They are NOT:
 * - physical units;
 * - distances;
 * - fluxes;
 * - angular/spectral resolutions;
 * - detection probabilities;
 * - certainty values.
 */
export class InstrumentLevelCapability {

  constructor(
    readonly level:
      ObservationInstrumentLevel,

    readonly normalizedSensitivity:
      number,

    readonly normalizedPrecision:
      number,

    readonly normalizedReach:
      number,
  ) {
    if (
      !ObservationInstrumentLevel
        .values
        .includes(
          level,
        )
    ) {
      throw new RangeError(
        'level must be a canonical ObservationInstrumentLevel.',
      );
    }

    assertNormalized(
      normalizedSensitivity,
      'normalizedSensitivity',
    );

    assertNormalized(
      normalizedPrecision,
      'normalizedPrecision',
    );

    assertNormalized(
      normalizedReach,
      'normalizedReach',
    );
  }
}

/**
 * Capability profile for one concrete 8.2 instrument family at one 8.3 level.
 */
export class InstrumentCapabilityProfile {

  constructor(
    readonly instrumentType:
      ObservationInstrumentType,

    readonly levelCapability:
      InstrumentLevelCapability,
  ) {
    if (
      !Object.values(
        ObservationInstrumentType,
      ).includes(
        instrumentType,
      )
    ) {
      throw new RangeError(
        `Unknown ObservationInstrumentType: ${String(instrumentType)}.`,
      );
    }
  }

  get level():
    ObservationInstrumentLevel {

    return this
      .levelCapability
      .level;
  }

  get normalizedSensitivity():
    number {

    return this
      .levelCapability
      .normalizedSensitivity;
  }

  get normalizedPrecision():
    number {

    return this
      .levelCapability
      .normalizedPrecision;
  }

  get normalizedReach():
    number {

    return this
      .levelCapability
      .normalizedReach;
  }
}

/**
 * Point-8.3 session created by composing:
 *
 * - ObservationSession from 8.1;
 * - InstrumentObservationSession from 8.2;
 * - InstrumentCapabilityProfile from 8.3.
 *
 * No measurement or signal is produced. Reach does not filter a target,
 * sensitivity does not detect a signal and precision does not imply certainty.
 */
export class LeveledInstrumentObservationSession {

  constructor(
    readonly instrumentSession:
      InstrumentObservationSession,

    readonly capabilityProfile:
      InstrumentCapabilityProfile,
  ) {
    if (
      instrumentSession
        .instrumentType !==
      capabilityProfile
        .instrumentType
    ) {
      throw new RangeError(
        'instrumentSession.instrumentType must match capabilityProfile.instrumentType.',
      );
    }
  }

  get baseSession():
    ObservationSession {

    return this
      .instrumentSession
      .baseSession;
  }

  get observatory():
    Observatory {

    return this
      .instrumentSession
      .observatory;
  }

  get generationKey():
    UniverseGenerationKey {

    return this
      .instrumentSession
      .generationKey;
  }

  get targetLocator():
    ProceduralLocator {

    return this
      .instrumentSession
      .targetLocator;
  }

  get targetKnowledgeState():
    DiscoveryStateValue {

    return this
      .instrumentSession
      .targetKnowledgeState;
  }

  get instrument():
    ObservationInstrument {

    return this
      .instrumentSession
      .instrument;
  }

  get instrumentType():
    ObservationInstrumentType {

    return this
      .instrumentSession
      .instrumentType;
  }

  get level():
    ObservationInstrumentLevel {

    return this
      .capabilityProfile
      .level;
  }

  get normalizedSensitivity():
    number {

    return this
      .capabilityProfile
      .normalizedSensitivity;
  }

  get normalizedPrecision():
    number {

    return this
      .capabilityProfile
      .normalizedPrecision;
  }

  get normalizedReach():
    number {

    return this
      .capabilityProfile
      .normalizedReach;
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
