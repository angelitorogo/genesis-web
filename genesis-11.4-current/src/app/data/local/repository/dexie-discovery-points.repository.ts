import {
  type UniverseGenerationKey,
} from '../../../domain/generation/universe-generation-key';

import {
  type DiscoveryPointsRepository,
} from '../../../domain/repository/genesis-repositories';

import {
  createGalaxyProgressEntity,
  createGlobalProgressEntity,
  GLOBAL_PROGRESS_SCOPE_KEY,
  ProgressScopeCode,
} from '../entity/progress.entity';

import {
  type GenesisIndexedDb,
} from '../indexed-db/genesis-indexed-db';

import {
  assertNonNegativeLong,
  ensureUniverseExists,
  generationKeyStorageParts,
  parseNonNegativeLongDecimal,
} from './local-repository-support';

export class DexieDiscoveryPointsRepository
  implements DiscoveryPointsRepository {

  constructor(
    private readonly database:
      GenesisIndexedDb,

    private readonly clock:
      () => number =
        Date.now,
  ) {}

  async getGlobalDiscoveryPoints(
    generationKey:
      UniverseGenerationKey,
  ): Promise<bigint> {

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

    const entity =
      await this.database
        .progress
        .get([
          universeSeed,
          generatorVersionCode,
          ProgressScopeCode.GLOBAL,
          GLOBAL_PROGRESS_SCOPE_KEY,
        ]);

    if (
      entity ===
      undefined
    ) {
      return 0n;
    }

    return parseNonNegativeLongDecimal(
      entity.discoveryPoints,
      'discoveryPoints',
    );
  }

  async setGlobalDiscoveryPoints(
    generationKey:
      UniverseGenerationKey,

    discoveryPoints:
      bigint,
  ): Promise<void> {

    assertNonNegativeLong(
      discoveryPoints,
      'discoveryPoints',
    );

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

    await this.database
      .progress
      .put(
        createGlobalProgressEntity({
          universeSeed,
          generatorVersionCode,
          discoveryPoints,

          updatedAtEpochMs:
            this.clock(),
        }),
      );
  }

  async getGalaxyDiscoveryPoints(
    generationKey:
      UniverseGenerationKey,

    galaxyIndex:
      bigint,
  ): Promise<bigint> {

    assertNonNegativeLong(
      galaxyIndex,
      'galaxyIndex',
    );

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

    const galaxyKey =
      galaxyIndex
        .toString(
          10,
        );

    const entity =
      await this.database
        .progress
        .get([
          universeSeed,
          generatorVersionCode,
          ProgressScopeCode.GALAXY,
          galaxyKey,
        ]);

    if (
      entity ===
      undefined
    ) {
      return 0n;
    }

    return parseNonNegativeLongDecimal(
      entity.discoveryPoints,
      'discoveryPoints',
    );
  }

  async setGalaxyDiscoveryPoints(
    generationKey:
      UniverseGenerationKey,

    galaxyIndex:
      bigint,

    discoveryPoints:
      bigint,
  ): Promise<void> {

    assertNonNegativeLong(
      galaxyIndex,
      'galaxyIndex',
    );

    assertNonNegativeLong(
      discoveryPoints,
      'discoveryPoints',
    );

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

    await this.database
      .progress
      .put(
        createGalaxyProgressEntity({
          universeSeed,
          generatorVersionCode,
          galaxyIndex,
          discoveryPoints,

          updatedAtEpochMs:
            this.clock(),
        }),
      );
  }
}