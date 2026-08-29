import {
  PlanetaryOrbitalPairStabilityRegime,
} from './planetary-orbital-pair-stability-regime';

describe(
  'PlanetaryOrbitalPairStabilityRegime point 18.5',
  () => {
    it(
      'should expose only the frozen V1 adjacent-pair stability states',
      () => {
        expect(
          Object.values(
            PlanetaryOrbitalPairStabilityRegime,
          ),
        ).toEqual([
          'STABLE',
          'MARGINAL',
          'UNSTABLE',
        ]);
      },
    );
  },
);
