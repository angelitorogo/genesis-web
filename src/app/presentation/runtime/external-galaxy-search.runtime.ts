import {
  InjectionToken,
} from '@angular/core';

import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

import {
  DiscoveryTargetType,
} from '../../domain/discovery/discovery-target-type';

import {
  DiscoveryRewardReason,
} from '../../domain/exploration/discovery-reward-reason';

import {
  ExplorationBalanceV1,
} from '../../domain/exploration/exploration-balance';

import {
  type ExternalGalaxyFocusOffer,
} from '../../domain/exploration/external-galaxy-focus';

import {
  type ExternalGalaxySearchPityProfile,
} from '../../domain/exploration/external-galaxy-search-pity-profile';

import {
  GalaxyLocator,
  type ProceduralLocator,
} from '../../domain/generation/procedural-locator';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  type DiscoveryPointsRepository,
  type DiscoveryRepository,
  type UniverseNavigationRepository,
} from '../../domain/repository/genesis-repositories';

import {
  type ExternalGalaxyPreliminaryInformation,
} from '../../domain/observation/galaxy/external-galaxy-preliminary-information';

import {
  GenesisUniverse,
} from '../../domain/universe/genesis-universe';

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
  DexieExternalGalaxySearchStateRepository,
} from '../../data/local/repository/dexie-external-galaxy-search-state.repository';

import {
  DexieUniverseNavigationRepository,
} from '../../data/local/repository/dexie-universe-navigation.repository';

import {
  DiscoveryRewardEngine,
} from '../../simulation/exploration/discovery-reward-engine';

import {
  ExternalGalaxyFocusEngine,
} from '../../simulation/exploration/external-galaxy-focus-engine';

import {
  ExternalGalaxySearchEngine,
} from '../../simulation/exploration/external-galaxy-search-engine';

import {
  ExternalGalaxySearchPityEngine,
} from '../../simulation/exploration/external-galaxy-search-pity-engine';

import {
  ExternalGalaxyPreliminaryInformationGenerator,
} from '../../simulation/observation/galaxy/external-galaxy-preliminary-information-generator';

import {
  ProceduralTargetResolver,
} from '../../simulation/regeneration/procedural-target-resolver';

const SIGNED_LONG_MAX =
  9_223_372_036_854_775_807n;

const NO_REWARD_REASONS =
  new Set<DiscoveryRewardReason>();

export interface ExternalGalaxySearchStatus {
  readonly globalDiscoveryPoints:
    bigint;

  readonly consecutiveFailedSearches:
    bigint;

  readonly knownExternalGalaxyCount:
    bigint;

  readonly searchOpportunityAvailable:
    boolean;

  readonly earnedSearchOpportunities:
    bigint;

  readonly consumedSearchOpportunities:
    bigint;

  readonly availableSearchOpportunities:
    bigint;

  readonly unannouncedSearchOpportunities:
    bigint;

  readonly nextSearchOpportunityThreshold:
    bigint;

  readonly discoveryPointsUntilNextOpportunity:
    bigint;

  readonly searchDiscoveryPointStep:
    bigint;

  readonly nextSearchProfile:
    ExternalGalaxySearchPityProfile;
}

export interface ExternalGalaxySearchRuntimeResult {
  readonly detected:
    boolean;

  readonly probabilityProfileUsed:
    ExternalGalaxySearchPityProfile;

  readonly consecutiveFailedSearchesBefore:
    bigint;

  readonly consecutiveFailedSearchesAfter:
    bigint;

  readonly globalDiscoveryPointsBefore:
    bigint;

  readonly globalDiscoveryPointsAfter:
    bigint;

  readonly awardedDiscoveryPoints:
    number;

  readonly detectedGalaxyIndex:
    bigint | null;

  readonly preliminaryInformation:
    ExternalGalaxyPreliminaryInformation | null;

  readonly focusOffer:
    ExternalGalaxyFocusOffer | null;

