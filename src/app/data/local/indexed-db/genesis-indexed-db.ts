import Dexie, {
  type DexieDOMDependencies,
  type Table,
} from 'dexie';

import {
  DiscoveryEntity,
} from '../entity/discovery.entity';

import {
  GalaxyEntity,
} from '../entity/galaxy.entity';

import {
  ObservationEntity,
} from '../entity/observation.entity';

import {
  ProgressEntity,
} from '../entity/progress.entity';

import {
  StorageMetadataEntity,
} from '../entity/storage-metadata.entity';

import {
  UniverseNavigationEntity,
} from '../entity/universe-navigation.entity';

import {
  UniverseEntity,
} from '../entity/universe.entity';

import {
  registerGenesisIndexedDbVersions,
} from './genesis-indexed-db-migrations';

export const GENESIS_INDEXED_DB_NAME =
  'genesis-web';

export type UniverseEntityKey =
  readonly [
    string,
    number,
  ];

export type GalaxyEntityKey =
  readonly [
    string,
    number,
    string,
  ];

export type DiscoveryEntityKey =
  readonly [
    string,
    number,
    number,
    string,
  ];

export type ProgressEntityKey =
  readonly [
    string,
    number,
    number,
    string,
  ];

export type UniverseNavigationEntityKey =
  readonly [
    string,
    number,
  ];

export class GenesisIndexedDb
  extends Dexie {

  readonly metadata!:
    Table<
      StorageMetadataEntity,
      string
    >;

  readonly universes!:
    Table<
      UniverseEntity,
      UniverseEntityKey
    >;

  readonly galaxies!:
    Table<
      GalaxyEntity,
      GalaxyEntityKey
    >;

  readonly discoveries!:
    Table<
      DiscoveryEntity,
      DiscoveryEntityKey
    >;

  readonly observations!:
    Table<
      ObservationEntity,
      string
    >;

  readonly progress!:
    Table<
      ProgressEntity,
      ProgressEntityKey
    >;

  readonly navigation!:
    Table<
      UniverseNavigationEntity,
      UniverseNavigationEntityKey
    >;

  constructor(
    databaseName:
      string =
        GENESIS_INDEXED_DB_NAME,

    indexedDbDependencies:
      Partial<DexieDOMDependencies> =
        {},
  ) {
    super(
      databaseName,
      {
        autoOpen:
          false,

        ...indexedDbDependencies,
      },
    );

    registerGenesisIndexedDbVersions(
      this,
    );
  }

  async openDatabase():
    Promise<void> {

    if (
      this.isOpen()
    ) {
      return;
    }

    await this.open();
  }

  closeDatabase():
    void {

    this.close();
  }
}