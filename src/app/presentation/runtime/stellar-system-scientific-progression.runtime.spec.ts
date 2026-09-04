import Dexie from 'dexie';

import {
  IDBKeyRange,
  indexedDB,
} from 'fake-indexeddb';

import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

import {
  DiscoveredToVisitedEntryKind,
} from '../../domain/discovery/discovered-to-visited-entry';

import {
  BodyLocator,
  GalacticObjectLocator,
  GalaxyLocator,
  type ProceduralLocator,
  SystemLocator,
} from '../../domain/generation/procedural-locator';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  GenesisIndexedDb,
} from '../../data/local/indexed-db/genesis-indexed-db';

import {
  DexieDiscoveryPointsRepository,
} from '../../data/local/repository/dexie-discovery-points.repository';

import {
  DexieDiscoveryRepository,
  type ProceduralTargetSeedResolver,
} from '../../data/local/repository/dexie-discovery.repository';

import {
  DexieScientificEvidenceRepository,
} from '../../data/local/repository/dexie-scientific-evidence.repository';

import {
  DexieUniverseRepository,
} from '../../data/local/repository/dexie-universe.repository';

import {
  StellarSystemScientificObservationRuleCode,
} from '../../simulation/observation/stellar-system-scientific-observation-catalog';

import {
  DexieStellarSystemScientificProgressionRuntime,
} from './stellar-system-scientific-progression.runtime';

const TARGET_SEED_RESOLVER:
  ProceduralTargetSeedResolver =
  Object.freeze({
    resolveTargetSeedNormalized(
      _generationKey:
        UniverseGenerationKey,

      locator:
        ProceduralLocator,
    ): string {

      const ordinal =
        'galacticObjectIndex' in
          locator
          ? locator.galacticObjectIndex
          : locator.galaxyIndex;

      return (
        ordinal +
        1n
      )
        .toString(
          16,
        )
        .toUpperCase()
        .padStart(
          32,
          '0',
        );
    },
  });

const DISCOVERY_RULES =
  [
    StellarSystemScientificObservationRuleCode.RESOLVE_NATURE_OPTICAL,
    StellarSystemScientificObservationRuleCode.RESOLVE_IDENTITY_OPTICAL,
    StellarSystemScientificObservationRuleCode.RESOLVE_BASIC_ARCHITECTURE_OPTICAL,
  ] as const;

const CATALOGUE_RULES =
  [
    StellarSystemScientificObservationRuleCode.CLASSIFICATION_PHOTOMETRY,
    StellarSystemScientificObservationRuleCode.PHYSICAL_PROPERTIES_OPTICAL,
    StellarSystemScientificObservationRuleCode.PHYSICAL_PROPERTIES_RADIO,
    StellarSystemScientificObservationRuleCode.ORBITAL_ARCHITECTURE_ASTROMETRY,
    StellarSystemScientificObservationRuleCode.ORBITAL_ARCHITECTURE_RADIO_TIMING,
  ] as const;

const CONFIRMATION_FOLLOW_UP_RULES =
  [
    StellarSystemScientificObservationRuleCode.CLASSIFICATION_SPECTROSCOPY,
    StellarSystemScientificObservationRuleCode.PHYSICAL_PROPERTIES_INFRARED,
    StellarSystemScientificObservationRuleCode.ORBITAL_ARCHITECTURE_SPECTROSCOPIC_DYNAMICS,
  ] as const;

