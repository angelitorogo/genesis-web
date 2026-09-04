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
  StellarSystemScientificCampaignAssembler,
} from './stellar-system-scientific-campaign';

import {
  DexieStellarSystemScientificProgressionRuntime,
  type StellarSystemScientificProgressionSnapshot,
} from './stellar-system-scientific-progression.runtime';

const DEPENDENCIES =
  Object.freeze({
    indexedDB,
    IDBKeyRange,
  });

const GENERATION_KEY =
  new UniverseGenerationKey(
    UniverseSeed.parse(
      '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
    ),
    GeneratorVersion.V1,
  );

const LOCATOR =
  new SystemLocator(
    0n,
    10n,
    7n,
  );

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

const CONFIRMATION_RULES =
  [
    StellarSystemScientificObservationRuleCode.CLASSIFICATION_SPECTROSCOPY,
    StellarSystemScientificObservationRuleCode.PHYSICAL_PROPERTIES_INFRARED,
    StellarSystemScientificObservationRuleCode.ORBITAL_ARCHITECTURE_SPECTROSCOPIC_DYNAMICS,
  ] as const;

describe(
  'point 26.A.10 stellar-system scientific regression contract',
  () => {
    it(
      'should reproduce the exact same transition/evidence/PD vector from the same seed and observations',
      async () => {
        const firstName =
          'genesis-web-point-26-A-10-determinism-a';

        const secondName =
          'genesis-web-point-26-A-10-determinism-b';

        const first =
          await createHarness(
            firstName,
          );

        const second =
          await createHarness(
            secondName,
          );

        try {
          const firstResult =
            await runFullCampaignTrace(
              first,
            );

          const secondResult =
            await runFullCampaignTrace(
              second,
            );

          expect(
            firstResult.stateCodes,
          ).toEqual([
            DiscoveryState.DETECTED.code,
            DiscoveryState.DISCOVERED.code,
            DiscoveryState.VISITED.code,
            DiscoveryState.CATALOGUED.code,
            DiscoveryState.CONFIRMED.code,
          ]);

          expect(
            firstResult.stateCodes,
          ).toEqual(
            secondResult.stateCodes,
          );

          expect(
            snapshotVector(
              firstResult.snapshot,
            ),
          ).toEqual(
            snapshotVector(
              secondResult.snapshot,
            ),
          );

          expect(
            firstResult.snapshot.discoveryState,
          ).toBe(
            DiscoveryState.CONFIRMED,
          );

          expect(
            firstResult.snapshot.evidence,
          ).toHaveLength(
            11,
          );

          expect(
            firstResult.snapshot.globalDiscoveryPoints,
          ).toBe(
            10_120n,
          );

          expect(
            firstResult.snapshot.galaxyDiscoveryPoints,
          ).toBe(
            620n,
          );
        } finally {
          await disposeHarness(
            first,
          );

          await disposeHarness(
            second,
          );
        }
      },
    );

    it(
      'should keep repeated observations and repeated entry events idempotent',
      async () => {
        const harness =
          await createHarness(
            'genesis-web-point-26-A-10-idempotency',
          );

        try {
          const firstNature =
            await harness.runtime
              .performObservation(
                GENERATION_KEY,
                LOCATOR,
                DISCOVERY_RULES[0],
                1_000,
              );

          const repeatedNature =
            await harness.runtime
              .performObservation(
                GENERATION_KEY,
                LOCATOR,
                DISCOVERY_RULES[0],
                9_000,
              );

          expect(
            firstNature.snapshot.evidence,
          ).toHaveLength(1);

          expect(
            repeatedNature.snapshot.evidence,
          ).toHaveLength(1);

          expect(
            repeatedNature.snapshot.evidence[0]
              ?.observedAtEpochMs,
          ).toBe(1_000);

          expect(
            repeatedNature.awardedDiscoveryPoints,
          ).toBe(0);

          await harness.runtime
            .performObservation(
              GENERATION_KEY,
              LOCATOR,
              DISCOVERY_RULES[1],
              1_001,
            );

          await harness.runtime
            .performObservation(
              GENERATION_KEY,
              LOCATOR,
              DISCOVERY_RULES[2],
              1_002,
            );

          const archiveEntry =
            await harness.runtime
              .recordEntry(
                GENERATION_KEY,
                LOCATOR,
                DiscoveredToVisitedEntryKind.DETAILED_CARD,
              );

          const systemEntry =
            await harness.runtime
              .recordEntry(
                GENERATION_KEY,
                LOCATOR,
                DiscoveredToVisitedEntryKind.SCENE,
              );

          const archiveEntryAgain =
            await harness.runtime
              .recordEntry(
                GENERATION_KEY,
                LOCATOR,
                DiscoveredToVisitedEntryKind.DETAILED_CARD,
              );

          expect(
            archiveEntry.awardedDiscoveryPoints,
          ).toBe(18);

          expect(
            systemEntry.awardedDiscoveryPoints,
          ).toBe(0);

          expect(
            archiveEntryAgain.awardedDiscoveryPoints,
          ).toBe(0);

          expect(
            archiveEntryAgain.stateAfter,
          ).toBe(
            DiscoveryState.VISITED,
          );

          expect(
            archiveEntryAgain.snapshot.evidence,
          ).toHaveLength(3);

          expect(
            archiveEntryAgain.snapshot.globalDiscoveryPoints,
          ).toBe(10_042n);

          expect(
            archiveEntryAgain.snapshot.galaxyDiscoveryPoints,
          ).toBe(542n);
        } finally {
          await disposeHarness(
            harness,
          );
        }
      },
    );

    it(
      'should share one VISITED state/evidence stream across Archive -> SystemPage -> Observatory navigation and a page reload',
      async () => {
        const harness =
          await createHarness(
            'genesis-web-point-26-A-10-navigation-reload',
          );

        try {
          await runDiscoveryPhase(
            harness,
          );

          const archive =
            await harness.runtime
              .recordEntry(
                GENERATION_KEY,
                LOCATOR,
                DiscoveredToVisitedEntryKind.DETAILED_CARD,
              );

          const systemPage =
            await harness.runtime
              .recordEntry(
                GENERATION_KEY,
                LOCATOR,
                DiscoveredToVisitedEntryKind.SCENE,
              );

          const observatory =
            await harness.runtime
              .snapshot(
                GENERATION_KEY,
                LOCATOR,
              );

          expect(
            archive.stateAfter,
          ).toBe(DiscoveryState.VISITED);

          expect(
            systemPage.stateAfter,
          ).toBe(DiscoveryState.VISITED);

          expect(
            systemPage.awardedDiscoveryPoints,
          ).toBe(0);

          expect(
            observatory.discoveryState,
          ).toBe(DiscoveryState.VISITED);

          expect(
            observatory.evidence,
          ).toEqual(
            archive.snapshot.evidence,
          );

          const reloaded =
            recreateRuntime(
              harness,
            );

          const afterReload =
            await reloaded
              .snapshot(
                GENERATION_KEY,
                LOCATOR,
              );

          expect(
            snapshotVector(
              afterReload,
            ),
          ).toEqual(
            snapshotVector(
              observatory,
            ),
          );

          const sceneAfterReload =
            await reloaded
              .recordEntry(
                GENERATION_KEY,
                LOCATOR,
                DiscoveredToVisitedEntryKind.SCENE,
              );

          expect(
            sceneAfterReload.awardedDiscoveryPoints,
          ).toBe(0);

          expect(
            sceneAfterReload.snapshot.evidence,
          ).toHaveLength(3);
        } finally {
          await disposeHarness(
            harness,
          );
        }
      },
    );

    it(
      'should preserve a mid-campaign save across IndexedDB close/reopen and continue from the persisted evidence only',
      async () => {
        const databaseName =
          'genesis-web-point-26-A-10-reopen-save';

        let harness =
          await createHarness(
            databaseName,
          );

        try {
          await runDiscoveryPhase(
            harness,
          );

          await harness.runtime
            .recordEntry(
              GENERATION_KEY,
              LOCATOR,
              DiscoveredToVisitedEntryKind.SCENE,
            );

          for (
            let index =
              0;
            index <
              3;
            index +=
              1
          ) {
            await harness.runtime
              .performObservation(
                GENERATION_KEY,
                LOCATOR,
                CATALOGUE_RULES[index]!,
                2_000 +
                  index,
              );
          }

          const beforeClose =
            await harness.runtime
              .snapshot(
                GENERATION_KEY,
                LOCATOR,
              );

          expect(
            beforeClose.discoveryState,
          ).toBe(DiscoveryState.VISITED);

          expect(
            beforeClose.evidence,
          ).toHaveLength(6);

          harness.database
            .closeDatabase();

          harness =
            reopenHarness(
              databaseName,
            );

          const afterReopen =
            await harness.runtime
              .snapshot(
                GENERATION_KEY,
                LOCATOR,
              );

          expect(
            snapshotVector(
              afterReopen,
            ),
          ).toEqual(
            snapshotVector(
              beforeClose,
            ),
          );

          for (
            let index =
              3;
            index <
              CATALOGUE_RULES.length;
            index +=
              1
          ) {
            await harness.runtime
              .performObservation(
                GENERATION_KEY,
                LOCATOR,
                CATALOGUE_RULES[index]!,
                2_000 +
                  index,
              );
          }

          let snapshot =
            await harness.runtime
              .snapshot(
                GENERATION_KEY,
                LOCATOR,
              );

          expect(
            snapshot.discoveryState,
          ).toBe(DiscoveryState.CATALOGUED);

          expect(
            snapshot.evidence,
          ).toHaveLength(8);

          harness.database
            .closeDatabase();

          harness =
            reopenHarness(
              databaseName,
            );

          for (
            let index =
              0;
            index <
              CONFIRMATION_RULES.length;
            index +=
              1
          ) {
            await harness.runtime
              .performObservation(
                GENERATION_KEY,
                LOCATOR,
                CONFIRMATION_RULES[index]!,
                3_000 +
                  index,
              );
          }

          snapshot =
            await harness.runtime
              .snapshot(
                GENERATION_KEY,
                LOCATOR,
              );

          expect(
            snapshot.discoveryState,
          ).toBe(DiscoveryState.CONFIRMED);

          expect(
            snapshot.evidence,
          ).toHaveLength(11);

          expect(
            snapshot.globalDiscoveryPoints,
          ).toBe(10_120n);
        } finally {
          await disposeHarness(
            harness,
          );
        }
      },
    );

    it(
      'should reject stage skipping while preserving persisted state, evidence and PD',
      async () => {
        const harness =
          await createHarness(
            'genesis-web-point-26-A-10-no-skips',
          );

        try {
          const detectedEntry =
            await harness.runtime
              .recordEntry(
                GENERATION_KEY,
                LOCATOR,
                DiscoveredToVisitedEntryKind.SCENE,
              );

          expect(
            detectedEntry.stateAfter,
          ).toBe(DiscoveryState.DETECTED);

          expect(
            detectedEntry.awardedDiscoveryPoints,
          ).toBe(0);

          expect(
            detectedEntry.snapshot.evidence,
          ).toHaveLength(0);

          await runDiscoveryPhase(
            harness,
          );

          const beforeInvalidObservation =
            await harness.runtime
              .snapshot(
                GENERATION_KEY,
                LOCATOR,
              );

          await expect(
            harness.runtime
              .performObservation(
                GENERATION_KEY,
                LOCATOR,
                StellarSystemScientificObservationRuleCode.CLASSIFICATION_PHOTOMETRY,
                2_000,
              ),
          ).rejects.toThrow(
            'requires the first detailed entry',
          );

          const afterInvalidObservation =
            await harness.runtime
              .snapshot(
                GENERATION_KEY,
                LOCATOR,
              );

          expect(
            snapshotVector(
              afterInvalidObservation,
            ),
          ).toEqual(
            snapshotVector(
              beforeInvalidObservation,
            ),
          );

          expect(
            afterInvalidObservation.discoveryState,
          ).toBe(DiscoveryState.DISCOVERED);
        } finally {
          await disposeHarness(
            harness,
          );
        }
      },
    );

    it(
      'should keep scientific snapshots and campaign projections free of Ground Truth payloads after every persisted stage',
      async () => {
        const harness =
          await createHarness(
            'genesis-web-point-26-A-10-observed-knowledge-only',
          );

        try {
          const snapshots:
            StellarSystemScientificProgressionSnapshot[] =
            [];

          snapshots.push(
            await harness.runtime
              .snapshot(
                GENERATION_KEY,
                LOCATOR,
              ),
          );

          await runDiscoveryPhase(
            harness,
          );

          snapshots.push(
            await harness.runtime
              .snapshot(
                GENERATION_KEY,
                LOCATOR,
              ),
          );

          await harness.runtime
            .recordEntry(
              GENERATION_KEY,
              LOCATOR,
              DiscoveredToVisitedEntryKind.DETAILED_CARD,
            );

          snapshots.push(
            await harness.runtime
              .snapshot(
                GENERATION_KEY,
                LOCATOR,
              ),
          );

          await runCataloguePhase(
            harness,
          );

          snapshots.push(
            await harness.runtime
              .snapshot(
                GENERATION_KEY,
                LOCATOR,
              ),
          );

          await runConfirmationPhase(
            harness,
          );

          snapshots.push(
            await harness.runtime
              .snapshot(
                GENERATION_KEY,
                LOCATOR,
              ),
          );

          for (
            const snapshot
            of snapshots
          ) {
            const campaign =
              StellarSystemScientificCampaignAssembler
                .build(
                  snapshot,
                );

            const serialized =
              stringifyWithBigInt({
                snapshot,
                campaign,
              });

            for (
              const forbidden
              of [
                'groundTruth',
                'GroundTruth',
                'systemSeed',
                'SystemSeed',
                'exactPhysicalProperties',
                'stellarPhysicalProperties',
                'planetarySystem',
                'habitableZoneAu',
              ]
            ) {
              expect(
                serialized,
              ).not.toContain(
                forbidden,
              );
            }
          }
        } finally {
          await disposeHarness(
            harness,
          );
        }
      },
    );
  },
);

