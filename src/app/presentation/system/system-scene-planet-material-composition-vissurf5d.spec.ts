import { buildCoherentSolidPlanetSurfaceVISSURF5 } from './system-scene-planet-coherent-geography-vissurf5';
import { composeSolidPlanetMaterialsVISSURF5d } from './system-scene-planet-material-composition-vissurf5d';

function fixtureVISSURF5d(exoticVegetation = false) {
  const width = 256;
  const height = 128;
  const surfaceClassMask = new Uint8Array(width * height);
  const rgba = new Uint8Array(width * height * 4);
  const roughnessRgba = new Uint8Array(rgba.length);
  const reliefRgba = new Uint8Array(rgba.length);
  const colors: Record<number, readonly number[]> = {
    1: [22, 74, 160], 2: [214, 226, 233], 3: [117, 111, 104],
    4: [183, 142, 89], 5: exoticVegetation ? [46, 68, 163] : [66, 130, 73],
    6: [88, 79, 75],
  };
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width - 1; x++) {
      const u = x / (width - 1);
      const v = y / height;
      const coast = 0.36 + 0.10 * Math.sin(5 * Math.PI * u);
      const kind = v < 0.075 || v > 0.94 ? 2
        : v < coast ? 1
          : v < 0.59 ? 5
            : v < 0.77 && u < 0.66 ? 4
              : v < 0.88 ? 3 : 6;
      const index = y * width + x;
      const o = index * 4;
      surfaceClassMask[index] = kind;
      rgba.set([...colors[kind]!, 255], o);
      const rough = kind === 1 ? 100 : kind === 5 ? 175 : kind === 2 ? 118 : 187;
      roughnessRgba.set([rough, rough, rough, 255], o);
      const heightValue = kind === 1 ? 95 : 129;
      reliefRgba.set([heightValue, heightValue, heightValue, 255], o);
    }
    const l = y * width;
    surfaceClassMask[l + width - 1] = surfaceClassMask[l]!;
    for (const map of [rgba, roughnessRgba, reliefRgba]) {
      map.set(map.subarray(l * 4, l * 4 + 4), (l + width - 1) * 4);
    }
  }
  return { width, height, surfaceClassMask, rgba, roughnessRgba, reliefRgba };
}

function buildVISSURF5d(seed: number, exoticVegetation = false, targetWidth = 1024) {
  const fixture = fixtureVISSURF5d(exoticVegetation);
  const original = buildCoherentSolidPlanetSurfaceVISSURF5(fixture, targetWidth, seed);
  const initialClass = new Uint8Array(original.classMask);
  const initialRelief = original.reliefRgba && new Uint8Array(original.reliefRgba);
  const initialColor = new Uint8Array(original.rgba);
  const result = composeSolidPlanetMaterialsVISSURF5d(original, seed);
  return { fixture, result, initialClass, initialRelief, initialColor };
}

