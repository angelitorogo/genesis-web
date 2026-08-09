import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  addUint64,
  multiplyUint64,
  rotateLeftUint64,
  shiftLeftUint64,
  shiftRightUint64,
  uint64,
  xorUint64,
} from './uint64';

const SEED_WORD_HEX_LENGTH =
  16;

const INITIAL_COUNTER =
  1n;

const WARMUP_ROUNDS =
  12;

const MIX_DOMAIN_CONSTANT =
  0xD1B54A32D192ED03n;

const MIX_MULTIPLIER_1 =
  0xBF58476D1CE4E5B9n;

const MIX_MULTIPLIER_2 =
  0x94D049BB133111EBn;

const DOUBLE_SHIFT =
  11;

const DOUBLE_DENOMINATOR =
  9_007_199_254_740_992;

const INT32_MAX =
  2_147_483_647;

export class Sfc64Random {
  private a:
    bigint;

  private b:
    bigint;

  private c:
    bigint;

  private counter:
    bigint;

  constructor(
    seed: UniverseSeed,
  ) {
    const {
      high64,
      low64,
    } =
      Sfc64Random.seedWords(
        seed,
      );

    this.a =
      uint64(high64);

    this.b =
      uint64(low64);

    this.c =
      mix64(
        xorUint64(
          xorUint64(
            high64,
            low64,
          ),
          MIX_DOMAIN_CONSTANT,
        ),
      );

    this.counter =
      INITIAL_COUNTER;

    for (
      let round = 0;
      round < WARMUP_ROUNDS;
      round += 1
    ) {
      this.nextUint64();
    }
  }

  /**
   * Devuelve los 64 bits crudos del siguiente
   * valor SFC64 como bigint unsigned.
   *
   * Rango:
   *
   * 0 <= value < 2^64
   */
  nextUint64():
    bigint {

    const result =
      addUint64(
        this.a,
        this.b,
        this.counter,
      );

    this.counter =
      addUint64(
        this.counter,
        1n,
      );

    this.a =
      xorUint64(
        this.b,
        shiftRightUint64(
          this.b,
          11,
        ),
      );

    this.b =
      addUint64(
        this.c,
        shiftLeftUint64(
          this.c,
          3,
        ),
      );

    this.c =
      addUint64(
        rotateLeftUint64(
          this.c,
          24,
        ),
        result,
      );

    return result;
  }

  /**
   * Entero uniforme en [0, bound).
   *
   * Replica el contrato unsigned de Android:
   *
   * boundUnsigned = bound.toULong()
   * threshold =
   *   (0UL - boundUnsigned) % boundUnsigned
   *
   * Se rechazan los valores inferiores al
   * threshold para eliminar modulo bias.
   */
  nextInt(
    bound: number,
  ): number {
    if (
      !Number.isInteger(bound) ||
      bound <= 0 ||
      bound > INT32_MAX
    ) {
      throw new RangeError(
        'bound debe ser un entero entre 1 y 2147483647.',
      );
    }

    const boundUnsigned =
      BigInt(bound);

    const threshold =
      (
        uint64(
          -boundUnsigned,
        )
      ) %
      boundUnsigned;

    while (true) {
      const random =
        this.nextUint64();

      if (
        random >=
        threshold
      ) {
        return Number(
          random %
            boundUnsigned,
        );
      }
    }
  }

  /**
   * Double determinista en [0, 1).
   *
   * Se utilizan los 53 bits superiores,
   * que caben exactamente en Number.
   */
  nextDouble():
    number {

    const bits53 =
      this.nextUint64() >>
      BigInt(
        DOUBLE_SHIFT,
      );

    return (
      Number(bits53) /
      DOUBLE_DENOMINATOR
    );
  }

  nextBoolean():
    boolean {

    return (
      this.nextUint64() &
        1n
    ) !== 0n;
  }

  private static seedWords(
    seed: UniverseSeed,
  ): {
    readonly high64:
      bigint;

    readonly low64:
      bigint;
  } {
    const normalized =
      seed
        .toString()
        .replaceAll(
          '-',
          '',
        );

    const highHex =
      normalized.slice(
        0,
        SEED_WORD_HEX_LENGTH,
      );

    const lowHex =
      normalized.slice(
        SEED_WORD_HEX_LENGTH,
      );

    return {
      high64:
        BigInt(
          `0x${highHex}`,
        ),

      low64:
        BigInt(
          `0x${lowHex}`,
        ),
    };
  }
}

function mix64(
  value: bigint,
): bigint {
  let mixed =
    uint64(value);

  mixed =
    xorUint64(
      mixed,
      shiftRightUint64(
        mixed,
        30,
      ),
    );

  mixed =
    multiplyUint64(
      mixed,
      MIX_MULTIPLIER_1,
    );

  mixed =
    xorUint64(
      mixed,
      shiftRightUint64(
        mixed,
        27,
      ),
    );

  mixed =
    multiplyUint64(
      mixed,
      MIX_MULTIPLIER_2,
    );

  mixed =
    xorUint64(
      mixed,
      shiftRightUint64(
        mixed,
        31,
      ),
    );

  return mixed;
}
