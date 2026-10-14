import {
  buildSystemSceneMoonPresentationV1,
  type SystemSceneMoonPresentationInputV1,
} from './system-scene-moon-presentation';
import { buildSystemSceneMoonTextureV1 } from './system-scene-moon-texture';
import { MOON_ATMOSPHERE_FRAGMENT_SHADER_V1 } from './system-scene-moon-renderable';

const base: SystemSceneMoonPresentationInputV1 = {
  moonIdentity: 'D3D-BASE',
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

describe('D.3d — agua superficial, atmósfera visible y contraste geológico', () => {
  it('keeps unresolved atmospheres invisible but restores a stronger visible limb for resolved columns', () => {
    const unresolved = buildSystemSceneMoonPresentationV1(base);
    const resolved = buildSystemSceneMoonPresentationV1({
      ...base,
      moonIdentity: 'D3D-RESOLVED-ATMOSPHERE',
      atmosphereRegime: 'THIN',
      atmosphereScenarioPressurePascal: 3200,
      atmosphereScenarioSpecies: [
        { gas: 'NITROGEN', moleFraction01: 0.86 },
        { gas: 'WATER_VAPOR', moleFraction01: 0.14 },
      ],
    });

    expect(unresolved.presentationAtmospherePresent).toBe(false);
    expect(resolved.presentationAtmospherePresent).toBe(true);
    expect(resolved.presentationAtmosphereStrength01).toBeGreaterThan(0.30);
    expect(resolved.presentationAtmosphereShellScale).toBeGreaterThan(1.015);
    expect(MOON_ATMOSPHERE_FRAGMENT_SHADER_V1).toContain('discGate');
    expect(MOON_ATMOSPHERE_FRAGMENT_SHADER_V1).toContain('wrapHalo');
  });

  it('keeps unresolved liquid-water candidates as terrain evidence, not confirmed blue seas', () => {
    const calosLike = buildSystemSceneMoonPresentationV1({
      ...base,
      moonIdentity: 'D3D-CALOS-LIKE',
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
    let bluePixels = 0;
    for (let i = 0; i < texture.albedoRgba.length; i += 4) {
      const r = texture.albedoRgba[i];
      const g = texture.albedoRgba[i + 1];
      const b = texture.albedoRgba[i + 2];
      if (b > r + 22 && b > g + 6) bluePixels += 1;
    }
    expect(calosLike.presentationAtmospherePresent).toBe(false);
    expect(calosLike.presentationLiquidCoverage01).toBe(0);
    expect(calosLike.surfaceStyle).toBe('MIXED');
    expect(texture.albedoRgba.length).toBeGreaterThan(0);
    expect(Number.isFinite(bluePixels)).toBe(true);
  });

  it('never paints water solely because a resolved atmosphere can support it, without water inventory or candidates', () => {
    const dry = buildSystemSceneMoonPresentationV1({
      ...base,
      moonIdentity: 'D3D-DRY-WORLD',
      atmosphereRegime: 'THIN',
      atmosphereScenarioPressurePascal: 12000,
      atmosphereScenarioSpecies: [{ gas: 'NITROGEN', moleFraction01: 1 }],
      waterInventoryIndex01: 0.01,
      surfaceLiquidWaterPotentialIndex01: 0,
      waterRegime: 'NONE',
    });
    expect(dry.presentationAtmospherePresent).toBe(true);
    expect(dry.presentationLiquidCoverage01).toBe(0);
  });

  it('keeps icy tectonic surfaces readable under the atmosphere rather than washing them into a white blur', () => {
    const xenaisLike = buildSystemSceneMoonPresentationV1({
      ...base,
      moonIdentity: 'D3D-XENAIS-LIKE',
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
      atmosphereScenarioSpecies: [{ gas: 'METHANE', moleFraction01: 0.65 }, { gas: 'NITROGEN', moleFraction01: 0.35 }],
      giantCompositionRegime: 'ICE_RICH',
    });
    const texture = buildSystemSceneMoonTextureV1(xenaisLike);
    let contrastHits = 0;
    for (let i = 0; i < texture.albedoRgba.length; i += 4) {
      const r = texture.albedoRgba[i];
      const g = texture.albedoRgba[i + 1];
      const b = texture.albedoRgba[i + 2];
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      if (max - min > 28) contrastHits += 1;
    }
    expect(xenaisLike.presentationAtmospherePresent).toBe(true);
    expect(xenaisLike.presentationAtmosphereColorHex).not.toBe('#B0C5CE');
    expect(contrastHits).toBeGreaterThan(100);
  });
});