interface Harness {
  readonly databaseName:
    string;

  readonly database:
    GenesisIndexedDb;

  readonly discoveryRepository:
    DexieDiscoveryRepository;

  readonly evidenceRepository:
    DexieScientificEvidenceRepository;

  readonly pointsRepository:
    DexieDiscoveryPointsRepository;

  readonly runtime:
    DexieStellarSystemScientificProgressionRuntime;
}

async function createHarness(
  databaseName:
    string,
): Promise<Harness> {

  const database =
    new GenesisIndexedDb(
      databaseName,
      DEPENDENCIES,
    );

  const universeRepository =
    new DexieUniverseRepository(
      database,
      () => 10_000,
    );

  const discoveryRepository =
    new DexieDiscoveryRepository(
      database,
      TARGET_SEED_RESOLVER,
      () => 10_000,
    );

  const evidenceRepository =
    new DexieScientificEvidenceRepository(
      database,
      TARGET_SEED_RESOLVER,
    );

  const pointsRepository =
    new DexieDiscoveryPointsRepository(
      database,
      () => 10_000,
    );

  const runtime =
    new DexieStellarSystemScientificProgressionRuntime(
      database,
      pointsRepository,
      discoveryRepository,
      evidenceRepository,
      () => 10_000,
    );

  await universeRepository
    .createIfAbsent(
      GENERATION_KEY,
    );

  await discoveryRepository
    .setState(
      GENERATION_KEY,
      LOCATOR,
      DiscoveryState.DETECTED,
    );

  await seedFullInstrumentFrontier(
    discoveryRepository,
  );

  await pointsRepository
    .setGlobalDiscoveryPoints(
      GENERATION_KEY,
      10_000n,
    );

  await pointsRepository
    .setGalaxyDiscoveryPoints(
      GENERATION_KEY,
      0n,
      500n,
    );

  return {
    databaseName,
    database,
    discoveryRepository,
    evidenceRepository,
    pointsRepository,
    runtime,
  };
}

