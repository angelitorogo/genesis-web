import {
  StellarSystemComponentLabel,
} from './stellar-system-component-label';

describe(
  'StellarSystemComponentLabel points 16.2-16.3',
  () => {
    it(
      'should preserve A/B component codes and add C code 3',
      () => {
        expect(
          StellarSystemComponentLabel.values,
        ).toEqual([
          StellarSystemComponentLabel.A,
          StellarSystemComponentLabel.B,
          StellarSystemComponentLabel.C,
        ]);

        expect(
          StellarSystemComponentLabel.A.code,
        ).toBe(1);

        expect(
          StellarSystemComponentLabel.B.code,
        ).toBe(2);

        expect(
          StellarSystemComponentLabel.C.code,
        ).toBe(3);
      },
    );

    it(
      'should rehydrate A/B/C and reject an unknown future component code',
      () => {
        expect(
          StellarSystemComponentLabel.fromCode(1),
        ).toBe(StellarSystemComponentLabel.A);

        expect(
          StellarSystemComponentLabel.fromCode(2),
        ).toBe(StellarSystemComponentLabel.B);

        expect(
          StellarSystemComponentLabel.fromCode(3),
        ).toBe(StellarSystemComponentLabel.C);

        expect(
          StellarSystemComponentLabel.fromCodeOrNull(4),
        ).toBeNull();

        expect(
          () =>
            StellarSystemComponentLabel.fromCode(4),
        ).toThrow(RangeError);
      },
    );
  },
);
