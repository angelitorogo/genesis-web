import { GeneratorVersion } from '../../domain/generation/generator-version';
import {
  BodyLocator, CivilizationLocator, GalacticObjectLocator, GalaxyLocator,
  MoonLocator, SectorLocator, SystemLocator,
} from '../../domain/generation/procedural-locator';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { GalaxySectorCoordinates } from '../../domain/sector/galaxy-sector-coordinates';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { GalaxyGenerator } from '../universe/galaxy-generator';
import { GalaxySectorContentGenerator } from '../sector/galaxy-sector-content-generator';
import { GalaxySectorObjectLocationResolver } from '../sector/galaxy-sector-object-location-resolver';
import { ProceduralTargetResolver } from './procedural-target-resolver';

const seed = UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1');
const v1 = new UniverseGenerationKey(seed, GeneratorVersion.V1);
const v2 = new UniverseGenerationKey(seed.copy(), GeneratorVersion.V2);

describe('12.2: V2 public bootstrap and immutable galactic resolution', () => {
  it('releases exactly the canonical V1 and V2 version objects', () => {
    expect(GeneratorVersion.isReleasedForNewUniverses(GeneratorVersion.V1)).toBe(true);
    expect(GeneratorVersion.isReleasedForNewUniverses(GeneratorVersion.V2)).toBe(true);
    expect(GeneratorVersion.isReleasedForNewUniverses({ name: 'V2', code: 2 })).toBe(false);
    expect(v1.equals(v2)).toBe(false);
  });

  it('resolves the same V1 physical seeds for all four public V2 galactic/parent locator types', () => {
    const locators = [new GalaxyLocator(0n), new SectorLocator(0n, 0n),
      new GalacticObjectLocator(0n, 0n, 0n), new SystemLocator(0n, 0n, 0n)];
    for (const locator of locators) {
      const physical = ProceduralTargetResolver.resolveTargetSeed(v1, locator);
      const released = ProceduralTargetResolver.resolveTargetSeed(v2, locator);
      expect(released.normalizedValue).toBe(physical.normalizedValue);
    }
  });

  it('keeps public multihost body/moon/civilization indices out of the legacy V1 seed resolver', () => {
    const publicLocators = [new BodyLocator(0n, 0n, 0n, 0n),
      new MoonLocator(0n, 0n, 0n, 0n, 0n),
      new CivilizationLocator(0n, 0n, 0n, 0n, 0n)];
    for (const locator of publicLocators) {
      expect(() => ProceduralTargetResolver.resolveTargetSeed(v2, locator)).toThrow(
        'requires the stage-13 multihost public index');
      expect(() => ProceduralTargetResolver.resolveTargetSeed(v1, locator)).not.toThrow();
    }
  });

  it('directly materializes public V2 sectors with frozen content and placement', () => {
    const coordinates = new GalaxySectorCoordinates(0, 0);
    const galaxy1 = GalaxyGenerator.generate(v1, 0n);
    const galaxy2 = GalaxyGenerator.generate(v2, 0n);
    const legacy = GalaxySectorContentGenerator.generate(galaxy1, coordinates);
    const result = GalaxySectorContentGenerator.generate(galaxy2, coordinates);
    expect(result.generationKey).toBe(v2);
    expect(result.locator).toEqual(legacy.locator);
    expect(result.seed.normalizedValue).toBe(legacy.seed.normalizedValue);
    expect(result.stellarDensity).toEqual(legacy.stellarDensity);
    expect(result.systemLocators).toEqual(legacy.systemLocators);
    expect(result.galacticObjectLocators).toEqual(legacy.galacticObjectLocators);
    expect(GalaxySectorContentGenerator.generate(galaxy2, coordinates)).toEqual(result);
    const system = result.systemLocators[0] ?? new SystemLocator(0n, 0n, 0n);
    expect(GalaxySectorObjectLocationResolver.resolve(v2, system)).toEqual(
      GalaxySectorObjectLocationResolver.resolve(v1, system));
  });
});
