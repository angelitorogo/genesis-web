import { GeneratorVersion } from '../../domain/generation/generator-version';
import { SystemLocator } from '../../domain/generation/procedural-locator';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { StellarEvolutionInput } from '../../domain/stellar/stellar-evolution-input';
import { StellarLifetimeProfile } from '../../domain/stellar/stellar-lifetime-profile';
import { StellarNeutronStar } from '../../domain/stellar/stellar-neutron-star';
import { StellarPhysicalProperties } from '../../domain/stellar/stellar-physical-properties';
import { Star } from '../../domain/stellar/star';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { StellarEvolutionEngine } from './stellar-evolution-engine';
import { StellarNeutronStarEngine } from './stellar-neutron-star-engine';

const key = new UniverseGenerationKey(
  UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1'),
  GeneratorVersion.V1,
);
const locator = new SystemLocator(0n, 123456789n, 8n);

function evolved(mass: number, metallicity = 1, age = 1): {
  star: Star;
  physical: StellarPhysicalProperties;
  lifetime: StellarLifetimeProfile;
} {
  const assessment = StellarEvolutionEngine.evaluate(
    key, new StellarEvolutionInput(mass, metallicity, age),
  );
  const terminal = assessment.mainSequenceLifetimeBillionYears === null ||
    assessment.postMainSequenceDurationBillionYears === null
      ? null
      : assessment.mainSequenceLifetimeBillionYears + assessment.postMainSequenceDurationBillionYears;
  return {
    star: new Star(
      key, locator, assessment.evolutionState, assessment.mainSequenceClass,
      assessment.brownDwarfClass, assessment.postMainSequenceStage,
      assessment.whiteDwarfComposition, assessment.neutronStarFormationChannel,
      assessment.blackHoleFormationChannel,
    ),
    physical: new StellarPhysicalProperties(mass, mass, 8, 90_000, 30_000),
    lifetime: new StellarLifetimeProfile(
      age, terminal, terminal === null ? null : Math.max(0, terminal - age), assessment,
    ),
  };
}

const neutronStar = (source: ReturnType<typeof evolved>) =>
  StellarNeutronStarEngine.fromExistingStar(source.star, source.physical, source.lifetime);

