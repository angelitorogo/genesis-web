import {
  buildSystemScenePlanetTextureV1,
} from './system-scene-planet-texture';

import {
  buildSystemScenePlanetSurfacePresentationV1,
} from './system-scene-planet-surface-presentation';

import {
  buildSystemScenePlanetSurfaceTextureV1,
} from './system-scene-planet-surface-texture';

describe('SystemScene semantic planet surface texture point 25.3', () => {
  const base = buildSystemScenePlanetTextureV1({
    systemIdentity: 'SYSTEM-25.3',
    planetId: 'planet-1',
    surfaceStyle: 'rocky',
    baseColorHex: '#8F7964',
  });

  const surface = buildSystemScenePlanetSurfacePresentationV1({
    waterInventoryIndex01: 0.68,
    surfaceLiquidWaterCoverageFraction01: 0.54,
    surfaceIceCoverageFraction01: 0.11,
    waterVaporFraction01: 0.18,
    retainedAtmosphericWaterVaporMoleFraction01: 0.015,
    meanSurfaceTemperatureKelvin: 286,
    climateStabilityIndex01: 0.75,
    retainedSurfacePressurePascal: 90_000,
    geologicalActivityIndex01: 0.62,
    volcanismIndex01: 0.48,
    surfaceWaterRegime: 'OCEANS',
    volcanismRegime: 'MODERATE',
  });


  // Shared immutable fixture: one expensive semantic surface render is reused by
  // deterministic-byte and seam assertions so the full coverage suite does not
  // pay for the same 256x128 multi-mask build a third time.
  const renderedFixture = buildSystemScenePlanetSurfaceTextureV1({
    systemIdentity: 'SYSTEM-25.3',
    planetId: 'planet-1',
    baseTexture: base,
    surface,
  });

  it('should deterministically render physical liquid/ice coverages and presentation desert/volcanic/cloud masks', () => {
    const first = renderedFixture;
    const second = buildSystemScenePlanetSurfaceTextureV1({
      systemIdentity: 'SYSTEM-25.3',
      planetId: 'planet-1',
      baseTexture: base,
      surface,
    });

    expect(first.rgba).toEqual(second.rgba);
    expect(first.cloudRgba).toEqual(second.cloudRgba);
    expect(first.measuredLiquidCoverageFraction01).toBeCloseTo(0.54, 3);
    expect(first.measuredIceCoverageFraction01).toBeCloseTo(0.11, 3);
    expect(first.measuredDesertCoverageFraction01).toBeCloseTo(
      surface.presentationDesertCoverageFraction01!,
      3,
    );
    expect(first.measuredVolcanicCoverageFraction01).toBeCloseTo(
      surface.presentationVolcanicCoverageFraction01!,
      3,
    );
    expect(first.measuredCloudCoverageFraction01).toBeCloseTo(
      surface.presentationCloudCoverageFraction01!,
      3,
    );
  });

  it('D.4 visual closure: keeps water blue, with coastal shallow pixels and deeper basins', () => {
    const { rgba, width, height } = renderedFixture;
    let deep = 0;
    let shore = 0;
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width - 1; x += 1) {
        const o = (y * width + x) * 4;
        const r = rgba[o]!;
        const g = rgba[o + 1]!;
        const b = rgba[o + 2]!;
        if (b > r * 1.7 && b > g * 1.15 && b > 70) {
          if (g < 100) deep += 1;
          if (g >= 100) shore += 1;
        }
      }
    }
    expect(deep).toBeGreaterThan(10);
    expect(shore).toBeGreaterThan(10);
  });

  it('D.4c: water has lower roughness and flatter relief than exposed land with unchanged coverages', () => {
    const rendered = renderedFixture;
    expect(rendered.roughnessRgba).not.toBeNull();
    expect(rendered.reliefRgba).not.toBeNull();
    const roughness = rendered.roughnessRgba!;
    const relief = rendered.reliefRgba!;
    let blueCount = 0;
    let nonBlueCount = 0;
    let liquidRoughness = 0;
    let exposedRoughness = 0;
    let liquidMinRelief = 255;
    let liquidMaxRelief = 0;
    for (let y = 0; y < rendered.height; y++) {
      for (let x = 0; x < rendered.width - 1; x++) {
        const offset = (y * rendered.width + x) * 4;
        const r = rendered.rgba[offset]!;
        const g = rendered.rgba[offset + 1]!;
        const b = rendered.rgba[offset + 2]!;
        if (b > r * 1.65 && b > g * 1.12 && b > 65) {
          blueCount++;
          liquidRoughness += roughness[offset + 1]!;
          liquidMinRelief = Math.min(liquidMinRelief, relief[offset]!);
          liquidMaxRelief = Math.max(liquidMaxRelief, relief[offset]!);
        } else if (r > b * 0.90) {
          nonBlueCount++;
          exposedRoughness += roughness[offset + 1]!;
        }
      }
    }
    expect(blueCount).toBeGreaterThan(100);
    expect(nonBlueCount).toBeGreaterThan(100);
    expect(liquidRoughness / blueCount).toBeLessThan(exposedRoughness / nonBlueCount * 0.65);
    expect(liquidMaxRelief - liquidMinRelief).toBeLessThan(30);
    expect(rendered.measuredLiquidCoverageFraction01).toBeCloseTo(0.54, 3);
    expect(rendered.measuredIceCoverageFraction01).toBeCloseTo(0.11, 3);
  });

  it('D.4d: produces contiguous large-scale basins and maintains exact physical coverages', () => {
    const { width, height, rgba } = renderedFixture;
    let adjacentSameClass = 0;
    let adjacentPairs = 0;
    const blue = (offset: number): boolean => {
      const r = rgba[offset]!;
      const g = rgba[offset + 1]!;
      const b = rgba[offset + 2]!;
      return b > r * 1.7 && b > g * 1.15 && b > 70;
    };
    for (let y = 0; y < height; y += 1) {
      for (let x = 1; x < width - 1; x += 1) {
        const current = (y * width + x) * 4;
        const west = (y * width + x - 1) * 4;
        if (blue(current) === blue(west)) adjacentSameClass += 1;
        adjacentPairs += 1;
      }
    }
    expect(adjacentSameClass / adjacentPairs).toBeGreaterThan(0.92);
    expect(renderedFixture.measuredLiquidCoverageFraction01).toBeCloseTo(0.54, 3);
    expect(renderedFixture.measuredIceCoverageFraction01).toBeCloseTo(0.11, 3);
    expect(renderedFixture.measuredDesertCoverageFraction01).toBeCloseTo(
      surface.presentationDesertCoverageFraction01!, 3,
    );
  });

  it('D.4d: low-activity mineral provinces remain non-incandescent while strong volcanism can glow', () => {
    const low = buildSystemScenePlanetSurfacePresentationV1({
      waterInventoryIndex01: 0.025,
      surfaceLiquidWaterCoverageFraction01: 0,
      surfaceIceCoverageFraction01: 0,
      waterVaporFraction01: 1,
      retainedAtmosphericWaterVaporMoleFraction01: 0.005,
      meanSurfaceTemperatureKelvin: 574,
      climateStabilityIndex01: 0.1,
      retainedSurfacePressurePascal: 94.5,
      geologicalActivityIndex01: 0.22,
      volcanismIndex01: 0.214,
      surfaceWaterRegime: 'DRY',
      volcanismRegime: 'LOW',
    });
    const lowTexture = buildSystemScenePlanetSurfaceTextureV1({
      systemIdentity: 'DRY-REFERENCE', planetId: 'dry-1', baseTexture: base, surface: low,
    });
    expect(lowTexture.measuredVolcanicCoverageFraction01).toBeGreaterThan(0);
    expect(lowTexture.emissiveRgba).not.toBeNull();
    const lowGlow = lowTexture.emissiveRgba!;
    expect(lowGlow.some((value, index) => index % 4 !== 3 && value > 0)).toBe(false);

    const intense = buildSystemScenePlanetSurfaceTextureV1({
      systemIdentity: 'DRY-REFERENCE', planetId: 'dry-1', baseTexture: base,
      surface: { ...low, volcanismIndex01: 0.95 },
    });
    expect(intense.emissiveRgba!.some((value, index) => index % 4 !== 3 && value > 0)).toBe(true);
  });

  it('should preserve an exact 0/360 degree seam for surface, emissive and cloud layers', () => {
    for (const rgba of [
      renderedFixture.rgba,
      renderedFixture.emissiveRgba!,
      renderedFixture.cloudRgba!,
      renderedFixture.roughnessRgba!,
      renderedFixture.reliefRgba!,
    ]) {
      for (let y = 0; y < renderedFixture.height; y += 1) {
        const first = y * renderedFixture.width * 4;
        const last = (y * renderedFixture.width + renderedFixture.width - 1) * 4;
        expect(rgba.subarray(first, first + 4)).toEqual(
          rgba.subarray(last, last + 4),
        );
      }
    }
  });

  it('should leave deep-envelope 25.4 targets on the generic 25.2 albedo instead of inventing continents', () => {
    const deepEnvelope = buildSystemScenePlanetSurfacePresentationV1({
      waterInventoryIndex01: 0.4,
      surfaceLiquidWaterCoverageFraction01: null,
      surfaceIceCoverageFraction01: null,
      waterVaporFraction01: 0.2,
      retainedAtmosphericWaterVaporMoleFraction01: 0.12,
      meanSurfaceTemperatureKelvin: null,
      climateStabilityIndex01: null,
      retainedSurfacePressurePascal: 5_000_000,
      geologicalActivityIndex01: null,
      volcanismIndex01: null,
      surfaceWaterRegime: 'DEEP_ENVELOPE',
      volcanismRegime: 'DEEP_ENVELOPE',
    });

    const rendered = buildSystemScenePlanetSurfaceTextureV1({
      systemIdentity: 'SYSTEM-25.3',
      planetId: 'gas-1',
      baseTexture: base,
      surface: deepEnvelope,
    });

    expect(rendered.rgba).toEqual(base.rgba);
    expect(rendered.cloudRgba).toBeNull();
    expect(rendered.roughnessRgba).toBeNull();
    expect(rendered.reliefRgba).toBeNull();
    expect(rendered.emissiveRgba).toBeNull();
    expect(rendered.measuredLiquidCoverageFraction01).toBeNull();
  });
});


