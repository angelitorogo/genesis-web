import {
  buildSystemSceneMoonPresentationV1,
  type SystemSceneMoonPresentationInputV1,
} from './system-scene-moon-presentation';

import {
  buildSystemSceneMoonTextureV1,
} from './system-scene-moon-texture';

describe(
  'SystemScene moon procedural textures point 25.10',
  () => {
    const oceanicInput: SystemSceneMoonPresentationInputV1 = {
      moonIdentity: 'MOON-TEXTURE-OCEAN',
      hostPlanetType: 'GAS_GIANT',
      radiusEarth: 0.35,
      massEarth: 0.035,
      meanDensityGramsPerCubicCentimeter: 3.2,
      surfaceGravityEarth: 0.22,
      atmosphereRetentionIndex01: 0.55,
      atmosphereRegime: 'SUBSTANTIAL',
      atmosphereScenarioPressurePascal: 40000,
      atmosphereScenarioSpecies: [{ gas: 'WATER_VAPOR', moleFraction01: 0.04 }, { gas: 'NITROGEN', moleFraction01: 0.96 }],
      waterInventoryIndex01: 0.72,
      inferredIceRichnessIndex01: 0.36,
      subsurfaceOceanPotentialIndex01: 0.74,
      surfaceLiquidWaterPotentialIndex01: 0.62,
      waterRegime: 'MIXED',
      estimatedSurfaceTemperatureKelvin: 284,
      geologicalActivityIndex01: 0.38,
      tidalHeatingIndex01: 0.26,
      geologyRegime: 'ACTIVE',
      overallHabitabilityIndex01: 0.61,
      isPotentiallyHabitable: true,
      giantHostSpecialization: true,
      giantCompositionRegime: 'MIXED_ROCK_ICE',
      isLargeGiantMoon: true,
      isTidallyActiveGiantMoon: false,
      isOceanBearingGiantMoonCandidate: true,
    };

    it(
      'should generate deterministic albedo/cloud textures with a longitude-safe seam',
      () => {
        const oceanic = buildSystemSceneMoonPresentationV1(oceanicInput);
        const first = buildSystemSceneMoonTextureV1(oceanic);
        const second = buildSystemSceneMoonTextureV1(oceanic);

        expect(first.width).toBe(192);
        expect(first.height).toBe(96);
        expect(first.reliefRgba).toEqual(second.reliefRgba);
        expect(first.albedoRgba).toEqual(second.albedoRgba);
        expect(first.cloudRgba).not.toBeNull();

        for (let y = 0; y < first.height; y += 1) {
          const left = (y * first.width) * 4;
          const right = (y * first.width + first.width - 1) * 4;
          expect(first.albedoRgba.slice(left, left + 4)).toEqual(
            first.albedoRgba.slice(right, right + 4),
          );
        }
      },
    );

    it(
      'should emit volcanic fissure data only for geologically extreme moons',
      () => {
        const volcanic = buildSystemSceneMoonPresentationV1({
          ...oceanicInput,
          moonIdentity: 'MOON-TEXTURE-VOLCANIC',
          waterRegime: 'NONE',
          waterInventoryIndex01: 0.02,
          surfaceLiquidWaterPotentialIndex01: 0,
          subsurfaceOceanPotentialIndex01: 0,
          inferredIceRichnessIndex01: 0.05,
          geologicalActivityIndex01: 0.95,
          tidalHeatingIndex01: 0.95,
          geologyRegime: 'EXTREME',
          atmosphereRetentionIndex01: 0.02,
          atmosphereRegime: 'NONE',
          // Do not accidentally inherit a resolved 40 kPa water-vapour
          // atmosphere from the oceanic parent fixture.
          atmosphereScenarioPressurePascal: null,
          atmosphereScenarioSpecies: [],
          giantCompositionRegime: 'ROCK_RICH',
          isOceanBearingGiantMoonCandidate: false,
          isPotentiallyHabitable: false,
          overallHabitabilityIndex01: 0,
        });

        const texture = buildSystemSceneMoonTextureV1(volcanic);
        expect(volcanic.surfaceStyle).toBe('VOLCANIC');
        expect(volcanic.presentationAtmospherePresent).toBe(false);
        expect(volcanic.presentationLiquidCoverage01).toBe(0);
        expect(texture.emissiveRgba).not.toBeNull();
        expect(texture.cloudRgba).toBeNull();
      },
    );
  },
);
