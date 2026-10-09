import { KilonovaProgenitorProfile } from '../../domain/transient/kilonova-progenitor';
import { KilonovaType } from '../../domain/transient/kilonova-type';
import { KilonovaEventEngine } from './kilonova-event-engine';

describe('29.3 KilonovaEventEngine', () => {
  it('derives a deterministic NS-NS blue+red r-process transient', () => {
    const progenitor = new KilonovaProgenitorProfile(
      KilonovaType.BINARY_NEUTRON_STAR, 1.38, 1.27, 12.1, 0.0018, 0.08, 1.4e8, null, null,
    );
    const profile = KilonovaEventEngine.deriveProfile(progenitor);
    expect(profile.totalEjectaMassSolar).toBeCloseTo(
      profile.blueEjectaMassSolar + profile.redEjectaMassSolar,
      12,
    );
    expect(profile.rProcessMassSolar).toBeLessThanOrEqual(profile.totalEjectaMassSolar);
    expect(profile.bluePeakTimeDays).toBeLessThan(profile.redPeakTimeDays);
    expect(profile.characteristicBlueVelocityFractionC).toBeGreaterThan(profile.characteristicRedVelocityFractionC);
    expect(KilonovaEventEngine.deriveProfile(progenitor)).toEqual(profile);
  });

  it('keeps only tidally-disrupted NS-BH fixtures in the NS-BH family', () => {
    const progenitor = new KilonovaProgenitorProfile(
      KilonovaType.NEUTRON_STAR_BLACK_HOLE, 1.42, 4.2, 12.2, 0.0011, 0.05, 4.2e7, 0.91, 1.35,
    );
    const profile = KilonovaEventEngine.deriveProfile(progenitor);
    expect(profile.redEjectaMassSolar).toBeGreaterThan(profile.blueEjectaMassSolar);
    expect(profile.remnantKind).toBe('STELLAR_BLACK_HOLE');
  });

  it('samples merger, blue, red and late phases without wall-clock state', () => {
    const profile = KilonovaEventEngine.deriveProfile(new KilonovaProgenitorProfile(
      KilonovaType.BINARY_NEUTRON_STAR, 1.35, 1.30, 12, 0.002, 0.05, 2e8, null, null,
    ));
    expect(KilonovaEventEngine.sample(profile, -0.5).phase).toBe('PRE_MERGER');
    expect(KilonovaEventEngine.sample(profile, 0).phase).toBe('MERGER');
    expect(KilonovaEventEngine.sample(profile, profile.bluePeakTimeDays).bolometricLuminosityWatts).toBeGreaterThan(0);
    expect(KilonovaEventEngine.sample(profile, 60).phase).toBe('FADE');
  });
});
