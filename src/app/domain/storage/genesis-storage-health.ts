const AVAILABLE =
  'AVAILABLE';

const UNAVAILABLE =
  'UNAVAILABLE';

const CLEARED =
  'CLEARED';

export const GenesisStorageAvailability =
  Object.freeze({
    AVAILABLE,
    UNAVAILABLE,
    CLEARED,
  } as const);

export type GenesisStorageAvailabilityValue =
  typeof GenesisStorageAvailability[
    keyof typeof GenesisStorageAvailability
  ];

const INITIALIZED =
  'INITIALIZED';

const INTACT =
  'INTACT';

const CONTINUITY_CLEARED =
  'CLEARED';

const UNVERIFIABLE =
  'UNVERIFIABLE';

const CONTINUITY_UNAVAILABLE =
  'UNAVAILABLE';

export const GenesisStorageContinuity =
  Object.freeze({
    INITIALIZED,
    INTACT,
    CLEARED:
      CONTINUITY_CLEARED,
    UNVERIFIABLE,
    UNAVAILABLE:
      CONTINUITY_UNAVAILABLE,
  } as const);

export type GenesisStorageContinuityValue =
  typeof GenesisStorageContinuity[
    keyof typeof GenesisStorageContinuity
  ];

const PERSISTENT =
  'PERSISTENT';

const BEST_EFFORT =
  'BEST_EFFORT';

const UNSUPPORTED =
  'UNSUPPORTED';

const UNKNOWN_PERSISTENCE =
  'UNKNOWN';

export const GenesisStoragePersistence =
  Object.freeze({
    PERSISTENT,
    BEST_EFFORT,
    UNSUPPORTED,
    UNKNOWN:
      UNKNOWN_PERSISTENCE,
  } as const);

export type GenesisStoragePersistenceValue =
  typeof GenesisStoragePersistence[
    keyof typeof GenesisStoragePersistence
  ];

const NORMAL_PRESSURE =
  'NORMAL';

const HIGH =
  'HIGH';

const CRITICAL =
  'CRITICAL';

const UNKNOWN_PRESSURE =
  'UNKNOWN';

export const GenesisStoragePressure =
  Object.freeze({
    NORMAL:
      NORMAL_PRESSURE,
    HIGH,
    CRITICAL,
    UNKNOWN:
      UNKNOWN_PRESSURE,
  } as const);

export type GenesisStoragePressureValue =
  typeof GenesisStoragePressure[
    keyof typeof GenesisStoragePressure
  ];

const NORMAL_MODE =
  'NORMAL';

const LIMITED =
  'LIMITED';

const RECOVERY_REQUIRED =
  'RECOVERY_REQUIRED';

const VOLATILE =
  'VOLATILE';

export const GenesisStorageOperatingMode =
  Object.freeze({
    NORMAL:
      NORMAL_MODE,
    LIMITED,
    RECOVERY_REQUIRED,
    VOLATILE,
  } as const);

export type GenesisStorageOperatingModeValue =
  typeof GenesisStorageOperatingMode[
    keyof typeof GenesisStorageOperatingMode
  ];

const NORMAL_WRITE =
  'NORMAL';

const ESSENTIAL_ONLY =
  'ESSENTIAL_ONLY';

const BLOCKED =
  'BLOCKED';

export const GenesisStorageWritePolicy =
  Object.freeze({
    NORMAL:
      NORMAL_WRITE,
    ESSENTIAL_ONLY,
    BLOCKED,
  } as const);

export type GenesisStorageWritePolicyValue =
  typeof GenesisStorageWritePolicy[
    keyof typeof GenesisStorageWritePolicy
  ];

const INDEXED_DB_UNAVAILABLE =
  'INDEXED_DB_UNAVAILABLE';

const INDEXED_DB_CLEARED =
  'INDEXED_DB_CLEARED';

const QUOTA_EXCEEDED =
  'QUOTA_EXCEEDED';

const SECURITY_RESTRICTED =
  'SECURITY_RESTRICTED';

const UNKNOWN_FAILURE =
  'UNKNOWN';

export const GenesisStorageFailureCode =
  Object.freeze({
    INDEXED_DB_UNAVAILABLE,
    INDEXED_DB_CLEARED,
    QUOTA_EXCEEDED,
    SECURITY_RESTRICTED,
    UNKNOWN:
      UNKNOWN_FAILURE,
  } as const);

export type GenesisStorageFailureCodeValue =
  typeof GenesisStorageFailureCode[
    keyof typeof GenesisStorageFailureCode
  ];

export const GENESIS_STORAGE_HIGH_PRESSURE_RATIO =
  0.8;

export const GENESIS_STORAGE_CRITICAL_PRESSURE_RATIO =
  0.95;

export interface GenesisStorageQuotaSnapshot {
  readonly usageBytes:
    number | null;

  readonly quotaBytes:
    number | null;

  readonly usageRatio:
    number | null;
}

export interface GenesisStorageFailure {
  readonly code:
    GenesisStorageFailureCodeValue;

  readonly message:
    string;
}

export interface GenesisStorageHealthSnapshot {
  readonly availability:
    GenesisStorageAvailabilityValue;

  readonly continuity:
    GenesisStorageContinuityValue;

  readonly persistence:
    GenesisStoragePersistenceValue;

  readonly pressure:
    GenesisStoragePressureValue;

  readonly operatingMode:
    GenesisStorageOperatingModeValue;

  readonly writePolicy:
    GenesisStorageWritePolicyValue;

  readonly quota:
    GenesisStorageQuotaSnapshot;

  readonly canReadPersistedProgress:
    boolean;

  readonly canWritePersistedProgress:
    boolean;

  readonly shouldOfferBackupRestore:
    boolean;

  readonly failure:
    GenesisStorageFailure | null;
}