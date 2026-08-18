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

export interface PersistedExternalGalaxySearchState {
  readonly consecutiveFailedSearches:
    bigint;

  readonly consumedSearchOpportunities:
    bigint;

  readonly lastAnnouncedEarnedSearchOpportunities:
    bigint;
}

export class DexieExternalGalaxySearchStateRepository {

  constructor(
    private readonly database:
      GenesisIndexedDb,

    private readonly clock:
      () => number =
        Date.now,
  ) {}

  async getState(
    generationKey:
      UniverseGenerationKey,
  ): Promise<PersistedExternalGalaxySearchState> {

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

    return Object.freeze({
      consecutiveFailedSearches:
        entity
          ?.externalGalaxySearchConsecutiveFailures ===
        undefined
          ? 0n
          : parseNonNegativeLongDecimal(
              entity
                .externalGalaxySearchConsecutiveFailures,
              'externalGalaxySearchConsecutiveFailures',
            ),

      consumedSearchOpportunities:
        entity
          ?.externalGalaxySearchConsumedOpportunities ===
        undefined
          ? 0n
          : parseNonNegativeLongDecimal(
              entity
                .externalGalaxySearchConsumedOpportunities,
              'externalGalaxySearchConsumedOpportunities',
            ),

      lastAnnouncedEarnedSearchOpportunities:
        entity
          ?.externalGalaxySearchLastAnnouncedEarnedOpportunities ===
        undefined
          ? 0n
          : parseNonNegativeLongDecimal(
              entity
                .externalGalaxySearchLastAnnouncedEarnedOpportunities,
              'externalGalaxySearchLastAnnouncedEarnedOpportunities',
            ),
    });
  }

  async setState(
    generationKey:
      UniverseGenerationKey,

    state:
      PersistedExternalGalaxySearchState,
  ): Promise<void> {

    assertNonNegativeLong(
      state.consecutiveFailedSearches,
      'consecutiveFailedSearches',
    );

    assertNonNegativeLong(
      state.consumedSearchOpportunities,
      'consumedSearchOpportunities',
    );

    assertNonNegativeLong(
      state.lastAnnouncedEarnedSearchOpportunities,
      'lastAnnouncedEarnedSearchOpportunities',
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
          state
            .consecutiveFailedSearches
            .toString(
              10,
            ),

        externalGalaxySearchConsumedOpportunities:
          state
            .consumedSearchOpportunities
            .toString(
              10,
            ),

        externalGalaxySearchLastAnnouncedEarnedOpportunities:
          state
            .lastAnnouncedEarnedSearchOpportunities
            .toString(
              10,
            ),

        updatedAtEpochMs:
          this.clock(),
      });
  }

  async getConsecutiveFailedSearches(
    generationKey:
      UniverseGenerationKey,
  ): Promise<bigint> {

    return (
      await this.getState(
        generationKey,
      )
    )
      .consecutiveFailedSearches;
  }

  async setConsecutiveFailedSearches(
    generationKey:
      UniverseGenerationKey,

    consecutiveFailedSearches:
      bigint,
  ): Promise<void> {

    const current =
      await this.getState(
        generationKey,
      );

    await this.setState(
      generationKey,
      {
        ...current,
        consecutiveFailedSearches,
      },
    );
  }
}
