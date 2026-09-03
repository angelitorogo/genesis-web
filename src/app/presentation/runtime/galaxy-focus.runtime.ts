import {
  InjectionToken,
} from '@angular/core';

import {
  DiscoveryState,
  type DiscoveryStateValue,
} from '../../domain/discovery/discovery-state';

import {
  ExternalGalaxyFocusChoice,
} from '../../domain/exploration/external-galaxy-focus';

import {
  GalaxyLocator,
  type ProceduralLocator,
} from '../../domain/generation/procedural-locator';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  type DiscoveryRepository,
  type UniverseNavigationRepository,
} from '../../domain/repository/genesis-repositories';

import {
  GenesisIndexedDb,
} from '../../data/local/indexed-db/genesis-indexed-db';

import {
  DexieDiscoveryRepository,
  type ProceduralTargetSeedResolver,
} from '../../data/local/repository/dexie-discovery.repository';

import {
  DexieUniverseNavigationRepository,
} from '../../data/local/repository/dexie-universe-navigation.repository';

import {
  ExternalGalaxyFocusEngine,
} from '../../simulation/exploration/external-galaxy-focus-engine';

import {
  ProceduralTargetResolver,
} from '../../simulation/regeneration/procedural-target-resolver';

export interface GalaxyFocusChangeResult {
  readonly previousFocusGalaxyIndex:
    bigint;

  readonly activeGalaxyIndex:
    bigint;

  readonly targetStateBefore:
    DiscoveryStateValue;

  readonly targetStateAfter:
    DiscoveryStateValue;

  readonly didPromoteTargetToVisited:
    boolean;

  readonly recentGalaxyIndices:
    readonly bigint[];
}

export interface GalaxyFocusRuntime {
  changeFocus(
    generationKey:
      UniverseGenerationKey,

    targetGalaxyIndex:
      bigint,
  ): Promise<GalaxyFocusChangeResult>;

  returnToRecentGalaxy(
    generationKey:
      UniverseGenerationKey,

    targetGalaxyIndex:
      bigint,
  ): Promise<GalaxyFocusChangeResult>;
}

/**
 * Point-11.5/11.6 persistence boundary for explicit inter-galaxy exploration
 * focus changes.
 *
 * The existing point-7.7 ExternalGalaxyFocusEngine remains the pure source of
 * truth for the explicit choice. This runtime only applies that choice to
 * persistence:
 *
 * - DETECTED is not focusable: it must first be explicitly validated to
 *   DISCOVERED;
 * - the current focus must itself be a known GalaxyLocator;
 * - establishing a DISCOVERED galaxy as focus promotes it exactly to VISITED;
 * - an already-current DISCOVERED galaxy can be explicitly reaffirmed as focus
 *   to record the VISITED milestone without changing navigation;
 * - CATALOGUED and CONFIRMED are never regressed;
 * - activeGalaxyIndex and the target DiscoveryState are committed atomically;
 * - the previous focus is moved to the front of recentGalaxyIndices while the
 *   new active target is removed from that history;
 * - point 11.6 can require the target to belong to the persisted recent
 *   history before applying the same atomic focus transition;
 * - no Discovery Points are read, awarded or spent;
 * - no other discovery rows are mutated;
 * - no procedural Ground Truth is materialized;
 * - no physical or FTL travel is modelled.
 */
