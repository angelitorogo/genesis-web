import {
  InjectionToken,
} from '@angular/core';

import {
  ScientificEvidence,
} from '../../domain/discovery/scientific-evidence';

import {
  GalacticObjectLocator,
  type ProceduralLocator,
} from '../../domain/generation/procedural-locator';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  ObservationInstrumentLevel,
} from '../../domain/observation/observation-instrument-capability';

import {
  type ObservationProgressMilestone,
} from '../../domain/observation/observation-instrument-progression';

import {
  type DiscoveryPointsRepository,
  type DiscoveryRepository,
} from '../../domain/repository/genesis-repositories';

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
  DexieScientificEvidenceRepository,
} from '../../data/local/repository/dexie-scientific-evidence.repository';

import {
  RELATIVISTIC_JET_ANALYSIS_EVIDENCE_CODE,
  RELATIVISTIC_JET_ANALYSIS_EVIDENCE_DIMENSION,
  RELATIVISTIC_JET_ANALYSIS_INSTRUMENT,
  RelativisticJetAnalysisObservationEngine,
} from '../../simulation/observation/relativistic-jet-analysis-observation-engine';

import {
  ScientificEvidenceAcquisitionEngine,
} from '../../simulation/observation/scientific-evidence-acquisition-engine';

import {
  ProceduralTargetResolver,
} from '../../simulation/regeneration/procedural-target-resolver';

export interface RelativisticJetAnalysisObservationStatus {
  readonly analyzed:
    boolean;

  readonly canAnalyze:
    boolean;

  readonly instrumentLabel:
    string;

  readonly requirementLabel:
    string;

  readonly analyzedInstrumentLabel:
    string | null;

  readonly facts:
    readonly Readonly<{
      label:
        string;

      value:
        string;
    }>[];
}

export interface RelativisticJetAnalysisObservationRuntime {
  inspect(
    generationKey:
      UniverseGenerationKey,

    locator:
      GalacticObjectLocator,
  ): Promise<RelativisticJetAnalysisObservationStatus | null>;

  analyze(
    generationKey:
      UniverseGenerationKey,

    locator:
      GalacticObjectLocator,
  ): Promise<void>;
}

function existingJetAnalysisEvidence(
  evidence:
    readonly ScientificEvidence[],
): ScientificEvidence | null {

  return evidence
    .find(
      item =>
        item.dimensionCode ===
          RELATIVISTIC_JET_ANALYSIS_EVIDENCE_DIMENSION &&
        item.evidenceCode ===
          RELATIVISTIC_JET_ANALYSIS_EVIDENCE_CODE &&
        item.sourceKey ===
          `RELATIVISTIC_JET_RADIO:${RELATIVISTIC_JET_ANALYSIS_INSTRUMENT}` &&
        item.independenceKey ===
          'RELATIVISTIC_JET_RADIO_CAMPAIGN',
    ) ??
    null;
}

/**
 * 28.5 persisted radio jet-analysis campaign.
 *
 * The action is idempotent and only appends one ScientificEvidence row. It
 * does not spend/award PD or move DiscoveryState. Kinematic/model facts remain
 * hidden until that evidence exists.
 */
