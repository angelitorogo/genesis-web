import {
  type KnownDiscoveryStateCode,
} from '../discovery/discovery-state';

const V1 =
  Object.freeze({
    name:
      'V1',

    code:
      1,
  } as const);

export const BackupFormatVersion =
  Object.freeze({
    V1,
  });

export type BackupFormatVersionCode =
  typeof BackupFormatVersion.V1.code;

/**
 * Códigos portables V1 de DiscoveryTargetType.
 *
 * GALAXY = 1
 * SECTOR = 2
 * GALACTIC_OBJECT = 3
 * SYSTEM = 4
 * BODY = 5
 * CIVILIZATION = 6
 */
export type BackupDiscoveryTargetTypeCode =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6;

/**
 * Scopes portables V1 del progreso.
 *
 * GLOBAL = 0
 * GALAXY = 1
 *
 * Se define en domain/backup para no introducir
 * una dependencia desde domain hacia data/local.
 */
export type BackupProgressScopeCode =
  | 0
  | 1;

export interface GalaxyBackupEntry {
  readonly galaxyIndex:
    string;

  readonly discoveryStateCode:
    KnownDiscoveryStateCode;

  readonly firstKnownAtEpochMs:
    number;

  readonly updatedAtEpochMs:
    number;
}

export interface DiscoveryBackupEntry {
  readonly targetTypeCode:
    BackupDiscoveryTargetTypeCode;

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

  readonly discoveryStateCode:
    KnownDiscoveryStateCode;

  readonly firstKnownAtEpochMs:
    number;

  readonly updatedAtEpochMs:
    number;
}

export interface ObservationBackupEntry {
  readonly id:
    string;

  readonly targetTypeCode:
    BackupDiscoveryTargetTypeCode;

  readonly targetSeed:
    string;

  readonly observationKind:
    string;

  readonly payloadVersion:
    number;

  readonly payloadJson:
    string;

  readonly observedAtEpochMs:
    number;
}

export interface ProgressBackupEntry {
  readonly scopeCode:
    BackupProgressScopeCode;

  readonly scopeKey:
    string;

  readonly galaxyIndex:
    string | null;

  readonly discoveryPoints:
    string;

  readonly updatedAtEpochMs:
    number;
}

export interface NavigationBackupEntry {
  readonly activeGalaxyIndex:
    string;

  readonly recentGalaxyIndices:
    readonly string[];

  readonly updatedAtEpochMs:
    number;
}

export interface UniverseBackupSnapshot {
  readonly universeSeed:
    string;

  readonly generatorVersionCode:
    number;

  readonly createdAtEpochMs:
    number;

  readonly updatedAtEpochMs:
    number;

  readonly navigation:
    NavigationBackupEntry | null;

  readonly galaxies:
    readonly GalaxyBackupEntry[];

  readonly discoveries:
    readonly DiscoveryBackupEntry[];

  readonly observations:
    readonly ObservationBackupEntry[];

  readonly progress:
    readonly ProgressBackupEntry[];
}

export interface GenesisBackupSnapshot {
  readonly formatVersion:
    BackupFormatVersionCode;

  readonly exportedAtEpochMs:
    number;

  readonly universes:
    readonly UniverseBackupSnapshot[];
}

export interface GenesisBackupPort {
  createSnapshot():
    Promise<GenesisBackupSnapshot>;

  exportJson():
    Promise<string>;

  importSnapshot(
    snapshot:
      unknown,
  ): Promise<void>;

  importJson(
    json:
      string,
  ): Promise<void>;
}