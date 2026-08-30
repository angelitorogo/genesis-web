import {
  PlanetSurfaceRadiationRegime,
  planetSurfaceRadiationRegimeForIndex01,
} from './planet-surface-radiation-regime';

describe(
  'PlanetSurfaceRadiationRegime point 20.10',
  () => {
    it(
      'should freeze the V1 exposure boundaries including deep envelopes',
      () => {
        expect(
          planetSurfaceRadiationRegimeForIndex01(null),
        ).toBe(
          PlanetSurfaceRadiationRegime.DEEP_ENVELOPE,
        );

        expect(
          planetSurfaceRadiationRegimeForIndex01(0),
        ).toBe(
          PlanetSurfaceRadiationRegime.MINIMAL,
        );

        expect(
          planetSurfaceRadiationRegimeForIndex01(0.08),
        ).toBe(
          PlanetSurfaceRadiationRegime.LOW,
        );

        expect(
          planetSurfaceRadiationRegimeForIndex01(0.25),
        ).toBe(
          PlanetSurfaceRadiationRegime.MODERATE,
        );

        expect(
          planetSurfaceRadiationRegimeForIndex01(0.50),
        ).toBe(
          PlanetSurfaceRadiationRegime.HIGH,
        );

        expect(
          planetSurfaceRadiationRegimeForIndex01(0.75),
        ).toBe(
          PlanetSurfaceRadiationRegime.EXTREME,
        );
      },
    );

    it(
      'should reject invalid normalized exposure indices',
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
              planetSurfaceRadiationRegimeForIndex01(
                invalid,
              ),
          ).toThrow(RangeError);
        }
      },
    );
  },
);
