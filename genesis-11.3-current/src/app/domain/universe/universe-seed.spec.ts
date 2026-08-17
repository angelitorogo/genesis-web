import {
  UniverseSeed,
  UniverseSeedFormatError,
} from './universe-seed';

describe(
  'UniverseSeed',
  () => {
    const canonical =
      '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1';

    it(
      'should parse a canonical 128-bit seed',
      () => {
        const seed =
          UniverseSeed.parse(
            canonical,
          );

        expect(
          seed.toString(),
        ).toBe(
          canonical,
        );
      },
    );

    it(
      'should normalize lowercase input to canonical uppercase',
      () => {
        const seed =
          UniverseSeed.parse(
            canonical.toLowerCase(),
          );

        expect(
          seed.toString(),
        ).toBe(
          canonical,
        );
      },
    );

    it(
      'should support the zero 128-bit seed',
      () => {
        const zero =
          '0000-0000-0000-0000-0000-0000-0000-0000';

        expect(
          UniverseSeed
            .parse(zero)
            .toString(),
        ).toBe(
          zero,
        );
      },
    );

    it(
      'should support the maximum 128-bit seed',
      () => {
        const maximum =
          'FFFF-FFFF-FFFF-FFFF-FFFF-FFFF-FFFF-FFFF';

        expect(
          UniverseSeed
            .parse(maximum)
            .toString(),
        ).toBe(
          maximum,
        );
      },
    );

    it(
      'should reject malformed seeds',
      () => {
        const invalidValues = [
          '',
          'GENESIS',
          '0000',
          '0000-0000',
          '7F21A9D418CE4B7092F16A0C6E35D8B1',
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35',
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1-FFFF',
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8BG',
          ' 7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ];

        for (
          const value
          of invalidValues
        ) {
          expect(
            () =>
              UniverseSeed.parse(
                value,
              ),
          ).toThrow(
            UniverseSeedFormatError,
          );
        }
      },
    );

    it(
      'should validate parseable seeds',
      () => {
        expect(
          UniverseSeed.isValid(
            canonical,
          ),
        ).toBe(true);

        expect(
          UniverseSeed.isValid(
            canonical.toLowerCase(),
          ),
        ).toBe(true);

        expect(
          UniverseSeed.isValid(
            'INVALID',
          ),
        ).toBe(false);
      },
    );

    it(
      'should distinguish canonical representation',
      () => {
        expect(
          UniverseSeed.isCanonical(
            canonical,
          ),
        ).toBe(true);

        expect(
          UniverseSeed.isCanonical(
            canonical.toLowerCase(),
          ),
        ).toBe(false);
      },
    );

    it(
      'should create an independent copy with the same value',
      () => {
        const seed =
          UniverseSeed.parse(
            canonical,
          );

        const copy =
          seed.copy();

        expect(
          copy,
        ).not.toBe(
          seed,
        );

        expect(
          copy.equals(seed),
        ).toBe(true);

        expect(
          copy.toString(),
        ).toBe(
          canonical,
        );
      },
    );

    it(
      'should compare seeds by their 128-bit value',
      () => {
        const first =
          UniverseSeed.parse(
            canonical,
          );

        const same =
          UniverseSeed.parse(
            canonical.toLowerCase(),
          );

        const different =
          UniverseSeed.parse(
            '0000-0000-0000-0000-0000-0000-0000-0001',
          );

        expect(
          first.equals(same),
        ).toBe(true);

        expect(
          first.equals(different),
        ).toBe(false);
      },
    );

    it(
      'should generate a random canonical 128-bit seed',
      () => {
        const seed =
          UniverseSeed.random();

        const value =
          seed.toString();

        expect(
          UniverseSeed.isCanonical(
            value,
          ),
        ).toBe(true);

        expect(
          value.length,
        ).toBe(39);
      },
    );

    it(
      'should serialize using the canonical representation',
      () => {
        const seed =
          UniverseSeed.parse(
            canonical.toLowerCase(),
          );

        expect(
          seed.serialize(),
        ).toBe(
          canonical,
        );
      },
    );

  },
);