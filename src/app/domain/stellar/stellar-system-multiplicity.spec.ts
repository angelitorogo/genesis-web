import {
  StellarSystemMultiplicity,
} from './stellar-system-multiplicity';

describe(
  'StellarSystemMultiplicity',
  () => {
    it(
      'should preserve SINGLE code 1 and add point-16.2 BINARY code 2',
      () => {
        expect(
          StellarSystemMultiplicity.values,
        ).toEqual([
          StellarSystemMultiplicity.SINGLE,
          StellarSystemMultiplicity.BINARY,
        ]);

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

        expect(
          StellarSystemMultiplicity.BINARY.name,
        ).toBe(
          'BINARY',
        );

        expect(
          StellarSystemMultiplicity.BINARY.code,
        ).toBe(
          2,
        );

        expect(
          StellarSystemMultiplicity.BINARY.stellarComponentCount,
        ).toBe(
          2,
        );
      },
    );

    it(
      'should rehydrate SINGLE/BINARY stable codes while leaving TRIPLE undefined until 16.3',
      () => {
        expect(
          StellarSystemMultiplicity.fromCode(
            1,
          ),
        ).toBe(
          StellarSystemMultiplicity.SINGLE,
        );

        expect(
          StellarSystemMultiplicity.fromCode(
            2,
          ),
        ).toBe(
          StellarSystemMultiplicity.BINARY,
        );

        expect(
          StellarSystemMultiplicity.fromCodeOrNull(
            3,
          ),
        ).toBeNull();

        expect(
          () =>
            StellarSystemMultiplicity.fromCode(
              3,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
