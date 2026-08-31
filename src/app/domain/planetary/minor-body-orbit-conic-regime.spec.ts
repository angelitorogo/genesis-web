import {
  MinorBodyOrbitConicRegime,
} from './minor-body-orbit-conic-regime';

describe(
  'MinorBodyOrbitConicRegime point 23.2',
  () => {
    it(
      'should round-trip the two supported conic families',
      () => {
        for (
          const regime
          of MinorBodyOrbitConicRegime.values
        ) {
          expect(
            MinorBodyOrbitConicRegime
              .fromCode(
                regime.code,
              ),
          ).toBe(regime);
        }
      },
    );

    it(
      'should reject unknown codes',
      () => {
        expect(
          MinorBodyOrbitConicRegime
            .fromCodeOrNull(
              999,
            ),
        ).toBeNull();

        expect(
          () =>
            MinorBodyOrbitConicRegime
              .fromCode(
                999,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
