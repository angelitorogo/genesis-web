import {
  PlanetarySystemStabilityRegime,
} from './planetary-system-stability-regime';

describe(
  'PlanetarySystemStabilityRegime point 18.5',
  () => {
    it(
      'should distinguish empty/excluded architectures from assessed stable, marginal and unstable systems',
      () => {
        expect(
          Object.values(
            PlanetarySystemStabilityRegime,
          ),
        ).toEqual([
          'EMPTY',
          'DYNAMICALLY_EXCLUDED',
          'STABLE',
          'MARGINAL',
          'UNSTABLE',
        ]);
      },
    );
  },
);
