import { describe, expect, it } from 'vitest';
import { FastRadioBurstOutcome } from '../../domain/transient/fast-radio-burst-event-profile';
import {
  FastRadioBurstEngineState,
  FastRadioBurstRepetitionState,
  FastRadioBurstSourceKind,
  FastRadioBurstSourceProfile,
} from '../../domain/transient/fast-radio-burst-source-profile';
import { FastRadioBurstEventEngine } from './fast-radio-burst-event-engine';

describe('FastRadioBurstEventEngine 29.8', () => {
  it('derives only intrinsic radio scales from an explicitly resolved magnetar burst', () => {
    const profile = FastRadioBurstEventEngine.characterize(new FastRadioBurstSourceProfile(
      FastRadioBurstSourceKind.MAGNETAR,
      FastRadioBurstEngineState.COHERENT_RADIO_BURST_CONFIRMED,
      FastRadioBurstRepetitionState.REPETITION_UNRESOLVED,
      0.0012,
      1.4e9,
      400e6,
      null,
      null,
      null,
    ));

    expect(profile.outcome).toBe(FastRadioBurstOutcome.INTRINSIC_COHERENT_RADIO_BURST);
    expect(profile.wavelengthMeters).toBeCloseTo(0.21413747, 7);
    expect(profile.fractionalBandwidth).toBeCloseTo(2 / 7, 10);
    expect(profile.lightCrossingUpperScaleMeters).toBeCloseTo(359_750.9496, 3);
    expect(profile.coldPlasmaDispersionDelaySeconds).toBeNull();
    expect(profile.observedFluenceJoulesPerSquareMeter).toBeNull();
    expect(profile.isotropicEquivalentRadioEnergyJoules).toBeNull();
  });

  it('derives a cold-plasma sweep only when DM and observer band are explicit', () => {
    const profile = FastRadioBurstEventEngine.characterize(new FastRadioBurstSourceProfile(
      FastRadioBurstSourceKind.UNKNOWN_SOURCE,
      FastRadioBurstEngineState.COHERENT_RADIO_BURST_CONFIRMED,
      FastRadioBurstRepetitionState.REPETITION_UNRESOLVED,
      0.002,
      1.35e9,
      300e6,
      560,
      1.2e9,
      1.5e9,
    ));

    expect(profile.coldPlasmaDispersionDelaySeconds).toBeCloseTo(0.58083312, 7);
    expect(profile.luminosityDistanceParsec).toBeNull();
    expect(profile.sourceRedshift).toBeNull();
  });

  it('keeps confirmed repetition distinct from a fabricated periodic recurrence', () => {
    const profile = FastRadioBurstEventEngine.characterize(new FastRadioBurstSourceProfile(
      FastRadioBurstSourceKind.MAGNETAR,
      FastRadioBurstEngineState.COHERENT_RADIO_BURST_CONFIRMED,
      FastRadioBurstRepetitionState.REPEATING_CONFIRMED,
      0.003,
      1.3e9,
      600e6,
      null,
      null,
      null,
    ));

    expect(profile.source.repetitionState).toBe(FastRadioBurstRepetitionState.REPEATING_CONFIRMED);
    expect(profile.repetitionPeriodSeconds).toBeNull();
  });

  it('does not turn an NS-NS merger candidate into an FRB without an explicit burst engine', () => {
    const profile = FastRadioBurstEventEngine.characterize(new FastRadioBurstSourceProfile(
      FastRadioBurstSourceKind.COMPACT_MERGER_NS_NS_CANDIDATE,
      FastRadioBurstEngineState.BURST_ENGINE_UNRESOLVED,
      FastRadioBurstRepetitionState.REPETITION_UNRESOLVED,
      null,
      null,
      null,
      null,
      null,
      null,
    ));

    expect(profile.outcome).toBe(FastRadioBurstOutcome.BURST_ENGINE_UNRESOLVED);
    expect(profile.wavelengthMeters).toBeNull();
    expect(profile.coldPlasmaDispersionDelaySeconds).toBeNull();
  });
});
