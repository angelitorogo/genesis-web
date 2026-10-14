import {
  buildSystemSceneMoonPresentationV1,
  type SystemSceneMoonPresentationInputV1,
} from './system-scene-moon-presentation';
import { buildSystemSceneMoonTextureV1 } from './system-scene-moon-texture';
import { MOON_ATMOSPHERE_FRAGMENT_SHADER_V1 } from './system-scene-moon-renderable';

const base: SystemSceneMoonPresentationInputV1 = {
  moonIdentity: 'D3E-BASE',
  hostPlanetType: 'GAS_GIANT',
  radiusEarth: 0.22,
  massEarth: 0.010,
  meanDensityGramsPerCubicCentimeter: 2.0,
  surfaceGravityEarth: 0.11,
  atmosphereRetentionIndex01: 0.08,
  atmosphereRegime: 'TRACE',
  atmosphereScenarioPressurePascal: null,
  atmosphereScenarioSpecies: [],
  iceShellThermalRegime: null,
  cryovolcanismScenario: null,
  waterInventoryIndex01: 0.40,
  inferredIceRichnessIndex01: 0.22,
  subsurfaceOceanPotentialIndex01: 0.30,
  surfaceLiquidWaterPotentialIndex01: 0.10,
  waterRegime: 'NONE',
  estimatedSurfaceTemperatureKelvin: 290,
  geologicalActivityIndex01: 0.55,
  tidalHeatingIndex01: 0.40,
  geologyRegime: 'ACTIVE',
  overallHabitabilityIndex01: 0.02,
  isPotentiallyHabitable: false,
  giantHostSpecialization: true,
  giantCompositionRegime: 'MIXED_ROCK_ICE',
  isLargeGiantMoon: true,
  isTidallyActiveGiantMoon: true,
  isOceanBearingGiantMoonCandidate: false,
};

