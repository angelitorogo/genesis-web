import { GeneratorVersion } from '../../domain/generation/generator-version';
import { SystemLocator } from '../../domain/generation/procedural-locator';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { StellarEvolutionInput } from '../../domain/stellar/stellar-evolution-input';
import { SystemSeed } from '../../domain/seed/hierarchical-seeds';
import { StellarCompanion } from '../../domain/stellar/stellar-companion';
import { StellarComponentDesignation } from '../../domain/stellar/stellar-component-designation';
import { StellarDesignation } from '../../domain/stellar/stellar-designation';
import { StellarOrbitHierarchy } from '../../domain/stellar/stellar-orbit-hierarchy';
import { StellarSpectralAppearance } from '../../domain/stellar/stellar-spectral-appearance';
import { StellarSystemComponentLabel } from '../../domain/stellar/stellar-system-component-label';
import { StellarLifetimeProfile } from '../../domain/stellar/stellar-lifetime-profile';
import { StellarPhysicalProperties } from '../../domain/stellar/stellar-physical-properties';
import { StellarRelativeOrbit } from '../../domain/stellar/stellar-relative-orbit';
import { StellarSystem } from '../../domain/stellar/stellar-system';
import { StellarSystemMultiplicity } from '../../domain/stellar/stellar-system-multiplicity';
import { Star } from '../../domain/stellar/star';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { type GeneratedMultipleHost } from './stellar-multihost-formation';
import { CompactBinaryEngine } from './compact-binary-engine';
import { StellarBlackHoleEngine } from './stellar-black-hole-engine';
import { StellarEvolutionEngine } from './stellar-evolution-engine';
import { StellarNeutronStarEngine } from './stellar-neutron-star-engine';
import { CircumbinaryPlanetCompatibilityGenerator } from '../planetary/circumbinary-planet-compatibility-generator';
import { CircumbinaryHabitabilityAssessmentGenerator } from '../habitability/circumbinary-habitability-assessment-generator';

const key = new UniverseGenerationKey(
  UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1'), GeneratorVersion.V1,
);
const locator = new SystemLocator(0n, 123456789n, 8n);

function evolved(mass: number, age = 1): {
  star: Star; physical: StellarPhysicalProperties; lifetime: StellarLifetimeProfile;
} {
  const assessment = StellarEvolutionEngine.evaluate(key, new StellarEvolutionInput(mass, 1, age));
  const terminal = assessment.mainSequenceLifetimeBillionYears === null ||
    assessment.postMainSequenceDurationBillionYears === null ? null :
    assessment.mainSequenceLifetimeBillionYears + assessment.postMainSequenceDurationBillionYears;
  return {
    star: new Star(key, locator, assessment.evolutionState, assessment.mainSequenceClass,
      assessment.brownDwarfClass, assessment.postMainSequenceStage,
      assessment.whiteDwarfComposition, assessment.neutronStarFormationChannel,
      assessment.blackHoleFormationChannel),
    physical: new StellarPhysicalProperties(mass, mass, 8, 90_000, 30_000),
    lifetime: new StellarLifetimeProfile(age, terminal,
      terminal === null ? null : Math.max(0, terminal - age), assessment),
  };
}

function multi(massA: number, massB: number, triple = false): GeneratedMultipleHost {
  const primary = evolved(massA);
  const secondary = evolved(massB);
  const source = (label: 'A' | 'B' | 'C', seed: string, component: typeof primary) => ({
    label, stellarSystem: { seed: { normalizedValue: seed }, primaryStar: component.star },
    physical: component.physical, lifetime: component.lifetime,
  });
  const components = [source('A', 'A'.repeat(32), primary), source('B', 'B'.repeat(32), secondary)];
  if (triple) components.push(source('C', 'D'.repeat(32), evolved(1)));
  // Unit-level existing-aggregate fixture: the engine reads only actual
  // component physics, seed identities and the already generated inner orbit.
  return {
    parentSystemSeedHex: 'A'.repeat(32),
    multiplicity: triple ? StellarSystemMultiplicity.TRIPLE : StellarSystemMultiplicity.BINARY,
    components,
    innerOrbit: new StellarRelativeOrbit(0.08, 0.12, 0.04),
    outerOrbit: triple ? new StellarRelativeOrbit(50, 0.18, 100) : null,
  } as unknown as GeneratedMultipleHost;
}