export class DexieGalaxyFocusRuntime
  implements GalaxyFocusRuntime {

  constructor(
    private readonly database:
      GenesisIndexedDb,

    private readonly navigationRepository:
      UniverseNavigationRepository,

    private readonly discoveryRepository:
      DiscoveryRepository,
  ) {}

  async changeFocus(
    generationKey:
      UniverseGenerationKey,

    targetGalaxyIndex:
      bigint,
  ): Promise<GalaxyFocusChangeResult> {

    return this
      .executeFocusChange(
        generationKey,
        targetGalaxyIndex,
        false,
      );
  }

  async returnToRecentGalaxy(
    generationKey:
      UniverseGenerationKey,

    targetGalaxyIndex:
      bigint,
  ): Promise<GalaxyFocusChangeResult> {

    return this
      .executeFocusChange(
        generationKey,
        targetGalaxyIndex,
        true,
      );
  }

  private async executeFocusChange(
    generationKey:
      UniverseGenerationKey,

    targetGalaxyIndex:
      bigint,

    requireRecentTarget:
      boolean,
  ): Promise<GalaxyFocusChangeResult> {

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
        async () =>
          this.changeInsideTransaction(
            generationKey,
            targetGalaxyIndex,
            requireRecentTarget,
          ),
      );
  }

  private async changeInsideTransaction(
    generationKey:
      UniverseGenerationKey,

    targetGalaxyIndex:
      bigint,

    requireRecentTarget:
      boolean,
  ): Promise<GalaxyFocusChangeResult> {

    const navigationBefore =
      await this
        .navigationRepository
        .getNavigation(
          generationKey,
        );

    const previousFocusGalaxyIndex =
      navigationBefore
        .activeGalaxyIndex;

    if (
      requireRecentTarget &&
      (
        targetGalaxyIndex ===
          previousFocusGalaxyIndex ||
        !navigationBefore
          .recentGalaxyIndices
          .includes(
            targetGalaxyIndex,
          )
      )
    ) {
      throw new RangeError(
        'A return target must belong to the persisted recent-galaxy history and cannot already be active.',
      );
    }

    const [
      currentFocusState,
      targetStateValue,
    ] =
      await Promise.all([
        this
          .discoveryRepository
          .getState(
            generationKey,
            new GalaxyLocator(
              previousFocusGalaxyIndex,
            ),
          ),

        this
          .discoveryRepository
          .getState(
            generationKey,
            new GalaxyLocator(
              targetGalaxyIndex,
            ),
          ),
      ]);

    if (
      !DiscoveryState.isKnown(
        currentFocusState,
      )
    ) {
      throw new RangeError(
        'The current exploration focus must reference a known galaxy.',
      );
    }

    const targetStateBefore =
      DiscoveryState
        .fromCode(
          targetStateValue.code,
        );

    if (
      targetStateBefore ===
      DiscoveryState.DETECTED
    ) {
      throw new RangeError(
        'A detected galaxy must be validated to DISCOVERED before it can become the exploration focus.',
      );
    }

    if (
      targetGalaxyIndex ===
      previousFocusGalaxyIndex
    ) {
      if (
        targetStateBefore !==
        DiscoveryState.DISCOVERED
      ) {
        throw new RangeError(
          'The target galaxy is already the active exploration focus.',
        );
      }

      await this
        .discoveryRepository
        .setState(
          generationKey,
          new GalaxyLocator(
            targetGalaxyIndex,
          ),
          DiscoveryState.VISITED,
        );

      return Object.freeze({
        previousFocusGalaxyIndex,
        activeGalaxyIndex:
          previousFocusGalaxyIndex,
        targetStateBefore,
        targetStateAfter:
          DiscoveryState.VISITED,
        didPromoteTargetToVisited:
          true,
        recentGalaxyIndices:
          navigationBefore
            .recentGalaxyIndices,
      });
    }

    const offer =
      ExternalGalaxyFocusEngine
        .buildFocusOffer(
          generationKey,
          previousFocusGalaxyIndex,
          targetGalaxyIndex,
          targetStateBefore,
        );

    const decision =
      ExternalGalaxyFocusEngine
        .resolveFocusChoice(
          generationKey,
          offer,
          ExternalGalaxyFocusChoice
            .FOCUS_DETECTED,
        );

    const targetStateAfter =
      targetStateBefore.code <
        DiscoveryState.VISITED.code
        ? DiscoveryState.VISITED
        : targetStateBefore;

    const recentGalaxyIndices =
      buildRecentGalaxyIndices(
        previousFocusGalaxyIndex,
        decision
          .resultingFocusGalaxyIndex,
        navigationBefore
          .recentGalaxyIndices,
      );

    if (
      targetStateAfter !==
      targetStateBefore
    ) {
      await this
        .discoveryRepository
        .setState(
          generationKey,
          new GalaxyLocator(
            targetGalaxyIndex,
          ),
          targetStateAfter,
        );
    }

    await this
      .navigationRepository
      .setNavigation(
        generationKey,
        {
          activeGalaxyIndex:
            decision
              .resultingFocusGalaxyIndex,

          recentGalaxyIndices,
        },
      );

    return Object.freeze({
      previousFocusGalaxyIndex,

      activeGalaxyIndex:
        decision
          .resultingFocusGalaxyIndex,

      targetStateBefore,
      targetStateAfter,

      didPromoteTargetToVisited:
        targetStateAfter !==
        targetStateBefore,

      recentGalaxyIndices,
    });
  }
}

function buildRecentGalaxyIndices(
  previousFocusGalaxyIndex:
    bigint,

  activeGalaxyIndex:
    bigint,

  existing:
    readonly bigint[],
): readonly bigint[] {

  const recent:
    bigint[] =
    [
      previousFocusGalaxyIndex,
    ];

  for (
    const galaxyIndex
    of existing
  ) {
    if (
      galaxyIndex ===
        previousFocusGalaxyIndex ||
      galaxyIndex ===
        activeGalaxyIndex ||
      recent.includes(
        galaxyIndex,
      )
    ) {
      continue;
    }

    recent.push(
      galaxyIndex,
    );
  }

  return Object.freeze(
    recent,
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

export const GALAXY_FOCUS_RUNTIME =
  new InjectionToken<GalaxyFocusRuntime>(
    'GALAXY_FOCUS_RUNTIME',
    {
      providedIn:
        'root',

      factory:
        createGalaxyFocusRuntime,
    },
  );

function createGalaxyFocusRuntime():
  GalaxyFocusRuntime {

  const database =
    new GenesisIndexedDb();

  return new DexieGalaxyFocusRuntime(
    database,
    new DexieUniverseNavigationRepository(
      database,
    ),
    new DexieDiscoveryRepository(
      database,
      TARGET_SEED_RESOLVER,
    ),
  );

}
