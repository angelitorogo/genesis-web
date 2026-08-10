import {
  GENESIS_STORAGE_CRITICAL_PRESSURE_RATIO,
  GENESIS_STORAGE_HIGH_PRESSURE_RATIO,
  GenesisStorageAvailability,
  GenesisStorageContinuity,
  GenesisStorageFailureCode,
  GenesisStorageOperatingMode,
  GenesisStoragePersistence,
  GenesisStoragePressure,
  GenesisStorageWritePolicy,
  type GenesisStorageFailure,
  type GenesisStorageFailureCodeValue,
  type GenesisStorageHealthSnapshot,
  type GenesisStoragePersistenceValue,
  type GenesisStoragePressureValue,
  type GenesisStorageQuotaSnapshot,
} from '../../../domain/storage/genesis-storage-health';

import {
  GenesisIndexedDb,
} from '../indexed-db/genesis-indexed-db';

import {
  GENESIS_INDEXED_DB_SCHEMA_VERSION,
  GENESIS_STORAGE_FORMAT_VERSION,
} from '../indexed-db/genesis-indexed-db-schema';

const CONTINUITY_LOCAL_STORAGE_KEY =
  'genesis-web:indexeddb-continuity:v1';

const CONTINUITY_METADATA_PREFIX =
  'continuity:v1:';

const MAX_CONTINUITY_ID_LENGTH =
  200;

export interface BrowserStorageEstimateLike {
  readonly usage?:
    number;

  readonly quota?:
    number;
}

export interface BrowserStorageManagerLike {
  estimate?():
    Promise<BrowserStorageEstimateLike>;

  persisted?():
    Promise<boolean>;

  persist?():
    Promise<boolean>;
}

export interface KeyValueStorageLike {
  getItem(
    key:
      string,
  ): string | null;

  setItem(
    key:
      string,

    value:
      string,
  ): void;

  removeItem(
    key:
      string,
  ): void;
}

export interface GenesisBrowserStorageDependencies {
  readonly hasIndexedDb:
    () => boolean;

  readonly storageManager:
    BrowserStorageManagerLike | null;

  readonly continuityStore:
    KeyValueStorageLike | null;

  readonly createContinuityId:
    () => string;

  readonly clock:
    () => number;
}

type ContinuityMarkerRead =
  | {
      readonly status:
        'MISSING';
    }
  | {
      readonly status:
        'PRESENT';

      readonly id:
        string;
    }
  | {
      readonly status:
        'UNAVAILABLE';
    }
  | {
      readonly status:
        'INVALID';
    };

export class GenesisBrowserStorageService {

  constructor(
    private readonly database:
      GenesisIndexedDb,

    private readonly dependencies:
      GenesisBrowserStorageDependencies =
        createDefaultBrowserStorageDependencies(),
  ) {}