export class DexieRelativisticJetAnalysisObservationRuntime
  implements RelativisticJetAnalysisObservationRuntime {

  private readonly evidenceRepository:
    DexieScientificEvidenceRepository;

  constructor(
    private readonly database:
      GenesisIndexedDb,

    private readonly pointsRepository:
      DiscoveryPointsRepository,

    private readonly discoveryRepository:
      DiscoveryRepository,

    resolver:
      ProceduralTargetSeedResolver =
      TARGET_SEED_RESOLVER,
  ) {
    this.evidenceRepository =
      new DexieScientificEvidenceRepository(
        database,
        resolver,
      );
  }

  async inspect(
    generationKey:
      UniverseGenerationKey,

    locator:
      GalacticObjectLocator,
  ): Promise<RelativisticJetAnalysisObservationStatus | null> {

    const state =
      await this.discoveryRepository
        .getState(
          generationKey,
          locator,
        );

    const profile =
      RelativisticJetAnalysisObservationEngine
        .physicalProfileOrNull(
          generationKey,
          locator,
          state,
        );

    if (
      profile ===
        null
    ) {
      return null;
    }

    const [
      evidence,
      points,
      progression,
    ] =
      await Promise.all([
        this.evidenceRepository
          .getEvidence(
            generationKey,
            locator,
          ),
        this.pointsRepository
          .getGlobalDiscoveryPoints(
            generationKey,
          ),
        this.progressionContext(
          generationKey,
        ),
      ]);

    const analyzedEvidence =
      existingJetAnalysisEvidence(
        evidence,
      );

    const rule =
      RelativisticJetAnalysisObservationEngine
        .evidenceRule();

    const availability =
      progression.kind ===
        'milestones'
        ? ScientificEvidenceAcquisitionEngine
            .availabilityFromMilestones(
              generationKey,
              points,
              progression.milestones,
              rule,
              RELATIVISTIC_JET_ANALYSIS_INSTRUMENT,
              ObservationInstrumentLevel.LEVEL_4,
            )
        : ScientificEvidenceAcquisitionEngine
            .availability(
              generationKey,
              points,
              progression.known,
              rule,
              RELATIVISTIC_JET_ANALYSIS_INSTRUMENT,
              ObservationInstrumentLevel.LEVEL_4,
            );

    const analyzed =
      analyzedEvidence !==
      null;

    let requirementLabel:
      string;

    if (
      analyzed
    ) {
      requirementLabel =
        'Análisis radiointerferométrico persistido como evidencia científica.';
    } else if (
      availability.isAvailable
    ) {
      requirementLabel =
        'Disponible · análisis radiointerferométrico sin coste ni recompensa de PD.';
    } else {
      requirementLabel =
        `Requiere radio nivel 4: ${availability.missingGlobalDiscoveryPoints.toString(10)} PD de desbloqueo pendientes y ${availability.missingMilestones.length} hitos pendientes.`;
    }

    return Object.freeze({
      analyzed,
      canAnalyze:
        !analyzed &&
        availability.isAvailable,
      instrumentLabel:
        'Radio · nivel 4',
      requirementLabel,
      analyzedInstrumentLabel:
        analyzed
          ? 'Radio'
          : null,
      facts:
        analyzed
          ? RelativisticJetAnalysisObservationEngine
              .measurementFacts(
                profile,
              )
          : Object.freeze([]),
    });
  }

  async analyze(
    generationKey:
      UniverseGenerationKey,

    locator:
      GalacticObjectLocator,
  ): Promise<void> {

    await this.database
      .openDatabase();

    const state =
      await this.discoveryRepository
        .getState(
          generationKey,
          locator,
        );

    if (
      RelativisticJetAnalysisObservationEngine
        .physicalProfileOrNull(
          generationKey,
          locator,
          state,
        ) ===
      null
    ) {
      throw new RangeError(
        '28.5 requiere una fuente confirmada con contexto físico de jet relativista.',
      );
    }

    const existing =
      await this.evidenceRepository
        .getEvidence(
          generationKey,
          locator,
        );

    if (
      existingJetAnalysisEvidence(
        existing,
      ) !==
      null
    ) {
      return;
    }

    const [
      points,
      progression,
    ] =
      await Promise.all([
        this.pointsRepository
          .getGlobalDiscoveryPoints(
            generationKey,
          ),
        this.progressionContext(
          generationKey,
        ),
      ]);

    const rule =
      RelativisticJetAnalysisObservationEngine
        .evidenceRule();

    const availability =
      progression.kind ===
        'milestones'
        ? ScientificEvidenceAcquisitionEngine
            .availabilityFromMilestones(
              generationKey,
              points,
              progression.milestones,
              rule,
              RELATIVISTIC_JET_ANALYSIS_INSTRUMENT,
              ObservationInstrumentLevel.LEVEL_4,
            )
        : ScientificEvidenceAcquisitionEngine
            .availability(
              generationKey,
              points,
              progression.known,
              rule,
              RELATIVISTIC_JET_ANALYSIS_INSTRUMENT,
              ObservationInstrumentLevel.LEVEL_4,
            );

    if (
      !availability.isAvailable
    ) {
      throw new RangeError(
        '28.5 requiere radio desbloqueada en nivel 4.',
      );
    }

    const acquired =
      progression.kind ===
        'milestones'
        ? ScientificEvidenceAcquisitionEngine
            .acquireFromMilestones(
              generationKey,
              points,
              progression.milestones,
              rule,
              RELATIVISTIC_JET_ANALYSIS_INSTRUMENT,
              ObservationInstrumentLevel.LEVEL_4,
              Date.now(),
            )
        : ScientificEvidenceAcquisitionEngine
            .acquire(
              generationKey,
              points,
              progression.known,
              rule,
              RELATIVISTIC_JET_ANALYSIS_INSTRUMENT,
              ObservationInstrumentLevel.LEVEL_4,
              Date.now(),
            );

    await this.evidenceRepository
      .recordEvidence(
        generationKey,
        locator,
        acquired.evidence,
      );
  }

  private async progressionContext(
    generationKey:
      UniverseGenerationKey,
  ): Promise<
    | {
        readonly kind:
          'milestones';

        readonly milestones:
          readonly ObservationProgressMilestone[];
      }
    | {
        readonly kind:
          'known';

        readonly known:
          Awaited<ReturnType<DiscoveryRepository['getKnownDiscoveries']>>;
      }
  > {

    const fast =
      this.discoveryRepository
        .getObservationProgressMilestones;

    if (
      fast !==
        undefined
    ) {
      return Object.freeze({
        kind:
          'milestones' as const,
        milestones:
          await fast.call(
            this.discoveryRepository,
            generationKey,
          ),
      });
    }

    return Object.freeze({
      kind:
        'known' as const,
      known:
        await this.discoveryRepository
          .getKnownDiscoveries(
            generationKey,
          ),
    });
  }
}

const TARGET_SEED_RESOLVER:
  ProceduralTargetSeedResolver =
  Object.freeze({
    resolveTargetSeedNormalized(
      key:
        UniverseGenerationKey,

      locator:
        ProceduralLocator,
    ): string {

      return ProceduralTargetResolver
        .resolveTargetSeed(
          key,
          locator,
        )
        .normalizedValue;
    },
  });

export const RELATIVISTIC_JET_ANALYSIS_OBSERVATION_RUNTIME =
  new InjectionToken<RelativisticJetAnalysisObservationRuntime>(
    'RELATIVISTIC_JET_ANALYSIS_OBSERVATION_RUNTIME',
    {
      providedIn:
        'root',
      factory:
        () => {
          const database =
            new GenesisIndexedDb();

          return new DexieRelativisticJetAnalysisObservationRuntime(
            database,
            new DexieDiscoveryPointsRepository(
              database,
            ),
            new DexieDiscoveryRepository(
              database,
              TARGET_SEED_RESOLVER,
            ),
          );
        },
    },
  );
