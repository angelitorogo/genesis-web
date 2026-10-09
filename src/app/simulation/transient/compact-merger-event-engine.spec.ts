import { CompactMergerCounterpartKind, CompactMergerMassBudgetResolution } from '../../domain/transient/compact-merger-event-profile';
import { CompactMergerProgenitorProfile } from '../../domain/transient/compact-merger-progenitor';
import { CompactMergerType } from '../../domain/transient/compact-merger-type';
import { KilonovaProgenitorProfile } from '../../domain/transient/kilonova-progenitor';
import { KilonovaType } from '../../domain/transient/kilonova-type';
import { KilonovaEventEngine } from './kilonova-event-engine';
import { CompactMergerEventEngine } from './compact-merger-event-engine';

describe('29.4 CompactMergerEventEngine', () => {
  it('reuses the validated 29.3 NS-NS mass budget exactly instead of deriving a second incompatible remnant', () => {
    const mergerProgenitor = new CompactMergerProgenitorProfile(
      CompactMergerType.NEUTRON_STAR_NEUTRON_STAR, 1.38, 1.27, 12.1, 0.0018, 0.08, 2e8,
    );
    const merger = CompactMergerEventEngine.deriveProfile(mergerProgenitor);
    const kilonova = KilonovaEventEngine.deriveProfile(new KilonovaProgenitorProfile(
      KilonovaType.BINARY_NEUTRON_STAR, 1.38, 1.27, 12.1, 0.0018, 0.08, 2e8, null, null,
    ));
    expect(merger.massBudgetResolution).toBe(CompactMergerMassBudgetResolution.NS_NS_KILONOVA_CONSTRAINED);
    expect(merger.remnantMassSolar).toBe(kilonova.remnantMassSolar);
    expect(merger.resolvedMatterEjectaMassSolar).toBe(kilonova.totalEjectaMassSolar);
    expect(merger.remnantMassSolar! + merger.resolvedMatterEjectaMassSolar! + merger.resolvedRadiatedMassSolar!)
      .toBeCloseTo(merger.totalMassSolar, 12);
  });

  it('models NS-BH as a canonical merger without fabricating the Kerr spin needed to decide its kilonova', () => {
    const profile = CompactMergerEventEngine.deriveProfile(new CompactMergerProgenitorProfile(
      CompactMergerType.NEUTRON_STAR_BLACK_HOLE, 1.42, 8.6, 12.2, 0.0018, 0.04, 5e7,
    ));
    expect(profile.counterpartKind).toBe(CompactMergerCounterpartKind.KILONOVA_TIDAL_DISRUPTION_UNRESOLVED);
    expect(profile.massBudgetResolution).toBe(CompactMergerMassBudgetResolution.BH_SPIN_UNRESOLVED);
    expect(profile.remnantMassSolar).toBeNull();
    expect(profile.resolvedMatterEjectaMassSolar).toBeNull();
    expect(profile.resolvedRadiatedMassSolar).toBeNull();
  });

  it('keeps BH-BH electromagnetically dark and does not invent matter ejecta or a final spin-dependent mass', () => {
    const profile = CompactMergerEventEngine.deriveProfile(new CompactMergerProgenitorProfile(
      CompactMergerType.BLACK_HOLE_BLACK_HOLE, 32, 27, null, 0.003, 0.03, 8e8,
    ));
    expect(profile.counterpartKind).toBe(CompactMergerCounterpartKind.NO_PROMPT_ELECTROMAGNETIC_COUNTERPART_EXPECTED);
    expect(profile.remnantMassSolar).toBeNull();
    expect(profile.resolvedMatterEjectaMassSolar).toBeNull();
    expect(profile.chirpMassSolar).toBeGreaterThan(20);
    expect(profile.symmetricMassRatio).toBeLessThanOrEqual(0.25);
  });
});
