import {
  StellarBrownDwarfClass,
} from './stellar-brown-dwarf-class';

describe(
  'StellarBrownDwarfClass',
  () => {
    it(
      'should expose exactly the canonical broad L/T/Y brown-dwarf families in warm-to-cool order',
      () => {
        expect(
          StellarBrownDwarfClass.values
            .map(
              value =>
                value.name,
            ),
        ).toEqual([
          'L',
          'T',
          'Y',
        ]);

        expect(
          StellarBrownDwarfClass.values
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
      'should recover every V1 family from its stable code without depending on object identity',
      () => {
        for (
          const brownDwarfClass
          of StellarBrownDwarfClass.values
        ) {
          expect(
            StellarBrownDwarfClass
              .fromCode(
                brownDwarfClass.code,
              )
              .name,
          ).toBe(
            brownDwarfClass.name,
          );
        }
      },
    );

    it(
      'should preserve nullable lookup and reject unknown codes',
      () => {
        expect(
          StellarBrownDwarfClass
            .fromCodeOrNull(
              999,
            ),
        ).toBeNull();

        expect(
          () =>
            StellarBrownDwarfClass
              .fromCode(
                999,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should not invent detailed point-15 spectral subtypes, color or physical thresholds',
      () => {
        for (
          const brownDwarfClass
          of StellarBrownDwarfClass.values
        ) {
          expect(
            Object.keys(
              brownDwarfClass,
            ),
          ).toEqual([
            'name',
            'code',
          ]);

          for (
            const deferredProperty
            of [
              'subtype',
              'spectralType',
              'color',
              'effectiveTemperatureKelvin',
              'massSolar',
              'massJupiter',
              'deuteriumBurning',
              'lithiumBurning',
            ]
          ) {
            expect(
              deferredProperty in
                brownDwarfClass,
            ).toBe(
              false,
            );
          }
        }
      },
    );
  },
);
