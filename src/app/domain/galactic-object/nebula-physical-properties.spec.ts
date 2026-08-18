import {
  NebulaPhysicalProperties,
} from './nebula-physical-properties';

describe(
  'NebulaPhysicalProperties',
  () => {
    it(
      'should preserve finite positive physical measurements and normalized fractions',
      () => {
        const properties =
          new NebulaPhysicalProperties(
            12.5,
            840,
            9100,
            325,
            0.82,
            0.014,
          );

        expect(
          properties.radiusParsecs,
        ).toBe(
          12.5,
        );

        expect(
          properties.massSolarMasses,
        ).toBe(
          840,
        );

        expect(
          properties.gasTemperatureKelvin,
        ).toBe(
          9100,
        );

        expect(
          properties.hydrogenNumberDensityPerCm3,
        ).toBe(
          325,
        );

        expect(
          properties.ionizationFraction,
        ).toBe(
          0.82,
        );

        expect(
          properties.dustToGasMassRatio,
        ).toBe(
          0.014,
        );
      },
    );

    it(
      'should accept both closed endpoints for normalized fractions',
      () => {
        expect(
          () =>
            new NebulaPhysicalProperties(
              1,
              1,
              1,
              1,
              0,
              1,
            ),
        ).not.toThrow();
      },
    );

    it.each([
      [
        0,
        1,
        1,
        1,
        0.5,
        0.01,
      ],
      [
        1,
        Number.NaN,
        1,
        1,
        0.5,
        0.01,
      ],
      [
        1,
        1,
        Number.POSITIVE_INFINITY,
        1,
        0.5,
        0.01,
      ],
      [
        1,
        1,
        1,
        -1,
        0.5,
        0.01,
      ],
    ])(
      'should reject non-positive or non-finite intrinsic measurements',
      (
        radiusParsecs,
        massSolarMasses,
        gasTemperatureKelvin,
        hydrogenNumberDensityPerCm3,
        ionizationFraction,
        dustToGasMassRatio,
      ) => {
        expect(
          () =>
            new NebulaPhysicalProperties(
              radiusParsecs,
              massSolarMasses,
              gasTemperatureKelvin,
              hydrogenNumberDensityPerCm3,
              ionizationFraction,
              dustToGasMassRatio,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it.each([
      -0.0001,
      1.0001,
      Number.NaN,
    ])(
      'should reject an invalid ionization fraction',
      (
        invalidFraction,
      ) => {
        expect(
          () =>
            new NebulaPhysicalProperties(
              1,
              1,
              1,
              1,
              invalidFraction,
              0.01,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it.each([
      -0.0001,
      1.0001,
      Number.POSITIVE_INFINITY,
    ])(
      'should reject an invalid dust-to-gas mass ratio',
      (
        invalidRatio,
      ) => {
        expect(
          () =>
            new NebulaPhysicalProperties(
              1,
              1,
              1,
              1,
              0.5,
              invalidRatio,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
