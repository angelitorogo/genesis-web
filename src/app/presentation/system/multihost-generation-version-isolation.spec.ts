import { GeneratorVersion } from '../../domain/generation/generator-version';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { generationKeyStorageParts, universeEntityToGenerationKey } from '../../data/local/repository/local-repository-support';
import { scientificRouteUniverseRef } from '../scientific/scientific-route-identity';
import { SystemLocator } from '../../domain/generation/procedural-locator';
import { ProceduralTargetResolver } from '../../simulation/regeneration/procedural-target-resolver';
import { GalaxySectorObjectLocationResolver } from '../../simulation/sector/galaxy-sector-object-location-resolver';

const seed = UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1');

describe('Stage 10: legacy/new universe identity separation', () => {
  it('the same seed in V1 and released V2 never shares a persistent key or public route identity', () => {
    const v1 = new UniverseGenerationKey(seed, GeneratorVersion.V1);
    const v2 = new UniverseGenerationKey(seed.copy(), GeneratorVersion.V2);
    expect(v1.equals(v2)).toBe(false);
    expect(generationKeyStorageParts(v1)).toEqual({ universeSeed: seed.serialize(), generatorVersionCode: 1 });
    expect(generationKeyStorageParts(v2)).toEqual({ universeSeed: seed.serialize(), generatorVersionCode: 2 });
    expect(scientificRouteUniverseRef(seed.serialize(), 1)).not.toBe(
      scientificRouteUniverseRef(seed.serialize(), 2),
    );
  });

  it('uses stable parent-system physical values without aliasing public V1/V2 identities', () => {
    const legacy = new UniverseGenerationKey(seed, GeneratorVersion.V1);
    const released = new UniverseGenerationKey(seed.copy(), GeneratorVersion.V2);
    const locator = new SystemLocator(0n, 0n, 0n);
    expect(ProceduralTargetResolver.resolveTargetSeed(released, locator).normalizedValue).toBe(
      ProceduralTargetResolver.resolveTargetSeed(legacy, locator).normalizedValue);
    expect(GalaxySectorObjectLocationResolver.resolve(released, locator)).toEqual(
      GalaxySectorObjectLocationResolver.resolve(legacy, locator));
    expect(released.equals(legacy)).toBe(false);
  });

  it('rehydration never silently downgrades a released V2 key to V1', () => {
    const record = {
      universeSeed: seed.serialize(), generatorVersionCode: 2,
      createdAtEpochMs: 1, updatedAtEpochMs: 1,
    };
    const parsed = universeEntityToGenerationKey(record);
    expect(parsed.generatorVersion).toBe(GeneratorVersion.V2);
    expect(parsed.generatorVersionCode).toBe(2);
    expect(() => universeEntityToGenerationKey({ ...record, generatorVersionCode: 999 })).toThrow();
  });
});
