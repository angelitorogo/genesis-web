import Dexie from 'dexie';

import {
  IDBKeyRange,
  indexedDB,
} from 'fake-indexeddb';

import {
  vi,
} from 'vitest';

import {
  GenesisStorageAvailability,
  GenesisStorageContinuity,
  GenesisStorageFailureCode,
  GenesisStorageOperatingMode,
  GenesisStoragePersistence,
  GenesisStoragePressure,
  GenesisStorageWritePolicy,
} from '../../../domain/storage/genesis-storage-health';

import {
  GenesisIndexedDb,
} from '../indexed-db/genesis-indexed-db';

import {
  GenesisBrowserStorageService,
  classifyStorageFailure,
  type BrowserStorageManagerLike,
  type GenesisBrowserStorageDependencies,
  type KeyValueStorageLike,
} from './genesis-browser-storage.service';

describe(
  'GenesisBrowserStorageService',
  () => {
    const databaseName =
      'genesis-web-storage-health-tests';

    const continuityLocalStorageKey =
      'genesis-web:indexeddb-continuity:v1';

    const indexedDbDependencies =
      Object.freeze({
        indexedDB,
        IDBKeyRange,
      });

    let database:
      GenesisIndexedDb;

    let continuityStore:
      MemoryStorage;

    let continuitySequence:
      number;

    beforeEach(
      () => {
        database =
          new GenesisIndexedDb(
            databaseName,
            indexedDbDependencies,
          );

        continuityStore =
          new MemoryStorage();

        continuitySequence =
          0;
      },
    );

    afterEach(
      async () => {
        vi.restoreAllMocks();

        database
          .closeDatabase();

        const cleanup =
          new Dexie(
            databaseName,
            {
              autoOpen:
                false,

              ...indexedDbDependencies,
            },
          );

        await cleanup
          .delete();
      },
    );

    it(
      'should degrade safely when IndexedDB is unavailable',
      async () => {
        const service =
          createService({
            hasIndexedDb:
              () =>
                false,
          });

        const health =
          await service
            .inspect();

        expect(
          health.availability,
        ).toBe(
          GenesisStorageAvailability
            .UNAVAILABLE,
        );

        expect(
          health.operatingMode,
        ).toBe(
          GenesisStorageOperatingMode
            .VOLATILE,
        );

        expect(
          health.writePolicy,
        ).toBe(
          GenesisStorageWritePolicy
            .BLOCKED,
        );

        expect(
          health.canReadPersistedProgress,
        ).toBe(false);

        expect(
          health.canWritePersistedProgress,
        ).toBe(false);
      },
    );

    it(
      'should degrade safely when IndexedDB availability probing throws',
      async () => {
        const service =
          createService({
            hasIndexedDb:
              () => {
                throw new Error(
                  'IndexedDB probe failed',
                );
              },
          });

        const health =
          await service
            .inspect();

        expect(
          health.availability,
        ).toBe(
          GenesisStorageAvailability
            .UNAVAILABLE,
        );

        expect(
          health.continuity,
        ).toBe(
          GenesisStorageContinuity
            .UNAVAILABLE,
        );

        expect(
          health.operatingMode,
        ).toBe(
          GenesisStorageOperatingMode
            .VOLATILE,
        );

        expect(
          health.writePolicy,
        ).toBe(
          GenesisStorageWritePolicy
            .BLOCKED,
        );
      },
    );

    it(
      'should degrade safely when IndexedDB cannot be opened',
      async () => {
        vi.spyOn(
          database,
          'openDatabase',
        ).mockRejectedValueOnce(
          namedError(
            'SecurityError',
            'IndexedDB access denied',
          ),
        );

        const service =
          createService();

        const health =
          await service
            .inspect();

        expect(
          health.availability,
        ).toBe(
          GenesisStorageAvailability
            .UNAVAILABLE,
        );

        expect(
          health.continuity,
        ).toBe(
          GenesisStorageContinuity
            .UNAVAILABLE,
        );

        expect(
          health.failure
            ?.code,
        ).toBe(
          GenesisStorageFailureCode
            .SECURITY_RESTRICTED,
        );

        expect(
          health.canReadPersistedProgress,
        ).toBe(false);

        expect(
          health.canWritePersistedProgress,
        ).toBe(false);
      },
    );

    it(
      'should establish a continuity marker on first successful inspection',
      async () => {
        const service =
          createService();

        const health =
          await service
            .inspect();

        expect(
          health.availability,
        ).toBe(
          GenesisStorageAvailability
            .AVAILABLE,
        );

        expect(
          health.continuity,
        ).toBe(
          GenesisStorageContinuity
            .INITIALIZED,
        );

        expect(
          await database
            .metadata
            .count(),
        ).toBe(1);
      },
    );

    it(
      'should detect intact storage continuity on later inspections',
      async () => {
        const service =
          createService();

        await service
          .inspect();

        const health =
          await service
            .inspect();

        expect(
          health.continuity,
        ).toBe(
          GenesisStorageContinuity
            .INTACT,
        );

        expect(
          health.operatingMode,
        ).toBe(
          GenesisStorageOperatingMode
            .NORMAL,
        );
      },
    );

    it(
      'should detect IndexedDB clearing when the external continuity marker survives',
      async () => {
        const firstService =
          createService();

        await firstService
          .inspect();

        database
          .closeDatabase();

        await deleteDatabase();

        database =
          new GenesisIndexedDb(
            databaseName,
            indexedDbDependencies,
          );

        const secondService =
          createService();

        const health =
          await secondService
            .inspect();

        expect(
          health.availability,
        ).toBe(
          GenesisStorageAvailability
            .CLEARED,
        );

        expect(
          health.continuity,
        ).toBe(
          GenesisStorageContinuity
            .CLEARED,
        );

        expect(
          health.operatingMode,
        ).toBe(
          GenesisStorageOperatingMode
            .RECOVERY_REQUIRED,
        );

        expect(
          health.writePolicy,
        ).toBe(
          GenesisStorageWritePolicy
            .BLOCKED,
        );

        expect(
          health.shouldOfferBackupRestore,
        ).toBe(true);
      },
    );

    it(
      'should remain usable when the continuity store is unavailable',
      async () => {
        const service =
          createService({
            continuityStore:
              null,
          });

        const health =
          await service
            .inspect();

        expect(
          health.availability,
        ).toBe(
          GenesisStorageAvailability
            .AVAILABLE,
        );

        expect(
          health.continuity,
        ).toBe(
          GenesisStorageContinuity
            .UNVERIFIABLE,
        );

        expect(
          health.canWritePersistedProgress,
        ).toBe(true);
      },
    );

    it(
      'should remain usable when continuity marker reading throws',
      async () => {
        const service =
          createService({
            continuityStore:
              new ThrowingGetStorage(),
          });

        const health =
          await service
            .inspect();

        expect(
          health.availability,
        ).toBe(
          GenesisStorageAvailability
            .AVAILABLE,
        );

        expect(
          health.continuity,
        ).toBe(
          GenesisStorageContinuity
            .UNVERIFIABLE,
        );

        expect(
          health.canReadPersistedProgress,
        ).toBe(true);

        expect(
          health.canWritePersistedProgress,
        ).toBe(true);
      },
    );

    it(
      'should remain usable when continuity marker writing throws',
      async () => {
        const service =
          createService({
            continuityStore:
              new ThrowingSetStorage(),
          });

        const health =
          await service
            .inspect();

        expect(
          health.availability,
        ).toBe(
          GenesisStorageAvailability
            .AVAILABLE,
        );

        expect(
          health.continuity,
        ).toBe(
          GenesisStorageContinuity
            .UNVERIFIABLE,
        );

        expect(
          health.canReadPersistedProgress,
        ).toBe(true);

        expect(
          health.canWritePersistedProgress,
        ).toBe(true);

        expect(
          await database
            .metadata
            .count(),
        ).toBe(1);
      },
    );

    it(
      'should treat a blank external continuity marker as unverifiable',
      async () => {
        continuityStore
          .setItem(
            continuityLocalStorageKey,
            '   ',
          );

        const service =
          createService();

        const health =
          await service
            .inspect();

        expect(
          health.availability,
        ).toBe(
          GenesisStorageAvailability
            .AVAILABLE,
        );

        expect(
          health.continuity,
        ).toBe(
          GenesisStorageContinuity
            .UNVERIFIABLE,
        );

        expect(
          await database
            .metadata
            .count(),
        ).toBe(0);
      },
    );

    it(
      'should treat an oversized external continuity marker as unverifiable',
      async () => {
        continuityStore
          .setItem(
            continuityLocalStorageKey,
            'x'.repeat(
              201,
            ),
          );

        const service =
          createService();

        const health =
          await service
            .inspect();

        expect(
          health.availability,
        ).toBe(
          GenesisStorageAvailability
            .AVAILABLE,
        );

        expect(
          health.continuity,
        ).toBe(
          GenesisStorageContinuity
            .UNVERIFIABLE,
        );

        expect(
          await database
            .metadata
            .count(),
        ).toBe(0);
      },
    );

    it(
      'should degrade safely when continuity id generation is invalid',
      async () => {
        const service =
          createService({
            createContinuityId:
              () =>
                '   ',
          });

        const health =
          await service
            .inspect();

        expect(
          health.availability,
        ).toBe(
          GenesisStorageAvailability
            .UNAVAILABLE,
        );

        expect(
          health.operatingMode,
        ).toBe(
          GenesisStorageOperatingMode
            .VOLATILE,
        );

        expect(
          health.writePolicy,
        ).toBe(
          GenesisStorageWritePolicy
            .BLOCKED,
        );

        expect(
          health.failure
            ?.code,
        ).toBe(
          GenesisStorageFailureCode
            .UNKNOWN,
        );
      },
    );

    it(
      'should block writes but preserve reads when continuity metadata hits quota',
      async () => {
        vi.spyOn(
          database.metadata,
          'put',
        ).mockRejectedValueOnce(
          namedError(
            'QuotaExceededError',
            'Storage quota exceeded',
          ),
        );

        const service =
          createService();

        const health =
          await service
            .inspect();

        expect(
          health.availability,
        ).toBe(
          GenesisStorageAvailability
            .AVAILABLE,
        );

        expect(
          health.continuity,
        ).toBe(
          GenesisStorageContinuity
            .UNVERIFIABLE,
        );

        expect(
          health.operatingMode,
        ).toBe(
          GenesisStorageOperatingMode
            .LIMITED,
        );

        expect(
          health.writePolicy,
        ).toBe(
          GenesisStorageWritePolicy
            .BLOCKED,
        );

        expect(
          health.canReadPersistedProgress,
        ).toBe(true);

        expect(
          health.canWritePersistedProgress,
        ).toBe(false);

        expect(
          health.failure
            ?.code,
        ).toBe(
          GenesisStorageFailureCode
            .QUOTA_EXCEEDED,
        );
      },
    );

    it(
      'should become unavailable when continuity metadata fails for security reasons',
      async () => {
        vi.spyOn(
          database.metadata,
          'put',
        ).mockRejectedValueOnce(
          namedError(
            'SecurityError',
            'Metadata write denied',
          ),
        );

        const service =
          createService();

        const health =
          await service
            .inspect();

        expect(
          health.availability,
        ).toBe(
          GenesisStorageAvailability
            .UNAVAILABLE,
        );

        expect(
          health.operatingMode,
        ).toBe(
          GenesisStorageOperatingMode
            .VOLATILE,
        );

        expect(
          health.writePolicy,
        ).toBe(
          GenesisStorageWritePolicy
            .BLOCKED,
        );

        expect(
          health.failure
            ?.code,
        ).toBe(
          GenesisStorageFailureCode
            .SECURITY_RESTRICTED,
        );
      },
    );

    it(
      'should classify normal quota pressure',
      async () => {
        const service =
          createService({
            storageManager:
              manager({
                usage:
                  100,

                quota:
                  1000,
              }),
          });

        const health =
          await service
            .inspect();

        expect(
          health.pressure,
        ).toBe(
          GenesisStoragePressure
            .NORMAL,
        );

        expect(
          health.quota
            .usageRatio,
        ).toBeCloseTo(
          0.1,
        );
      },
    );

    it(
      'should enter limited mode at high quota pressure',
      async () => {
        const service =
          createService({
            storageManager:
              manager({
                usage:
                  800,

                quota:
                  1000,
              }),
          });

        const health =
          await service
            .inspect();

        expect(
          health.pressure,
        ).toBe(
          GenesisStoragePressure
            .HIGH,
        );

        expect(
          health.operatingMode,
        ).toBe(
          GenesisStorageOperatingMode
            .LIMITED,
        );

        expect(
          health.writePolicy,
        ).toBe(
          GenesisStorageWritePolicy
            .ESSENTIAL_ONLY,
        );
      },
    );

    it(
      'should enter limited mode at critical quota pressure',
      async () => {
        const service =
          createService({
            storageManager:
              manager({
                usage:
                  950,

                quota:
                  1000,
              }),
          });

        const health =
          await service
            .inspect();

        expect(
          health.pressure,
        ).toBe(
          GenesisStoragePressure
            .CRITICAL,
        );

        expect(
          health.writePolicy,
        ).toBe(
          GenesisStorageWritePolicy
            .ESSENTIAL_ONLY,
        );
      },
    );

    it(
      'should treat invalid quota estimates as unknown pressure',
      async () => {
        const service =
          createService({
            storageManager:
              manager({
                usage:
                  -1,

                quota:
                  0,
              }),
          });

        const health =
          await service
            .inspect();

        expect(
          health.pressure,
        ).toBe(
          GenesisStoragePressure
            .UNKNOWN,
        );

        expect(
          health.quota
            .usageBytes,
        ).toBeNull();

        expect(
          health.quota
            .quotaBytes,
        ).toBeNull();
      },
    );

    it(
      'should survive storage estimate failures',
      async () => {
        const service =
          createService({
            storageManager: {
              estimate:
                async () => {
                  throw new Error(
                    'estimate failed',
                  );
                },

              persisted:
                async () =>
                  true,

              persist:
                async () =>
                  true,
            },
          });

        const health =
          await service
            .inspect();

        expect(
          health.pressure,
        ).toBe(
          GenesisStoragePressure
            .UNKNOWN,
        );

        expect(
          health.availability,
        ).toBe(
          GenesisStorageAvailability
            .AVAILABLE,
        );
      },
    );

    it(
      'should tolerate a storage manager without estimate support',
      async () => {
        const service =
          createService({
            storageManager: {
              persisted:
                async () =>
                  true,

              persist:
                async () =>
                  true,
            },
          });

        const health =
          await service
            .inspect();

        expect(
          health.quota
            .usageBytes,
        ).toBeNull();

        expect(
          health.quota
            .quotaBytes,
        ).toBeNull();

        expect(
          health.quota
            .usageRatio,
        ).toBeNull();

        expect(
          health.pressure,
        ).toBe(
          GenesisStoragePressure
            .UNKNOWN,
        );

        expect(
          health.persistence,
        ).toBe(
          GenesisStoragePersistence
            .PERSISTENT,
        );
      },
    );

    it(
      'should report persistent browser storage',
      async () => {
        const service =
          createService({
            storageManager:
              manager(
                {
                  usage:
                    100,

                  quota:
                    1000,
                },
                true,
              ),
          });

        const health =
          await service
            .inspect();

        expect(
          health.persistence,
        ).toBe(
          GenesisStoragePersistence
            .PERSISTENT,
        );
      },
    );

    it(
      'should report best-effort browser storage',
      async () => {
        const service =
          createService({
            storageManager:
              manager(
                {
                  usage:
                    100,

                  quota:
                    1000,
                },
                false,
              ),
          });

        const health =
          await service
            .inspect();

        expect(
          health.persistence,
        ).toBe(
          GenesisStoragePersistence
            .BEST_EFFORT,
        );
      },
    );

    it(
      'should report unsupported persistence APIs',
      async () => {
        const service =
          createService({
            storageManager:
              null,
          });

        const health =
          await service
            .inspect();

        expect(
          health.persistence,
        ).toBe(
          GenesisStoragePersistence
            .UNSUPPORTED,
        );
      },
    );

    it(
      'should report unsupported when persisted() is unavailable during inspection',
      async () => {
        const service =
          createService({
            storageManager: {
              estimate:
                async () => ({
                  usage:
                    100,

                  quota:
                    1000,
                }),

              persist:
                async () =>
                  true,
            },
          });

        const health =
          await service
            .inspect();

        expect(
          health.persistence,
        ).toBe(
          GenesisStoragePersistence
            .UNSUPPORTED,
        );

        expect(
          health.availability,
        ).toBe(
          GenesisStorageAvailability
            .AVAILABLE,
        );
      },
    );

    it(
      'should report unknown persistence when persisted() fails',
      async () => {
        const service =
          createService({
            storageManager: {
              estimate:
                async () => ({
                  usage:
                    100,

                  quota:
                    1000,
                }),

              persisted:
                async () => {
                  throw new Error(
                    'persisted failed',
                  );
                },

              persist:
                async () =>
                  true,
            },
          });

        const health =
          await service
            .inspect();

        expect(
          health.persistence,
        ).toBe(
          GenesisStoragePersistence
            .UNKNOWN,
        );
      },
    );

    it(
      'should report persistent when a persistence request is granted',
      async () => {
        const service =
          createService({
            storageManager:
              manager(
                {
                  usage:
                    100,

                  quota:
                    1000,
                },
                false,
                true,
              ),
          });

        expect(
          await service
            .requestPersistentStorage(),
        ).toBe(
          GenesisStoragePersistence
            .PERSISTENT,
        );
      },
    );

    it(
      'should report best-effort when a persistence request is denied',
      async () => {
        const service =
          createService({
            storageManager:
              manager(
                {
                  usage:
                    100,

                  quota:
                    1000,
                },
                false,
                false,
              ),
          });

        expect(
          await service
            .requestPersistentStorage(),
        ).toBe(
          GenesisStoragePersistence
            .BEST_EFFORT,
        );
      },
    );

    it(
      'should report unsupported when persist() is unavailable',
      async () => {
        const service =
          createService({
            storageManager: {
              estimate:
                async () => ({
                  usage:
                    100,

                  quota:
                    1000,
                }),

              persisted:
                async () =>
                  false,
            },
          });

        expect(
          await service
            .requestPersistentStorage(),
        ).toBe(
          GenesisStoragePersistence
            .UNSUPPORTED,
        );
      },
    );

    it(
      'should report unknown when persist() throws',
      async () => {
        const service =
          createService({
            storageManager: {
              estimate:
                async () => ({
                  usage:
                    100,

                  quota:
                    1000,
                }),

              persisted:
                async () =>
                  false,

              persist:
                async () => {
                  throw new Error(
                    'persist failed',
                  );
                },
            },
          });

        expect(
          await service
            .requestPersistentStorage(),
        ).toBe(
          GenesisStoragePersistence
            .UNKNOWN,
        );
      },
    );

    it(
      'should allow explicit continuity re-establishment after recovery',
      async () => {
        const firstService =
          createService();

        await firstService
          .inspect();

        database
          .closeDatabase();

        await deleteDatabase();

        database =
          new GenesisIndexedDb(
            databaseName,
            indexedDbDependencies,
          );

        const recoveryService =
          createService();

        const cleared =
          await recoveryService
            .inspect();

        expect(
          cleared.continuity,
        ).toBe(
          GenesisStorageContinuity
            .CLEARED,
        );

        expect(
          await recoveryService
            .establishFreshContinuityAfterRecovery(),
        ).toBe(true);

        const restored =
          await recoveryService
            .inspect();

        expect(
          restored.continuity,
        ).toBe(
          GenesisStorageContinuity
            .INTACT,
        );

        expect(
          restored.availability,
        ).toBe(
          GenesisStorageAvailability
            .AVAILABLE,
        );
      },
    );

    it(
      'should refuse continuity recovery when IndexedDB is unavailable',
      async () => {
        const service =
          createService({
            hasIndexedDb:
              () =>
                false,
          });

        expect(
          await service
            .establishFreshContinuityAfterRecovery(),
        ).toBe(false);
      },
    );

    it(
      'should refuse continuity recovery when external continuity storage is unavailable',
      async () => {
        const service =
          createService({
            continuityStore:
              null,
          });

        expect(
          await service
            .establishFreshContinuityAfterRecovery(),
        ).toBe(false);
      },
    );

    it(
      'should fail continuity recovery safely when IndexedDB cannot be opened',
      async () => {
        vi.spyOn(
          database,
          'openDatabase',
        ).mockRejectedValueOnce(
          namedError(
            'InvalidStateError',
            'IndexedDB is not ready',
          ),
        );

        const service =
          createService();

        expect(
          await service
            .establishFreshContinuityAfterRecovery(),
        ).toBe(false);
      },
    );

    it(
      'should classify QuotaExceededError',
      () => {
        expect(
          classifyStorageFailure({
            name:
              'QuotaExceededError',
          }),
        ).toBe(
          GenesisStorageFailureCode
            .QUOTA_EXCEEDED,
        );
      },
    );

    it(
      'should classify browser security restrictions',
      () => {
        expect(
          classifyStorageFailure({
            name:
              'SecurityError',
          }),
        ).toBe(
          GenesisStorageFailureCode
            .SECURITY_RESTRICTED,
        );

        expect(
          classifyStorageFailure({
            name:
              'NotAllowedError',
          }),
        ).toBe(
          GenesisStorageFailureCode
            .SECURITY_RESTRICTED,
        );
      },
    );

    it(
      'should classify missing IndexedDB APIs',
      () => {
        expect(
          classifyStorageFailure({
            name:
              'MissingAPIError',
          }),
        ).toBe(
          GenesisStorageFailureCode
            .INDEXED_DB_UNAVAILABLE,
        );

        expect(
          classifyStorageFailure({
            name:
              'InvalidStateError',
          }),
        ).toBe(
          GenesisStorageFailureCode
            .INDEXED_DB_UNAVAILABLE,
        );

        expect(
          classifyStorageFailure({
            name:
              'UnknownError',
          }),
        ).toBe(
          GenesisStorageFailureCode
            .INDEXED_DB_UNAVAILABLE,
        );
      },
    );

    it(
      'should classify unrecognized failures as unknown',
      () => {
        expect(
          classifyStorageFailure(
            new Error(
              'unexpected',
            ),
          ),
        ).toBe(
          GenesisStorageFailureCode
            .UNKNOWN,
        );
      },
    );

    function createService(
      overrides:
        Partial<GenesisBrowserStorageDependencies> =
          {},
    ): GenesisBrowserStorageService {

      return new GenesisBrowserStorageService(
        database,
        {
          hasIndexedDb:
            () =>
              true,

          storageManager:
            manager({
              usage:
                100,

              quota:
                1000,
            }),

          continuityStore,

          createContinuityId:
            () => {
              continuitySequence +=
                1;

              return `continuity-${continuitySequence}`;
            },

          clock:
            () =>
              1000,

          ...overrides,
        },
      );
    }

    function manager(
      estimate:
        {
          readonly usage:
            number;

          readonly quota:
            number;
        },

      persisted:
        boolean =
          true,

      persist:
        boolean =
          true,
    ): BrowserStorageManagerLike {

      return {
        estimate:
          async () =>
            estimate,

        persisted:
          async () =>
            persisted,

        persist:
          async () =>
            persist,
      };
    }

    async function deleteDatabase():
      Promise<void> {

      const cleanup =
        new Dexie(
          databaseName,
          {
            autoOpen:
              false,

            ...indexedDbDependencies,
          },
        );

      await cleanup
        .delete();
    }
  },
);

