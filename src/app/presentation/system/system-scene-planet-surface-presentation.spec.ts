import {
  buildSystemScenePlanetSurfacePresentationV1,
} from './system-scene-planet-surface-presentation';

describe('SystemScene planet surface presentation point 25.3', () => {
  it('should preserve point-20 water/geology inputs while deriving bounded visual proxies', () => {
    const surface = buildSystemScenePlanetSurfacePresentationV1({
      waterInventoryIndex01: 0.72,
      surfaceLiquidWaterCoverageFraction01: 0.61,
      surfaceIceCoverageFraction01: 0.08,
      waterVaporFraction01: 0.16,
      retainedAtmosphericWaterVaporMoleFraction01: 0.012,
      meanSurfaceTemperatureKelvin: 287,
      climateStabilityIndex01: 0.81,
      retainedSurfacePressurePascal: 101_325,
      geologicalActivityIndex01: 0.58,
      volcanismIndex01: 0.34,
      surfaceWaterRegime: 'OCEANS',
      volcanismRegime: 'MODERATE',
    });

    expect(surface.source).toBe('PHASE_20_SURFACE_ENVIRONMENT');
    expect(surface.solidSurfaceAvailable).toBe(true);
    expect(surface.surfaceLiquidWaterCoverageFraction01).toBe(0.61);
    expect(surface.surfaceIceCoverageFraction01).toBe(0.08);
    expect(surface.exposedLandCoverageFraction01).toBeCloseTo(0.31, 12);
    expect(surface.presentationDesertCoverageFraction01!).toBeGreaterThanOrEqual(0);
    expect(surface.presentationDesertCoverageFraction01!).toBeLessThanOrEqual(0.31);
    expect(surface.presentationVolcanicCoverageFraction01!).toBeGreaterThan(0);
    expect(surface.presentationVolcanicCoverageFraction01!).toBeLessThanOrEqual(0.31);
    expect(surface.presentationCloudCoverageFraction01!).toBeGreaterThan(0);
    expect(surface.presentationCloudCoverageFraction01!).toBeLessThanOrEqual(1);
  });

  it('should keep deep-envelope surface semantics unavailable instead of inventing continents', () => {
    const surface = buildSystemScenePlanetSurfacePresentationV1({
      waterInventoryIndex01: 0.55,
      surfaceLiquidWaterCoverageFraction01: null,
      surfaceIceCoverageFraction01: null,
      waterVaporFraction01: 0.22,
      retainedAtmosphericWaterVaporMoleFraction01: 0.08,
      meanSurfaceTemperatureKelvin: null,
      climateStabilityIndex01: null,
      retainedSurfacePressurePascal: 8_000_000,
      geologicalActivityIndex01: null,
      volcanismIndex01: null,
      surfaceWaterRegime: 'DEEP_ENVELOPE',
      volcanismRegime: 'DEEP_ENVELOPE',
    });

    expect(surface.solidSurfaceAvailable).toBe(false);
    expect(surface.exposedLandCoverageFraction01).toBeNull();
    expect(surface.presentationDesertCoverageFraction01).toBeNull();
    expect(surface.presentationVolcanicCoverageFraction01).toBeNull();
    expect(surface.presentationCloudCoverageFraction01).toBeNull();
  });

  it('should make dry hot solid worlds more desert-prone than wet temperate worlds', () => {
    const wet = buildSystemScenePlanetSurfacePresentationV1({
      waterInventoryIndex01: 0.85,
      surfaceLiquidWaterCoverageFraction01: 0.48,
      surfaceIceCoverageFraction01: 0.04,
      waterVaporFraction01: 0.18,
      retainedAtmosphericWaterVaporMoleFraction01: 0.015,
      meanSurfaceTemperatureKelvin: 289,
      climateStabilityIndex01: 0.8,
      retainedSurfacePressurePascal: 100_000,
      geologicalActivityIndex01: 0.4,
      volcanismIndex01: 0.2,
      surfaceWaterRegime: 'OCEANS',
      volcanismRegime: 'LOW',
    });
    const dry = buildSystemScenePlanetSurfacePresentationV1({
      waterInventoryIndex01: 0.08,
      surfaceLiquidWaterCoverageFraction01: 0.01,
      surfaceIceCoverageFraction01: 0,
      waterVaporFraction01: 0.01,
      retainedAtmosphericWaterVaporMoleFraction01: 0.001,
      meanSurfaceTemperatureKelvin: 335,
      climateStabilityIndex01: 0.45,
      retainedSurfacePressurePascal: 65_000,
      geologicalActivityIndex01: 0.4,
      volcanismIndex01: 0.2,
      surfaceWaterRegime: 'LOCAL_LIQUID',
      volcanismRegime: 'LOW',
    });

    expect(dry.presentationDesertCoverageFraction01!).toBeGreaterThan(
      wet.presentationDesertCoverageFraction01!,
    );
  });
});
