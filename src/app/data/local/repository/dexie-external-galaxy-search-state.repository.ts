import {
  type UniverseGenerationKey,
} from '../../../domain/generation/universe-generation-key';

import {
  type GenesisIndexedDb,
} from '../indexed-db/genesis-indexed-db';

import {
  assertNonNegativeLong,
  ensureUniverseExists,
  generationKeyStorageParts,
  parseNonNegativeLongDecimal,
} from './local-repository-support';

export class DexieExternalGalaxySearchStateRepository {

  constructor(
    private readonly database:
      GenesisIndexedDb,

    private readonly clock:
      () => number =
        Date.now,
  ) {}

  async getConsecutiveFailedSearches(
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
        .navigation
        .get([
          universeSeed,
          generatorVersionCode,
        ]);

    const persisted =
      entity
        ?.externalGalaxySearchConsecutiveFailures;

    if (
      persisted ===
      undefined
    ) {
      return 0n;
    }

    return parseNonNegativeLongDecimal(
      persisted,
      'externalGalaxySearchConsecutiveFailures',
    );
  }

  async setConsecutiveFailedSearches(
    generationKey:
      UniverseGenerationKey,

    consecutiveFailedSearches:
      bigint,
  ): Promise<void> {

    assertNonNegativeLong(
      consecutiveFailedSearches,
      'consecutiveFailedSearches',
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

    const existing =
      await this.database
        .navigation
        .get([
          universeSeed,
          generatorVersionCode,
        ]);

    await this.database
      .navigation
      .put({
        universeSeed,
        generatorVersionCode,

        activeGalaxyIndex:
          existing
            ?.activeGalaxyIndex ??
          '0',

        recentGalaxyIndices:
          existing ===
          undefined
            ? []
            : [
                ...existing
                  .recentGalaxyIndices,
              ],

        externalGalaxySearchConsecutiveFailures:
          consecutiveFailedSearches
            .toString(
              10,
            ),

        updatedAtEpochMs:
          this.clock(),
      });
  }
}