class MemoryStorage
  implements KeyValueStorageLike {

  private readonly values =
    new Map<
      string,
      string
    >();

  getItem(
    key:
      string,
  ): string | null {

    return this.values
      .get(
        key,
      ) ??
      null;
  }

  setItem(
    key:
      string,

    value:
      string,
  ): void {

    this.values
      .set(
        key,
        value,
      );
  }

  removeItem(
    key:
      string,
  ): void {

    this.values
      .delete(
        key,
      );
  }
}

class ThrowingGetStorage
  implements KeyValueStorageLike {

  getItem(
    _key:
      string,
  ): string | null {

    throw new Error(
      'localStorage read failed',
    );
  }

  setItem(
    _key:
      string,

    _value:
      string,
  ): void {}

  removeItem(
    _key:
      string,
  ): void {}
}

class ThrowingSetStorage
  implements KeyValueStorageLike {

  getItem(
    _key:
      string,
  ): string | null {

    return null;
  }

  setItem(
    _key:
      string,

    _value:
      string,
  ): void {

    throw new Error(
      'localStorage write failed',
    );
  }

  removeItem(
    _key:
      string,
  ): void {}
}

function namedError(
  name:
    string,

  message:
    string,
): Error {

  const error =
    new Error(
      message,
    );

  error.name =
    name;

  return error;
}