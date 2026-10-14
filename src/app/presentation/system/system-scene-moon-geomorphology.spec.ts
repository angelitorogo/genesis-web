import { buildSystemSceneMoonPresentationV1, type SystemSceneMoonPresentationInputV1 } from './system-scene-moon-presentation';
import { buildMoonSurfaceMorphologyD, moonTextureDirectionD, sampleMoonTerrainD } from './system-scene-moon-geomorphology';
import { buildSystemSceneMoonTextureV1 } from './system-scene-moon-texture';

const baseline: SystemSceneMoonPresentationInputV1 = {
  moonIdentity: 'D-MOON', hostPlanetType: 'GAS_GIANT',
  radiusEarth: 0.28, massEarth: 0.015,
  meanDensityGramsPerCubicCentimeter: 2.3, surfaceGravityEarth: 0.19,
  atmosphereRetentionIndex01: 0.12, atmosphereRegime: 'TRACE',
  waterInventoryIndex01: 0.61, inferredIceRichnessIndex01: 0.62,
  subsurfaceOceanPotentialIndex01: 0.85, surfaceLiquidWaterPotentialIndex01: 0,
  waterRegime: 'ICE_AND_SUBSURFACE_OCEAN', estimatedSurfaceTemperatureKelvin: 74,
  geologicalActivityIndex01: 0.38, tidalHeatingIndex01: 0.63,
  geologyRegime: 'TIDALLY_ACTIVE', overallHabitabilityIndex01: 0.29,
  isPotentiallyHabitable: false, giantHostSpecialization: true,
  giantCompositionRegime: 'MIXED_ROCK_ICE', isLargeGiantMoon: true,
  isTidallyActiveGiantMoon: true, isOceanBearingGiantMoonCandidate: true,
};

