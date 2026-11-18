import {
  buildSystemScenePlanetTextureV1,
} from './system-scene-planet-texture';
import {
  buildSystemScenePlanetSurfacePresentationV1,
} from './system-scene-planet-surface-presentation';
import {
  buildSystemScenePlanetSurfaceTextureV1,
} from './system-scene-planet-surface-texture';
import {
  refineSolidPlanetSurfaceVISSURF1,
  SOLID_PLANET_DETAIL_WIDTH_VISSURF1,
} from './system-scene-planet-surface-detail-vissurf1';

const surface = buildSystemScenePlanetSurfacePresentationV1({
  waterInventoryIndex01: 0.6,
  surfaceLiquidWaterCoverageFraction01: 0.35,
  surfaceIceCoverageFraction01: 0.14,
  waterVaporFraction01: 0.03,
  retainedAtmosphericWaterVaporMoleFraction01: 0.01,
  meanSurfaceTemperatureKelvin: 285,
  climateStabilityIndex01: 0.7,
  retainedSurfacePressurePascal: 101325,
  geologicalActivityIndex01: 0.45,
  volcanismIndex01: 0.12,
  surfaceWaterRegime: 'OCEANS',
  volcanismRegime: 'LOW',
});
const base = buildSystemScenePlanetTextureV1({
  systemIdentity: 'VISSURF-1', planetId: 'world-A',
  surfaceStyle: 'rocky', baseColorHex: '#938875',
});
const classified = buildSystemScenePlanetSurfaceTextureV1({
  systemIdentity: 'VISSURF-1', planetId: 'world-A', baseTexture: base, surface,
  vegetationProfile: {
    coverageFraction01: 0.18, lushness01: 0.8, floraSpeciesCount: 4,
    paletteHexes: ['#456a2a', '#8aab68', '#37593d', '#d6aa49'],
  },
});

function coverage(mask: Uint8Array, code: number): number {
  let count = 0;
  for (const value of mask) if (value === code) count++;
  return count / mask.length;
}

describe('VISSURF.1 — reconstrucción multiescala de terreno, agua, hielo y vegetación', () => {
  it('conserva el atlas científico D.4d y sus coberturas, nubes y máscara nocturna', () => {
    const sourceColor = new Uint8Array(classified.rgba);
    const sourceClouds = classified.cloudRgba ? new Uint8Array(classified.cloudRgba) : null;
    const sourceClasses = new Uint8Array(classified.surfaceClassMask!);
    const sourceLiquid = classified.measuredLiquidCoverageFraction01;
    const sourceIce = classified.measuredIceCoverageFraction01;
    const detailed = refineSolidPlanetSurfaceVISSURF1(classified, 1024, 7617);
    expect(detailed.width).toBe(1024);
    expect(detailed.height).toBe(512);
    expect(classified.rgba).toEqual(sourceColor);
    expect(classified.cloudRgba).toEqual(sourceClouds);
    expect(classified.surfaceClassMask).toEqual(sourceClasses);
    expect(classified.measuredLiquidCoverageFraction01).toBe(sourceLiquid);
    expect(classified.measuredIceCoverageFraction01).toBe(sourceIce);
    expect(coverage(detailed.classMask, 1)).toBeCloseTo(sourceLiquid!, 2);
    expect(coverage(detailed.classMask, 2)).toBeCloseTo(sourceIce!, 2);
    expect(coverage(detailed.classMask, 5)).toBeGreaterThan(0);
  });

  it('genera relieve y materiales definidos en 1024 y 2048 sin inventar clases y sin costura', () => {
    expect(SOLID_PLANET_DETAIL_WIDTH_VISSURF1).toEqual({
      closeSystem: 1024, scientificPreview: 2048,
    });
    for (const width of [1024, 2048]) {
      const detail = refineSolidPlanetSurfaceVISSURF1(classified, width, 123456);
      expect(detail.rgba).toHaveLength(width * width * 2);
      expect(detail.roughnessRgba).toHaveLength(width * width * 2);
      expect(detail.reliefRgba).toHaveLength(width * width * 2);
      expect(detail.classMask).toHaveLength(width * width / 2);
      for (let y = 0; y < width / 2; y++) {
        const row = y * width * 4;
        const end = row + (width - 1) * 4;
        for (const atlas of [detail.rgba, detail.roughnessRgba!, detail.reliefRgba!]) {
          expect(atlas.subarray(row, row + 4)).toEqual(atlas.subarray(end, end + 4));
        }
        expect(detail.classMask[y * width]).toBe(detail.classMask[y * width + width - 1]);
      }
      expect(coverage(detail.classMask, 1)).toBeCloseTo(0.35, 2);
      expect(coverage(detail.classMask, 2)).toBeCloseTo(0.14, 2);
      expect(detail.roughnessRgba).not.toEqual(detail.reliefRgba);
    }
  });

  it('reproduce exactamente el resultado con la misma seed y diferencia materiales con otro seed', () => {
    const a = refineSolidPlanetSurfaceVISSURF1(classified, 1024, 917);
    const b = refineSolidPlanetSurfaceVISSURF1(classified, 1024, 917);
    const c = refineSolidPlanetSurfaceVISSURF1(classified, 1024, 918);
    expect(a.rgba).toEqual(b.rgba);
    expect(a.roughnessRgba).toEqual(b.roughnessRgba);
    expect(a.reliefRgba).toEqual(b.reliefRgba);
    expect(a.classMask).toEqual(b.classMask);
    expect(a.rgba).not.toEqual(c.rgba);
    expect(a.classMask).not.toEqual(c.classMask);
  });

  it('suaviza costas de alto contraste sin volver a dibujar cuadrados de clase', () => {
    const width = 256;
    const height = 128;
    const surfaceClassMask = new Uint8Array(width * height);
    const rgba = new Uint8Array(width * height * 4);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = y * width + x;
        const water = x < 128;
        surfaceClassMask[i] = water ? 1 : 5;
        rgba.set(water ? [20, 70, 180, 255] : [145, 115, 45, 255], i * 4);
      }
    }
    const source = { width, height, rgba, surfaceClassMask, roughnessRgba: null, reliefRgba: null };
    const detail = refineSolidPlanetSurfaceVISSURF1(source, 1024, 713);
    // The ocean-to-land boundary crosses this output window. With the old
    // nearest-class-only blend it jumped by >100 blue levels in one texel.
    const y = 256;
    const values = Array.from({ length: 40 }, (_, offset) => detail.rgba[
      ((y * 1024 + 490 + offset) * 4) + 2
    ]!);
    const steps = values.slice(1).map((value, i) => Math.abs(value - values[i]!));
    expect(Math.max(...steps)).toBeLessThan(65);
    expect(values.filter(value => value > 65 && value < 160).length).toBeGreaterThanOrEqual(2);
    // Source classes and their coverage are not altered by color blending.
    expect(detail.classMask[y * 1024 + 490]).toBe(1);
    expect(detail.classMask[y * 1024 + 529]).toBe(5);
    expect(source.surfaceClassMask).toEqual(surfaceClassMask);
  });

  it('rechaza entradas incoherentes o resoluciones que exceden el presupuesto', () => {
    expect(() => refineSolidPlanetSurfaceVISSURF1(classified, 4096, 1)).toThrow(RangeError);
    expect(() => refineSolidPlanetSurfaceVISSURF1({ ...classified, surfaceClassMask: null }, 1024, 1)).toThrow(RangeError);
    expect(() => refineSolidPlanetSurfaceVISSURF1({ ...classified, rgba: new Uint8Array(7) }, 1024, 1)).toThrow(RangeError);
  });
});
