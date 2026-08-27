import {
  StellarSystemMultiplicity,
} from './stellar-system-multiplicity';

describe(
  'StellarSystemMultiplicity points 16.1-16.3',
  () => {
    it(
      'should preserve SINGLE/BINARY codes and add TRIPLE code 3',
      () => {
        expect(
          StellarSystemMultiplicity.values,
        ).toEqual([
          StellarSystemMultiplicity.SINGLE,
          StellarSystemMultiplicity.BINARY,
          StellarSystemMultiplicity.TRIPLE,
        ]);

        expect(
          StellarSystemMultiplicity.SINGLE.code,
        ).toBe(1);

        expect(
          StellarSystemMultiplicity.SINGLE.stellarComponentCount,
        ).toBe(1);

        expect(
          StellarSystemMultiplicity.BINARY.code,
        ).toBe(2);

        expect(
          StellarSystemMultiplicity.BINARY.stellarComponentCount,
        ).toBe(2);

        expect(
          StellarSystemMultiplicity.TRIPLE.name,
        ).toBe('TRIPLE');

        expect(
          StellarSystemMultiplicity.TRIPLE.code,
        ).toBe(3);

        expect(
          StellarSystemMultiplicity.TRIPLE.stellarComponentCount,
        ).toBe(3);
      },
    );

    it(
      'should rehydrate all stable V1 multiplicity codes and reject unknown future codes',
      () => {
        expect(
          StellarSystemMultiplicity.fromCode(1),
        ).toBe(StellarSystemMultiplicity.SINGLE);

        expect(
          StellarSystemMultiplicity.fromCode(2),
        ).toBe(StellarSystemMultiplicity.BINARY);

        expect(
          StellarSystemMultiplicity.fromCode(3),
        ).toBe(StellarSystemMultiplicity.TRIPLE);

        expect(
          StellarSystemMultiplicity.fromCodeOrNull(4),
        ).toBeNull();

        expect(
          () =>
            StellarSystemMultiplicity.fromCode(4),
        ).toThrow(RangeError);
      },
    );
  },
);