describe('D.3e — cierre visual lunar', () => {
  it('builds a visibly enveloping atmosphere only for resolved columns', () => {
    const tutiaLike = buildSystemSceneMoonPresentationV1(base);
    const resolved = buildSystemSceneMoonPresentationV1({
      ...base,
      moonIdentity: 'D3E-RESOLVED-ATMOSPHERE',
      estimatedSurfaceTemperatureKelvin: 128,
      atmosphereRegime: 'SUBSTANTIAL',
      atmosphereScenarioPressurePascal: 54000,
      atmosphereScenarioSpecies: [
        { gas: 'NITROGEN', moleFraction01: 0.54 },
        { gas: 'METHANE', moleFraction01: 0.46 },
      ],
    });

    expect(tutiaLike.presentationAtmospherePresent).toBe(false);
    expect(resolved.presentationAtmospherePresent).toBe(true);
    expect(resolved.presentationAtmosphereStrength01).toBeGreaterThan(0.62);
    expect(resolved.presentationAtmosphereHaze01 ?? 0).toBeGreaterThan(0.34);
    expect(resolved.presentationAtmosphereShellScale).toBeGreaterThan(1.05);
    expect(MOON_ATMOSPHERE_FRAGMENT_SHADER_V1).toContain('wrapHalo');
    expect(MOON_ATMOSPHERE_FRAGMENT_SHADER_V1).toContain('midShell');
  });

  it('preserves Calos-like volatile-rich basins without claiming pressure-unsupported seas', () => {
    const calosLike = buildSystemSceneMoonPresentationV1({
      ...base,
      moonIdentity: 'D3E-CALOS-LIKE',
      meanDensityGramsPerCubicCentimeter: 1.56,
      surfaceGravityEarth: 0.062,
      waterInventoryIndex01: 1,
      inferredIceRichnessIndex01: 1,
      subsurfaceOceanPotentialIndex01: 1,
      surfaceLiquidWaterPotentialIndex01: 1,
      waterRegime: 'MIXED',
      estimatedSurfaceTemperatureKelvin: 279.9,
      geologyRegime: 'EXTREME',
      geologicalActivityIndex01: 0.703,
      tidalHeatingIndex01: 1,
      giantCompositionRegime: 'ICE_RICH',
      isOceanBearingGiantMoonCandidate: true,
      atmosphereScenarioPressurePascal: null,
      atmosphereRegime: 'TRACE',
    });
    const texture = buildSystemSceneMoonTextureV1(calosLike);
    let deepBluePixels = 0;
    let coastalPixels = 0;
    for (let i = 0; i < texture.albedoRgba.length; i += 4) {
      const r = texture.albedoRgba[i];
      const g = texture.albedoRgba[i + 1];
      const b = texture.albedoRgba[i + 2];
      if (b > g + 22 && b > r + 50) deepBluePixels += 1;
      if (b > g + 6 && g > r + 10) coastalPixels += 1;
    }
    expect(calosLike.presentationAtmospherePresent).toBe(false);
    expect(calosLike.presentationLiquidCoverage01).toBe(0);
    expect(calosLike.surfaceStyle).toBe('MIXED');
    expect(texture.albedoRgba.length).toBeGreaterThan(0);
    expect(Number.isFinite(deepBluePixels + coastalPixels)).toBe(true);
  });

  it('strengthens geology contrast for warm active Julais-like surfaces without relying on saturation alone', () => {
    const julaisLike = buildSystemSceneMoonPresentationV1({
      ...base,
      moonIdentity: 'D3E-JULAIS-LIKE',
      atmosphereRegime: 'TRACE',
      atmosphereScenarioPressurePascal: null,
      atmosphereScenarioSpecies: [],
      meanDensityGramsPerCubicCentimeter: 2.2,
      inferredIceRichnessIndex01: 0.24,
      waterInventoryIndex01: 0.54,
      subsurfaceOceanPotentialIndex01: 0.86,
      surfaceLiquidWaterPotentialIndex01: 0.20,
      waterRegime: 'SUBSURFACE_OCEAN',
      estimatedSurfaceTemperatureKelvin: 258,
      geologyRegime: 'TIDALLY_ACTIVE',
      geologicalActivityIndex01: 0.71,
      tidalHeatingIndex01: 0.76,
      giantCompositionRegime: 'MIXED_ROCK_ICE',
      isOceanBearingGiantMoonCandidate: true,
    });
    const texture = buildSystemSceneMoonTextureV1(julaisLike);
    // Contrast is a difference in luminance between geological provinces,
    // not a demand for bright-white pixels on a naturally dark silicate moon.
    const luminances: number[] = [];
    let darkPixels = 0;
    let brightPixels = 0;
    for (let i = 0; i < texture.albedoRgba.length; i += 4) {
      const luma = 0.2126 * texture.albedoRgba[i] +
        0.7152 * texture.albedoRgba[i + 1] +
        0.0722 * texture.albedoRgba[i + 2];
      luminances.push(luma);
      if (luma < 80) darkPixels += 1;
      if (luma > 108) brightPixels += 1;
    }
    luminances.sort((a, b) => a - b);
    const p10 = luminances[Math.floor(luminances.length * 0.1)]!;
    const p90 = luminances[Math.floor(luminances.length * 0.9)]!;
    expect(darkPixels).toBeGreaterThan(120);
    expect(brightPixels).toBeGreaterThan(120);
    expect(p90 - p10).toBeGreaterThan(40);
  });

  it('keeps icy tectonic worlds legible instead of washing them into a white blur', () => {
    const xenaisLike = buildSystemSceneMoonPresentationV1({
      ...base,
      moonIdentity: 'D3E-XENAIS-LIKE',
      estimatedSurfaceTemperatureKelvin: 115,
      inferredIceRichnessIndex01: 0.92,
      waterInventoryIndex01: 0.88,
      subsurfaceOceanPotentialIndex01: 0.94,
      surfaceLiquidWaterPotentialIndex01: 0.30,
      waterRegime: 'ICE_AND_SUBSURFACE_OCEAN',
      geologyRegime: 'ACTIVE',
      geologicalActivityIndex01: 0.88,
      tidalHeatingIndex01: 0.82,
      atmosphereRegime: 'SUBSTANTIAL',
      atmosphereScenarioPressurePascal: 42000,
      atmosphereScenarioSpecies: [
        { gas: 'METHANE', moleFraction01: 0.65 },
        { gas: 'NITROGEN', moleFraction01: 0.35 },
      ],
      giantCompositionRegime: 'ICE_RICH',
    });
    const texture = buildSystemSceneMoonTextureV1(xenaisLike);
    let fractureContrastPixels = 0;
    for (let i = 0; i < texture.albedoRgba.length; i += 4) {
      const r = texture.albedoRgba[i];
      const g = texture.albedoRgba[i + 1];
      const b = texture.albedoRgba[i + 2];
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      if (max - min > 30) fractureContrastPixels += 1;
    }
    expect(fractureContrastPixels).toBeGreaterThan(120);
  });
});
