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
  VisitedToCataloguedScientificProfile,
} from '../../domain/discovery/visited-to-catalogued-scientific-profile';

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
  DexieVisitedToCataloguedScientificProgressionRuntime,
} from './visited-to-catalogued-scientific-progression.runtime';

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
  VisitedToCataloguedScientificProfile {

  return new VisitedToCataloguedScientificProfile({
    profileCode:
      'TEST_OBJECT',
    requirements: [
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
      new ScientificCompletenessRequirement({
        dimensionCode:
          'ORBITAL_ARCHITECTURE',
        weight:
          1,
        minimumEvidenceCount:
          1,
        minimumIndependentSources:
          1,
        minimumQuality01:
          0.75,
        maximumUncertainty01:
          0.25,
      }),
    ],
  });
}

function evidence(
  dimensionCode:
    string,

  observedAtEpochMs:
    number = 2000,

  quality01:
    number = 0.9,

  uncertainty01:
    number = 0.1,
): ScientificEvidence {

  return new ScientificEvidence({
    dimensionCode,
    evidenceCode:
      `CATALOGUE:${dimensionCode}`,
    sourceKey:
      `OBSERVATION:${dimensionCode}`,
    independenceKey:
      `INSTRUMENT:${dimensionCode}`,
    quality01,
    uncertainty01,
    observedAtEpochMs,
  });
}

