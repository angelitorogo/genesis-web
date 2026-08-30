import {
  PlanetGeologyRegime,
  planetGeologyRegimeForActivityIndex01,
} from './planet-geology-regime';

describe(
  'PlanetGeologyRegime point 20.8',
  () => {
    it(
      'should classify the complete normalized activity envelope',
      () => {
        expect(
          planetGeologyRegimeForActivityIndex01(null),
        ).toBe(PlanetGeologyRegime.DEEP_ENVELOPE);

        expect(
          planetGeologyRegimeForActivityIndex01(0.05),
        ).toBe(PlanetGeologyRegime.INERT);

        expect(
          planetGeologyRegimeForActivityIndex01(0.15),
        ).toBe(PlanetGeologyRegime.LOW_ACTIVITY);

        expect(
          planetGeologyRegimeForActivityIndex01(0.40),
        ).toBe(PlanetGeologyRegime.ACTIVE);

        expect(
          planetGeologyRegimeForActivityIndex01(0.70),
        ).toBe(PlanetGeologyRegime.HIGH_ACTIVITY);

        expect(
          planetGeologyRegimeForActivityIndex01(0.90),
        ).toBe(PlanetGeologyRegime.EXTREME_ACTIVITY);
      },
    );

    it(
      'should reject non-normalized activity indices',
      () => {
        for (const invalid of [-0.01, 1.01, Number.NaN]) {
          expect(
            () => planetGeologyRegimeForActivityIndex01(invalid),
          ).toThrow(RangeError);
        }
      },
    );
  },
);