function reopenHarness(
  databaseName:
    string,
): Harness {

  const database =
    new GenesisIndexedDb(
      databaseName,
      DEPENDENCIES,
    );

  const discoveryRepository =
    new DexieDiscoveryRepository(
      database,
      TARGET_SEED_RESOLVER,
      () => 20_000,
    );

  const evidenceRepository =
    new DexieScientificEvidenceRepository(
      database,
      TARGET_SEED_RESOLVER,
    );

  const pointsRepository =
    new DexieDiscoveryPointsRepository(
      database,
      () => 20_000,
    );

  return {
    databaseName,
    database,
    discoveryRepository,
    evidenceRepository,
    pointsRepository,
    runtime:
      new DexieStellarSystemScientificProgressionRuntime(
        database,
        pointsRepository,
        discoveryRepository,
        evidenceRepository,
        () => 20_000,
      ),
  };
}

function recreateRuntime(
  harness:
    Harness,
): DexieStellarSystemScientificProgressionRuntime {

  return new DexieStellarSystemScientificProgressionRuntime(
    harness.database,
    new DexieDiscoveryPointsRepository(
      harness.database,
      () => 15_000,
    ),
    new DexieDiscoveryRepository(
      harness.database,
      TARGET_SEED_RESOLVER,
      () => 15_000,
    ),
    new DexieScientificEvidenceRepository(
      harness.database,
      TARGET_SEED_RESOLVER,
    ),
    () => 15_000,
  );
}

