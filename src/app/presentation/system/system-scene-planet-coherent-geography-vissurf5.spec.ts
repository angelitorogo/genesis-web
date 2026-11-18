import { buildMultiresolutionSolidPlanetSurfaceVISSURF2 } from './system-scene-planet-surface-detail-vissurf2';
import { buildStructuredSolidPlanetSurfaceVISSURF3 } from './system-scene-planet-structured-geography-vissurf3';
import { buildNaturalSolidPlanetSurfaceVISSURF4 } from './system-scene-planet-natural-geography-vissurf4';
import { buildCoherentSolidPlanetSurfaceVISSURF5 } from './system-scene-planet-coherent-geography-vissurf5';

function sampleSurfaceVISSURF5(flora: readonly [number, number, number] = [64, 135, 75]) {
  const width = 256;
  const height = 128;
  const mask = new Uint8Array(width * height);
  const rgba = new Uint8Array(width * height * 4);
  const roughnessRgba = new Uint8Array(rgba.length);
  const reliefRgba = new Uint8Array(rgba.length);
  const colors: Record<number, readonly number[]> = {
    1: [21, 75, 168], 2: [215, 228, 230], 3: [127, 117, 103],
    4: [171, 136, 89], 5: flora, 6: [88, 78, 73],
  };
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width - 1; x++) {
      const u = x / (width - 1);
      const v = y / height;
      const coast = 0.42 + 0.1 * Math.sin(u * 6 * Math.PI) + 0.025 * Math.sin(u * 17 * Math.PI);
      const kind = v < 0.10 || v > 0.91 ? 2
        : v < coast ? 1 : v < 0.56 ? 5 : v < 0.70 ? 3 : v < 0.80 ? 4 : 6;
      const offset = (y * width + x) * 4;
      mask[y * width + x] = kind;
      rgba.set([...colors[kind]!, 255], offset);
      const rough = kind === 1 ? 50 : kind === 2 ? 110 : 178;
      const relief = kind === 1 ? 94 : 128;
      roughnessRgba.set([rough, rough, rough, 255], offset);
      reliefRgba.set([relief, relief, relief, 255], offset);
    }
    const first = y * width * 4;
    const last = (y * width + width - 1) * 4;
    mask[y * width + width - 1] = mask[y * width]!;
    for (const map of [rgba, roughnessRgba, reliefRgba]) {
      map.set(map.subarray(first, first + 4), last);
    }
  }
  return { width, height, rgba, roughnessRgba, reliefRgba, surfaceClassMask: mask };
}

function materialMetricsVISSURF5(
  atlas: ReturnType<typeof buildCoherentSolidPlanetSurfaceVISSURF5>,
  kind: number,
) {
  let normals = 0;
  let relief = 0;
  let count = 0;
  let minimum = 255;
  let maximum = 0;
  const { classMask, reliefRgba, normalRgba, width, height, rgba } = atlas;
  for (let y = 5; y < height - 5; y += 3) {
    for (let x = 3; x < width - 3; x += 3) {
      const index = y * width + x;
      if (classMask[index] !== kind || classMask[index + 1] !== kind) continue;
      const offset = 4 * index;
      const color = rgba[offset + 1]!;
      minimum = Math.min(minimum, color);
      maximum = Math.max(maximum, color);
      normals += Math.abs(normalRgba[offset]! - 128) + Math.abs(normalRgba[offset + 1]! - 128);
      relief += Math.abs(reliefRgba![offset]! - reliefRgba![(index + 1) * 4]!);
      count++;
    }
  }
  return { normals: normals / count, relief: relief / count, greenSpan: maximum - minimum };
}

