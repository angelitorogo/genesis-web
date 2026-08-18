import Dexie from 'dexie';

import {
  IDBKeyRange,
  indexedDB,
} from 'fake-indexeddb';

import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

import {
  DiscoveryTargetType,
} from '../../domain/discovery/discovery-target-type';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  GalacticObjectLocator,
  type ProceduralLocator,
} from '../../domain/generation/procedural-locator';

import {
  UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  SupernovaRemnantGenerator,
} from '../../simulation/galactic-object/supernova-remnant-generator';

import {
  ProceduralTargetResolver,
} from '../../simulation/regeneration/procedural-target-resolver';

import {
  GenesisIndexedDb,
} from '../../data/local/indexed-db/genesis-indexed-db';

import {
  DexieDiscoveryRepository,
  type ProceduralTargetSeedResolver,
} from '../../data/local/repository/dexie-discovery.repository';

import {
  DexieUniverseRepository,
} from '../../data/local/repository/dexie-universe.repository';

const TARGET_SEED_RESOLVER:
  ProceduralTargetSeedResolver =
  Object.freeze({
    resolveTargetSeedNormalized(
      generationKey:
        UniverseGenerationKey,

      locator:
        ProceduralLocator,
    ): string {

      return ProceduralTargetResolver
        .resolveTargetSeed(
          generationKey,
          locator,
        )
        .normalizedValue;
    },
  });

describe(
  'point-12.6 supernova-remnant persistence',
  () => {
    const databaseName =
      'genesis-web-point-12-6-supernova-remnant-persistence';

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

    const locator =
      new GalacticObjectLocator(
        0n,
        0n,
        0n,
      );

    let database:
      GenesisIndexedDb;

    beforeEach(
      () => {
        database =
          new GenesisIndexedDb(
            databaseName,
            dependencies,
          );
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
      'should persist the remnant GalacticObjectLocator and regenerate identical Ground Truth after reopening',
      async () => {
        const universeRepository =
          new DexieUniverseRepository(
            database,
          );

        const discoveryRepository =
          new DexieDiscoveryRepository(
            database,
            TARGET_SEED_RESOLVER,
          );

        await universeRepository
          .createIfAbsent(
            generationKey,
          );

        const before =
          SupernovaRemnantGenerator
            .generate(
              generationKey,
              locator,
            );

        await discoveryRepository
          .setState(
            generationKey,
            locator,
            DiscoveryState.DETECTED,
          );

        database
          .closeDatabase();

        database =
          new GenesisIndexedDb(
            databaseName,
            dependencies,
          );

        const reopenedRepository =
          new DexieDiscoveryRepository(
            database,
            TARGET_SEED_RESOLVER,
          );

        const known =
          await reopenedRepository
            .getKnownDiscoveries(
              generationKey,
            );

        expect(
          known,
        ).toHaveLength(1);

        expect(
          known[0].state,
        ).toBe(
          DiscoveryState.DETECTED,
        );

        expect(
          DiscoveryTargetType
            .fromLocator(
              known[0].locator,
            ),
        ).toBe(
          DiscoveryTargetType
            .GALACTIC_OBJECT,
        );

        expect(
          known[0].locator,
        ).toBeInstanceOf(
          GalacticObjectLocator,
        );

        const after =
          SupernovaRemnantGenerator
            .generate(
              generationKey,
              known[0].locator as GalacticObjectLocator,
            );

        expect(
          after.morphology,
        ).toBe(
          before.morphology,
        );

        expect(
          after.physicalProperties,
        ).toEqual(
          before.physicalProperties,
        );

        expect(
          after.location,
        ).toEqual(
          before.location,
        );
      },
    );

    it(
      'should persist identity and discovery state without duplicating regenerable physical Ground Truth',
      async () => {
        const universeRepository =
          new DexieUniverseRepository(
            database,
          );

        const discoveryRepository =
          new DexieDiscoveryRepository(
            database,
            TARGET_SEED_RESOLVER,
          );

        await universeRepository
          .createIfAbsent(
            generationKey,
          );

        await discoveryRepository
          .setState(
            generationKey,
            locator,
            DiscoveryState.DETECTED,
          );

        const rows =
          await database
            .discoveries
            .toArray();

        expect(
          rows,
        ).toHaveLength(1);

        expect(
          rows[0].targetTypeCode,
        ).toBe(
          DiscoveryTargetType
            .GALACTIC_OBJECT
            .code,
        );

        expect(
          rows[0].galacticObjectIndex,
        ).toBe('0');

        expect(
          'morphology' in
            rows[0],
        ).toBe(false);

        expect(
          'physicalProperties' in
            rows[0],
        ).toBe(false);
      },
    );
  },
);
