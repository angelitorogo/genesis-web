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
  type UniverseGenerationKey,
} from '../../../domain/generation/universe-generation-key';

import {
  type DiscoveryRepository,
} from '../../../domain/repository/genesis-repositories';

import {
  type GalaxySectorCoordinates,
} from '../../../domain/sector/galaxy-sector-coordinates';

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