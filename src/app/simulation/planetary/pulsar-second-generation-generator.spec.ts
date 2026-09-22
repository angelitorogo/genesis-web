import { GeneratorVersion } from '../../domain/generation/generator-version';
import { SystemLocator } from '../../domain/generation/procedural-locator';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { StellarEvolutionInput } from '../../domain/stellar/stellar-evolution-input';
import { StellarLifetimeProfile } from '../../domain/stellar/stellar-lifetime-profile';
import { StellarPhysicalProperties } from '../../domain/stellar/stellar-physical-properties';
import { StellarPulsar } from '../../domain/stellar/stellar-pulsar';
import { StellarNeutronStar } from '../../domain/stellar/stellar-neutron-star';
import { Star } from '../../domain/stellar/star';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { SystemSeed } from '../../domain/seed/hierarchical-seeds';
import { type GeneratedSingleHost, withSecondGenerationPulsarPlanets } from '../stellar/stellar-multihost-formation';
import { StellarEvolutionEngine } from '../stellar/stellar-evolution-engine';
import { StellarNeutronStarEngine } from '../stellar/stellar-neutron-star-engine';
import { PulsarSecondGenerationGenerator } from './pulsar-second-generation-generator';

const systemSeed = 'A'.repeat(32);
const key = new UniverseGenerationKey(
  UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1'), GeneratorVersion.V1,
);
// Canonical 14.8/27.4 remnant: no fake neutron star or fabricated survivor planet.
const assessment = StellarEvolutionEngine.evaluate(key, new StellarEvolutionInput(16, 1, 0.02));
const terminal = assessment.mainSequenceLifetimeBillionYears! +
  assessment.postMainSequenceDurationBillionYears!;
const physical = new StellarPhysicalProperties(16, 16, 8, 90_000, 30_000);
const lifetime = new StellarLifetimeProfile(0.02, terminal, 0, assessment);

function realPulsar(index: bigint): StellarPulsar {
  const star = new Star(key, new SystemLocator(0n, 123456789n, index),
    assessment.evolutionState, assessment.mainSequenceClass, assessment.brownDwarfClass,
    assessment.postMainSequenceStage, assessment.whiteDwarfComposition,
    assessment.neutronStarFormationChannel, assessment.blackHoleFormationChannel);
  const neutron = StellarNeutronStarEngine.fromExistingStar(star, physical, lifetime);
  if (neutron === null) throw new Error('Expected a canonical stellar neutron-star remnant.');
  return new StellarPulsar(neutron, 'ORDINARY', 0.045, 0.05, 1e7, 30, 45, 20, null);
}

