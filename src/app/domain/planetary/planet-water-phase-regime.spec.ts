import {
  PlanetWaterPhaseRegime,
  planetWaterPhaseRegimeForFractions01,
} from './planet-water-phase-regime';

describe(
  'PlanetWaterPhaseRegime point 20.7',
  () => {
    it(
      'should freeze the nine V1 water-phase regimes',
      () => {
        expect(
          Object.values(
            PlanetWaterPhaseRegime,
          ),
        ).toEqual([
          'NONE',
          'ICE',
          'LIQUID',
          'VAPOR',
          'ICE_AND_LIQUID',
          'LIQUID_AND_VAPOR',
          'ICE_AND_VAPOR',
          'MIXED',
          'DEEP_ENVELOPE',
        ]);
      },
    );

    it(
      'should classify dominant, mixed and deep-envelope phase distributions',
      () => {
        expect(
          planetWaterPhaseRegimeForFractions01(
            0,
            0,
            0,
            false,
          ),
        ).toBe(
          PlanetWaterPhaseRegime.NONE,
        );

        expect(
          planetWaterPhaseRegimeForFractions01(
            0.9,
            0.1,
            0,
            false,
          ),
        ).toBe(
          PlanetWaterPhaseRegime.ICE_AND_LIQUID,
        );

        expect(
          planetWaterPhaseRegimeForFractions01(
            0.05,
            0.9,
            0.05,
            false,
          ),
        ).toBe(
          PlanetWaterPhaseRegime.LIQUID,
        );

        expect(
          planetWaterPhaseRegimeForFractions01(
            0.2,
            0.5,
            0.3,
            false,
          ),
        ).toBe(
          PlanetWaterPhaseRegime.MIXED,
        );

        expect(
          planetWaterPhaseRegimeForFractions01(
            null,
            null,
            null,
            true,
          ),
        ).toBe(
          PlanetWaterPhaseRegime.DEEP_ENVELOPE,
        );
      },
    );
  },
);
