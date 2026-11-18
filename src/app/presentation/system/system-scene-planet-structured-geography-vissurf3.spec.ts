import {
  buildMultiresolutionSolidPlanetSurfaceVISSURF2,
} from './system-scene-planet-surface-detail-vissurf2';
import {
  buildStructuredSolidPlanetSurfaceVISSURF3,
} from './system-scene-planet-structured-geography-vissurf3';

function fixtureVISSURF3() {
  const width = 256;
  const height = 128;
  const mask = new Uint8Array(width * height);
  const rgba = new Uint8Array(width * height * 4);
  const rough = new Uint8Array(rgba.length);
  const relief = new Uint8Array(rgba.length);
  const colors: number[][] = [[], [21, 75, 168], [215, 228, 230], [127, 117, 103],
    [171, 136, 89], [64, 135, 75], [88, 78, 73]];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width - 1; x++) {
      const u = x / (width - 1);
      const v = y / height;
      const coastalBoundary = 0.44 + 0.12 * Math.sin(u * 6 * Math.PI);
      const kind = v < 0.12 || v > 0.92 ? 2
        : v < coastalBoundary ? 1
          : v < 0.57 ? 5
            : v < 0.69 ? 3
              : v < 0.78 ? 4 : 6;
      mask[y * width + x] = kind;
      rgba.set([...colors[kind]!, 255], (y * width + x) * 4);
      const roughness = kind === 1 ? 46 : kind === 2 ? 120 : 178;
      const elevation = kind === 1 ? 90 : 130;
      rough.set([roughness, roughness, roughness, 255], (y * width + x) * 4);
      relief.set([elevation, elevation, elevation, 255], (y * width + x) * 4);
    }
    mask[y * width + width - 1] = mask[y * width]!;
    rgba.set(rgba.subarray(y * width * 4, y * width * 4 + 4), (y * width + width - 1) * 4);
    rough.set(rough.subarray(y * width * 4, y * width * 4 + 4), (y * width + width - 1) * 4);
    relief.set(relief.subarray(y * width * 4, y * width * 4 + 4), (y * width + width - 1) * 4);
  }
  return { width, height, rgba, roughnessRgba: rough, reliefRgba: relief, surfaceClassMask: mask };
}

function valueSpanVISSURF3(map: Uint8Array, mask: Uint8Array, width: number, kind: number, channel = 0) {
  let min = 255;
  let max = 0;
  for (let y = 20; y < width / 2 - 20; y += 2) {
    for (let x = 1; x < width - 1; x += 3) {
      const i = y * width + x;
      if (mask[i] !== kind) continue;
      const value = map[i * 4 + channel]!;
      min = Math.min(min, value);
      max = Math.max(max, value);
    }
  }
  return max - min;
}

describe('VISSURF.3 — geografía estructurada, materiales e iluminación multirresolución', () => {
  it('conserva exactamente el atlas científico y TODAS las clases de VISSURF.2', () => {
    const source = fixtureVISSURF3();
    const frozenSource = new Uint8Array(source.rgba);
    const frozenClass = new Uint8Array(source.surfaceClassMask);
    const old = buildMultiresolutionSolidPlanetSurfaceVISSURF2(source, 1024, 0x17e9bc41);
    const next = buildStructuredSolidPlanetSurfaceVISSURF3(source, 1024, 0x17e9bc41);
    expect(next.classMask).toEqual(old.classMask);
    expect(source.rgba).toEqual(frozenSource);
    expect(source.surfaceClassMask).toEqual(frozenClass);
    expect(next.width).toBe(1024);
    expect(next.normalRgba).toHaveLength(1024 * 512 * 4);
    expect('cloudRgba' in next).toBe(false);
  });

  it('diferencia la geología realzada, las laderas y los materiales sin alterar la clase', () => {
    const source = fixtureVISSURF3();
    const old = buildMultiresolutionSolidPlanetSurfaceVISSURF2(source, 1024, 241192);
    const next = buildStructuredSolidPlanetSurfaceVISSURF3(source, 1024, 241192);
    expect(next.rgba).not.toEqual(old.rgba);
    expect(next.reliefRgba).not.toEqual(old.reliefRgba);
    expect(next.roughnessRgba).not.toEqual(old.roughnessRgba);
    expect(valueSpanVISSURF3(next.reliefRgba!, next.classMask, 1024, 3)).toBeGreaterThan(30);
    expect(valueSpanVISSURF3(next.rgba, next.classMask, 1024, 5, 1)).toBeGreaterThan(24);
    expect(valueSpanVISSURF3(next.roughnessRgba!, next.classMask, 1024, 1, 1)).toBeLessThan(28);
    expect(valueSpanVISSURF3(next.roughnessRgba!, next.classMask, 1024, 3, 1)).toBeGreaterThan(18);
    const waterPixel = next.classMask.findIndex(value => value === 1);
    const waterNormal = Array.from(next.normalRgba.slice(waterPixel * 4, waterPixel * 4 + 3));
    expect(waterNormal).toEqual([128, 128, 255]);
  });

  it('es determinista, continuo en la costura y coherente entre 1024 y 2048', () => {
    const source = fixtureVISSURF3();
    const seed = 372019;
    const a = buildStructuredSolidPlanetSurfaceVISSURF3(source, 1024, seed);
    const b = buildStructuredSolidPlanetSurfaceVISSURF3(source, 1024, seed);
    const c = buildStructuredSolidPlanetSurfaceVISSURF3(source, 1024, seed + 1);
    expect(a.rgba).toEqual(b.rgba);
    expect(a.normalRgba).toEqual(b.normalRgba);
    expect(a.rgba).not.toEqual(c.rgba);
    const hd = buildStructuredSolidPlanetSurfaceVISSURF3(source, 2048, seed);
    let agreements = 0;
    let checked = 0;
    for (let y = 20; y < 490; y += 13) {
      for (let x = 12; x < 1000; x += 19) {
        const xx = Math.round(x / 1023 * 2047);
        const yy = Math.round((y + 0.5) / 512 * 1024 - 0.5);
        agreements += a.classMask[y * 1024 + x] === hd.classMask[yy * 2048 + xx] ? 1 : 0;
        checked++;
      }
    }
    expect(agreements / checked).toBeGreaterThan(0.94);
    for (const map of [hd.rgba, hd.roughnessRgba!, hd.reliefRgba!, hd.normalRgba]) {
      for (const y of [0, 71, 327, 861, 1023]) {
        expect(map.slice(y * 2048 * 4, y * 2048 * 4 + 4)).toEqual(
          map.slice((y * 2048 + 2047) * 4, (y * 2048 + 2048) * 4),
        );
      }
    }
  });

  it('rechaza resoluciones fuera del presupuesto y las superficies sin máscara', () => {
    const source = fixtureVISSURF3();
    expect(() => buildStructuredSolidPlanetSurfaceVISSURF3(source, 4096, 1)).toThrow(RangeError);
    expect(() => buildStructuredSolidPlanetSurfaceVISSURF3({ ...source, surfaceClassMask: null }, 1024, 1))
      .toThrow(RangeError);
  });
});
