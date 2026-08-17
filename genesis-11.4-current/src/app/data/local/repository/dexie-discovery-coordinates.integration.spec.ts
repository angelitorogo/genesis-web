import Dexie from 'dexie';

import {
  IDBKeyRange,
  indexedDB,
} from 'fake-indexeddb';

import {
  DiscoveryState,
} from '../../../domain/discovery/discovery-state';

import {
  DiscoveryTargetType,
} from '../../../domain/discovery/discovery-target-type';

import {
  BodyLocator,
  GalaxyLocator,
  type ProceduralLocator,
  SystemLocator,
} from '../../../domain/generation/procedural-locator';

import {
  GeneratorVersion,
} from '../../../domain/generation/generator-version';

import {
  UniverseGenerationKey,
} from '../../../domain/generation/universe-generation-key';

import {
  GalaxySectorCoordinates,
} from '../../../domain/sector/galaxy-sector-coordinates';

import {
  GalaxySectorKeyCodec,
} from '../../../domain/sector/galaxy-sector-key-codec';

import {
  UniverseSeed,
} from '../../../domain/universe/universe-seed';

import {
  GenesisIndexedDb,
} from '../indexed-db/genesis-indexed-db';

import {
  DexieDiscoveryRepository,
  type ProceduralTargetSeedResolver,
} from './dexie-discovery.repository';

import {
  DexieUniverseRepository,
} from './dexie-universe.repository';

import {
  CorruptLocalDataError,
} from './local-repository-support';

