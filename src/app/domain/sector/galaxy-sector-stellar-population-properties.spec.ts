import {
  GalaxySectorStellarPopulationProperties,
} from './galaxy-sector-stellar-population-properties';

describe(
  'GalaxySectorStellarPopulationProperties',
  () => {
    it(
      'should preserve valid stellar population properties',
      () => {
        const properties =
          new GalaxySectorStellarPopulationProperties(
            1.25,
            9.5,
          );

        expect(
          properties
            .characteristicMetallicitySolarRatio,
        ).toBe(
          1.25,
        );

        expect(
          properties
            .characteristicStellarAgeBillionYears,
        ).toBe(
          9.5,
        );
      },
    );

    it(
      'should accept zero metallicity',
      () => {
        const properties =
          new GalaxySectorStellarPopulationProperties(
            0,
            5,
          );

        expect(
          properties
            .characteristicMetallicitySolarRatio,
        ).toBe(
          0,
        );
      },
    );

    it(
      'should reject invalid metallicity values',
      () => {
        expect(
          () =>
            new GalaxySectorStellarPopulationProperties(
              -0.01,
              5,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new GalaxySectorStellarPopulationProperties(
              Number.NaN,
              5,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new GalaxySectorStellarPopulationProperties(
              Number.POSITIVE_INFINITY,
              5,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject invalid characteristic stellar ages',
      () => {
        expect(
          () =>
            new GalaxySectorStellarPopulationProperties(
              1,
              0,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new GalaxySectorStellarPopulationProperties(
              1,
              -0.01,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new GalaxySectorStellarPopulationProperties(
              1,
              Number.NaN,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new GalaxySectorStellarPopulationProperties(
              1,
              Number.POSITIVE_INFINITY,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);