  readonly nextSearchProfile:
    ExternalGalaxySearchPityProfile;
}

export interface ExternalGalaxySearchRuntime {
  getStatus(
    generationKey:
      UniverseGenerationKey,
  ): Promise<ExternalGalaxySearchStatus>;

  search(
    generationKey:
      UniverseGenerationKey,
  ): Promise<ExternalGalaxySearchRuntimeResult>;

  acknowledgeOpportunityNotifications(
    generationKey:
      UniverseGenerationKey,
  ): Promise<void>;
}

/**
 * Missing gameplay orchestration for frozen points 7.4..7.8.
 *
 * One external search is committed atomically with its anti-blocking and
 * progression-gate state:
 *
 * - one non-spendable opportunity is earned per 100 global PD reached;
 * - earned opportunities are checkpointed by a monotonic high-water mark, so
 *   later scientific PD spending cannot revoke them;
 * - unused opportunities accumulate persistently and the runtime consumes only
 *   one opportunity per search;
 * - 7.4/7.5 provide the probability profile;
 * - ExternalGalaxySearchEngine performs one deterministic V1 draw;
 * - failed searches persist only the consecutive-failure streak;
 * - successful searches persist one new GalaxyLocator at DETECTED;
 * - UNKNOWN -> DETECTED awards the already-frozen GALAXY Discovery Points;
 * - 7.6 preliminary information is projected without leaking exact Ground
 *   Truth;
 * - 7.7 returns an explicit focus offer, but never changes focus automatically;
 * - 7.8 works automatically because the new DETECTED GalaxyLocator is now part
 *   of the persisted known-discovery catalogue.
 */
