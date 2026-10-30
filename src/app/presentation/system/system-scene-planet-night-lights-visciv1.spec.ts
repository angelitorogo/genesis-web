import {
  buildSystemScenePlanetNightLightsV1,
} from './system-scene-planet-night-lights-visciv1';
import {
  patchSystemSceneDayNightFragmentShaderV1,
} from './system-scene-atmosphere-material';

const maskWidth = 129;
const maskHeight = 65;
const mask = new Uint8Array(maskWidth * maskHeight);
for (let y = 0; y < maskHeight; y++) {
  for (let x = 0; x < maskWidth; x++) {
    // Islands with real gaps plus an ice-cap exclusion.
    mask[y * maskWidth + x] = y < 8 || y >= maskHeight - 8 ? 0 :
      (x >= 13 && x < 47) || (x >= 65 && x < 118) ? 1 : 0;
  }
}
const input = Object.freeze({
  landMask: mask,
  maskWidth,
  maskHeight,
  width: 512,
  height: 256,
  seedUint32: 0x4c1fac7,
});

function totalBrightness(rgba: Uint8Array): number {
  let total = 0;
  for (let i = 0; i < rgba.length; i += 4) total += rgba[i]! + rgba[i + 1]! + rgba[i + 2]!;
  return total;
}

describe('VISCIV.1 confirmed native civilization night-light atlas', () => {
  it('keeps primitive lights sparse, warm and disconnected', () => {
    const result = buildSystemScenePlanetNightLightsV1({ ...input, tier: 'PRIMITIVE' });
    expect(result.cityCount).toBeGreaterThan(8);
    expect(result.connectionCount).toBe(0);
    expect(totalBrightness(result.rgba)).toBeGreaterThan(0);
    let warm = 0;
    for (let i = 0; i < result.rgba.length; i += 4) {
      if (result.rgba[i]! > 0) {
        expect(result.rgba[i]!).toBeGreaterThanOrEqual(result.rgba[i + 1]!);
        expect(result.rgba[i + 1]!).toBeGreaterThan(result.rgba[i + 2]!);
        warm++;
      }
    }
    expect(warm).toBeGreaterThan(10);
  });

  it('increases emissive structures from primitive to advanced to very advanced', () => {
    const primitive = buildSystemScenePlanetNightLightsV1({ ...input, tier: 'PRIMITIVE' });
    const advanced = buildSystemScenePlanetNightLightsV1({ ...input, tier: 'ADVANCED' });
    const veryAdvanced = buildSystemScenePlanetNightLightsV1({ ...input, tier: 'VERY_ADVANCED' });
    expect(advanced.cityCount).toBeGreaterThan(primitive.cityCount);
    expect(veryAdvanced.cityCount).toBeGreaterThan(advanced.cityCount);
    expect(totalBrightness(advanced.rgba)).toBeGreaterThan(totalBrightness(primitive.rgba));
    expect(totalBrightness(veryAdvanced.rgba)).toBeGreaterThan(totalBrightness(advanced.rgba));
    expect(veryAdvanced.connectionCount).toBeGreaterThan(0);
  });

  it('never paints the sea or ice and closes the texture seam', () => {
    const result = buildSystemScenePlanetNightLightsV1({ ...input, tier: 'VERY_ADVANCED' });
    for (let y = 0; y < result.height; y++) {
      const first = y * result.width * 4;
      const last = (y * result.width + result.width - 1) * 4;
      expect(result.rgba.subarray(last, last + 4)).toEqual(result.rgba.subarray(first, first + 4));
      for (let x = 0; x < result.width - 1; x++) {
        const pixel = (y * result.width + x) * 4;
        if (!result.rgba[pixel] && !result.rgba[pixel + 1] && !result.rgba[pixel + 2]) continue;
        const mx = Math.floor(x * (maskWidth - 1) / (result.width - 1));
        const my = Math.floor(y * maskHeight / result.height);
        expect(mask[my * maskWidth + mx]).toBe(1);
      }
    }
  });

  it('is deterministic for identical seed/tier and distinguishes tiers', () => {
    const a = buildSystemScenePlanetNightLightsV1({ ...input, tier: 'ADVANCED' });
    const b = buildSystemScenePlanetNightLightsV1({ ...input, tier: 'ADVANCED' });
    const c = buildSystemScenePlanetNightLightsV1({ ...input, tier: 'PRIMITIVE' });
    expect(a.rgba).toEqual(b.rgba);
    expect(a.rgba).not.toEqual(c.rgba);
  });

  it('injects night-only lights without removing the existing volcano emission', () => {
    const source = '#include <common>\nvarying vec2 vMapUv;\nvec3 outgoingLight = vec3(1.0);\n#include <opaque_fragment>';
    const ordinary = patchSystemSceneDayNightFragmentShaderV1(source);
    const civilized = patchSystemSceneDayNightFragmentShaderV1(source, true);
    expect(ordinary).not.toContain('uGenesisCivilizationLights');
    expect(civilized).toContain('uGenesisCivilizationLights');
    expect(civilized).toContain('1.0 - smoothstep(0.035, 0.18, genesisDayFactor)');
    expect(civilized).toContain('genesisDayFactor2 * genesisWeight2');
    expect(civilized).toContain('outgoingLight += genesisUrbanEmission * genesisDeepNight');
    expect(civilized).toContain('#include <opaque_fragment>');
  });
});
