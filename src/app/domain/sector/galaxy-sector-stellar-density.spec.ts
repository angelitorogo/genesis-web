import {
  GalaxyRegion,
} from './galaxy-region';

import {
  GalaxySectorStellarDensity,
} from './galaxy-sector-stellar-density';

describe(
  'GalaxySectorStellarDensity',
  () => {
    it(
      'should preserve a valid density snapshot',
      () => {
        const density =
          new GalaxySectorStellarDensity(
            GalaxyRegion.INNER,
            0.25,
            0.75,
          );

        expect(
          density.region,
        ).toBe(
          GalaxyRegion.INNER,
        );

        expect(
          density.normalizedRadius,
        ).toBe(
          0.25,
        );

        expect(
          density.relativeDensity,
        ).toBe(
          0.75,
        );
      },
    );

    it(
      'should accept zero normalized radius',
      () => {
        const density =
          new GalaxySectorStellarDensity(
            GalaxyRegion.CENTRAL,
            0,
            1,
          );

        expect(
          density.normalizedRadius,
        ).toBe(
          0,
        );
      },
    );

    it(
      'should accept both relative-density boundaries',
      () => {
        expect(
          new GalaxySectorStellarDensity(
            GalaxyRegion.OUTER,
            1,
            0,
          ).relativeDensity,
        ).toBe(
          0,
        );

        expect(
          new GalaxySectorStellarDensity(
            GalaxyRegion.CENTRAL,
            0,
            1,
          ).relativeDensity,
        ).toBe(
          1,
        );
      },
    );

    it(
      'should reject invalid normalized radius values',
      () => {
        expect(
          () =>
            new GalaxySectorStellarDensity(
              GalaxyRegion.CENTRAL,
              -0.01,
              0.5,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new GalaxySectorStellarDensity(
              GalaxyRegion.CENTRAL,
              Number.NaN,
              0.5,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new GalaxySectorStellarDensity(
              GalaxyRegion.CENTRAL,
              Number.POSITIVE_INFINITY,
              0.5,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject relative densities outside the normalized range',
      () => {
        expect(
          () =>
            new GalaxySectorStellarDensity(
              GalaxyRegion.CENTRAL,
              0,
              -0.01,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new GalaxySectorStellarDensity(
              GalaxyRegion.CENTRAL,
              0,
              1.01,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new GalaxySectorStellarDensity(
              GalaxyRegion.CENTRAL,
              0,
              Number.NaN,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);