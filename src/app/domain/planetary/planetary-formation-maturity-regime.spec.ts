import {
  PlanetaryFormationMaturityRegime,
} from './planetary-formation-maturity-regime';

describe(
  'PlanetaryFormationMaturityRegime point 17.7',
  () => {
    it(
      'should expose only formation-endpoint regimes and no final planet classes',
      () => {
        expect(
          Object.values(
            PlanetaryFormationMaturityRegime,
          ),
        ).toEqual([
          'NO_PLANET_FORMING_CORES',
          'SOLID_CORE_SYSTEM',
          'VOLATILE_RICH_CORE_SYSTEM',
          'GAS_ENVELOPE_FAVORED',
          'DYNAMICALLY_REWORKED',
        ]);

        expect(
          'GAS_GIANT' in
            PlanetaryFormationMaturityRegime,
        ).toBe(false);
      },
    );
  },
);
