import {
  HiiRegionPhysicalProperties,
} from './hii-region-physical-properties';

describe(
  'HiiRegionPhysicalProperties',
  () => {
    it(
      'should preserve finite positive ionized-region measurements',
      () => {
        const properties =
          new HiiRegionPhysicalProperties(
            4.5,
            9_200,
            380,
          );

        expect(
          properties.radiusParsecs,
        ).toBe(
          4.5,
        );

        expect(
          properties.electronTemperatureKelvin,
        ).toBe(
          9_200,
        );

        expect(
          properties.electronDensityPerCm3,
        ).toBe(
          380,
        );
      },
    );

    it.each([
      [
        0,
        9000,
        100,
      ],
      [
        1,
        Number.NaN,
        100,
      ],
      [
        1,
        9000,
        Number.POSITIVE_INFINITY,
      ],
    ])(
      'should reject non-positive or non-finite H II measurements',
      (
        radiusParsecs,
        electronTemperatureKelvin,
        electronDensityPerCm3,
      ) => {
        expect(
          () =>
            new HiiRegionPhysicalProperties(
              radiusParsecs,
              electronTemperatureKelvin,
              electronDensityPerCm3,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
