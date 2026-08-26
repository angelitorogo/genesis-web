import {
  StellarWhiteDwarfComposition,
} from './stellar-white-dwarf-composition';

describe(
  'StellarWhiteDwarfComposition',
  () => {
    it(
      'should expose exactly the three coarse point-14.5 white-dwarf core families',
      () => {
        expect(
          StellarWhiteDwarfComposition.values
            .map(
              value =>
                value.name,
            ),
        ).toEqual([
          'HELIUM_CORE',
          'CARBON_OXYGEN_CORE',
          'OXYGEN_NEON_CORE',
        ]);

        expect(
          StellarWhiteDwarfComposition.values
            .map(
              value =>
                value.code,
            ),
        ).toEqual([
          1,
          2,
          3,
        ]);
      },
    );

    it(
      'should recover every V1 core family from its stable code without depending on singleton identity',
      () => {
        for (
          const composition
          of StellarWhiteDwarfComposition.values
        ) {
          expect(
            StellarWhiteDwarfComposition
              .fromCode(
                composition.code,
              )
              .name,
          ).toBe(
            composition.name,
          );
        }
      },
    );

    it(
      'should preserve nullable lookup and reject unknown codes',
      () => {
        expect(
          StellarWhiteDwarfComposition
            .fromCodeOrNull(
              999,
            ),
        ).toBeNull();

        expect(
          () =>
            StellarWhiteDwarfComposition
              .fromCode(
                999,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should not invent point-15 physical output, cooling data or atmospheric spectral classes',
      () => {
        for (
          const composition
          of StellarWhiteDwarfComposition.values
        ) {
          expect(
            Object.keys(
              composition,
            ),
          ).toEqual([
            'name',
            'code',
          ]);

          for (
            const deferredProperty
            of [
              'massSolar',
              'radiusSolar',
              'luminositySolar',
              'effectiveTemperatureKelvin',
              'coolingAgeBillionYears',
              'spectralType',
              'atmosphericClass',
              'chandrasekharLimitSolar',
              'progenitorMassSolar',
            ]
          ) {
            expect(
              deferredProperty in
                composition,
            ).toBe(
              false,
            );
          }
        }
      },
    );
  },
);