describe(
  'DexieVisitedToCataloguedScientificProgressionRuntime point 26.A.5',
  () => {
    const databaseName =
      'genesis-web-point-26-A-5-visited-catalogued';

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

    const visitedLocator =
      new SystemLocator(
        0n,
        10n,
        7n,
      );

    const discoveredLocator =
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
      DexieVisitedToCataloguedScientificProgressionRuntime;

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
          new DexieVisitedToCataloguedScientificProgressionRuntime(
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
            visitedLocator,
            DiscoveryState.VISITED,
          );

        await discoveryRepository
          .setState(
            generationKey,
            discoveredLocator,
            DiscoveryState.DISCOVERED,
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
      'should remain VISITED while the object-specific scientific requirements are incomplete',
      async () => {
        const committed =
          await runtime
            .recordEvidence(
              generationKey,
              visitedLocator,
              evidence(
                'CHARACTERIZATION',
              ),
              profile(),
            );

        expect(
          committed.stateBefore,
        ).toBe(
          DiscoveryState.VISITED,
        );

        expect(
          committed.stateAfter,
        ).toBe(
          DiscoveryState.VISITED,
        );

        expect(
          committed.completeness
            .satisfiedRequirementCount,
        ).toBe(1);

        expect(
          committed.didAdvance,
        ).toBe(false);
      },
    );

    it(
      'should atomically promote VISITED to CATALOGUED when the final minimum requirement becomes satisfied',
      async () => {
        await runtime
          .recordEvidence(
            generationKey,
            visitedLocator,
            evidence(
              'CHARACTERIZATION',
            ),
            profile(),
          );

        const committed =
          await runtime
            .recordEvidence(
              generationKey,
              visitedLocator,
              evidence(
                'ORBITAL_ARCHITECTURE',
              ),
              profile(),
            );

        expect(
          committed.profileCode,
        ).toBe(
          'TEST_OBJECT',
        );

        expect(
          committed.stateBefore,
        ).toBe(
          DiscoveryState.VISITED,
        );

        expect(
          committed.stateAfter,
        ).toBe(
          DiscoveryState.CATALOGUED,
        );

        expect(
          committed.completeness
            .isComplete,
        ).toBe(true);

        expect(
          committed.didAdvance,
        ).toBe(true);

        expect(
          await discoveryRepository
            .getState(
              generationKey,
              visitedLocator,
            ),
        ).toBe(
          DiscoveryState.CATALOGUED,
        );
      },
    );

    it(
      'should evaluate already-persisted evidence without requiring a fake extra observation',
      async () => {
        await evidenceRepository
          .recordEvidence(
            generationKey,
            visitedLocator,
            evidence(
              'CHARACTERIZATION',
            ),
          );

        await evidenceRepository
          .recordEvidence(
            generationKey,
            visitedLocator,
            evidence(
              'ORBITAL_ARCHITECTURE',
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
              visitedLocator,
              profile(),
            );

        expect(
          committed.persistedEvidence,
        ).toBeNull();

        expect(
          committed.stateAfter,
        ).toBe(
          DiscoveryState.CATALOGUED,
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
      'should reject cataloguing work before VISITED and must not bypass DISCOVERED to CATALOGUED',
      async () => {
        const observationsBefore =
          await database
            .observations
            .count();

        await expect(
          runtime
            .recordEvidence(
              generationKey,
              discoveredLocator,
              evidence(
                'CHARACTERIZATION',
              ),
              profile(),
            ),
        ).rejects.toThrow(
          /VISITED or higher/,
        );

        expect(
          await discoveryRepository
            .getState(
              generationKey,
              discoveredLocator,
            ),
        ).toBe(
          DiscoveryState.DISCOVERED,
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
      'should leave global and galaxy Discovery Points unchanged because cataloguing cannot be bought with PD',
      async () => {
        await runtime
          .recordEvidence(
            generationKey,
            visitedLocator,
            evidence(
              'CHARACTERIZATION',
            ),
            profile(),
          );

        await runtime
          .recordEvidence(
            generationKey,
            visitedLocator,
            evidence(
              'ORBITAL_ARCHITECTURE',
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
      'should use monotonic evidence improvement before permitting cataloguing',
      async () => {
        await runtime
          .recordEvidence(
            generationKey,
            visitedLocator,
            evidence(
              'CHARACTERIZATION',
            ),
            profile(),
          );

        const insufficient =
          await runtime
            .recordEvidence(
              generationKey,
              visitedLocator,
              evidence(
                'ORBITAL_ARCHITECTURE',
                2000,
                0.7,
                0.35,
              ),
              profile(),
            );

        expect(
          insufficient.stateAfter,
        ).toBe(
          DiscoveryState.VISITED,
        );

        const improved =
          await runtime
            .recordEvidence(
              generationKey,
              visitedLocator,
              evidence(
                'ORBITAL_ARCHITECTURE',
                3000,
                0.9,
                0.1,
              ),
              profile(),
            );

        expect(
          improved.persistedEvidence
            ?.quality01,
        ).toBe(0.9);

        expect(
          improved.persistedEvidence
            ?.uncertainty01,
        ).toBe(0.1);

        expect(
          improved.stateAfter,
        ).toBe(
          DiscoveryState.CATALOGUED,
        );
      },
    );

    it(
      'should remain idempotent at CATALOGUED and continue preserving later evidence for point 26.A.6',
      async () => {
        await runtime
          .recordEvidence(
            generationKey,
            visitedLocator,
            evidence(
              'CHARACTERIZATION',
            ),
            profile(),
          );

        await runtime
          .recordEvidence(
            generationKey,
            visitedLocator,
            evidence(
              'ORBITAL_ARCHITECTURE',
            ),
            profile(),
          );

        const later =
          await runtime
            .recordEvidence(
              generationKey,
              visitedLocator,
              new ScientificEvidence({
                dimensionCode:
                  'VALIDATION',
                evidenceCode:
                  'FOLLOW_UP',
                sourceKey:
                  'FOLLOW_UP:1',
                independenceKey:
                  'SECONDARY',
                quality01:
                  0.95,
                uncertainty01:
                  0.05,
                observedAtEpochMs:
                  4000,
              }),
              profile(),
            );

        expect(
          later.stateBefore,
        ).toBe(
          DiscoveryState.CATALOGUED,
        );

        expect(
          later.stateAfter,
        ).toBe(
          DiscoveryState.CATALOGUED,
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
      'should preserve CATALOGUED and its evidence across a database close/reopen cycle',
      async () => {
        await runtime
          .recordEvidence(
            generationKey,
            visitedLocator,
            evidence(
              'CHARACTERIZATION',
            ),
            profile(),
          );

        await runtime
          .recordEvidence(
            generationKey,
            visitedLocator,
            evidence(
              'ORBITAL_ARCHITECTURE',
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
              visitedLocator,
            ),
        ).toBe(
          DiscoveryState.CATALOGUED,
        );

        expect(
          await evidenceRepository
            .getEvidence(
              generationKey,
              visitedLocator,
            ),
        ).toHaveLength(2);
      },
    );
  },
);
