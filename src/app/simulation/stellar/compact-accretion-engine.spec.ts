import { IntermediateMassBlackHole } from '../../domain/galactic-object/intermediate-mass-black-hole';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { GalacticObjectLocator, SystemLocator } from '../../domain/generation/procedural-locator';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { CompactAccretionDisk } from '../../domain/stellar/compact-accretion-disk';
import { StellarEvolutionInput } from '../../domain/stellar/stellar-evolution-input';
import { StellarLifetimeProfile } from '../../domain/stellar/stellar-lifetime-profile';
import { StellarPhysicalProperties } from '../../domain/stellar/stellar-physical-properties';
import { Star } from '../../domain/stellar/star';
import { GalacticNucleus } from '../../domain/universe/galactic-nucleus';
import { GalacticSupermassiveBlackHole } from '../../domain/universe/galactic-supermassive-black-hole';
import { GalacticNucleusState } from '../../domain/universe/galactic-nucleus-state';
import { Galaxy } from '../../domain/universe/galaxy';
import { GalaxyType } from '../../domain/universe/galaxy-type';
import { SupermassiveBlackHole } from '../../domain/universe/supermassive-black-hole';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { IntermediateMassBlackHoleGenerator } from '../galactic-object/intermediate-mass-black-hole-generator';
import { GalacticSupermassiveBlackHoleGenerator } from '../nuclear/galactic-supermassive-black-hole-generator';
import { StellarBlackHoleEngine } from './stellar-black-hole-engine';
import { StellarEvolutionEngine } from './stellar-evolution-engine';
import { GalaxyGenerator } from '../universe/galaxy-generator';
import { CompactAccretionEngine as Engine } from './compact-accretion-engine';

const seed = UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1');
const v1 = new UniverseGenerationKey(seed, GeneratorVersion.V1);
const v2 = new UniverseGenerationKey(seed, GeneratorVersion.V2);
const jets = {
  launchingEstablished: true as const, sourceIdentity: 'confirmed-jet:1',
  bulkLorentzFactor: 8, observerAxisAngleDegrees: 24,
  kineticEnergyFraction: 0.08,
};

function galaxyWith(state: GalacticNucleusState | null, key = v1): Galaxy {
  const base = GalaxyGenerator.generate(key, 0n);
  const mass = base.nucleus?.supermassiveBlackHole?.massSolarMasses ?? 1e6;
  return new Galaxy(key, base.index, base.seed, base.designation,
    GalaxyType.ELLIPTICAL, base.physicalProperties,
    state === null ? null : new GalacticNucleus(state, new SupermassiveBlackHole(mass)));
}

function stellarHole() {
  const mass = 40;
  const evolution = StellarEvolutionEngine.evaluate(v1, new StellarEvolutionInput(mass, 1, 1));
  const terminal = evolution.mainSequenceLifetimeBillionYears! +
    evolution.postMainSequenceDurationBillionYears!;
  const star = new Star(v1, new SystemLocator(0n, 12n, 2n),
    evolution.evolutionState, evolution.mainSequenceClass, evolution.brownDwarfClass,
    evolution.postMainSequenceStage, evolution.whiteDwarfComposition,
    evolution.neutronStarFormationChannel, evolution.blackHoleFormationChannel);
  const hole = StellarBlackHoleEngine.fromExistingStar(star,
    new StellarPhysicalProperties(mass, mass, 8, 90_000, 30_000),
    new StellarLifetimeProfile(1, terminal, 0, evolution));
  if (!hole) throw new Error('Fixture must have an existing compact remnant.');
  return hole;
}

