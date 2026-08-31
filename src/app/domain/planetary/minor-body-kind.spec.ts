import {
  MinorBodyKind,
} from './minor-body-kind';

describe(
  'MinorBodyKind point 22.10',
  () => {
    it(
      'should expose five stable phase-22 families and round-trip their codes',
      () => {
        expect(
          MinorBodyKind.values.map(
            value => value.name,
          ),
        ).toEqual([
          'ASTEROID',
          'COMET',
          'TRANS_NEPTUNIAN_OBJECT',
          'INTERSTELLAR_OBJECT',
          'CAPTURED_EXTRASOLAR_OBJECT',
        ]);

        for (
          const value
          of MinorBodyKind.values
        ) {
          expect(
            MinorBodyKind.fromCode(
              value.code,
            ),
          ).toBe(
            value,
          );
        }
      },
    );
  },
);
