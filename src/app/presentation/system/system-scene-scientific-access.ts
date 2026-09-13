import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

export const SystemSceneScientificDisclosureTier =
  Object.freeze({
    UNRESOLVED:
      'UNRESOLVED',
    IDENTIFIED_STELLAR:
      'IDENTIFIED_STELLAR',
    CATALOGUED_SYSTEM:
      'CATALOGUED_SYSTEM',
    CONFIRMED_SYSTEM:
      'CONFIRMED_SYSTEM',
  } as const);

export type SystemSceneScientificDisclosureTierValue =
  typeof SystemSceneScientificDisclosureTier[
    keyof typeof SystemSceneScientificDisclosureTier
  ];

export interface SystemSceneScientificAccess {
  readonly disclosureTier:
    SystemSceneScientificDisclosureTierValue;

  /** Whether the system has enough observed knowledge to render any star. */
  readonly identifiedStarsVisible:
    boolean;

  /** Whether planets, moons, minor bodies and scientific layers may be projected. */
  readonly resolvedSystemVisible:
    boolean;

  /**
   * Deep scientific fiches belong to individual-body research. They remain
   * locked while the host system is merely catalogued and unlock only after
   * the system reaches CONFIRMED.
   */
  readonly scientificBodyFichesUnlocked:
    boolean;
}

/**
 * Point-26.2 presentation access contract for SystemPage 3D.
 *
 * This function is intentionally derived only from persisted DiscoveryState.
 * It never reads Ground Truth and never promotes state by itself.
 */
export function systemSceneScientificAccess(
  discoveryStateCode:
    number,
): SystemSceneScientificAccess {

  if (
    discoveryStateCode <
    DiscoveryState.DISCOVERED.code
  ) {
    return Object.freeze({
      disclosureTier:
        SystemSceneScientificDisclosureTier.UNRESOLVED,
      identifiedStarsVisible:
        false,
      resolvedSystemVisible:
        false,
      scientificBodyFichesUnlocked:
        false,
    });
  }

  if (
    discoveryStateCode <
    DiscoveryState.CATALOGUED.code
  ) {
    return Object.freeze({
      disclosureTier:
        SystemSceneScientificDisclosureTier.IDENTIFIED_STELLAR,
      identifiedStarsVisible:
        true,
      resolvedSystemVisible:
        false,
      scientificBodyFichesUnlocked:
        false,
    });
  }

  if (
    discoveryStateCode <
    DiscoveryState.CONFIRMED.code
  ) {
    return Object.freeze({
      disclosureTier:
        SystemSceneScientificDisclosureTier.CATALOGUED_SYSTEM,
      identifiedStarsVisible:
        true,
      resolvedSystemVisible:
        true,
      scientificBodyFichesUnlocked:
        false,
    });
  }

  return Object.freeze({
    disclosureTier:
      SystemSceneScientificDisclosureTier.CONFIRMED_SYSTEM,
    identifiedStarsVisible:
      true,
    resolvedSystemVisible:
      true,
    scientificBodyFichesUnlocked:
      true,
  });
}
