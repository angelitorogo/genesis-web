import {
  SupernovaRemnantPhysicalProperties,
} from './supernova-remnant-physical-properties';

describe(
  'SupernovaRemnantPhysicalProperties',
  () => {
    const valid =
      () =>
        new SupernovaRemnantPhysicalProperties(
          12_000,
          18,
          590,
          4_700_000,
          1.0e51,
          0.8,
          6.5,
          676,
        );

    it(
      'should preserve a valid intrinsic remnant profile',
      () => {
        const properties =
          valid();

        expect(
          properties.ageYears,
        ).toBe(12_000);

        expect(
          properties.radiusParsecs,
        ).toBe(18);
      },
    );

    for (
      const [
        propertyName,
        replace,
      ] of [
        [
          'ageYears',
          (value: number) =>
            new SupernovaRemnantPhysicalProperties(
              value, 18, 590, 4_700_000, 1e51, 0.8, 6.5, 676,
            ),
        ],
        [
          'radiusParsecs',
          (value: number) =>
            new SupernovaRemnantPhysicalProperties(
              12_000, value, 590, 4_700_000, 1e51, 0.8, 6.5, 676,
            ),
        ],
        [
          'expansionVelocityKmPerSecond',
          (value: number) =>
            new SupernovaRemnantPhysicalProperties(
              12_000, 18, value, 4_700_000, 1e51, 0.8, 6.5, 676,
            ),
        ],
        [
          'shockTemperatureKelvin',
          (value: number) =>
            new SupernovaRemnantPhysicalProperties(
              12_000, 18, 590, value, 1e51, 0.8, 6.5, 676,
            ),
        ],
        [
          'explosionEnergyErgs',
          (value: number) =>
            new SupernovaRemnantPhysicalProperties(
              12_000, 18, 590, 4_700_000, value, 0.8, 6.5, 676,
            ),
        ],
        [
          'ambientHydrogenNumberDensityPerCm3',
          (value: number) =>
            new SupernovaRemnantPhysicalProperties(
              12_000, 18, 590, 4_700_000, 1e51, value, 6.5, 676,
            ),
        ],
        [
          'ejectaMassSolarMasses',
          (value: number) =>
            new SupernovaRemnantPhysicalProperties(
              12_000, 18, 590, 4_700_000, 1e51, 0.8, value, 676,
            ),
        ],
        [
          'sweptUpMassSolarMasses',
          (value: number) =>
            new SupernovaRemnantPhysicalProperties(
              12_000, 18, 590, 4_700_000, 1e51, 0.8, 6.5, value,
            ),
        ],
      ] as const
    ) {
      it(
        `should reject non-positive or non-finite ${propertyName}`,
        () => {
          expect(
            () =>
              replace(
                0,
              ),
          ).toThrow(
            RangeError,
          );

          expect(
            () =>
              replace(
                Number.NaN,
              ),
          ).toThrow(
            RangeError,
          );
        },
      );
    }

    it(
      'should keep all valid values finite',
      () => {
        expect(
          Object.values(
            valid(),
          ).every(
            Number.isFinite,
          ),
        ).toBe(true);
      },
    );
  },
);
