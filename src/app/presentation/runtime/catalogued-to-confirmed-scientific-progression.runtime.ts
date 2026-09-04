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
  type CataloguedToConfirmedScientificProfile,
} from '../../domain/discovery/catalogued-to-confirmed-scientific-profile';

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
  CataloguedToConfirmedScientificProgressionEngine,
} from '../../simulation/exploration/catalogued-to-confirmed-scientific-progression-engine';

/**
 * Atomic point-26.A.6 confirmation outcome.
 *
 * No Discovery Point amount is exposed because confirmation is earned from
 * scientific evidence and uncertainty reduction, not purchased with PD.
 */
export class CommittedCataloguedToConfirmedScientificProgression {

  readonly evidence:
    readonly ScientificEvidence[];

  constructor(
    readonly profileCode:
      string,

    evidence:
      readonly ScientificEvidence[],

    readonly cataloguedBaselineCompleteness:
      ScientificCompleteness,

    readonly confirmationCompleteness:
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

export interface CataloguedToConfirmedScientificProgressionRuntime {
  evaluateCurrentEvidence(
    generationKey:
      UniverseGenerationKey,

    locator:
      ProceduralLocator,

    profile:
      CataloguedToConfirmedScientificProfile,
  ): Promise<CommittedCataloguedToConfirmedScientificProgression>;

  recordEvidence(
    generationKey:
      UniverseGenerationKey,

    locator:
      ProceduralLocator,

    evidence:
      ScientificEvidence,

    profile:
      CataloguedToConfirmedScientificProfile,
  ): Promise<CommittedCataloguedToConfirmedScientificProgression>;
}

/**
 * Point-26.A.6 persistence orchestration.
 *
 * Only observed-knowledge stores participate in the transaction:
 * universes/discoveries/observations. The progress store is deliberately
 * excluded. Therefore neither evaluating nor recording confirmation evidence
 * can spend PD to buy CONFIRMED.
 *
 * The runtime rejects states below CATALOGUED and can only advance exactly
 * CATALOGUED -> CONFIRMED. At CONFIRMED it remains idempotent while still
 * allowing later scientific evidence to be preserved.
 */
export class DexieCataloguedToConfirmedScientificProgressionRuntime
  implements CataloguedToConfirmedScientificProgressionRuntime {

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
      CataloguedToConfirmedScientificProfile,
  ): Promise<CommittedCataloguedToConfirmedScientificProgression> {

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
      CataloguedToConfirmedScientificProfile,
  ): Promise<CommittedCataloguedToConfirmedScientificProgression> {

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
            await this.requireConfirmationState(
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
      CataloguedToConfirmedScientificProfile,

    persistedEvidence:
      ScientificEvidence | null,
  ): Promise<CommittedCataloguedToConfirmedScientificProgression> {

    const stateBefore =
      await this.requireConfirmationState(
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
      CataloguedToConfirmedScientificProfile,

    persistedEvidence:
      ScientificEvidence | null,
  ): Promise<CommittedCataloguedToConfirmedScientificProgression> {

    const allEvidence =
      await this
        .evidenceRepository
        .getEvidence(
          generationKey,
          locator,
        );

    const assessment =
      CataloguedToConfirmedScientificProgressionEngine
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

    return new CommittedCataloguedToConfirmedScientificProgression(
      assessment.profileCode,
      allEvidence,
      assessment.cataloguedBaselineCompleteness,
      assessment.confirmationCompleteness,
      assessment.stateBefore,
      assessment.stateAfter,
      assessment.isEligible,
      assessment.didAdvance,
      persistedEvidence,
    );
  }

  private async requireConfirmationState(
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
      DiscoveryState.CATALOGUED.code
    ) {
      throw new RangeError(
        `Point 26.A.6 confirmation requires CATALOGUED or higher; current state: ${state.name}.`,
      );
    }

    return state;
  }
}
