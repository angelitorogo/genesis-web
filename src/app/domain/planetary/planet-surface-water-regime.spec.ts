import {
  PlanetSurfaceWaterRegime,
  planetSurfaceWaterRegimeForCoverage01,
} from './planet-surface-water-regime';

describe(
  'PlanetSurfaceWaterRegime point 20.7',
  () => {
    it(
      'should freeze the six V1 surface-water regimes',
      () => {
        expect(
          Object.values(
            PlanetSurfaceWaterRegime,
          ),
        ).toEqual([
          'NONE',
          'LOCAL_LIQUID',
          'SEAS',
          'OCEANS',
          'GLOBAL_OCEAN',
          'DEEP_ENVELOPE',
        ]);
      },
    );

    it(
      'should classify exact V1 liquid-water coverage thresholds',
      () => {
        expect(
          planetSurfaceWaterRegimeForCoverage01(
            0,
            false,
          ),
        ).toBe(
          PlanetSurfaceWaterRegime.NONE,
        );

        expect(
          planetSurfaceWaterRegimeForCoverage01(
            0.01,
            false,
          ),
        ).toBe(
          PlanetSurfaceWaterRegime.LOCAL_LIQUID,
        );

        expect(
          planetSurfaceWaterRegimeForCoverage01(
            0.05,
            false,
          ),
        ).toBe(
          PlanetSurfaceWaterRegime.SEAS,
        );

        expect(
          planetSurfaceWaterRegimeForCoverage01(
            0.35,
            false,
          ),
        ).toBe(
          PlanetSurfaceWaterRegime.OCEANS,
        );

        expect(
          planetSurfaceWaterRegimeForCoverage01(
            0.85,
            false,
          ),
        ).toBe(
          PlanetSurfaceWaterRegime.GLOBAL_OCEAN,
        );

        expect(
          planetSurfaceWaterRegimeForCoverage01(
            null,
            true,
          ),
        ).toBe(
          PlanetSurfaceWaterRegime.DEEP_ENVELOPE,
        );
      },
    );
  },
);
