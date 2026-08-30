import {
  MoonGeologyRegime,
  moonGeologyRegimeV1,
} from './moon-geology-regime';

describe(
  'MoonGeologyRegime point 21.5',
  () => {
    it(
      'should distinguish inert, internally active and tidally driven moons',
      () => {
        expect(
          moonGeologyRegimeV1(0.05, 0),
        ).toBe(
          MoonGeologyRegime.INERT,
        );
        expect(
          moonGeologyRegimeV1(0.20, 0.10),
        ).toBe(
          MoonGeologyRegime.LOW_ACTIVITY,
        );
        expect(
          moonGeologyRegimeV1(0.40, 0.20),
        ).toBe(
          MoonGeologyRegime.ACTIVE,
        );
        expect(
          moonGeologyRegimeV1(0.60, 0.60),
        ).toBe(
          MoonGeologyRegime.TIDALLY_ACTIVE,
        );
        expect(
          moonGeologyRegimeV1(0.90, 0.95),
        ).toBe(
          MoonGeologyRegime.EXTREME,
        );
      },
    );

    it(
      'should reject invalid activity inputs',
      () => {
        expect(
          () =>
            moonGeologyRegimeV1(
              -0.1,
              0.5,
            ),
        ).toThrow(
          RangeError,
        );
        expect(
          () =>
            moonGeologyRegimeV1(
              0.5,
              Number.NaN,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