describe(
  'DexieDiscoveryRepository sector coordinates',
  () => {
    const databaseName =
      'genesis-web-discovery-coordinate-tests';

    const dependencies =
      Object.freeze({
        indexedDB,
        IDBKeyRange,
      });

    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    const targetSeedResolver:
      ProceduralTargetSeedResolver =
      {
        resolveTargetSeedNormalized(
          _generationKey,
          locator,
        ): string {
          return syntheticTargetSeed(
            locator,
          );
        },
      };

    let database:
      GenesisIndexedDb;

    let universeRepository:
      DexieUniverseRepository;

    let discoveryRepository:
      DexieDiscoveryRepository;

    function createRepositories():
      void {

      universeRepository =
        new DexieUniverseRepository(
          database,
          () =>
            1000,
        );

      discoveryRepository =
        new DexieDiscoveryRepository(
          database,
          targetSeedResolver,
          () =>
            1000,
        );
    }

    beforeEach(
      () => {
        database =
          new GenesisIndexedDb(
            databaseName,
            dependencies,
          );

        createRepositories();
      },
    );

    afterEach(
      async () => {
        database
          .closeDatabase();

        const cleanup =
          new Dexie(
            databaseName,
            dependencies,
          );

        await cleanup
          .delete();
      },
    );

    it(
      'should persist sectorX and sectorY derived from locator sectorKey',
      async () => {
        await universeRepository
          .createIfAbsent(
            generationKey,
          );

        const coordinates =
          new GalaxySectorCoordinates(
            -12,
            34,
          );

        const locator =
          new SystemLocator(
            0n,
            GalaxySectorKeyCodec
              .encode(
                coordinates,
              ),
            7n,
          );

        await discoveryRepository
          .setState(
            generationKey,
            locator,
            DiscoveryState.DETECTED,
          );

        const persisted =
          (
            await database
              .discoveries
              .toArray()
          )[0];

        expect(
          persisted,
        ).toMatchObject({
          sectorKey:
            locator
              .sectorKey
              .toString(
                10,
              ),

          sectorX:
            -12,

          sectorY:
            34,
        });
      },
    );

    it(
      'should persist null sector coordinates for GalaxyLocator',
      async () => {
        await universeRepository
          .createIfAbsent(
            generationKey,
          );

        await discoveryRepository
          .setState(
            generationKey,
            new GalaxyLocator(
              0n,
            ),
            DiscoveryState.DETECTED,
          );

        const persisted =
          (
            await database
              .discoveries
              .toArray()
          )[0];

        expect(
          persisted,
        ).toMatchObject({
          sectorKey:
            null,

          sectorX:
            null,

          sectorY:
            null,
        });
      },
    );

    it(
      'should query only known discoveries inside the requested sector coordinates',
      async () => {
        await universeRepository
          .createIfAbsent(
            generationKey,
          );

        const coordinates =
          new GalaxySectorCoordinates(
            5,
            -8,
          );

        const sectorKey =
          GalaxySectorKeyCodec
            .encode(
              coordinates,
            );

        await discoveryRepository
          .setState(
            generationKey,
            new SystemLocator(
              0n,
              sectorKey,
              1n,
            ),
            DiscoveryState.DETECTED,
          );

        await discoveryRepository
          .setState(
            generationKey,
            new BodyLocator(
              0n,
              sectorKey,
              1n,
              2n,
            ),
            DiscoveryState.CATALOGUED,
          );

        await discoveryRepository
          .setState(
            generationKey,
            new SystemLocator(
              0n,
              GalaxySectorKeyCodec
                .encode(
                  new GalaxySectorCoordinates(
                    5,
                    -7,
                  ),
                ),
              3n,
            ),
            DiscoveryState.CONFIRMED,
          );

        const known =
          await discoveryRepository
            .getKnownDiscoveriesInSector(
              generationKey,
              0n,
              coordinates,
            );

        expect(
          known,
        ).toHaveLength(2);

        expect(
          known.map(
            (
              discovery,
            ) =>
              discovery.state.code,
          ),
        ).toEqual([
          1,
          4,
        ]);
      },
    );

    it(
      'should preserve coordinate queries across database reopen',
      async () => {
        await universeRepository
          .createIfAbsent(
            generationKey,
          );

        const coordinates =
          new GalaxySectorCoordinates(
            -3,
            -4,
          );

        await discoveryRepository
          .setState(
            generationKey,
            new SystemLocator(
              0n,
              GalaxySectorKeyCodec
                .encode(
                  coordinates,
                ),
              9n,
            ),
            DiscoveryState.DISCOVERED,
          );

        database
          .closeDatabase();

        database =
          new GenesisIndexedDb(
            databaseName,
            dependencies,
          );

        createRepositories();

        const known =
          await discoveryRepository
            .getKnownDiscoveriesInSector(
              generationKey,
              0n,
              coordinates,
            );

        expect(
          known,
        ).toHaveLength(1);

        expect(
          known[0]
            .state,
        ).toBe(
          DiscoveryState.DISCOVERED,
        );
      },
    );

    it(
      'should reject persisted coordinates that disagree with sectorKey',
      async () => {
        await universeRepository
          .createIfAbsent(
            generationKey,
          );

        const coordinates =
          new GalaxySectorCoordinates(
            1,
            2,
          );

        const locator =
          new SystemLocator(
            0n,
            GalaxySectorKeyCodec
              .encode(
                coordinates,
              ),
            7n,
          );

        await discoveryRepository
          .setState(
            generationKey,
            locator,
            DiscoveryState.DETECTED,
          );

        const entity =
          (
            await database
              .discoveries
              .toArray()
          )[0];

        const corrupt =
          {
            ...entity,

            sectorX:
              coordinates.x +
              1,

            sectorY:
              coordinates.y,
          };

        await database
          .discoveries
          .put(
            corrupt,
          );

        await expect(
          discoveryRepository
            .getState(
              generationKey,
              locator,
            ),
        ).rejects.toBeInstanceOf(
          CorruptLocalDataError,
        );
      },
    );
  },
);

function syntheticTargetSeed(
  locator:
    ProceduralLocator,
): string {

  const targetType =
    DiscoveryTargetType
      .fromLocator(
        locator,
      );

  let accumulator =
    BigInt(
      targetType.code,
    );

  const mix =
    (
      value:
        bigint,
    ):
      void => {

      accumulator =
        BigInt.asUintN(
          128,
          (
            accumulator *
            0x100000001B3n
          ) ^
            BigInt.asUintN(
              64,
              value,
            ),
        );
    };

  mix(
    locator.galaxyIndex,
  );

  if (
    'sectorKey' in
    locator
  ) {
    mix(
      locator.sectorKey,
    );
  }

  if (
    'galacticObjectIndex' in
    locator
  ) {
    mix(
      locator
        .galacticObjectIndex,
    );
  }

  if (
    'bodyIndex' in
    locator
  ) {
    mix(
      locator.bodyIndex,
    );
  }

  if (
    'civilizationIndex' in
    locator
  ) {
    mix(
      locator
        .civilizationIndex,
    );
  }

  return accumulator
    .toString(
      16,
    )
    .padStart(
      32,
      '0',
    )
    .slice(
      -32,
    )
    .toUpperCase();
}