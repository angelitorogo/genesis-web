import {
  SystemLocator,
} from '../generation/procedural-locator';

import {
  PlanetaryOrbitalPairStability,
} from './planetary-orbital-pair-stability';

import {
  PlanetaryOrbitalPairStabilityRegime,
} from './planetary-orbital-pair-stability-regime';

import {
  PlanetarySystemOrbitTopology,
} from './planetary-system-orbit-topology';

import {
  PlanetarySystemStabilityAssessment,
} from './planetary-system-stability-assessment';

import {
  PlanetarySystemStabilityRegime,
} from './planetary-system-stability-regime';

describe(
  'PlanetarySystemStabilityAssessment point 18.5',
  () => {
    const locator =
      new SystemLocator(
        1n,
        2n,
        3n,
      );

    it(
      'should summarize stable adjacent pairs and expose minimum Hill/apsidal margins',
      () => {
        const assessment =
          new PlanetarySystemStabilityAssessment(
            locator,
            PlanetarySystemOrbitTopology.CIRCUMSTELLAR,
            PlanetarySystemStabilityRegime.STABLE,
            2,
            1,
            null,
            null,
            null,
            null,
            [
              pair(
                PlanetaryOrbitalPairStabilityRegime.STABLE,
              ),
            ],
          );

        expect(
          assessment.pairCount,
        ).toBe(1);

        expect(
          assessment.minimumMutualHillSeparation,
        ).toBe(12.5);

        expect(
          assessment.minimumRadialClearanceAu,
        ).toBe(0.18);

        expect(
          assessment.isStable,
        ).toBe(true);
      },
    );

    it(
      'should require the system regime to follow marginal/unstable pair diagnostics',
      () => {
        expect(
          () =>
            new PlanetarySystemStabilityAssessment(
              locator,
              PlanetarySystemOrbitTopology.CIRCUMSTELLAR,
              PlanetarySystemStabilityRegime.STABLE,
              2,
              1,
              null,
              null,
              null,
              null,
              [
                pair(
                  PlanetaryOrbitalPairStabilityRegime.MARGINAL,
                ),
              ],
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should treat a negative circumbinary critical-boundary clearance as unstable',
      () => {
        const assessment =
          new PlanetarySystemStabilityAssessment(
            locator,
            PlanetarySystemOrbitTopology.CIRCUMBINARY,
            PlanetarySystemStabilityRegime.UNSTABLE,
            1,
            1.5,
            3,
            null,
            -0.05,
            null,
            [],
          );

        expect(
          assessment.regime,
        ).toBe(
          PlanetarySystemStabilityRegime.UNSTABLE,
        );
      },
    );

    it(
      'should preserve EMPTY and DYNAMICALLY_EXCLUDED as distinct planet-free outcomes',
      () => {
        const empty =
          new PlanetarySystemStabilityAssessment(
            locator,
            PlanetarySystemOrbitTopology.CIRCUMSTELLAR,
            PlanetarySystemStabilityRegime.EMPTY,
            0,
            null,
            null,
            null,
            null,
            null,
            [],
          );

        const excluded =
          new PlanetarySystemStabilityAssessment(
            locator,
            PlanetarySystemOrbitTopology.CIRCUMBINARY,
            PlanetarySystemStabilityRegime.DYNAMICALLY_EXCLUDED,
            0,
            null,
            null,
            null,
            null,
            null,
            [],
          );

        expect(
          empty.regime,
        ).not.toBe(
          excluded.regime,
        );
      },
    );

    function pair(
      regime:
        PlanetaryOrbitalPairStabilityRegime,
    ): PlanetaryOrbitalPairStability {

      return new PlanetaryOrbitalPairStability(
        1,
        2,
        1,
        1.25,
        1.02,
        1.20,
        0.18,
        1,
        1,
        0.02,
        12.5,
        1.4,
        1,
        regime,
      );
    }
  },
);
