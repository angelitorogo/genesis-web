import {
  buildMultiresolutionSolidPlanetSurfaceVISSURF2,
  SOLID_PLANET_DETAIL_WIDTH_VISSURF2,
} from './system-scene-planet-surface-detail-vissurf2';

function sourceFixtureVISSURF2(): {
  width: number;
  height: number;
  surfaceClassMask: Uint8Array;
  rgba: Uint8Array;
  roughnessRgba: Uint8Array;
  reliefRgba: Uint8Array;
  cloudRgba: Uint8Array;
} {
  const width = 256;
  const height = 128;
  const classes = new Uint8Array(width * height);
  const rgba = new Uint8Array(width * height * 4);
  const roughness = new Uint8Array(width * height * 4);
  const relief = new Uint8Array(width * height * 4);
  const clouds = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width - 1; x++) {
      const longitude = x / (width - 1);
      const latitude = y / height;
      const coast = 0.45 + 0.12 * Math.sin(longitude * Math.PI * 6) +
        0.055 * Math.cos(longitude * Math.PI * 13);
      const kind = latitude < 0.12 || latitude > 0.91 ? 2
        : latitude < coast ? 1
          : latitude < 0.59 ? 5
            : latitude < 0.72 ? 3
              : latitude < 0.86 ? 4 : 6;
      const offset = (y * width + x) * 4;
      classes[y * width + x] = kind;
      const tint = kind === 1 ? [21, 75, 168] : kind === 2 ? [219, 226, 231]
        : kind === 5 ? [59, 137, 63] : kind === 4 ? [172, 131, 83]
          : kind === 6 ? [82, 74, 73] : [133, 120, 104];
      rgba.set([tint[0]!, tint[1]!, tint[2]!, 255], offset);
      roughness.set([kind === 1 ? 45 : 160, kind === 1 ? 45 : 160, kind === 1 ? 45 : 160, 255], offset);
      relief.set([kind === 1 ? 85 : 142, kind === 1 ? 85 : 142, kind === 1 ? 85 : 142, 255], offset);
      clouds.set([255, 255, 255, (x + y) % 8 * 28], offset);
    }
    const dst = (y * width + width - 1) * 4;
    const src = y * width * 4;
    rgba.set(rgba.subarray(src, src + 4), dst);
    roughness.set(roughness.subarray(src, src + 4), dst);
    relief.set(relief.subarray(src, src + 4), dst);
    clouds.set(clouds.subarray(src, src + 4), dst);
    classes[y * width + width - 1] = classes[y * width]!;
  }
  return { width, height, surfaceClassMask: classes, rgba,
    roughnessRgba: roughness, reliefRgba: relief, cloudRgba: clouds };
}

function classCountsVISSURF2(mask: Uint8Array, width: number, height: number): number[] {
  const count = [0, 0, 0, 0, 0, 0, 0];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width - 1; x++) count[mask[y * width + x]!]!++;
  }
  return count;
}

