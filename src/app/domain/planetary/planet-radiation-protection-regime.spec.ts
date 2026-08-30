import {
  PlanetRadiationProtectionRegime,
  planetRadiationProtectionRegimeForIndex01,
} from './planet-radiation-protection-regime';

describe(
  'PlanetRadiationProtectionRegime point 20.10',
  () => {
    it(
      'should freeze the V1 protection boundaries including deep envelopes',
      () => {
        expect(
          planetRadiationProtectionRegimeForIndex01(null),
        ).toBe(
          PlanetRadiationProtectionRegime.DEEP_ENVELOPE,
        );

        expect(
          planetRadiationProtectionRegimeForIndex01(0),
        ).toBe(
          PlanetRadiationProtectionRegime.NONE,
        );

        expect(
          planetRadiationProtectionRegimeForIndex01(0.10),
        ).toBe(
          PlanetRadiationProtectionRegime.WEAK,
        );

        expect(
          planetRadiationProtectionRegimeForIndex01(0.30),
        ).toBe(
          PlanetRadiationProtectionRegime.MODERATE,
        );

        expect(
          planetRadiationProtectionRegimeForIndex01(0.55),
        ).toBe(
          PlanetRadiationProtectionRegime.STRONG,
        );

        expect(
          planetRadiationProtectionRegimeForIndex01(0.80),
        ).toBe(
          PlanetRadiationProtectionRegime.VERY_STRONG,
        );
      },
    );

    it(
      'should reject invalid normalized protection indices',
      () => {
        for (
          const invalid
          of [
            -0.01,
            1.01,
            Number.NaN,
            Number.POSITIVE_INFINITY,
          ]
        ) {
          expect(
            () =>
              planetRadiationProtectionRegimeForIndex01(
                invalid,
              ),
          ).toThrow(RangeError);
        }
      },
    );
  },
);
