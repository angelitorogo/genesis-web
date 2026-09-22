import { GeneratorVersion } from '../../domain/generation/generator-version';
import { SystemLocator } from '../../domain/generation/procedural-locator';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { StellarEvolutionInput } from '../../domain/stellar/stellar-evolution-input';
import { StellarLifetimeProfile } from '../../domain/stellar/stellar-lifetime-profile';
import { StellarNeutronStar } from '../../domain/stellar/stellar-neutron-star';
import { StellarPhysicalProperties } from '../../domain/stellar/stellar-physical-properties';
import { StellarPulsar, type StellarPulsarRecyclingEvidence } from '../../domain/stellar/stellar-pulsar';
import { Star } from '../../domain/stellar/star';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { StellarEvolutionEngine } from './stellar-evolution-engine';
import { StellarNeutronStarEngine } from './stellar-neutron-star-engine';
import { StellarPulsarEngine } from './stellar-pulsar-engine';

const seed = UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1');
const key = new UniverseGenerationKey(seed, GeneratorVersion.V1);

function evolved(mass = 16, age = 0.02, index = 2n, identity = key): {
  star: Star;
  physical: StellarPhysicalProperties;
  lifetime: StellarLifetimeProfile;
} {
  // Frozen 14.8 evaluator is private-V1 physical code; V2 components may
  // carry their independently derived identity without regenerating parents.
  const assessment = StellarEvolutionEngine.evaluate(key,
    new StellarEvolutionInput(mass, 1, age));
  const terminal = assessment.mainSequenceLifetimeBillionYears === null ||
    assessment.postMainSequenceDurationBillionYears === null ? null :
    assessment.mainSequenceLifetimeBillionYears + assessment.postMainSequenceDurationBillionYears;
  return {
    star: new Star(identity, new SystemLocator(0n, 123456789n, index),
      assessment.evolutionState, assessment.mainSequenceClass,
      assessment.brownDwarfClass, assessment.postMainSequenceStage,
      assessment.whiteDwarfComposition, assessment.neutronStarFormationChannel,
      assessment.blackHoleFormationChannel),
    physical: new StellarPhysicalProperties(mass, mass, 8, 90_000, 30_000),
    lifetime: new StellarLifetimeProfile(age, terminal, terminal === null ? null :
      Math.max(0, terminal - age), assessment),
  };
}

function neutron(mass = 16, age = 0.02, index = 2n, identity = key): StellarNeutronStar {
  const source = evolved(mass, age, index, identity);
  const result = StellarNeutronStarEngine.fromExistingStar(
    source.star, source.physical, source.lifetime);
  if (result === null) throw new Error('Expected canonical neutron star.');
  return result;
}

function evidence(star: StellarNeutronStar): StellarPulsarRecyclingEvidence {
  return {
    massTransferConfirmed: true,
    companionIdentity: 'COMPANION_B',
    recyclingAgeBillionYears: star.formationAgeBillionYears +
      star.ageSinceFormationBillionYears / 2,
  };
}

