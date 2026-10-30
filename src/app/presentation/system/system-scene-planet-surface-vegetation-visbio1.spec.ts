import {
  buildSystemScenePlanetTextureV1,
} from './system-scene-planet-texture';

import {
  buildSystemScenePlanetSurfacePresentationV1,
} from './system-scene-planet-surface-presentation';

import {
  buildSystemScenePlanetSurfaceTextureV1,
} from './system-scene-planet-surface-texture';

function greenDominantPixelCount(rgba: Uint8Array): number {
  let count = 0;
  for (let index = 0; index < rgba.length; index += 4) {
    const r = rgba[index]!;
    const g = rgba[index + 1]!;
    const b = rgba[index + 2]!;
    if (g > r + 10 && g > b + 6) {
      count += 1;
    }
  }
  return count;
}

function greenToneDiversity(rgba: Uint8Array): number {
  const tones = new Set<string>();
  for (let index = 0; index < rgba.length; index += 4) {
    const r = rgba[index]!;
    const g = rgba[index + 1]!;
    const b = rgba[index + 2]!;
    if (g > r + 10 && g > b + 6) {
      tones.add(`${Math.round(r / 24)}-${Math.round(g / 24)}-${Math.round(b / 24)}`);
    }
  }
  return tones.size;
}

describe('VISBIO.1b planetary vegetation texture overlay', () => {
  it('adds green vegetation only when the preview requests flora coverage', () => {
    const base = buildSystemScenePlanetTextureV1({
      systemIdentity: 'VISBIO-1',
      planetId: 'planet-1',
      surfaceStyle: 'rocky',
      baseColorHex: '#8B7B69',
      visualSeedUint32: 0x12345678,
    });
    const surface = buildSystemScenePlanetSurfacePresentationV1({
      waterInventoryIndex01: 0.72,
      surfaceLiquidWaterCoverageFraction01: 0.34,
      surfaceIceCoverageFraction01: 0.06,
      waterVaporFraction01: 0.11,
      retainedAtmosphericWaterVaporMoleFraction01: 0.012,
      meanSurfaceTemperatureKelvin: 289,
      climateStabilityIndex01: 0.82,
      retainedSurfacePressurePascal: 101_325,
      geologicalActivityIndex01: 0.36,
      volcanismIndex01: 0.18,
      surfaceWaterRegime: 'OCEANS',
      volcanismRegime: 'LOW',
    });

    const barren = buildSystemScenePlanetSurfaceTextureV1({
      systemIdentity: 'VISBIO-1',
      planetId: 'planet-1',
      baseTexture: base,
      surface,
      visualSeedUint32: 0x87654321,
    });
    const vegetated = buildSystemScenePlanetSurfaceTextureV1({
      systemIdentity: 'VISBIO-1',
      planetId: 'planet-1',
      baseTexture: base,
      surface,
      vegetationProfile: Object.freeze({
        coverageFraction01: 0.30,
        lushness01: 0.52,
        floraSpeciesCount: 1,
        paletteHexes: Object.freeze(['#9BCF70']),
      }),
      visualSeedUint32: 0x87654321,
    });

    expect(greenDominantPixelCount(vegetated.rgba)).toBeGreaterThan(
      greenDominantPixelCount(barren.rgba),
    );
    expect(vegetated.rgba.length).toBe(barren.rgba.length);
    expect(vegetated.width).toBe(base.width);
    expect(vegetated.height).toBe(base.height);
  });

  it('uses more varied tones when biodiversity and palette richness increase', () => {
    const base = buildSystemScenePlanetTextureV1({
      systemIdentity: 'VISBIO-1',
      planetId: 'planet-2',
      surfaceStyle: 'rocky',
      baseColorHex: '#8B7B69',
      visualSeedUint32: 0x12345679,
    });
    const surface = buildSystemScenePlanetSurfacePresentationV1({
      waterInventoryIndex01: 0.72,
      surfaceLiquidWaterCoverageFraction01: 0.34,
      surfaceIceCoverageFraction01: 0.06,
      waterVaporFraction01: 0.11,
      retainedAtmosphericWaterVaporMoleFraction01: 0.012,
      meanSurfaceTemperatureKelvin: 289,
      climateStabilityIndex01: 0.82,
      retainedSurfacePressurePascal: 101_325,
      geologicalActivityIndex01: 0.36,
      volcanismIndex01: 0.18,
      surfaceWaterRegime: 'OCEANS',
      volcanismRegime: 'LOW',
    });

    const sparse = buildSystemScenePlanetSurfaceTextureV1({
      systemIdentity: 'VISBIO-1',
      planetId: 'planet-2',
      baseTexture: base,
      surface,
      vegetationProfile: Object.freeze({
        coverageFraction01: 0.12,
        lushness01: 0.34,
        floraSpeciesCount: 1,
        paletteHexes: Object.freeze(['#A7D37A']),
      }),
      visualSeedUint32: 0x87654320,
    });
    const rich = buildSystemScenePlanetSurfaceTextureV1({
      systemIdentity: 'VISBIO-1',
      planetId: 'planet-2',
      baseTexture: base,
      surface,
      vegetationProfile: Object.freeze({
        coverageFraction01: 0.34,
        lushness01: 0.78,
        floraSpeciesCount: 4,
        paletteHexes: Object.freeze(['#9BCF70', '#6F9E48', '#B8D779', '#5F8B3D']),
      }),
      visualSeedUint32: 0x87654320,
    });

    expect(greenDominantPixelCount(rich.rgba)).toBeGreaterThan(
      greenDominantPixelCount(sparse.rgba),
    );
    expect(greenToneDiversity(rich.rgba)).toBeGreaterThan(
      greenToneDiversity(sparse.rgba),
    );
  });
});
