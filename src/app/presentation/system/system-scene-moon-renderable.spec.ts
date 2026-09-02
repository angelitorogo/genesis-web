import * as THREE from 'three';

import {
  buildSystemSceneMoonPresentationV1,
} from './system-scene-moon-presentation';

import {
  createSystemSceneMoonRenderableV1,
} from './system-scene-moon-renderable';

describe(
  'SystemScene moon renderable point 25.10',
  () => {
    it(
      'should render a small moon as a rounded spheroid with subtle irregular relief and no false atmosphere',
      () => {
        const presentation = buildSystemSceneMoonPresentationV1({
          moonIdentity: 'MOON-RENDER-SMALL',
          hostPlanetType: 'ROCKY',
          radiusEarth: 0.028,
          massEarth: 0.0002,
          meanDensityGramsPerCubicCentimeter: 3.4,
          surfaceGravityEarth: 0.018,
          atmosphereRetentionIndex01: 0.01,
          atmosphereRegime: 'NONE',
          waterInventoryIndex01: 0.02,
          inferredIceRichnessIndex01: 0.04,
          subsurfaceOceanPotentialIndex01: 0,
          surfaceLiquidWaterPotentialIndex01: 0,
          waterRegime: 'NONE',
          estimatedSurfaceTemperatureKelvin: 245,
          geologicalActivityIndex01: 0.02,
          tidalHeatingIndex01: 0,
          geologyRegime: 'INERT',
          overallHabitabilityIndex01: 0,
          isPotentiallyHabitable: false,
          giantHostSpecialization: false,
          giantCompositionRegime: 'NOT_APPLICABLE',
          isLargeGiantMoon: false,
          isTidallyActiveGiantMoon: false,
          isOceanBearingGiantMoonCandidate: false,
        });

        const renderable = createSystemSceneMoonRenderableV1(presentation);
        expect(renderable.root.children).toHaveLength(1);
        const surface = renderable.root.children[0] as THREE.Mesh;
        expect(surface.geometry).toBeInstanceOf(THREE.SphereGeometry);

        for (const resource of renderable.resources) {
          resource.dispose();
        }
      },
    );

    it(
      'should render a major atmospheric moon with surface, clouds and atmosphere layers',
      () => {
        const presentation = buildSystemSceneMoonPresentationV1({
          moonIdentity: 'MOON-RENDER-MAJOR',
          hostPlanetType: 'GAS_GIANT',
          radiusEarth: 0.44,
          massEarth: 0.048,
          meanDensityGramsPerCubicCentimeter: 3.1,
          surfaceGravityEarth: 0.28,
          atmosphereRetentionIndex01: 0.60,
          atmosphereRegime: 'SUBSTANTIAL',
          waterInventoryIndex01: 0.76,
          inferredIceRichnessIndex01: 0.40,
          subsurfaceOceanPotentialIndex01: 0.80,
          surfaceLiquidWaterPotentialIndex01: 0.64,
          waterRegime: 'MIXED',
          estimatedSurfaceTemperatureKelvin: 286,
          geologicalActivityIndex01: 0.44,
          tidalHeatingIndex01: 0.32,
          geologyRegime: 'ACTIVE',
          overallHabitabilityIndex01: 0.66,
          isPotentiallyHabitable: true,
          giantHostSpecialization: true,
          giantCompositionRegime: 'MIXED_ROCK_ICE',
          isLargeGiantMoon: true,
          isTidallyActiveGiantMoon: false,
          isOceanBearingGiantMoonCandidate: true,
        });

        const renderable = createSystemSceneMoonRenderableV1(presentation);
        expect(renderable.root.children.length).toBe(3);
        const surface = renderable.root.children[0] as THREE.Mesh;
        expect(surface.geometry).toBeInstanceOf(THREE.SphereGeometry);
        expect(
          renderable.root.children.some(
            child => child.name.includes('clouds'),
          ),
        ).toBe(true);
        expect(
          renderable.root.children.some(
            child => child.name.includes('atmosphere shell'),
          ),
        ).toBe(true);

        for (const resource of renderable.resources) {
          resource.dispose();
        }
      },
    );
  },
);
