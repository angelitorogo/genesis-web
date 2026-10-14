import {
  buildSystemSceneMoonPresentationV1,
  type SystemSceneMoonPresentationInputV1,
} from './system-scene-moon-presentation';
import {
  buildMoonSurfaceMorphologyD,
  moonTextureDirectionD,
  sampleMoonTerrainD,
} from './system-scene-moon-geomorphology';
import { buildSystemSceneMoonTextureV1 } from './system-scene-moon-texture';
import { MOON_ATMOSPHERE_FRAGMENT_SHADER_V1 } from './system-scene-moon-renderable';

const rockyActiveBase: SystemSceneMoonPresentationInputV1 = {
  moonIdentity: 'D3B-ROCKY-ACTIVE',
  hostPlanetType: 'GAS_GIANT',
  radiusEarth: 0.29,
  massEarth: 0.020,
  meanDensityGramsPerCubicCentimeter: 3.1,
  surfaceGravityEarth: 0.18,
  atmosphereRetentionIndex01: 0.05,
  atmosphereRegime: 'TRACE',
  atmosphereScenarioPressurePascal: null,
  atmosphereScenarioSpecies: [],
  iceShellThermalRegime: null,
  cryovolcanismScenario: null,
  waterInventoryIndex01: 0.18,
  inferredIceRichnessIndex01: 0.12,
  subsurfaceOceanPotentialIndex01: 0.06,
  surfaceLiquidWaterPotentialIndex01: 0,
  waterRegime: 'NONE',
  estimatedSurfaceTemperatureKelvin: 285,
  geologicalActivityIndex01: 0.64,
  tidalHeatingIndex01: 0.46,
  geologyRegime: 'ACTIVE',
  overallHabitabilityIndex01: 0.04,
  isPotentiallyHabitable: false,
  giantHostSpecialization: true,
  giantCompositionRegime: 'ROCK_RICH',
  isLargeGiantMoon: true,
  isTidallyActiveGiantMoon: true,
  isOceanBearingGiantMoonCandidate: false,
};

