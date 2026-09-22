import { GeneratorVersion } from '../../domain/generation/generator-version';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { GalacticNucleusState } from '../../domain/universe/galactic-nucleus-state';
import { GalacticNucleus } from '../../domain/universe/galactic-nucleus';
import { Galaxy } from '../../domain/universe/galaxy';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { CompactAccretionDisk } from '../../domain/stellar/compact-accretion-disk';
import { CompactAccretionSystem } from '../../domain/stellar/compact-accretion-system';
import { RelativisticJet } from '../../domain/stellar/relativistic-jet';
import { GalaxyGenerator } from '../universe/galaxy-generator';
import { GalacticSupermassiveBlackHoleGenerator } from '../nuclear/galactic-supermassive-black-hole-generator';

// Real canonical host fixture; physical models themselves remain domain-only.
const key = new UniverseGenerationKey(
  UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1'), GeneratorVersion.V1);
const referenceGalaxy = GalaxyGenerator.generate(key, 0n);
const galaxy = new Galaxy(referenceGalaxy.generationKey, referenceGalaxy.index,
  referenceGalaxy.seed, referenceGalaxy.designation, referenceGalaxy.type,
  referenceGalaxy.physicalProperties, new GalacticNucleus(GalacticNucleusState.AGN,
    referenceGalaxy.nucleus!.supermassiveBlackHole!));
const host = GalacticSupermassiveBlackHoleGenerator.fromGalaxy(galaxy)!;

const parameters = {
  launchingEstablished: true as const, sourceIdentity: 'validated:jet:1',
  bulkLorentzFactor: 5, observerAxisAngleDegrees: 60, kineticEnergyFraction: 0.2,
};

describe('27.7 — dimensionally consistent reference physics', () => {
  it('uses mass-scaled Eddington luminosity and L=eta*Mdot*c²', () => {
    const disk = new CompactAccretionDisk(host, 0.1);
    expect(disk.eddingtonLuminosityWatts / (disk.massSolar * 1.26e31))
      .toBeCloseTo(1, 12);
    expect(disk.bolometricLuminosityWatts / disk.eddingtonLuminosityWatts).toBeCloseTo(0.1, 12);
    expect(disk.massAccretionRateKgPerSecond * 0.1 * 299_792_458 ** 2 /
      disk.bolometricLuminosityWatts).toBeCloseTo(1, 12);
    expect(disk.innerRadiusKm).toBe(3 * disk.schwarzschildRadiusKm);
    expect(disk.outerRadiusKm).toBe(1_000 * disk.schwarzschildRadiusKm);
    expect(disk.maximumEffectiveTemperatureKelvin).toBeGreaterThan(1e3);
    expect(Number.isFinite(disk.maximumEffectiveTemperatureKelvin)).toBe(true);
  });

  it('monotonically increases temperature with accretion fraction at fixed mass', () => {
    const low = new CompactAccretionDisk(host, 0.01);
    const high = new CompactAccretionDisk(host, 0.16);
    expect(high.maximumEffectiveTemperatureKelvin / low.maximumEffectiveTemperatureKelvin)
      .toBeCloseTo(2, 8);
    expect(high.massAccretionRateKgPerSecond / low.massAccretionRateKgPerSecond)
      .toBeCloseTo(16, 8);
  });

  it('uses a relativistic speed and kinetic energy without superluminal jets', () => {
    const disk = new CompactAccretionDisk(host, 0.1);
    const jet = new RelativisticJet(disk, parameters);
    expect(jet.bulkVelocityMetresPerSecond / 299_792_458)
      .toBeCloseTo(Math.sqrt(1 - 1 / 25), 12);
    expect(jet.totalBipolarKineticPowerWatts /
      (0.2 * disk.massAccretionRateKgPerSecond * 299_792_458 ** 2))
      .toBeCloseTo(1, 12);
    expect(jet.powerPerJetWatts).toBe(jet.totalBipolarKineticPowerWatts / 2);
    expect(new CompactAccretionSystem(disk, jet).jet).toBe(jet);
    expect(() => new CompactAccretionSystem(new CompactAccretionDisk(host, 0.2), jet))
      .toThrow(TypeError);
    expect(() => new RelativisticJet({} as never, parameters)).toThrow(TypeError);
  });

  it('does not add jet physics or accretion state to the original nuclear model', () => {
    expect(host.nucleusState).toBe(galaxy.nucleus!.state);
    expect(GalacticNucleusState.values).toContain(host.nucleusState);
    expect('jet' in host).toBe(false);
    expect('accretionRate' in galaxy.nucleus!).toBe(false);
  });
});
