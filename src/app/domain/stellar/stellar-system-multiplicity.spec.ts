import {
  StellarSystemMultiplicity,
} from './stellar-system-multiplicity';

describe(
  'StellarSystemMultiplicity',
  () => {
    it(
      'should expose only the point-16.1 SINGLE multiplicity with stable code 1',
      () => {
        expect(
          StellarSystemMultiplicity.values,
        ).toEqual([
          StellarSystemMultiplicity.SINGLE,
        ]);

        expect(
          StellarSystemMultiplicity.SINGLE.name,
        ).toBe(
          'SINGLE',
        );

        expect(
          StellarSystemMultiplicity.SINGLE.code,
        ).toBe(
          1,
        );

        expect(
          StellarSystemMultiplicity.SINGLE.stellarComponentCount,
        ).toBe(
          1,
        );
      },
    );

    it(
      'should rehydrate the stable SINGLE code and reject unknown codes',
      () => {
        expect(
          StellarSystemMultiplicity.fromCode(
            1,
          ),
        ).toBe(
          StellarSystemMultiplicity.SINGLE,
        );

        expect(
          StellarSystemMultiplicity.fromCodeOrNull(
            2,
          ),
        ).toBeNull();

        expect(
          () =>
            StellarSystemMultiplicity.fromCode(
              2,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
