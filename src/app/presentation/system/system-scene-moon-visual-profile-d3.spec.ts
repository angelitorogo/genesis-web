import { buildSystemSceneMoonPresentationV1, type SystemSceneMoonPresentationInputV1 } from './system-scene-moon-presentation';
import { buildMoonVisualProfileD3 } from './system-scene-moon-visual-profile';
import { buildMoonSurfaceMorphologyD, moonTextureDirectionD, sampleMoonTerrainD } from './system-scene-moon-geomorphology';
import { buildSystemSceneMoonTextureV1 } from './system-scene-moon-texture';

const source: SystemSceneMoonPresentationInputV1 = {
  moonIdentity: 'D3-REFERENCE', hostPlanetType: 'GAS_GIANT', radiusEarth: 0.35,
  massEarth: 0.027, meanDensityGramsPerCubicCentimeter: 1.9,
  surfaceGravityEarth: 0.22, atmosphereRegime: 'NONE',
  atmosphereRetentionIndex01: 0.5, atmosphereScenarioPressurePascal: null,
  atmosphereScenarioSpecies: [],
  waterInventoryIndex01: 0.75, inferredIceRichnessIndex01: 0.85,
  subsurfaceOceanPotentialIndex01: 1, surfaceLiquidWaterPotentialIndex01: 0,
  waterRegime: 'ICE_AND_SUBSURFACE_OCEAN', estimatedSurfaceTemperatureKelvin: 80,
  geologicalActivityIndex01: 0.2, tidalHeatingIndex01: 0.15,
  geologyRegime: 'LOW_ACTIVITY', overallHabitabilityIndex01: 0.65,
  isPotentiallyHabitable: true, giantHostSpecialization: true,
  giantCompositionRegime: 'ICE_RICH', isLargeGiantMoon: true,
  isTidallyActiveGiantMoon: false, isOceanBearingGiantMoonCandidate: true,
};

