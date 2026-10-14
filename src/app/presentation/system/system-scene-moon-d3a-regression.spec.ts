import { buildSystemSceneMoonPresentationV1, type SystemSceneMoonPresentationInputV1 } from './system-scene-moon-presentation';
import { buildMoonSurfaceMorphologyD, moonTextureDirectionD, sampleMoonTerrainD } from './system-scene-moon-geomorphology';
import { buildSystemSceneMoonTextureV1 } from './system-scene-moon-texture';
import { MOON_ATMOSPHERE_FRAGMENT_SHADER_V1 } from './system-scene-moon-renderable';

const moonInput: SystemSceneMoonPresentationInputV1 = {
  moonIdentity: 'D3A-REFERENCE', hostPlanetType: 'GAS_GIANT',
  radiusEarth: 0.34, massEarth: 0.024,
  meanDensityGramsPerCubicCentimeter: 2.1, surfaceGravityEarth: 0.20,
  atmosphereRetentionIndex01: 0.12, atmosphereRegime: 'TRACE',
  atmosphereScenarioPressurePascal: null,
  waterInventoryIndex01: 0.72, inferredIceRichnessIndex01: 0.66,
  subsurfaceOceanPotentialIndex01: 0.88, surfaceLiquidWaterPotentialIndex01: 0,
  waterRegime: 'ICE_AND_SUBSURFACE_OCEAN', estimatedSurfaceTemperatureKelvin: 78,
  geologicalActivityIndex01: 0.94, tidalHeatingIndex01: 0.85,
  geologyRegime: 'EXTREME', overallHabitabilityIndex01: 0.12,
  isPotentiallyHabitable: false, giantHostSpecialization: true,
  giantCompositionRegime: 'MIXED_ROCK_ICE', isLargeGiantMoon: true,
  isTidallyActiveGiantMoon: true, isOceanBearingGiantMoonCandidate: true,
  iceShellThermalRegime: 'CONDITIONAL_ICE_OCEAN', cryovolcanismScenario: 'CONDITIONAL',
};

describe('D.3a — constrained lunar fracture, haze and renewed plains regression', () => {
  it('creates seeded curved faults with variable width, avoiding straight hard-cut arcs', () => {
    const moon = buildSystemSceneMoonPresentationV1(moonInput);
    const morphology = buildMoonSurfaceMorphologyD(moon);
    expect(morphology.fractureArcs.length).toBeGreaterThan(3);
    expect(morphology.fractureArcs.every(arc => arc.bendAmplitude > 0 && arc.phase >= 0)).toBe(true);
    expect(new Set(morphology.fractureArcs.map(arc => arc.phase.toFixed(5))).size).toBeGreaterThan(2);
    expect(morphology).toEqual(buildMoonSurfaceMorphologyD(moon));
  });

  it('retains gradual smooth provinces, scarp belts and old crater suppression only in renewed areas', () => {
    const moon = buildSystemSceneMoonPresentationV1(moonInput);
    const active = buildMoonSurfaceMorphologyD(moon);
    const inertMoon = buildSystemSceneMoonPresentationV1({ ...moonInput,
      geologicalActivityIndex01: 0, tidalHeatingIndex01: 0,
      geologyRegime: 'INERT', cryovolcanismScenario: 'NOT_SUPPORTED_BY_SCENARIO' });
    const inert = buildMoonSurfaceMorphologyD(inertMoon);
    expect(active.crustRenewal01).toBeGreaterThan(inert.crustRenewal01);
    let renewed = 0, escarpments = 0;
    for (let y = 3; y < 96; y += 3) {
      for (let x = 0; x < 192; x += 3) {
        const d = moonTextureDirectionD(x, y, 192, 96);
        const t = sampleMoonTerrainD(d, moon, active);
        renewed = Math.max(renewed, t.renewed01);
        escarpments = Math.max(escarpments, t.scarp01);
      }
    }
    expect(renewed).toBeGreaterThan(0.05);
    expect(escarpments).toBeGreaterThan(0.05);
    expect(buildSystemSceneMoonTextureV1(moon).albedoRgba).not.toEqual(
      buildSystemSceneMoonTextureV1(inertMoon).albedoRgba);
  });

  it('preserves spherical seams and identity determinism after softening faults and plains', () => {
    const moon = buildSystemSceneMoonPresentationV1(moonInput);
    const first = buildSystemSceneMoonTextureV1(moon);
    const again = buildSystemSceneMoonTextureV1(moon);
    expect(first).toEqual(again);
    for (let y = 0; y < first.height; y++) {
      const left = 4 * y * first.width;
      const right = left + 4 * (first.width - 1);
      for (const data of [first.albedoRgba, first.reliefRgba]) {
        expect(data.slice(left, left + 4)).toEqual(data.slice(right, right + 4));
      }
    }
  });

  it('uses one gradient-based atmospheric shell with an interior haze veil and a feathered outer edge', () => {
    expect(MOON_ATMOSPHERE_FRAGMENT_SHADER_V1).toContain('uGenesisMoonAtmosphereHaze');
    expect(MOON_ATMOSPHERE_FRAGMENT_SHADER_V1).toContain('wrapHalo');
    expect(MOON_ATMOSPHERE_FRAGMENT_SHADER_V1).toContain('columnFade');
    const unresolved = buildSystemSceneMoonPresentationV1({ ...moonInput,
      atmosphereRegime: 'SUBSTANTIAL', atmosphereScenarioPressurePascal: null });
    expect(unresolved.presentationAtmospherePresent).toBe(false);
  });
});