export class DexieExternalGalaxySearchRuntime
  implements ExternalGalaxySearchRuntime {

  constructor(
    private readonly database:
      GenesisIndexedDb,

    private readonly navigationRepository:
      UniverseNavigationRepository,

    private readonly pointsRepository:
      DiscoveryPointsRepository,

    private readonly discoveryRepository:
      DiscoveryRepository,

    private readonly searchStateRepository:
      DexieExternalGalaxySearchStateRepository,
  ) {}

  async getStatus(
    generationKey:
      UniverseGenerationKey,
  ): Promise<ExternalGalaxySearchStatus> {

    await this
      .database
      .openDatabase();

    return this
      .database
      .transaction(
        'r',
        this.database.universes,
        this.database.navigation,
        this.database.discoveries,
        this.database.progress,
        async () => {
          const [
            globalDiscoveryPoints,
            persistedSearchState,
            knownDiscoveries,
          ] =
            await Promise.all([
              this
                .pointsRepository
                .getGlobalDiscoveryPoints(
                  generationKey,
                ),

              this
                .searchStateRepository
                .getState(
                  generationKey,
                ),

              this
                .discoveryRepository
                .getKnownDiscoveries(
                  generationKey,
                ),
            ]);

          const knownExternalGalaxyCount =
            countKnownExternalGalaxies(
              knownDiscoveries,
            );

          const opportunity =
            evaluateSearchOpportunity(
              globalDiscoveryPoints,
              persistedSearchState
                .consumedSearchOpportunities,
              persistedSearchState
                .lastAnnouncedEarnedSearchOpportunities,
              persistedSearchState
                .earnedSearchOpportunitiesHighWatermark,
            );

          return Object.freeze({
            globalDiscoveryPoints,
            consecutiveFailedSearches:
              persistedSearchState
                .consecutiveFailedSearches,
            knownExternalGalaxyCount,

            ...opportunity,

            nextSearchProfile:
              ExternalGalaxySearchPityEngine
                .evaluateNextSearchProbability(
                  generationKey,
                  globalDiscoveryPoints,
                  persistedSearchState
                    .consecutiveFailedSearches,
                ),
          });
        },
      );
  }

  async search(
    generationKey:
      UniverseGenerationKey,
  ): Promise<ExternalGalaxySearchRuntimeResult> {

    await this
      .database
      .openDatabase();

    return this
      .database
      .transaction(
        'rw',
        this.database.universes,
        this.database.navigation,
        this.database.discoveries,
        this.database.progress,
        async () =>
          this.searchInsideTransaction(
            generationKey,
          ),
      );
  }

  async acknowledgeOpportunityNotifications(
    generationKey:
      UniverseGenerationKey,
  ): Promise<void> {

    await this
      .database
      .openDatabase();

    await this
      .database
      .transaction(
        'rw',
        this.database.universes,
        this.database.navigation,
        this.database.progress,
        async () => {
          const [
            globalDiscoveryPoints,
            persistedSearchState,
          ] =
            await Promise.all([
              this
                .pointsRepository
                .getGlobalDiscoveryPoints(
                  generationKey,
                ),

              this
                .searchStateRepository
                .getState(
                  generationKey,
                ),
            ]);

          const opportunity =
            evaluateSearchOpportunity(
              globalDiscoveryPoints,
              persistedSearchState
                .consumedSearchOpportunities,
              persistedSearchState
                .lastAnnouncedEarnedSearchOpportunities,
              persistedSearchState
                .earnedSearchOpportunitiesHighWatermark,
            );

          if (
            opportunity
              .earnedSearchOpportunities <=
              persistedSearchState
                .lastAnnouncedEarnedSearchOpportunities &&
            opportunity
              .earnedSearchOpportunities <=
              persistedSearchState
                .earnedSearchOpportunitiesHighWatermark
          ) {
            return;
          }

          await this
            .searchStateRepository
            .setState(
              generationKey,
              {
                ...persistedSearchState,
                lastAnnouncedEarnedSearchOpportunities:
                  opportunity
                    .earnedSearchOpportunities,
                earnedSearchOpportunitiesHighWatermark:
                  opportunity
                    .earnedSearchOpportunities,
              },
            );
        },
      );
  }

  private async searchInsideTransaction(
    generationKey:
      UniverseGenerationKey,
  ): Promise<ExternalGalaxySearchRuntimeResult> {

    const [
      navigation,
      globalDiscoveryPointsBefore,
      persistedSearchState,
      knownDiscoveries,
    ] =
      await Promise.all([
        this
          .navigationRepository
          .getNavigation(
            generationKey,
          ),

        this
          .pointsRepository
          .getGlobalDiscoveryPoints(
            generationKey,
          ),

        this
          .searchStateRepository
          .getState(
            generationKey,
          ),

        this
          .discoveryRepository
          .getKnownDiscoveries(
            generationKey,
          ),
      ]);

    const consecutiveFailedSearchesBefore =
      persistedSearchState
        .consecutiveFailedSearches;

    const knownGalaxyIndices =
      collectKnownGalaxyIndices(
        knownDiscoveries,
      );

    if (
      !knownGalaxyIndices.has(
        navigation
          .activeGalaxyIndex
          .toString(
            10,
          ),
      )
    ) {
      throw new RangeError(
        'The active exploration focus must reference a known galaxy before an external search can run.',
      );
    }

    const opportunity =
      evaluateSearchOpportunity(
        globalDiscoveryPointsBefore,
        persistedSearchState
          .consumedSearchOpportunities,
        persistedSearchState
          .lastAnnouncedEarnedSearchOpportunities,
        persistedSearchState
          .earnedSearchOpportunitiesHighWatermark,
      );

    if (
      !opportunity
        .searchOpportunityAvailable
    ) {
      throw new RangeError(
        `External-galaxy search has no available attempts. The next attempt unlocks at ${opportunity.nextSearchOpportunityThreshold.toString(10)} global Discovery Points.`,
      );
    }

    const knownExternalGalaxyCount =
      BigInt(
        [
          ...knownGalaxyIndices,
        ]
          .filter(
            (
              galaxyIndex,
            ) =>
              BigInt(
                galaxyIndex,
              ) !==
              GenesisUniverse
                .INITIAL_GALAXY_INDEX,
          )
          .length,
      );

    const attempt =
      ExternalGalaxySearchEngine
        .resolveNextSearch(
          generationKey,
          globalDiscoveryPointsBefore,
          consecutiveFailedSearchesBefore,
          knownExternalGalaxyCount,
          [
            ...knownGalaxyIndices,
          ]
            .map(
              (
                galaxyIndex,
              ) =>
                BigInt(
                  galaxyIndex,
                ),
            ),
        );

    if (
      !attempt.detected ||
      attempt.detectedGalaxyIndex ===
        null
    ) {
      await this
        .searchStateRepository
        .setState(
          generationKey,
          {
            consecutiveFailedSearches:
              attempt
                .consecutiveFailedSearchesAfter,

            consumedSearchOpportunities:
              persistedSearchState
                .consumedSearchOpportunities +
              1n,

            lastAnnouncedEarnedSearchOpportunities:
              persistedSearchState
                .lastAnnouncedEarnedSearchOpportunities,

            earnedSearchOpportunitiesHighWatermark:
              opportunity
                .earnedSearchOpportunities,
          },
        );

      const nextSearchProfile =
        ExternalGalaxySearchPityEngine
          .evaluateNextSearchProbability(
            generationKey,
            globalDiscoveryPointsBefore,
            attempt
              .consecutiveFailedSearchesAfter,
          );

      return Object.freeze({
        detected:
          false,

        probabilityProfileUsed:
          attempt
            .probabilityProfile,

        consecutiveFailedSearchesBefore,
        consecutiveFailedSearchesAfter:
          attempt
            .consecutiveFailedSearchesAfter,

        globalDiscoveryPointsBefore,
        globalDiscoveryPointsAfter:
          globalDiscoveryPointsBefore,

        awardedDiscoveryPoints:
          0,

        detectedGalaxyIndex:
          null,

        preliminaryInformation:
          null,

        focusOffer:
          null,

        nextSearchProfile,
      });
    }

    const detectedGalaxyIndex =
      attempt
        .detectedGalaxyIndex;

    const locator =
      new GalaxyLocator(
        detectedGalaxyIndex,
      );

    const previousState =
      await this
        .discoveryRepository
        .getState(
          generationKey,
          locator,
        );

    if (
      previousState.code !==
      DiscoveryState.UNKNOWN.code
    ) {
      throw new Error(
        'External-galaxy candidate selection returned an already-known galaxy.',
      );
    }

    const reward =
      DiscoveryRewardEngine
        .evaluateDiscoveryReward(
          generationKey,
          DiscoveryTargetType.GALAXY,
          DiscoveryState.UNKNOWN,
          DiscoveryState.DETECTED,
          NO_REWARD_REASONS,
        );

    const awardedDiscoveryPoints =
      reward
        .totalAwardedDiscoveryPoints;

    const globalDiscoveryPointsAfter =
      globalDiscoveryPointsBefore +
      BigInt(
        awardedDiscoveryPoints,
      );

    if (
      globalDiscoveryPointsAfter >
      SIGNED_LONG_MAX
    ) {
      throw new RangeError(
        'External-galaxy detection would exceed the signed-Long global Discovery Point range.',
      );
    }

    await this
      .discoveryRepository
      .setState(
        generationKey,
        locator,
        DiscoveryState.DETECTED,
      );

    if (
      awardedDiscoveryPoints >
      0
    ) {
      await this
        .pointsRepository
        .setGlobalDiscoveryPoints(
          generationKey,
          globalDiscoveryPointsAfter,
        );
    }

    const earnedSearchOpportunitiesAfterReward =
      maxBigInt(
        opportunity
          .earnedSearchOpportunities,
        globalDiscoveryPointsAfter /
          ExplorationBalanceV1
            .externalGalaxySearchDiscoveryPointStep,
      );

    await this
      .searchStateRepository
      .setState(
        generationKey,
        {
          consecutiveFailedSearches:
            0n,

          consumedSearchOpportunities:
            persistedSearchState
              .consumedSearchOpportunities +
            1n,

          lastAnnouncedEarnedSearchOpportunities:
            persistedSearchState
              .lastAnnouncedEarnedSearchOpportunities,

          earnedSearchOpportunitiesHighWatermark:
            earnedSearchOpportunitiesAfterReward,
        },
      );

    const preliminaryInformation =
      ExternalGalaxyPreliminaryInformationGenerator
        .generate(
          generationKey,
          detectedGalaxyIndex,
          DiscoveryState.DETECTED,
        );

    const focusOffer =
      ExternalGalaxyFocusEngine
        .buildFocusOffer(
          generationKey,
          navigation
            .activeGalaxyIndex,
          detectedGalaxyIndex,
          DiscoveryState.DETECTED,
        );

    return Object.freeze({
      detected:
        true,

      probabilityProfileUsed:
        attempt
          .probabilityProfile,

      consecutiveFailedSearchesBefore,
      consecutiveFailedSearchesAfter:
        0n,

      globalDiscoveryPointsBefore,
      globalDiscoveryPointsAfter,

      awardedDiscoveryPoints,

      detectedGalaxyIndex,

      preliminaryInformation,
      focusOffer,

      nextSearchProfile:
        ExternalGalaxySearchPityEngine
          .evaluateNextSearchProbability(
            generationKey,
            globalDiscoveryPointsAfter,
            0n,
          ),
    });
  }
}

