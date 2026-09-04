import {
  DiscoveryState,
  type DiscoveryStateValue,
} from '../../domain/discovery/discovery-state';

import {
  type DiscoveredToVisitedEntryKindValue,
} from '../../domain/discovery/discovered-to-visited-entry';

import {
  type ProceduralLocator,
} from '../../domain/generation/procedural-locator';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  type DiscoveryRepository,
} from '../../domain/repository/genesis-repositories';

import {
  type GenesisIndexedDb,
} from '../../data/local/indexed-db/genesis-indexed-db';

import {
  DiscoveredToVisitedProgressionEngine,
} from '../../simulation/exploration/discovered-to-visited-progression-engine';

/**
 * Persisted point-26.A.4 outcome after entering one valid detailed interaction
 * surface.
 *
 * No PD/evidence/physical fields are present by design. The persisted VISITED
 * state itself records that the first eligible interaction occurred.
 */
export class CommittedDiscoveredToVisitedProgression {

  constructor(
    readonly entryKind:
      DiscoveredToVisitedEntryKindValue,

    readonly stateBefore:
      DiscoveryStateValue,

    readonly stateAfter:
      DiscoveryStateValue,

    readonly isVisitEligible:
      boolean,

    readonly didAdvance:
      boolean,
  ) {

    Object.freeze(
      this,
    );
  }
}

export interface DiscoveredToVisitedProgressionRuntime {
  recordEntry(
    generationKey:
      UniverseGenerationKey,

    locator:
      ProceduralLocator,

    entryKind:
      DiscoveredToVisitedEntryKindValue,
  ): Promise<CommittedDiscoveredToVisitedProgression>;
}

/**
 * Point-26.A.4 persistence boundary.
 *
 * Only the authoritative DiscoveryState can change, and only by the adjacent
 * DISCOVERED -> VISITED transition. The transaction intentionally excludes
 * observations and progress: entering a scene/fiche neither creates scientific
 * evidence nor spends/awards Discovery Points.
 *
 * UI integration is deliberately deferred to point 26.A.9. This runtime is the
 * common persistence mechanism that SystemPage, Archive and later object detail
 * surfaces will call.
 */
export class DexieDiscoveredToVisitedProgressionRuntime
  implements DiscoveredToVisitedProgressionRuntime {

  constructor(
    private readonly database:
      GenesisIndexedDb,

    private readonly discoveryRepository:
      DiscoveryRepository,
  ) {}

  async recordEntry(
    generationKey:
      UniverseGenerationKey,

    locator:
      ProceduralLocator,

    entryKind:
      DiscoveredToVisitedEntryKindValue,
  ): Promise<CommittedDiscoveredToVisitedProgression> {

    await this.database
      .openDatabase();

    return this.database
      .transaction(
        'rw',
        this.database.universes,
        this.database.discoveries,
        async () =>
          this.recordInsideTransaction(
            generationKey,
            locator,
            entryKind,
          ),
      );
  }

  private async recordInsideTransaction(
    generationKey:
      UniverseGenerationKey,

    locator:
      ProceduralLocator,

    entryKind:
      DiscoveredToVisitedEntryKindValue,
  ): Promise<CommittedDiscoveredToVisitedProgression> {

    const stateBefore =
      DiscoveryState
        .fromCode(
          (
            await this
              .discoveryRepository
              .getState(
                generationKey,
                locator,
              )
          ).code,
        );

    const assessment =
      DiscoveredToVisitedProgressionEngine
        .evaluate(
          stateBefore,
          entryKind,
        );

    if (
      assessment.didAdvance
    ) {
      await this
        .discoveryRepository
        .setState(
          generationKey,
          locator,
          assessment.stateAfter,
        );
    }

    return new CommittedDiscoveredToVisitedProgression(
      assessment.entryKind,
      assessment.stateBefore,
      assessment.stateAfter,
      assessment.isVisitEligible,
      assessment.didAdvance,
    );
  }
}
