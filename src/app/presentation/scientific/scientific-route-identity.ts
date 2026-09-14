const MASK_64 =
  (1n << 64n) - 1n;

const FNV_PRIME_64 =
  1_099_511_628_211n;

const FNV_OFFSET_BASIS_64 =
  14_695_981_039_346_656_037n;

const SECOND_OFFSET_BASIS_64 =
  7_809_847_782_465_536_322n;

export const SCIENTIFIC_ROUTE_UNIVERSE_QUERY_PARAM =
  'u';

export interface ScientificRouteQueryParams {
  readonly u:
    string;
}

/**
 * Public, deterministic route reference for a persisted universe generation.
 *
 * The raw universe seed is deliberately not emitted in shareable scientific
 * URLs. This 128-bit opaque fingerprint is only used to match an already
 * persisted UniverseGenerationKey; it is never accepted as generation input.
 */
export function scientificRouteUniverseRef(
  universeSeed:
    string,

  generatorVersionCode:
    number,
): string {

  if (
    universeSeed.trim().length ===
      0
  ) {
    throw new RangeError(
      'universeSeed cannot be blank when building a scientific route reference.',
    );
  }

  if (
    !Number.isSafeInteger(
      generatorVersionCode,
    ) ||
    generatorVersionCode <=
      0
  ) {
    throw new RangeError(
      'generatorVersionCode must be a positive safe integer.',
    );
  }

  const source =
    `${universeSeed}|v${generatorVersionCode}`;

  const left =
    fnv1a64(
      source,
      FNV_OFFSET_BASIS_64,
    );

  const right =
    fnv1a64(
      `GENESIS|${source}`,
      SECOND_OFFSET_BASIS_64,
    );

  return `${hex64(left)}${hex64(right)}`;
}

export function scientificRouteQueryParams(
  universeSeed:
    string,

  generatorVersionCode:
    number,
): Readonly<ScientificRouteQueryParams> {

  return Object.freeze({
    u:
      scientificRouteUniverseRef(
        universeSeed,
        generatorVersionCode,
      ),
  });
}

export function isScientificRouteUniverseRef(
  value:
    string | null,
): value is string {

  return value !==
    null &&
    /^[0-9A-F]{32}$/.test(
      value,
    );
}

function fnv1a64(
  value:
    string,

  offsetBasis:
    bigint,
): bigint {

  let hash =
    offsetBasis &
    MASK_64;

  const bytes =
    new TextEncoder()
      .encode(
        value,
      );

  for (
    const byte of
      bytes
  ) {
    hash ^=
      BigInt(
        byte,
      );

    hash =
      hash *
      FNV_PRIME_64 &
      MASK_64;
  }

  return hash;
}

function hex64(
  value:
    bigint,
): string {

  return value
    .toString(
      16,
    )
    .toUpperCase()
    .padStart(
      16,
      '0',
    );
}
