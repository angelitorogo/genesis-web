import {
  type UniverseGenerationKey,
} from '../../../domain/generation/universe-generation-key';

import {
  type UniverseNavigationRepository,
  type UniverseNavigationState,
} from '../../../domain/repository/genesis-repositories';

import {
  type GenesisIndexedDb,
} from '../indexed-db/genesis-indexed-db';

import {
  assertNonNegativeLong,
  ensureUniverseExists,
  generationKeyStorageParts,
  parseNonNegativeLongDecimal,
} from './local-repository-support';

export class DexieUniverseNavigationRepository
  implements UniverseNavigationRepository {

  constructor(
    private readonly database:
      GenesisIndexedDb,

    private readonly clock:
      () => number =
        Date.now,
  ) {}

  async getNavigation(
    generationKey:
      UniverseGenerationKey,
  ): Promise<UniverseNavigationState> {

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
        .navigation
        .get([
          universeSeed,
          generatorVersionCode,
        ]);

    if (
      entity ===
      undefined
    ) {
      return {
        activeGalaxyIndex:
          0n,

        recentGalaxyIndices:
          [],
      };
    }

    return {
      activeGalaxyIndex:
        parseNonNegativeLongDecimal(
          entity.activeGalaxyIndex,
          'activeGalaxyIndex',
        ),

      recentGalaxyIndices:
        entity
          .recentGalaxyIndices
          .map(
            (
              value,
            ) =>
              parseNonNegativeLongDecimal(
                value,
                'recentGalaxyIndex',
              ),
          ),
    };
  }

  async setNavigation(
    generationKey:
      UniverseGenerationKey,

    navigation:
      UniverseNavigationState,
  ): Promise<void> {

    assertNonNegativeLong(
      navigation.activeGalaxyIndex,
      'activeGalaxyIndex',
    );

    for (
      const galaxyIndex
      of navigation.recentGalaxyIndices
    ) {
      assertNonNegativeLong(
        galaxyIndex,
        'recentGalaxyIndex',
      );
    }

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
      .navigation
      .put({
        universeSeed,
        generatorVersionCode,

        activeGalaxyIndex:
          navigation
            .activeGalaxyIndex
            .toString(
              10,
            ),

        recentGalaxyIndices:
          navigation
            .recentGalaxyIndices
            .map(
              (
                galaxyIndex,
              ) =>
                galaxyIndex
                  .toString(
                    10,
                  ),
            ),

        updatedAtEpochMs:
          this.clock(),
      });
  }
}