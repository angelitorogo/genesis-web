import {
  KnownDiscovery,
} from '../../../domain/discovery/known-discovery';

import {
  DiscoveryState,
  type DiscoveryStateValue,
} from '../../../domain/discovery/discovery-state';

import {
  DiscoveryTargetType,
} from '../../../domain/discovery/discovery-target-type';

import {
  BodyLocator,
  CivilizationLocator,
  GalacticObjectLocator,
  GalaxyLocator,
  type ProceduralLocator,
  SectorLocator,
  SystemLocator,
} from '../../../domain/generation/procedural-locator';

import {
  GeneratorVersion,
} from '../../../domain/generation/generator-version';

import {
  type UniverseGenerationKey,
} from '../../../domain/generation/universe-generation-key';

import {
  type DiscoveryRepository,
} from '../../../domain/repository/genesis-repositories';

import {
  type GalaxySectorCoordinates,
} from '../../../domain/sector/galaxy-sector-coordinates';

import {
  ObservationProgressMilestone,
} from '../../../domain/observation/observation-instrument-progression';

import {
  GalaxySectorKeyCodec,
} from '../../../domain/sector/galaxy-sector-key-codec';

import {
  createDiscoveryEntity,
  discoveryStateFromEntity,
  type DiscoveryEntity,
} from '../entity/discovery.entity';

import {
  assertPersistedDiscoverySectorCoordinates,
} from '../entity/discovery-sector-coordinates';

import {
  rehydrateDiscoveryLocator,
} from '../entity/discovery-locator-rehydrator';

import {
  type GenesisIndexedDb,
} from '../indexed-db/genesis-indexed-db';

import {
  CorruptLocalDataError,
  ensureUniverseExists,
  generationKeyStorageParts,
  normalizeTargetSeed,
  proceduralLocatorsEqual,
} from './local-repository-support';

export interface ProceduralTargetSeedResolver {
  resolveTargetSeedNormalized(
    generationKey:
      UniverseGenerationKey,

    locator:
      ProceduralLocator,
  ): string;
}

