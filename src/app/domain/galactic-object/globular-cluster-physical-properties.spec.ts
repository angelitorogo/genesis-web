import {
  GlobularClusterPhysicalProperties,
} from './globular-cluster-physical-properties';

describe(
  'GlobularClusterPhysicalProperties',
  () => {
    const valid =
      () =>
        new GlobularClusterPhysicalProperties(
          250_000,
          110_000,
          11.8,
          0.18,
          0.7,
          3.4,
          58,
          0.78,
          0.24,
        );

    it(
      'should accept a valid aggregate globular-cluster profile',
      () => {
        expect(
          valid(),
        ).toBeInstanceOf(
          GlobularClusterPhysicalProperties,
        );
      },
    );

    it(
      'should require a positive safe stellar count',
      () => {
        expect(
          () =>
            new GlobularClusterPhysicalProperties(
              0,
              1,
              1,
              0,
              1,
              2,
              3,
              0.5,
              0.2,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it.each([
      [
        'massSolarMasses',
        1,
      ],
      [
        'ageBillionYears',
        2,
      ],
      [
        'coreRadiusParsecs',
        4,
      ],
      [
        'halfLightRadiusParsecs',
        5,
      ],
      [
        'tidalRadiusParsecs',
        6,
      ],
    ])(
      'should require %s to be finite and positive',
      (
        _propertyName,
        index,
      ) => {
        const values = [
          250_000,
          110_000,
          11.8,
          0.18,
          0.7,
          3.4,
          58,
          0.78,
          0.24,
        ];

        values[index] =
          0;

        expect(
          () =>
            new GlobularClusterPhysicalProperties(
              values[0],
              values[1],
              values[2],
              values[3],
              values[4],
              values[5],
              values[6],
              values[7],
              values[8],
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should require non-negative metallicity',
      () => {
        expect(
          () =>
            new GlobularClusterPhysicalProperties(
              250_000,
              110_000,
              11.8,
              -0.01,
              0.7,
              3.4,
              58,
              0.78,
              0.24,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should require core < half-light < tidal radius',
      () => {
        expect(
          () =>
            new GlobularClusterPhysicalProperties(
              250_000,
              110_000,
              11.8,
              0.18,
              3.4,
              3.4,
              58,
              0.78,
              0.24,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new GlobularClusterPhysicalProperties(
              250_000,
              110_000,
              11.8,
              0.18,
              0.7,
              3.4,
              3.4,
              0.78,
              0.24,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it.each([
      [
        'centralConcentration',
        7,
      ],
      [
        'stellarRemnantFraction',
        8,
      ],
    ])(
      'should require %s in [0, 1]',
      (
        _propertyName,
        index,
      ) => {
        const values = [
          250_000,
          110_000,
          11.8,
          0.18,
          0.7,
          3.4,
          58,
          0.78,
          0.24,
        ];

        values[index] =
          1.01;

        expect(
          () =>
            new GlobularClusterPhysicalProperties(
              values[0],
              values[1],
              values[2],
              values[3],
              values[4],
              values[5],
              values[6],
              values[7],
              values[8],
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
