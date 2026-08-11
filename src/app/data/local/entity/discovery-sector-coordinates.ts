import {
  GalaxySectorKeyCodec,
} from '../../../domain/sector/galaxy-sector-key-codec';

const LONG_MIN =
  -(1n << 63n);

const LONG_MAX =
  (1n << 63n) - 1n;

export interface DiscoverySectorCoordinatesFields {
  readonly sectorX:
    number | null;

  readonly sectorY:
    number | null;
}

export interface DiscoverySectorCoordinatesCarrier {
  readonly sectorKey:
    string | null;

  readonly sectorX?:
    unknown;

  readonly sectorY?:
    unknown;
}

export class CorruptDiscoverySectorCoordinatesError
  extends Error {

  constructor(
    message:
      string,
  ) {
    super(
      message,
    );

    this.name =
      'CorruptDiscoverySectorCoordinatesError';
  }
}

export function deriveDiscoverySectorCoordinates(
  sectorKey:
    string | null,
): DiscoverySectorCoordinatesFields {

  if (
    sectorKey ===
    null
  ) {
    return {
      sectorX:
        null,

      sectorY:
        null,
    };
  }

  const parsedSectorKey =
    parseCanonicalSignedLong(
      sectorKey,
      'sectorKey',
    );

  const coordinates =
    GalaxySectorKeyCodec
      .decode(
        parsedSectorKey,
      );

  return {
    sectorX:
      coordinates.x,

    sectorY:
      coordinates.y,
  };
}

export function attachDiscoverySectorCoordinates<
  T extends {
    readonly sectorKey:
      string | null;
  },
>(
  value:
    T,
): T & DiscoverySectorCoordinatesFields {

  return {
    ...value,

    ...deriveDiscoverySectorCoordinates(
      value.sectorKey,
    ),
  };
}

export function assertPersistedDiscoverySectorCoordinates(
  value:
    DiscoverySectorCoordinatesCarrier,
): asserts value is
  DiscoverySectorCoordinatesCarrier &
  DiscoverySectorCoordinatesFields {

  const expected =
    deriveDiscoverySectorCoordinates(
      value.sectorKey,
    );

  if (
    value.sectorX !==
      expected.sectorX ||
    value.sectorY !==
      expected.sectorY
  ) {
    throw new CorruptDiscoverySectorCoordinatesError(
      [
        'Persisted discovery sector coordinates do not match sectorKey.',
        `sectorKey=${value.sectorKey ?? 'null'}`,
        `expected=(${expected.sectorX ?? 'null'},${expected.sectorY ?? 'null'})`,
        `actual=(${formatCoordinate(value.sectorX)},${formatCoordinate(value.sectorY)})`,
      ].join(' '),
    );
  }
}

function parseCanonicalSignedLong(
  value:
    string,

  name:
    string,
): bigint {

  let parsed:
    bigint;

  try {
    parsed =
      BigInt(
        value,
      );
  } catch {
    throw new CorruptDiscoverySectorCoordinatesError(
      `${name} is not a valid decimal Long.`,
    );
  }

  if (
    parsed < LONG_MIN ||
    parsed > LONG_MAX
  ) {
    throw new CorruptDiscoverySectorCoordinatesError(
      `${name} is outside the signed Long range.`,
    );
  }

  if (
    parsed.toString(
      10,
    ) !==
    value
  ) {
    throw new CorruptDiscoverySectorCoordinatesError(
      `${name} is not in canonical decimal form.`,
    );
  }

  return parsed;
}

function formatCoordinate(
  value:
    unknown,
): string {

  if (
    value ===
    undefined
  ) {
    return 'missing';
  }

  if (
    value ===
    null
  ) {
    return 'null';
  }

  return String(
    value,
  );
}