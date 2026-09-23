import { DiscoveryState } from '../../domain/discovery/discovery-state';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { GalaxySectorCoordinates } from '../../domain/sector/galaxy-sector-coordinates';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { InitialExplorationStateGenerator } from '../exploration/initial-exploration-state-generator';
import { ProceduralTargetResolver } from '../regeneration/procedural-target-resolver';
import { GalaxySectorContentGenerator } from '../sector/galaxy-sector-content-generator';
import { GalaxySectorGridGenerator } from '../sector/galaxy-sector-grid-generator';
import { GalaxyGenerator } from './galaxy-generator';
import { V2GalacticSourceBuilder } from './v2-galactic-source';

const seed = UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1');
const v1 = new UniverseGenerationKey(seed, GeneratorVersion.V1);
const v2 = new UniverseGenerationKey(seed.copy(), GeneratorVersion.V2);
const coordinates = new GalaxySectorCoordinates(0, 0);

describe('Stage 12: read-only V2 galactic bridge', () => {
  it('materializes V2 public galaxy/grid using immutable V1 physical data', () => {
    const legacy = GalaxyGenerator.generate(v1, 0n);
    const canonicalV2 = GalaxyGenerator.generate(v2, 0n);
    const legacyGrid = GalaxySectorGridGenerator.generate(legacy);
    const actual = V2GalacticSourceBuilder.galaxy(v2, 0n);
    expect(actual.generationKey).toBe(v2);
    expect(actual.galaxy.generationKey).toBe(v2);
    expect(actual.grid.generationKey).toBe(v2);
    expect(actual.galaxy.seed.normalizedValue).toBe(legacy.seed.normalizedValue);
    expect(actual.galaxy.type).toBe(legacy.type);
    expect(actual.galaxy.physicalProperties).toEqual(legacy.physicalProperties);
    expect(actual.galaxy.designation).toEqual(canonicalV2.designation);
    expect(actual.galaxy.nucleus).toEqual(canonicalV2.nucleus);
    expect(actual.grid.halfExtentInSectors).toBe(legacyGrid.halfExtentInSectors);
    expect(actual.grid.sectorSizeLightYears).toBe(legacyGrid.sectorSizeLightYears);
    expect(legacy.generationKey).toBe(v1);
    expect(legacyGrid.generationKey).toBe(v1);
  });

  it('materializes matching V1-derived sector contents under the V2 identity', () => {
    const legacyGalaxy = GalaxyGenerator.generate(v1, 0n);
    const legacy = GalaxySectorContentGenerator.generate(legacyGalaxy, coordinates);
    const first = V2GalacticSourceBuilder.sector(v2, 0n, coordinates);
    const repeated = V2GalacticSourceBuilder.sector(v2, 0n, coordinates);
    expect(first.sector.generationKey).toBe(v2);
    expect(first.galaxy.generationKey).toBe(v2);
    expect(first.grid.generationKey).toBe(v2);
    expect(first.sector.locator.sectorKey).toBe(first.grid.locatorFor(coordinates).sectorKey);
    expect(first.sector.seed.normalizedValue).toBe(legacy.seed.normalizedValue);
    expect(first.sector.stellarDensity).toEqual(legacy.stellarDensity);
    expect(first.sector.systemLocators).toEqual(legacy.systemLocators);
    expect(first.sector.galacticObjectLocators).toEqual(legacy.galacticObjectLocators);
    expect(repeated.sector.seed.normalizedValue).toBe(first.sector.seed.normalizedValue);
    expect(repeated.sector.systemLocators).toEqual(first.sector.systemLocators);
    expect(legacy.generationKey).toBe(v1);
  });

  it('prepares identical initial knowledge and resolves the public V2 sector seed', () => {
    const baseline = InitialExplorationStateGenerator.generate(v1);
    const prepared = V2GalacticSourceBuilder.galaxy(v2, 0n).initialExploration;
    expect(prepared.activeGalaxyIndex).toBe(baseline.activeGalaxyIndex);
    expect(prepared.discoveryPoints).toBe(0n);
    expect([...prepared.knownDiscoveries.entries()]).toEqual([...baseline.knownDiscoveries.entries()]);
    expect([...prepared.knownDiscoveries.values()]).toEqual([DiscoveryState.DISCOVERED]);
    expect(GeneratorVersion.isReleasedForNewUniverses(GeneratorVersion.V2)).toBe(true);
    const locator = V2GalacticSourceBuilder.sector(v2, 0n, coordinates).sector.locator;
    expect(ProceduralTargetResolver.resolveTargetSeed(v2, locator).normalizedValue).toBe(
      ProceduralTargetResolver.resolveTargetSeed(v1, locator).normalizedValue);
  });

  it('rejects V1/forged version inputs and invalid galactic indices', () => {
    expect(() => V2GalacticSourceBuilder.galaxy(v1, 0n)).toThrow(RangeError);
    expect(() => V2GalacticSourceBuilder.sector(v1, 0n, coordinates)).toThrow(RangeError);
    expect(() => V2GalacticSourceBuilder.galaxy(new UniverseGenerationKey(seed,
      { name: 'V2', code: 2 } as typeof GeneratorVersion.V2), 0n)).toThrow(RangeError);
    expect(() => V2GalacticSourceBuilder.galaxy(v2, -1n)).toThrow(RangeError);
    const center = V2GalacticSourceBuilder.galaxy(v2, 0n);
    const beyond = center.grid.halfExtentInSectors + 1;
    expect(() => V2GalacticSourceBuilder.sector(v2, 0n,
      new GalaxySectorCoordinates(beyond, 0))).toThrow(RangeError);
  });
});
