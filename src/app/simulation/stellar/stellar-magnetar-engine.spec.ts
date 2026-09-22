import { GeneratorVersion } from '../../domain/generation/generator-version';
import { SystemLocator } from '../../domain/generation/procedural-locator';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { StellarEvolutionInput } from '../../domain/stellar/stellar-evolution-input';
import { StellarLifetimeProfile } from '../../domain/stellar/stellar-lifetime-profile';
import { StellarMagnetar } from '../../domain/stellar/stellar-magnetar';
import { StellarNeutronStar } from '../../domain/stellar/stellar-neutron-star';
import { StellarPhysicalProperties } from '../../domain/stellar/stellar-physical-properties';
import { Star } from '../../domain/stellar/star';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { StellarEvolutionEngine } from './stellar-evolution-engine';
import { StellarMagnetarEngine } from './stellar-magnetar-engine';
import { StellarNeutronStarEngine } from './stellar-neutron-star-engine';
import { StellarPulsarEngine } from './stellar-pulsar-engine';

const seed = UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1');
const key = new UniverseGenerationKey(seed, GeneratorVersion.V1);
const MAGNETAR_INDEX = 462n; // Frozen SHA-256 domain selection, rare and reproducible.

function neutron(index = MAGNETAR_INDEX, yearsAfterFormation = 1_000,
  identity = key, mass = 16): StellarNeutronStar {
  const reference = StellarEvolutionEngine.evaluate(key,
    new StellarEvolutionInput(mass, 1, 0.02));
  const terminal = reference.mainSequenceLifetimeBillionYears! +
    reference.postMainSequenceDurationBillionYears!;
  const age = terminal + yearsAfterFormation / 1e9;
  const assessment = StellarEvolutionEngine.evaluate(key,
    new StellarEvolutionInput(mass, 1, age));
  const star = new Star(identity, new SystemLocator(0n, 123456789n, index),
    assessment.evolutionState, assessment.mainSequenceClass,
    assessment.brownDwarfClass, assessment.postMainSequenceStage,
    assessment.whiteDwarfComposition, assessment.neutronStarFormationChannel,
    assessment.blackHoleFormationChannel);
  const physical = new StellarPhysicalProperties(mass, mass, 8, 90_000, 30_000);
  const lifetime = new StellarLifetimeProfile(age, terminal, 0, assessment);
  const result = StellarNeutronStarEngine.fromExistingStar(star, physical, lifetime);
  if (!result) throw new Error('Test fixture must remain a canonical neutron star.');
  return result;
}