  async inspect():
    Promise<GenesisStorageHealthSnapshot> {

    const [
      quota,
      persistence,
    ] =
      await Promise.all([
        this.inspectQuota(),
        this.inspectPersistence(),
      ]);

    if (
      !this.hasIndexedDb()
    ) {
      return unavailableSnapshot(
        quota,
        persistence,
        {
          code:
            GenesisStorageFailureCode
              .INDEXED_DB_UNAVAILABLE,

          message:
            'IndexedDB no está disponible en este navegador o contexto.',
        },
      );
    }

    try {
      await this.database
        .openDatabase();
    } catch (
      error: unknown
    ) {
      return unavailableSnapshot(
        quota,
        persistence,
        storageFailureFrom(
          error,
          'No se ha podido abrir IndexedDB.',
        ),
      );
    }

    let continuity:
      typeof GenesisStorageContinuity[
        keyof typeof GenesisStorageContinuity
      ];

    try {
      continuity =
        await this.inspectContinuity();
    } catch (
      error: unknown
    ) {
      const failure =
        storageFailureFrom(
          error,
          'No se ha podido verificar la continuidad del almacenamiento.',
        );

      if (
        failure.code ===
        GenesisStorageFailureCode
          .QUOTA_EXCEEDED
      ) {
        return {
          availability:
            GenesisStorageAvailability
              .AVAILABLE,

          continuity:
            GenesisStorageContinuity
              .UNVERIFIABLE,

          persistence,

          pressure:
            classifyStoragePressure(
              quota,
            ),

          operatingMode:
            GenesisStorageOperatingMode
              .LIMITED,

          writePolicy:
            GenesisStorageWritePolicy
              .BLOCKED,

          quota,

          canReadPersistedProgress:
            true,

          canWritePersistedProgress:
            false,

          shouldOfferBackupRestore:
            false,

          failure,
        };
      }

      return unavailableSnapshot(
        quota,
        persistence,
        failure,
      );
    }

    if (
      continuity ===
      GenesisStorageContinuity
        .CLEARED
    ) {
      return {
        availability:
          GenesisStorageAvailability
            .CLEARED,

        continuity:
          GenesisStorageContinuity
            .CLEARED,

        persistence,

        pressure:
          classifyStoragePressure(
            quota,
          ),

        operatingMode:
          GenesisStorageOperatingMode
            .RECOVERY_REQUIRED,

        writePolicy:
          GenesisStorageWritePolicy
            .BLOCKED,

        quota,

        canReadPersistedProgress:
          false,

        canWritePersistedProgress:
          false,

        shouldOfferBackupRestore:
          true,

        failure: {
          code:
            GenesisStorageFailureCode
              .INDEXED_DB_CLEARED,

          message:
            'Se ha detectado que el almacenamiento IndexedDB de GENESIS fue eliminado o recreado.',
        },
      };
    }

    const pressure =
      classifyStoragePressure(
        quota,
      );

    const limited =
      pressure ===
        GenesisStoragePressure.HIGH ||
      pressure ===
        GenesisStoragePressure.CRITICAL;

    return {
      availability:
        GenesisStorageAvailability
          .AVAILABLE,

      continuity,

      persistence,

      pressure,

      operatingMode:
        limited
          ? GenesisStorageOperatingMode
              .LIMITED
          : GenesisStorageOperatingMode
              .NORMAL,

      writePolicy:
        limited
          ? GenesisStorageWritePolicy
              .ESSENTIAL_ONLY
          : GenesisStorageWritePolicy
              .NORMAL,

      quota,

      canReadPersistedProgress:
        true,

      canWritePersistedProgress:
        true,

      shouldOfferBackupRestore:
        false,

      failure:
        null,
    };
  }

  async requestPersistentStorage():
    Promise<GenesisStoragePersistenceValue> {

    const manager =
      this.dependencies
        .storageManager;

    if (
      manager ===
        null ||
      typeof manager.persist !==
        'function'
    ) {
      return GenesisStoragePersistence
        .UNSUPPORTED;
    }

    try {
      const granted =
        await manager
          .persist();

      return granted
        ? GenesisStoragePersistence
            .PERSISTENT
        : GenesisStoragePersistence
            .BEST_EFFORT;
    } catch {
      return GenesisStoragePersistence
        .UNKNOWN;
    }
  }

  async establishFreshContinuityAfterRecovery():
    Promise<boolean> {

    if (
      !this.hasIndexedDb()
    ) {
      return false;
    }

    const store =
      this.dependencies
        .continuityStore;

    if (
      store ===
      null
    ) {
      return false;
    }

    try {
      await this.database
        .openDatabase();

      const continuityId =
        this.createContinuityId();

      await this.writeContinuityMetadata(
        continuityId,
      );

      store.setItem(
        CONTINUITY_LOCAL_STORAGE_KEY,
        continuityId,
      );

      return true;
    } catch {
      return false;
    }
  }

  private hasIndexedDb():
    boolean {

    try {
      return this.dependencies
        .hasIndexedDb();
    } catch {
      return false;
    }
  }

  private async inspectQuota():
    Promise<GenesisStorageQuotaSnapshot> {

    const manager =
      this.dependencies
        .storageManager;

    if (
      manager ===
        null ||
      typeof manager.estimate !==
        'function'
    ) {
      return emptyQuotaSnapshot();
    }

    try {
      const estimate =
        await manager
          .estimate();

      const usageBytes =
        normalizeNonNegativeFiniteNumber(
          estimate.usage,
        );

      const quotaBytes =
        normalizePositiveFiniteNumber(
          estimate.quota,
        );

      const usageRatio =
        usageBytes !==
          null &&
        quotaBytes !==
          null
          ? usageBytes /
            quotaBytes
          : null;

      return {
        usageBytes,
        quotaBytes,
        usageRatio,
      };
    } catch {
      return emptyQuotaSnapshot();
    }
  }

