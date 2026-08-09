import {
  addUint64,
  multiplyUint64,
  rotateLeftUint64,
  shiftLeftUint64,
  shiftRightUint64,
  UINT64_MAX,
  uint64,
} from './uint64';

describe(
  'uint64',
  () => {
    it(
      'should normalize values modulo 2^64',
      () => {
        expect(
          uint64(-1n),
        ).toBe(
          UINT64_MAX,
        );

        expect(
          uint64(
            UINT64_MAX +
              1n,
          ),
        ).toBe(0n);
      },
    );

    it(
      'should wrap uint64 addition',
      () => {
        expect(
          addUint64(
            UINT64_MAX,
            1n,
          ),
        ).toBe(0n);
      },
    );

    it(
      'should wrap uint64 multiplication',
      () => {
        expect(
          multiplyUint64(
            1n << 63n,
            2n,
          ),
        ).toBe(0n);
      },
    );

    it(
      'should perform logical uint64 shifts',
      () => {
        expect(
          shiftRightUint64(
            0x8000000000000000n,
            63,
          ),
        ).toBe(1n);

        expect(
          shiftLeftUint64(
            0x8000000000000000n,
            1,
          ),
        ).toBe(0n);
      },
    );

    it(
      'should rotate uint64 values to the left',
      () => {
        expect(
          rotateLeftUint64(
            0x0123456789ABCDEFn,
            8,
          ),
        ).toBe(
          0x23456789ABCDEF01n,
        );
      },
    );
  },
);