import { GeneratorVersion } from '../../domain/generation/generator-version';
import { GalacticObjectLocator } from '../../domain/generation/procedural-locator';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { GalacticSupermassiveBlackHole } from '../../domain/universe/galactic-supermassive-black-hole';
import { GalacticNucleus } from '../../domain/universe/galactic-nucleus';
import { GalacticNucleusState } from '../../domain/universe/galactic-nucleus-state';
import { Galaxy } from '../../domain/universe/galaxy';
import { GalaxyType } from '../../domain/universe/galaxy-type';
import { SupermassiveBlackHole } from '../../domain/universe/supermassive-black-hole';
import { SupermassiveBlackHolePhysicalProfile } from '../../domain/universe/supermassive-black-hole-physical-profile';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { IntermediateMassBlackHoleGenerator } from '../galactic-object/intermediate-mass-black-hole-generator';
import { GalaxyGenerator } from '../universe/galaxy-generator';
import { GalacticSupermassiveBlackHoleGenerator as Generator } from './galactic-supermassive-black-hole-generator';

describe('27.3 — SMBHs reuse the preexisting galactic-centre Ground Truth', () => {
  const seed = UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1');
  const v1 = new UniverseGenerationKey(seed, GeneratorVersion.V1);
  const v2 = new UniverseGenerationKey(seed, GeneratorVersion.V2);
  const nucleusLocator = new GalacticObjectLocator(0n, 0n, 0n);

  function replaceNucleus(galaxy: Galaxy, nucleus: GalacticNucleus | null,
    type = galaxy.type): Galaxy {
    return new Galaxy(galaxy.generationKey, galaxy.index, galaxy.seed,
      galaxy.designation, type, galaxy.physicalProperties, nucleus);
  }

  it('preserves the frozen galaxy mass, centre address and nuclear state without rerolling', () => {
    const galaxy = GalaxyGenerator.generate(v1, 0n);
    expect(galaxy.nucleus?.supermassiveBlackHole?.massSolarMasses)
      .toBe(139_081_637.61111212);
    const result = Generator.fromGalaxy(galaxy);
    expect(result).toBeInstanceOf(GalacticSupermassiveBlackHole);
    expect(result!.generationKey).toBe(v1);
    expect(result!.galaxyIndex).toBe(galaxy.index);
    expect(result!.nucleusLocator).toEqual(nucleusLocator);
    expect(result!.nucleusState).toBe(galaxy.nucleus!.state);
    expect(result!.physicalProfile.massSolarMasses)
      .toBe(galaxy.nucleus!.supermassiveBlackHole!.massSolarMasses);
    expect(result!.physicalProfile.hostTotalMassSolarMasses)
      .toBe(galaxy.physicalProperties.totalMassSolarMasses);
    expect(result!.physicalProfile.massFractionOfGalaxy).toBeLessThanOrEqual(0.01);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result!.nucleusLocator)).toBe(true);
    expect(galaxy.nucleus!.supermassiveBlackHole!.massSolarMasses)
      .toBe(139_081_637.61111212); // no mutation of canonical source
    expect(Generator.fromGalaxy(galaxy)).toEqual(result);
    expect(Generator.generate(v1, 0n)).toEqual(result);
    expect(Generator.generateForLocator(v1, nucleusLocator)).toEqual(result);
  });

  it('preserves V2 public identity with physically identical V1 nuclear mass and reference scales', () => {
    for (const index of [0n, 1n, 2n, 3n, 4n, 5n, 6n, 7n]) {
      const old = Generator.generate(v1, index);
      const current = Generator.generate(v2, index);
      expect(current === null).toBe(old === null);
      if (!old || !current) continue;
      expect(current.generationKey).toBe(v2);
      expect(old.generationKey).toBe(v1);
      expect(current.galaxyIndex).toBe(old.galaxyIndex);
      expect(current.nucleusLocator).toEqual(old.nucleusLocator);
      expect(current.nucleusState).toBe(old.nucleusState);
      expect(current.physicalProfile).toEqual(old.physicalProfile);
    }
  });

  it('does not invent an SMBH in a quiet nucleus with no BH or a legacy absent nucleus', () => {
    const galaxy = GalaxyGenerator.generate(v1, 0n);
    const noBh = replaceNucleus(galaxy,
      new GalacticNucleus(GalacticNucleusState.QUIESCENT, null));
    expect(Generator.fromGalaxy(noBh)).toBeNull();
    expect(Generator.fromGalaxy(replaceNucleus(galaxy, null))).toBeNull();
    expect(() => new GalacticSupermassiveBlackHole(noBh,
      new SupermassiveBlackHolePhysicalProfile(1e6, galaxy.physicalProperties.totalMassSolarMasses)))
      .toThrow(RangeError);
  });

  it('retains an existing quiet BH and AGN/QUASAR host states without assigning activity physics', () => {
    const galaxy = GalaxyGenerator.generate(v1, 0n);
    const mass = galaxy.nucleus!.supermassiveBlackHole!.massSolarMasses;
    for (const state of GalacticNucleusState.values) {
      const host = replaceNucleus(galaxy,
        new GalacticNucleus(state, new SupermassiveBlackHole(mass)),
        GalaxyType.ELLIPTICAL);
      const profile = Generator.fromGalaxy(host)!;
      expect(profile.nucleusState).toBe(state);
      expect(profile.physicalProfile.massSolarMasses).toBe(mass);
      expect('accretionRate' in profile).toBe(false);
      expect('jetLuminosity' in profile).toBe(false);
    }
  });

  it('respects the one reserved central identity and never collides with a 27.2 IMBH', () => {
    expect(Generator.generateForLocator(v1, new GalacticObjectLocator(0n, 0n, 1n)))
      .toBeNull();
    const distant = new GalacticObjectLocator(0n, -73014444020n, 0n);
    expect(IntermediateMassBlackHoleGenerator.isIntermediateMassBlackHoleLocator(v1, distant))
      .toBe(true);
    expect(Generator.generateForLocator(v1, distant)).toBeNull();
    expect(IntermediateMassBlackHoleGenerator.generate(v1, nucleusLocator)).toBeNull();
    expect(Generator.generateForLocator(v2, nucleusLocator)?.generationKey).toBe(v2);
  });

  it('rejects malformed inputs and incompatible nucleus/mass pairings', () => {
    const galaxy = GalaxyGenerator.generate(v1, 0n);
    expect(() => Generator.fromGalaxy(null as never)).toThrow(TypeError);
    expect(() => Generator.generateForLocator(v1, null as never)).toThrow(TypeError);
    expect(() => Generator.generate(v1, -1n)).toThrow(RangeError);
    const mass = galaxy.nucleus!.supermassiveBlackHole!.massSolarMasses;
    expect(() => new GalacticSupermassiveBlackHole(galaxy,
      new SupermassiveBlackHolePhysicalProfile(mass * 0.9,
        galaxy.physicalProperties.totalMassSolarMasses))).toThrow(RangeError);
    expect(() => new GalacticSupermassiveBlackHole(galaxy,
      {} as SupermassiveBlackHolePhysicalProfile)).toThrow(RangeError);
    const forbidden = replaceNucleus(galaxy,
      new GalacticNucleus(GalacticNucleusState.QUASAR, new SupermassiveBlackHole(mass)),
      GalaxyType.DWARF);
    expect(() => Generator.fromGalaxy(forbidden)).toThrow(RangeError);
    const impossibleMass = new SupermassiveBlackHole(galaxy.physicalProperties.totalMassSolarMasses * 0.02);
    expect(() => Generator.fromGalaxy(replaceNucleus(galaxy,
      new GalacticNucleus(GalacticNucleusState.QUIESCENT, impossibleMass))))
      .toThrow(RangeError);
  });
});
