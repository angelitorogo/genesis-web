import {
  SYSTEM_SCENE_MOON_DISPLAY_CYCLE_SECONDS_V2,
  systemSceneMoonDisplaySpinRadiansV2,
} from './system-scene-moon-spin-presentation';

describe(
  'SystemScene moon spin presentation point 25.11',
  () => {
    const timing = Object.freeze({
      epochSimulationDay: 0,
      playbackDaysPerRealSecond: 12,
    });

    const baseSpin = Object.freeze({
      source: 'MOON_21_4',
      rotationPeriodHours: 8,
      epochPhaseDegrees: 0,
      isSynchronized: false,
    });

    it(
      'should give fast and slow physical moons the same slow display cadence',
      () => {
        const elapsedRealSeconds = 30;
        const simulationDay =
          timing.epochSimulationDay +
          elapsedRealSeconds * timing.playbackDaysPerRealSecond;

        const fast = systemSceneMoonDisplaySpinRadiansV2(
          {
            ...baseSpin,
            rotationPeriodHours: 5,
          },
          simulationDay,
          timing,
        );
        const slow = systemSceneMoonDisplaySpinRadiansV2(
          {
            ...baseSpin,
            rotationPeriodHours: 800,
          },
          simulationDay,
          timing,
        );

        expect(fast).toBeCloseTo(slow, 12);
        expect(fast).toBeCloseTo(
          Math.PI * 2 *
            elapsedRealSeconds /
            SYSTEM_SCENE_MOON_DISPLAY_CYCLE_SECONDS_V2,
          12,
        );
      },
    );

    it(
      'should use the same inspection cadence for synchronized and unsynchronized moons',
      () => {
        const simulationDay = 120;

        const synchronized = systemSceneMoonDisplaySpinRadiansV2(
          {
            ...baseSpin,
            rotationPeriodHours: 72,
            isSynchronized: true,
          },
          simulationDay,
          timing,
        );
        const unsynchronized = systemSceneMoonDisplaySpinRadiansV2(
          {
            ...baseSpin,
            rotationPeriodHours: 72,
            isSynchronized: false,
          },
          simulationDay,
          timing,
        );

        expect(synchronized).toBeCloseTo(unsynchronized, 12);
      },
    );

    it(
      'should preserve the deterministic epoch phase and keep unavailable periods static',
      () => {
        const staticMoon = systemSceneMoonDisplaySpinRadiansV2(
          {
            ...baseSpin,
            rotationPeriodHours: null,
            epochPhaseDegrees: 90,
          },
          999,
          timing,
        );

        expect(staticMoon).toBeCloseTo(Math.PI / 2, 12);
      },
    );

    it(
      'should reject malformed inputs',
      () => {
        expect(() =>
          systemSceneMoonDisplaySpinRadiansV2(
            {
              ...baseSpin,
              rotationPeriodHours: 0,
            },
            0,
            timing,
          ),
        ).toThrow(RangeError);

        expect(() =>
          systemSceneMoonDisplaySpinRadiansV2(
            baseSpin,
            0,
            {
              ...timing,
              playbackDaysPerRealSecond: 0,
            },
          ),
        ).toThrow(RangeError);
      },
    );
  },
);