interface ExternalGalaxySearchOpportunity {
  readonly searchOpportunityAvailable:
    boolean;

  readonly earnedSearchOpportunities:
    bigint;

  readonly consumedSearchOpportunities:
    bigint;

  readonly availableSearchOpportunities:
    bigint;

  readonly unannouncedSearchOpportunities:
    bigint;

  readonly nextSearchOpportunityThreshold:
    bigint;

  readonly discoveryPointsUntilNextOpportunity:
    bigint;

  readonly searchDiscoveryPointStep:
    bigint;
}

function evaluateSearchOpportunity(
  globalDiscoveryPoints:
    bigint,

  consumedSearchOpportunities:
    bigint,

  lastAnnouncedEarnedSearchOpportunities:
    bigint,

  earnedSearchOpportunitiesHighWatermark:
    bigint,
): ExternalGalaxySearchOpportunity {

  if (
    globalDiscoveryPoints <
      0n ||
    globalDiscoveryPoints >
      SIGNED_LONG_MAX
  ) {
    throw new RangeError(
      'globalDiscoveryPoints must belong to the non-negative signed-Long range.',
    );
  }

  if (
    consumedSearchOpportunities <
      0n ||
    consumedSearchOpportunities >
      SIGNED_LONG_MAX
  ) {
    throw new RangeError(
      'consumedSearchOpportunities must belong to the non-negative signed-Long range.',
    );
  }

  if (
    lastAnnouncedEarnedSearchOpportunities <
      0n ||
    lastAnnouncedEarnedSearchOpportunities >
      SIGNED_LONG_MAX
  ) {
    throw new RangeError(
      'lastAnnouncedEarnedSearchOpportunities must belong to the non-negative signed-Long range.',
    );
  }

  if (
    earnedSearchOpportunitiesHighWatermark <
      0n ||
    earnedSearchOpportunitiesHighWatermark >
      SIGNED_LONG_MAX
  ) {
    throw new RangeError(
      'earnedSearchOpportunitiesHighWatermark must belong to the non-negative signed-Long range.',
    );
  }

  const searchDiscoveryPointStep =
    ExplorationBalanceV1
      .externalGalaxySearchDiscoveryPointStep;

  const currentBalanceEarnedSearchOpportunities =
    globalDiscoveryPoints /
    searchDiscoveryPointStep;

  const earnedSearchOpportunities =
    maxBigInt(
      currentBalanceEarnedSearchOpportunities,
      earnedSearchOpportunitiesHighWatermark,
      consumedSearchOpportunities,
      lastAnnouncedEarnedSearchOpportunities,
    );

  const availableSearchOpportunities =
    earnedSearchOpportunities -
    consumedSearchOpportunities;

  const unannouncedSearchOpportunities =
    earnedSearchOpportunities -
    lastAnnouncedEarnedSearchOpportunities;

  const nextSearchOpportunityThreshold =
    (
      earnedSearchOpportunities +
      1n
    ) *
    searchDiscoveryPointStep;

  return Object.freeze({
    searchOpportunityAvailable:
      availableSearchOpportunities >
      0n,

    earnedSearchOpportunities,
    consumedSearchOpportunities,
    availableSearchOpportunities,
    unannouncedSearchOpportunities,
    nextSearchOpportunityThreshold,

    discoveryPointsUntilNextOpportunity:
      nextSearchOpportunityThreshold >
        globalDiscoveryPoints
        ? nextSearchOpportunityThreshold -
            globalDiscoveryPoints
        : 0n,

    searchDiscoveryPointStep,
  });
}

