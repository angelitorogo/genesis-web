export const FastRadioBurstSourceKind = Object.freeze({
  MAGNETAR: 'MAGNETAR',
  UNKNOWN_SOURCE: 'UNKNOWN_SOURCE',
  COMPACT_MERGER_NS_NS_CANDIDATE: 'COMPACT_MERGER_NS_NS_CANDIDATE',
} as const);

export type FastRadioBurstSourceKind =
  typeof FastRadioBurstSourceKind[keyof typeof FastRadioBurstSourceKind];

export const FastRadioBurstEngineState = Object.freeze({
  COHERENT_RADIO_BURST_CONFIRMED: 'COHERENT_RADIO_BURST_CONFIRMED',
  BURST_ENGINE_UNRESOLVED: 'BURST_ENGINE_UNRESOLVED',
} as const);

export type FastRadioBurstEngineState =
  typeof FastRadioBurstEngineState[keyof typeof FastRadioBurstEngineState];

export const FastRadioBurstRepetitionState = Object.freeze({
  REPEATING_CONFIRMED: 'REPEATING_CONFIRMED',
  REPETITION_UNRESOLVED: 'REPETITION_UNRESOLVED',
} as const);

export type FastRadioBurstRepetitionState =
  typeof FastRadioBurstRepetitionState[keyof typeof FastRadioBurstRepetitionState];

/**
 * 29.8 explicit source-frame input for an FRB-like coherent radio burst.
 *
 * A magnetar, neutron star or compact merger does not imply an FRB. A resolved
 * burst therefore requires the radio-emission state and intrinsic radio
 * properties to be supplied explicitly by a future canonical event model or by
 * this read-only laboratory.
 *
 * Dispersion measure is optional propagation information. It is never treated
 * as a distance estimator because the electron-density distribution is not
 * known here.
 */
export class FastRadioBurstSourceProfile {
  constructor(
    readonly sourceKind: FastRadioBurstSourceKind,
    readonly engineState: FastRadioBurstEngineState,
    readonly repetitionState: FastRadioBurstRepetitionState,
    readonly sourceFrameDurationSeconds: number | null,
    readonly centerFrequencyHz: number | null,
    readonly bandwidthHz: number | null,
    readonly dispersionMeasurePcCm3: number | null,
    readonly observerBandLowHz: number | null,
    readonly observerBandHighHz: number | null,
  ) {
    if (!Object.values(FastRadioBurstSourceKind).includes(sourceKind)) {
      throw new RangeError('Unsupported 29.8 FRB source kind.');
    }
    if (!Object.values(FastRadioBurstEngineState).includes(engineState)) {
      throw new RangeError('Unsupported 29.8 FRB engine state.');
    }
    if (!Object.values(FastRadioBurstRepetitionState).includes(repetitionState)) {
      throw new RangeError('Unsupported 29.8 FRB repetition state.');
    }

    const resolved =
      engineState === FastRadioBurstEngineState.COHERENT_RADIO_BURST_CONFIRMED;

    if (resolved) {
      assertRange(sourceFrameDurationSeconds, 1e-6, 10, 'sourceFrameDurationSeconds');
      assertRange(centerFrequencyHz, 1e7, 1e11, 'centerFrequencyHz');
      assertRange(bandwidthHz, 1e5, 1e11, 'bandwidthHz');
      if (bandwidthHz! >= 2 * centerFrequencyHz!) {
        throw new RangeError('bandwidthHz must leave a positive lower spectral edge.');
      }
    } else if (
      sourceFrameDurationSeconds !== null ||
      centerFrequencyHz !== null ||
      bandwidthHz !== null
    ) {
      throw new RangeError(
        'An unresolved 29.8 burst engine cannot fabricate duration or radio spectrum.',
      );
    }

    if (dispersionMeasurePcCm3 !== null) {
      assertRange(dispersionMeasurePcCm3, 0.001, 1e6, 'dispersionMeasurePcCm3');
      if (observerBandLowHz === null || observerBandHighHz === null) {
        throw new RangeError(
          'A dispersion-delay reference requires both observer-band edges.',
        );
      }
    }

    if ((observerBandLowHz === null) !== (observerBandHighHz === null)) {
      throw new RangeError('Observer-band edges must be supplied together.');
    }

    if (observerBandLowHz !== null && observerBandHighHz !== null) {
      assertRange(observerBandLowHz, 1e6, 1e11, 'observerBandLowHz');
      assertRange(observerBandHighHz, 1e6, 1e11, 'observerBandHighHz');
      if (observerBandHighHz <= observerBandLowHz) {
        throw new RangeError('observerBandHighHz must exceed observerBandLowHz.');
      }
      if (!resolved) {
        throw new RangeError(
          'An unresolved burst engine cannot expose an observer radio band.',
        );
      }
    }

    if (!resolved && repetitionState === FastRadioBurstRepetitionState.REPEATING_CONFIRMED) {
      throw new RangeError('Confirmed repetition requires an explicitly resolved burst engine.');
    }

    Object.freeze(this);
  }
}

function assertRange(
  value: number | null,
  min: number,
  max: number,
  name: string,
): asserts value is number {
  if (value === null || !Number.isFinite(value) || value < min || value > max) {
    throw new RangeError(`${name} must be finite and in [${min}, ${max}].`);
  }
}
