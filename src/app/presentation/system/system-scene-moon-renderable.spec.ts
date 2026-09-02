import * as THREE from 'three';

import {
  buildSystemSceneMoonPresentationV1,
} from './system-scene-moon-presentation';

import {
  createSystemSceneMoonRenderableV1,
  type SystemSceneMoonTextureResourceV1,
} from './system-scene-moon-renderable';

import {
  SystemSceneBoundedResourceCacheV1,
} from './system-scene-resource-cache';

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

    it(
      'should reuse bounded cached moon textures across repeated materialization of the same frozen moon',
      () => {
        const presentation = buildSystemSceneMoonPresentationV1({
          moonIdentity: 'MOON-CACHE-25-11',
          hostPlanetType: 'ICE_GIANT',
          radiusEarth: 0.26,
          massEarth: 0.02,
          meanDensityGramsPerCubicCentimeter: 2.4,
          surfaceGravityEarth: 0.19,
          atmosphereRetentionIndex01: 0.18,
          atmosphereRegime: 'THIN',
          waterInventoryIndex01: 0.62,
          inferredIceRichnessIndex01: 0.78,
          subsurfaceOceanPotentialIndex01: 0.74,
          surfaceLiquidWaterPotentialIndex01: 0.06,
          waterRegime: 'ICE_AND_SUBSURFACE_OCEAN',
          estimatedSurfaceTemperatureKelvin: 198,
          geologicalActivityIndex01: 0.26,
          tidalHeatingIndex01: 0.34,
          geologyRegime: 'ACTIVE',
          overallHabitabilityIndex01: 0.22,
          isPotentiallyHabitable: false,
          giantHostSpecialization: true,
          giantCompositionRegime: 'ICE_RICH',
          isLargeGiantMoon: true,
          isTidallyActiveGiantMoon: false,
          isOceanBearingGiantMoonCandidate: true,
        });
        const cache = new SystemSceneBoundedResourceCacheV1<SystemSceneMoonTextureResourceV1>(4, 512 * 1024);
        const first = createSystemSceneMoonRenderableV1(presentation, cache);
        const second = createSystemSceneMoonRenderableV1(presentation, cache);

        expect(cache.stats().cachedEntryCount).toBe(1);
        expect(cache.stats().leasedEntryCount).toBe(1);

        for (const resource of first.resources) {
          resource.dispose();
        }
        for (const resource of second.resources) {
          resource.dispose();
        }
        expect(cache.stats().leasedEntryCount).toBe(0);
        cache.dispose();
      },
    );

    it(
      'should accept a shared unit sphere for regular moons so runtime LOD can swap pooled geometry without per-moon allocation',
      () => {
        const presentation = buildSystemSceneMoonPresentationV1({
          moonIdentity: 'MOON-LOD-SHARED-25-11',
          hostPlanetType: 'GAS_GIANT',
          radiusEarth: 0.22,
          massEarth: 0.018,
          meanDensityGramsPerCubicCentimeter: 2.8,
          surfaceGravityEarth: 0.17,
          atmosphereRetentionIndex01: 0.08,
          atmosphereRegime: 'TRACE',
          waterInventoryIndex01: 0.22,
          inferredIceRichnessIndex01: 0.28,
          subsurfaceOceanPotentialIndex01: 0.12,
          surfaceLiquidWaterPotentialIndex01: 0,
          waterRegime: 'NONE',
          estimatedSurfaceTemperatureKelvin: 240,
          geologicalActivityIndex01: 0.12,
          tidalHeatingIndex01: 0.09,
          geologyRegime: 'LOW_ACTIVITY',
          overallHabitabilityIndex01: 0,
          isPotentiallyHabitable: false,
          giantHostSpecialization: true,
          giantCompositionRegime: 'ROCK_RICH',
          isLargeGiantMoon: true,
          isTidallyActiveGiantMoon: false,
          isOceanBearingGiantMoonCandidate: false,
        });
        const sharedGeometry = new THREE.SphereGeometry(1, 20, 14);
        const renderable = createSystemSceneMoonRenderableV1(
          presentation,
          null,
          sharedGeometry,
        );

        expect(renderable.surfaceUsesSharedUnitGeometry).toBe(true);
        expect(renderable.surfaceMesh.geometry).toBe(sharedGeometry);

        for (const resource of renderable.resources) {
          resource.dispose();
        }
        sharedGeometry.dispose();
      },
    );
  },
);
