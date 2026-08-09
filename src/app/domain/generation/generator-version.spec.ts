import {
  GeneratorVersion,
} from './generator-version';

describe(
  'GeneratorVersion',
  () => {
    it(
      'should expose V1 with persistent code 1',
      () => {
        expect(
          GeneratorVersion
            .V1
            .name,
        ).toBe(
          'V1',
        );

        expect(
          GeneratorVersion
            .V1
            .code,
        ).toBe(
          1,
        );
      },
    );

    it(
      'should resolve V1 from code 1',
      () => {
        expect(
          GeneratorVersion
            .fromCodeOrNull(
              1,
            ),
        ).toBe(
          GeneratorVersion.V1,
        );
      },
    );

    it(
      'should return null for unknown codes',
      () => {
        const unknownCodes = [
          -1,
          0,
          2,
          99,
        ];

        for (
          const code
          of unknownCodes
        ) {
          expect(
            GeneratorVersion
              .fromCodeOrNull(
                code,
              ),
          ).toBeNull();
        }
      },
    );

    it(
      'should resolve V1 using strict fromCode',
      () => {
        expect(
          GeneratorVersion
            .fromCode(
              1,
            ),
        ).toBe(
          GeneratorVersion.V1,
        );
      },
    );

    it(
      'should reject unknown codes using strict fromCode',
      () => {
        expect(
          () =>
            GeneratorVersion
              .fromCode(
                2,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);