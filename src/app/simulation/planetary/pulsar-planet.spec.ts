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

const key = new UniverseGenerationKey(
  UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1'), GeneratorVersion.V1,
);

// Real existing 14.8 -> 27.4 neutron-star construction, with a minimal phase-19
// aggregate shape ONLY for the Planet's read-only identity getters.
function fixture(index = 2n, massEarth = 4.3, bodyHex = 'B'.repeat(32)) {
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

describe('27.9 — evidence-gated reference orbit of an EXISTING pulsar planet', () => {
  it('keeps the same canonical planet, host and pulsar identity and is immutable', () => {
    const { pulsar, planet, evidence } = fixture();
    const profile = new PulsarPlanet(pulsar, planet, evidence);
    expect(profile.planet).toBe(planet);
    expect(profile.pulsar).toBe(pulsar);
    expect(profile.planet.seed.normalizedValue).toBe(evidence.planetBodySeedHex);
    expect(Object.isFrozen(profile)).toBe(true);
    expect(Object.isFrozen(profile.survivalEvidence)).toBe(true);
    expect(profile.survivalEvidence).not.toBe(evidence);
    expect(new PulsarPlanet(pulsar, planet, evidence)).toEqual(profile);
  });

  it('recalculates post-collapse Kepler period using ACTUAL remnant mass, not progenitor mass', () => {
    const { pulsar, planet, evidence } = fixture();
    const value = new PulsarPlanet(pulsar, planet, evidence);
    const aMetres = evidence.postCollapseSemiMajorAxisAu * PulsarPlanet.AU_METRES;
    const expected = 2 * Math.PI * Math.sqrt(aMetres ** 3 / (PulsarPlanet.G *
      (pulsar.neutronStar.massSolar * PulsarPlanet.SOLAR_MASS_KG +
        planet.massEarth * PulsarPlanet.EARTH_MASS_KG))) / 86_400;
    expect(value.postCollapseOrbitalPeriodDays).toBeCloseTo(expected, 12);
    expect(value.postCollapseOrbitalPeriodDays).toBeGreaterThan(40);
    expect(value.postCollapseOrbitalPeriodDays).toBeLessThan(100);
    expect(value.periastronAu).toBeCloseTo(0.36 * 0.98, 12);
  });

  it('exposes edge-on timing and isotropic-equivalent power ONLY as references, no detection', () => {
    const { pulsar, planet, evidence } = fixture();
    const value = new PulsarPlanet(pulsar, planet, evidence);
    const a = evidence.postCollapseSemiMajorAxisAu * PulsarPlanet.AU_METRES;
    const mPlanet = planet.massEarth * PulsarPlanet.EARTH_MASS_KG;
    const mStar = pulsar.neutronStar.massSolar * PulsarPlanet.SOLAR_MASS_KG;
    expect(value.edgeOnTimingSemiAmplitudeSeconds).toBeCloseTo(
      a * mPlanet / (mStar + mPlanet) / PulsarPlanet.C, 12);
    expect(value.isotropicEquivalentSpinDownFluxWm2).toBeCloseTo(
      pulsar.rotationalEnergyLossWatts / (4 * Math.PI * a * a), 12);
    expect(Object.keys(value)).not.toContain('discoveryState');
    expect(Object.keys(value)).not.toContain('habitability');
    expect(Object.keys(value)).not.toContain('measuredTimingResidual');
  });

  it('rejects missing/forged survival provenance, identity mixups and second-generation claims', () => {
    const { pulsar, planet, evidence } = fixture();
    const bad: PulsarPlanetSurvivalEvidence[] = [
      { ...evidence, collapseSurvivalEstablished: false as true },
      { ...evidence, presentBoundOrbitEstablished: false as true },
      { ...evidence, sourceIdentity: '' },
      { ...evidence, planetBodySeedHex: '0'.repeat(32) },
      { ...evidence, componentSystemSeedHex: '0'.repeat(32) },
      { ...evidence, origin: 'SECOND_GENERATION' as 'SURVIVED_CORE_COLLAPSE' },
    ];
    for (const item of bad) {
      expect(() => new PulsarPlanet(pulsar, planet, item)).toThrow(RangeError);
    }
  });

  it('rejects pre-collapse/future orbit evidence and non-finite orbital elements', () => {
    const { pulsar, planet, neutron, evidence } = fixture();
    for (const age of [neutron.formationAgeBillionYears - 0.01, Number.NaN,
      evidence.orbitVerifiedAtAgeBillionYears + 0.01]) {
      expect(() => new PulsarPlanet(pulsar, planet,
        { ...evidence, orbitVerifiedAtAgeBillionYears: age })).toThrow(RangeError);
    }
    for (const a of [-1, 0, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => new PulsarPlanet(pulsar, planet,
        { ...evidence, postCollapseSemiMajorAxisAu: a })).toThrow(RangeError);
    }
    for (const e of [-0.01, 1, Number.NaN]) {
      expect(() => new PulsarPlanet(pulsar, planet,
        { ...evidence, postCollapseEccentricity: e })).toThrow(RangeError);
    }
  });

  it('rejects periastra inside the tidal limit and refuses any other stellar component', () => {
    const source = fixture();
    expect(() => new PulsarPlanet(source.pulsar, source.planet,
      { ...source.evidence, postCollapseSemiMajorAxisAu: 0.00001 })).toThrow(RangeError);
    expect(() => new PulsarPlanet(fixture(3n).pulsar, source.planet,
      source.evidence)).toThrow(RangeError);
    expect(() => new PulsarPlanet(source.pulsar,
      null as unknown as Planet, source.evidence)).toThrow(TypeError);
    expect(source.neutron).toBeInstanceOf(StellarNeutronStar);
  });

  it('refuses circumbinary topology even when the A component happens to be a pulsar', () => {
    const source = fixture();
    const host = source.host as StellarSystem & { multiplicity: StellarSystemMultiplicity };
    host.multiplicity = StellarSystemMultiplicity.BINARY;
    expect(() => new PulsarPlanet(source.pulsar, source.planet, source.evidence))
      .toThrow(RangeError);
  });
});