describe('VISSURF.2 — geografía procedural multirresolución con conservación de inventarios', () => {
  it('genera clases visuales con la misma área por tipo, sin mutar atlas científico ni nubes', () => {
    const source = sourceFixtureVISSURF2();
    const copy = new Uint8Array(source.surfaceClassMask);
    const colors = new Uint8Array(source.rgba);
    const clouds = new Uint8Array(source.cloudRgba);
    const original = classCountsVISSURF2(source.surfaceClassMask, source.width, source.height);
    for (const width of [512, 1024, 2048]) {
      const result = buildMultiresolutionSolidPlanetSurfaceVISSURF2(source, width, 0x14fa3612);
      const total = (width - 1) * (width / 2);
      const counts = classCountsVISSURF2(result.classMask, width, width / 2);
      for (const kind of [1, 2, 4, 5, 6]) {
        const expected = Math.round(original[kind]! * total / ((source.width - 1) * source.height));
        expect(counts[kind]).toBe(expected);
      }
      expect(result.rgba.length).toBe(width * width * 2);
      expect(result.roughnessRgba?.length).toBe(width * width * 2);
      expect(result.reliefRgba?.length).toBe(width * width * 2);
      for (let y = 0; y < width / 2; y++) {
        expect(result.classMask[y * width]).toBe(result.classMask[(y + 1) * width - 1]);
        for (const atlas of [result.rgba, result.roughnessRgba!, result.reliefRgba!]) {
          const a = y * width * 4;
          const b = a + (width - 1) * 4;
          expect(atlas.subarray(a, a + 4)).toEqual(atlas.subarray(b, b + 4));
        }
      }
    }
    expect(source.surfaceClassMask).toEqual(copy);
    expect(source.rgba).toEqual(colors);
    expect(source.cloudRgba).toEqual(clouds);
  });

  it('produce nuevas costas a escala inferior a la celda de origen, sin fronteras rectas en bloques', () => {
    const input = sourceFixtureVISSURF2();
    // Reemplazar por una costa continental RECTILÍNEA en el atlas de origen.
    for (let y = 0; y < input.height; y++) {
      for (let x = 0; x < input.width; x++) {
        input.surfaceClassMask[y * input.width + x] = y < input.height / 2 ? 1 : 3;
      }
    }
    const result = buildMultiresolutionSolidPlanetSurfaceVISSURF2(input, 1024, 0x149d5517);
    const shoreline = new Set<number>();
    for (let x = 40; x < 985; x += 16) {
      for (let y = 220; y < 295; y++) {
        if (result.classMask[y * 1024 + x] === 1 && result.classMask[(y + 1) * 1024 + x] !== 1) {
          shoreline.add(y);
        }
      }
    }
    expect(shoreline.size).toBeGreaterThanOrEqual(5);
  });

  it('mantiene semilla y geografía reconocibles en diferentes resoluciones', () => {
    const source = sourceFixtureVISSURF2();
    const a = buildMultiresolutionSolidPlanetSurfaceVISSURF2(source, 1024, 2190);
    const b = buildMultiresolutionSolidPlanetSurfaceVISSURF2(source, 1024, 2190);
    const c = buildMultiresolutionSolidPlanetSurfaceVISSURF2(source, 1024, 2191);
    const full = buildMultiresolutionSolidPlanetSurfaceVISSURF2(source, 2048, 2190);
    expect(a.rgba).toEqual(b.rgba);
    expect(a.classMask).toEqual(b.classMask);
    expect(a.rgba).not.toEqual(c.rgba);
    let matching = 0;
    let total = 0;
    for (let y = 2; y < 510; y += 7) {
      for (let x = 3; x < 1020; x += 11) {
        const xx = Math.round(x / (1024 - 1) * (2048 - 1));
        const yy = Math.round((y + 0.5) / 512 * 1024 - 0.5);
        matching += a.classMask[y * 1024 + x] === full.classMask[yy * 2048 + xx] ? 1 : 0;
        total++;
      }
    }
    expect(matching / total).toBeGreaterThan(0.94);
    expect(SOLID_PLANET_DETAIL_WIDTH_VISSURF2).toEqual({ closeSystem: 1024, scientificPreview: 2048 });
  });

  it('conserva materiales separados, evita nubes en la reconstrucción y limita la resolución', () => {
    const source = sourceFixtureVISSURF2();
    const result = buildMultiresolutionSolidPlanetSurfaceVISSURF2(source, 1024, 991);
    expect(result.roughnessRgba).not.toEqual(result.reliefRgba);
    const counts = classCountsVISSURF2(result.classMask, 1024, 512);
    expect(counts[1]).toBeGreaterThan(0);
    expect(counts[2]).toBeGreaterThan(0);
    expect(counts[5]).toBeGreaterThan(0);
    expect(counts[4]).toBeGreaterThan(0);
    expect(counts[6]).toBeGreaterThan(0);
    expect('cloudRgba' in result).toBe(false);
    expect(() => buildMultiresolutionSolidPlanetSurfaceVISSURF2(source, 4096, 1)).toThrow(RangeError);
    expect(() => buildMultiresolutionSolidPlanetSurfaceVISSURF2({ ...source, surfaceClassMask: null }, 1024, 1)).toThrow(RangeError);
  });
});