async function disposeHarness(
  harness:
    Harness,
): Promise<void> {

  harness.database
    .closeDatabase();

  const cleanup =
    new Dexie(
      harness.databaseName,
      DEPENDENCIES,
    );

  await cleanup
    .delete();
}

async function runFullCampaignTrace(
  harness:
    Harness,
): Promise<{
  readonly stateCodes:
    readonly number[];

  readonly snapshot:
    StellarSystemScientificProgressionSnapshot;
}> {

  const stateCodes:
    number[] =
    [
      (
        await harness.runtime
          .snapshot(
            GENERATION_KEY,
            LOCATOR,
          )
      ).discoveryState.code,
    ];

  await runDiscoveryPhase(
    harness,
  );

  stateCodes.push(
    (
      await harness.runtime
        .snapshot(
          GENERATION_KEY,
          LOCATOR,
        )
    ).discoveryState.code,
  );

  await harness.runtime
    .recordEntry(
      GENERATION_KEY,
      LOCATOR,
      DiscoveredToVisitedEntryKind.SCENE,
    );

  stateCodes.push(
    (
      await harness.runtime
        .snapshot(
          GENERATION_KEY,
          LOCATOR,
        )
    ).discoveryState.code,
  );

  await runCataloguePhase(
    harness,
  );

  stateCodes.push(
    (
      await harness.runtime
        .snapshot(
          GENERATION_KEY,
          LOCATOR,
        )
    ).discoveryState.code,
  );

  await runConfirmationPhase(
    harness,
  );

  const snapshot =
    await harness.runtime
      .snapshot(
        GENERATION_KEY,
        LOCATOR,
      );

  stateCodes.push(
    snapshot.discoveryState.code,
  );

  return Object.freeze({
    stateCodes:
      Object.freeze(
        stateCodes,
      ),
    snapshot,
  });
}

