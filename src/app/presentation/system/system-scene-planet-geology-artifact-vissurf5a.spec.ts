import { buildMultiresolutionSolidPlanetSurfaceVISSURF2 } from './system-scene-planet-surface-detail-vissurf2';
import { buildCoherentSolidPlanetSurfaceVISSURF5 } from './system-scene-planet-coherent-geography-vissurf5';

/** Uniform base to expose fabricated closed normal-map contours. */
function geologyFixtureVISSURF5a(mode: 'ROCK' | 'MIXED') {
  const width = 256;
  const height = 128;
  const rgba = new Uint8Array(width * height * 4);
  const roughnessRgba = new Uint8Array(rgba.length);
  const reliefRgba = new Uint8Array(rgba.length);
  const surfaceClassMask = new Uint8Array(width * height);
  const colors: Readonly<Record<number, readonly number[]>> = {
    1: [24, 73, 158], 2: [225, 229, 235], 3: [119, 115, 109],
    4: [169, 134, 94], 5: [74, 145, 89], 6: [83, 79, 76],
  };
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width - 1; x++) {
      const u = x / (width - 1);
      const v = y / height;
      const coast = 0.34 + 0.10 * Math.sin(6 * Math.PI * u) + 0.024 * Math.sin(17 * Math.PI * u);
      const kind = mode === 'ROCK' ? 3
        : v < 0.09 || v > 0.93 ? 2
          : v < coast ? 1 : v < 0.56 ? 5 : v < 0.70 ? 3 : v < 0.83 ? 4 : 6;
      const i = y * width + x;
      const c = colors[kind]!;
      surfaceClassMask[i] = kind;
      rgba.set([c[0]!, c[1]!, c[2]!, 255], i * 4);
      const roughness = kind === 1 ? 51 : kind === 2 ? 119 : 178;
      const relief = kind === 1 ? 95 : 128;
      roughnessRgba.set([roughness, roughness, roughness, 255], i * 4);
      reliefRgba.set([relief, relief, relief, 255], i * 4);
    }
    const last = y * width + width - 1;
    const first = y * width;
    surfaceClassMask[last] = surfaceClassMask[first]!;
    for (const texture of [rgba, roughnessRgba, reliefRgba]) {
      texture.set(texture.subarray(first * 4, first * 4 + 4), last * 4);
    }
  }
  return { width, height, rgba, roughnessRgba, reliefRgba, surfaceClassMask };
}

function normalStatisticsVISSURF5a(normals: Uint8Array, width: number, height: number) {
  let extreme = 0;
  let total = 0;
  let magnitude = 0;
  for (let y = 8; y < height - 8; y += 2) {
    for (let x = 8; x < width - 9; x += 2) {
      const i = (y * width + x) * 4;
      const contrast = Math.abs(normals[i]! - 128) + Math.abs(normals[i + 1]! - 128);
      if (contrast > 80) extreme++;
      magnitude += contrast;
      total++;
    }
  }
  return { extremeFraction: extreme / total, meanContrast: magnitude / total };
}

describe('VISSURF.5a — relieve irregular sin anillos de nivel artificiales', () => {
  it('elimina gran parte de las normales extremas cerradas sin aplanar el terreno', () => {
    const source = geologyFixtureVISSURF5a('ROCK');
    for (const seed of [0x257691ab, 872311, 0x17e9bc41]) {
      const atlas = buildCoherentSolidPlanetSurfaceVISSURF5(source, 1024, seed);
      const stats = normalStatisticsVISSURF5a(atlas.normalRgba, 1024, 512);
      // A large percentage of such gradients is the signature of old hard
      // isolines and concentric 'crater' contours in an otherwise plain rock.
      expect(stats.extremeFraction).toBeLessThan(0.022);
      expect(stats.meanContrast).toBeGreaterThan(12);
      expect(stats.meanContrast).toBeLessThan(38);
    }
  });

  it('preserva exactamente el atlas científico y sus clases en terreno mixto', () => {
    const source = geologyFixtureVISSURF5a('MIXED');
    const snapshot = new Uint8Array(source.rgba);
    const originalMask = new Uint8Array(source.surfaceClassMask);
    const seed = 0x257691ab;
    const scientific = buildMultiresolutionSolidPlanetSurfaceVISSURF2(source, 1024, seed);
    const atlas = buildCoherentSolidPlanetSurfaceVISSURF5(source, 1024, seed);
    expect(atlas.classMask).toEqual(scientific.classMask);
    expect(source.rgba).toEqual(snapshot);
    expect(source.surfaceClassMask).toEqual(originalMask);
    expect('cloudRgba' in atlas).toBe(false);
    // D.4d coastline geometry and sea/land classification remain authoritative.
    expect(atlas.width).toBe(1024);
    expect(atlas.height).toBe(512);
  });

  it('mantiene los océanos suaves, la costura y el determinismo en 1024 y 2048', () => {
    const source = geologyFixtureVISSURF5a('MIXED');
    const seed = 0x18d30a5f;
    const a = buildCoherentSolidPlanetSurfaceVISSURF5(source, 1024, seed);
    const b = buildCoherentSolidPlanetSurfaceVISSURF5(source, 1024, seed);
    expect(a.rgba).toEqual(b.rgba);
    expect(a.normalRgba).toEqual(b.normalRgba);
    const high = buildCoherentSolidPlanetSurfaceVISSURF5(source, 2048, seed);
    for (const atlas of [a, high]) {
      const { width, height } = atlas;
      for (const map of [atlas.rgba, atlas.reliefRgba!, atlas.roughnessRgba!, atlas.normalRgba]) {
        for (const y of [0, Math.floor(height / 3), Math.floor(height * 0.8), height - 1]) {
          const l = y * width * 4;
          const r = (y * width + width - 1) * 4;
          expect(map.slice(l, l + 4)).toEqual(map.slice(r, r + 4));
        }
      }
    }
    let waterContrast = 0;
    let waterCount = 0;
    let landContrast = 0;
    let landCount = 0;
    for (let y = 10; y < 502; y += 4) {
      for (let x = 10; x < 1014; x += 4) {
        const i = y * 1024 + x;
        const contrast = Math.abs(a.normalRgba[i * 4]! - 128) +
          Math.abs(a.normalRgba[i * 4 + 1]! - 128);
        if (a.classMask[i] === 1) { waterContrast += contrast; waterCount++; }
        if (a.classMask[i] === 3) { landContrast += contrast; landCount++; }
      }
    }
    expect(waterCount).toBeGreaterThan(50);
    expect(landCount).toBeGreaterThan(50);
    expect(waterContrast / waterCount).toBeLessThan(landContrast / landCount * 0.25);
  });
});
