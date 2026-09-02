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

  it('should preserve an exact 0/360 degree seam for surface, emissive and cloud layers', () => {
    for (const rgba of [
      renderedFixture.rgba,
      renderedFixture.emissiveRgba!,
      renderedFixture.cloudRgba!,
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
    expect(rendered.emissiveRgba).toBeNull();
    expect(rendered.measuredLiquidCoverageFraction01).toBeNull();
  });
});
