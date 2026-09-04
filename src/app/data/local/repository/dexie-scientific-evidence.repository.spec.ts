import Dexie from 'dexie';

import {
  IDBKeyRange,
  indexedDB,
} from 'fake-indexeddb';

import {
  ScientificEvidence,
} from '../../../domain/discovery/scientific-evidence';

import {
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
  UniverseSeed,
} from '../../../domain/universe/universe-seed';

import {
  GenesisIndexedDb,
} from '../indexed-db/genesis-indexed-db';

import {
  type ProceduralTargetSeedResolver,
} from './dexie-discovery.repository';

import {
  DexieScientificEvidenceRepository,
  SCIENTIFIC_EVIDENCE_OBSERVATION_KIND_V1,
} from './dexie-scientific-evidence.repository';

import {
  DexieUniverseRepository,
} from './dexie-universe.repository';

import {
  CorruptLocalDataError,
} from './local-repository-support';

describe(
  'DexieScientificEvidenceRepository point 26.A.2',
  () => {
    const databaseName =
      'genesis-web-point-26-A-2-scientific-evidence';

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

    const secondGenerationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B2',
        ),
        GeneratorVersion.V1,
      );

    const locator =
      new SystemLocator(
        0n,
        10n,
        7n,
      );

    const secondLocator =
      new SystemLocator(
        0n,
        10n,
        8n,
      );

    const targetSeedResolver:
      ProceduralTargetSeedResolver =
      Object.freeze({
        resolveTargetSeedNormalized(
          targetGenerationKey:
            UniverseGenerationKey,

          targetLocator:
            ProceduralLocator,
        ): string {

          const salt =
            targetGenerationKey
              .universeSeed
              .serialize()
              .endsWith(
                'D8B2',
              )
              ? 10n
              : 0n;

          const ordinal =
            'galacticObjectIndex' in
              targetLocator
              ? targetLocator
                  .galacticObjectIndex
              : targetLocator
                  .galaxyIndex;

          return (
            ordinal +
            salt +
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

    let database:
      GenesisIndexedDb;

    let universeRepository:
      DexieUniverseRepository;

    let repository:
      DexieScientificEvidenceRepository;

    function evidence(
      overrides:
        Partial<
          ConstructorParameters<
            typeof ScientificEvidence
          >[0]
        > = {},
    ): ScientificEvidence {

      return new ScientificEvidence({
        dimensionCode:
          'IDENTITY',
        evidenceCode:
          'SOURCE_RESOLUTION',
        sourceKey:
          'OPTICAL:OBSERVE:1',
        independenceKey:
          'OPTICAL',
        quality01:
          0.7,
        uncertainty01:
          0.3,
        observedAtEpochMs:
          1000,
        ...overrides,
      });
    }

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

        repository =
          new DexieScientificEvidenceRepository(
            database,
            targetSeedResolver,
          );

        await universeRepository
          .createIfAbsent(
            generationKey,
          );

        await universeRepository
          .createIfAbsent(
            secondGenerationKey,
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
      'should persist evidence in the existing observations store without materializing Ground Truth',
      async () => {
        await repository
          .recordEvidence(
            generationKey,
            locator,
            evidence(),
          );

        const observations =
          await database
            .observations
            .toArray();

        expect(
          observations,
        ).toHaveLength(1);

        expect(
          observations[0]
            .observationKind,
        ).toBe(
          SCIENTIFIC_EVIDENCE_OBSERVATION_KIND_V1,
        );

        expect(
          observations[0]
            .payloadVersion,
        ).toBe(1);

        const payload =
          JSON.parse(
            observations[0]
              .payloadJson,
          ) as
            Record<string, unknown>;

        expect(
          Object.keys(
            payload,
          ).sort(),
        ).toEqual([
          'dimensionCode',
          'evidenceCode',
          'independenceKey',
          'quality01',
          'sourceKey',
          'uncertainty01',
        ]);

        expect(
          observations[0]
            .payloadJson,
        ).not.toMatch(
          /percentage|ground.?truth|mass|radius|luminosity|temperature/i,
        );
      },
    );

    it(
      'should reload evidence after closing and reopening IndexedDB',
      async () => {
        await repository
          .recordEvidence(
            generationKey,
            locator,
            evidence(),
          );

        database.closeDatabase();

        database =
          new GenesisIndexedDb(
            databaseName,
            dependencies,
          );

        repository =
          new DexieScientificEvidenceRepository(
            database,
            targetSeedResolver,
          );

        const restored =
          await repository
            .getEvidence(
              generationKey,
              locator,
            );

        expect(
          restored,
        ).toHaveLength(1);

        expect(
          restored[0],
        ).toEqual(
          evidence(),
        );
      },
    );

    it(
      'should scope evidence by universe and target identity',
      async () => {
        await repository
          .recordEvidence(
            generationKey,
            locator,
            evidence(),
          );

        await repository
          .recordEvidence(
            generationKey,
            secondLocator,
            evidence({
              sourceKey:
                'RADIO:OBSERVE:1',
              independenceKey:
                'RADIO',
            }),
          );

        await repository
          .recordEvidence(
            secondGenerationKey,
            locator,
            evidence({
              sourceKey:
                'INFRARED:OBSERVE:1',
              independenceKey:
                'INFRARED',
            }),
          );

        expect(
          await repository
            .getEvidence(
              generationKey,
              locator,
            ),
        ).toHaveLength(1);

        expect(
          await repository
            .getEvidence(
              generationKey,
              secondLocator,
            ),
        ).toHaveLength(1);

        expect(
          await repository
            .getEvidence(
              secondGenerationKey,
              locator,
            ),
        ).toHaveLength(1);
      },
    );

    it(
      'should merge the same evidence monotonically and keep stale retries idempotent',
      async () => {
        const first =
          await repository
            .recordEvidence(
              generationKey,
              locator,
              evidence(),
            );

        const improved =
          await repository
            .recordEvidence(
              generationKey,
              locator,
              evidence({
                quality01:
                  0.9,
                uncertainty01:
                  0.2,
                observedAtEpochMs:
                  2000,
              }),
            );

        expect(
          improved.quality01,
        ).toBe(0.9);

        expect(
          improved.uncertainty01,
        ).toBe(0.2);

        expect(
          improved.observedAtEpochMs,
        ).toBe(2000);

        const stale =
          await repository
            .recordEvidence(
              generationKey,
              locator,
              evidence({
                quality01:
                  0.1,
                uncertainty01:
                  0.8,
                observedAtEpochMs:
                  3000,
              }),
            );

        expect(
          stale,
        ).toEqual(
          improved,
        );

        expect(
          await database
            .observations
            .count(),
        ).toBe(1);

        expect(
          first.identityKey,
        ).toBe(
          improved.identityKey,
        );
      },
    );

    it(
      'should preserve unrelated generic observations for the same target',
      async () => {
        const targetSeed =
          targetSeedResolver
            .resolveTargetSeedNormalized(
              generationKey,
              locator,
            );

        await database
          .openDatabase();

        await database
          .observations
          .put({
            id:
              'legacy-observation',
            universeSeed:
              generationKey
                .universeSeed
                .serialize(),
            generatorVersionCode:
              generationKey
                .generatorVersion
                .code,
            targetTypeCode:
              4,
            targetSeed,
            observationKind:
              'LEGACY_TEST',
            payloadVersion:
              1,
            payloadJson:
              '{}',
            observedAtEpochMs:
              500,
          });

        await repository
          .recordEvidence(
            generationKey,
            locator,
            evidence(),
          );

        expect(
          await repository
            .getEvidence(
              generationKey,
              locator,
            ),
        ).toHaveLength(1);

        expect(
          await database
            .observations
            .count(),
        ).toBe(2);

        expect(
          await database
            .observations
            .get(
              'legacy-observation',
            ),
        ).toBeDefined();
      },
    );

    it(
      'should reject corrupt reserved evidence payloads instead of treating them as knowledge',
      async () => {
        await repository
          .recordEvidence(
            generationKey,
            locator,
            evidence(),
          );

        const stored =
          (
            await database
              .observations
              .toArray()
          )[0];

        await database
          .observations
          .put({
            ...stored,
            payloadJson:
              '{"dimensionCode":"IDENTITY"}',
          });

        await expect(
          repository
            .getEvidence(
              generationKey,
              locator,
            ),
        ).rejects.toBeInstanceOf(
          CorruptLocalDataError,
        );
      },
    );

    it(
      'should require the universe to exist before reading or recording evidence',
      async () => {
        const missing =
          new UniverseGenerationKey(
            UniverseSeed.parse(
              '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B3',
            ),
            GeneratorVersion.V1,
          );

        await expect(
          repository
            .getEvidence(
              missing,
              locator,
            ),
        ).rejects.toThrow(
          /Universe not found/i,
        );

        await expect(
          repository
            .recordEvidence(
              missing,
              locator,
              evidence(),
            ),
        ).rejects.toThrow(
          /Universe not found/i,
        );
      },
    );
  },
);