function maxBigInt(
  ...values:
    readonly bigint[]
): bigint {

  let maximum =
    0n;

  for (
    const value
    of values
  ) {
    if (
      value >
      maximum
    ) {
      maximum =
        value;
    }
  }

  return maximum;
}

function collectKnownGalaxyIndices(
  knownDiscoveries:
    readonly {
      readonly locator:
        ProceduralLocator;
    }[],
): Set<string> {

  return new Set(
    knownDiscoveries
      .filter(
        (
          discovery,
        ) =>
          discovery.locator
          instanceof
          GalaxyLocator,
      )
      .map(
        (
          discovery,
        ) =>
          (
            discovery.locator as
              GalaxyLocator
          )
            .galaxyIndex
            .toString(
              10,
            ),
      ),
  );
}

function countKnownExternalGalaxies(
  knownDiscoveries:
    readonly {
      readonly locator:
        ProceduralLocator;
    }[],
): bigint {

  const indices =
    collectKnownGalaxyIndices(
      knownDiscoveries,
    );

  return BigInt(
    [
      ...indices,
    ]
      .filter(
        (
          galaxyIndex,
        ) =>
          BigInt(
            galaxyIndex,
          ) !==
          GenesisUniverse
            .INITIAL_GALAXY_INDEX,
      )
      .length,
  );
}

const TARGET_SEED_RESOLVER:
  ProceduralTargetSeedResolver =
  Object.freeze({
    resolveTargetSeedNormalized(
      generationKey:
        UniverseGenerationKey,

      locator:
        ProceduralLocator,
    ): string {

      return ProceduralTargetResolver
        .resolveTargetSeed(
          generationKey,
          locator,
        )
        .normalizedValue;
    },
  });

export const EXTERNAL_GALAXY_SEARCH_RUNTIME =
  new InjectionToken<ExternalGalaxySearchRuntime>(
    'EXTERNAL_GALAXY_SEARCH_RUNTIME',
    {
      providedIn:
        'root',

      factory:
        createExternalGalaxySearchRuntime,
    },
  );

function createExternalGalaxySearchRuntime():
  ExternalGalaxySearchRuntime {

  const database =
    new GenesisIndexedDb();

  return new DexieExternalGalaxySearchRuntime(
    database,
    new DexieUniverseNavigationRepository(
      database,
    ),
    new DexieDiscoveryPointsRepository(
      database,
    ),
    new DexieDiscoveryRepository(
      database,
      TARGET_SEED_RESOLVER,
    ),
    new DexieExternalGalaxySearchStateRepository(
      database,
    ),
  );
}


