import { describe, expect, it } from 'vitest';
import { FastRadioBurstOutcome } from '../../domain/transient/fast-radio-burst-event-profile';
import {
  FastRadioBurstEngineState,
  FastRadioBurstRepetitionState,
  FastRadioBurstSourceKind,
  FastRadioBurstSourceProfile,
} from '../../domain/transient/fast-radio-burst-source-profile';
import { FastRadioBurstEventEngine } from './fast-radio-burst-event-engine';

describe('29.8 FRB integration closure', () => {
  it('does not promote a magnetar classification itself into a burst event', () => {
    const magnetarWithoutExplicitBurst = new FastRadioBurstSourceProfile(
      FastRadioBurstSourceKind.MAGNETAR,
      FastRadioBurstEngineState.BURST_ENGINE_UNRESOLVED,
      FastRadioBurstRepetitionState.REPETITION_UNRESOLVED,
      null,
      null,
      null,
      null,
      null,
      null,
    );

    expect(FastRadioBurstEventEngine.characterize(magnetarWithoutExplicitBurst).outcome)
      .toBe(FastRadioBurstOutcome.BURST_ENGINE_UNRESOLVED);
  });

  it('keeps DM as propagation information rather than converting it to distance or energy', () => {
    const event = FastRadioBurstEventEngine.characterize(new FastRadioBurstSourceProfile(
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

    expect(event.coldPlasmaDispersionDelaySeconds).not.toBeNull();
    expect(event.luminosityDistanceParsec).toBeNull();
    expect(event.isotropicEquivalentRadioEnergyJoules).toBeNull();
    expect(event.observedPeakFluxWattsPerSquareMeter).toBeNull();
  });
});
