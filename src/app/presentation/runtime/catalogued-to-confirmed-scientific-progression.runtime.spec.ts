import Dexie from 'dexie';

import {
  IDBKeyRange,
  indexedDB,
} from 'fake-indexeddb';

import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

import {
  ScientificCompletenessRequirement,
} from '../../domain/discovery/scientific-completeness';

import {
  ScientificEvidence,
} from '../../domain/discovery/scientific-evidence';

import {
  CataloguedToConfirmedScientificProfile,
  ScientificConfirmationRequirement,
} from '../../domain/discovery/catalogued-to-confirmed-scientific-profile';

import {
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
  DexieCataloguedToConfirmedScientificProgressionRuntime,
} from './catalogued-to-confirmed-scientific-progression.runtime';

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
          ? locator
              .galacticObjectIndex
          : locator
              .galaxyIndex;

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

function profile():
  CataloguedToConfirmedScientificProfile {

  return new CataloguedToConfirmedScientificProfile({
    profileCode:
      'TEST_OBJECT',
    requirements: [
      new ScientificConfirmationRequirement({
        cataloguedBaseline:
          new ScientificCompletenessRequirement({
            dimensionCode:
              'CHARACTERIZATION',
            weight:
              2,
            minimumEvidenceCount:
              1,
            minimumIndependentSources:
              1,
            minimumQuality01:
              0.7,
            maximumUncertainty01:
              0.3,
          }),
        confirmationRequirement:
          new ScientificCompletenessRequirement({
            dimensionCode:
              'CHARACTERIZATION',
            weight:
              2,
            minimumEvidenceCount:
              2,
            minimumIndependentSources:
              2,
            minimumQuality01:
              0.8,
            maximumUncertainty01:
              0.1,
          }),
      }),
    ],
  });
}

function evidence(
  sourceKey:
    string,

  independenceKey:
    string,

  observedAtEpochMs:
    number,

  uncertainty01:
    number = 0.05,

  quality01:
    number = 0.9,
): ScientificEvidence {

  return new ScientificEvidence({
    dimensionCode:
      'CHARACTERIZATION',
    evidenceCode:
      `CONFIRM:${sourceKey}`,
    sourceKey,
    independenceKey,
    quality01,
    uncertainty01,
    observedAtEpochMs,
  });
}

