import {
  SystemSimulationClock,
  systemSimulationPlaybackDaysPerSecond,
} from './system-simulation-clock';

describe(
  'SystemSimulationClock point 24.3',
  () => {

    it(
      'should derive simulation time from absolute real timestamps rather than accumulated frame deltas',
      () => {

        const clock =
          new SystemSimulationClock(
            12,
            5,
          );

        expect(
          clock.read(
            1_000,
          ).simulationDay,
        ).toBe(
          5,
        );

        clock.read(
          1_016,
        );
        clock.read(
          1_033,
        );

        expect(
          clock.read(
            3_500,
          ).simulationDay,
        ).toBeCloseTo(
          35,
          12,
        );
      },
    );

    it(
      'should choose a visible system-local playback rate from the shortest frozen period and keep it bounded',
      () => {

        expect(
          systemSimulationPlaybackDaysPerSecond([
            180,
            365.25,
            4_000,
          ]),
        ).toBe(
          10,
        );

        expect(
          systemSimulationPlaybackDaysPerSecond([
            0.01,
          ]),
        ).toBe(
          0.05,
        );

        expect(
          systemSimulationPlaybackDaysPerSecond([
            1_000_000,
          ]),
        ).toBe(
          3_650,
        );

        expect(
          systemSimulationPlaybackDaysPerSecond([]),
        ).toBe(
          1,
        );
      },
    );
  },
);
