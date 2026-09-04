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
  DetectedToDiscoveredScientificDimension,
  DetectedToDiscoveredScientificProfile,
} from '../../domain/discovery/detected-to-discovered-scientific-profile';

import {
  ScientificEvidence,
} from '../../domain/discovery/scientific-evidence';

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
  DexieDetectedToDiscoveredScientificProgressionRuntime,
} from './detected-to-discovered-scientific-progression.runtime';

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
  DetectedToDiscoveredScientificProfile {

  const create =
    (
      dimensionCode:
        string,
    ) =>
      new ScientificCompletenessRequirement({
        dimensionCode,
        weight:
          1,
        minimumEvidenceCount:
          1,
        minimumIndependentSources:
          1,
        minimumQuality01:
          0.6,
        maximumUncertainty01:
          0.4,
      });

  return new DetectedToDiscoveredScientificProfile({
    nature:
      create(
        DetectedToDiscoveredScientificDimension
          .NATURE,
      ),
    identity:
      create(
        DetectedToDiscoveredScientificDimension
          .IDENTITY,
      ),
    basicArchitecture:
      create(
        DetectedToDiscoveredScientificDimension
          .BASIC_ARCHITECTURE,
      ),
  });
}

function evidence(
  dimensionCode:
    string,

  quality01 =
    0.9,

  uncertainty01 =
    0.1,
): ScientificEvidence {

  return new ScientificEvidence({
    dimensionCode,
    evidenceCode:
      `RESOLUTION:${dimensionCode}`,
    sourceKey:
      `OBSERVATION:${dimensionCode}`,
    independenceKey:
      `INSTRUMENT:${dimensionCode}`,
    quality01,
    uncertainty01,
    observedAtEpochMs:
      2000,
  });
}

describe(
  'DexieDetectedToDiscoveredScientificProgressionRuntime point 26.A.3',
  () => {
    const databaseName =
      'genesis-web-point-26-A-3-detected-discovered';

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

    const unknownLocator =
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
      DexieDetectedToDiscoveredScientificProgressionRuntime;

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
          new DexieDetectedToDiscoveredScientificProgressionRuntime(
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
            locator,
            DiscoveryState.DETECTED,
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
      'should persist observations incrementally and advance only when all three discovery dimensions become sufficient',
      async () => {
        const first =
          await runtime
            .recordEvidence(
              generationKey,
              locator,
              evidence(
                'NATURE',
              ),
              profile(),
            );

        expect(
          first.stateAfter,
        ).toBe(
          DiscoveryState.DETECTED,
        );

        expect(
          first.completeness
            .satisfiedRequirementCount,
        ).toBe(1);

        const second =
          await runtime
            .recordEvidence(
              generationKey,
              locator,
              evidence(
                'IDENTITY',
              ),
              profile(),
            );

        expect(
          second.stateAfter,
        ).toBe(
          DiscoveryState.DETECTED,
        );

        const third =
          await runtime
            .recordEvidence(
              generationKey,
              locator,
              evidence(
                'BASIC_ARCHITECTURE',
              ),
              profile(),
            );

        expect(
          third.stateBefore,
        ).toBe(
          DiscoveryState.DETECTED,
        );

        expect(
          third.stateAfter,
        ).toBe(
          DiscoveryState.DISCOVERED,
        );

        expect(
          third.didAdvance,
        ).toBe(true);

        expect(
          third.evidence,
        ).toHaveLength(3);

        expect(
          await discoveryRepository
            .getState(
              generationKey,
              locator,
            ),
        ).toBe(
          DiscoveryState.DISCOVERED,
        );
      },
    );

    it(
      'should leave global and galaxy Discovery Points unchanged because 26.A.3 is evidence-driven rather than bought with PD',
      async () => {
        for (
          const dimension
          of [
            'NATURE',
            'IDENTITY',
            'BASIC_ARCHITECTURE',
          ]
        ) {
          await runtime
            .recordEvidence(
              generationKey,
              locator,
              evidence(
                dimension,
              ),
              profile(),
            );
        }

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
      'should remain DETECTED for insufficient evidence and advance after the same persisted evidence improves monotonically',
      async () => {
        await runtime
          .recordEvidence(
            generationKey,
            locator,
            evidence(
              'NATURE',
            ),
            profile(),
          );

        await runtime
          .recordEvidence(
            generationKey,
            locator,
            evidence(
              'IDENTITY',
            ),
            profile(),
          );

        const insufficient =
          await runtime
            .recordEvidence(
              generationKey,
              locator,
              evidence(
                'BASIC_ARCHITECTURE',
                0.55,
                0.45,
              ),
              profile(),
            );

        expect(
          insufficient.stateAfter,
        ).toBe(
          DiscoveryState.DETECTED,
        );

        const improved =
          await runtime
            .recordEvidence(
              generationKey,
              locator,
              evidence(
                'BASIC_ARCHITECTURE',
                0.9,
                0.1,
              ),
              profile(),
            );

        expect(
          improved.stateAfter,
        ).toBe(
          DiscoveryState.DISCOVERED,
        );

        expect(
          improved.persistedEvidence
            .quality01,
        ).toBe(0.9);

        expect(
          improved.persistedEvidence
            .uncertainty01,
        ).toBe(0.1);
      },
    );

    it(
      'should be idempotent after DISCOVERED and must never skip to VISITED from the 26.A.3 threshold',
      async () => {
        for (
          const dimension
          of [
            'NATURE',
            'IDENTITY',
            'BASIC_ARCHITECTURE',
          ]
        ) {
          await runtime
            .recordEvidence(
              generationKey,
              locator,
              evidence(
                dimension,
              ),
              profile(),
            );
        }

        const replay =
          await runtime
            .recordEvidence(
              generationKey,
              locator,
              evidence(
                'NATURE',
              ),
              profile(),
            );

        expect(
          replay.stateBefore,
        ).toBe(
          DiscoveryState.DISCOVERED,
        );

        expect(
          replay.stateAfter,
        ).toBe(
          DiscoveryState.DISCOVERED,
        );

        expect(
          replay.didAdvance,
        ).toBe(false);

        expect(
          await discoveryRepository
            .getState(
              generationKey,
              locator,
            ),
        ).not.toBe(
          DiscoveryState.VISITED,
        );
      },
    );

    it(
      'should reject evidence for UNKNOWN targets and roll back without materializing observed knowledge',
      async () => {
        await expect(
          runtime
            .recordEvidence(
              generationKey,
              unknownLocator,
              evidence(
                'NATURE',
              ),
              profile(),
            ),
        ).rejects.toThrow(
          /DETECTED or higher/,
        );

        expect(
          await evidenceRepository
            .getEvidence(
              generationKey,
              unknownLocator,
            ),
        ).toEqual([]);

        expect(
          await discoveryRepository
            .getState(
              generationKey,
              unknownLocator,
            ),
        ).toBe(
          DiscoveryState.UNKNOWN,
        );
      },
    );

    it(
      'should preserve the evidence and DISCOVERED state across a database close/reopen cycle',
      async () => {
        for (
          const dimension
          of [
            'NATURE',
            'IDENTITY',
            'BASIC_ARCHITECTURE',
          ]
        ) {
          await runtime
            .recordEvidence(
              generationKey,
              locator,
              evidence(
                dimension,
              ),
              profile(),
            );
        }

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
            () => 3000,
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
              locator,
            ),
        ).toBe(
          DiscoveryState.DISCOVERED,
        );

        expect(
          await evidenceRepository
            .getEvidence(
              generationKey,
              locator,
            ),
        ).toHaveLength(3);
      },
    );
  },
);
