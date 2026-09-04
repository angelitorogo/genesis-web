import {
  DiscoveryState,
  type DiscoveryStateValue,
} from '../../domain/discovery/discovery-state';

import {
  type ScientificCompleteness,
} from '../../domain/discovery/scientific-completeness';

import {
  type ScientificEvidence,
} from '../../domain/discovery/scientific-evidence';

import {
  type VisitedToCataloguedScientificProfile,
} from '../../domain/discovery/visited-to-catalogued-scientific-profile';

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
  type ScientificEvidenceRepository,
} from '../../domain/repository/scientific-evidence-repository';

import {
  type GenesisIndexedDb,
} from '../../data/local/indexed-db/genesis-indexed-db';

import {
  VisitedToCataloguedScientificProgressionEngine,
} from '../../simulation/exploration/visited-to-catalogued-scientific-progression-engine';

/**
 * Atomic point-26.A.5 outcome after evaluating the persisted evidence set.
 *
 * There is deliberately no PD field. Cataloguing is earned by scientific
 * sufficiency for this object and cannot be purchased with Discovery Points.
 */
export class CommittedVisitedToCataloguedScientificProgression {

  readonly evidence:
    readonly ScientificEvidence[];

  constructor(
    readonly profileCode:
      string,

    evidence:
      readonly ScientificEvidence[],

    readonly completeness:
      ScientificCompleteness,

    readonly stateBefore:
      DiscoveryStateValue,

    readonly stateAfter:
      DiscoveryStateValue,

    readonly isEligible:
      boolean,

    readonly didAdvance:
      boolean,

    readonly persistedEvidence:
      ScientificEvidence | null,
  ) {

    this.evidence =
      Object.freeze([
        ...evidence,
      ]);

    Object.freeze(
      this,
    );
  }
}

export interface VisitedToCataloguedScientificProgressionRuntime {
  evaluateCurrentEvidence(
    generationKey:
      UniverseGenerationKey,

    locator:
      ProceduralLocator,

    profile:
      VisitedToCataloguedScientificProfile,
  ): Promise<CommittedVisitedToCataloguedScientificProgression>;

  recordEvidence(
    generationKey:
      UniverseGenerationKey,

    locator:
      ProceduralLocator,

    evidence:
      ScientificEvidence,

    profile:
      VisitedToCataloguedScientificProfile,
  ): Promise<CommittedVisitedToCataloguedScientificProgression>;
}

/**
 * Point-26.A.5 persistence orchestration.
 *
 * The only writable observed-knowledge stores are discoveries and observations.
 * The progress store is intentionally excluded, so neither evaluation nor a
 * scientific observation can spend PD to buy CATALOGUED.
 *
 * Evidence may continue to be recorded at CATALOGUED/CONFIRMED for later
 * confirmation work, but this runtime can only advance exactly
 * VISITED -> CATALOGUED. It rejects earlier states so the cataloguing campaign
 * cannot bypass DISCOVERED -> VISITED from point 26.A.4.
 */
export class DexieVisitedToCataloguedScientificProgressionRuntime
  implements VisitedToCataloguedScientificProgressionRuntime {

  constructor(
    private readonly database:
      GenesisIndexedDb,

    private readonly discoveryRepository:
      DiscoveryRepository,

    private readonly evidenceRepository:
      ScientificEvidenceRepository,
  ) {}

  async evaluateCurrentEvidence(
    generationKey:
      UniverseGenerationKey,

    locator:
      ProceduralLocator,

    profile:
      VisitedToCataloguedScientificProfile,
  ): Promise<CommittedVisitedToCataloguedScientificProgression> {

    await this.database
      .openDatabase();

    return this.database
      .transaction(
        'rw',
        this.database.universes,
        this.database.discoveries,
        this.database.observations,
        async () =>
          this.evaluateInsideTransaction(
            generationKey,
            locator,
            profile,
            null,
          ),
      );
  }

  async recordEvidence(
    generationKey:
      UniverseGenerationKey,

    locator:
      ProceduralLocator,

    evidence:
      ScientificEvidence,

    profile:
      VisitedToCataloguedScientificProfile,
  ): Promise<CommittedVisitedToCataloguedScientificProgression> {

    await this.database
      .openDatabase();

    return this.database
      .transaction(
        'rw',
        this.database.universes,
        this.database.discoveries,
        this.database.observations,
        async () => {
          const stateBefore =
            await this.requireCataloguingState(
              generationKey,
              locator,
            );

          const persistedEvidence =
            await this
              .evidenceRepository
              .recordEvidence(
                generationKey,
                locator,
                evidence,
              );

          return this.evaluateFromState(
            generationKey,
            locator,
            stateBefore,
            profile,
            persistedEvidence,
          );
        },
      );
  }

  private async evaluateInsideTransaction(
    generationKey:
      UniverseGenerationKey,

    locator:
      ProceduralLocator,

    profile:
      VisitedToCataloguedScientificProfile,

    persistedEvidence:
      ScientificEvidence | null,
  ): Promise<CommittedVisitedToCataloguedScientificProgression> {

    const stateBefore =
      await this.requireCataloguingState(
        generationKey,
        locator,
      );

    return this.evaluateFromState(
      generationKey,
      locator,
      stateBefore,
      profile,
      persistedEvidence,
    );
  }

  private async evaluateFromState(
    generationKey:
      UniverseGenerationKey,

    locator:
      ProceduralLocator,

    stateBefore:
      DiscoveryStateValue,

    profile:
      VisitedToCataloguedScientificProfile,

    persistedEvidence:
      ScientificEvidence | null,
  ): Promise<CommittedVisitedToCataloguedScientificProgression> {

    const allEvidence =
      await this
        .evidenceRepository
        .getEvidence(
          generationKey,
          locator,
        );

    const assessment =
      VisitedToCataloguedScientificProgressionEngine
        .evaluate(
          stateBefore,
          profile,
          allEvidence,
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

    return new CommittedVisitedToCataloguedScientificProgression(
      assessment.profileCode,
      allEvidence,
      assessment.completeness,
      assessment.stateBefore,
      assessment.stateAfter,
      assessment.isEligible,
      assessment.didAdvance,
      persistedEvidence,
    );
  }

  private async requireCataloguingState(
    generationKey:
      UniverseGenerationKey,

    locator:
      ProceduralLocator,
  ): Promise<DiscoveryStateValue> {

    const state =
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

    if (
      state.code <
      DiscoveryState.VISITED.code
    ) {
      throw new RangeError(
        `Point 26.A.5 cataloguing requires VISITED or higher; current state: ${state.name}.`,
      );
    }

    return state;
  }
}
