import { buildMultiresolutionSolidPlanetSurfaceVISSURF2 } from './system-scene-planet-surface-detail-vissurf2';
import { buildCoherentSolidPlanetSurfaceVISSURF5 } from './system-scene-planet-coherent-geography-vissurf5';

/** Fixed scientific classes: the renderer may change pixels but not these identities. */
function fixtureVISSURF5b(flora: readonly [number, number, number] = [72, 143, 79]) {
  const width = 256;
  const height = 128;
  const rgba = new Uint8Array(width * height * 4);
  const roughnessRgba = new Uint8Array(rgba.length);
  const reliefRgba = new Uint8Array(rgba.length);
  const surfaceClassMask = new Uint8Array(width * height);
  const palette: Readonly<Record<number, readonly number[]>> = {
    1: [21, 76, 170], 2: [221, 233, 236], 3: [124, 118, 109],
    4: [173, 139, 94], 5: flora, 6: [87, 80, 76],
  };
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width - 1; x++) {
      const u = x / (width - 1);
      const v = y / height;
      const coast = 0.37 + 0.10 * Math.sin(6 * Math.PI * u) + 0.025 * Math.sin(17 * Math.PI * u);
      const kind = v < 0.10 || v > 0.91 ? 2
        : v < coast ? 1 : v < 0.55 ? 5
          : v < 0.70 ? 3 : v < 0.82 ? 4 : 6;
      const offset = (y * width + x) * 4;
      const index = y * width + x;
      surfaceClassMask[index] = kind;
      const [r, g, b] = palette[kind]!;
      rgba.set([r!, g!, b!, 255], offset);
      const roughness = kind === 1 ? 50 : kind === 2 ? 115 : 180;
      const elevation = kind === 1 ? 95 : 128;
      roughnessRgba.set([roughness, roughness, roughness, 255], offset);
      reliefRgba.set([elevation, elevation, elevation, 255], offset);
    }
    const first = y * width * 4;
    const last = (y * width + width - 1) * 4;
    for (const texture of [rgba, roughnessRgba, reliefRgba]) {
      texture.set(texture.subarray(first, first + 4), last);
    }
    surfaceClassMask[y * width + width - 1] = surfaceClassMask[y * width]!;
  }
  return { width, height, rgba, roughnessRgba, reliefRgba, surfaceClassMask };
}

function statsVISSURF5b(result: ReturnType<typeof buildCoherentSolidPlanetSurfaceVISSURF5>, kind: number) {
  let count = 0;
  let roughness = 0;
  let normalContrast = 0;
  let extremeNormals = 0;
  let minGreen = 255;
  let maxGreen = 0;
  let red = 0;
  let green = 0;
  for (let y = 8; y < result.height - 8; y += 2) {
    for (let x = 8; x < result.width - 8; x += 2) {
      const index = y * result.width + x;
      if (result.classMask[index] !== kind) continue;
      const offset = index * 4;
      const contrast = Math.abs(result.normalRgba[offset]! - 128) +
        Math.abs(result.normalRgba[offset + 1]! - 128);
      normalContrast += contrast;
      if (contrast > 80) extremeNormals++;
      roughness += result.roughnessRgba![offset + 1]!;
      const g = result.rgba[offset + 1]!;
      minGreen = Math.min(minGreen, g);
      maxGreen = Math.max(maxGreen, g);
      red += result.rgba[offset]!;
      green += g;
      count++;
    }
  }
  return {
    count,
    roughness: roughness / count,
    normalContrast: normalContrast / count,
    extremeFraction: extremeNormals / count,
    greenSpan: maxGreen - minGreen,
    meanRed: red / count,
    meanGreen: green / count,
  };
}

