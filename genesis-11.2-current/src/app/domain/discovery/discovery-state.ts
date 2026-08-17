const UNKNOWN =
  Object.freeze({
    name:
      'UNKNOWN',

    code:
      0,
  } as const);

const DETECTED =
  Object.freeze({
    name:
      'DETECTED',

    code:
      1,
  } as const);

const DISCOVERED =
  Object.freeze({
    name:
      'DISCOVERED',

    code:
      2,
  } as const);

const VISITED =
  Object.freeze({
    name:
      'VISITED',

    code:
      3,
  } as const);

const CATALOGUED =
  Object.freeze({
    name:
      'CATALOGUED',

    code:
      4,
  } as const);

const CONFIRMED =
  Object.freeze({
    name:
      'CONFIRMED',

    code:
      5,
  } as const);

export type DiscoveryStateValue =
  | typeof UNKNOWN
  | typeof DETECTED
  | typeof DISCOVERED
  | typeof VISITED
  | typeof CATALOGUED
  | typeof CONFIRMED;

export type DiscoveryStateCode =
  DiscoveryStateValue[
    'code'
  ];

export type KnownDiscoveryState =
  Exclude<
    DiscoveryStateValue,
    typeof UNKNOWN
  >;

export type KnownDiscoveryStateCode =
  KnownDiscoveryState[
    'code'
  ];

const VALUES:
  readonly DiscoveryStateValue[] =
  Object.freeze([
    UNKNOWN,
    DETECTED,
    DISCOVERED,
    VISITED,
    CATALOGUED,
    CONFIRMED,
  ]);

const KNOWN_VALUES:
  readonly KnownDiscoveryState[] =
  Object.freeze([
    DETECTED,
    DISCOVERED,
    VISITED,
    CATALOGUED,
    CONFIRMED,
  ]);

export const DiscoveryState =
  Object.freeze({
    UNKNOWN,

    DETECTED,

    DISCOVERED,

    VISITED,

    CATALOGUED,

    CONFIRMED,

    values:
      VALUES,

    knownValues:
      KNOWN_VALUES,

    fromCodeOrNull(
      code: number,
    ): DiscoveryStateValue | null {

      switch (
        code
      ) {
        case 0:
          return UNKNOWN;

        case 1:
          return DETECTED;

        case 2:
          return DISCOVERED;

        case 3:
          return VISITED;

        case 4:
          return CATALOGUED;

        case 5:
          return CONFIRMED;

        default:
          return null;
      }
    },

    fromCode(
      code: number,
    ): DiscoveryStateValue {

      const state =
        this.fromCodeOrNull(
          code,
        );

      if (
        state ===
        null
      ) {
        throw new RangeError(
          `Unknown DiscoveryState code: ${code}`,
        );
      }

      return state;
    },

    isKnown(
      state:
        DiscoveryStateValue,
    ): state is KnownDiscoveryState {

      return (
        state.code >
        UNKNOWN.code
      );
    },
  });