import {
  buildSystemScenePlanetSurfacePresentationV1,
} from './system-scene-planet-surface-presentation';
import {
  buildSystemScenePlanetSurfaceTextureV1,
  type SystemScenePlanetVegetationProfileV1,
} from './system-scene-planet-surface-texture';

const width = 129;
const height = 65;
const rgba = new Uint8Array(width * height * 4);
for (let index = 0; index < rgba.length; index += 4) {
  rgba[index] = 130;
  rgba[index + 1] = 117;
  rgba[index + 2] = 97;
  rgba[index + 3] = 255;
}
const baseTexture = Object.freeze({
  version: 1 as const,
  seedUint32: 12031,
  width,
  height,
  rgba,
});

function surfaceWithIce(iceCoverage: number) {
  return buildSystemScenePlanetSurfacePresentationV1({
    waterInventoryIndex01: 0.60,
    surfaceLiquidWaterCoverageFraction01: 0.28,
    surfaceIceCoverageFraction01: iceCoverage,
    waterVaporFraction01: 0.12,
    retainedAtmosphericWaterVaporMoleFraction01: 0.009,
    meanSurfaceTemperatureKelvin: 289,
    climateStabilityIndex01: 0.81,
    retainedSurfacePressurePascal: 100_000,
    geologicalActivityIndex01: 0.20,
    volcanismIndex01: 0.10,
    surfaceWaterRegime: 'OCEANS',
    volcanismRegime: 'LOW',
  });
}

const colors = Object.freeze([
  '#9ACD5E', '#8A9B43', '#5A9230', '#B9D570', '#507D45', '#486A55',
]);

function floraProfile(count: number): SystemScenePlanetVegetationProfileV1 {
  return Object.freeze({
    coverageFraction01: Math.min(0.86, 0.17 + (count - 1) * 0.105),
    floraSpeciesCount: count,
    lushness01: Math.min(0.90, 0.40 + count * 0.05),
    paletteHexes: colors.slice(0, count),
    paletteEntries: Object.freeze(colors.slice(0, count).map((hex, index) => Object.freeze({
      hex,
      weight01: Number((1 / (index + 1)).toFixed(4)),
    }))),
  });
}

function render(count: number | null, iceCoverage = 0.11) {
  return buildSystemScenePlanetSurfaceTextureV1({
    systemIdentity: 'VISBIO.1c/real-latitudes',
    planetId: 'planet-1',
    baseTexture,
    surface: surfaceWithIce(iceCoverage),
    visualSeedUint32: 43555,
    vegetationProfile: count === null ? undefined : floraProfile(count),
  });
}

function greenByLatitude(texture: ReturnType<typeof render>): number[] {
  const bands = Array.from({ length: 6 }, () => 0);
  for (let y = 0; y < texture.height; y += 1) {
    for (let x = 0; x < texture.width - 1; x += 1) {
      const p = (y * texture.width + x) * 4;
      const r = texture.rgba[p]!;
      const g = texture.rgba[p + 1]!;
      const b = texture.rgba[p + 2]!;
      if (g > r + 12 && g > b + 15) {
        bands[Math.min(5, Math.floor(y * 6 / texture.height))]! += 1;
      }
    }
  }
  return bands;
}

function greenAtPolarCaps(texture: ReturnType<typeof render>): number {
  let count = 0;
  for (let y = 0; y < texture.height; y += 1) {
    if (y > 7 && y < texture.height - 8) continue;
    for (let x = 0; x < texture.width - 1; x += 1) {
      const p = (y * texture.width + x) * 4;
      if (texture.rgba[p + 1]! > texture.rgba[p]! + 12 &&
          texture.rgba[p + 1]! > texture.rgba[p + 2]! + 15) count += 1;
    }
  }
  return count;
}

describe('VISBIO.1c correction of pole bias and vegetation diversity', () => {
  it('never invents green vegetation for a planet without flora', () => {
    expect(greenByLatitude(render(null)).reduce((a, b) => a + b, 0)).toBe(0);
  });

  it('distributes greenery through both temperate and tropical hemispheres, not the polar caps', () => {
    const vegetation = render(4);
    const latitudes = greenByLatitude(vegetation);
    expect(latitudes[1]).toBeGreaterThan(50);
    expect(latitudes[2]).toBeGreaterThan(50);
    expect(latitudes[3]).toBeGreaterThan(50);
    expect(latitudes[4]).toBeGreaterThan(50);
    expect(greenAtPolarCaps(vegetation)).toBe(0);
    expect(vegetation.measuredIceCoverageFraction01).toBeCloseTo(0.11, 2);
    expect(vegetation.measuredLiquidCoverageFraction01).toBeCloseTo(0.28, 2);
  });

  it('does not impose an artificial polar exclusion on ice-free worlds', () => {
    const iceFree = render(6, 0);
    expect(greenAtPolarCaps(iceFree)).toBeGreaterThan(0);
    expect(iceFree.measuredIceCoverageFraction01).toBe(0);
  });

  it('produces distinct increasing coverage for 1, 2, 3, 4 and 6 species', () => {
    const counts = [1, 2, 3, 4, 6].map(species =>
      greenByLatitude(render(species)).reduce((a, b) => a + b, 0));
    for (let i = 1; i < counts.length; i += 1) {
      expect(counts[i]!).toBeGreaterThan(counts[i - 1]! * 1.08);
    }
    expect(counts[counts.length - 1]!).toBeGreaterThan(counts[0]! * 2.5);
  });

  it('remains deterministic for the same seed and profile, including the seam', () => {
    const first = render(3);
    const second = render(3);
    expect(first.rgba).toEqual(second.rgba);
    for (let y = 0; y < first.height; y += 1) {
      const left = y * first.width * 4;
      const right = (y * first.width + first.width - 1) * 4;
      expect(first.rgba.subarray(left, left + 4)).toEqual(first.rgba.subarray(right, right + 4));
    }
  });
});