describe(
  'DexieCataloguedToConfirmedScientificProgressionRuntime point 26.A.6',
  () => {
    const databaseName =
      'genesis-web-point-26-A-6-catalogued-confirmed';

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

    const cataloguedLocator =
      new SystemLocator(
        0n,
        10n,
        7n,
      );

    const visitedLocator =
      new SystemLocator(
        0n,
        10n,
        8n,
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
      DexieCataloguedToConfirmedScientificProgressionRuntime;

    beforeEach(
      async () => {
        database =
          new GenesisIndexedDb(
            databaseName,
            dependencies,
          );

        universeRepository =
          new DexieUniverseRepository(
            database,
            () => 1000,
          );

        discoveryRepository =
          new DexieDiscoveryRepository(
            database,
            TARGET_SEED_RESOLVER,
            () => 1000,
          );

        evidenceRepository =
          new DexieScientificEvidenceRepository(
            database,
            TARGET_SEED_RESOLVER,
          );

        pointsRepository =
          new DexieDiscoveryPointsRepository(
            database,
            () => 1000,
          );

        runtime =
          new DexieCataloguedToConfirmedScientificProgressionRuntime(
            database,
            discoveryRepository,
            evidenceRepository,
          );

        await universeRepository
          .createIfAbsent(
            generationKey,
          );

        await discoveryRepository
          .setState(
            generationKey,
            cataloguedLocator,
            DiscoveryState.CATALOGUED,
          );

        await discoveryRepository
          .setState(
            generationKey,
            visitedLocator,
            DiscoveryState.VISITED,
          );

        await pointsRepository
          .setGlobalDiscoveryPoints(
            generationKey,
            500n,
          );

        await pointsRepository
          .setGalaxyDiscoveryPoints(
            generationKey,
            0n,
            75n,
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
      'should remain CATALOGUED while only the former catalogue-level evidence exists',
      async () => {
        const committed =
          await runtime
            .recordEvidence(
              generationKey,
              cataloguedLocator,
              evidence(
                'SPECTRUM:A',
                'SPECTROSCOPY:A',
                2000,
              ),
              profile(),
            );

        expect(
          committed.stateBefore,
        ).toBe(
          DiscoveryState.CATALOGUED,
        );

        expect(
          committed.cataloguedBaselineCompleteness
            .isComplete,
        ).toBe(true);

        expect(
          committed.confirmationCompleteness
            .isComplete,
        ).toBe(false);

        expect(
          committed.stateAfter,
        ).toBe(
          DiscoveryState.CATALOGUED,
        );

        expect(
          committed.didAdvance,
        ).toBe(false);
      },
    );

    it(
      'should require scientifically independent follow-up evidence instead of counting the same independence source twice',
      async () => {
        await runtime
          .recordEvidence(
            generationKey,
            cataloguedLocator,
            evidence(
              'SPECTRUM:A',
              'SPECTROSCOPY:A',
              2000,
            ),
            profile(),
          );

        const committed =
          await runtime
            .recordEvidence(
              generationKey,
              cataloguedLocator,
              evidence(
                'SPECTRUM:B',
                'SPECTROSCOPY:A',
                3000,
              ),
              profile(),
            );

        expect(
          committed.confirmationCompleteness
            .requirements[0]
            .qualifyingEvidenceCount,
        ).toBe(2);

        expect(
          committed.confirmationCompleteness
            .requirements[0]
            .independentSourceCount,
        ).toBe(1);

        expect(
          committed.stateAfter,
        ).toBe(
          DiscoveryState.CATALOGUED,
        );
      },
    );

    it(
      'should not confirm until independent follow-up also reaches the stricter uncertainty threshold',
      async () => {
        await runtime
          .recordEvidence(
            generationKey,
            cataloguedLocator,
            evidence(
              'SPECTRUM:A',
              'SPECTROSCOPY:A',
              2000,
            ),
            profile(),
          );

        const insufficient =
          await runtime
            .recordEvidence(
              generationKey,
              cataloguedLocator,
              evidence(
                'PERIOD:B',
                'TEMPORAL:B',
                3000,
                0.2,
              ),
              profile(),
            );

        expect(
          insufficient.stateAfter,
        ).toBe(
          DiscoveryState.CATALOGUED,
        );

        const improved =
          await runtime
            .recordEvidence(
              generationKey,
              cataloguedLocator,
              evidence(
                'PERIOD:B',
                'TEMPORAL:B',
                4000,
                0.08,
              ),
              profile(),
            );

        expect(
          improved.persistedEvidence
            ?.uncertainty01,
        ).toBe(0.08);

        expect(
          improved.confirmationCompleteness
            .isComplete,
        ).toBe(true);

        expect(
          improved.stateAfter,
        ).toBe(
          DiscoveryState.CONFIRMED,
        );

        expect(
          improved.didAdvance,
        ).toBe(true);

        expect(
          await discoveryRepository
            .getState(
              generationKey,
              cataloguedLocator,
            ),
        ).toBe(
          DiscoveryState.CONFIRMED,
        );
      },
    );

    it(
      'should evaluate already-persisted confirmation evidence without inventing a fake observation',
      async () => {
        await evidenceRepository
          .recordEvidence(
            generationKey,
            cataloguedLocator,
            evidence(
              'SPECTRUM:A',
              'SPECTROSCOPY:A',
              2000,
            ),
          );

        await evidenceRepository
          .recordEvidence(
            generationKey,
            cataloguedLocator,
            evidence(
              'PERIOD:B',
              'TEMPORAL:B',
              3000,
              0.08,
            ),
          );

        const observationCountBefore =
          await database
            .observations
            .count();

        const committed =
          await runtime
            .evaluateCurrentEvidence(
              generationKey,
              cataloguedLocator,
              profile(),
            );

        expect(
          committed.persistedEvidence,
        ).toBeNull();

        expect(
          committed.stateAfter,
        ).toBe(
          DiscoveryState.CONFIRMED,
        );

        expect(
          await database
            .observations
            .count(),
        ).toBe(
          observationCountBefore,
        );
      },
    );

    it(
      'should reject confirmation work before CATALOGUED and must not bypass VISITED',
      async () => {
        const observationsBefore =
          await database
            .observations
            .count();

        await expect(
          runtime
            .recordEvidence(
              generationKey,
              visitedLocator,
              evidence(
                'PERIOD:B',
                'TEMPORAL:B',
                3000,
                0.08,
              ),
              profile(),
            ),
        ).rejects.toThrow(
          /CATALOGUED or higher/,
        );

        expect(
          await discoveryRepository
            .getState(
              generationKey,
              visitedLocator,
            ),
        ).toBe(
          DiscoveryState.VISITED,
        );

        expect(
          await database
            .observations
            .count(),
        ).toBe(
          observationsBefore,
        );
      },
    );

    it(
      'should leave global and galaxy Discovery Points unchanged because confirmation cannot be bought with PD',
      async () => {
        await runtime
          .recordEvidence(
            generationKey,
            cataloguedLocator,
            evidence(
              'SPECTRUM:A',
              'SPECTROSCOPY:A',
              2000,
            ),
            profile(),
          );

        await runtime
          .recordEvidence(
            generationKey,
            cataloguedLocator,
            evidence(
              'PERIOD:B',
              'TEMPORAL:B',
              3000,
              0.08,
            ),
            profile(),
          );

        expect(
          await pointsRepository
            .getGlobalDiscoveryPoints(
              generationKey,
            ),
        ).toBe(500n);

        expect(
          await pointsRepository
            .getGalaxyDiscoveryPoints(
              generationKey,
              0n,
            ),
        ).toBe(75n);
      },
    );

    it(
      'should remain idempotent at CONFIRMED while preserving later evidence',
      async () => {
        await runtime
          .recordEvidence(
            generationKey,
            cataloguedLocator,
            evidence(
              'SPECTRUM:A',
              'SPECTROSCOPY:A',
              2000,
            ),
            profile(),
          );

        await runtime
          .recordEvidence(
            generationKey,
            cataloguedLocator,
            evidence(
              'PERIOD:B',
              'TEMPORAL:B',
              3000,
              0.08,
            ),
            profile(),
          );

        const later =
          await runtime
            .recordEvidence(
              generationKey,
              cataloguedLocator,
              new ScientificEvidence({
                dimensionCode:
                  'FOLLOW_UP',
                evidenceCode:
                  'FOLLOW_UP:1',
                sourceKey:
                  'FOLLOW_UP:1',
                independenceKey:
                  'FOLLOW_UP',
                quality01:
                  0.99,
                uncertainty01:
                  0.01,
                observedAtEpochMs:
                  5000,
              }),
              profile(),
            );

        expect(
          later.stateBefore,
        ).toBe(
          DiscoveryState.CONFIRMED,
        );

        expect(
          later.stateAfter,
        ).toBe(
          DiscoveryState.CONFIRMED,
        );

        expect(
          later.didAdvance,
        ).toBe(false);

        expect(
          later.evidence,
        ).toHaveLength(3);
      },
    );

    it(
      'should preserve CONFIRMED and all scientific evidence across a database close/reopen cycle',
      async () => {
        await runtime
          .recordEvidence(
            generationKey,
            cataloguedLocator,
            evidence(
              'SPECTRUM:A',
              'SPECTROSCOPY:A',
              2000,
            ),
            profile(),
          );

        await runtime
          .recordEvidence(
            generationKey,
            cataloguedLocator,
            evidence(
              'PERIOD:B',
              'TEMPORAL:B',
              3000,
              0.08,
            ),
            profile(),
          );

        database.closeDatabase();

        database =
          new GenesisIndexedDb(
            databaseName,
            dependencies,
          );

        discoveryRepository =
          new DexieDiscoveryRepository(
            database,
            TARGET_SEED_RESOLVER,
            () => 5000,
          );

        evidenceRepository =
          new DexieScientificEvidenceRepository(
            database,
            TARGET_SEED_RESOLVER,
          );

        expect(
          await discoveryRepository
            .getState(
              generationKey,
              cataloguedLocator,
            ),
        ).toBe(
          DiscoveryState.CONFIRMED,
        );

        expect(
          await evidenceRepository
            .getEvidence(
              generationKey,
              cataloguedLocator,
            ),
        ).toHaveLength(2);
      },
    );
  },
);
