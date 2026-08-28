import {
  PLANETARY_FORMATION_LABORATORY_FAMILIES,
  PlanetaryFormationLaboratoryFamilyId,
  PlanetaryFormationLaboratoryFixtures,
} from './planetary-formation-laboratory-fixtures';

describe(
  'PlanetaryFormationLaboratoryFixtures',
  () => {
    it(
      'should expose eight deterministic A-H phase-17 sample slots without materializing them eagerly',
      () => {
        expect(
          PLANETARY_FORMATION_LABORATORY_FAMILIES
            .map(
              family =>
                family.id,
            ),
        ).toEqual([
          'A',
          'B',
          'C',
          'D',
          'E',
          'F',
          'G',
          'H',
        ]);

        expect(
          PLANETARY_FORMATION_LABORATORY_FAMILIES
            .map(
              family =>
                family.formationMatchOrdinal,
            ),
        ).toEqual([
          0,
          1,
          2,
          3,
          4,
          5,
          6,
          7,
        ]);
      },
    );

    it(
      'should keep the same canonical generation key used by the permanent visual laboratories',
      () => {
        expect(
          PlanetaryFormationLaboratoryFixtures
            .generationKey()
            .universeSeed
            .serialize(),
        ).toBe(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        );
      },
    );

    it(
      'should reject an unknown family before attempting a SystemLocator scan',
      () => {
        expect(
          () =>
            PlanetaryFormationLaboratoryFixtures
              .frame(
                'Z' as
                  PlanetaryFormationLaboratoryFamilyId,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