describe('27.7 — disks and relativistic jets are optional views of real existing black holes', () => {
  it('makes an active AGN disk from the canonical nuclear hole, without creating a jet', () => {
    const galaxy = galaxyWith(GalacticNucleusState.AGN);
    const initialState = galaxy.nucleus!.state;
    const first = Engine.fromExistingGalaxy(galaxy)!;
    expect(first.disk.massSolar)
      .toBe(galaxy.nucleus!.supermassiveBlackHole!.massSolarMasses);
    expect(first.disk.hostKind).toBe('SUPERMASSIVE');
    expect(first.disk.eddingtonRatio).toBe(0.04);
    expect(first.jet).toBeNull();
    expect(first).toEqual(Engine.fromExistingGalaxy(galaxy));
    expect(galaxy.nucleus!.state).toBe(initialState);
    expect(Object.isFrozen(first.disk)).toBe(true);
    expect(Object.isFrozen(first)).toBe(true);
  });

  it('uses a distinct, explicit QUASAR proxy for both canonical versions', () => {
    const old = Engine.fromExistingGalaxy(galaxyWith(GalacticNucleusState.QUASAR, v1))!;
    const newer = Engine.fromExistingGalaxy(galaxyWith(GalacticNucleusState.QUASAR, v2))!;
    expect(old.disk.eddingtonRatio).toBe(0.3);
    expect(newer.disk.eddingtonRatio).toBe(0.3);
    expect((newer.disk.host as GalacticSupermassiveBlackHole).generationKey).toBe(v2);
    expect(old.jet).toBeNull();
    expect(newer.jet).toBeNull();
  });

  it('never invents accretion in a QUIESCENT / absent galactic centre', () => {
    expect(Engine.fromExistingGalaxy(galaxyWith(GalacticNucleusState.QUIESCENT))).toBeNull();
    const quietGalaxy = galaxyWith(GalacticNucleusState.QUIESCENT);
    const quietHost = GalacticSupermassiveBlackHoleGenerator.fromGalaxy(quietGalaxy)!;
    expect(() => new CompactAccretionDisk(quietHost, 0.1)).toThrow(RangeError);
    expect(Engine.fromExistingGalaxy(galaxyWith(null))).toBeNull();
    expect(() => Engine.fromExistingGalaxy(galaxyWith(null), jets)).toThrow(RangeError);
    expect(() => Engine.fromExistingGalaxy(galaxyWith(GalacticNucleusState.QUIESCENT), jets))
      .toThrow(RangeError);
  });

  it('requires an explicit, named gas supply for EXISTING stellar and intermediate-mass holes', () => {
    const stellar = stellarHole();
    const imbh = IntermediateMassBlackHoleGenerator.generate(v1,
      new GalacticObjectLocator(0n, -73014444020n, 0n))!;
    expect(imbh).toBeInstanceOf(IntermediateMassBlackHole);
    for (const host of [stellar, imbh]) {
      expect(Engine.fromExistingBlackHole(host, null)).toBeNull();
      const first = Engine.fromExistingBlackHole(host,
        { sourceIdentity: 'independent-gas-model:1', eddingtonRatio: 0.08 })!;
      expect(first.disk.host).toBe(host);
      expect(first.jet).toBeNull();
      expect(first.disk.hostKind).toBe(host === stellar ? 'STELLAR' : 'INTERMEDIATE');
    }
    expect(() => Engine.fromExistingBlackHole(stellar, { sourceIdentity: '', eddingtonRatio: 0.1 }))
      .toThrow(RangeError);
  });

  it('links an independently evidenced bipolar jet to the exact disk, not to every AGN', () => {
    const active = Engine.fromExistingGalaxy(galaxyWith(GalacticNucleusState.AGN), jets)!;
    expect(active.jet!.disk).toBe(active.disk);
    expect(active.jet!.launchParameters).toEqual(jets);
    expect(active.jet!.launchParameters).not.toBe(jets);
    expect(Object.isFrozen(active.jet!.launchParameters)).toBe(true);
    expect(active.jet!.powerPerJetWatts * 2).toBe(active.jet!.totalBipolarKineticPowerWatts);
    expect(active.jet!.bulkVelocityMetresPerSecond).toBeLessThan(299_792_458);
    expect(Engine.fromExistingGalaxy(galaxyWith(GalacticNucleusState.AGN))!.jet).toBeNull();
  });

  it('validates supply, host, jet parameters and the missing-disk case', () => {
    const star = stellarHole();
    expect(() => Engine.fromExistingBlackHole(null as never, null)).toThrow(TypeError);
    expect(() => Engine.fromExistingGalaxy(null as never)).toThrow(TypeError);
    expect(() => Engine.fromExistingBlackHole(star, null, jets)).toThrow(RangeError);
    for (const ratio of [-1, 0, 1.01, Number.NaN, Infinity]) {
      expect(() => Engine.fromExistingBlackHole(star,
        { sourceIdentity: 'companion:1', eddingtonRatio: ratio })).toThrow(RangeError);
    }
    for (const invalid of [
      { ...jets, launchingEstablished: false },
      { ...jets, sourceIdentity: '' },
      { ...jets, bulkLorentzFactor: 1 },
      { ...jets, bulkLorentzFactor: Infinity },
      { ...jets, observerAxisAngleDegrees: -2 },
      { ...jets, kineticEnergyFraction: 0.5 },
    ]) {
      expect(() => Engine.fromExistingBlackHole(star,
        { sourceIdentity: 'companion:1', eddingtonRatio: 0.1 },
        invalid as typeof jets)).toThrow(RangeError);
    }
  });
});
