import {
  GalacticNucleusState,
} from './galactic-nucleus-state';

describe(
  'GalacticNucleusState',
  () => {
    it(
      'should preserve the exact Android nucleus state codes',
      () => {
        expect(
          GalacticNucleusState
            .QUIESCENT
            .code,
        ).toBe(1);

        expect(
          GalacticNucleusState
            .AGN
            .code,
        ).toBe(2);

        expect(
          GalacticNucleusState
            .QUASAR
            .code,
        ).toBe(3);
      },
    );

    it(
      'should expose exactly the three canonical nucleus states',
      () => {
        expect(
          GalacticNucleusState.values
            .map(
              (
                value,
              ) =>
                value.name,
            ),
        ).toEqual([
          'QUIESCENT',
          'AGN',
          'QUASAR',
        ]);

        expect(
          GalacticNucleusState.values,
        ).toHaveLength(3);
      },
    );

    it(
      'should resolve every valid code to its canonical singleton',
      () => {
        expect(
          GalacticNucleusState
            .fromCode(
              1,
            ),
        ).toBe(
          GalacticNucleusState
            .QUIESCENT,
        );

        expect(
          GalacticNucleusState
            .fromCode(
              2,
            ),
        ).toBe(
          GalacticNucleusState
            .AGN,
        );

        expect(
          GalacticNucleusState
            .fromCode(
              3,
            ),
        ).toBe(
          GalacticNucleusState
            .QUASAR,
        );
      },
    );

    it(
      'should reject unknown nucleus state codes',
      () => {
        expect(
          GalacticNucleusState
            .fromCodeOrNull(
              0,
            ),
        ).toBeNull();

        expect(
          GalacticNucleusState
            .fromCodeOrNull(
              4,
            ),
        ).toBeNull();

        expect(
          () =>
            GalacticNucleusState
              .fromCode(
                0,
              ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            GalacticNucleusState
              .fromCode(
                4,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);