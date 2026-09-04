import {
  DiscoveryState,
  type DiscoveryStateValue,
} from '../../domain/discovery/discovery-state';

import {
  type ScientificCompleteness,
} from '../../domain/discovery/scientific-completeness';

import {
  type DetectedToDiscoveredScientificProfile,
} from '../../domain/discovery/detected-to-discovered-scientific-profile';

import {
  type ScientificEvidence,
} from '../../domain/discovery/scientific-evidence';

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
  DetectedToDiscoveredScientificProgressionEngine,
} from '../../simulation/exploration/detected-to-discovered-scientific-progression-engine';

/**
 * Atomic point-26.A.3 outcome after one scientific observation/evidence record.
 *
 * There is deliberately no PD field: Discovery Points are global researcher
 * progression and cannot be spent to buy this object-level state transition.
 */
export class CommittedDetectedToDiscoveredScientificProgression {

  readonly evidence:
    readonly ScientificEvidence[];

  constructor(
    readonly persistedEvidence:
      ScientificEvidence,

    evidence:
      readonly ScientificEvidence[],

    readonly completeness:
      ScientificCompleteness,

    readonly stateBefore:
      DiscoveryStateValue,

    readonly stateAfter:
      DiscoveryStateValue,

    readonly didAdvance:
      boolean,
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

export interface DetectedToDiscoveredScientificProgressionRuntime {
  recordEvidence(
    generationKey:
      UniverseGenerationKey,

    locator:
      ProceduralLocator,

    evidence:
      ScientificEvidence,

    profile:
      DetectedToDiscoveredScientificProfile,
  ): Promise<CommittedDetectedToDiscoveredScientificProgression>;
}

/**
 * Point-26.A.3 persistence orchestration.
 *
 * The transaction contains only:
 * - the universe existence boundary;
 * - observed scientific evidence (observations store);
 * - the authoritative DiscoveryState (discoveries store).
 *
 * It intentionally excludes the progress store, so this transition cannot
 * spend or otherwise mutate Discovery Points. PD/instrument/hit integration is
 * deferred to point 26.A.8 as required by the official roadmap.
 */
export class DexieDetectedToDiscoveredScientificProgressionRuntime
  implements DetectedToDiscoveredScientificProgressionRuntime {

  constructor(
    private readonly database:
      GenesisIndexedDb,

    private readonly discoveryRepository:
      DiscoveryRepository,

    private readonly evidenceRepository:
      ScientificEvidenceRepository,
  ) {}

  async recordEvidence(
    generationKey:
      UniverseGenerationKey,

    locator:
      ProceduralLocator,

    evidence:
      ScientificEvidence,

    profile:
      DetectedToDiscoveredScientificProfile,
  ): Promise<CommittedDetectedToDiscoveredScientificProgression> {

    await this.database
      .openDatabase();

    return this.database
      .transaction(
        'rw',
        this.database.universes,
        this.database.discoveries,
        this.database.observations,
        async () =>
          this.recordInsideTransaction(
            generationKey,
            locator,
            evidence,
            profile,
          ),
      );
  }

  private async recordInsideTransaction(
    generationKey:
      UniverseGenerationKey,

    locator:
      ProceduralLocator,

    evidence:
      ScientificEvidence,

    profile:
      DetectedToDiscoveredScientificProfile,
  ): Promise<CommittedDetectedToDiscoveredScientificProgression> {

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

    if (
      stateBefore.code <
      DiscoveryState.DETECTED.code
    ) {
      throw new RangeError(
        'Point 26.A.3 scientific evidence requires a persisted target at DiscoveryState.DETECTED or higher.',
      );
    }

    const persistedEvidence =
      await this
        .evidenceRepository
        .recordEvidence(
          generationKey,
          locator,
          evidence,
        );

    const allEvidence =
      await this
        .evidenceRepository
        .getEvidence(
          generationKey,
          locator,
        );

    const assessment =
      DetectedToDiscoveredScientificProgressionEngine
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

    return new CommittedDetectedToDiscoveredScientificProgression(
      persistedEvidence,
      allEvidence,
      assessment.completeness,
      assessment.stateBefore,
      assessment.stateAfter,
      assessment.didAdvance,
    );
  }
}
