const SIGNED_LONG_MAX =
  (1n << 63n) - 1n;

export const GLOBAL_PROGRESS_SCOPE_KEY =
  'GLOBAL';

export const ProgressScopeCode =
  Object.freeze({
    GLOBAL:
      0,

    GALAXY:
      1,
  } as const);

export type ProgressScopeCode =
  typeof ProgressScopeCode[
    keyof typeof ProgressScopeCode
  ];

export interface ProgressEntity {
  readonly universeSeed:
    string;

  readonly generatorVersionCode:
    number;

  readonly scopeCode:
    ProgressScopeCode;

  /**
   * GLOBAL for universe-wide progress.
   *
   * Decimal galaxyIndex for galaxy progress.
   */
  readonly scopeKey:
    string;

  /**
   * Decimal representation of a
   * non-negative signed 64-bit galaxy index.
   */
  readonly galaxyIndex:
    string | null;

  /**
   * Decimal representation of non-negative
   * signed 64-bit Discovery Points.
   */
  readonly discoveryPoints:
    string;

  readonly updatedAtEpochMs:
    number;
}

export interface GlobalProgressEntityInput {
  readonly universeSeed:
    string;

  readonly generatorVersionCode:
    number;

  readonly discoveryPoints:
    bigint;

  readonly updatedAtEpochMs:
    number;
}

export interface GalaxyProgressEntityInput {
  readonly universeSeed:
    string;

  readonly generatorVersionCode:
    number;

  readonly galaxyIndex:
    bigint;

  readonly discoveryPoints:
    bigint;

  readonly updatedAtEpochMs:
    number;
}

export function createGlobalProgressEntity(
  input:
    GlobalProgressEntityInput,
): ProgressEntity {

  return {
    universeSeed:
      input.universeSeed,

    generatorVersionCode:
      input.generatorVersionCode,

    scopeCode:
      ProgressScopeCode.GLOBAL,

    scopeKey:
      GLOBAL_PROGRESS_SCOPE_KEY,

    galaxyIndex:
      null,

    discoveryPoints:
      serializeNonNegativeLong(
        input.discoveryPoints,
        'discoveryPoints',
      ),

    updatedAtEpochMs:
      input.updatedAtEpochMs,
  };
}

export function createGalaxyProgressEntity(
  input:
    GalaxyProgressEntityInput,
): ProgressEntity {

  const galaxyIndex =
    serializeNonNegativeLong(
      input.galaxyIndex,
      'galaxyIndex',
    );

  return {
    universeSeed:
      input.universeSeed,

    generatorVersionCode:
      input.generatorVersionCode,

    scopeCode:
      ProgressScopeCode.GALAXY,

    scopeKey:
      galaxyIndex,

    galaxyIndex,

    discoveryPoints:
      serializeNonNegativeLong(
        input.discoveryPoints,
        'discoveryPoints',
      ),

    updatedAtEpochMs:
      input.updatedAtEpochMs,
  };
}

function serializeNonNegativeLong(
  value: bigint,
  name: string,
): string {

  if (
    value < 0n ||
    value > SIGNED_LONG_MAX
  ) {
    throw new RangeError(
      `${name} debe pertenecer al rango Long no negativo.`,
    );
  }

  return value.toString(
    10,
  );
}