export class DexieDiscoveryRepository
  implements DiscoveryRepository {

  constructor(
    private readonly database:
      GenesisIndexedDb,

    private readonly targetSeedResolver:
      ProceduralTargetSeedResolver,

    private readonly clock:
      () => number =
        Date.now,
  ) {}

  async getState(
    generationKey:
      UniverseGenerationKey,

    locator:
      ProceduralLocator,
  ): Promise<DiscoveryStateValue> {

    await ensureUniverseExists(
      this.database,
      generationKey,
    );

    const {
      universeSeed,
      generatorVersionCode,
    } =
      generationKeyStorageParts(
        generationKey,
      );

    const targetType =
      DiscoveryTargetType
        .fromLocator(
          locator,
        );

    const targetSeed =
      this.resolveTargetSeed(
        generationKey,
        locator,
      );

    const entity =
      await this.database
        .discoveries
        .get([
          universeSeed,
          generatorVersionCode,
          targetType.code,
          targetSeed,
        ]);

    if (
      entity ===
      undefined
    ) {
      return DiscoveryState
        .UNKNOWN;
    }

    this.assertSpatialIntegrity(
      entity,
    );

    const restoredLocator =
      rehydrateDiscoveryLocator(
        entity,
      );

    if (
      !proceduralLocatorsEqual(
        restoredLocator,
        locator,
      )
    ) {
      throw new CorruptLocalDataError(
        'Persisted discovery locator does not match the requested locator.',
      );
    }

    const state =
      discoveryStateFromEntity(
        entity,
      );

    if (
      !DiscoveryState.isKnown(
        state,
      )
    ) {
      throw new CorruptLocalDataError(
        'Persisted DiscoveryEntity cannot contain UNKNOWN.',
      );
    }

    return state;
  }

  async setState(
    generationKey:
      UniverseGenerationKey,

    locator:
      ProceduralLocator,

    state:
      DiscoveryStateValue,
  ): Promise<void> {

    await ensureUniverseExists(
      this.database,
      generationKey,
    );

    const {
      universeSeed,
      generatorVersionCode,
    } =
      generationKeyStorageParts(
        generationKey,
      );

    const targetType =
      DiscoveryTargetType
        .fromLocator(
          locator,
        );

    const targetSeed =
      this.resolveTargetSeed(
        generationKey,
        locator,
      );

    const key =
      [
        universeSeed,
        generatorVersionCode,
        targetType.code,
        targetSeed,
      ] as const;

    if (
      state ===
      DiscoveryState.UNKNOWN
    ) {
      await this.database
        .discoveries
        .delete(
          key,
        );

      return;
    }

    const existing =
      await this.database
        .discoveries
        .get(
          key,
        );

    if (
      existing !==
      undefined
    ) {
      this.assertSpatialIntegrity(
        existing,
      );
    }

    const now =
      this.clock();

    const lineage =
      locatorToPersistedLineage(
        locator,
      );

    const entity =
      createDiscoveryEntity({
        universeSeed,
        generatorVersionCode,

        targetTypeCode:
          targetType.code,

        targetSeed,

        ...lineage,

        state,

        firstKnownAtEpochMs:
          existing
            ?.firstKnownAtEpochMs ??
          now,

        updatedAtEpochMs:
          now,
      });

    if (
      entity ===
      null
    ) {
      throw new CorruptLocalDataError(
        'Known discovery state unexpectedly produced no persisted entity.',
      );
    }

    await this.database
      .discoveries
      .put(
        entity,
      );
  }

  async getKnownDiscoveries(
    generationKey:
      UniverseGenerationKey,
  ): Promise<
    readonly KnownDiscovery[]
  > {

    await ensureUniverseExists(
      this.database,
      generationKey,
    );

    const {
      universeSeed,
      generatorVersionCode,
    } =
      generationKeyStorageParts(
        generationKey,
      );

    const entities =
      await this.database
        .discoveries
        .where(
          '[universeSeed+generatorVersionCode]',
        )
        .equals([
          universeSeed,
          generatorVersionCode,
        ])
        .toArray();

    sortDiscoveryEntities(
      entities,
    );

    return entities.map(
      (
        entity,
      ) =>
        this.toKnownDiscovery(
          generationKey,
          entity,
        ),
    );
  }

  /**
   * Point 26.1c — galaxy-scoped catalogue read path.
   *
   * This deliberately reuses the existing compound galaxy index, so catalogue
   * pages never need to load discoveries belonging to the rest of the universe.
   * The optional target-type filter is applied while the indexed collection is
   * traversed and the returned rows still pass the normal integrity/identity
   * checks through toKnownDiscovery().
   */
  async getKnownDiscoveriesInGalaxy(
    generationKey:
      UniverseGenerationKey,

    galaxyIndex:
      bigint,

    targetTypeCode?:
      number,
  ): Promise<
    readonly KnownDiscovery[]
  > {

    await ensureUniverseExists(
      this.database,
      generationKey,
    );

    const {
      universeSeed,
      generatorVersionCode,
    } =
      generationKeyStorageParts(
        generationKey,
      );

    const collection =
      this.database
        .discoveries
        .where(
          '[universeSeed+generatorVersionCode+galaxyIndex]',
        )
        .equals([
          universeSeed,
          generatorVersionCode,
          galaxyIndex.toString(10),
        ]);

    const entities =
      targetTypeCode === undefined
        ? await collection.toArray()
        : await collection
            .filter(
              entity =>
                entity.targetTypeCode === targetTypeCode,
            )
            .toArray();

    sortDiscoveryEntities(
      entities,
    );

    return entities.map(
      entity =>
        this.toKnownDiscovery(
          generationKey,
          entity,
        ),
    );
  }

  async getKnownDiscoveriesInSector(
    generationKey:
      UniverseGenerationKey,

    galaxyIndex:
      bigint,

    coordinates:
      GalaxySectorCoordinates,
  ): Promise<
    readonly KnownDiscovery[]
  > {

    await ensureUniverseExists(
      this.database,
      generationKey,
    );

    const sectorLocator =
      new SectorLocator(
        galaxyIndex,
        GalaxySectorKeyCodec
          .encode(
            coordinates,
          ),
      );

    const {
      universeSeed,
      generatorVersionCode,
    } =
      generationKeyStorageParts(
        generationKey,
      );

    const entities =
      await this.database
        .discoveries
        .where(
          '[universeSeed+generatorVersionCode+galaxyIndex+sectorX+sectorY]',
        )
        .equals([
          universeSeed,
          generatorVersionCode,
          sectorLocator
            .galaxyIndex
            .toString(
              10,
            ),
          coordinates.x,
          coordinates.y,
        ])
        .toArray();

    sortDiscoveryEntities(
      entities,
    );

    return entities.map(
      (
        entity,
      ) =>
        this.toKnownDiscovery(
          generationKey,
          entity,
        ),
    );
  }

  /**
   * Point 28.2G.3f — compact instrument-progression read model.
   *
   * Instrument unlocks use indexed existence facts instead of materializing the
   * global discovery catalogue. Point 28.6a adds one V2 compatibility bridge:
   * V2 does not persist one BODY discovery per canonical planet, so a CONFIRMED
   * V2 system is accepted as the legacy FIRST_BODY_DISCOVERED milestone. At that
   * state the system's canonical planetary inventory is already part of the
   * scientific read model; no synthetic BODY row is written and V1 semantics are
   * left unchanged.
   */
  async getObservationProgressMilestones(
    generationKey:
      UniverseGenerationKey,
  ): Promise<
    readonly ObservationProgressMilestone[]
  > {

    await ensureUniverseExists(
      this.database,
      generationKey,
    );

    const {
      universeSeed,
      generatorVersionCode,
    } =
      generationKeyStorageParts(
        generationKey,
      );

    const belongsToUniverse =
      (entity: DiscoveryEntity): boolean =>
        entity.universeSeed === universeSeed &&
        entity.generatorVersionCode === generatorVersionCode;

    const firstOfTypeAtLeast =
      async (
        targetTypeCode: number,
        minimumStateCode: number,
        extra?: (entity: DiscoveryEntity) => boolean,
      ): Promise<boolean> =>
        (
          await this.database
            .discoveries
            .where('targetTypeCode')
            .equals(targetTypeCode)
            .filter(
              entity =>
                belongsToUniverse(entity) &&
                entity.discoveryStateCode >= minimumStateCode &&
                (extra === undefined || extra(entity)),
            )
            .first()
        ) !== undefined;

    const [
      firstSystemDiscovered,
      firstSystemCatalogued,
      firstExplicitBodyDiscovered,
      firstSystemConfirmed,
      firstGalacticObjectCatalogued,
      firstTargetConfirmed,
      firstExternalGalaxyDetected,
    ] =
      await Promise.all([
        firstOfTypeAtLeast(
          DiscoveryTargetType.SYSTEM.code,
          DiscoveryState.DISCOVERED.code,
        ),
        firstOfTypeAtLeast(
          DiscoveryTargetType.SYSTEM.code,
          DiscoveryState.CATALOGUED.code,
        ),
        firstOfTypeAtLeast(
          DiscoveryTargetType.BODY.code,
          DiscoveryState.DISCOVERED.code,
        ),
        firstOfTypeAtLeast(
          DiscoveryTargetType.SYSTEM.code,
          DiscoveryState.CONFIRMED.code,
        ),
        firstOfTypeAtLeast(
          DiscoveryTargetType.GALACTIC_OBJECT.code,
          DiscoveryState.CATALOGUED.code,
        ),
        (
          await this.database
            .discoveries
            .where('discoveryStateCode')
            .aboveOrEqual(
              DiscoveryState.CONFIRMED.code,
            )
            .filter(
              belongsToUniverse,
            )
            .first()
        ) !== undefined,
        firstOfTypeAtLeast(
          DiscoveryTargetType.GALAXY.code,
          DiscoveryState.DETECTED.code,
          entity => entity.galaxyIndex !== '0',
        ),
      ]);

    const firstBodyDiscovered =
      firstExplicitBodyDiscovered ||
      (
        generationKey.generatorVersion.code ===
          GeneratorVersion.V2.code &&
        firstSystemConfirmed
      );

    const achieved:
      ObservationProgressMilestone[] =
      [];

    if (firstSystemDiscovered) {
      achieved.push(
        ObservationProgressMilestone.FIRST_SYSTEM_DISCOVERED,
      );
    }

    if (firstSystemCatalogued) {
      achieved.push(
        ObservationProgressMilestone.FIRST_SYSTEM_CATALOGUED,
      );
    }

    if (firstBodyDiscovered) {
      achieved.push(
        ObservationProgressMilestone.FIRST_BODY_DISCOVERED,
      );
    }

    if (firstGalacticObjectCatalogued) {
      achieved.push(
        ObservationProgressMilestone.FIRST_GALACTIC_OBJECT_CATALOGUED,
      );
    }

    if (firstTargetConfirmed) {
      achieved.push(
        ObservationProgressMilestone.FIRST_TARGET_CONFIRMED,
      );
    }

    if (firstExternalGalaxyDetected) {
      achieved.push(
        ObservationProgressMilestone.FIRST_EXTERNAL_GALAXY_DETECTED,
      );
    }

    return Object.freeze(achieved);
  }

  private toKnownDiscovery(
    generationKey:
      UniverseGenerationKey,

    entity:
      DiscoveryEntity,
  ): KnownDiscovery {

    this.assertSpatialIntegrity(
      entity,
    );

    const locator =
      rehydrateDiscoveryLocator(
        entity,
      );

    const expectedTargetSeed =
      this.resolveTargetSeed(
        generationKey,
        locator,
      );

    const storedTargetSeed =
      normalizeTargetSeed(
        entity.targetSeed,
      );

    if (
      storedTargetSeed !==
      expectedTargetSeed
    ) {
      throw new CorruptLocalDataError(
        'Persisted targetSeed does not match regenerated procedural identity.',
      );
    }

    const state =
      discoveryStateFromEntity(
        entity,
      );

    if (
      !DiscoveryState.isKnown(
        state,
      )
    ) {
      throw new CorruptLocalDataError(
        'Known discoveries cannot contain DiscoveryState.UNKNOWN.',
      );
    }

    return new KnownDiscovery(
      generationKey,
      locator,
      state,
    );
  }

  private assertSpatialIntegrity(
    entity:
      DiscoveryEntity,
  ): void {

    try {
      assertPersistedDiscoverySectorCoordinates(
        entity,
      );
    } catch {
      throw new CorruptLocalDataError(
        'Persisted discovery sector coordinates are inconsistent with sectorKey.',
      );
    }
  }

  private resolveTargetSeed(
    generationKey:
      UniverseGenerationKey,

    locator:
      ProceduralLocator,
  ): string {

    return normalizeTargetSeed(
      this.targetSeedResolver
        .resolveTargetSeedNormalized(
          generationKey,
          locator,
        ),
    );
  }
}

