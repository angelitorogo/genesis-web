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
  GRAVITATIONAL_LENSING_RECONSTRUCTION_EVIDENCE_CODE,
  GRAVITATIONAL_LENSING_RECONSTRUCTION_EVIDENCE_DIMENSION,
  GRAVITATIONAL_LENSING_RECONSTRUCTION_INSTRUMENT,
  GravitationalLensingReconstructionObservationEngine,
} from '../../simulation/observation/gravitational-lensing-reconstruction-observation-engine';

import {
  ScientificEvidenceAcquisitionEngine,
} from '../../simulation/observation/scientific-evidence-acquisition-engine';

import {
  ProceduralTargetResolver,
} from '../../simulation/regeneration/procedural-target-resolver';

export interface GravitationalLensingReconstructionObservationStatus {
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

export interface GravitationalLensingReconstructionObservationRuntime {
  inspect(
    generationKey:
      UniverseGenerationKey,

    locator:
      GalacticObjectLocator,
  ): Promise<GravitationalLensingReconstructionObservationStatus | null>;

  analyze(
    generationKey:
      UniverseGenerationKey,

    locator:
      GalacticObjectLocator,
  ): Promise<void>;
}

function existingLensingEvidence(
  evidence:
    readonly ScientificEvidence[],
): ScientificEvidence | null {

  return evidence
    .find(
      item =>
        item.dimensionCode ===
          GRAVITATIONAL_LENSING_RECONSTRUCTION_EVIDENCE_DIMENSION &&
        item.evidenceCode ===
          GRAVITATIONAL_LENSING_RECONSTRUCTION_EVIDENCE_CODE &&
        item.sourceKey ===
          `GRAVITATIONAL_LENSING_OPTICAL:${GRAVITATIONAL_LENSING_RECONSTRUCTION_INSTRUMENT}` &&
        item.independenceKey ===
          'GRAVITATIONAL_LENSING_RECONSTRUCTION_CAMPAIGN',
    ) ??
    null;
}

/**
 * 28.6 persisted high-resolution gravitational-lensing campaign.
 *
 * One evidence row stores completion of the campaign. The deterministic
 * physical reconstruction is re-derived from canonical target physics when
 * rendering the archive; no renderer state, PD or DiscoveryState is mutated.
 */
export class DexieGravitationalLensingReconstructionObservationRuntime
  implements GravitationalLensingReconstructionObservationRuntime {

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
  ): Promise<GravitationalLensingReconstructionObservationStatus | null> {

    const state =
      await this.discoveryRepository
        .getState(
          generationKey,
          locator,
        );

    const profile =
      GravitationalLensingReconstructionObservationEngine
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
      existingLensingEvidence(
        evidence,
      );

    const rule =
      GravitationalLensingReconstructionObservationEngine
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
              GRAVITATIONAL_LENSING_RECONSTRUCTION_INSTRUMENT,
              ObservationInstrumentLevel.LEVEL_5,
            )
        : ScientificEvidenceAcquisitionEngine
            .availability(
              generationKey,
              points,
              progression.known,
              rule,
              GRAVITATIONAL_LENSING_RECONSTRUCTION_INSTRUMENT,
              ObservationInstrumentLevel.LEVEL_5,
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
        'Reconstrucción de lente persistida como evidencia científica.';
    } else if (
      availability.isAvailable
    ) {
      requirementLabel =
        'Disponible · imagen astrométrica de alta resolución sin coste ni recompensa de PD.';
    } else {
      requirementLabel =
        `Requiere óptica nivel 5: ${availability.missingGlobalDiscoveryPoints.toString(10)} PD de desbloqueo pendientes y ${availability.missingMilestones.length} hitos pendientes.`;
    }

    return Object.freeze({
      analyzed,
      canAnalyze:
        !analyzed &&
        availability.isAvailable,
      instrumentLabel:
        'Óptica · nivel 5',
      requirementLabel,
      analyzedInstrumentLabel:
        analyzed
          ? 'Óptica'
          : null,
      facts:
        analyzed
          ? GravitationalLensingReconstructionObservationEngine
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
      GravitationalLensingReconstructionObservationEngine
        .physicalProfileOrNull(
          generationKey,
          locator,
          state,
        ) ===
      null
    ) {
      throw new RangeError(
        '28.6 requiere una lente compacta confirmada con masa científica canónica.',
      );
    }

    const existing =
      await this.evidenceRepository
        .getEvidence(
          generationKey,
          locator,
        );

    if (
      existingLensingEvidence(
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
      GravitationalLensingReconstructionObservationEngine
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
              GRAVITATIONAL_LENSING_RECONSTRUCTION_INSTRUMENT,
              ObservationInstrumentLevel.LEVEL_5,
            )
        : ScientificEvidenceAcquisitionEngine
            .availability(
              generationKey,
              points,
              progression.known,
              rule,
              GRAVITATIONAL_LENSING_RECONSTRUCTION_INSTRUMENT,
              ObservationInstrumentLevel.LEVEL_5,
            );

    if (
      !availability.isAvailable
    ) {
      throw new RangeError(
        '28.6 requiere óptica desbloqueada en nivel 5.',
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
              GRAVITATIONAL_LENSING_RECONSTRUCTION_INSTRUMENT,
              ObservationInstrumentLevel.LEVEL_5,
              Date.now(),
            )
        : ScientificEvidenceAcquisitionEngine
            .acquire(
              generationKey,
              points,
              progression.known,
              rule,
              GRAVITATIONAL_LENSING_RECONSTRUCTION_INSTRUMENT,
              ObservationInstrumentLevel.LEVEL_5,
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

export const GRAVITATIONAL_LENSING_RECONSTRUCTION_OBSERVATION_RUNTIME =
  new InjectionToken<GravitationalLensingReconstructionObservationRuntime>(
    'GRAVITATIONAL_LENSING_RECONSTRUCTION_OBSERVATION_RUNTIME',
    {
      providedIn:
        'root',
      factory:
        () => {
          const database =
            new GenesisIndexedDb();

          return new DexieGravitationalLensingReconstructionObservationRuntime(
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