  private async inspectPersistence():
    Promise<GenesisStoragePersistenceValue> {

    const manager =
      this.dependencies
        .storageManager;

    if (
      manager ===
        null ||
      typeof manager.persisted !==
        'function'
    ) {
      return GenesisStoragePersistence
        .UNSUPPORTED;
    }

    try {
      const persisted =
        await manager
          .persisted();

      return persisted
        ? GenesisStoragePersistence
            .PERSISTENT
        : GenesisStoragePersistence
            .BEST_EFFORT;
    } catch {
      return GenesisStoragePersistence
        .UNKNOWN;
    }
  }

  private async inspectContinuity():
    Promise<
      typeof GenesisStorageContinuity[
        keyof typeof GenesisStorageContinuity
      ]
    > {

    const marker =
      this.readContinuityMarker();

    switch (
      marker.status
    ) {
      case 'UNAVAILABLE':
      case 'INVALID':
        return GenesisStorageContinuity
          .UNVERIFIABLE;

      case 'MISSING': {
        const continuityId =
          this.createContinuityId();

        await this.writeContinuityMetadata(
          continuityId,
        );

        const store =
          this.dependencies
            .continuityStore;

        if (
          store ===
          null
        ) {
          return GenesisStorageContinuity
            .UNVERIFIABLE;
        }

        try {
          store.setItem(
            CONTINUITY_LOCAL_STORAGE_KEY,
            continuityId,
          );
        } catch {
          return GenesisStorageContinuity
            .UNVERIFIABLE;
        }

        return GenesisStorageContinuity
          .INITIALIZED;
      }

      case 'PRESENT': {
        const persistedMarker =
          await this.database
            .metadata
            .get(
              continuityMetadataKey(
                marker.id,
              ),
            );

        return persistedMarker ===
          undefined
          ? GenesisStorageContinuity
              .CLEARED
          : GenesisStorageContinuity
              .INTACT;
      }
    }
  }

  private readContinuityMarker():
    ContinuityMarkerRead {

    const store =
      this.dependencies
        .continuityStore;

    if (
      store ===
      null
    ) {
      return {
        status:
          'UNAVAILABLE',
      };
    }

    let raw:
      string | null;

    try {
      raw =
        store.getItem(
          CONTINUITY_LOCAL_STORAGE_KEY,
        );
    } catch {
      return {
        status:
          'UNAVAILABLE',
      };
    }

    if (
      raw ===
      null
    ) {
      return {
        status:
          'MISSING',
      };
    }

    const normalized =
      raw.trim();

    if (
      normalized.length ===
        0 ||
      normalized.length >
        MAX_CONTINUITY_ID_LENGTH
    ) {
      return {
        status:
          'INVALID',
      };
    }

    return {
      status:
        'PRESENT',

      id:
        normalized,
    };
  }

  private createContinuityId():
    string {

    const value =
      this.dependencies
        .createContinuityId()
        .trim();

    if (
      value.length ===
        0 ||
      value.length >
        MAX_CONTINUITY_ID_LENGTH
    ) {
      throw new RangeError(
        'Generated continuity id is invalid.',
      );
    }

    return value;
  }

  private async writeContinuityMetadata(
    continuityId:
      string,
  ): Promise<void> {

    await this.database
      .metadata
      .put({
        key:
          continuityMetadataKey(
            continuityId,
          ),

        schemaVersion:
          GENESIS_INDEXED_DB_SCHEMA_VERSION,

        storageFormatVersion:
          GENESIS_STORAGE_FORMAT_VERSION,

        updatedAtEpochMs:
          this.dependencies
            .clock(),
      });
  }
}

export function classifyStoragePressure(
  quota:
    GenesisStorageQuotaSnapshot,
): GenesisStoragePressureValue {

  const ratio =
    quota.usageRatio;

  if (
    ratio ===
    null ||
    !Number.isFinite(
      ratio,
    ) ||
    ratio < 0
  ) {
    return GenesisStoragePressure
      .UNKNOWN;
  }

  if (
    ratio >=
    GENESIS_STORAGE_CRITICAL_PRESSURE_RATIO
  ) {
    return GenesisStoragePressure
      .CRITICAL;
  }

  if (
    ratio >=
    GENESIS_STORAGE_HIGH_PRESSURE_RATIO
  ) {
    return GenesisStoragePressure
      .HIGH;
  }

  return GenesisStoragePressure
    .NORMAL;
}