describe('Global water persistence renderer semantics (post-D.4d)', () => {
  // A small seam-capable fixture keeps these comparisons independent from the
  // validated, full-resolution D.4d macrogeography and its expensive noise.
  const base = {
    version: 1 as const, seedUint32: 1234, width: 33, height: 17,
    rgba: Uint8Array.from({ length: 33 * 17 * 4 }, (_, i) => i % 4 === 3 ? 255 : 95),
  };
  const input = {
    waterInventoryIndex01: 0.87,
    surfaceLiquidWaterCoverageFraction01: 0.126,
    surfaceIceCoverageFraction01: 0.06,
    waterVaporFraction01: 0.03,
    retainedAtmosphericWaterVaporMoleFraction01: 0.01,
    meanSurfaceTemperatureKelvin: 290.49,
    climateStabilityIndex01: 0.25,
    retainedSurfacePressurePascal: 5890,
    geologicalActivityIndex01: 0.3,
    volcanismIndex01: 0.1,
    surfaceWaterRegime: 'SEAS',
    volcanismRegime: 'LOW',
  } as const;
  it('keeps modeled transient coverage but does not tint it like permanent deep ocean', () => {
    const stable = buildSystemScenePlanetSurfacePresentationV1({ ...input, hasPersistentSurfaceLiquidWater: true });
    const transient = buildSystemScenePlanetSurfacePresentationV1({ ...input, hasPersistentSurfaceLiquidWater: false });
    const render = (surface: typeof stable) => buildSystemScenePlanetSurfaceTextureV1({
      systemIdentity: 'GLOBAL-WATER-REGRESSION', planetId: 'planet-1', baseTexture: base, surface,
    });
    const a = render(stable);
    const b = render(transient);
    expect(a.measuredLiquidCoverageFraction01).toBe(b.measuredLiquidCoverageFraction01);
    expect(a.measuredIceCoverageFraction01).toBe(b.measuredIceCoverageFraction01);
    expect(a.rgba).not.toEqual(b.rgba);
    expect(b.rgba).toEqual(render(transient).rgba);
    expect(a.roughnessRgba).not.toEqual(b.roughnessRgba);
    expect(stable.hasPersistentSurfaceLiquidWater).toBe(true);
    expect(transient.hasPersistentSurfaceLiquidWater).toBe(false);
  });
});
