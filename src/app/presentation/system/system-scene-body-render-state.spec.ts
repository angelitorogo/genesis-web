import {
  systemSceneBodyAxialTiltRadians,
  systemSceneBodyDisplaySpinRadians,
  systemSceneBodySpinRadians,
  systemSceneSphereSegments,
  systemSceneStellarLightIntensity,
  type SystemSceneBodySpinSnapshot,
} from './system-scene-body-render-state';

describe(
  'SystemScene body render state point 25.1',
  () => {
    it(
      'should freeze an explicit non-LOD sphere baseline for stars, planets and moons',
      () => {

        const star =
          systemSceneSphereSegments(
            'star',
          );
        const planet =
          systemSceneSphereSegments(
            'planet',
          );
        const moon =
          systemSceneSphereSegments(
            'moon',
          );

        expect(star).toEqual({
          widthSegments: 48,
          heightSegments: 32,
        });
        expect(planet).toEqual({
          widthSegments: 40,
          heightSegments: 28,
        });
        expect(moon).toEqual({
          widthSegments: 28,
          heightSegments: 20,
        });

        expect(
          Object.isFrozen(star) &&
          Object.isFrozen(planet) &&
          Object.isFrozen(moon),
        ).toBe(true);
      },
    );

    it(
      'should project planet spin from absolute simulation time independently from frame cadence',
      () => {

        const spin =
          Object.freeze({
            source:
              'PLANET_19_3' as const,
            rotationPeriodHours:
              24,
            axialTiltDegrees:
              23.44,
            isRetrograde:
              false,
            isSynchronized:
              false,
            epochPhaseDegrees:
              15,
          } satisfies SystemSceneBodySpinSnapshot);

        expect(
          systemSceneBodySpinRadians(
            spin,
            0,
          ),
        ).toBeCloseTo(
          15 *
          Math.PI /
          180,
          12,
        );

        expect(
          systemSceneBodySpinRadians(
            spin,
            0.25,
          ),
        ).toBeCloseTo(
          105 *
          Math.PI /
          180,
          12,
        );

        expect(
          systemSceneBodySpinRadians(
            spin,
            1,
          ),
        ).toBeCloseTo(
          15 *
          Math.PI /
          180,
          12,
        );

        expect(
          systemSceneBodyAxialTiltRadians(
            spin,
          ),
        ).toBeCloseTo(
          23.44 *
          Math.PI /
          180,
          12,
        );
      },
    );

    it(
      'should preserve a fixed presentation phase when authoritative spin is unavailable',
      () => {

        const spin =
          Object.freeze({
            source:
              'UNAVAILABLE' as const,
            rotationPeriodHours:
              null,
            axialTiltDegrees:
              null,
            isRetrograde:
              null,
            isSynchronized:
              false,
            epochPhaseDegrees:
              270,
          } satisfies SystemSceneBodySpinSnapshot);

        expect(
          systemSceneBodySpinRadians(
            spin,
            0,
          ),
        ).toBeCloseTo(
          1.5 *
          Math.PI,
          12,
        );

        expect(
          systemSceneBodySpinRadians(
            spin,
            1_000,
          ),
        ).toBeCloseTo(
          1.5 *
          Math.PI,
          12,
        );
      },
    );


    it(
      'should compress accelerated unsynchronized planet spin for texture readability without altering synchronized bodies',
      () => {

        const planetSpin =
          Object.freeze({
            source:
              'PLANET_19_3' as const,
            rotationPeriodHours:
              24,
            axialTiltDegrees:
              23.44,
            isRetrograde:
              false,
            isSynchronized:
              false,
            epochPhaseDegrees:
              15,
          } satisfies SystemSceneBodySpinSnapshot);

        const synchronizedSpin =
          Object.freeze({
            ...planetSpin,
            isSynchronized:
              true,
          } satisfies SystemSceneBodySpinSnapshot);

        const timing =
          Object.freeze({
            epochSimulationDay:
              0,
            playbackDaysPerRealSecond:
              10,
          });

        const afterOneRealSecond =
          systemSceneBodyDisplaySpinRadians(
            planetSpin,
            10,
            timing,
          );

        const visibleAdvance =
          (
            afterOneRealSecond -
            15 *
              Math.PI /
              180 +
            Math.PI *
              2
          ) %
          (
            Math.PI *
            2
          );

        expect(
          visibleAdvance,
        ).toBeGreaterThan(0);
        expect(
          visibleAdvance,
        ).toBeLessThanOrEqual(
          Math.PI *
          2 /
          30 +
          1e-12,
        );

        expect(
          systemSceneBodyDisplaySpinRadians(
            synchronizedSpin,
            10.025,
            timing,
          ),
        ).toBeCloseTo(
          systemSceneBodySpinRadians(
            synchronizedSpin,
            10.025,
          ),
          12,
        );
      },
    );

    it(
      'should map stellar luminosity monotonically into a bounded presentation light',
      () => {

        const dim =
          systemSceneStellarLightIntensity(
            0.1,
          );
        const solar =
          systemSceneStellarLightIntensity(
            1,
          );
        const bright =
          systemSceneStellarLightIntensity(
            100,
          );

        expect(solar).toBeGreaterThan(dim);
        expect(bright).toBeGreaterThan(solar);
        expect(dim).toBeGreaterThanOrEqual(9);
        expect(bright).toBeLessThanOrEqual(32);

        expect(
          () =>
            systemSceneStellarLightIntensity(
              0,
            ),
        ).toThrow(RangeError);
      },
    );
  },
);
