import {
  CometNucleusProperties,
} from './comet-nucleus-properties';

describe(
  'CometNucleusProperties point 22.5 V1',
  () => {
    it(
      'should preserve a physically bounded first-order nucleus state',
      () => {
        const properties =
          new CometNucleusProperties(
            1,
            24,
            0.63,
            0.37,
            0.58,
            0.52,
            0.045,
            0.79,
          );

        expect(
          properties.iceFraction01 +
            properties.dustFraction01,
        ).toBeCloseTo(
          1,
          12,
        );

        expect(
          properties.bulkDensityGramsPerCubicCentimeter,
        ).toBeGreaterThan(
          0,
        );
      },
    );

    it(
      'should reject non-conserving fractions and invalid physical ranges',
      () => {
        expect(
          () =>
            new CometNucleusProperties(
              1,
              24,
              0.7,
              0.4,
              0.5,
              0.5,
              0.04,
              0.8,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new CometNucleusProperties(
              1,
              0,
              0.6,
              0.4,
              0.5,
              0.5,
              0.04,
              0.8,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
