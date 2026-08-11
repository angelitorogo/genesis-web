import Dexie, {
  type Transaction,
} from 'dexie';

import {
  type DiscoveryEntity,
} from '../entity/discovery.entity';

import {
  attachDiscoverySectorCoordinates,
} from '../entity/discovery-sector-coordinates';

import {
  rehydrateDiscoveryLocator,
} from '../entity/discovery-locator-rehydrator';

import {
  type StorageMetadataEntity,
} from '../entity/storage-metadata.entity';

import {
  GENESIS_INDEXED_DB_SCHEMA_VERSION,
  GENESIS_INDEXED_DB_SCHEMA_VERSION_V1,
  GENESIS_INDEXED_DB_SCHEMA_VERSION_V2,
  GENESIS_INDEXED_DB_SCHEMA_VERSION_V3,
  GENESIS_INDEXED_DB_STORES,
  GENESIS_INDEXED_DB_V1_STORES,
  GENESIS_INDEXED_DB_V2_STORES,
} from './genesis-indexed-db-schema';

export const GeneratorVersionMigrationStrategy =
  Object.freeze({
    PRESERVE:
      'PRESERVE',

    EXPLICIT_TRANSFORM_REQUIRED:
      'EXPLICIT_TRANSFORM_REQUIRED',
  } as const);

export type GeneratorVersionMigrationStrategy =
  typeof GeneratorVersionMigrationStrategy[
    keyof typeof GeneratorVersionMigrationStrategy
  ];

export interface GenesisIndexedDbMigrationDescriptor {
  readonly id:
    string;

  readonly fromSchemaVersion:
    number;

  readonly toSchemaVersion:
    number;

  /**
   * Schema migrations must never silently
   * rewrite procedural GeneratorVersion.
   */
  readonly generatorVersionStrategy:
    GeneratorVersionMigrationStrategy;
}

export const GENESIS_INDEXED_DB_MIGRATIONS:
  readonly GenesisIndexedDbMigrationDescriptor[] =
  Object.freeze([
    Object.freeze({
      id:
        'v1-to-v2',

      fromSchemaVersion:
        GENESIS_INDEXED_DB_SCHEMA_VERSION_V1,

      toSchemaVersion:
        GENESIS_INDEXED_DB_SCHEMA_VERSION_V2,

      generatorVersionStrategy:
        GeneratorVersionMigrationStrategy
          .PRESERVE,
    }),

    Object.freeze({
      id:
        'v2-to-v3',

      fromSchemaVersion:
        GENESIS_INDEXED_DB_SCHEMA_VERSION_V2,

      toSchemaVersion:
        GENESIS_INDEXED_DB_SCHEMA_VERSION_V3,

      generatorVersionStrategy:
        GeneratorVersionMigrationStrategy
          .PRESERVE,
    }),
  ]);

export class GenesisIndexedDbMigrationError
  extends Error {

  constructor(
    message:
      string,
  ) {
    super(
      message,
    );

    this.name =
      'GenesisIndexedDbMigrationError';
  }
}

export function validateGenesisIndexedDbMigrationChain(
  migrations:
    readonly GenesisIndexedDbMigrationDescriptor[] =
      GENESIS_INDEXED_DB_MIGRATIONS,

  currentSchemaVersion:
    number =
      GENESIS_INDEXED_DB_SCHEMA_VERSION,
): void {

  if (
    currentSchemaVersion <
    GENESIS_INDEXED_DB_SCHEMA_VERSION_V1
  ) {
    throw new GenesisIndexedDbMigrationError(
      'Current schema version is below the first supported schema.',
    );
  }

  let expectedVersion =
    GENESIS_INDEXED_DB_SCHEMA_VERSION_V1;

  for (
    const migration
    of migrations
  ) {
    if (
      migration
        .fromSchemaVersion !==
      expectedVersion
    ) {
      throw new GenesisIndexedDbMigrationError(
        `Migration chain gap: expected schema ${expectedVersion}, got ${migration.fromSchemaVersion}.`,
      );
    }

    if (
      migration
        .toSchemaVersion !==
      migration
        .fromSchemaVersion +
        1
    ) {
      throw new GenesisIndexedDbMigrationError(
        `Migration ${migration.id} must advance exactly one schema version.`,
      );
    }

    expectedVersion =
      migration
        .toSchemaVersion;
  }

  if (
    expectedVersion !==
    currentSchemaVersion
  ) {
    throw new GenesisIndexedDbMigrationError(
      `Migration chain ends at schema ${expectedVersion}, current schema is ${currentSchemaVersion}.`,
    );
  }
}

