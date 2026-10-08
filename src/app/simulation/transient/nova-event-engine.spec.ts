import { NovaProgenitorProfile, NovaWhiteDwarfComposition } from '../../domain/transient/nova-progenitor';
import { NovaPhase } from '../../domain/transient/nova-phase';
import { NovaType } from '../../domain/transient/nova-type';
import { NovaEventEngine } from './nova-event-engine';

describe('29.2 NovaEventEngine', () => {
  it('separates classical and recurrent novae without destroying the white dwarf', () => {
    const classical = NovaEventEngine.deriveProfile(new NovaProgenitorProfile(
      0.84, 0.72, 1, 0.82, 2.2e-10, 8e-5, NovaWhiteDwarfComposition.CARBON_OXYGEN,
    ));
    const recurrent = NovaEventEngine.deriveProfile(new NovaProgenitorProfile(
      1.30, 1.15, 1, 0.16, 1.1e-7, 5.5e-6, NovaWhiteDwarfComposition.CARBON_OXYGEN,
    ));

    expect(classical.type).toBe(NovaType.CLASSICAL);
    expect(recurrent.type).toBe(NovaType.RECURRENT);
    expect(classical.recurrenceIntervalYears).toBeGreaterThan(100);
    expect(recurrent.recurrenceIntervalYears).toBeLessThanOrEqual(100);
    expect(classical.ejectaMassSolar).toBeLessThan(classical.progenitor.ignitionEnvelopeMassSolar);
    expect(recurrent.retainedEnvelopeMassSolar).toBeGreaterThan(0);
    expect(recurrent.characteristicEjectaVelocityKmS).toBeGreaterThan(classical.characteristicEjectaVelocityKmS);
  });

  it('produces a deterministic relative-time light curve with return to quiescence', () => {
    const profile = NovaEventEngine.deriveProfile(new NovaProgenitorProfile(
      1.22, 0.9, 0.8, 0.22, 4e-8, 6e-6, NovaWhiteDwarfComposition.OXYGEN_NEON,
    ));
    const first = NovaEventEngine.sample(profile, profile.riseTimeDays);
    const replay = NovaEventEngine.sample(profile, profile.riseTimeDays);
    const late = NovaEventEngine.sample(profile, profile.returnToQuiescenceDays + 1);

    expect(first).toEqual(replay);
    expect(first.phase).toBe(NovaPhase.PEAK);
    expect(first.normalizedBrightness).toBeGreaterThan(0.9);
    expect(late.phase).toBe(NovaPhase.RETURN_TO_QUIESCENCE);
    expect(late.normalizedBrightness).toBeLessThan(first.normalizedBrightness);
  });
});
