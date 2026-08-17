import {
  DiscoveryState,
  type DiscoveryStateValue,
} from '../discovery/discovery-state';

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

export type GalaxyKnowledgeStateValue =
  | typeof UNKNOWN
  | typeof DETECTED
  | typeof DISCOVERED
  | typeof VISITED;

export type GalaxyKnowledgeStateCode =
  GalaxyKnowledgeStateValue[
    'code'
  ];

const VALUES:
  readonly GalaxyKnowledgeStateValue[] =
  Object.freeze([
    UNKNOWN,
    DETECTED,
    DISCOVERED,
    VISITED,
  ]);

/**
 * Point-11.2 four-state lifecycle used specifically by galaxy catalogue/focus
 * presentation.
 *
 * This does NOT replace the global DiscoveryState contract. It is a projection:
 *
 * - UNKNOWN    <- DiscoveryState.UNKNOWN
 * - DETECTED   <- DiscoveryState.DETECTED
 * - DISCOVERED <- DiscoveryState.DISCOVERED
 * - VISITED    <- DiscoveryState.VISITED, CATALOGUED or CONFIRMED
 *
 * UNKNOWN remains represented by absence from persisted known discoveries.
 * Therefore this projection must never be used to materialize unknown galaxies.
 */
export const GalaxyKnowledgeState =
  Object.freeze({
    UNKNOWN,

    DETECTED,

    DISCOVERED,

    VISITED,

    values:
      VALUES,

    fromCodeOrNull(
      code:
        number,
    ): GalaxyKnowledgeStateValue | null {

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

        default:
          return null;
      }
    },

    fromCode(
      code:
        number,
    ): GalaxyKnowledgeStateValue {

      const state =
        this.fromCodeOrNull(
          code,
        );

      if (
        state ===
        null
      ) {
        throw new RangeError(
          `Unknown GalaxyKnowledgeState code: ${code}`,
        );
      }

      return state;
    },

    fromDiscoveryState(
      discoveryState:
        DiscoveryStateValue,
    ): GalaxyKnowledgeStateValue {

      const canonical =
        DiscoveryState
          .fromCode(
            discoveryState.code,
          );

      if (
        canonical ===
        DiscoveryState.UNKNOWN
      ) {
        return UNKNOWN;
      }

      if (
        canonical ===
        DiscoveryState.DETECTED
      ) {
        return DETECTED;
      }

      if (
        canonical ===
        DiscoveryState.DISCOVERED
      ) {
        return DISCOVERED;
      }

      return VISITED;
    },
  });
