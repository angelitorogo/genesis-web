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
  rgba[index] = 132;
  rgba[index + 1] = 120;
  rgba[index + 2] = 101;
  rgba[index + 3] = 255;
}
const baseTexture = Object.freeze({
  version: 1 as const,
  seedUint32: 99123,
  width,
  height,
  rgba,
});

const surface = buildSystemScenePlanetSurfacePresentationV1({
  waterInventoryIndex01: 0.60,
  surfaceLiquidWaterCoverageFraction01: 0.30,
  surfaceIceCoverageFraction01: 0.08,
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

function floraProfile(
  paletteEntries: readonly { hex: string; weight01: number }[],
  count = paletteEntries.length,
): SystemScenePlanetVegetationProfileV1 {
  return Object.freeze({
    coverageFraction01: 0.42,
    floraSpeciesCount: count,
    lushness01: 0.72,
    paletteHexes: paletteEntries.map(entry => entry.hex),
    paletteEntries: Object.freeze([...paletteEntries]),
  });
}

function render(profile: SystemScenePlanetVegetationProfileV1) {
  return buildSystemScenePlanetSurfaceTextureV1({
    systemIdentity: 'VISBIO.1d/palette',
    planetId: 'planet-1',
    baseTexture,
    surface,
    visualSeedUint32: 80085,
    vegetationProfile: profile,
  });
}

function averageVegetationColor(texture: ReturnType<typeof render>): [number, number, number] {
  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;
  for (let index = 0; index < texture.rgba.length; index += 4) {
    const red = texture.rgba[index]!;
    const green = texture.rgba[index + 1]!;
    const blue = texture.rgba[index + 2]!;
    if (green > red + 10 && green > blue + 6) {
      r += red;
      g += green;
      b += blue;
      count += 1;
    }
  }
  return count === 0 ? [0, 0, 0] : [r / count, g / count, b / count];
}

describe('VISBIO.1d procedural vegetation palette derived from species', () => {
  it('tints vegetation differently for warm vs cool plant palettes', () => {
    const warm = render(floraProfile([
      { hex: '#D3BF63', weight01: 0.42 },
      { hex: '#8C9D48', weight01: 0.22 },
      { hex: '#B99658', weight01: 0.18 },
      { hex: '#7C8F43', weight01: 0.18 },
    ], 4));
    const cool = render(floraProfile([
      { hex: '#5FA98D', weight01: 0.42 },
      { hex: '#3E7D8B', weight01: 0.22 },
      { hex: '#6C95B2', weight01: 0.18 },
      { hex: '#5F966D', weight01: 0.18 },
    ], 4));

    const warmAvg = averageVegetationColor(warm);
    const coolAvg = averageVegetationColor(cool);

    expect(warmAvg[0]).toBeGreaterThan(coolAvg[0] + 6);
    expect(coolAvg[2]).toBeGreaterThan(warmAvg[2] + 6);
    expect(warmAvg[1]).toBeGreaterThan(warmAvg[0]);
    expect(coolAvg[1]).toBeGreaterThan(coolAvg[2]);
  });

  it('follows weighted palette dominance instead of treating every tone equally', () => {
    const mostlyWarm = render(floraProfile([
      { hex: '#D3BF63', weight01: 0.62 },
      { hex: '#8C9D48', weight01: 0.20 },
      { hex: '#5FA98D', weight01: 0.10 },
      { hex: '#3E7D8B', weight01: 0.08 },
    ], 4));
    const mostlyCool = render(floraProfile([
      { hex: '#D3BF63', weight01: 0.08 },
      { hex: '#8C9D48', weight01: 0.10 },
      { hex: '#5FA98D', weight01: 0.52 },
      { hex: '#3E7D8B', weight01: 0.30 },
    ], 4));

    const warmAvg = averageVegetationColor(mostlyWarm);
    const coolAvg = averageVegetationColor(mostlyCool);

    // VISBIO.1d.3: compare weighted palettes against each other, not against
    // an arbitrary blue-vs-red threshold. Normalized vegetation remains green
    // while the cool species must visibly increase blue and reduce red.
    expect(warmAvg[0] - warmAvg[2]).toBeGreaterThan(coolAvg[0] - coolAvg[2]);
    expect(coolAvg[2]).toBeGreaterThan(warmAvg[2] + 8);
    expect(warmAvg[0]).toBeGreaterThan(coolAvg[0] + 8);
  });
});