describe(
  'DexieStellarSystemScientificProgressionRuntime point 26.A.9',
  () => {
    const databaseName =
      'genesis-web-point-26-A-9-shared-stellar-progression';

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
      new SystemLocator(
        0n,
        10n,
        7n,
      );

    let database:
      GenesisIndexedDb;

    let universeRepository:
      DexieUniverseRepository;

    let discoveryRepository:
      DexieDiscoveryRepository;

    let evidenceRepository:
      DexieScientificEvidenceRepository;

    let pointsRepository:
      DexieDiscoveryPointsRepository;

    let runtime:
      DexieStellarSystemScientificProgressionRuntime;

    let now:
      number;

    beforeEach(
      async () => {
        now =
          10_000;

        database =
          new GenesisIndexedDb(
            databaseName,
            dependencies,
          );

        universeRepository =
          new DexieUniverseRepository(
            database,
            () => now,
          );

        discoveryRepository =
          new DexieDiscoveryRepository(
            database,
            TARGET_SEED_RESOLVER,
            () => now,
          );

        evidenceRepository =
          new DexieScientificEvidenceRepository(
            database,
            TARGET_SEED_RESOLVER,
          );

        pointsRepository =
          new DexieDiscoveryPointsRepository(
            database,
            () => now,
          );

        runtime =
          new DexieStellarSystemScientificProgressionRuntime(
            database,
            pointsRepository,
            discoveryRepository,
            evidenceRepository,
            () => ++now,
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

        await seedFullInstrumentFrontier(
          discoveryRepository,
        );

        await pointsRepository
          .setGlobalDiscoveryPoints(
            generationKey,
            10_000n,
          );

        await pointsRepository
          .setGalaxyDiscoveryPoints(
            generationKey,
            0n,
            500n,
          );
      },
    );

    afterEach(
      async () => {
        database.closeDatabase();

        const cleanup =
          new Dexie(
            databaseName,
            dependencies,
          );

        await cleanup.delete();
      },
    );

    it(
      'should drive DETECTED -> DISCOVERED -> VISITED -> CATALOGUED -> CONFIRMED from one persisted state/evidence boundary',
      async () => {
        for (
          const ruleCode
          of DISCOVERY_RULES
        ) {
          await runtime
            .performObservation(
              generationKey,
              locator,
              ruleCode,
            );
        }

        let snapshot =
          await runtime
            .snapshot(
              generationKey,
              locator,
            );

        expect(
          snapshot.discoveryState,
        ).toBe(
          DiscoveryState.DISCOVERED,
        );

        expect(
          snapshot.evidence,
        ).toHaveLength(3);

        expect(
          snapshot.rules,
        ).toHaveLength(0);

        const visited =
          await runtime
            .recordEntry(
              generationKey,
              locator,
              DiscoveredToVisitedEntryKind.SCENE,
            );

        expect(
          visited.stateAfter,
        ).toBe(
          DiscoveryState.VISITED,
        );

        expect(
          visited.snapshot.evidence,
        ).toHaveLength(3);

        for (
          const ruleCode
          of CATALOGUE_RULES
        ) {
          await runtime
            .performObservation(
              generationKey,
              locator,
              ruleCode,
            );
        }

        snapshot =
          await runtime
            .snapshot(
              generationKey,
              locator,
            );

        expect(
          snapshot.discoveryState,
        ).toBe(
          DiscoveryState.CATALOGUED,
        );

        expect(
          snapshot.evidence,
        ).toHaveLength(8);

        expect(
          snapshot.rules,
        ).toHaveLength(8);

        expect(
          snapshot.rules.every(
            rule =>
              rule.minimumLevel.rank ===
              4,
          ),
        ).toBe(true);

        for (
          const ruleCode
          of CONFIRMATION_FOLLOW_UP_RULES
        ) {
          await runtime
            .performObservation(
              generationKey,
              locator,
              ruleCode,
            );
        }

        snapshot =
          await runtime
            .snapshot(
              generationKey,
              locator,
            );

        expect(
          snapshot.discoveryState,
        ).toBe(
          DiscoveryState.CONFIRMED,
        );

        expect(
          snapshot.evidence,
        ).toHaveLength(11);

        expect(
          snapshot.rules,
        ).toHaveLength(0);

        expect(
          await pointsRepository
            .getGlobalDiscoveryPoints(
              generationKey,
            ),
        ).toBe(10_120n);

        expect(
          await pointsRepository
            .getGalaxyDiscoveryPoints(
              generationKey,
              0n,
            ),
        ).toBe(620n);
      },
    );

    it(
      'should record VISITED as interaction only and never manufacture evidence',
      async () => {
        await discoveryRepository
          .setState(
            generationKey,
            locator,
            DiscoveryState.DISCOVERED,
          );

        const before =
          await evidenceRepository
            .getEvidence(
              generationKey,
              locator,
            );

        const committed =
          await runtime
            .recordEntry(
              generationKey,
              locator,
              DiscoveredToVisitedEntryKind.DETAILED_CARD,
            );

        const after =
          await evidenceRepository
            .getEvidence(
              generationKey,
              locator,
            );

        expect(before).toHaveLength(0);
        expect(after).toHaveLength(0);
        expect(committed.stateAfter).toBe(DiscoveryState.VISITED);
        expect(committed.persistedEvidence).toBeNull();
      },
    );

    it(
      'should keep confirmation observations behind the level-4 progression gate instead of exposing the old ANALYZE_DISK shortcut',
      async () => {
        await discoveryRepository
          .setState(
            generationKey,
            locator,
            DiscoveryState.CATALOGUED,
          );

        await pointsRepository
          .setGlobalDiscoveryPoints(
            generationKey,
            0n,
          );

        const snapshot =
          await runtime
            .snapshot(
              generationKey,
              locator,
            );

        expect(snapshot.rules).toHaveLength(8);
        expect(
          snapshot.rules.every(
            rule =>
              rule.minimumLevel.rank ===
                4 &&
              !rule.isAvailable,
          ),
        ).toBe(true);

        await expect(
          runtime.performObservation(
            generationKey,
            locator,
            StellarSystemScientificObservationRuleCode.CLASSIFICATION_SPECTROSCOPY,
          ),
        ).rejects.toThrow(
          'blocked by the current PD/milestone instrument progression',
        );

        expect(
          await discoveryRepository
            .getState(
              generationKey,
              locator,
            ),
        ).toBe(
          DiscoveryState.CATALOGUED,
        );
      },
    );

    it(
      'should rehydrate the exact same DiscoveryState and ScientificEvidence after reopening the IndexedDB database',
      async () => {
        for (
          const ruleCode
          of DISCOVERY_RULES
        ) {
          await runtime
            .performObservation(
              generationKey,
              locator,
              ruleCode,
            );
        }

        const before =
          await runtime
            .snapshot(
              generationKey,
              locator,
            );

        database.closeDatabase();

        const reopenedDatabase =
          new GenesisIndexedDb(
            databaseName,
            dependencies,
          );

        const reopenedDiscoveryRepository =
          new DexieDiscoveryRepository(
            reopenedDatabase,
            TARGET_SEED_RESOLVER,
            () => 20_000,
          );

        const reopenedRuntime =
          new DexieStellarSystemScientificProgressionRuntime(
            reopenedDatabase,
            new DexieDiscoveryPointsRepository(
              reopenedDatabase,
              () => 20_000,
            ),
            reopenedDiscoveryRepository,
            new DexieScientificEvidenceRepository(
              reopenedDatabase,
              TARGET_SEED_RESOLVER,
            ),
            () => 20_000,
          );

        const after =
          await reopenedRuntime
            .snapshot(
              generationKey,
              locator,
            );

        expect(after.discoveryState).toBe(before.discoveryState);
        expect(after.evidence).toEqual(before.evidence);
        expect(after.globalDiscoveryPoints).toBe(before.globalDiscoveryPoints);
        expect(after.galaxyDiscoveryPoints).toBe(before.galaxyDiscoveryPoints);

        reopenedDatabase.closeDatabase();
      },
    );

    async function seedFullInstrumentFrontier(
      repository:
        DexieDiscoveryRepository,
    ): Promise<void> {

      await repository.setState(
        generationKey,
        new SystemLocator(
          0n,
          10n,
          8n,
        ),
        DiscoveryState.DISCOVERED,
      );

      await repository.setState(
        generationKey,
        new BodyLocator(
          0n,
          10n,
          8n,
          0n,
        ),
        DiscoveryState.CONFIRMED,
      );

      await repository.setState(
        generationKey,
        new GalacticObjectLocator(
          0n,
          10n,
          9n,
        ),
        DiscoveryState.CATALOGUED,
      );

      await repository.setState(
        generationKey,
        new GalaxyLocator(
          1n,
        ),
        DiscoveryState.DETECTED,
      );
    }
  },
);