describe('27.8 — existing V1/V2 multi-host compact binary projection', () => {
  it('reuses physical NS/BH masses from 27.1 and 27.4 for the same actual component Stars', () => {
    const source = multi(16, 40);
    const binary = CompactBinaryEngine.fromExistingMultihost(source)!;
    const [a, b] = source.components;
    expect(binary.kind).toBe('NS_BH');
    expect(binary.primary.massSolar).toBe(StellarNeutronStarEngine.fromExistingStar(
      a!.stellarSystem.primaryStar, a!.physical, a!.lifetime,
    )!.massSolar);
    expect(binary.secondary.massSolar).toBe(StellarBlackHoleEngine.fromExistingStar(
      b!.stellarSystem.primaryStar, b!.physical, b!.lifetime,
    )!.massSolar);
    expect(binary.parentSystemSeedHex).toBe(source.parentSystemSeedHex);
    expect(binary.originalInnerOrbit).toBe(source.innerOrbit);
    expect(CompactBinaryEngine.fromExistingMultihost(source)).toEqual(binary);
  });

  it('uses existing WD/NS/BH evolutionary states without inventing companion remnant families', () => {
    expect(CompactBinaryEngine.fromExistingMultihost(multi(3, 16))!.kind).toBe('WD_NS');
    expect(CompactBinaryEngine.fromExistingMultihost(multi(3, 3))!.kind).toBe('WD_WD');
    expect(CompactBinaryEngine.fromExistingMultihost(multi(40, 3))!.kind).toBe('WD_BH');
    expect(CompactBinaryEngine.fromExistingMultihost(multi(40, 40))!.kind).toBe('BH_BH');
  });

  it('does not turn ordinary star/BH or a single star into a compact binary', () => {
    expect(CompactBinaryEngine.fromExistingMultihost(multi(1, 40))).toBeNull();
    expect(CompactBinaryEngine.fromExistingMultihost(multi(16, 1))).toBeNull();
  });

  it('TRIPLE only classifies its actual inner A-B orbit; outer C is not a fictional binary member', () => {
    const source = multi(16, 40, true);
    const binary = CompactBinaryEngine.fromExistingMultihost(source)!;
    expect(binary.kind).toBe('NS_BH');
    expect(binary.originalInnerOrbit).toBe(source.innerOrbit);
    expect(binary.secondary.componentSeedHex).toBe('B'.repeat(32));
    expect(binary.secondary.componentSeedHex).not.toBe('D'.repeat(32));
  });

  it('refuses missing, reordered or falsified parent/child source identities', () => {
    const source = multi(16, 40);
    expect(() => CompactBinaryEngine.fromExistingMultihost({ ...source,
      components: source.components.slice().reverse(),
    })).toThrow(RangeError);
    expect(() => CompactBinaryEngine.fromExistingMultihost({ ...source,
      parentSystemSeedHex: 'F'.repeat(32),
    })).toThrow(RangeError);
    expect(() => CompactBinaryEngine.fromExistingMultihost({ ...source,
      components: source.components.slice(0, 1),
    })).toThrow(RangeError);
  });

  it('classifies a REAL legacy phase-16 StellarSystem and agrees with 27.1/27.4 remnant masses', () => {
    const first = evolved(40);
    const second = evolved(16);
    const designation = new StellarDesignation('Prueba', 'TEST-27-8');
    const companion = new StellarCompanion(
      StellarSystemComponentLabel.B, 'B'.repeat(32),
      new StellarComponentDesignation(designation, StellarSystemComponentLabel.B),
      first.physical.initialMassSolar,
      second.physical.initialMassSolar / first.physical.initialMassSolar,
      second.physical,
      new StellarSpectralAppearance({} as ConstructorParameters<typeof StellarSpectralAppearance>[0],
        {} as ConstructorParameters<typeof StellarSpectralAppearance>[1]),
      second.lifetime,
    );
    const orbit = new StellarRelativeOrbit(0.08, 0.12, Math.sqrt(0.08 ** 3 / 56));
    const hierarchy = new StellarOrbitHierarchy(StellarSystemMultiplicity.BINARY, orbit, null);
    const compatibility = CircumbinaryPlanetCompatibilityGenerator.generateBinary(
      key, hierarchy, first.physical, companion);
    const habitability = CircumbinaryHabitabilityAssessmentGenerator.generate(
      key, compatibility, first.physical, first.star, companion, hierarchy);
    const system = new StellarSystem(key, locator, new SystemSeed('A'.repeat(32)), designation,
      StellarSystemMultiplicity.BINARY, first.star, hierarchy, companion, null, compatibility, habitability);
    const result = CompactBinaryEngine.fromExistingSystem(system, first.physical, first.lifetime)!;
    expect(result.kind).toBe('NS_BH');
    expect(result.primary.massSolar).toBe(StellarBlackHoleEngine.fromExistingStar(
      first.star, first.physical, first.lifetime,
    )!.massSolar);
    expect(result.secondary.massSolar).toBe(StellarNeutronStarEngine.fromExistingStar(
      second.star, second.physical, second.lifetime,
    )!.massSolar);
    expect(result.originalInnerOrbit).toBe(orbit);
    expect(CompactBinaryEngine.fromExistingSystem(system, first.physical, first.lifetime)).toEqual(result);
    expect(system.secondaryCompanion).toBe(companion);
    expect(system.primaryStar).toBe(first.star);
    const erroneous = evolved(3, 10);
    expect(() => CompactBinaryEngine.fromExistingSystem(system, erroneous.physical,
      erroneous.lifetime)).toThrow(RangeError);
  });

  it('legacy V1 wrapper accepts no single-star system, and does not mutate it', () => {
    // Constructor validates runtime identity, not structural mocks. This fixture
    // exercises the read-only early exit without invoking unrelated generation.
    const single = Object.assign(Object.create(StellarSystem.prototype) as StellarSystem, {
      secondaryCompanion: null, orbitHierarchy: { innerOrbit: null },
    });
    const physical = evolved(16);
    expect(CompactBinaryEngine.fromExistingSystem(single, physical.physical, physical.lifetime)).toBeNull();
    expect(single.secondaryCompanion).toBeNull();
  });
});
