import {
  type KnownDiscoveryStateCode,
} from '../../../domain/discovery/discovery-state';

export interface GalaxyEntity {
  readonly universeSeed:
    string;

  readonly generatorVersionCode:
    number;

  /**
   * Decimal representation of the signed
   * 64-bit procedural galaxy index.
   */
  readonly galaxyIndex:
    string;

  /**
   * A materialized galaxy row represents
   * known/observed knowledge.
   *
   * UNKNOWN is represented by absence.
   */
  readonly discoveryStateCode:
    KnownDiscoveryStateCode;

  readonly firstKnownAtEpochMs:
    number;

  readonly updatedAtEpochMs:
    number;
}