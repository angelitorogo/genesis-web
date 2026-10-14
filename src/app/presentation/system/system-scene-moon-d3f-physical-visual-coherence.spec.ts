import * as THREE from 'three';
import {
  buildSystemSceneMoonPresentationV1,
  type SystemSceneMoonPresentationInputV1,
} from './system-scene-moon-presentation';
import { buildSystemSceneMoonTextureV1 } from './system-scene-moon-texture';
import { createSystemSceneMoonRenderableV1 } from './system-scene-moon-renderable';

/** Synthetic counterparts: no seed-specific branches in production code. */
const moon: SystemSceneMoonPresentationInputV1 = {
  moonIdentity: 'D3F-VISUAL-REGRESSION',
  hostPlanetType: 'GAS_GIANT',
  radiusEarth: 0.218,
  massEarth: 0.003,
  meanDensityGramsPerCubicCentimeter: 1.56,
  surfaceGravityEarth: 0.062,
  atmosphereRetentionIndex01: 0.411,
  atmosphereRegime: 'TRACE',
  atmosphereScenarioPressurePascal: null,
  atmosphereScenarioSpecies: [],
  waterInventoryIndex01: 1,
  inferredIceRichnessIndex01: 1,
  subsurfaceOceanPotentialIndex01: 1,
  surfaceLiquidWaterPotentialIndex01: 1,
  waterRegime: 'MIXED',
  estimatedSurfaceTemperatureKelvin: 279.9,
  geologicalActivityIndex01: 0.703,
  tidalHeatingIndex01: 1,
  geologyRegime: 'EXTREME',
  overallHabitabilityIndex01: 0,
  isPotentiallyHabitable: false,
  giantHostSpecialization: true,
  giantCompositionRegime: 'ICE_RICH',
  isLargeGiantMoon: true,
  isTidallyActiveGiantMoon: true,
  isOceanBearingGiantMoonCandidate: true,
};

describe('D.3f — coherencia visual con presión/temperatura sin alterar índices', () => {
  it('Calos-like: retains high scientific potential and volcanic facies but no unsupported blue seas or atmosphere', () => {
    const original = { ...moon };
    const projected = buildSystemSceneMoonPresentationV1(moon);
    const texture = buildSystemSceneMoonTextureV1(projected);
    expect(projected.presentationAtmospherePresent).toBe(false);
    expect(projected.presentationCloudCoverage01).toBe(0);
    expect(projected.presentationLiquidCoverage01).toBe(0);
    expect(projected.surfaceStyle).toBe('MIXED');
    expect(projected.sourceSurfaceLiquidWaterPotentialIndex01).toBe(1);
    expect(projected.sourceWaterInventoryIndex01).toBe(1);
    expect(moon).toEqual(original);
    expect(texture.albedoRgba.length).toBe(texture.width * texture.height * 4);
    expect(buildSystemSceneMoonTextureV1(projected).albedoRgba).toEqual(texture.albedoRgba);
    const rendered = createSystemSceneMoonRenderableV1(projected);
    expect(rendered.root.children.some(child => child.name.includes('atmosphere'))).toBe(false);
    const material = rendered.surfaceMaterial as THREE.MeshPhysicalMaterial;
    expect(material.clearcoat).toBe(0);
    expect(material.specularIntensity).toBeLessThan(0.25);
    for (const r of rendered.resources) r.dispose();
  });

  it('accepts blue sea basins only when a pressure-and-temperature-compatible B scenario exists', () => {
    const lowPressure = buildSystemSceneMoonPresentationV1({
      ...moon, atmosphereRegime: 'THIN', atmosphereScenarioPressurePascal: 700,
    });
    const resolved = buildSystemSceneMoonPresentationV1({
      ...moon, atmosphereRegime: 'THIN', atmosphereScenarioPressurePascal: 12000,
      atmosphereScenarioSpecies: [{ gas: 'NITROGEN', moleFraction01: 1 }],
    });
    expect(lowPressure.presentationLiquidCoverage01).toBe(0);
    expect(resolved.presentationLiquidCoverage01).toBeGreaterThan(0.4);
    expect(resolved.presentationAtmospherePresent).toBe(true);
    expect(resolved.sourceSurfaceLiquidWaterPotentialIndex01).toBe(
      lowPressure.sourceSurfaceLiquidWaterPotentialIndex01,
    );
    expect(resolved.presentationCloudCoverage01).toBe(0); // no modeled water vapour
  });

  it('does not turn sub-freezing surfaces into modeled liquid oceans from a high potential index', () => {
    const freezing = buildSystemSceneMoonPresentationV1({
      ...moon, estimatedSurfaceTemperatureKelvin: 265,
      atmosphereRegime: 'SUBSTANTIAL', atmosphereScenarioPressurePascal: 75000,
    });
    expect(freezing.presentationLiquidCoverage01).toBe(0);
    expect(freezing.surfaceStyle).not.toBe('OCEANIC');
  });

  it('Tutia-like: leaves a cratered airless body without atmospheric shell or polished rim', () => {
    const bare = buildSystemSceneMoonPresentationV1({
      ...moon, moonIdentity: 'D3F-BARE', atmosphereRegime: 'NONE',
      atmosphereScenarioPressurePascal: null, waterInventoryIndex01: 0.1,
      surfaceLiquidWaterPotentialIndex01: 0, waterRegime: 'NONE',
      geologyRegime: 'INERT', geologicalActivityIndex01: 0.03,
      tidalHeatingIndex01: 0.01, giantCompositionRegime: 'ROCK_RICH',
      inferredIceRichnessIndex01: 0.05,
    });
    const rendered = createSystemSceneMoonRenderableV1(bare);
    expect(rendered.root.children.some(child => child.name.includes('atmosphere'))).toBe(false);
    expect((rendered.surfaceMaterial as THREE.MeshPhysicalMaterial).clearcoat).toBe(0);
    expect(rendered.surfaceMaterial.metalness).toBe(0);
    for (const r of rendered.resources) r.dispose();
  });

  it('Yephae/Xenais-like: preserves a visible, composition-dependent shell only with resolved gas pressure', () => {
    const icy = { ...moon, estimatedSurfaceTemperatureKelvin: 105,
      waterRegime: 'ICE_AND_SUBSURFACE_OCEAN',
      surfaceLiquidWaterPotentialIndex01: 0.2,
      atmosphereRegime: 'SUBSTANTIAL' };
    const unresolved = buildSystemSceneMoonPresentationV1({
      ...icy, atmosphereScenarioPressurePascal: null,
    });
    const resolved = buildSystemSceneMoonPresentationV1({
      ...icy, atmosphereScenarioPressurePascal: 42000,
      atmosphereScenarioSpecies: [
        { gas: 'METHANE', moleFraction01: 0.6 },
        { gas: 'NITROGEN', moleFraction01: 0.4 },
      ],
    });
    expect(unresolved.presentationAtmospherePresent).toBe(false);
    expect(resolved.presentationAtmospherePresent).toBe(true);
    expect(resolved.presentationAtmosphereStrength01).toBeGreaterThan(0.6);
    expect(resolved.presentationLiquidCoverage01).toBe(0);
    const rendered = createSystemSceneMoonRenderableV1(resolved);
    expect(rendered.root.children.some(child => child.name.includes('atmosphere shell'))).toBe(true);
    for (const r of rendered.resources) r.dispose();
  });
});