describe('VISSURF.5d — composición visual sobre geografía científica inmutable', () => {
  it('conserva clases, relieve, atlas de origen y costura; diferencia albedo', () => {
    const { fixture, result, initialClass, initialRelief, initialColor } = buildVISSURF5d(73199);
    expect(result.classMask).toEqual(initialClass);
    expect(result.reliefRgba).toEqual(initialRelief);
    expect(result.rgba).not.toEqual(initialColor);
    expect(fixture.surfaceClassMask).toHaveLength(256 * 128);
    expect(fixture.rgba[3]).toBe(255);
    for (const map of [result.rgba, result.normalRgba, result.roughnessRgba!]) {
      for (const y of [0, 47, 171, 401, 511]) {
        const first = (y * 1024) * 4;
        const last = (y * 1024 + 1023) * 4;
        expect(map.slice(first, first + 4)).toEqual(map.slice(last, last + 4));
      }
    }
  });

  it('mantiene colores vegetales exóticos y crea heterogeneidad sin añadir vegetación', () => {
    const { result, initialClass } = buildVISSURF5d(99012, true);
    let seen = 0;
    let colorSpan = 0;
    let blueDominant = 0;
    let minBlue = 255;
    let maxBlue = 0;
    for (let y = 80; y < 420; y += 7) {
      for (let x = 30; x < 990; x += 11) {
        const i = y * 1024 + x;
        if (result.classMask[i] !== 5) continue;
        seen++;
        const o = i * 4;
        const r = result.rgba[o]!;
        const b = result.rgba[o + 2]!;
        if (b > r) blueDominant++;
        minBlue = Math.min(minBlue, b);
        maxBlue = Math.max(maxBlue, b);
      }
    }
    colorSpan = maxBlue - minBlue;
    expect(result.classMask).toEqual(initialClass);
    expect(seen).toBeGreaterThan(100);
    expect(blueDominant / seen).toBeGreaterThan(0.85);
    expect(colorSpan).toBeGreaterThan(15);
  });

  it('conserva íntegra la costa y evita pintar colores terrestres en píxeles de agua', () => {
    const { result, initialClass, initialColor } = buildVISSURF5d(252006);
    let waterCount = 0;
    let landCount = 0;
    let modifiedLand = 0;
    let boundaryOld = 0;
    let boundaryNew = 0;
    let boundaries = 0;
    for (let i = 0; i < result.classMask.length; i += 5) {
      const type = result.classMask[i]!;
      const o = i * 4;
      if (type === 1) {
        waterCount++;
        expect(result.rgba[o + 2]!).toBeGreaterThan(result.rgba[o]!);
      } else if (type >= 3 && type <= 6) {
        landCount++;
        if (result.rgba[o] !== initialColor[o] || result.rgba[o + 1] !== initialColor[o + 1]) modifiedLand++;
      }
    }
    // Measured perceptual improvement at adjacent dry/vegetated/rock borders,
    // without changing either side's scientific category.
    for (let y = 6; y < 506; y++) {
      for (let x = 2; x < 1021; x++) {
        const i = y * 1024 + x;
        const j = i + 1;
        const a = result.classMask[i]!;
        const b = result.classMask[j]!;
        if (a === b || a < 3 || b < 3) continue;
        boundaries++;
        for (let channel = 0; channel < 3; channel++) {
          boundaryOld += Math.abs(initialColor[i * 4 + channel]! - initialColor[j * 4 + channel]!);
          boundaryNew += Math.abs(result.rgba[i * 4 + channel]! - result.rgba[j * 4 + channel]!);
        }
      }
    }
    expect(boundaries).toBeGreaterThan(100);
    expect(boundaryNew).toBeLessThan(boundaryOld * 0.80);
    expect(result.classMask).toEqual(initialClass);
    expect(waterCount).toBeGreaterThan(5000);
    expect(landCount).toBeGreaterThan(5000);
    expect(modifiedLand).toBeGreaterThan(landCount * 0.35);
  });

  it('es determinista, mantiene el relieve acotado y no crea mapas de nubes', () => {
    const seed = 916205;
    const a = buildVISSURF5d(seed).result;
    const b = buildVISSURF5d(seed).result;
    expect(a.rgba).toEqual(b.rgba);
    expect(a.normalRgba).toEqual(b.normalRgba);
    expect(a.classMask).toEqual(b.classMask);
    expect('cloudRgba' in a).toBe(false);
    let extreme = 0;
    let sampled = 0;
    for (let i = 0; i < a.classMask.length; i += 7) {
      if (a.classMask[i] === 1) continue;
      const o = i * 4;
      const gx = Math.abs(a.normalRgba[o]! - 128);
      const gy = Math.abs(a.normalRgba[o + 1]! - 128);
      extreme += gx + gy > 195 ? 1 : 0;
      sampled++;
    }
    expect(extreme / sampled).toBeLessThan(0.03);
  });

  it('conserva identidad entre LOD 1024/2048 sin recalcular datos científicos', () => {
    const seed = 271919;
    const lower = buildVISSURF5d(seed).result;
    const higher = buildVISSURF5d(seed, false, 2048).result;
    let match = 0;
    let count = 0;
    for (let y = 15; y < 500; y += 23) {
      for (let x = 11; x < 1010; x += 29) {
        const hx = Math.round((x / 1023) * 2047);
        const hy = Math.round(((y + 0.5) / 512) * 1024 - 0.5);
        match += lower.classMask[y * 1024 + x] === higher.classMask[hy * 2048 + hx] ? 1 : 0;
        count++;
      }
    }
    expect(match / count).toBeGreaterThan(0.94);
  });
});