describe('27.4 — neutron-star physical remnant from canonical evolution', () => {
  it('reuses electron-capture and iron-core-collapse channels without creating a star', () => {
    const electron = evolved(8.3);
    const iron = evolved(16);
    expect(electron.star.evolutionState.name).toBe('NEUTRON_STAR');
    expect(iron.star.evolutionState.name).toBe('NEUTRON_STAR');
    const first = neutronStar(electron)!;
    const second = neutronStar(iron)!;
    expect(first).toBeInstanceOf(StellarNeutronStar);
    expect(first.formationChannel.name).toBe('ELECTRON_CAPTURE_COLLAPSE');
    expect(second.formationChannel.name).toBe('IRON_CORE_COLLAPSE');
    expect(first.star).toBe(electron.star);
    expect(first.massSolar).toBeLessThan(second.massSolar);
    expect(second.massSolar).toBeLessThan(second.progenitorInitialMassSolar);
    expect(Object.isFrozen(first)).toBe(true);
  });

  it('calculates finite SI density, Newtonian gravity and dimensionless compactness', () => {
    const star = neutronStar(evolved(16))!;
    const massKg = star.massSolar * 1.98847e30;
    const rMetres = star.radiusKm * 1000;
    expect(star.meanDensityKgPerCubicMetre).toBeCloseTo(
      massKg / ((4 / 3) * Math.PI * rMetres ** 3), 5,
    );
    expect(star.newtonianSurfaceGravityMetresPerSecondSquared).toBeCloseTo(
      6.67430e-11 * massKg / rMetres ** 2, 5,
    );
    expect(star.compactness).toBeCloseTo(
      6.67430e-11 * massKg / (rMetres * 299_792_458 ** 2), 12,
    );
    expect(star.compactness).toBeGreaterThan(0);
    expect(star.compactness).toBeLessThan(0.5);
  });

  it('keeps mass/radius in explicit model limits and does not reclassify a pulsar or magnetar', () => {
    for (const mass of [9.5, 12, 16, 22, 24]) {
      const result = neutronStar(evolved(mass));
      if (result === null) continue; // The frozen 14.8 threshold is authoritative.
      expect(result.massSolar).toBeGreaterThanOrEqual(1.1);
      expect(result.massSolar).toBeLessThanOrEqual(2.2);
      expect(result.radiusKm).toBeGreaterThanOrEqual(9);
      expect(result.radiusKm).toBeLessThanOrEqual(15.5);
      expect(Object.keys(result).includes('spinPeriodSeconds')).toBe(false);
      expect(Object.keys(result).includes('magneticFieldTesla')).toBe(false);
    }
  });

  it('preserves the frozen progenitor physical baseline and repeatability', () => {
    const source = evolved(16);
    const prior = JSON.stringify(source.physical);
    const first = neutronStar(source);
    const second = neutronStar(source);
    expect(first).toEqual(second);
    expect(first!.star).toBe(source.star);
    expect(JSON.stringify(source.physical)).toBe(prior);
    expect(source.physical.currentMassSolar).toBe(16);
    expect(source.star.generationKey).toBe(key);
  });

  it('uses the canonical terminal age; never makes an unevolved progenitor a compact remnant', () => {
    const formed = evolved(16, 1, 0.5);
    const result = neutronStar(formed)!;
    expect(result.formationAgeBillionYears).toBe(formed.lifetime.terminalAgeBillionYears);
    expect(result.ageSinceFormationBillionYears).toBeCloseTo(
      formed.lifetime.ageBillionYears - result.formationAgeBillionYears, 12,
    );
    expect(neutronStar(evolved(16, 1, 0))).toBeNull();
  });

  it('returns null for an existing stellar black hole and an ordinary/white-dwarf star', () => {
    for (const source of [evolved(50), evolved(1), evolved(3)]) {
      expect(neutronStar(source)).toBeNull();
    }
  });

  it('accepts a V2 host only from its exact component inputs, not V1 locator regeneration', () => {
    const source = evolved(16);
    const v2Key = new UniverseGenerationKey(key.universeSeed, GeneratorVersion.V2);
    const component = new Star(
      v2Key, source.star.locator, source.star.evolutionState,
      source.star.mainSequenceClass, source.star.brownDwarfClass,
      source.star.postMainSequenceStage, source.star.whiteDwarfComposition,
      source.star.neutronStarFormationChannel, source.star.blackHoleFormationChannel,
    );
    const profile = StellarNeutronStarEngine.fromExistingStar(
      component, source.physical, source.lifetime,
    )!;
    expect(profile.star).toBe(component);
    expect(profile.star.generationKey).toBe(v2Key);
  });

  it('rejects incorrect progenitor mass, mixed formation channel and invalid input classes', () => {
    const iron = evolved(16);
    const electron = evolved(8.3);
    expect(() => StellarNeutronStarEngine.fromExistingStar(
      iron.star, new StellarPhysicalProperties(15, 15, 8, 90_000, 30_000), iron.lifetime,
    )).toThrow(RangeError);
    expect(() => StellarNeutronStarEngine.fromExistingStar(
      iron.star, iron.physical, electron.lifetime,
    )).toThrow(RangeError);
    expect(() => StellarNeutronStarEngine.fromExistingStar(
      null as unknown as Star, iron.physical, iron.lifetime,
    )).toThrow(TypeError);
  });

  it('rejects impossible neutron-star masses, radii, non-finite ages and wrong Star', () => {
    const source = evolved(16);
    const neutron = neutronStar(source)!;
    const args = [source.star, 16, neutron.massSolar, neutron.radiusKm, neutron.formationAgeBillionYears,
      neutron.ageSinceFormationBillionYears] as const;
    expect(() => new StellarNeutronStar(args[0], args[1], 3, args[3], args[4], args[5])).toThrow(RangeError);
    expect(() => new StellarNeutronStar(args[0], args[1], args[2], 1, args[4], args[5])).toThrow(RangeError);
    expect(() => new StellarNeutronStar(args[0], args[1], args[2], Number.NaN, args[4], args[5])).toThrow(RangeError);
    expect(() => new StellarNeutronStar(args[0], args[1], args[2], args[3], args[4], -1)).toThrow(RangeError);
    expect(() => new StellarNeutronStar(evolved(50).star, args[1], args[2], args[3], args[4], args[5])).toThrow(TypeError);
  });

  it('maintains plausible order with progenitor mass and metallicity without changing channels', () => {
    const smaller = neutronStar(evolved(12, 1))!;
    const larger = neutronStar(evolved(15, 1))!;
    const lowZ = neutronStar(evolved(15, 0.01))!;
    const highZ = neutronStar(evolved(15, 3))!;
    expect(larger.massSolar).toBeGreaterThan(smaller.massSolar);
    expect(lowZ.massSolar).toBeGreaterThan(highZ.massSolar);
    expect(lowZ.formationChannel.name).toBe(highZ.formationChannel.name);
  });
});