describe('27.5 — pulsars and evidence-gated millisecond pulsars', () => {
  it('derives ordinary pulsar candidates from the exact existing neutron star only', () => {
    const source = neutron();
    const before = [source.star, source.massSolar, source.radiusKm, source.ageSinceFormationBillionYears] as const;
    const result = StellarPulsarEngine.fromExistingNeutronStar(source);
    expect(result).toBeInstanceOf(StellarPulsar);
    expect(result!.kind).toBe('ORDINARY');
    expect(result!.neutronStar).toBe(source);
    expect(result!.recyclingEvidence).toBeNull();
    expect(result!.initialSpinPeriodSeconds).toBeGreaterThanOrEqual(0.04);
    expect(result!.spinPeriodSeconds).toBeGreaterThan(result!.initialSpinPeriodSeconds);
    expect(Object.isFrozen(result)).toBe(true);
    expect([source.star, source.massSolar, source.radiusKm, source.ageSinceFormationBillionYears]).toEqual(before);
  });

  it('is repeatable without consuming any existing generation stream or changing Star identity', () => {
    const source = neutron();
    const first = StellarPulsarEngine.fromExistingNeutronStar(source);
    const second = StellarPulsarEngine.fromExistingNeutronStar(source);
    expect(first).toEqual(second);
    expect(first!.neutronStar.star).toBe(source.star);
    expect(first!.neutronStar.star.generationKey).toBe(key);
  });

  it('uses the constant-B dipole-inspired spin law with correct SI seconds and units', () => {
    const star = neutron();
    const pulsar = StellarPulsarEngine.fromExistingNeutronStar(star)!;
    const coefficient = (pulsar.dipolarMagneticFieldTesla * 1e4 / 3.2e19) ** 2;
    const predicted = Math.sqrt(pulsar.initialSpinPeriodSeconds ** 2 +
      2 * coefficient * star.ageSinceFormationBillionYears * StellarPulsar.SECONDS_PER_GYR);
    expect(pulsar.spinPeriodSeconds).toBeCloseTo(predicted, 12);
    expect(pulsar.periodDerivativeSecondsPerSecond).toBeCloseTo(
      coefficient / pulsar.spinPeriodSeconds, 12);
    expect(pulsar.spinFrequencyHz).toBeCloseTo(1 / pulsar.spinPeriodSeconds, 12);
    expect(pulsar.rotationalEnergyLossWatts).toBeCloseTo(
      4 * Math.PI ** 2 * 1e38 * pulsar.periodDerivativeSecondsPerSecond /
      pulsar.spinPeriodSeconds ** 3, 5);
    expect(pulsar.characteristicSpinDownAgeYears).toBeGreaterThan(0);
  });

  it('models beaming geometry, not an invented detection, radio flux or observed discovery state', () => {
    const pulsar = StellarPulsarEngine.fromExistingNeutronStar(neutron())!;
    const separation = Math.min(
      Math.abs(pulsar.observerInclinationDegrees - pulsar.magneticInclinationDegrees),
      Math.abs(pulsar.observerInclinationDegrees - (180 - pulsar.magneticInclinationDegrees)),
    );
    expect(pulsar.beamCrossesLineOfSight).toBe(
      separation <= pulsar.beamHalfOpeningAngleDegrees);
    expect(Object.keys(pulsar).includes('discoveryState')).toBe(false);
    expect(Object.keys(pulsar).includes('observedFlux')).toBe(false);
  });

  it('does not turn every neutron star into an ordinary pulsar', () => {
    // Hashed eligibility remains independent of progenitor physical draws.
    expect(StellarPulsarEngine.fromExistingNeutronStar(neutron(16, 0.02, 1n))).toBeNull();
    expect(StellarPulsarEngine.fromExistingNeutronStar(neutron(16, 13.8))).toBeNull();
  });

  it('never creates millisecond pulsars or imaginary companions without recycling evidence', () => {
    for (let index = 0n; index < 24n; index++) {
      const pulsar = StellarPulsarEngine.fromExistingNeutronStar(neutron(16, 0.02, index));
      if (pulsar !== null) {
        expect(pulsar.kind).toBe('ORDINARY');
        expect(pulsar.recyclingEvidence).toBeNull();
      }
    }
  });

  it('produces a distinct, repeatable millisecond pulsar only with verified mass-transfer inputs', () => {
    const star = neutron(16, 2);
    const origin = evidence(star);
    const pulsar = StellarPulsarEngine.fromExistingNeutronStar(star, origin);
    expect(pulsar).toBeInstanceOf(StellarPulsar);
    expect(pulsar!.kind).toBe('MILLISECOND');
    expect(pulsar!.spinPeriodSeconds).toBeLessThan(0.03);
    expect(pulsar!.spinPeriodSeconds).toBeGreaterThanOrEqual(0.002);
    expect(pulsar!.dipolarMagneticFieldTesla).toBeGreaterThanOrEqual(1e4);
    expect(pulsar!.dipolarMagneticFieldTesla).toBeLessThanOrEqual(1e5);
    expect(pulsar!.recyclingEvidence!.companionIdentity).toBe('COMPANION_B');
    expect(Object.isFrozen(pulsar!.recyclingEvidence)).toBe(true);
    expect(StellarPulsarEngine.fromExistingNeutronStar(star, origin)).toEqual(pulsar);
    expect(Object.keys(star).includes('companion')).toBe(false);
  });

  it('uses age SINCE recycling for millisecond spin-down, not age since neutron-star formation', () => {
    const star = neutron(16, 1);
    const origin = evidence(star);
    const pulsar = StellarPulsarEngine.fromExistingNeutronStar(star, origin)!;
    const factor = (pulsar.dipolarMagneticFieldTesla * 1e4 / 3.2e19) ** 2;
    const timeGyr = star.formationAgeBillionYears + star.ageSinceFormationBillionYears -
      origin.recyclingAgeBillionYears;
    expect(pulsar.spinPeriodSeconds ** 2).toBeCloseTo(
      pulsar.initialSpinPeriodSeconds ** 2 + 2 * factor * timeGyr *
      StellarPulsar.SECONDS_PER_GYR, 12);
  });

  it('rejects fabricated, malformed or temporally impossible recycling evidence', () => {
    const star = neutron();
    const invalid: readonly StellarPulsarRecyclingEvidence[] = [
      { ...evidence(star), massTransferConfirmed: false as true },
      { ...evidence(star), companionIdentity: '' },
      { ...evidence(star), recyclingAgeBillionYears: Number.NaN },
      { ...evidence(star), recyclingAgeBillionYears: star.formationAgeBillionYears - 1 },
      { ...evidence(star), recyclingAgeBillionYears: 14 },
    ];
    for (const item of invalid) {
      expect(() => StellarPulsarEngine.fromExistingNeutronStar(star, item)).toThrow(RangeError);
    }
  });

  it('validates direct profile invariants and prevents fake millisecond classification', () => {
    const star = neutron();
    const pulsar = StellarPulsarEngine.fromExistingNeutronStar(star)!;
    expect(() => new StellarPulsar(star, 'MILLISECOND', 0.004, 0.005,
      1e4, 40, 60, 15, null)).toThrow(RangeError);
    expect(() => new StellarPulsar(star, 'ORDINARY', 0.04, 0.03,
      1e7, 40, 60, 15, null)).toThrow(RangeError);
    expect(() => new StellarPulsar(star, 'ORDINARY', 0.04, 0.05,
      1e10, 40, 60, 15, null)).toThrow(RangeError);
    expect(() => new StellarPulsar(star, 'ORDINARY', 0.04, 0.05,
      1e7, 40, Number.NaN, 15, null)).toThrow(RangeError);
    expect(() => new StellarPulsar(star, 'ORDINARY', 0.04, 0.05,
      1e7, 40, 60, 0, null)).toThrow(RangeError);
    expect(pulsar.kind).toBe('ORDINARY');
  });

  it('accepts V2 only with supplied ACTUAL component identity, never rederives a public system', () => {
    const base = neutron();
    const privateHostKey = new UniverseGenerationKey(
      UniverseSeed.parse('0123-4567-89AB-CDEF-0123-4567-89AB-CDEF'), GeneratorVersion.V1);
    const other = neutron(16, 0.02, 2n, privateHostKey);
    expect(StellarPulsarEngine.fromExistingNeutronStar(base)).not.toEqual(
      StellarPulsarEngine.fromExistingNeutronStar(other));
    expect(other.star.generationKey).toBe(privateHostKey);
    const publicV2 = new UniverseGenerationKey(seed, GeneratorVersion.V2);
    const sameEvolution = evolved(16, 0.02, 2n, publicV2);
    const component = StellarNeutronStarEngine.fromExistingStar(
      sameEvolution.star, sameEvolution.physical, sameEvolution.lifetime)!;
    expect(StellarPulsarEngine.fromExistingNeutronStar(component) === null ||
      StellarPulsarEngine.fromExistingNeutronStar(component)!.neutronStar.star).toBe(component.star);
  });

  it('rejects non-neutron-star input and keeps all generated profiles read-only', () => {
    expect(() => StellarPulsarEngine.fromExistingNeutronStar(
      null as unknown as StellarNeutronStar)).toThrow(TypeError);
    const blackHole = evolved(50);
    expect(StellarNeutronStarEngine.fromExistingStar(
      blackHole.star, blackHole.physical, blackHole.lifetime,
    )).toBeNull();
  });
});
