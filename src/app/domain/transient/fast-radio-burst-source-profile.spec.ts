import { describe, expect, it } from 'vitest';
import {
  FastRadioBurstEngineState,
  FastRadioBurstRepetitionState,
  FastRadioBurstSourceKind,
  FastRadioBurstSourceProfile,
} from './fast-radio-burst-source-profile';

describe('FastRadioBurstSourceProfile 29.8', () => {
  it('requires explicit intrinsic radio properties for a resolved burst', () => {
    expect(() => new FastRadioBurstSourceProfile(
      FastRadioBurstSourceKind.MAGNETAR,
      FastRadioBurstEngineState.COHERENT_RADIO_BURST_CONFIRMED,
      FastRadioBurstRepetitionState.REPETITION_UNRESOLVED,
      null,
      null,
      null,
      null,
      null,
      null,
    )).toThrow();
  });

  it('prevents an unresolved engine from fabricating a radio spectrum', () => {
    expect(() => new FastRadioBurstSourceProfile(
      FastRadioBurstSourceKind.COMPACT_MERGER_NS_NS_CANDIDATE,
      FastRadioBurstEngineState.BURST_ENGINE_UNRESOLVED,
      FastRadioBurstRepetitionState.REPETITION_UNRESOLVED,
      0.001,
      1.4e9,
      300e6,
      null,
      null,
      null,
    )).toThrow();
  });

  it('does not accept a DM delay reference without both observing-band edges', () => {
    expect(() => new FastRadioBurstSourceProfile(
      FastRadioBurstSourceKind.UNKNOWN_SOURCE,
      FastRadioBurstEngineState.COHERENT_RADIO_BURST_CONFIRMED,
      FastRadioBurstRepetitionState.REPETITION_UNRESOLVED,
      0.002,
      1.35e9,
      300e6,
      560,
      1.2e9,
      null,
    )).toThrow();
  });
});
