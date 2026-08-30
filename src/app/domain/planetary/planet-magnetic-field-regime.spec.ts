import {
  PlanetMagneticFieldRegime,
  planetMagneticFieldRegimeForIndex01,
} from './planet-magnetic-field-regime';

describe(
  'PlanetMagneticFieldRegime point 20.9',
  () => {
    it(
      'should classify the complete normalized V1 intrinsic-field range',
      () => {
        expect(
          planetMagneticFieldRegimeForIndex01(0),
        ).toBe(PlanetMagneticFieldRegime.NONE);
        expect(
          planetMagneticFieldRegimeForIndex01(0.08),
        ).toBe(PlanetMagneticFieldRegime.WEAK);
        expect(
          planetMagneticFieldRegimeForIndex01(0.30),
        ).toBe(PlanetMagneticFieldRegime.MODERATE);
        expect(
          planetMagneticFieldRegimeForIndex01(0.50),
        ).toBe(PlanetMagneticFieldRegime.STRONG);
        expect(
          planetMagneticFieldRegimeForIndex01(0.72),
        ).toBe(PlanetMagneticFieldRegime.VERY_STRONG);
      },
    );

    it(
      'should reject non-normalized field indices',
      () => {
        for (
          const value
          of [
            -0.01,
            1.01,
            Number.NaN,
            Number.POSITIVE_INFINITY,
          ]
        ) {
          expect(
            () =>
              planetMagneticFieldRegimeForIndex01(
                value,
              ),
          ).toThrow(RangeError);
        }
      },
    );
  },
);