describe('D — lunar geomorphology and visual parity', () => {
  it('uses spherical coordinates, is deterministic and closes both albedo and relief seams', () => {
    const moon = buildSystemSceneMoonPresentationV1(baseline);
    const first = buildSystemSceneMoonTextureV1(moon);
    const second = buildSystemSceneMoonTextureV1(moon);
    expect(first).toEqual(second);
    expect(first.width).toBe(192);
    expect(first.height).toBe(96);
    for (let y = 0; y < first.height; y++) {
      for (const buffer of [first.albedoRgba, first.reliefRgba]) {
        const offset = y * first.width * 4;
        expect(buffer.slice(offset, offset + 4)).toEqual(buffer.slice(offset + (first.width - 1) * 4, offset + first.width * 4));
      }
    }
    expect(moonTextureDirectionD(0, 40, first.width, first.height).x).toBeCloseTo(
      moonTextureDirectionD(first.width - 1, 40, first.width, first.height).x, 10);
  });

  it('preserves impact history in inert worlds and supplies distinct morphology to active worlds', () => {
    const ancient = buildSystemSceneMoonPresentationV1({ ...baseline,
      geologicalActivityIndex01: 0, tidalHeatingIndex01: 0, geologyRegime: 'INERT' });
    const renewed = buildSystemSceneMoonPresentationV1({ ...baseline,
      geologicalActivityIndex01: 0.91, tidalHeatingIndex01: 0.91, geologyRegime: 'EXTREME' });
    const a = buildMoonSurfaceMorphologyD(ancient);
    const b = buildMoonSurfaceMorphologyD(renewed);
    expect(a.craterRetention01).toBeGreaterThan(b.craterRetention01);
    expect(b.iceTectonics01).toBeGreaterThan(a.iceTectonics01);
    expect(buildSystemSceneMoonTextureV1(ancient).albedoRgba).not.toEqual(buildSystemSceneMoonTextureV1(renewed).albedoRgba);
  });

  it('does not render a cryogenic ice-rich extreme moon as an incandescent silicate volcanic globe', () => {
    const iceActive = buildSystemSceneMoonPresentationV1({ ...baseline,
      geologicalActivityIndex01: 0.85, tidalHeatingIndex01: 1, geologyRegime: 'EXTREME' });
    expect(iceActive.surfaceStyle).not.toBe('VOLCANIC');
    expect(buildSystemSceneMoonTextureV1(iceActive).emissiveRgba).toBeNull();
    expect(buildMoonSurfaceMorphologyD(iceActive).iceTectonics01).toBeGreaterThan(0.5);
  });

  it('keeps geologically active low-ice silicates distinct and permits localized emission', () => {
    const rockActive = buildSystemSceneMoonPresentationV1({ ...baseline,
      moonIdentity: 'D-ROCK-ACTIVE', inferredIceRichnessIndex01: 0.06,
      waterInventoryIndex01: 0.04, waterRegime: 'NONE', geologyRegime: 'EXTREME',
      geologicalActivityIndex01: 0.92, tidalHeatingIndex01: 0.96 });
    expect(rockActive.surfaceStyle).toBe('VOLCANIC');
    const output = buildSystemSceneMoonTextureV1(rockActive);
    expect(output.emissiveRgba).not.toBeNull();
    expect(buildMoonSurfaceMorphologyD(rockActive).silicateActivity01).toBeGreaterThan(0.4);
  });

  it('changes spatial patterns between moon identities, but never between views of one identity', () => {
    const a = buildSystemSceneMoonPresentationV1(baseline);
    const b = buildSystemSceneMoonPresentationV1({ ...baseline, moonIdentity: 'D-MOON-OTHER' });
    const t1 = buildSystemSceneMoonTextureV1(a);
    expect(t1.albedoRgba).not.toEqual(buildSystemSceneMoonTextureV1(b).albedoRgba);
    expect(t1.albedoRgba).toEqual(buildSystemSceneMoonTextureV1(a).albedoRgba);
    const point = moonTextureDirectionD(19, 17, t1.width, t1.height);
    expect(sampleMoonTerrainD(point, a, buildMoonSurfaceMorphologyD(a))).toEqual(
      sampleMoonTerrainD(point, a, buildMoonSurfaceMorphologyD(a)));
  });

  it('does not infer a visual atmosphere or ocean from an unresolved B gas column', () => {
    const unresolved = buildSystemSceneMoonPresentationV1({ ...baseline,
      atmosphereRegime: 'SUBSTANTIAL', atmosphereRetentionIndex01: 0.75,
      atmosphereScenarioPressurePascal: null,
      waterRegime: 'SURFACE_LIQUID', surfaceLiquidWaterPotentialIndex01: 0.96,
      estimatedSurfaceTemperatureKelvin: 280 });
    expect(unresolved.presentationAtmospherePresent).toBe(false);
    expect(unresolved.presentationCloudCoverage01).toBe(0);
    expect(unresolved.presentationLiquidCoverage01).toBe(0);
    expect(unresolved.surfaceStyle).not.toBe('OCEANIC');
    const resolved = buildSystemSceneMoonPresentationV1({ ...baseline,
      atmosphereRegime: 'THIN', atmosphereRetentionIndex01: 0.75,
      atmosphereScenarioPressurePascal: 4800,
      estimatedSurfaceTemperatureKelvin: 541 });
    expect(resolved.presentationAtmospherePresent).toBe(true);
    expect(resolved.presentationCloudCoverage01).toBe(0);
    const liquidCandidate = buildSystemSceneMoonPresentationV1({ ...baseline,
      waterRegime: 'SURFACE_LIQUID', surfaceLiquidWaterPotentialIndex01: 0.92,
      atmosphereScenarioPressurePascal: 4000, atmosphereRegime: 'EXOSPHERE',
      estimatedSurfaceTemperatureKelvin: 280 });
    // Pressure-supported water can coexist with an ice-rich MIXED crust.
    // OCEANIC describes the dominant visual surface material, not the mere
    // existence of lakes or a non-zero liquid-coverage proxy.
    expect(liquidCandidate.surfaceStyle).toBe('MIXED');
    expect(liquidCandidate.presentationLiquidCoverage01).toBeGreaterThan(0.4);
    const rockyOcean = buildSystemSceneMoonPresentationV1({ ...baseline,
      waterRegime: 'SURFACE_LIQUID', surfaceLiquidWaterPotentialIndex01: 0.92,
      atmosphereScenarioPressurePascal: 4000, atmosphereRegime: 'EXOSPHERE',
      estimatedSurfaceTemperatureKelvin: 280,
      inferredIceRichnessIndex01: 0.18, giantCompositionRegime: 'ROCK_RICH' });
    expect(rockyOcean.surfaceStyle).toBe('OCEANIC');
    expect(rockyOcean.presentationLiquidCoverage01).toBeGreaterThan(0.4);
    const pressureTooLow = buildSystemSceneMoonPresentationV1({ ...baseline,
      waterRegime: 'SURFACE_LIQUID', surfaceLiquidWaterPotentialIndex01: 0.92,
      atmosphereScenarioPressurePascal: 800, atmosphereRegime: 'EXOSPHERE',
      estimatedSurfaceTemperatureKelvin: 300 });
    expect(pressureTooLow.presentationLiquidCoverage01).toBe(0);
  });
});
