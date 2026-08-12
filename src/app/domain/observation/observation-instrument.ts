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
  type ObservationSession,
  type Observatory,
} from './observatory';

/**
 * Canonical V1 observation-instrument families.
 *
 * SPECTROSCOPY is deliberately represented as an observational
 * instrument/technique family for gameplay. It is NOT modeled as an
 * independent electromagnetic band.
 *
 * GRAVITATIONAL_WAVE represents detection through a non-electromagnetic
 * physical messenger.
 */
export enum ObservationInstrumentType {
  OPTICAL =
    'OPTICAL',

  INFRARED =
    'INFRARED',

  RADIO =
    'RADIO',

  SPECTROSCOPY =
    'SPECTROSCOPY',

  X_RAY =
    'X_RAY',

  GAMMA_RAY =
    'GAMMA_RAY',

  GRAVITATIONAL_WAVE =
    'GRAVITATIONAL_WAVE',
}

/**
 * Broad scientific category of a V1 observation instrument family.
 */
export enum ObservationInstrumentKind {
  ELECTROMAGNETIC_BAND =
    'ELECTROMAGNETIC_BAND',

  SPECTROSCOPIC_TECHNIQUE =
    'SPECTROSCOPIC_TECHNIQUE',

  GRAVITATIONAL_WAVE_DETECTOR =
    'GRAVITATIONAL_WAVE_DETECTOR',
}

/**
 * Minimal immutable definition of one V1 observation instrument family.
 *
 * Point 8.2 intentionally contains only type and kind.
 *
 * It does NOT yet contain:
 * - display labels;
 * - level/tier/upgrade information;
 * - unlock/availability state;
 * - sensitivity;
 * - precision;
 * - reach;
 * - wavelength ranges;
 * - noise/SNR;
 * - scientific capabilities.
 */
export class ObservationInstrument {

  constructor(
    readonly type:
      ObservationInstrumentType,

    readonly kind:
      ObservationInstrumentKind,
  ) {
    if (
      !Object.values(
        ObservationInstrumentType,
      ).includes(
        type,
      )
    ) {
      throw new RangeError(
        `Unknown ObservationInstrumentType: ${String(type)}.`,
      );
    }

    if (
      !Object.values(
        ObservationInstrumentKind,
      ).includes(
        kind,
      )
    ) {
      throw new RangeError(
        `Unknown ObservationInstrumentKind: ${String(kind)}.`,
      );
    }
  }
}

/**
 * Point-8.2 observational session obtained by composing the base 8.1
 * ObservationSession with one selected instrument family.
 *
 * Selecting an instrument does NOT mean that a signal was detected.
 * No measurement, result, certainty, uncertainty or noise is produced here.
 */
export class InstrumentObservationSession {

  constructor(
    readonly baseSession:
      ObservationSession,

    readonly instrument:
      ObservationInstrument,
  ) {}

  get observatory():
    Observatory {

    return this
      .baseSession
      .observatory;
  }

  get generationKey():
    UniverseGenerationKey {

    return this
      .baseSession
      .generationKey;
  }

  get targetLocator():
    ProceduralLocator {

    return this
      .baseSession
      .targetLocator;
  }

  get targetKnowledgeState():
    DiscoveryStateValue {

    return this
      .baseSession
      .targetKnowledgeState;
  }

  get instrumentType():
    ObservationInstrumentType {

    return this
      .instrument
      .type;
  }
}
