import {
  SystemOrbitalMotionEngine,
  type SystemOrbitalMotionDefinition,
} from './system-orbital-motion-engine';

describe(
  'SystemOrbitalMotionEngine point 24.3',
  () => {

    it(
      'should derive position from absolute simulation time and close exactly after one period',
      () => {

        const motion =
          circularMotion();

        const start =
          SystemOrbitalMotionEngine
            .positionAtSimulationDay(
              motion,
              0,
            );

        const quarter =
          SystemOrbitalMotionEngine
            .positionAtSimulationDay(
              motion,
              25,
            );

        const full =
          SystemOrbitalMotionEngine
            .positionAtSimulationDay(
              motion,
              100,
            );

        expect(
          start.xAu,
        ).toBeCloseTo(
          2,
          12,
        );

        expect(
          quarter.xAu,
        ).toBeCloseTo(
          0,
          12,
        );

        expect(
          Math.abs(
            quarter.zAu,
          ),
        ).toBeCloseTo(
          2,
          12,
        );

        expect(
          full.xAu,
        ).toBeCloseTo(
          start.xAu,
          12,
        );

        expect(
          full.zAu,
        ).toBeCloseTo(
          start.zAu,
          12,
        );
      },
    );

    it(
      'should obey eccentric Keplerian timing rather than advancing uniformly around the ellipse',
      () => {

        const motion:
          SystemOrbitalMotionDefinition =
          {
            ...circularMotion(),
            eccentricity:
              0.5,
            epochMeanAnomalyDegrees:
              0,
          };

        const periastron =
          SystemOrbitalMotionEngine
            .positionAtSimulationDay(
              motion,
              0,
            );

        const apastron =
          SystemOrbitalMotionEngine
            .positionAtSimulationDay(
              motion,
              50,
            );

        expect(
          periastron.xAu,
        ).toBeCloseTo(
          1,
          12,
        );

        expect(
          apastron.xAu,
        ).toBeCloseTo(
          -3,
          12,
        );
      },
    );


    it(
      'should preserve full node-inclination-periapsis orientation for highly inclined bound minor-body orbits',
      () => {
        const motion:
          SystemOrbitalMotionDefinition =
          {
            ...circularMotion(),
            longitudeAscendingNodeDegrees:
              90,
            inclinationDegrees:
              90,
            argumentOfPeriapsisDegrees:
              90,
          };

        const start =
          SystemOrbitalMotionEngine
            .positionAtSimulationDay(
              motion,
              0,
            );

        expect(
          start.xAu,
        ).toBeCloseTo(
          0,
          12,
        );

        expect(
          start.yAu,
        ).toBeCloseTo(
          -2,
          12,
        );

        expect(
          start.zAu,
        ).toBeCloseTo(
          0,
          12,
        );
      },
    );


    it(
      'should sample closed orbit guides by orbital geometry rather than equal-time cadence for highly eccentric minor bodies',
      () => {
        const motion:
          SystemOrbitalMotionDefinition =
          {
            ...circularMotion(),
            semiMajorAxisAu:
              6,
            eccentricity:
              0.85,
            longitudeAscendingNodeDegrees:
              40,
            inclinationDegrees:
              70,
            argumentOfPeriapsisDegrees:
              130,
          };

        const samples =
          SystemOrbitalMotionEngine
            .sampleClosedOrbitPath(
              motion,
              32,
            );

        expect(
          samples,
        ).toHaveLength(
          32,
        );

        const start =
          samples[0]!;

        const end =
          samples[
            samples.length - 1
          ]!;

        const closureDistance =
          Math.hypot(
            start.xAu -
              end.xAu,
            start.yAu -
              end.yAu,
            start.zAu -
              end.zAu,
          );

        expect(
          closureDistance,
        ).toBeLessThan(
          1.5,
        );

        const periapsisDistance =
          Math.hypot(
            start.xAu,
            start.yAu,
            start.zAu,
          );

        expect(
          periapsisDistance,
        ).toBeCloseTo(
          motion.semiMajorAxisAu *
            (1 -
              motion.eccentricity),
          12,
        );
      },
    );

    it(
      'should reject invalid orbit-guide sample counts',
      () => {
        expect(
          () =>
            SystemOrbitalMotionEngine
              .sampleClosedOrbitPath(
                circularMotion(),
                3,
              ),
        ).toThrowError(
          /sampleCount/,
        );
      },
    );

    it(
      'should return the same position for the same simulation instant regardless of frame history',
      () => {

        const motion:
          SystemOrbitalMotionDefinition =
          {
            ...circularMotion(),
            eccentricity:
              0.37,
            rotationDegrees:
              73,
            inclinationDegrees:
              11,
            epochMeanAnomalyDegrees:
              219,
          };

        const fromThirtyFps =
          SystemOrbitalMotionEngine
            .positionAtSimulationDay(
              motion,
              42.75,
            );

        for (
          let frame = 0;
          frame <
            144;
          frame += 1
        ) {
          SystemOrbitalMotionEngine
            .positionAtSimulationDay(
              motion,
              frame /
                144 *
                42.75,
            );
        }

        const fromOneFortyFourFps =
          SystemOrbitalMotionEngine
            .positionAtSimulationDay(
              motion,
              42.75,
            );

        expect(
          fromOneFortyFourFps,
        ).toEqual(
          fromThirtyFps,
        );
      },
    );
  },
);

function circularMotion():
  SystemOrbitalMotionDefinition {

  return {
    id:
      'planet-1-motion',
    semiMajorAxisAu:
      2,
    eccentricity:
      0,
    periodDays:
      100,
    rotationDegrees:
      0,
    inclinationDegrees:
      0,
    epochMeanAnomalyDegrees:
      0,
  };
}
