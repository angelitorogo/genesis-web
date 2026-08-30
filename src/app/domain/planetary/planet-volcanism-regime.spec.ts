import {
  PlanetVolcanismRegime,
  planetVolcanismRegimeForIndex01,
} from './planet-volcanism-regime';

describe(
  'PlanetVolcanismRegime point 20.8',
  () => {
    it(
      'should classify the complete volcanism envelope',
      () => {
        expect(planetVolcanismRegimeForIndex01(null))
          .toBe(PlanetVolcanismRegime.DEEP_ENVELOPE);
        expect(planetVolcanismRegimeForIndex01(0.04))
          .toBe(PlanetVolcanismRegime.NONE);
        expect(planetVolcanismRegimeForIndex01(0.15))
          .toBe(PlanetVolcanismRegime.LOW);
        expect(planetVolcanismRegimeForIndex01(0.35))
          .toBe(PlanetVolcanismRegime.MODERATE);
        expect(planetVolcanismRegimeForIndex01(0.65))
          .toBe(PlanetVolcanismRegime.HIGH);
        expect(planetVolcanismRegimeForIndex01(0.90))
          .toBe(PlanetVolcanismRegime.EXTREME);
      },
    );

    it(
      'should reject non-normalized volcanism indices',
      () => {
        expect(
          () => planetVolcanismRegimeForIndex01(2),
        ).toThrow(RangeError);
      },
    );
  },
);
