import * as THREE from 'three';
import {
  buildSystemSceneMoonPresentationV1,
} from './system-scene-moon-presentation';
import {
  buildSystemSceneMoonTextureV1,
} from './system-scene-moon-texture';
import {
  createSystemSceneMoonRenderableV1,
} from './system-scene-moon-renderable';

const moon = buildSystemSceneMoonPresentationV1({
  moonIdentity: 'VIS3D2e-MOON',
  hostPlanetType: 'TERRESTRIAL',
  radiusEarth: 0.12,
  massEarth: 0.006,
  meanDensityGramsPerCubicCentimeter: 3.2,
  surfaceGravityEarth: 0.07,
  atmosphereRetentionIndex01: 0.0,
  atmosphereRegime: 'NONE',
  atmosphereScenarioPressurePascal: null,
  atmosphereScenarioSpecies: [],
  waterInventoryIndex01: 0.03,
  inferredIceRichnessIndex01: 0.10,
  subsurfaceOceanPotentialIndex01: 0,
  surfaceLiquidWaterPotentialIndex01: 0,
  waterRegime: 'NONE',
  estimatedSurfaceTemperatureKelvin: 195,
  geologicalActivityIndex01: 0.03,
  tidalHeatingIndex01: 0,
  geologyRegime: 'INERT',
  overallHabitabilityIndex01: 0,
  isPotentiallyHabitable: false,
  giantHostSpecialization: false,
  giantCompositionRegime: 'ROCK_RICH',
  isLargeGiantMoon: false,
  isTidallyActiveGiantMoon: false,
  isOceanBearingGiantMoonCandidate: false,
});

describe('VIS3D.2e — las lunas en ficha no alteran SystemScene', () => {
  it('conserva resolución base para el renderer normal', () => {
    const normal = buildSystemSceneMoonTextureV1(moon);
    expect(normal.width).toBeGreaterThanOrEqual(128);
    expect(normal.width).toBeLessThanOrEqual(192);
    expect(normal.height).toBe(normal.width / 2);
  });

  it('genera 1024×512 en ficha y mantiene los mapas originales y recursos liberables', () => {
    const high = createSystemSceneMoonRenderableV1(moon, null, null, { width: 1024, height: 512 });
    try {
      const map = high.surfaceMaterial.map as THREE.DataTexture;
      const bump = high.surfaceMaterial.bumpMap as THREE.DataTexture;
      expect(map.image.width).toBe(1024);
      expect(map.image.height).toBe(512);
      expect(bump.image.width).toBe(1024);
      expect(bump.image.height).toBe(512);
      expect(high.surfaceMaterial.bumpMap).not.toBeNull();
    } finally {
      high.resources.forEach(resource => resource.dispose());
    }
  }, 15000);

  it('rechaza dimensiones inválidas en la API optativa', () => {
    expect(() => buildSystemSceneMoonTextureV1(moon, { width: -1, height: 512 })).toThrow(RangeError);
  });
});
