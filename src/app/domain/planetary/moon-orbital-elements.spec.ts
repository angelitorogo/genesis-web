import {
  MoonOrbitalElements,
} from './moon-orbital-elements';

describe(
  'MoonOrbitalElements point 21.3',
  () => {
    it(
      'should preserve a stable planetocentric Keplerian baseline outside Roche and inside half-Hill',
      () => {
        const orbit =
          new MoonOrbitalElements(
            1,
            1,
            60.3,
            384_400,
            0.055,
            5.1,
            27.3,
            2.9,
            230,
          );

        expect(
          orbit.semiMajorAxisPlanetRadii,
        ).toBeGreaterThan(
          orbit.rocheLimitPlanetRadii,
        );

        expect(
          orbit.semiMajorAxisPlanetRadii,
        ).toBeLessThan(
          orbit.sourceHillSphereRadiusPlanetRadii *
            0.5,
        );

        expect(
          'tidallyLocked' in
            orbit,
        ).toBe(false);
      },
    );

    it(
      'should reject invalid orbital ranges, Roche crossings and half-Hill crossings',
      () => {
        expect(
          () =>
            new MoonOrbitalElements(
              1,
              1,
              2,
              20_000,
              0,
              0,
              1,
              2.1,
              100,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new MoonOrbitalElements(
              1,
              1,
              51,
              100_000,
              0,
              0,
              10,
              2,
              100,
            ),
        ).toThrow(
          RangeError,
        );

        for (
          const eccentricity
          of [
            -0.1,
            1,
            Number.NaN,
          ]
        ) {
          expect(
            () =>
              new MoonOrbitalElements(
                1,
                1,
                10,
                100_000,
                eccentricity,
                0,
                5,
                2,
                100,
              ),
          ).toThrow(
            RangeError,
          );
        }
      },
    );
  },
);