describe('27.9 V2 — rare, separate-lineage automatic pulsar planet population', () => {
  it('never invents a host, a survivor, recycling evidence or a disk for an ineligible input', () => {
    expect(PulsarSecondGenerationGenerator.generate(null, systemSeed)).toBeNull();
    expect(() => PulsarSecondGenerationGenerator.generate(realPulsar(191n), 'invalid'))
      .toThrow(TypeError);
    const old = realPulsar(191n);
    const tooYoung = new StellarNeutronStar(
      old.neutronStar.star, old.neutronStar.progenitorInitialMassSolar,
      old.neutronStar.massSolar, old.neutronStar.radiusKm,
      old.neutronStar.formationAgeBillionYears, 0.001,
    );
    const infantPulsar = new StellarPulsar(tooYoung, 'ORDINARY', 0.045, 0.05,
      1e7, 30, 45, 20, null);
    expect(PulsarSecondGenerationGenerator.generate(infantPulsar, systemSeed)).toBeNull();
  });

  it('creates an exceptionally rare, deterministic, bounded new generation at a frozen physical vector', () => {
    const pulsar = realPulsar(191n);
    const result = PulsarSecondGenerationGenerator.generate(pulsar, systemSeed);
    expect(result).not.toBeNull();
    expect(result!.scientificStatus).toBe('SPECULATIVE_FORMATION_MODEL');
    expect(result!.modelVersion).toBe('PULSAR_SECOND_GENERATION_V1');
    expect(result!.origin).toBe('MODELLED_SUPERNOVA_FALLBACK');
    expect(result!.planets.length).toBeGreaterThanOrEqual(1);
    expect(result!.planets.length).toBeLessThanOrEqual(3);
    expect(PulsarSecondGenerationGenerator.generate(realPulsar(191n), systemSeed)).toEqual(result);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result!.planets)).toBe(true);
    const totalMass = result!.planets.reduce((sum, planet) => sum + planet.massEarth, 0);
    expect(totalMass).toBeLessThan(result!.diskMassEarth * 0.32);
    for (const [index, planet] of result!.planets.entries()) {
      expect(Object.isFrozen(planet)).toBe(true);
      expect(planet.hostSystemSeedHex).toBe(systemSeed);
      expect(planet.ordinal).toBe(index + 1);
      expect(planet.identityHex).toMatch(/^[A-F0-9]{32}$/);
      expect(planet.orbitalPeriodDays).toBeGreaterThan(0);
      expect(planet.formedAtAgeBillionYears).toBeGreaterThan(pulsar.neutronStar.formationAgeBillionYears);
      expect(planet.formedAtAgeBillionYears).toBeLessThanOrEqual(0.02);
      expect(planet.edgeOnTimingSemiAmplitudeSeconds).toBeGreaterThan(0);
      expect(planet.isotropicEquivalentSpinDownFluxWm2).toBeGreaterThan(0);
      if (index > 0) expect(planet.periastronAu).toBeGreaterThan(result!.planets[index - 1]!.apoastronAu);
      expect('planet' in planet).toBe(false); // Never claim an ancestral phase-18 body survived.
      expect('discoveryState' in planet).toBe(false); // Generation is not observation.
    }
  });

  it('wires the automatically selected real pulsar into the V2 SINGLE host only when the old inventory is empty', () => {
    const star = realPulsar(191n).neutronStar.star;
    const host = Object.freeze({
      stellarSystem: Object.freeze({ primaryStar: star, seed: new SystemSeed(systemSeed) }),
      physical, lifetime, planets: Object.freeze([]),
    }) as unknown as GeneratedSingleHost;
    const extended = withSecondGenerationPulsarPlanets(host);
    expect(extended).not.toBe(host);
    expect(extended.pulsarPlanetPopulation).not.toBeNull();
    expect(extended.pulsarPlanetPopulation!.planets.length).toBeGreaterThan(0);
    expect(extended.planets).toBe(host.planets);
    expect(Object.isFrozen(extended)).toBe(true);
    expect(withSecondGenerationPulsarPlanets(host)).toEqual(extended);
    const withAncestralPlanets = Object.freeze({ ...host, planets: Object.freeze([{}]) }) as unknown as GeneratedSingleHost;
    expect(withSecondGenerationPulsarPlanets(withAncestralPlanets)).toBe(withAncestralPlanets);
    const ineligible = Object.freeze({ ...host, stellarSystem: Object.freeze({
      ...host.stellarSystem, primaryStar: realPulsar(2n).neutronStar.star,
    }) }) as GeneratedSingleHost;
    expect(withSecondGenerationPulsarPlanets(ineligible)).toBe(ineligible);
  });

  it('does not turn every valid remnant into a planetary host or mutate a previous lineage', () => {
    const unselected = realPulsar(2n);
    const keys = Object.keys(unselected.neutronStar.star);
    expect(PulsarSecondGenerationGenerator.generate(unselected, systemSeed)).toBeNull();
    expect(Object.keys(unselected.neutronStar.star)).toEqual(keys);
    expect(unselected.recyclingEvidence).toBeNull();
    expect(unselected.neutronStar.star.generationKey).toBe(key);
  });
});