function sortDiscoveryEntities(
  entities:
    DiscoveryEntity[],
): void {

  entities.sort(
    (
      left,
      right,
    ) => {
      const typeDifference =
        left.targetTypeCode -
        right.targetTypeCode;

      if (
        typeDifference !==
        0
      ) {
        return typeDifference;
      }

      return left.targetSeed
        .localeCompare(
          right.targetSeed,
        );
    },
  );
}

function locatorToPersistedLineage(
  locator:
    ProceduralLocator,
): {
  readonly galaxyIndex:
    string;

  readonly sectorKey:
    string | null;

  readonly galacticObjectIndex:
    string | null;

  readonly bodyIndex:
    string | null;

  readonly civilizationIndex:
    string | null;
} {

  if (
    locator instanceof
    GalaxyLocator
  ) {
    return {
      galaxyIndex:
        locator
          .galaxyIndex
          .toString(
            10,
          ),

      sectorKey:
        null,

      galacticObjectIndex:
        null,

      bodyIndex:
        null,

      civilizationIndex:
        null,
    };
  }

  if (
    locator instanceof
    SectorLocator
  ) {
    return {
      galaxyIndex:
        locator
          .galaxyIndex
          .toString(
            10,
          ),

      sectorKey:
        locator
          .sectorKey
          .toString(
            10,
          ),

      galacticObjectIndex:
        null,

      bodyIndex:
        null,

      civilizationIndex:
        null,
    };
  }

  if (
    locator instanceof
    GalacticObjectLocator
  ) {
    return {
      galaxyIndex:
        locator
          .galaxyIndex
          .toString(
            10,
          ),

      sectorKey:
        locator
          .sectorKey
          .toString(
            10,
          ),

      galacticObjectIndex:
        locator
          .galacticObjectIndex
          .toString(
            10,
          ),

      bodyIndex:
        null,

      civilizationIndex:
        null,
    };
  }

  if (
    locator instanceof
    SystemLocator
  ) {
    return {
      galaxyIndex:
        locator
          .galaxyIndex
          .toString(
            10,
          ),

      sectorKey:
        locator
          .sectorKey
          .toString(
            10,
          ),

      galacticObjectIndex:
        locator
          .galacticObjectIndex
          .toString(
            10,
          ),

      bodyIndex:
        null,

      civilizationIndex:
        null,
    };
  }

  if (
    locator instanceof
    BodyLocator
  ) {
    return {
      galaxyIndex:
        locator
          .galaxyIndex
          .toString(
            10,
          ),

      sectorKey:
        locator
          .sectorKey
          .toString(
            10,
          ),

      galacticObjectIndex:
        locator
          .galacticObjectIndex
          .toString(
            10,
          ),

      bodyIndex:
        locator
          .bodyIndex
          .toString(
            10,
          ),

      civilizationIndex:
        null,
    };
  }

  if (
    locator instanceof
    CivilizationLocator
  ) {
    return {
      galaxyIndex:
        locator
          .galaxyIndex
          .toString(
            10,
          ),

      sectorKey:
        locator
          .sectorKey
          .toString(
            10,
          ),

      galacticObjectIndex:
        locator
          .galacticObjectIndex
          .toString(
            10,
          ),

      bodyIndex:
        locator
          .bodyIndex
          .toString(
            10,
          ),

      civilizationIndex:
        locator
          .civilizationIndex
          .toString(
            10,
          ),
    };
  }

  throw new TypeError(
    'Unsupported ProceduralLocator.',
  );
}