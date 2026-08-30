import {
  PlanetTectonicRegime,
  planetTectonicRegimeForMobilityIndex01,
} from './planet-tectonic-regime';

describe(
  'PlanetTectonicRegime point 20.8',
  () => {
    it(
      'should classify deep-envelope, stagnant, episodic, mobile and plate regimes',
      () => {
        expect(planetTectonicRegimeForMobilityIndex01(null))
          .toBe(PlanetTectonicRegime.DEEP_ENVELOPE);
        expect(planetTectonicRegimeForMobilityIndex01(0.20))
          .toBe(PlanetTectonicRegime.STAGNANT_LID);
        expect(planetTectonicRegimeForMobilityIndex01(0.40))
          .toBe(PlanetTectonicRegime.EPISODIC_MOBILITY);
        expect(planetTectonicRegimeForMobilityIndex01(0.58))
          .toBe(PlanetTectonicRegime.MOBILE_LID);
        expect(planetTectonicRegimeForMobilityIndex01(0.75))
          .toBe(PlanetTectonicRegime.PLATE_TECTONICS);
      },
    );

    it(
      'should reject non-normalized tectonic mobility',
      () => {
        expect(
          () => planetTectonicRegimeForMobilityIndex01(-1),
        ).toThrow(RangeError);
      },
    );
  },
);
