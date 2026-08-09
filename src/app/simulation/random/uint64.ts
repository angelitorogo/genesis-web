export const UINT64_BITS =
  64;

export const UINT64_MAX =
  (1n << 64n) - 1n;

export const UINT64_MODULUS =
  1n << 64n;

export function uint64(
  value: bigint,
): bigint {
  return BigInt.asUintN(
    UINT64_BITS,
    value,
  );
}

export function addUint64(
  ...values: readonly bigint[]
): bigint {
  let result =
    0n;

  for (
    const value
    of values
  ) {
    result =
      uint64(
        result +
          value,
      );
  }

  return result;
}

export function multiplyUint64(
  left: bigint,
  right: bigint,
): bigint {
  return uint64(
    uint64(left) *
      uint64(right),
  );
}

export function xorUint64(
  left: bigint,
  right: bigint,
): bigint {
  return uint64(
    uint64(left) ^
      uint64(right),
  );
}

export function shiftLeftUint64(
  value: bigint,
  bits: number,
): bigint {
  validateShift(bits);

  return uint64(
    uint64(value) <<
      BigInt(bits),
  );
}

export function shiftRightUint64(
  value: bigint,
  bits: number,
): bigint {
  validateShift(bits);

  /*
   * BigInt no dispone de >>>.
   *
   * Al normalizar primero como uint64,
   * el valor siempre es no negativo y >>
   * equivale al desplazamiento lógico
   * unsigned que necesitamos.
   */
  return (
    uint64(value) >>
    BigInt(bits)
  );
}

export function rotateLeftUint64(
  value: bigint,
  bits: number,
): bigint {
  if (
    !Number.isInteger(bits)
  ) {
    throw new RangeError(
      'La rotación uint64 debe usar un número entero de bits.',
    );
  }

  const normalizedBits =
    (
      bits %
        UINT64_BITS +
      UINT64_BITS
    ) %
    UINT64_BITS;

  const normalizedValue =
    uint64(value);

  if (
    normalizedBits === 0
  ) {
    return normalizedValue;
  }

  const left =
    normalizedValue <<
    BigInt(
      normalizedBits,
    );

  const right =
    normalizedValue >>
    BigInt(
      UINT64_BITS -
        normalizedBits,
    );

  return uint64(
    left |
      right,
  );
}

function validateShift(
  bits: number,
): void {
  if (
    !Number.isInteger(bits) ||
    bits < 0 ||
    bits >= UINT64_BITS
  ) {
    throw new RangeError(
      'El desplazamiento uint64 debe estar entre 0 y 63 bits.',
    );
  }
}