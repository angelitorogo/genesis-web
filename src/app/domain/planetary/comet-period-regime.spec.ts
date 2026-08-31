import {
  COMET_SHORT_PERIOD_LIMIT_YEARS,
  CometPeriodRegime,
  cometPeriodRegimeV1,
} from './comet-period-regime';

describe(
  'CometPeriodRegime point 22.6 V1',
  () => {
    it(
      'should use the exact 200-Julian-year short/long-period boundary',
      () => {
        expect(
          cometPeriodRegimeV1(
            COMET_SHORT_PERIOD_LIMIT_YEARS -
              1e-9,
          ),
        ).toBe(
          CometPeriodRegime
            .SHORT_PERIOD,
        );

        expect(
          cometPeriodRegimeV1(
            COMET_SHORT_PERIOD_LIMIT_YEARS,
          ),
        ).toBe(
          CometPeriodRegime
            .LONG_PERIOD,
        );
      },
    );

    it(
      'should reject non-positive or non-finite periods',
      () => {
        for (
          const value
          of [
            0,
            -1,
            Number.NaN,
            Number.POSITIVE_INFINITY,
          ]
        ) {
          expect(
            () =>
              cometPeriodRegimeV1(
                value,
              ),
          ).toThrow(
            RangeError,
          );
        }
      },
    );
  },
);
