import { buildSystemScenePlanetSurfacePresentationV1 } from './system-scene-planet-surface-presentation';
import { buildSystemScenePlanetSurfaceTextureV1 } from './system-scene-planet-surface-texture';
import { refinePlanetRgbaTextureV1 } from './system-scene-planet-texture-refinement';

const width = 129;
const height = 65;
const rgba = new Uint8Array(width * height * 4);
for (let index = 0; index < rgba.length; index += 4) {
  rgba[index] = 131;
  rgba[index + 1] = 118;
  rgba[index + 2] = 107;
  rgba[index + 3] = 255;
}
const baseTexture = Object.freeze({
  version: 1 as const,
  seedUint32: 0x12345678,
  width,
  height,
  rgba,
});
const surface = buildSystemScenePlanetSurfacePresentationV1({
  waterInventoryIndex01: 0.64,
  surfaceLiquidWaterCoverageFraction01: 0.28,
  surfaceIceCoverageFraction01: 0.11,
  waterVaporFraction01: 0.16,
  retainedAtmosphericWaterVaporMoleFraction01: 0.014,
  meanSurfaceTemperatureKelvin: 288,
  climateStabilityIndex01: 0.81,
  retainedSurfacePressurePascal: 101_325,
  geologicalActivityIndex01: 0.28,
  volcanismIndex01: 0.11,
  surfaceWaterRegime: 'OCEANS',
  volcanismRegime: 'LOW',
});

function render() {
  return buildSystemScenePlanetSurfaceTextureV1({
    systemIdentity: 'VIS3D.2f-clouds',
    planetId: 'planet-1',
    baseTexture,
    surface,
    visualSeedUint32: 0x10203040,
  });
}

describe('VIS3D.2f — clouds without dark halo', () => {
  const source = render();

  it('keeps transparent texels white instead of black', () => {
    const clouds = source.cloudRgba!;
    let transparent = 0;
    let feathered = 0;
    let dense = 0;
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width - 1; x += 1) {
        const offset = (y * width + x) * 4;
        const alpha = clouds[offset + 3]!;
        for (let channel = 0; channel < 3; channel += 1) {
          expect(clouds[offset + channel]!).toBeGreaterThanOrEqual(215);
        }
        if (alpha === 0) transparent++;
        if (alpha > 5 && alpha < 170) feathered++;
        if (alpha >= 170) dense++;
      }
    }
    expect(transparent).toBeGreaterThan(200);
    expect(feathered).toBeGreaterThan(100);
    expect(dense).toBeGreaterThan(20);
  });

  it('does not modify surface science, and preserves deterministic cloud seam', () => {
    const clouds = source.cloudRgba!;
    const second = render();
    expect(clouds).toEqual(second.cloudRgba);
    expect(source.rgba).toEqual(second.rgba);
    expect(source.measuredCloudCoverageFraction01).toBeCloseTo(
      surface.presentationCloudCoverageFraction01!, 3,
    );
    expect(source.measuredIceCoverageFraction01).toBeCloseTo(0.11, 3);
    expect(source.measuredLiquidCoverageFraction01).toBeCloseTo(0.28, 3);
    for (let y = 0; y < height; y++) {
      const a = y * width * 4;
      const b = (y * width + width - 1) * 4;
      expect(clouds.subarray(a, a + 4)).toEqual(clouds.subarray(b, b + 4));
    }
  });

  it('builds wispy 1024x512 high-resolution clouds with soft feathering', () => {
    const clouds = source.cloudRgba!;
    const refined = refinePlanetRgbaTextureV1(
      clouds, width, height, 1024, 0x10203040, 'WEATHER_CLOUD',
    );
    const repeated = refinePlanetRgbaTextureV1(
      clouds, width, height, 1024, 0x10203040, 'WEATHER_CLOUD',
    );
    expect(refined).toEqual(repeated);
    let feathered = 0;
    for (let y = 0; y < 512; y++) {
      const a = y * 1024 * 4;
      const b = (y * 1024 + 1023) * 4;
      expect(refined.subarray(a, a + 4)).toEqual(refined.subarray(b, b + 4));
      for (let x = 0; x < 1023; x += 1) {
        const offset = (y * 1024 + x) * 4;
        if (refined[offset + 3]! > 5 && refined[offset + 3]! < 170) {
          feathered++;
        }
        expect(refined[offset]!).toBeGreaterThanOrEqual(215);
        expect(refined[offset + 1]!).toBeGreaterThanOrEqual(215);
        expect(refined[offset + 2]!).toBeGreaterThanOrEqual(215);
      }
    }
    expect(feathered).toBeGreaterThan(1200);
  });

  it('never creates weather clouds from a completely transparent atlas', () => {
    const empty = new Uint8Array(width * height * 4);
    const refined = refinePlanetRgbaTextureV1(
      empty, width, height, 512, 0x10203040, 'WEATHER_CLOUD',
    );
    expect(refined.every(byte => byte === 0)).toBe(true);
  });
});