async function runDiscoveryPhase(
  harness:
    Harness,
): Promise<void> {

  for (
    let index =
      0;
    index <
      DISCOVERY_RULES.length;
    index +=
      1
  ) {
    await harness.runtime
      .performObservation(
        GENERATION_KEY,
        LOCATOR,
        DISCOVERY_RULES[index]!,
        1_000 +
          index,
      );
  }
}

async function runCataloguePhase(
  harness:
    Harness,
): Promise<void> {

  for (
    let index =
      0;
    index <
      CATALOGUE_RULES.length;
    index +=
      1
  ) {
    await harness.runtime
      .performObservation(
        GENERATION_KEY,
        LOCATOR,
        CATALOGUE_RULES[index]!,
        2_000 +
          index,
      );
  }
}

async function runConfirmationPhase(
  harness:
    Harness,
): Promise<void> {

  for (
    let index =
      0;
    index <
      CONFIRMATION_RULES.length;
    index +=
      1
  ) {
    await harness.runtime
      .performObservation(
        GENERATION_KEY,
        LOCATOR,
        CONFIRMATION_RULES[index]!,
        3_000 +
          index,
      );
  }
}

async function seedFullInstrumentFrontier(
  repository:
    DexieDiscoveryRepository,
): Promise<void> {

  await repository.setState(
    GENERATION_KEY,
    new SystemLocator(
      0n,
      10n,
      8n,
    ),
    DiscoveryState.DISCOVERED,
  );

  await repository.setState(
    GENERATION_KEY,
    new BodyLocator(
      0n,
      10n,
      8n,
      0n,
    ),
    DiscoveryState.CONFIRMED,
  );

  await repository.setState(
    GENERATION_KEY,
    new GalacticObjectLocator(
      0n,
      10n,
      9n,
    ),
    DiscoveryState.CATALOGUED,
  );

  await repository.setState(
    GENERATION_KEY,
    new GalaxyLocator(
      1n,
    ),
    DiscoveryState.DETECTED,
  );
}

function snapshotVector(
  snapshot:
    StellarSystemScientificProgressionSnapshot,
) {

  return Object.freeze({
    discoveryStateCode:
      snapshot.discoveryState.code,

    evidence:
      Object.freeze(
        snapshot.evidence.map(
          evidence =>
            Object.freeze({
              dimensionCode:
                evidence.dimensionCode,
              evidenceCode:
                evidence.evidenceCode,
              sourceKey:
                evidence.sourceKey,
              independenceKey:
                evidence.independenceKey,
              quality01:
                evidence.quality01,
              uncertainty01:
                evidence.uncertainty01,
              observedAtEpochMs:
                evidence.observedAtEpochMs,
            }),
        ),
      ),

    satisfiedRequirementCount:
      snapshot.completeness
        .satisfiedRequirementCount,

    totalRequirementCount:
      snapshot.completeness
        .totalRequirementCount,

    globalDiscoveryPoints:
      snapshot.globalDiscoveryPoints,

    galaxyDiscoveryPoints:
      snapshot.galaxyDiscoveryPoints,
  });
}

function stringifyWithBigInt(
  value:
    unknown,
): string {

  return JSON.stringify(
    value,
    (_key, item) =>
      typeof item ===
        'bigint'
        ? item.toString(
            10,
          )
        : item,
  );
}
