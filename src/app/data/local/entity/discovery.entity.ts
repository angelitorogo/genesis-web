import {
  DiscoveryState,
  type DiscoveryStateValue,
  type KnownDiscoveryStateCode,
} from '../../../domain/discovery/discovery-state';

import {
  attachDiscoverySectorCoordinates,
  type DiscoverySectorCoordinatesFields,
} from './discovery-sector-coordinates';

export interface DiscoveryEntity {
  readonly universeSeed:
    string;

  readonly generatorVersionCode:
    number;

  readonly targetTypeCode:
    number;

  readonly targetSeed:
    string;

  readonly galaxyIndex:
    string;

  readonly sectorKey:
    string | null;

  readonly galacticObjectIndex:
    string | null;

  readonly bodyIndex:
    string | null;

  readonly civilizationIndex:
    string | null;

  /**
   * UNKNOWN is never materialized.
   *
   * Persisted values are:
   * 1 DETECTED
   * 2 DISCOVERED
   * 3 VISITED
   * 4 CATALOGUED
   * 5 CONFIRMED
   */
  readonly discoveryStateCode:
    KnownDiscoveryStateCode;

  readonly firstKnownAtEpochMs:
    number;

  readonly updatedAtEpochMs:
    number;
}

/**
 * Current IndexedDB representation from schema V3 onward.
 *
 * sectorX / sectorY are derived from sectorKey and therefore
 * never constitute a second procedural source of truth.
 */
export interface PersistedDiscoveryEntityV3
  extends DiscoveryEntity,
    DiscoverySectorCoordinatesFields {}

export interface DiscoveryEntityInput {
  readonly universeSeed:
    string;

  readonly generatorVersionCode:
    number;

  readonly targetTypeCode:
    number;

  readonly targetSeed:
    string;

  readonly galaxyIndex:
    string;

  readonly sectorKey:
    string | null;

  readonly galacticObjectIndex:
    string | null;

  readonly bodyIndex:
    string | null;

  readonly civilizationIndex:
    string | null;

  readonly state:
    DiscoveryStateValue;

  readonly firstKnownAtEpochMs:
    number;

  readonly updatedAtEpochMs:
    number;
}

/**
 * Converts observed discovery knowledge into
 * its persisted representation.
 *
 * UNKNOWN is represented by absence of row.
 */
export function createDiscoveryEntity(
  input:
    DiscoveryEntityInput,
): PersistedDiscoveryEntityV3 | null {

  const state =
    DiscoveryState.fromCode(
      input.state.code,
    );

  if (
    !DiscoveryState.isKnown(
      state,
    )
  ) {
    return null;
  }

  return attachDiscoverySectorCoordinates({
    universeSeed:
      input.universeSeed,

    generatorVersionCode:
      input.generatorVersionCode,

    targetTypeCode:
      input.targetTypeCode,

    targetSeed:
      input.targetSeed,

    galaxyIndex:
      input.galaxyIndex,

    sectorKey:
      input.sectorKey,

    galacticObjectIndex:
      input.galacticObjectIndex,

    bodyIndex:
      input.bodyIndex,

    civilizationIndex:
      input.civilizationIndex,

    discoveryStateCode:
      state.code,

    firstKnownAtEpochMs:
      input.firstKnownAtEpochMs,

    updatedAtEpochMs:
      input.updatedAtEpochMs,
  });
}

/**
 * Converts persisted state back to the
 * domain discovery state.
 *
 * Missing row means UNKNOWN.
 */
export function discoveryStateFromEntity(
  entity:
    DiscoveryEntity | undefined,
): DiscoveryStateValue {

  if (
    entity ===
    undefined
  ) {
    return DiscoveryState
      .UNKNOWN;
  }

  return DiscoveryState
    .fromCode(
      entity
        .discoveryStateCode,
    );
}