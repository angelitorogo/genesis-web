import { CompactMergerProgenitorProfile } from '../../domain/transient/compact-merger-progenitor';
import { CompactMergerType } from '../../domain/transient/compact-merger-type';
import { CompactMergerEventEngine } from './compact-merger-event-engine';
import { GravitationalWaveEventEngine } from './gravitational-wave-event-engine';

describe('29.5 gravitational-wave integration closure', () => {
  it('keeps 29.4 as the canonical merger and derives 29.5 as a non-persisted scientific projection', () => {
    const merger = CompactMergerEventEngine.deriveProfile(new CompactMergerProgenitorProfile(
      CompactMergerType.BLACK_HOLE_BLACK_HOLE,
      32,
      27,
      null,
      0.014,
      0.03,
      6.8e8,
    ));
    const waves = GravitationalWaveEventEngine.deriveProfile(merger);

    expect(waves.sourceMerger).toBe(merger);
    expect(waves.mergerType).toBe(CompactMergerType.BLACK_HOLE_BLACK_HOLE);
    expect('eventKey' in waves).toBe(false);
    expect('version' in waves).toBe(false);
  });

  it('does not cross the observer boundary without distance/redshift/orientation data', () => {
    const merger = CompactMergerEventEngine.deriveProfile(new CompactMergerProgenitorProfile(
      CompactMergerType.NEUTRON_STAR_NEUTRON_STAR,
      1.38,
      1.27,
      12.1,
      0.006778517936238559,
      0.08,
      1.4e8,
    ));
    const waves = GravitationalWaveEventEngine.deriveProfile(merger);

    expect(waves.observedStrain).toBeNull();
    expect(waves.observerFrameFrequencyHz).toBeNull();
    expect(waves.luminosityDistanceParsec).toBeNull();
    expect(waves.sourceRedshift).toBeNull();
  });
});
