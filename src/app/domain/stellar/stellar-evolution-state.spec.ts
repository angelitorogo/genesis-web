import {
  StellarEvolutionState,
} from './stellar-evolution-state';

describe(
  'StellarEvolutionState',
  () => {
    it(
      'should expose exactly the seven point-14 evolutionary families',
      () => {
        expect(
          StellarEvolutionState.values
            .map(
              value =>
                value.name,
            ),
        ).toEqual([
          'BROWN_DWARF',
          'MAIN_SEQUENCE',
          'GIANT',
          'SUPERGIANT',
          'WHITE_DWARF',
          'NEUTRON_STAR',
          'STELLAR_BLACK_HOLE',
        ]);

        expect(
          StellarEvolutionState.values,
        ).toHaveLength(
          7,
        );
      },
    );

    it(
      'should keep stable V1 codes and resolve every valid code to its canonical singleton',
      () => {
        const expected = [
          [
            StellarEvolutionState.BROWN_DWARF,
            1,
          ],
          [
            StellarEvolutionState.MAIN_SEQUENCE,
            2,
          ],
          [
            StellarEvolutionState.GIANT,
            3,
          ],
          [
            StellarEvolutionState.SUPERGIANT,
            4,
          ],
          [
            StellarEvolutionState.WHITE_DWARF,
            5,
          ],
          [
            StellarEvolutionState.NEUTRON_STAR,
            6,
          ],
          [
            StellarEvolutionState.STELLAR_BLACK_HOLE,
            7,
          ],
        ] as const;

        for (
          const [
            state,
            code,
          ] of expected
        ) {
          expect(
            state.code,
          ).toBe(
            code,
          );

          expect(
            StellarEvolutionState
              .fromCode(
                code,
              ),
          ).toBe(
            state,
          );
        }
      },
    );

    it(
      'should reject unknown serialization codes',
      () => {
        expect(
          StellarEvolutionState
            .fromCodeOrNull(
              0,
            ),
        ).toBeNull();

        expect(
          StellarEvolutionState
            .fromCodeOrNull(
              8,
            ),
        ).toBeNull();

        expect(
          () =>
            StellarEvolutionState
              .fromCode(
                0,
              ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            StellarEvolutionState
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
