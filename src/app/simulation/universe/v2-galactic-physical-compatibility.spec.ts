import { DiscoveryState } from '../../domain/discovery/discovery-state';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { GalacticObjectLocator, SystemLocator } from '../../domain/generation/procedural-locator';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { GalaxySectorCoordinates } from '../../domain/sector/galaxy-sector-coordinates';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { InitialExplorationStateGenerator } from '../exploration/initial-exploration-state-generator';
import { ProceduralTargetResolver } from '../regeneration/procedural-target-resolver';
import { GalaxySectorContentGenerator } from '../sector/galaxy-sector-content-generator';
import { GalaxySectorObjectLocationResolver } from '../sector/galaxy-sector-object-location-resolver';
import { GalaxySectorStellarPopulationPropertiesGenerator } from '../sector/galaxy-sector-stellar-population-properties-generator';
import { StellarMultihostFormation } from '../stellar/stellar-multihost-formation';
import { GalaxyGenerator } from './galaxy-generator';
import { V2GalacticPhysicalCompatibility as Compatibility } from './v2-galactic-physical-compatibility';

const seed = UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1');
const v1 = new UniverseGenerationKey(seed, GeneratorVersion.V1);
const v2 = new UniverseGenerationKey(seed.copy(), GeneratorVersion.V2);
const coordinates = new GalaxySectorCoordinates(0, 0);

describe('Stage 12.2: V2 galaxy/sector physical continuity after bootstrap release', () => {
  it('retains frozen V1 galaxy physics while assigning V2 ownership and a V2 public designation', () => {
    const before = GalaxyGenerator.generate(v1, 0n);
    const after = Compatibility.galaxy(v2, 0n);
    expect(after.generationKey).toBe(v2);
    expect(after.seed.normalizedValue).toBe(before.seed.normalizedValue);
    expect(after.physicalProperties).toEqual(before.physicalProperties);
    expect(after.type).toBe(before.type);
    expect(after.nucleus).toEqual(GalaxyGenerator.generate(v2, 0n).nucleus);
    expect(after.designation.name).toBe(before.designation.name);
    expect(after.designation.proceduralCode).toMatch(/^GEN-V2-G0-/);
    expect(after.designation.proceduralCode).not.toBe(before.designation.proceduralCode);
    expect(Compatibility.galaxy(v2, 0n).designation).toEqual(after.designation);
    expect(GalaxyGenerator.generate(v1, 0n).designation).toEqual(before.designation);
  });

  it('rebinds only PUBLIC domain owners: sector occupancy, locators, and environment match the physical lineage', () => {
    const physicalGalaxy = GalaxyGenerator.generate(v1, 0n);
    const physicalSector = GalaxySectorContentGenerator.generate(physicalGalaxy, coordinates);
    const result = Compatibility.sector(v2, 0n, coordinates);
    expect(result.galaxy.generationKey).toBe(v2);
    expect(result.grid.generationKey).toBe(v2);
    expect(result.content.generationKey).toBe(v2);
    expect(result.content.locator).toEqual(physicalSector.locator);
    expect(result.content.seed.normalizedValue).toBe(physicalSector.seed.normalizedValue);
    expect(result.content.stellarDensity).toEqual(physicalSector.stellarDensity);
    expect(result.content.systemLocators).toEqual(physicalSector.systemLocators);
    expect(result.content.galacticObjectLocators).toEqual(physicalSector.galacticObjectLocators);
    expect(result.stellarPopulation).toEqual(
      GalaxySectorStellarPopulationPropertiesGenerator.generate(
        physicalGalaxy, physicalSector.stellarDensity,
      ),
    );
    expect(result.content.systemLocators.every(locator => locator.sectorKey === result.content.locator.sectorKey))
      .toBe(true);
    expect(Compatibility.sector(v2, 0n, coordinates).content.systemLocators)
      .toEqual(result.content.systemLocators);
  });

  it('uses exactly the same V1 physical system locators and stellar formation inputs without re-labelling them V1 publicly', () => {
    const result = Compatibility.sector(v2, 0n, coordinates);
    const address = result.content.systemLocators[0] ?? new SystemLocator(0n, 0n, 0n);
    const base = ProceduralTargetResolver.resolveTargetSeed(v1, address);
    const formation = StellarMultihostFormation.generateOrNull(v2, address);
    if (formation !== null) {
      expect(formation.parentGenerationKey).toBe(v2);
      expect(formation.parentSystemSeedHex).toBe(base.normalizedValue);
      expect(formation.components.every(component => component.internalGenerationKey.generatorVersion === GeneratorVersion.V1))
        .toBe(true);
    }
    expect(Compatibility.systemLocation(v2, address)).toEqual(
      GalaxySectorObjectLocationResolver.resolve(v1, address),
    );
    const object = new GalacticObjectLocator(0n, 0n, 0n);
    expect(Compatibility.galacticObjectLocation(v2, object)).toEqual(
      GalaxySectorObjectLocationResolver.resolve(v1, object),
    );
  }, 120_000);

  it('derives versionless initial knowledge and resolves the immutable physical parent seed', () => {
    const initial = Compatibility.initialExplorationState(v2);
    expect(initial.activeGalaxyIndex).toBe(InitialExplorationStateGenerator.generate(v1).activeGalaxyIndex);
    expect(initial.discoveryPoints).toBe(0n);
    expect([...initial.knownDiscoveries.values()]).toEqual([DiscoveryState.DISCOVERED]);
    expect(GeneratorVersion.isReleasedForNewUniverses(GeneratorVersion.V2)).toBe(true);
    const system = new SystemLocator(0n, 0n, 0n);
    expect(ProceduralTargetResolver.resolveTargetSeed(v2, system).normalizedValue).toBe(
      ProceduralTargetResolver.resolveTargetSeed(v1, system).normalizedValue);
  });

  it('rejects a V1 request or a noncanonical version instead of silently relabelling an old universe', () => {
    expect(() => Compatibility.galaxy(v1, 0n)).toThrow('canonical V2');
    expect(() => Compatibility.sector(v1, 0n, coordinates)).toThrow('canonical V2');
    expect(() => Compatibility.initialExplorationState(v1)).toThrow('canonical V2');
    expect(() => Compatibility.systemLocation(v1, new SystemLocator(0n, 0n, 0n))).toThrow('canonical V2');
    expect(() => Compatibility.galacticObjectLocation(v1, new GalacticObjectLocator(0n, 0n, 0n)))
      .toThrow('canonical V2');
    expect(() => Compatibility.galaxy(new UniverseGenerationKey(seed, { name: 'V2', code: 2 } as GeneratorVersion), 0n))
      .toThrow('canonical V2');
    expect(() => Compatibility.galaxy(v2, -1n)).toThrow(RangeError);
    expect(() => Compatibility.sector(v2, 0n, new GalaxySectorCoordinates(2_147_483_647, 0)))
      .toThrow('outside this galaxy sector grid');
  });
});