describe('D.3 — scientific lunar morphology and atmosphere', () => {
  it('derives exactly the same profile and textures for the same frozen identity', () => {
    const moon = buildSystemSceneMoonPresentationV1(source);
    expect(buildMoonVisualProfileD3(moon)).toEqual(buildMoonVisualProfileD3(moon));
    expect(buildSystemSceneMoonTextureV1(moon)).toEqual(buildSystemSceneMoonTextureV1(moon));
    const other = buildSystemSceneMoonPresentationV1({ ...source, moonIdentity: 'D3-OTHER' });
    expect(buildSystemSceneMoonTextureV1(other).albedoRgba).not.toEqual(buildSystemSceneMoonTextureV1(moon).albedoRgba);
  });

  it('does not promote old high ocean/habitability scores to active cryovolcanism or surface seas', () => {
    const moon = buildSystemSceneMoonPresentationV1({ ...source,
      iceShellThermalRegime: 'TIDAL_HEAT_INSUFFICIENT_IN_SCENARIO',
      cryovolcanismScenario: 'NOT_SUPPORTED_BY_SCENARIO',
      subsurfaceOceanPotentialIndex01: 1,
      surfaceLiquidWaterPotentialIndex01: 1,
      waterRegime: 'SURFACE_LIQUID',
    });
    const profile = buildMoonVisualProfileD3(moon);
    expect(profile.thermallySupportedCryosphere).toBe(false);
    expect(profile.liquidVisual01).toBe(0);
    expect(moon.surfaceStyle).not.toBe('OCEANIC');
    expect(buildSystemSceneMoonTextureV1(moon).emissiveRgba).toBeNull();
  });

  it('reduces ancient crater retention and creates local smooth regions for geologically active moons', () => {
    const old = buildMoonSurfaceMorphologyD(buildSystemSceneMoonPresentationV1({ ...source,
      geologyRegime: 'INERT', geologicalActivityIndex01: 0, tidalHeatingIndex01: 0 }));
    const activeMoon = buildSystemSceneMoonPresentationV1({ ...source,
      geologyRegime: 'EXTREME', geologicalActivityIndex01: 0.94, tidalHeatingIndex01: 0.91,
      iceShellThermalRegime: 'CONDITIONAL_ICE_OCEAN', cryovolcanismScenario: 'CONDITIONAL' });
    const active = buildMoonSurfaceMorphologyD(activeMoon);
    expect(old.craterRetention01).toBeGreaterThan(active.craterRetention01);
    expect(active.crustRenewal01).toBeGreaterThan(old.crustRenewal01);
    expect(active.iceTectonics01).toBeGreaterThan(old.iceTectonics01);
    const sample = sampleMoonTerrainD(moonTextureDirectionD(30, 40, 192, 96), activeMoon, active);
    expect(sample.renewed01).toBeGreaterThanOrEqual(0);
    expect(sample.province01).toBeGreaterThanOrEqual(0);
  });

  it('changes basin scale and relief with physical radius and gravity, not object name', () => {
    const minor = buildMoonVisualProfileD3(buildSystemSceneMoonPresentationV1({ ...source,
      radiusEarth: 0.05, surfaceGravityEarth: 0.03 }));
    const major = buildMoonVisualProfileD3(buildSystemSceneMoonPresentationV1({ ...source,
      radiusEarth: 0.46, surfaceGravityEarth: 0.28 }));
    expect(minor.basinScale01).toBeGreaterThan(major.basinScale01);
    expect(minor.reliefContrast01).toBeGreaterThan(major.reliefContrast01);
  });

  it('keeps resolved methane-rich cold haze distinct from clear inert-gas atmosphere', () => {
    const cold = { ...source, atmosphereRegime: 'SUBSTANTIAL', atmosphereScenarioPressurePascal: 50000 };
    const haze = buildSystemSceneMoonPresentationV1({ ...cold,
      atmosphereScenarioSpecies: [{ gas: 'METHANE', moleFraction01: 0.50 }, { gas: 'NITROGEN', moleFraction01: 0.50 }] });
    const transparent = buildSystemSceneMoonPresentationV1({ ...cold,
      atmosphereScenarioSpecies: [{ gas: 'ARGON', moleFraction01: 1 }] });
    expect(haze.presentationAtmospherePresent).toBe(true);
    expect(haze.presentationAtmosphereHaze01 ?? 0).toBeGreaterThan((transparent.presentationAtmosphereHaze01 ?? 0) + 0.3);
    expect(haze.presentationCloudCoverage01).toBe(0);
    expect(transparent.presentationCloudCoverage01).toBe(0);
    expect(haze.presentationAtmosphereColorHex).not.toBe(transparent.presentationAtmosphereColorHex);
  });

  it('keeps unresolved B atmosphere invisible even with a high legacy retention index', () => {
    const moon = buildSystemSceneMoonPresentationV1({ ...source,
      atmosphereRegime: 'SUBSTANTIAL', atmosphereRetentionIndex01: 1,
      atmosphereScenarioPressurePascal: null });
    const profile = buildMoonVisualProfileD3(moon);
    expect(profile.atmosphericOpacity01).toBe(0);
    expect(profile.atmosphericHaze01).toBe(0);
    expect(profile.atmosphericClouds01).toBe(0);
  });

  it('enables liquid regions only for a bounded phase-compatible B scenario', () => {
    const ready = { ...source, waterRegime: 'SURFACE_LIQUID',
      estimatedSurfaceTemperatureKelvin: 280, surfaceLiquidWaterPotentialIndex01: 0.8,
      atmosphereRegime: 'THIN', atmosphereScenarioPressurePascal: 12000,
      atmosphereScenarioSpecies: [{ gas: 'WATER_VAPOR', moleFraction01: 0.08 }, { gas: 'NITROGEN', moleFraction01: 0.92 }] };
    const supported = buildSystemSceneMoonPresentationV1(ready);
    const unsupported = buildSystemSceneMoonPresentationV1({ ...ready, atmosphereScenarioPressurePascal: null });
    expect(buildMoonVisualProfileD3(supported).liquidVisual01).toBeGreaterThan(0);
    expect(buildMoonVisualProfileD3(unsupported).liquidVisual01).toBe(0);
    expect(buildSystemSceneMoonTextureV1(supported).albedoRgba).not.toEqual(buildSystemSceneMoonTextureV1(unsupported).albedoRgba);
  });

  it('keeps longitude seam and pole colors consistent across all procedural maps', () => {
    const moon = buildSystemSceneMoonPresentationV1({ ...source,
      geologicalActivityIndex01: 0.94, tidalHeatingIndex01: 0.91,
      iceShellThermalRegime: 'CONDITIONAL_ICE_OCEAN' });
    const t = buildSystemSceneMoonTextureV1(moon);
    for (const array of [t.albedoRgba, t.reliefRgba]) {
      for (let row = 0; row < t.height; row++) {
        const a = row * t.width * 4, b = a + (t.width - 1) * 4;
        expect(array.slice(a, a + 4)).toEqual(array.slice(b, b + 4));
      }
    }
  });
});
