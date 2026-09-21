import { GeneratorVersion } from '../../domain/generation/generator-version';
import { SystemLocator } from '../../domain/generation/procedural-locator';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { StellarBlackHole } from '../../domain/stellar/stellar-black-hole';
import { StellarEvolutionInput } from '../../domain/stellar/stellar-evolution-input';
import { StellarLifetimeProfile } from '../../domain/stellar/stellar-lifetime-profile';
import { StellarPhysicalProperties } from '../../domain/stellar/stellar-physical-properties';
import { Star } from '../../domain/stellar/star';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { StellarBlackHoleEngine } from './stellar-black-hole-engine';
import { StellarEvolutionEngine } from './stellar-evolution-engine';

const key = new UniverseGenerationKey(
  UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1'),
  GeneratorVersion.V1,
);
const locator = new SystemLocator(0n, 123456789n, 8n);

function evolved(mass: number, metallicity: number, age = 1): {
  star: Star;
  physical: StellarPhysicalProperties;
  lifetime: StellarLifetimeProfile;
} {
  const assessment = StellarEvolutionEngine.evaluate(
    key,
    new StellarEvolutionInput(mass, metallicity, age),
  );
  const terminal = assessment.mainSequenceLifetimeBillionYears === null ||
    assessment.postMainSequenceDurationBillionYears === null
      ? null
      : assessment.mainSequenceLifetimeBillionYears + assessment.postMainSequenceDurationBillionYears;
  const lifetime = new StellarLifetimeProfile(
    age,
    terminal,
    terminal === null ? null : Math.max(0, terminal - age),
    assessment,
  );
  return {
    star: new Star(
      key, locator, assessment.evolutionState, assessment.mainSequenceClass,
      assessment.brownDwarfClass, assessment.postMainSequenceStage,
      assessment.whiteDwarfComposition, assessment.neutronStarFormationChannel,
      assessment.blackHoleFormationChannel,
    ),
    physical: new StellarPhysicalProperties(mass, mass, 8, 90_000, 30_000),
    lifetime,
  };
}

describe('27.1 stellar black holes — materialization from existing evolution', () => {
  it('produces fallback and direct-collapse remnant profiles without changing the progenitor or key', () => {
    const fallback = evolved(30, 1);
    const direct = evolved(50, 1);
    const oldPhysical = JSON.stringify(fallback.physical);
    const first = StellarBlackHoleEngine.fromExistingStar(...[
      fallback.star, fallback.physical, fallback.lifetime,
    ] as const);
    const again = StellarBlackHoleEngine.fromExistingStar(
      fallback.star, fallback.physical, fallback.lifetime,
    );
    const second = StellarBlackHoleEngine.fromExistingStar(
      direct.star, direct.physical, direct.lifetime,
    );
    expect(first).toBeInstanceOf(StellarBlackHole);
    expect(first).toEqual(again);
    expect(first!.formationChannel.name).toBe('FALLBACK_CORE_COLLAPSE');
    expect(second!.formationChannel.name).toBe('DIRECT_COLLAPSE');
    expect(first!.massSolar).toBeGreaterThanOrEqual(3.05);
    expect(first!.massSolar).toBeLessThan(fallback.physical.initialMassSolar);
    expect(second!.massSolar).toBeGreaterThan(first!.massSolar);
    expect(first!.star).toBe(fallback.star);
    expect(first!.star.generationKey).toBe(key);
    expect(JSON.stringify(fallback.physical)).toBe(oldPhysical);
    expect(fallback.physical.currentMassSolar).toBe(30); // Frozen point-15.1 baseline.
    expect(Object.isFrozen(first)).toBe(true);
  });

  it('uses the Schwarzschild reference equation and an elapsed age tied to phase 15.3', () => {
    const source = evolved(40, 0.4, 0.6);
    const profile = StellarBlackHoleEngine.fromExistingStar(
      source.star, source.physical, source.lifetime,
    )!;
    const expected = 2 * 6.67430e-11 * 1.98847e30 * profile.massSolar /
      299_792_458 ** 2 / 1000;
    expect(profile.schwarzschildRadiusKm).toBeCloseTo(expected, 11);
    expect(StellarBlackHole.schwarzschildRadiusFor(1)).toBeCloseTo(2.953, 2);
    expect(profile.formationAgeBillionYears).toBe(source.lifetime.terminalAgeBillionYears);
    expect(profile.ageSinceFormationBillionYears).toBeCloseTo(
      source.lifetime.ageBillionYears - profile.formationAgeBillionYears, 12,
    );
  });

  it('keeps the remnant-mass estimate ordered with progenitor mass and lower metallicity', () => {
    const lowZ = evolved(55, 0.01);
    const highZ = evolved(55, 3);
    const massive = evolved(75, 0.01);
    const mass = (input: ReturnType<typeof evolved>) => StellarBlackHoleEngine.fromExistingStar(
      input.star, input.physical, input.lifetime,
    )!.massSolar;
    expect(mass(lowZ)).toBeGreaterThan(mass(highZ));
    expect(mass(massive)).toBeGreaterThan(mass(lowZ));
  });

  it('does not manufacture a black hole for a young massive star, neutron star or ordinary star', () => {
    for (const source of [evolved(50, 1, 0), evolved(12, 1), evolved(1, 1)]) {
      expect(StellarBlackHoleEngine.fromExistingStar(
        source.star, source.physical, source.lifetime,
      )).toBeNull();
    }
  });

  it('accepts a V2 multihost component only from its supplied physical and evolutionary inputs', () => {
    const source = evolved(50, 1);
    const publicKey = new UniverseGenerationKey(key.universeSeed, GeneratorVersion.V2);
    const component = new Star(
      publicKey, source.star.locator, source.star.evolutionState,
      source.star.mainSequenceClass, source.star.brownDwarfClass,
      source.star.postMainSequenceStage, source.star.whiteDwarfComposition,
      source.star.neutronStarFormationChannel, source.star.blackHoleFormationChannel,
    );
    const profile = StellarBlackHoleEngine.fromExistingStar(
      component, source.physical, source.lifetime,
    );
    expect(profile).toBeInstanceOf(StellarBlackHole);
    expect(profile!.star).toBe(component);
    expect(profile!.star.generationKey).toBe(publicKey);
  });

  it('rejects mixed stars, wrong progenitor masses and invalid Schwarzschild radii', () => {
    const bh = evolved(50, 1);
    const other = evolved(30, 1);
    expect(() => StellarBlackHoleEngine.fromExistingStar(
      other.star, bh.physical, bh.lifetime,
    )).toThrow(RangeError);
    expect(() => StellarBlackHoleEngine.fromExistingStar(
      bh.star, new StellarPhysicalProperties(49, 49, 8, 90_000, 30_000), bh.lifetime,
    )).toThrow(RangeError);
    const profile = StellarBlackHoleEngine.fromExistingStar(
      bh.star, bh.physical, bh.lifetime,
    )!;
    expect(() => new StellarBlackHole(
      bh.star, profile.progenitorInitialMassSolar, profile.massSolar,
      profile.schwarzschildRadiusKm * 1.01,
      profile.formationAgeBillionYears, profile.ageSinceFormationBillionYears,
    )).toThrow(RangeError);
    expect(() => StellarBlackHole.schwarzschildRadiusFor(0)).toThrow(RangeError);
    expect(() => StellarBlackHole.schwarzschildRadiusFor(Number.NaN)).toThrow(RangeError);
  });
});
