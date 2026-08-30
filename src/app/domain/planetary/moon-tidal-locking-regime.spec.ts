import {
  MoonTidalLockingRegime,
  moonTidalLockingRegimeForIndex01,
} from './moon-tidal-locking-regime';

describe(
  'MoonTidalLockingRegime point 21.4',
  () => {
    it(
      'should map unlocked, evolving and synchronized mature-system states',
      () => {
        expect(
          moonTidalLockingRegimeForIndex01(
            0,
          ),
        ).toBe(
          MoonTidalLockingRegime.UNLOCKED,
        );

        expect(
          moonTidalLockingRegimeForIndex01(
            0.20,
          ),
        ).toBe(
          MoonTidalLockingRegime.EVOLVING,
        );

        expect(
          moonTidalLockingRegimeForIndex01(
            0.50,
          ),
        ).toBe(
          MoonTidalLockingRegime.SYNCHRONIZED,
        );
      },
    );

    it(
      'should reject invalid unit indices',
      () => {
        for (
          const value
          of [
            -1,
            2,
            Number.POSITIVE_INFINITY,
          ]
        ) {
          expect(
            () =>
              moonTidalLockingRegimeForIndex01(
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
