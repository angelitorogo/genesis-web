import {
  StellarRelativeOrbit,
} from './stellar-relative-orbit';

describe(
  'StellarRelativeOrbit point 16.4',
  () => {
    it(
      'should expose deterministic apsides and period days from simplified Keplerian elements',
      () => {
        const orbit =
          new StellarRelativeOrbit(
            2,
            0.25,
            3,
          );

        expect(orbit.periastronAu).toBe(1.5);
        expect(orbit.apoastronAu).toBe(2.5);
        expect(orbit.periodDays).toBe(1095.75);
      },
    );

    it(
      'should reject invalid semi-major axis, eccentricity and period values',
      () => {
        expect(
          () =>
            new StellarRelativeOrbit(
              0,
              0,
              1,
            ),
        ).toThrow(RangeError);

        expect(
          () =>
            new StellarRelativeOrbit(
              1,
              -0.01,
              1,
            ),
        ).toThrow(RangeError);

        expect(
          () =>
            new StellarRelativeOrbit(
              1,
              1,
              1,
            ),
        ).toThrow(RangeError);

        expect(
          () =>
            new StellarRelativeOrbit(
              1,
              0,
              Number.NaN,
            ),
        ).toThrow(RangeError);
      },
    );
  },
);
