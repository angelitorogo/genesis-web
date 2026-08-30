import {
  PlanetMagnetosphereRegime,
  planetMagnetosphereRegimeForState,
} from './planet-magnetosphere-regime';

describe(
  'PlanetMagnetosphereRegime point 20.9',
  () => {
    it(
      'should distinguish absent, induced and intrinsic magnetospheres',
      () => {
        expect(
          planetMagnetosphereRegimeForState(
            0,
            false,
            0.01,
          ),
        ).toBe(PlanetMagnetosphereRegime.NONE);

        expect(
          planetMagnetosphereRegimeForState(
            0.12,
            false,
            0.30,
          ),
        ).toBe(PlanetMagnetosphereRegime.INDUCED);

        expect(
          planetMagnetosphereRegimeForState(
            0.20,
            true,
            0,
          ),
        ).toBe(PlanetMagnetosphereRegime.COMPRESSED);

        expect(
          planetMagnetosphereRegimeForState(
            0.55,
            true,
            0,
          ),
        ).toBe(PlanetMagnetosphereRegime.GLOBAL);

        expect(
          planetMagnetosphereRegimeForState(
            0.80,
            true,
            0,
          ),
        ).toBe(PlanetMagnetosphereRegime.EXTENDED);
      },
    );

    it(
      'should reject invalid normalized inputs',
      () => {
        expect(
          () =>
            planetMagnetosphereRegimeForState(
              1.1,
              true,
              0,
            ),
        ).toThrow(RangeError);

        expect(
          () =>
            planetMagnetosphereRegimeForState(
              0.5,
              false,
              -0.1,
            ),
        ).toThrow(RangeError);
      },
    );
  },
);
