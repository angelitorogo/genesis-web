import {
  CometActivityRegime,
} from './comet-activity-regime';

import {
  CometActivityState,
} from './comet-activity-state';

describe(
  'CometActivityState point 22.6 V1',
  () => {
    it(
      'should accept one coherent distance-specific activity projection',
      () => {
        const state =
          new CometActivityState(
            1,
            1,
            1,
            1,
            1,
            270,
            1,
            1,
            0.7,
            CometActivityRegime
              .EXTREME,
            true,
            true,
            true,
          );

        expect(
          state.activityRegime,
        ).toBe(
          CometActivityRegime
            .EXTREME,
        );
      },
    );

    it(
      'should reject regime or coma/tail flags inconsistent with the activity index',
      () => {
        expect(
          () =>
            new CometActivityState(
              1,
              10,
              1,
              10,
              0.01,
              90,
              0,
              0.1,
              0.02,
              CometActivityRegime
                .WEAK,
              false,
              false,
              false,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new CometActivityState(
              1,
              10,
              1,
              10,
              0.01,
              90,
              0,
              0.1,
              0.02,
              CometActivityRegime
                .DORMANT,
              true,
              false,
              false,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
