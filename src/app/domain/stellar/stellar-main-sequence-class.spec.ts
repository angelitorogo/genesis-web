import {
  StellarMainSequenceClass,
} from './stellar-main-sequence-class';

describe(
  'StellarMainSequenceClass',
  () => {
    it(
      'should expose the complete canonical O/B/A/F/G/K/M main-sequence family set',
      () => {
        expect(
          StellarMainSequenceClass.values
            .map(
              value =>
                value.name,
            ),
        ).toEqual([
          'O',
          'B',
          'A',
          'F',
          'G',
          'K',
          'M',
        ]);

        expect(
          StellarMainSequenceClass.values,
        ).toHaveLength(
          7,
        );
      },
    );

    it(
      'should keep stable hot-to-cool V1 codes and resolve every valid code',
      () => {
        const expected = [
          [StellarMainSequenceClass.O, 1],
          [StellarMainSequenceClass.B, 2],
          [StellarMainSequenceClass.A, 3],
          [StellarMainSequenceClass.F, 4],
          [StellarMainSequenceClass.G, 5],
          [StellarMainSequenceClass.K, 6],
          [StellarMainSequenceClass.M, 7],
        ] as const;

        for (
          const [
            mainSequenceClass,
            code,
          ] of expected
        ) {
          expect(
            mainSequenceClass.code,
          ).toBe(
            code,
          );

          expect(
            StellarMainSequenceClass
              .fromCode(
                code,
              ),
          ).toBe(
            mainSequenceClass,
          );
        }
      },
    );

    it(
      'should reject unknown serialization codes without inventing brown-dwarf or remnant classes',
      () => {
        expect(
          StellarMainSequenceClass
            .fromCodeOrNull(
              0,
            ),
        ).toBeNull();

        expect(
          StellarMainSequenceClass
            .fromCodeOrNull(
              8,
            ),
        ).toBeNull();

        expect(
          () =>
            StellarMainSequenceClass
              .fromCode(
                0,
              ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            StellarMainSequenceClass
              .fromCode(
                8,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
