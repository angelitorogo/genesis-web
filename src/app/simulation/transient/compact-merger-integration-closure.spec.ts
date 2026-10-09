import { CompactMergerCounterpartKind, CompactMergerMassBudgetResolution } from '../../domain/transient/compact-merger-event-profile';
import { CompactMergerProgenitorProfile } from '../../domain/transient/compact-merger-progenitor';
import { CompactMergerType } from '../../domain/transient/compact-merger-type';
import { CompactMergerEventEngine } from './compact-merger-event-engine';

describe('29.4 compact-merger integration closure', () => {
  it('keeps the three merger channels exact and separate from the 29.3 kilonova taxonomy', () => {
    expect(Object.values(CompactMergerType)).toEqual(['NS_NS', 'NS_BH', 'BH_BH']);
  });

  it('does not leak 29.5 waveform observables into the 29.4 canonical event profile', () => {
    const profile = CompactMergerEventEngine.deriveProfile(new CompactMergerProgenitorProfile(
      CompactMergerType.BLACK_HOLE_BLACK_HOLE,
      32,
      27,
      null,
      0.003,
      0.03,
      8e8,
    ));

    expect(profile.counterpartKind).toBe(
      CompactMergerCounterpartKind.NO_PROMPT_ELECTROMAGNETIC_COUNTERPART_EXPECTED,
    );
    expect(profile.massBudgetResolution).toBe(
      CompactMergerMassBudgetResolution.BH_SPIN_UNRESOLVED,
    );
    expect('strain' in profile).toBe(false);
    expect('waveform' in profile).toBe(false);
    expect('frequencyHz' in profile).toBe(false);
  });
});
