import {
  GenesisSeed,
} from '../seed/genesis-seed';

const UINT64_HEX_LENGTH =
  16;

const RAW_HEX_LENGTH =
  32;

const RANDOM_BYTE_LENGTH =
  16;

const PARSEABLE_PATTERN =
  /^[0-9a-fA-F]{4}(?:-[0-9a-fA-F]{4}){7}$/;

const CANONICAL_PATTERN =
  /^[0-9A-F]{4}(?:-[0-9A-F]{4}){7}$/;

export class UniverseSeedFormatError
  extends Error {

  constructor(
    value: string,
  ) {
    super(
      `UniverseSeed inválida: "${value}". ` +
      'El formato esperado es ' +
      'XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX.',
    );

    this.name =
      'UniverseSeedFormatError';
  }
}

export class UniverseSeed
  implements GenesisSeed {

  private constructor(
    private readonly high64:
      bigint,

    private readonly low64:
      bigint,
  ) {}

  static parse(
    value: string,
  ): UniverseSeed {
    if (
      !UniverseSeed.isValid(
        value,
      )
    ) {
      throw new UniverseSeedFormatError(
        value,
      );
    }

    const rawHex =
      value
        .replaceAll(
          '-',
          '',
        )
        .toUpperCase();

    const highHex =
      rawHex.slice(
        0,
        UINT64_HEX_LENGTH,
      );

    const lowHex =
      rawHex.slice(
        UINT64_HEX_LENGTH,
      );

    return new UniverseSeed(
      BigInt(
        `0x${highHex}`,
      ),
      BigInt(
        `0x${lowHex}`,
      ),
    );
  }

  static random():
    UniverseSeed {

    const cryptoApi =
      globalThis.crypto;

    if (
      !cryptoApi ||
      typeof cryptoApi
        .getRandomValues !==
        'function'
    ) {
      throw new Error(
        'No existe un generador criptográficamente seguro disponible para crear UniverseSeed.',
      );
    }

    const bytes =
      new Uint8Array(
        RANDOM_BYTE_LENGTH,
      );

    cryptoApi.getRandomValues(
      bytes,
    );

    let rawHex =
      '';

    for (
      const byte
      of bytes
    ) {
      rawHex +=
        byte
          .toString(16)
          .padStart(
            2,
            '0',
          )
          .toUpperCase();
    }

    return UniverseSeed.parse(
      UniverseSeed.formatRawHex(
        rawHex,
      ),
    );
  }

  static isValid(
    value: string,
  ): boolean {
    return PARSEABLE_PATTERN.test(
      value,
    );
  }

  static isCanonical(
    value: string,
  ): boolean {
    return CANONICAL_PATTERN.test(
      value,
    );
  }

  get normalizedValue():
    string {
    return this
      .toString()
      .replaceAll(
        '-',
        '',
      );
  }

  serialize():
    string {

    return this.toString();
  }

  copy():
    UniverseSeed {

    return new UniverseSeed(
      this.high64,
      this.low64,
    );
  }

  equals(
    other: UniverseSeed,
  ): boolean {
    return (
      this.high64 ===
        other.high64 &&
      this.low64 ===
        other.low64
    );
  }

  toString():
    string {

    const rawHex =
      this.high64
        .toString(16)
        .padStart(
          UINT64_HEX_LENGTH,
          '0',
        )
        .toUpperCase() +
      this.low64
        .toString(16)
        .padStart(
          UINT64_HEX_LENGTH,
          '0',
        )
        .toUpperCase();

    return UniverseSeed.formatRawHex(
      rawHex,
    );
  }

  private static formatRawHex(
    rawHex: string,
  ): string {
    if (
      rawHex.length !==
      RAW_HEX_LENGTH
    ) {
      throw new Error(
        'Una UniverseSeed debe contener exactamente 128 bits.',
      );
    }

    return (
      rawHex
        .match(/.{4}/g)
        ?.join('-') ??
      ''
    );
  }
}