describe('VISSURF.5b — pulido único, naturalidad y protección de la ciencia', () => {
  it('conserva todas las clases y el origen científico sin modificar nubes ni datos persistidos', () => {
    const source = fixtureVISSURF5b();
    const original = {
      rgba: new Uint8Array(source.rgba),
      relief: new Uint8Array(source.reliefRgba),
      roughness: new Uint8Array(source.roughnessRgba),
      classes: new Uint8Array(source.surfaceClassMask),
    };
    const seed = 872311;
    const baseline = buildMultiresolutionSolidPlanetSurfaceVISSURF2(source, 1024, seed);
    const result = buildCoherentSolidPlanetSurfaceVISSURF5(source, 1024, seed);
    expect(result.classMask).toEqual(baseline.classMask);
    expect(source.rgba).toEqual(original.rgba);
    expect(source.reliefRgba).toEqual(original.relief);
    expect(source.roughnessRgba).toEqual(original.roughness);
    expect(source.surfaceClassMask).toEqual(original.classes);
    expect('cloudRgba' in result).toBe(false);
  });

  it('modera el reflejo oceánico mediante rugosidad y conserva el agua más suave que roca', () => {
    const result = buildCoherentSolidPlanetSurfaceVISSURF5(fixtureVISSURF5b(), 1024, 0x257691ab);
    const water = statsVISSURF5b(result, 1);
    const rock = statsVISSURF5b(result, 3);
    expect(water.count).toBeGreaterThan(100);
    expect(rock.count).toBeGreaterThan(100);
    expect(water.roughness).toBeGreaterThan(105);
    expect(water.roughness).toBeLessThan(145);
    expect(water.roughness).toBeLessThan(rock.roughness);
    expect(water.normalContrast).toBeLessThan(rock.normalContrast * 0.20);
  });

  it('mantiene cordilleras legibles sin recuperar pendientes artificiales extremas', () => {
    const source = fixtureVISSURF5b();
    for (const seed of [0x257691ab, 872311, 0x17e9bc41]) {
      const result = buildCoherentSolidPlanetSurfaceVISSURF5(source, 1024, seed);
      const rock = statsVISSURF5b(result, 3);
      expect(rock.normalContrast).toBeGreaterThan(19);
      expect(rock.normalContrast).toBeLessThan(42);
      expect(rock.extremeFraction).toBeLessThan(0.025);
    }
  });

  it('diferencia desiertos y regiones vegetadas respetando pigmentos vegetales exóticos', () => {
    const source = fixtureVISSURF5b([148, 83, 145]);
    const result = buildCoherentSolidPlanetSurfaceVISSURF5(source, 1024, 0x257691ab);
    const desert = statsVISSURF5b(result, 4);
    const flora = statsVISSURF5b(result, 5);
    expect(desert.greenSpan).toBeGreaterThan(30);
    expect(flora.greenSpan).toBeGreaterThan(45);
    expect(flora.meanRed).toBeGreaterThan(flora.meanGreen + 22);
  });

  it('reproduce geografía en ambos LOD, con costura continua y sin resolución descontrolada', () => {
    const source = fixtureVISSURF5b();
    const seed = 0x18d30a5f;
    const low = buildCoherentSolidPlanetSurfaceVISSURF5(source, 1024, seed);
    const repeated = buildCoherentSolidPlanetSurfaceVISSURF5(source, 1024, seed);
    const high = buildCoherentSolidPlanetSurfaceVISSURF5(source, 2048, seed);
    expect(low.rgba).toEqual(repeated.rgba);
    expect(low.normalRgba).toEqual(repeated.normalRgba);
    let agreement = 0;
    let checked = 0;
    for (let y = 20; y < 490; y += 13) {
      for (let x = 12; x < 1000; x += 19) {
        const xx = Math.round(x / 1023 * 2047);
        const yy = Math.round((y + 0.5) / 512 * 1024 - 0.5);
        agreement += low.classMask[y * 1024 + x] === high.classMask[yy * 2048 + xx] ? 1 : 0;
        checked++;
      }
    }
    expect(agreement / checked).toBeGreaterThan(0.94);
    for (const map of [high.rgba, high.reliefRgba!, high.roughnessRgba!, high.normalRgba]) {
      for (const y of [0, 97, 311, 700, 1023]) {
        const first = y * 2048 * 4;
        const last = (y * 2048 + 2047) * 4;
        expect(map.slice(first, first + 4)).toEqual(map.slice(last, last + 4));
      }
    }
    expect(() => buildCoherentSolidPlanetSurfaceVISSURF5(source, 4096, 1)).toThrow(RangeError);
  });
});