export function classifyStorageFailure(
  error:
    unknown,
): GenesisStorageFailureCodeValue {

  const name =
    errorName(
      error,
    );

  switch (
    name
  ) {
    case 'QuotaExceededError':
      return GenesisStorageFailureCode
        .QUOTA_EXCEEDED;

    case 'SecurityError':
    case 'NotAllowedError':
      return GenesisStorageFailureCode
        .SECURITY_RESTRICTED;

    case 'MissingAPIError':
    case 'InvalidStateError':
    case 'UnknownError':
      return GenesisStorageFailureCode
        .INDEXED_DB_UNAVAILABLE;

    default:
      return GenesisStorageFailureCode
        .UNKNOWN;
  }
}

function storageFailureFrom(
  error:
    unknown,

  fallbackMessage:
    string,
): GenesisStorageFailure {

  const message =
    error instanceof
      Error &&
    error.message.trim()
      .length >
      0
      ? error.message
      : fallbackMessage;

  return {
    code:
      classifyStorageFailure(
        error,
      ),

    message,
  };
}

function unavailableSnapshot(
  quota:
    GenesisStorageQuotaSnapshot,

  persistence:
    GenesisStoragePersistenceValue,

  failure:
    GenesisStorageFailure,
): GenesisStorageHealthSnapshot {

  return {
    availability:
      GenesisStorageAvailability
        .UNAVAILABLE,

    continuity:
      GenesisStorageContinuity
        .UNAVAILABLE,

    persistence,

    pressure:
      classifyStoragePressure(
        quota,
      ),

    operatingMode:
      GenesisStorageOperatingMode
        .VOLATILE,

    writePolicy:
      GenesisStorageWritePolicy
        .BLOCKED,

    quota,

    canReadPersistedProgress:
      false,

    canWritePersistedProgress:
      false,

    shouldOfferBackupRestore:
      false,

    failure,
  };
}

function emptyQuotaSnapshot():
  GenesisStorageQuotaSnapshot {

  return {
    usageBytes:
      null,

    quotaBytes:
      null,

    usageRatio:
      null,
  };
}

function normalizeNonNegativeFiniteNumber(
  value:
    number | undefined,
): number | null {

  if (
    typeof value !==
      'number' ||
    !Number.isFinite(
      value,
    ) ||
    value < 0
  ) {
    return null;
  }

  return value;
}

function normalizePositiveFiniteNumber(
  value:
    number | undefined,
): number | null {

  if (
    typeof value !==
      'number' ||
    !Number.isFinite(
      value,
    ) ||
    value <= 0
  ) {
    return null;
  }

  return value;
}

function continuityMetadataKey(
  continuityId:
    string,
): string {

  return (
    CONTINUITY_METADATA_PREFIX +
    continuityId
  );
}

function errorName(
  error:
    unknown,
): string {

  if (
    typeof error ===
      'object' &&
    error !==
      null &&
    'name' in
      error &&
    typeof (
      error as {
        readonly name?:
          unknown;
      }
    ).name ===
      'string'
  ) {
    return (
      error as {
        readonly name:
          string;
      }
    ).name;
  }

  return '';
}

function createDefaultBrowserStorageDependencies():
  GenesisBrowserStorageDependencies {

  return {
    hasIndexedDb:
      () =>
        typeof indexedDB !==
        'undefined',

    storageManager:
      browserStorageManager(),

    continuityStore:
      browserLocalStorage(),

    createContinuityId:
      createBrowserContinuityId,

    clock:
      Date.now,
  };
}

function browserStorageManager():
  BrowserStorageManagerLike | null {

  try {
    if (
      typeof navigator ===
        'undefined' ||
      !navigator.storage
    ) {
      return null;
    }

    return navigator.storage;
  } catch {
    return null;
  }
}

function browserLocalStorage():
  KeyValueStorageLike | null {

  try {
    if (
      typeof localStorage ===
      'undefined'
    ) {
      return null;
    }

    return localStorage;
  } catch {
    return null;
  }
}

function createBrowserContinuityId():
  string {

  return [
    Date.now()
      .toString(
        36,
      ),

    Math.random()
      .toString(
        36,
      )
      .slice(
        2,
      ),
  ]
    .join(
      '-',
    );
}