describe('D.3c — visual atmospheric correction and lunar polish', () => {
  it('reinforces renewed rocky terrains as visually distinct geologic provinces', () => {
    const moon = buildSystemSceneMoonPresentationV1(rockyActiveBase);
    const morphology = buildMoonSurfaceMorphologyD(moon);
    const texture = buildSystemSceneMoonTextureV1(moon);
    let renewedLuma = 0;
    let renewedCount = 0;
    let oldLuma = 0;
    let oldCount = 0;

    for (let y = 4; y < texture.height; y += 4) {
      for (let x = 0; x < texture.width; x += 4) {
        const direction = moonTextureDirectionD(x, y, texture.width, texture.height);
        const sample = sampleMoonTerrainD(direction, moon, morphology);
        const index = (y * texture.width + x) * 4;
        const r = texture.albedoRgba[index];
        const g = texture.albedoRgba[index + 1];
        const b = texture.albedoRgba[index + 2];
        const luma = (r + g + b) / 3;
        if (sample.renewed01 > 0.28) {
          renewedLuma += luma;
          renewedCount += 1;
        } else if (sample.renewed01 < 0.05) {
          oldLuma += luma;
          oldCount += 1;
        }
      }
    }

    expect(renewedCount).toBeGreaterThan(20);
    expect(oldCount).toBeGreaterThan(20);
    expect(Math.abs(renewedLuma / renewedCount - oldLuma / oldCount)).toBeGreaterThan(5);
  });

  it('restores clearly visible but controlled atmospheres and keeps composition-driven colors distinct', () => {
    const thin = buildSystemSceneMoonPresentationV1({
      ...rockyActiveBase,
      moonIdentity: 'D3B-THIN-HALO',
      atmosphereRegime: 'THIN',
      atmosphereScenarioPressurePascal: 1800,
      atmosphereScenarioSpecies: [{ gas: 'NITROGEN', moleFraction01: 0.9 }, { gas: 'ARGON', moleFraction01: 0.1 }],
    });
    const denseMethane = buildSystemSceneMoonPresentationV1({
      ...rockyActiveBase,
      moonIdentity: 'D3B-DENSE-CH4',
      estimatedSurfaceTemperatureKelvin: 95,
      inferredIceRichnessIndex01: 0.88,
      atmosphereRegime: 'SUBSTANTIAL',
      atmosphereScenarioPressurePascal: 42000,
      atmosphereScenarioSpecies: [{ gas: 'METHANE', moleFraction01: 0.55 }, { gas: 'NITROGEN', moleFraction01: 0.45 }],
      waterRegime: 'SURFACE_ICE',
      giantCompositionRegime: 'ICE_RICH',
    });
    const sulfur = buildSystemSceneMoonPresentationV1({
      ...rockyActiveBase,
      moonIdentity: 'D3B-SULFUR-SKY',
      atmosphereRegime: 'SUBSTANTIAL',
      atmosphereScenarioPressurePascal: 35000,
      atmosphereScenarioSpecies: [{ gas: 'SULFUR_DIOXIDE', moleFraction01: 0.7 }, { gas: 'CARBON_DIOXIDE', moleFraction01: 0.3 }],
      estimatedSurfaceTemperatureKelvin: 340,
    });

    expect(thin.presentationAtmospherePresent).toBe(true);
    expect(thin.presentationAtmosphereHaze01 ?? 0).toBeGreaterThan(0.09);
    expect(thin.presentationAtmosphereShellScale).toBeGreaterThan(1.01);
    expect(denseMethane.presentationAtmosphereShellScale).toBeGreaterThan(thin.presentationAtmosphereShellScale);
    expect(denseMethane.presentationAtmosphereColorHex).not.toBe(thin.presentationAtmosphereColorHex);
    expect(sulfur.presentationAtmosphereColorHex).not.toBe(thin.presentationAtmosphereColorHex);
    expect(MOON_ATMOSPHERE_FRAGMENT_SHADER_V1).toContain('discGate');
    expect(MOON_ATMOSPHERE_FRAGMENT_SHADER_V1).toContain('wrapHalo');
  });

  it('integrates icy tectonic fractures more organically and can paint supported surface water outside purely oceanic styles', () => {
    const icyActive = buildSystemSceneMoonPresentationV1({
      ...rockyActiveBase,
      moonIdentity: 'D3B-ICY-FRACTURE',
      estimatedSurfaceTemperatureKelvin: 110,
      inferredIceRichnessIndex01: 0.92,
      waterInventoryIndex01: 0.86,
      subsurfaceOceanPotentialIndex01: 0.90,
      waterRegime: 'ICE_AND_SUBSURFACE_OCEAN',
      giantCompositionRegime: 'ICE_RICH',
      geologyRegime: 'EXTREME',
      geologicalActivityIndex01: 0.92,
      tidalHeatingIndex01: 0.88,
      iceShellThermalRegime: 'CONDITIONAL_ICE_OCEAN',
      cryovolcanismScenario: 'CONDITIONAL',
    });
    const icyMorphology = buildMoonSurfaceMorphologyD(icyActive);
    let fracturedSamples = 0;
    let scarpSamples = 0;
    for (let y = 2; y < 96; y += 3) {
      for (let x = 0; x < 192; x += 3) {
        const sample = sampleMoonTerrainD(moonTextureDirectionD(x, y, 192, 96), icyActive, icyMorphology);
        if (sample.fracture01 > 0.20) fracturedSamples += 1;
        if (sample.scarp01 > 0.08) scarpSamples += 1;
      }
    }
    expect(fracturedSamples).toBeGreaterThan(15);
    expect(scarpSamples).toBeGreaterThan(15);

    const rockyLakes = buildSystemSceneMoonPresentationV1({
      ...rockyActiveBase,
      moonIdentity: 'D3B-ROCKY-LAKES',
      surfaceLiquidWaterPotentialIndex01: 0.72,
      waterInventoryIndex01: 0.52,
      waterRegime: 'SURFACE_LIQUID',
      atmosphereRegime: 'THIN',
      atmosphereScenarioPressurePascal: 14000,
      atmosphereScenarioSpecies: [{ gas: 'WATER_VAPOR', moleFraction01: 0.06 }, { gas: 'NITROGEN', moleFraction01: 0.94 }],
    });
    const texture = buildSystemSceneMoonTextureV1(rockyLakes);
    let blueDominantPixels = 0;
    for (let index = 0; index < texture.albedoRgba.length; index += 4) {
      const r = texture.albedoRgba[index];
      const g = texture.albedoRgba[index + 1];
      const b = texture.albedoRgba[index + 2];
      if (b > r + 18 && g > r + 4) {
        blueDominantPixels += 1;
      }
    }
    expect(rockyLakes.presentationLiquidCoverage01).toBeGreaterThan(0.1);
    expect(blueDominantPixels).toBeGreaterThan(20);
  });
});
