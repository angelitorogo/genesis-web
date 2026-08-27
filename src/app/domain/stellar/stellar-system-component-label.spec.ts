import {
  StellarSystemComponentLabel,
} from './stellar-system-component-label';

describe(
  'StellarSystemComponentLabel point 16.2',
  () => {
    it(
      'should expose stable A/B component codes',
      () => {
        expect(
          StellarSystemComponentLabel.values,
        ).toEqual([
          StellarSystemComponentLabel.A,
          StellarSystemComponentLabel.B,
        ]);

        expect(
          StellarSystemComponentLabel.A.code,
        ).toBe(
          1,
        );

        expect(
          StellarSystemComponentLabel.B.code,
        ).toBe(
          2,
        );
      },
    );

    it(
      'should rehydrate A/B and reject an unknown future component code',
      () => {
        expect(
          StellarSystemComponentLabel.fromCode(
            1,
          ),
        ).toBe(
          StellarSystemComponentLabel.A,
        );

        expect(
          StellarSystemComponentLabel.fromCode(
            2,
          ),
        ).toBe(
          StellarSystemComponentLabel.B,
        );

        expect(
          StellarSystemComponentLabel.fromCodeOrNull(
            3,
          ),
        ).toBeNull();

        expect(
          () =>
            StellarSystemComponentLabel.fromCode(
              3,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
