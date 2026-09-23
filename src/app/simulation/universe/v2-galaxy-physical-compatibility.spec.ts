import { DiscoveryState } from '../../domain/discovery/discovery-state';
import { frozenPhysicalSourceKey } from '../../domain/generation/frozen-physical-source-key';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { GalaxyLocator, SystemLocator } from '../../domain/generation/procedural-locator';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { InitialExplorationStateGenerator } from '../exploration/initial-exploration-state-generator';
import { V2GalacticNucleusGenerator } from '../nuclear/v2-galactic-nucleus-generator';
import { ProceduralTargetResolver } from '../regeneration/procedural-target-resolver';
import { GalaxySectorGridGenerator } from '../sector/galaxy-sector-grid-generator';
import { GalaxySectorStellarDensityGenerator } from '../sector/galaxy-sector-stellar-density-generator';
import { GalaxyDesignationGenerator } from './galaxy-designation-generator';
import { GalaxyGenerator } from './galaxy-generator';
import { InitialGalaxyGenerator } from './initial-galaxy-generator';

const seed = UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1');
const v1 = new UniverseGenerationKey(seed, GeneratorVersion.V1);
const v2 = new UniverseGenerationKey(seed.copy(), GeneratorVersion.V2);

describe('Stage 12: frozen galactic physics with a distinct V2 public identity', () => {
  it('uses private physical inputs but retains the V2 identity on galaxies and designations', () => {
    expect(frozenPhysicalSourceKey(v1)).toBe(v1);
    const physical = frozenPhysicalSourceKey(v2);
    expect(physical.generatorVersion).toBe(GeneratorVersion.V1);
    expect(physical.equals(v2)).toBe(false);

    for (const index of [0n, 1n, 2n, 42n]) {
      const baseline = GalaxyGenerator.generate(v1, index);
      const newGalaxy = GalaxyGenerator.generate(v2, index);
      expect(newGalaxy.generationKey).toBe(v2);
      expect(newGalaxy.seed.normalizedValue).toBe(baseline.seed.normalizedValue);
      expect(newGalaxy.type).toBe(baseline.type);
      expect(newGalaxy.physicalProperties).toEqual(baseline.physicalProperties);
      expect(newGalaxy.nucleus).toEqual(V2GalacticNucleusGenerator.generate(baseline));
      expect(newGalaxy.designation.name).toBe(baseline.designation.name);
      expect(newGalaxy.designation.proceduralCode).toBe(
        baseline.designation.proceduralCode.replace('GEN-V1-', 'GEN-V2-'),
      );
      expect(GalaxyDesignationGenerator.generate(v2, index)).toEqual(newGalaxy.designation);
      expect(GalaxyGenerator.generate(v2, index)).toEqual(newGalaxy);
    }
    expect(InitialGalaxyGenerator.generate(v2)).toEqual(GalaxyGenerator.generate(v2, 0n));
  });

  it('keeps sector grids and density tied to the public version without changing physical values', () => {
    const galaxyV1 = GalaxyGenerator.generate(v1, 0n);
    const galaxyV2 = GalaxyGenerator.generate(v2, 0n);
    const gridV1 = GalaxySectorGridGenerator.generate(galaxyV1);
    const gridV2 = GalaxySectorGridGenerator.generate(galaxyV2);
    expect(gridV2.generationKey).toBe(v2);
    expect(gridV2.galaxyIndex).toBe(gridV1.galaxyIndex);
    expect(gridV2.halfExtentInSectors).toBe(gridV1.halfExtentInSectors);
    expect(gridV2.sectorSizeLightYears).toBe(gridV1.sectorSizeLightYears);
    for (const coordinates of [{ x: 0, y: 0 }, { x: 1, y: 1 }]) {
      expect(GalaxySectorStellarDensityGenerator.generate(galaxyV2, gridV2, coordinates)).toEqual(
        GalaxySectorStellarDensityGenerator.generate(galaxyV1, gridV1, coordinates),
      );
    }
    expect(() => GalaxySectorStellarDensityGenerator.generate(galaxyV2, gridV1, { x: 0, y: 0 }))
      .toThrow('same UniverseGenerationKey');
  });

  it('releases bootstrap without conflating galactic physical sources or planet indices', () => {
    const stateV1 = InitialExplorationStateGenerator.generate(v1);
    const stateV2 = InitialExplorationStateGenerator.generate(v2);
    expect(stateV2.activeGalaxyIndex).toBe(stateV1.activeGalaxyIndex);
    expect(stateV2.discoveryPoints).toBe(0n);
    expect([...stateV2.knownDiscoveries.values()]).toEqual([DiscoveryState.DISCOVERED]);
    expect(GeneratorVersion.isReleasedForNewUniverses(GeneratorVersion.V2)).toBe(true);
    // Public parent seeds retain their validated V1 physical lineage; public
    // V2 planet indices are separately guarded in the stage-13 boundary.
    for (const locator of [new GalaxyLocator(0n), new SystemLocator(0n, 0n, 0n)]) {
      expect(ProceduralTargetResolver.resolveTargetSeed(v2, locator).normalizedValue).toBe(
        ProceduralTargetResolver.resolveTargetSeed(v1, locator).normalizedValue);
    }
    expect(() => frozenPhysicalSourceKey(new UniverseGenerationKey(seed, {
      name: 'V2', code: 2,
    } as GeneratorVersion))).toThrow(RangeError);
  });
});
