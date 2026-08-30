import {
  PlanetClimateStabilityRegime,
  planetClimateStabilityRegimeForIndex01,
} from './planet-climate-stability-regime';

describe(
  'PlanetClimateStabilityRegime point 20.6',
  () => {
    it(
      'should freeze the five V1 regimes',
      () => {
        expect(
          Object.values(
            PlanetClimateStabilityRegime,
          ),
        ).toEqual([
          'STABLE',
          'MODERATELY_VARIABLE',
          'STRONGLY_VARIABLE',
          'EXTREME',
          'DEEP_ENVELOPE',
        ]);
      },
    );

    it(
      'should classify exact V1 stability boundaries and deep envelopes',
      () => {
        expect(
          planetClimateStabilityRegimeForIndex01(
            0.80,
            false,
          ),
        ).toBe(
          PlanetClimateStabilityRegime.STABLE,
        );

        expect(
          planetClimateStabilityRegimeForIndex01(
            0.60,
            false,
          ),
        ).toBe(
          PlanetClimateStabilityRegime.MODERATELY_VARIABLE,
        );

        expect(
          planetClimateStabilityRegimeForIndex01(
            0.35,
            false,
          ),
        ).toBe(
          PlanetClimateStabilityRegime.STRONGLY_VARIABLE,
        );

        expect(
          planetClimateStabilityRegimeForIndex01(
            0.349,
            false,
          ),
        ).toBe(
          PlanetClimateStabilityRegime.EXTREME,
        );

        expect(
          planetClimateStabilityRegimeForIndex01(
            null,
            true,
          ),
        ).toBe(
          PlanetClimateStabilityRegime.DEEP_ENVELOPE,
        );
      },
    );
  },
);