export async function migrateGenesisIndexedDbV1ToV2(
  transaction:
    Transaction,
): Promise<void> {

  await migrateMetadataSchemaVersion(
    transaction,
    GENESIS_INDEXED_DB_SCHEMA_VERSION_V1,
    GENESIS_INDEXED_DB_SCHEMA_VERSION_V2,
  );
}

export async function migrateGenesisIndexedDbV2ToV3(
  transaction:
    Transaction,
): Promise<void> {

  const metadataTable =
    transaction
      .table<
        StorageMetadataEntity,
        string
      >(
        'metadata',
      );

  const discoveryTable =
    transaction
      .table<DiscoveryEntity>(
        'discoveries',
      );

  const metadata =
    await metadataTable
      .toArray();

  validateMetadataSchemaVersion(
    metadata,
    GENESIS_INDEXED_DB_SCHEMA_VERSION_V2,
  );

  const discoveries =
    await discoveryTable
      .toArray();

  const migratedDiscoveries =
    discoveries.map(
      (
        discovery,
      ) => {
        try {
          rehydrateDiscoveryLocator(
            discovery,
          );

          return attachDiscoverySectorCoordinates(
            discovery,
          );
        } catch {
          throw new GenesisIndexedDbMigrationError(
            [
              'Cannot migrate discovery coordinates:',
              `targetTypeCode=${discovery.targetTypeCode}`,
              `targetSeed=${discovery.targetSeed}`,
              `sectorKey=${discovery.sectorKey ?? 'null'}.`,
            ].join(' '),
          );
        }
      },
    );

  if (
    migratedDiscoveries.length >
    0
  ) {
    await discoveryTable
      .bulkPut(
        migratedDiscoveries,
      );
  }

  if (
    metadata.length >
    0
  ) {
    await metadataTable
      .bulkPut(
        metadata.map(
          (
            entry,
          ):
            StorageMetadataEntity => ({
            ...entry,

            schemaVersion:
              GENESIS_INDEXED_DB_SCHEMA_VERSION_V3,
          }),
        ),
      );
  }
}

export function registerGenesisIndexedDbVersions(
  database:
    Dexie,
): void {

  validateGenesisIndexedDbMigrationChain();

  database
    .version(
      GENESIS_INDEXED_DB_SCHEMA_VERSION_V1,
    )
    .stores(
      GENESIS_INDEXED_DB_V1_STORES,
    );

  database
    .version(
      GENESIS_INDEXED_DB_SCHEMA_VERSION_V2,
    )
    .stores(
      GENESIS_INDEXED_DB_V2_STORES,
    )
    .upgrade(
      migrateGenesisIndexedDbV1ToV2,
    );

  database
    .version(
      GENESIS_INDEXED_DB_SCHEMA_VERSION_V3,
    )
    .stores(
      GENESIS_INDEXED_DB_STORES,
    )
    .upgrade(
      migrateGenesisIndexedDbV2ToV3,
    );
}

async function migrateMetadataSchemaVersion(
  transaction:
    Transaction,

  fromSchemaVersion:
    number,

  toSchemaVersion:
    number,
): Promise<void> {

  const metadataTable =
    transaction
      .table<
        StorageMetadataEntity,
        string
      >(
        'metadata',
      );

  const metadata =
    await metadataTable
      .toArray();

  validateMetadataSchemaVersion(
    metadata,
    fromSchemaVersion,
  );

  if (
    metadata.length ===
    0
  ) {
    return;
  }

  await metadataTable
    .bulkPut(
      metadata.map(
        (
          entry,
        ):
          StorageMetadataEntity => ({
          ...entry,

          schemaVersion:
            toSchemaVersion,
        }),
      ),
    );
}

function validateMetadataSchemaVersion(
  metadata:
    readonly StorageMetadataEntity[],

  expectedSchemaVersion:
    number,
): void {

  for (
    const entry
    of metadata
  ) {
    if (
      entry.schemaVersion !==
      expectedSchemaVersion
    ) {
      throw new GenesisIndexedDbMigrationError(
        `Cannot migrate metadata '${entry.key}': expected schemaVersion ${expectedSchemaVersion}, got ${entry.schemaVersion}.`,
      );
    }
  }
}