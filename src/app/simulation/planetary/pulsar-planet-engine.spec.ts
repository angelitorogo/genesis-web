import { BodyLocator, SystemLocator } from '../../domain/generation/procedural-locator';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { BodySeed, SystemSeed } from '../../domain/seed/hierarchical-seeds';
import { StellarEvolutionInput } from '../../domain/stellar/stellar-evolution-input';
import { StellarLifetimeProfile } from '../../domain/stellar/stellar-lifetime-profile';
import { StellarNeutronStar } from '../../domain/stellar/stellar-neutron-star';
import { StellarPhysicalProperties } from '../../domain/stellar/stellar-physical-properties';
import { StellarPulsar } from '../../domain/stellar/stellar-pulsar';
import { StellarSystem } from '../../domain/stellar/stellar-system';
import { StellarSystemMultiplicity } from '../../domain/stellar/stellar-system-multiplicity';
import { Star } from '../../domain/stellar/star';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { StellarEvolutionEngine } from '../stellar/stellar-evolution-engine';
import { StellarNeutronStarEngine } from '../stellar/stellar-neutron-star-engine';
import { Planet } from '../../domain/planetary/planet';
import { PlanetarySystem } from '../../domain/planetary/planetary-system';
import { PlanetarySystemOrbitTopology } from '../../domain/planetary/planetary-system-orbit-topology';
import { PulsarPlanet, type PulsarPlanetSurvivalEvidence } from '../../domain/planetary/pulsar-planet';

import { PulsarPlanetEngine } from './pulsar-planet-engine';

const key = new UniverseGenerationKey(
  UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1'), GeneratorVersion.V1,
);

// Real existing 14.8 -> 27.4 neutron-star construction, with a minimal phase-19
// aggregate shape ONLY for the Planet's read-only identity getters.
function pulsarPlanetFixture(index = 2n, massEarth = 4.3, bodyHex = 'B'.repeat(32)) {
  const assessment = StellarEvolutionEngine.evaluate(key, new StellarEvolutionInput(16, 1, 0.02));
  const terminal = assessment.mainSequenceLifetimeBillionYears! +
    assessment.postMainSequenceDurationBillionYears!;
  const star = new Star(key, new SystemLocator(0n, 123456789n, index),
    assessment.evolutionState, assessment.mainSequenceClass, assessment.brownDwarfClass,
    assessment.postMainSequenceStage, assessment.whiteDwarfComposition,
    assessment.neutronStarFormationChannel, assessment.blackHoleFormationChannel);
  const neutron = StellarNeutronStarEngine.fromExistingStar(star,
    new StellarPhysicalProperties(16, 16, 8, 90_000, 30_000),
    new StellarLifetimeProfile(0.02, terminal, 0, assessment))!;
  const pulsar = new StellarPulsar(neutron, 'ORDINARY', 0.045, 0.05, 1e7,
    30, 45, 20, null);
  const host = Object.assign(Object.create(StellarSystem.prototype) as StellarSystem, {
    primaryStar: star, seed: new SystemSeed('A'.repeat(32)),
    locator: star.locator, generationKey: key, multiplicity: StellarSystemMultiplicity.SINGLE,
  });
  const planetary = Object.assign(Object.create(PlanetarySystem.prototype) as PlanetarySystem, {
    hostStellarSystem: host,
    architecture: { orbitTopology: PlanetarySystemOrbitTopology.CIRCUMSTELLAR },
  });
  const planet = Object.assign(Object.create(Planet.prototype) as Planet, {
    hostPlanetarySystem: planetary,
    architectureSlot: {
      bodyLocator: new BodyLocator(0n, 123456789n, index, bodyHex.startsWith('B') ? 0n : 1n),
      bodySeed: new BodySeed(bodyHex),
    },
    physicalProperties: { massEarth, radiusEarth: Math.cbrt(massEarth) },
  });
  const evidence: PulsarPlanetSurvivalEvidence = {
    origin: 'SURVIVED_CORE_COLLAPSE', sourceIdentity: 'history:collapse-proof:1',
    componentSystemSeedHex: host.seed.normalizedValue,
    planetBodySeedHex: planet.seed.normalizedValue,
    collapseSurvivalEstablished: true, presentBoundOrbitEstablished: true,
    orbitVerifiedAtAgeBillionYears: neutron.formationAgeBillionYears +
      neutron.ageSinceFormationBillionYears,
    postCollapseSemiMajorAxisAu: 0.36, postCollapseEccentricity: 0.02,
  };
  return { pulsar, neutron, planet, host, evidence };
}

