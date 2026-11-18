import { buildStructuredSolidPlanetSurfaceVISSURF3 } from './system-scene-planet-structured-geography-vissurf3';
import { buildNaturalSolidPlanetSurfaceVISSURF4 } from './system-scene-planet-natural-geography-vissurf4';

function fixtureVISSURF4() {
  const width = 256;
  const height = 128;
  const mask = new Uint8Array(width * height);
  const rgba = new Uint8Array(width * height * 4);
  const rough = new Uint8Array(rgba.length);
  const relief = new Uint8Array(rgba.length);
  const colors: number[][] = [[], [20, 73, 168], [220, 232, 234], [122, 116, 106],
    [174, 139, 92], [66, 136, 78], [90, 79, 73]];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width - 1; x++) {
      const u = x / (width - 1);
      const v = y / height;
      const coast = 0.42 + 0.08 * Math.sin(u * 5 * Math.PI) + 0.03 * Math.sin(u * 17 * Math.PI);
      const kind = v < 0.12 || v > 0.90 ? 2
        : v < coast ? 1
          : v < 0.54 ? 5
            : v < 0.67 ? 3
              : v < 0.77 ? 4 : 6;
      mask[y * width + x] = kind;
      rgba.set([...colors[kind]!, 255], (y * width + x) * 4);
      const roughness = kind === 1 ? 46 : kind === 2 ? 116 : 174;
      const elevation = kind === 1 ? 92 : 128;
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

function span(map: Uint8Array, mask: Uint8Array, width: number, kind: number, channel = 0) {
  let min = 255;
  let max = 0;
  for (let y = 16; y < width / 2 - 16; y += 3) {
    for (let x = 3; x < width - 3; x += 5) {
      const i = y * width + x;
      if (mask[i] !== kind) continue;
      const value = map[i * 4 + channel]!;
      min = Math.min(min, value);
      max = Math.max(max, value);
    }
  }
  return max - min;
}

function averageAdjacentHeightDelta(map: Uint8Array, mask: Uint8Array, width: number, kind: number) {
  let total = 0;
  let count = 0;
  const height = width / 2;
  for (let y = 10; y < height - 10; y += 2) {
    for (let x = 2; x < width - 3; x += 2) {
      const i = y * width + x;
      if (mask[i] !== kind || mask[i + 1] !== kind) continue;
      total += Math.abs(map[i * 4]! - map[(i + 1) * 4]!);
      count++;
    }
  }
  return count > 0 ? total / count : 0;
}

describe('VISSURF.4 — integración natural de relieve y materiales', () => {
  it('conserva la clasificación científica y mantiene continuidad/determinismo', () => {
    const source = fixtureVISSURF4();
    const seed = 0x17e9bc41;
    const base = buildStructuredSolidPlanetSurfaceVISSURF3(source, 1024, seed);
    const a = buildNaturalSolidPlanetSurfaceVISSURF4(source, 1024, seed);
    const b = buildNaturalSolidPlanetSurfaceVISSURF4(source, 1024, seed);
    expect(a.classMask).toEqual(base.classMask);
    expect(a.rgba).toEqual(b.rgba);
    expect(a.normalRgba).toEqual(b.normalRgba);
    for (const map of [a.rgba, a.reliefRgba!, a.roughnessRgba!, a.normalRgba]) {
      for (const y of [0, 33, 177, 355, 511]) {
        expect(map.slice(y * 1024 * 4, y * 1024 * 4 + 4)).toEqual(
          map.slice((y * 1024 + 1023) * 4, (y * 1024 + 1024) * 4),
        );
      }
    }
  });

  it('suaviza el relieve respecto a VISSURF.3 sin perder presencia estructural', () => {
    const source = fixtureVISSURF4();
    const seed = 872311;
    const previous = buildStructuredSolidPlanetSurfaceVISSURF3(source, 1024, seed);
    const next = buildNaturalSolidPlanetSurfaceVISSURF4(source, 1024, seed);
    const previousDelta = averageAdjacentHeightDelta(previous.reliefRgba!, previous.classMask, 1024, 3);
    const nextDelta = averageAdjacentHeightDelta(next.reliefRgba!, next.classMask, 1024, 3);
    expect(nextDelta).toBeLessThan(previousDelta);
    expect(span(next.reliefRgba!, next.classMask, 1024, 3)).toBeGreaterThan(18);
    expect(span(next.reliefRgba!, next.classMask, 1024, 5)).toBeGreaterThan(12);
  });

  it('mejora transiciones, vegetación y costas sin tocar las nubes', () => {
    const source = fixtureVISSURF4();
    const next = buildNaturalSolidPlanetSurfaceVISSURF4(source, 2048, 241192);
    expect(span(next.rgba, next.classMask, 2048, 5, 1)).toBeGreaterThan(18);
    expect(span(next.rgba, next.classMask, 2048, 1, 2)).toBeGreaterThan(14);
    expect(span(next.roughnessRgba!, next.classMask, 2048, 1, 1)).toBeLessThan(30);
    expect('cloudRgba' in next).toBe(false);
    const waterPixel = next.classMask.findIndex(value => value === 1);
    expect(Array.from(next.normalRgba.slice(waterPixel * 4, waterPixel * 4 + 3))[2]).toBeGreaterThan(240);
  });

  it('rechaza resoluciones fuera de presupuesto y superficies sin máscara', () => {
    const source = fixtureVISSURF4();
    expect(() => buildNaturalSolidPlanetSurfaceVISSURF4(source, 4096, 1)).toThrow(RangeError);
    expect(() => buildNaturalSolidPlanetSurfaceVISSURF4({ ...source, surfaceClassMask: null }, 1024, 1))
      .toThrow(RangeError);
  });
});