describe('VISSURF.5 — geografía natural estructurada, integrada y coherente', () => {
  it('conserva exactamente la identidad científica y el origen sin mutaciones', () => {
    const source = sampleSurfaceVISSURF5();
    const original = {
      rgba: new Uint8Array(source.rgba),
      roughness: new Uint8Array(source.roughnessRgba),
      relief: new Uint8Array(source.reliefRgba),
      classes: new Uint8Array(source.surfaceClassMask),
    };
    const base = buildMultiresolutionSolidPlanetSurfaceVISSURF2(source, 1024, 872311);
    const result = buildCoherentSolidPlanetSurfaceVISSURF5(source, 1024, 872311);
    expect(result.classMask).toEqual(base.classMask);
    expect(source.rgba).toEqual(original.rgba);
    expect(source.roughnessRgba).toEqual(original.roughness);
    expect(source.reliefRgba).toEqual(original.relief);
    expect(source.surfaceClassMask).toEqual(original.classes);
    expect('cloudRgba' in result).toBe(false);
  });

  it('recupera la definición de VISSURF.3 y conserva una pendiente más integrada que VISSURF.3', () => {
    const source = sampleSurfaceVISSURF5();
    const v3 = buildStructuredSolidPlanetSurfaceVISSURF3(source, 1024, 872311);
    const v4 = buildNaturalSolidPlanetSurfaceVISSURF4(source, 1024, 872311);
    const v5 = buildCoherentSolidPlanetSurfaceVISSURF5(source, 1024, 872311);
    const rock3 = materialMetricsVISSURF5(v3, 3);
    const rock4 = materialMetricsVISSURF5(v4, 3);
    const rock5 = materialMetricsVISSURF5(v5, 3);
    expect(rock5.normals).toBeGreaterThan(rock4.normals * 1.7);
    expect(rock5.normals).toBeLessThan(rock3.normals * 0.90);
    expect(rock5.relief).toBeGreaterThan(rock4.relief * 1.2);
    expect(rock5.relief).toBeLessThan(rock3.relief);
  });

  it('distingue material oceánico, flora y glaciares y respeta pigmentos exóticos', () => {
    const source = sampleSurfaceVISSURF5([145, 80, 145]);
    const result = buildCoherentSolidPlanetSurfaceVISSURF5(source, 1024, 0x8b13fe92);
    const sea = materialMetricsVISSURF5(result, 1);
    const land = materialMetricsVISSURF5(result, 3);
    const flora = materialMetricsVISSURF5(result, 5);
    expect(sea.normals).toBeLessThan(land.normals * 0.20);
    expect(flora.greenSpan).toBeGreaterThan(10);
    let red = 0;
    let green = 0;
    let count = 0;
    for (let i = 0; i < result.classMask.length; i += 41) {
      if (result.classMask[i] !== 5) continue;
      const offset = i * 4;
      red += result.rgba[offset]!;
      green += result.rgba[offset + 1]!;
      count++;
    }
    expect(count).toBeGreaterThan(50);
    expect(red / count).toBeGreaterThan(green / count + 20);
  });

  it('garantiza determinismo, costura, límites de LOD y concordancia de geografía', () => {
    const source = sampleSurfaceVISSURF5();
    const a = buildCoherentSolidPlanetSurfaceVISSURF5(source, 1024, 0x257691ab);
    const b = buildCoherentSolidPlanetSurfaceVISSURF5(source, 1024, 0x257691ab);
    const high = buildCoherentSolidPlanetSurfaceVISSURF5(source, 2048, 0x257691ab);
    expect(a.rgba).toEqual(b.rgba);
    expect(a.normalRgba).toEqual(b.normalRgba);
    expect(a.classMask).toEqual(b.classMask);
    expect(high.width).toBe(2048);
    expect(high.height).toBe(1024);
    let agreements = 0;
    let checked = 0;
    for (let y = 20; y < 490; y += 13) {
      for (let x = 12; x < 1000; x += 19) {
        const xx = Math.round(x / 1023 * 2047);
        const yy = Math.round((y + 0.5) / 512 * 1024 - 0.5);
        agreements += a.classMask[y * 1024 + x] === high.classMask[yy * 2048 + xx] ? 1 : 0;
        checked++;
      }
    }
    expect(agreements / checked).toBeGreaterThan(0.94);
    for (const map of [high.rgba, high.roughnessRgba!, high.reliefRgba!, high.normalRgba]) {
      for (const y of [0, 97, 311, 700, 1023]) {
        const left = y * 2048 * 4;
        const right = (y * 2048 + 2047) * 4;
        expect(map.slice(left, left + 4)).toEqual(map.slice(right, right + 4));
      }
    }
    expect(() => buildCoherentSolidPlanetSurfaceVISSURF5(source, 4096, 1)).toThrow(RangeError);
    expect(() => buildCoherentSolidPlanetSurfaceVISSURF5({ ...source, surfaceClassMask: null }, 1024, 1))
      .toThrow(RangeError);
  });
});