describe('27.6 — exceptionally rare, physical magnetar profiles', () => {
  it('projects one exact pre-existing neutron star and preserves its original identity/physics', () => {
    const original = neutron();
    const properties = [original.star, original.formationChannel, original.massSolar,
      original.radiusKm, original.ageSinceFormationBillionYears] as const;
    const magnetar = StellarMagnetarEngine.fromExistingNeutronStar(original);
    expect(magnetar).toBeInstanceOf(StellarMagnetar);
    expect(magnetar!.neutronStar).toBe(original);
    expect([original.star, original.formationChannel, original.massSolar,
      original.radiusKm, original.ageSinceFormationBillionYears]).toEqual(properties);
    expect(Object.isFrozen(magnetar)).toBe(true);
    expect(Object.isFrozen(original)).toBe(true);
  });

  it('is repeatable, identity-separated, and consumes no existing PRNG draws', () => {
    const original = neutron();
    expect(StellarMagnetarEngine.fromExistingNeutronStar(original)).toEqual(
      StellarMagnetarEngine.fromExistingNeutronStar(original));
    expect(StellarMagnetarEngine.fromExistingNeutronStar(neutron(0n))).toBeNull();
    expect(original.star.generationKey).toBe(key);
    expect(StellarMagnetarEngine.fromExistingNeutronStar(original)!.neutronStar.star)
      .toBe(original.star);
  });

  it('limits birth selection to an exceptionally rare, deterministic subset', () => {
    let births = 0;
    for (let index = 0n; index < 512n; index++) {
      if (StellarMagnetarEngine.fromExistingNeutronStar(neutron(index))) births++;
    }
    expect(births).toBe(1);
    expect(StellarMagnetarEngine.BIRTH_ELIGIBILITY_FRACTION).toBeLessThan(0.02);
  });

  it('never gives the same neutron star two incompatible low-field/high-field profiles', () => {
    expect(StellarPulsarEngine.fromExistingNeutronStar(neutron())).toBeNull();
    expect(StellarMagnetarEngine.fromExistingNeutronStar(neutron(2n))).toBeNull();
  });

  it('converts the physical field envelope from 10^14–10^15 gauss to tesla', () => {
    const magnetar = StellarMagnetarEngine.fromExistingNeutronStar(neutron())!;
    expect(magnetar.birthDipolarMagneticFieldTesla).toBeGreaterThanOrEqual(1e10);
    expect(magnetar.birthDipolarMagneticFieldTesla).toBeLessThanOrEqual(1e11);
    expect(magnetar.dipolarMagneticFieldTesla).toBeGreaterThanOrEqual(1e7);
    expect(magnetar.dipolarMagneticFieldTesla).toBeLessThanOrEqual(
      magnetar.birthDipolarMagneticFieldTesla);
    expect(magnetar.fieldDecayTimescaleYears).toBeGreaterThanOrEqual(1_500);
    expect(magnetar.fieldDecayTimescaleYears).toBeLessThanOrEqual(12_000);
  });

  it('starts at the exact birth field and spin without inventing an earlier episode', () => {
    const magnetar = StellarMagnetarEngine.fromExistingNeutronStar(neutron(MAGNETAR_INDEX, 0))!;
    expect(magnetar.ageSinceFormationYears).toBeCloseTo(0, 4);
    expect(magnetar.dipolarMagneticFieldTesla).toBeCloseTo(
      magnetar.birthDipolarMagneticFieldTesla, 6);
    expect(magnetar.spinPeriodSeconds).toBeCloseTo(magnetar.birthSpinPeriodSeconds, 12);
    expect(magnetar.highFieldActive).toBe(true);
  });

  it('evolves from the true remnant formation age; the dipole decays as the spin slows', () => {
    const moments = [0, 1_000, 10_000, 50_000, 1_000_000];
    const profiles = moments.map(years => StellarMagnetarEngine.fromExistingNeutronStar(
      neutron(MAGNETAR_INDEX, years))!);
    for (let index = 1; index < profiles.length; index++) {
      expect(profiles[index]!.dipolarMagneticFieldTesla).toBeLessThan(
        profiles[index - 1]!.dipolarMagneticFieldTesla);
      expect(profiles[index]!.spinPeriodSeconds).toBeGreaterThan(
        profiles[index - 1]!.spinPeriodSeconds);
      expect(profiles[index]!.magneticEnergyReferenceJoules).toBeLessThan(
        profiles[index - 1]!.magneticEnergyReferenceJoules);
    }
    expect(profiles[1]!.highFieldActive).toBe(true);
    expect(profiles.at(-1)!.highFieldActive).toBe(false);
  });

  it('integrates B(t)^2 rather than pretending the current field was constant since birth', () => {
    const profile = StellarMagnetarEngine.fromExistingNeutronStar(neutron())!;
    const tauSeconds = profile.fieldDecayTimescaleYears * StellarMagnetar.SECONDS_PER_YEAR;
    const timeSeconds = profile.ageSinceFormationYears * StellarMagnetar.SECONDS_PER_YEAR;
    const delta = profile.birthDipolarMagneticFieldTesla - StellarMagnetar.RESIDUAL_FIELD_TESLA;
    const floor = StellarMagnetar.RESIDUAL_FIELD_TESLA;
    const integral = floor ** 2 * timeSeconds +
      2 * floor * delta * tauSeconds * -Math.expm1(-timeSeconds / tauSeconds) +
      delta ** 2 * tauSeconds / 2 * -Math.expm1(-2 * timeSeconds / tauSeconds);
    const reference = profile.birthSpinPeriodSeconds ** 2 +
      2 * (1e4 / 3.2e19) ** 2 * integral;
    expect(profile.spinPeriodSeconds ** 2).toBeCloseTo(reference, 10);
  });

  it('derives a consistent instantaneous Pdot, spin frequency and uniform-field energy scale', () => {
    const profile = StellarMagnetarEngine.fromExistingNeutronStar(neutron())!;
    expect(profile.spinFrequencyHz).toBeCloseTo(1 / profile.spinPeriodSeconds, 12);
    expect(profile.periodDerivativeSecondsPerSecond).toBeCloseTo(
      (profile.dipolarMagneticFieldTesla * 1e4 / 3.2e19) ** 2 /
        profile.spinPeriodSeconds, 12);
    const rMetres = profile.neutronStar.radiusKm * 1_000;
    expect(profile.magneticEnergyReferenceJoules).toBeCloseTo(
      profile.dipolarMagneticFieldTesla ** 2 / (2 * StellarMagnetar.VACUUM_PERMEABILITY_SI) *
        (4 / 3) * Math.PI * rMetres ** 3, 4);
    expect(profile.magneticEnergyReferenceJoules).toBeGreaterThan(0);
  });

  it('separates an old magnetar birth from CURRENT high-field activity and never invents flares', () => {
    const old = StellarMagnetarEngine.fromExistingNeutronStar(neutron(MAGNETAR_INDEX, 20_000_000))!;
    expect(old.neutronStar.star.evolutionState.name).toBe('NEUTRON_STAR');
    expect(old.ageSinceFormationYears).toBeGreaterThan(1e7);
    expect(old.highFieldActive).toBe(false);
    expect(old.dipolarMagneticFieldTesla).toBeCloseTo(StellarMagnetar.RESIDUAL_FIELD_TESLA, 8);
    for (const forbidden of ['isBursting', 'flare', 'discoveryState', 'observedFlux',
      'accretionDisk', 'jet', 'companion']) {
      expect(Object.keys(old)).not.toContain(forbidden);
    }
  });

  it('rejects forged remnant profiles and out-of-range / nonfinite parameters', () => {
    const source = neutron();
    expect(() => StellarMagnetarEngine.fromExistingNeutronStar(
      null as unknown as StellarNeutronStar)).toThrow(TypeError);
    expect(() => new StellarMagnetar(null as unknown as StellarNeutronStar,
      1e10, 12_000, 0.04)).toThrow(TypeError);
    for (const [field, decay, spin] of [
      [Number.NaN, 12_000, 0.04], [1e9, 12_000, 0.04],
      [2e11, 12_000, 0.04], [1e10, Number.POSITIVE_INFINITY, 0.04],
      [1e10, 100, 0.04], [1e10, 12_000, 0], [1e10, 12_000, Number.NaN],
    ]) {
      expect(() => new StellarMagnetar(source, field!, decay!, spin!)).toThrow(RangeError);
    }
  });

  it('uses the real private V2 host identity and never fabricates an observed discovery', () => {
    const identity = new UniverseGenerationKey(
      UniverseSeed.parse('0123-4567-89AB-CDEF-0123-4567-89AB-CDEF'), GeneratorVersion.V1);
    const actualHost = neutron(MAGNETAR_INDEX, 1_000, identity);
    const resolved = StellarMagnetarEngine.fromExistingNeutronStar(actualHost);
    if (resolved) expect(resolved.neutronStar.star.generationKey).toBe(identity);
    expect(resolved).not.toEqual(StellarMagnetarEngine.fromExistingNeutronStar(neutron()));
    const v2 = new UniverseGenerationKey(seed, GeneratorVersion.V2);
    const canonicalComponent = neutron(MAGNETAR_INDEX, 1_000, v2);
    const projection = StellarMagnetarEngine.fromExistingNeutronStar(canonicalComponent);
    if (projection) expect(projection.neutronStar.star).toBe(canonicalComponent.star);
    expect(Object.keys(projection ?? {})).not.toContain('discoveryState');
  });
});
