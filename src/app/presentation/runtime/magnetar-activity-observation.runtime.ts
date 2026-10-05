import { InjectionToken } from '@angular/core';

import { ScientificEvidence } from '../../domain/discovery/scientific-evidence';
import { GalacticObjectLocator, type ProceduralLocator } from '../../domain/generation/procedural-locator';
import { type UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { ObservationInstrumentType } from '../../domain/observation/observation-instrument';
import { ObservationInstrumentLevel } from '../../domain/observation/observation-instrument-capability';
import { type ObservationProgressMilestone } from '../../domain/observation/observation-instrument-progression';
import { type DiscoveryPointsRepository, type DiscoveryRepository } from '../../domain/repository/genesis-repositories';
import { GenesisIndexedDb } from '../../data/local/indexed-db/genesis-indexed-db';
import { DexieDiscoveryPointsRepository } from '../../data/local/repository/dexie-discovery-points.repository';
import { DexieDiscoveryRepository, type ProceduralTargetSeedResolver } from '../../data/local/repository/dexie-discovery.repository';
import { DexieScientificEvidenceRepository } from '../../data/local/repository/dexie-scientific-evidence.repository';
import {
  MAGNETAR_ACTIVITY_EVIDENCE_CODE,
  MAGNETAR_ACTIVITY_EVIDENCE_DIMENSION,
  MAGNETAR_ACTIVITY_OBSERVATION_INSTRUMENTS,
  MagnetarActivityObservationEngine,
} from '../../simulation/observation/magnetar-activity-observation-engine';
import {
  PULSAR_TIMING_EVIDENCE_CODE,
  PULSAR_TIMING_EVIDENCE_DIMENSION,
} from '../../simulation/observation/pulsar-timing-observation-engine';
import { ScientificEvidenceAcquisitionEngine } from '../../simulation/observation/scientific-evidence-acquisition-engine';
import { ProceduralTargetResolver } from '../../simulation/regeneration/procedural-target-resolver';

export interface MagnetarActivityObservationStatus {
  readonly measured: boolean;
  readonly canMeasure: boolean;
  readonly timingSynchronized: boolean;
  readonly instrumentLabel: string;
  readonly requirementLabel: string;
  readonly measuredInstrumentLabel: string | null;
  readonly facts: readonly Readonly<{ label: string; value: string }>[];
}

export interface MagnetarActivityObservationRuntime {
  inspect(
    generationKey: UniverseGenerationKey,
    locator: GalacticObjectLocator,
  ): Promise<MagnetarActivityObservationStatus | null>;

  measure(
    generationKey: UniverseGenerationKey,
    locator: GalacticObjectLocator,
  ): Promise<void>;
}

function instrumentLabel(instrumentType: ObservationInstrumentType): string {
  return instrumentType === ObservationInstrumentType.X_RAY ? 'Rayos X' : 'Rayos gamma';
}

function hasPulseTimingEvidence(evidence: readonly ScientificEvidence[]): boolean {
  return evidence.some(item =>
    item.dimensionCode === PULSAR_TIMING_EVIDENCE_DIMENSION &&
    item.evidenceCode === PULSAR_TIMING_EVIDENCE_CODE,
  );
}

function existingMagnetarEvidence(evidence: readonly ScientificEvidence[]): ScientificEvidence | null {
  return evidence.find(item =>
    item.dimensionCode === MAGNETAR_ACTIVITY_EVIDENCE_DIMENSION &&
    item.evidenceCode === MAGNETAR_ACTIVITY_EVIDENCE_CODE &&
    MAGNETAR_ACTIVITY_OBSERVATION_INSTRUMENTS.some(type =>
      item.sourceKey === `MAGNETAR_ACTIVITY_${type}:${type}` &&
      item.independenceKey === `MAGNETAR_ACTIVITY_${type}_CAMPAIGN`,
    ),
  ) ?? null;
}

/**
 * 28.4 persisted magnetic-activity campaign. It requires the 28.3 timing
 * evidence first, then adds one idempotent X/gamma monitoring evidence row.
 * No schema change, PD reward/cost or DiscoveryState transition is performed.
 */
export class DexieMagnetarActivityObservationRuntime implements MagnetarActivityObservationRuntime {
  private readonly evidenceRepository: DexieScientificEvidenceRepository;

  constructor(
    private readonly database: GenesisIndexedDb,
    private readonly pointsRepository: DiscoveryPointsRepository,
    private readonly discoveryRepository: DiscoveryRepository,
    resolver: ProceduralTargetSeedResolver = TARGET_SEED_RESOLVER,
  ) {
    this.evidenceRepository = new DexieScientificEvidenceRepository(database, resolver);
  }

  async inspect(
    generationKey: UniverseGenerationKey,
    locator: GalacticObjectLocator,
  ): Promise<MagnetarActivityObservationStatus | null> {
    const state = await this.discoveryRepository.getState(generationKey, locator);
    const profile = MagnetarActivityObservationEngine.physicalProfileOrNull(
      generationKey,
      locator,
      state,
    );
    if (profile === null) return null;

    const [evidence, points, progression] = await Promise.all([
      this.evidenceRepository.getEvidence(generationKey, locator),
      this.pointsRepository.getGlobalDiscoveryPoints(generationKey),
      this.progressionContext(generationKey),
    ]);

    const timingSynchronized = hasPulseTimingEvidence(evidence);
    const measuredEvidence = existingMagnetarEvidence(evidence);
    const choices = MAGNETAR_ACTIVITY_OBSERVATION_INSTRUMENTS.map(type => ({
      type,
      availability: progression.kind === 'milestones'
        ? ScientificEvidenceAcquisitionEngine.availabilityFromMilestones(
            generationKey,
            points,
            progression.milestones,
            MagnetarActivityObservationEngine.evidenceRule(type),
            type,
            ObservationInstrumentLevel.LEVEL_4,
          )
        : ScientificEvidenceAcquisitionEngine.availability(
            generationKey,
            points,
            progression.known,
            MagnetarActivityObservationEngine.evidenceRule(type),
            type,
            ObservationInstrumentLevel.LEVEL_4,
          ),
    }));
    const chosen = choices.find(choice => choice.availability.isAvailable);
    const nearest = choices.reduce((a, b) =>
      a.availability.missingMilestones.length < b.availability.missingMilestones.length ? a :
      a.availability.missingMilestones.length > b.availability.missingMilestones.length ? b :
      a.availability.missingGlobalDiscoveryPoints <= b.availability.missingGlobalDiscoveryPoints ? a : b,
    );
    const observedType = MAGNETAR_ACTIVITY_OBSERVATION_INSTRUMENTS.find(type =>
      measuredEvidence?.sourceKey === `MAGNETAR_ACTIVITY_${type}:${type}`,
    );

    let requirementLabel: string;
    if (measuredEvidence !== null) {
      requirementLabel = 'Campo dipolar y actividad de estallidos persistidos como evidencia científica.';
    } else if (!timingSynchronized) {
      requirementLabel = 'Requiere completar primero 28.3 · Sincronizar / medir pulsos para disponer de P antes de inferir Ṗ y el campo dipolar.';
    } else if (chosen === undefined) {
      requirementLabel = `Requiere rayos X o rayos gamma nivel 4: ${nearest.availability.missingGlobalDiscoveryPoints.toString(10)} PD de desbloqueo pendientes y ${nearest.availability.missingMilestones.length} hitos pendientes.`;
    } else {
      requirementLabel = 'Disponible · campaña de alta energía sin coste ni recompensa de PD.';
    }

    return Object.freeze({
      measured: measuredEvidence !== null,
      canMeasure: measuredEvidence === null && timingSynchronized && chosen !== undefined,
      timingSynchronized,
      instrumentLabel: chosen === undefined
        ? 'Rayos X o rayos gamma · nivel 4'
        : `${instrumentLabel(chosen.type)} · nivel 4`,
      requirementLabel,
      measuredInstrumentLabel: observedType === undefined ? null : instrumentLabel(observedType),
      facts: measuredEvidence === null
        ? Object.freeze([])
        : MagnetarActivityObservationEngine.measurementFacts(profile),
    });
  }

  async measure(
    generationKey: UniverseGenerationKey,
    locator: GalacticObjectLocator,
  ): Promise<void> {
    await this.database.openDatabase();

    const state = await this.discoveryRepository.getState(generationKey, locator);
    if (MagnetarActivityObservationEngine.physicalProfileOrNull(generationKey, locator, state) === null) {
      throw new RangeError('28.4 requiere un magnetar confirmado.');
    }

    const existing = await this.evidenceRepository.getEvidence(generationKey, locator);
    if (existingMagnetarEvidence(existing) !== null) return;
    if (!hasPulseTimingEvidence(existing)) {
      throw new RangeError('28.4 requiere completar primero la temporización de pulsos de 28.3.');
    }

    const [points, progression] = await Promise.all([
      this.pointsRepository.getGlobalDiscoveryPoints(generationKey),
      this.progressionContext(generationKey),
    ]);
    const selected = MAGNETAR_ACTIVITY_OBSERVATION_INSTRUMENTS.find(type => {
      const rule = MagnetarActivityObservationEngine.evidenceRule(type);
      return progression.kind === 'milestones'
        ? ScientificEvidenceAcquisitionEngine.availabilityFromMilestones(
            generationKey, points, progression.milestones, rule,
            type, ObservationInstrumentLevel.LEVEL_4,
          ).isAvailable
        : ScientificEvidenceAcquisitionEngine.availability(
            generationKey, points, progression.known, rule,
            type, ObservationInstrumentLevel.LEVEL_4,
          ).isAvailable;
    });
    if (selected === undefined) {
      throw new RangeError('28.4 requiere rayos X o rayos gamma desbloqueados en nivel 4.');
    }

    const rule = MagnetarActivityObservationEngine.evidenceRule(selected);
    const acquired = progression.kind === 'milestones'
      ? ScientificEvidenceAcquisitionEngine.acquireFromMilestones(
          generationKey, points, progression.milestones, rule,
          selected, ObservationInstrumentLevel.LEVEL_4, Date.now(),
        )
      : ScientificEvidenceAcquisitionEngine.acquire(
          generationKey, points, progression.known, rule,
          selected, ObservationInstrumentLevel.LEVEL_4, Date.now(),
        );

    await this.evidenceRepository.recordEvidence(generationKey, locator, acquired.evidence);
  }

  private async progressionContext(
    generationKey: UniverseGenerationKey,
  ): Promise<
    | { readonly kind: 'milestones'; readonly milestones: readonly ObservationProgressMilestone[] }
    | { readonly kind: 'known'; readonly known: Awaited<ReturnType<DiscoveryRepository['getKnownDiscoveries']>> }
  > {
    const fast = this.discoveryRepository.getObservationProgressMilestones;
    if (fast !== undefined) {
      return Object.freeze({
        kind: 'milestones' as const,
        milestones: await fast.call(this.discoveryRepository, generationKey),
      });
    }
    return Object.freeze({
      kind: 'known' as const,
      known: await this.discoveryRepository.getKnownDiscoveries(generationKey),
    });
  }
}

const TARGET_SEED_RESOLVER: ProceduralTargetSeedResolver = Object.freeze({
  resolveTargetSeedNormalized(key: UniverseGenerationKey, locator: ProceduralLocator): string {
    return ProceduralTargetResolver.resolveTargetSeed(key, locator).normalizedValue;
  },
});

export const MAGNETAR_ACTIVITY_OBSERVATION_RUNTIME = new InjectionToken<MagnetarActivityObservationRuntime>(
  'MAGNETAR_ACTIVITY_OBSERVATION_RUNTIME',
  {
    providedIn: 'root',
    factory: () => {
      const db = new GenesisIndexedDb();
      return new DexieMagnetarActivityObservationRuntime(
        db,
        new DexieDiscoveryPointsRepository(db),
        new DexieDiscoveryRepository(db, TARGET_SEED_RESOLVER),
      );
    },
  },
);
