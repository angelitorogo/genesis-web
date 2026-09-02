import {
  buildSystemSceneMoonPresentationV1,
} from './system-scene-moon-presentation';

import {
  limitSystemSceneMoonPresentationToHostV1,
  SYSTEM_SCENE_MOON_MAX_HOST_RADIUS_RATIO_V1,
} from './system-scene-moon-host-size-limit';

describe(
  'SystemScene moon host size limit point 25.11',
  () => {
    const moon =
      buildSystemSceneMoonPresentationV1({
        moonIdentity: 'MOON-HOST-LIMIT-1',
        hostPlanetType: 'ROCKY',
        radiusEarth: 0.42,
        massEarth: 0.04,
        meanDensityGramsPerCubicCentimeter: 3.1,
        surfaceGravityEarth: 0.25,
        atmosphereRetentionIndex01: 0.30,
        atmosphereRegime: 'THIN',
        waterInventoryIndex01: 0.30,
        inferredIceRichnessIndex01: 0.24,
        subsurfaceOceanPotentialIndex01: 0.22,
        surfaceLiquidWaterPotentialIndex01: 0.10,
        waterRegime: 'SURFACE_ICE',
        estimatedSurfaceTemperatureKelvin: 250,
        geologicalActivityIndex01: 0.22,
        tidalHeatingIndex01: 0.18,
        geologyRegime: 'LOW_ACTIVITY',
        overallHabitabilityIndex01: 0.12,
        isPotentiallyHabitable: false,
        giantHostSpecialization: false,
        giantCompositionRegime: 'NOT_APPLICABLE',
        isLargeGiantMoon: false,
        isTidallyActiveGiantMoon: false,
        isOceanBearingGiantMoonCandidate: false,
      });

    it(
      'should cap a visually oversized moon to exactly forty percent of its host radius',
      () => {
        const hostRadiusScene =
          0.050;

        const limited =
          limitSystemSceneMoonPresentationToHostV1(
            moon,
            hostRadiusScene,
          );

        expect(
          limited.presentationRadiusScene,
        ).toBeCloseTo(
          hostRadiusScene *
            SYSTEM_SCENE_MOON_MAX_HOST_RADIUS_RATIO_V1,
          12,
        );
        expect(
          Object.isFrozen(
            limited,
          ),
        ).toBe(true);
        expect(
          limited.sourceRadiusEarth,
        ).toBe(
          moon.sourceRadiusEarth,
        );
      },
    );

    it(
      'should preserve an already smaller frozen moon presentation by identity',
      () => {
        const hostRadiusScene =
          moon.presentationRadiusScene /
          0.25;

        expect(
          limitSystemSceneMoonPresentationToHostV1(
            moon,
            hostRadiusScene,
          ),
        ).toBe(
          moon,
        );
      },
    );

    it(
      'should reject an invalid host presentation radius',
      () => {
        expect(
          () =>
            limitSystemSceneMoonPresentationToHostV1(
              moon,
              0,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
