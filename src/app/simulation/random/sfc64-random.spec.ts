import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  Sfc64Random,
} from './sfc64-random';

describe(
  'Sfc64Random',
  () => {
    const canonicalSeed =
      UniverseSeed.parse(
        '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
      );

    const expectedUint64Sequence = [
      '7AA3326A3671994E',
      '252D3D0DA1C89BA2',
      '98ED90416CA62029',
      'D0D2FD05833601AE',
      '229118A5F6B5ABF2',
      '4AF3B4689B465EA1',
      '7E746EB987000C9F',
      '8F58D85FEF3BBB4F',
      'AF2D01FC9AF30478',
      '6934E6ED1D75D47B',
    ];

    it(
      'should produce the expected SFC64 sequence',
      () => {
        const random =
          new Sfc64Random(
            canonicalSeed,
          );

        const values =
          expectedUint64Sequence.map(
            () =>
              random
                .nextUint64()
                .toString(16)
                .padStart(
                  16,
                  '0',
                )
                .toUpperCase(),
          );

        expect(
          values,
        ).toEqual(
          expectedUint64Sequence,
        );
      },
    );

    it(
      'should produce identical sequences from identical seeds',
      () => {
        const first =
          new Sfc64Random(
            canonicalSeed,
          );

        const second =
          new Sfc64Random(
            canonicalSeed.copy(),
          );

        for (
          let index = 0;
          index < 128;
          index += 1
        ) {
          expect(
            first.nextUint64(),
          ).toBe(
            second.nextUint64(),
          );
        }
      },
    );

    it(
      'should produce different sequences from different seeds',
      () => {
        const first =
          new Sfc64Random(
            canonicalSeed,
          );

        const second =
          new Sfc64Random(
            UniverseSeed.parse(
              '0000-0000-0000-0000-0000-0000-0000-0001',
            ),
          );

        const firstValues =
          Array.from(
            {
              length: 8,
            },
            () =>
              first.nextUint64(),
          );

        const secondValues =
          Array.from(
            {
              length: 8,
            },
            () =>
              second.nextUint64(),
          );

        expect(
          firstValues,
        ).not.toEqual(
          secondValues,
        );
      },
    );

    it(
      'should always return unsigned 64-bit values',
      () => {
        const random =
          new Sfc64Random(
            canonicalSeed,
          );

        const maximum =
          1n << 64n;

        for (
          let index = 0;
          index < 1024;
          index += 1
        ) {
          const value =
            random.nextUint64();

          expect(
            value,
          ).toBeGreaterThanOrEqual(
            0n,
          );

          expect(
            value,
          ).toBeLessThan(
            maximum,
          );
        }
      },
    );

    it(
      'should produce the expected 53-bit doubles',
      () => {
        const random =
          new Sfc64Random(
            canonicalSeed,
          );

        const values = [
          random.nextDouble(),
          random.nextDouble(),
          random.nextDouble(),
          random.nextDouble(),
          random.nextDouble(),
        ];

        expect(
          values,
        ).toEqual([
          0.4790526875789908,
          0.14522153456508347,
          0.5973749313094676,
          0.815719426961742,
          0.13502649356697438,
        ]);
      },
    );

    it(
      'should keep nextDouble inside [0, 1)',
      () => {
        const random =
          new Sfc64Random(
            canonicalSeed,
          );

        for (
          let index = 0;
          index < 2048;
          index += 1
        ) {
          const value =
            random.nextDouble();

          expect(
            value,
          ).toBeGreaterThanOrEqual(
            0,
          );

          expect(
            value,
          ).toBeLessThan(
            1,
          );
        }
      },
    );

    it(
      'should derive booleans from the least significant bit',
      () => {
        const random =
          new Sfc64Random(
            canonicalSeed,
          );

        const values =
          Array.from(
            {
              length: 10,
            },
            () =>
              random.nextBoolean(),
          );

        expect(
          values,
        ).toEqual([
          false,
          false,
          true,
          false,
          false,
          true,
          true,
          true,
          false,
          true,
        ]);
      },
    );

    it(
      'should generate deterministic bounded integers without modulo bias',
      () => {
        const random =
          new Sfc64Random(
            canonicalSeed,
          );

        const values =
          Array.from(
            {
              length: 10,
            },
            () =>
              random.nextInt(
                10,
              ),
          );

        expect(
          values,
        ).toEqual([
          4,
          4,
          5,
          6,
          8,
          1,
          3,
          1,
          4,
          5,
        ]);
      },
    );

    it(
      'should keep bounded integers inside the requested range',
      () => {
        const random =
          new Sfc64Random(
            canonicalSeed,
          );

        const bounds = [
          1,
          2,
          3,
          10,
          100,
          1_000_000,
          2_147_483_647,
        ];

        for (
          const bound
          of bounds
        ) {
          for (
            let index = 0;
            index < 256;
            index += 1
          ) {
            const value =
              random.nextInt(
                bound,
              );

            expect(
              value,
            ).toBeGreaterThanOrEqual(
              0,
            );

            expect(
              value,
            ).toBeLessThan(
              bound,
            );
          }
        }
      },
    );

    it(
      'should reject invalid nextInt bounds',
      () => {
        const random =
          new Sfc64Random(
            canonicalSeed,
          );

        const invalid = [
          0,
          -1,
          1.5,
          Number.NaN,
          Number.POSITIVE_INFINITY,
          2_147_483_648,
        ];

        for (
          const bound
          of invalid
        ) {
          expect(
            () =>
              random.nextInt(
                bound,
              ),
          ).toThrow(
            RangeError,
          );
        }
      },
    );
  },
);