describe('27.9 — existing-body pulsar-planet system projection', () => {
  it('does not conjure planets when evidence or a pulsar is missing', () => {
    const source = pulsarPlanetFixture();
    expect(PulsarPlanetEngine.fromExistingPlanets(source.pulsar)).toEqual([]);
    expect(PulsarPlanetEngine.fromExistingPlanets(null)).toEqual([]);
    expect(Object.isFrozen(PulsarPlanetEngine.fromExistingPlanets(source.pulsar))).toBe(true);
    expect(() => PulsarPlanetEngine.fromExistingPlanets(null,
      [{ planet: source.planet, survivalEvidence: source.evidence }])).toThrow(RangeError);
  });

  it('uses existing Earth-mass analogs without inventing identities or consuming PRNG state', () => {
    const inner = pulsarPlanetFixture(2n, 0.02, 'B'.repeat(32));
    const outer = pulsarPlanetFixture(2n, 4.3, 'C'.repeat(32));
    // They represent the same physical host; use the original host aggregate.
    const outerPlanet = Object.assign(Object.create(Object.getPrototypeOf(outer.planet)), outer.planet,
      { hostPlanetarySystem: inner.planet.hostPlanetarySystem });
    const outerEvidence = { ...outer.evidence, planetBodySeedHex: outerPlanet.seed.normalizedValue };
    const inputs = [
      { planet: outerPlanet, survivalEvidence: outerEvidence },
      { planet: inner.planet, survivalEvidence: { ...inner.evidence,
        postCollapseSemiMajorAxisAu: 0.19, postCollapseEccentricity: 0 } },
    ];
    const first = PulsarPlanetEngine.fromExistingPlanets(inner.pulsar, inputs);
    const again = PulsarPlanetEngine.fromExistingPlanets(inner.pulsar, inputs);
    expect(first).toEqual(again);
    expect(first).toHaveLength(2);
    expect(first[0]).toBeInstanceOf(PulsarPlanet);
    expect(first[0]!.planet).toBe(inner.planet);
    expect(first[1]!.planet).toBe(outerPlanet);
    expect(first[0]!.semiMajorAxisAu).toBe(0.19);
    expect(first[0]!.postCollapseOrbitalPeriodDays).toBeGreaterThan(20);
    expect(Object.isFrozen(first)).toBe(true);
    expect(inner.planet.seed.normalizedValue).toBe('B'.repeat(32));
  });

  it('rejects double counting the same canonical planet', () => {
    const source = pulsarPlanetFixture();
    const entry = { planet: source.planet, survivalEvidence: source.evidence };
    expect(() => PulsarPlanetEngine.fromExistingPlanets(source.pulsar, [entry, entry]))
      .toThrow(RangeError);
  });

  it('rejects crossing orbits and closely packed configurations instead of declaring them stable', () => {
    const inner = pulsarPlanetFixture(2n, 4.3, 'B'.repeat(32));
    const second = pulsarPlanetFixture(2n, 3.9, 'C'.repeat(32));
    const outer = Object.assign(Object.create(Object.getPrototypeOf(second.planet)), second.planet,
      { hostPlanetarySystem: inner.planet.hostPlanetarySystem });
    const entry = { planet: inner.planet, survivalEvidence: {
      ...inner.evidence, postCollapseSemiMajorAxisAu: 0.36, postCollapseEccentricity: 0.02,
    } };
    const evidence = { ...second.evidence, planetBodySeedHex: outer.seed.normalizedValue };
    expect(() => PulsarPlanetEngine.fromExistingPlanets(inner.pulsar, [entry,
      { planet: outer, survivalEvidence: { ...evidence,
        postCollapseSemiMajorAxisAu: 0.36, postCollapseEccentricity: 0.02 } },
    ])).toThrow(RangeError);
    expect(() => PulsarPlanetEngine.fromExistingPlanets(inner.pulsar, [entry,
      { planet: outer, survivalEvidence: { ...evidence,
        postCollapseSemiMajorAxisAu: 0.37, postCollapseEccentricity: 0 } },
    ])).toThrow(RangeError);
  });

  it('rejects invalid arrays and bounds the exceptional population', () => {
    const source = pulsarPlanetFixture();
    expect(() => PulsarPlanetEngine.fromExistingPlanets(source.pulsar,
      null as never)).toThrow(TypeError);
    const entry = { planet: source.planet, survivalEvidence: source.evidence };
    expect(() => PulsarPlanetEngine.fromExistingPlanets(source.pulsar,
      Array(9).fill(entry))).toThrow(RangeError);
  });
});
