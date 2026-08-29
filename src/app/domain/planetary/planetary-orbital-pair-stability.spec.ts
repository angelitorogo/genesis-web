import {
  PlanetaryOrbitalPairStability,
} from './planetary-orbital-pair-stability';

import {
  PlanetaryOrbitalPairStabilityRegime,
} from './planetary-orbital-pair-stability-regime';

describe(
  'PlanetaryOrbitalPairStability point 18.5',
  () => {
    it(
      'should expose the frozen pair diagnostics without hiding the reference mass model',
      () => {
        const pair =
          new PlanetaryOrbitalPairStability(
            1,
            2,
            1,
            1.4,
            1.02,
            1.36,
            0.34,
            1,
            2,
            0.02,
            20,
            1.65,
            2.5,
            PlanetaryOrbitalPairStabilityRegime.STABLE,
          );

        expect(
          pair.isStable,
        ).toBe(true);

        expect(
          pair.isMarginal,
        ).toBe(false);

        expect(
          pair.isUnstable,
        ).toBe(false);

        expect(
          pair.innerReferenceMassEarth,
        ).toBe(1);

        expect(
          pair.outerReferenceMassEarth,
        ).toBe(2);
      },
    );

    it(
      'should reject non-contiguous ordinals and inconsistent apsidal clearance',
      () => {
        expect(
          () =>
            new PlanetaryOrbitalPairStability(
              1,
              3,
              1,
              1.4,
              1.02,
              1.36,
              0.34,
              1,
              2,
              0.02,
              20,
              1.65,
              2.5,
              PlanetaryOrbitalPairStabilityRegime.STABLE,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new PlanetaryOrbitalPairStability(
              1,
              2,
              1,
              1.4,
              1.02,
              1.36,
              0.35,
              1,
              2,
              0.02,
              20,
              1.65,
              2.5,
              PlanetaryOrbitalPairStabilityRegime.STABLE,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
