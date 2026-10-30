import {
  SystemSceneBoundedResourceCacheV1,
} from './system-scene-resource-cache';
import {
  systemScenePlanetTextureCacheKeyVISCIV1b,
} from './system-scene-planet-civilization-cache-visciv1b';
import {
  buildSystemScenePlanetNightLightsV1,
  downsampleSystemScenePlanetNightLightsV1,
} from './system-scene-planet-night-lights-visciv1';

const identity = 'GEN-V3|sys-9';
const planetId = 'mh-a-planet-4';

function simpleLandMask() {
  const width = 129;
  const height = 65;
  const land = new Uint8Array(width * height);
  for (let y = 8; y < height - 8; y++) {
    for (let x = 7; x < width - 1; x++) {
      if ((x >= 12 && x <= 54) || (x >= 70 && x <= 117)) {
        land[y * width + x] = 1;
      }
    }
  }
  return land;
}

describe('VISCIV.1b: night-light cache invalidation and shared atlas', () => {
  it('distinguishes no civilization and all three tiers while retaining same planet identity', () => {
    const normal = systemScenePlanetTextureCacheKeyVISCIV1b(identity, planetId, 256, null);
    const primitive = systemScenePlanetTextureCacheKeyVISCIV1b(identity, planetId, 256, 'PRIMITIVE');
    const advanced = systemScenePlanetTextureCacheKeyVISCIV1b(identity, planetId, 256, 'ADVANCED');
    const veryAdvanced = systemScenePlanetTextureCacheKeyVISCIV1b(identity, planetId, 256, 'VERY_ADVANCED');
    expect(new Set([normal, primitive, advanced, veryAdvanced]).size).toBe(4);
    expect(systemScenePlanetTextureCacheKeyVISCIV1b(identity, planetId, 256, 'ADVANCED'))
      .toBe(advanced);
    expect(systemScenePlanetTextureCacheKeyVISCIV1b(identity, planetId, 512, 'ADVANCED'))
      .not.toBe(advanced);
  });

  it('does not reuse the already-cached uninhabited atlas once VIDA.9 has loaded', () => {
    // Give the cache the actual fixture resource type. Otherwise the generic
    // defaults to SystemSceneDisposableResourceV1 and its `tier` disappears.
    type CivilizationCacheTestResource = Readonly<{
      id: number;
      tier: 'PRIMITIVE' | 'ADVANCED' | 'VERY_ADVANCED' | null;
      dispose(): void;
    }>;
    const cache = new SystemSceneBoundedResourceCacheV1<CivilizationCacheTestResource>(8, 8192);
    let builds = 0;
    const acquire = (tier: 'PRIMITIVE' | 'ADVANCED' | 'VERY_ADVANCED' | null) =>
      cache.acquire(systemScenePlanetTextureCacheKeyVISCIV1b(identity, planetId, 256, tier),
        512, () => ({
          id: ++builds,
          tier,
          dispose() {},
        }));
    const initial = acquire(null);
    const confirmed = acquire('ADVANCED');
    const repeated = acquire('ADVANCED');
    expect(initial.resource.tier).toBeNull();
    expect(confirmed.resource.tier).toBe('ADVANCED');
    expect(initial.resource).not.toBe(confirmed.resource);
    expect(repeated.resource).toBe(confirmed.resource);
    expect(builds).toBe(2);
    initial.dispose();
    confirmed.dispose();
    repeated.dispose();
    cache.dispose();
  });

  it('preserves the canonical planet night-light geography at system-scene resolution', () => {
    const landMask = simpleLandMask();
    const canonical = buildSystemScenePlanetNightLightsV1({
      landMask, maskWidth: 129, maskHeight: 65,
      width: 1024, height: 512, tier: 'VERY_ADVANCED', seedUint32: 4619,
    });
    const system = downsampleSystemScenePlanetNightLightsV1(canonical, 256, 128);
    const close = downsampleSystemScenePlanetNightLightsV1(canonical, 512, 256);
    expect(canonical.connectionCount).toBeGreaterThan(0);
    expect(system.cityCount).toBe(canonical.cityCount);
    expect(close.cityCount).toBe(canonical.cityCount);
    expect(system.rgba.some((component, i) => i % 4 !== 3 && component > 0)).toBe(true);
    expect(close.rgba.some((component, i) => i % 4 !== 3 && component > 0)).toBe(true);
    for (let y = 0; y < system.height; y++) {
      const left = y * system.width * 4;
      const right = left + (system.width - 1) * 4;
      expect(system.rgba.slice(left, left + 4)).toEqual(system.rgba.slice(right, right + 4));
    }
  });

  it('keeps scarce primitive settlements legible during downsampling', () => {
    const canonical = buildSystemScenePlanetNightLightsV1({
      landMask: simpleLandMask(), maskWidth: 129, maskHeight: 65,
      width: 1024, height: 512, tier: 'PRIMITIVE', seedUint32: 4619,
    });
    const system = downsampleSystemScenePlanetNightLightsV1(canonical, 256, 128);
    const lit = (rgba: Uint8Array) => {
      let count = 0;
      for (let index = 0; index < rgba.length; index += 4) {
        if (rgba[index]! > 0) count++;
      }
      return count;
    };
    expect(lit(system.rgba)).toBeGreaterThan(6);
    expect(system.connectionCount).toBe(0);
  });
});
