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
  PULSAR_TIMING_EVIDENCE_CODE,
  PULSAR_TIMING_EVIDENCE_DIMENSION,
  PULSAR_TIMING_OBSERVATION_INSTRUMENTS,
  PulsarTimingObservationEngine,
} from '../../simulation/observation/pulsar-timing-observation-engine';
import { ScientificEvidenceAcquisitionEngine } from '../../simulation/observation/scientific-evidence-acquisition-engine';
import { ProceduralTargetResolver } from '../../simulation/regeneration/procedural-target-resolver';

export interface PulsarTimingObservationStatus {
  readonly measured: boolean;
  readonly canMeasure: boolean;
  readonly instrumentLabel: string;
  readonly requirementLabel: string;
  readonly measuredInstrumentLabel: string | null;
  readonly facts: readonly Readonly<{ label: string; value: string }>[];
}

export interface PulsarTimingObservationRuntime {
  inspect(
    generationKey: UniverseGenerationKey,
    locator: GalacticObjectLocator,
  ): Promise<PulsarTimingObservationStatus | null>;

  measure(
    generationKey: UniverseGenerationKey,
    locator: GalacticObjectLocator,
  ): Promise<void>;
}

function instrumentLabel(instrumentType: ObservationInstrumentType): string {
  return instrumentType === ObservationInstrumentType.RADIO ? 'Radio' : 'Rayos X';
}

function existingTimingEvidence(evidence: readonly ScientificEvidence[]): ScientificEvidence | null {
  return evidence.find(item =>
    item.dimensionCode === PULSAR_TIMING_EVIDENCE_DIMENSION &&
    item.evidenceCode === PULSAR_TIMING_EVIDENCE_CODE &&
    PULSAR_TIMING_OBSERVATION_INSTRUMENTS.some(type =>
      item.sourceKey === `PULSAR_TIMING_${type}:${type}` &&
      item.independenceKey === `PULSAR_TIMING_${type}_CAMPAIGN`,
    ),
  ) ?? null;
}

/**
 * 28.3 persisted pulse-timing action. No schema change, no PD reward and no
 * discovery-state transition: the action adds observed evidence to an already
 * CONFIRMED pulse-timing-capable extreme object.
 */
export class DexiePulsarTimingObservationRuntime implements PulsarTimingObservationRuntime {
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
  ): Promise<PulsarTimingObservationStatus | null> {
    const state = await this.discoveryRepository.getState(generationKey, locator);
    const profile = PulsarTimingObservationEngine.physicalProfileOrNull(
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

    const measuredEvidence = existingTimingEvidence(evidence);
    const choices = PULSAR_TIMING_OBSERVATION_INSTRUMENTS.map(type => ({
      type,
      availability: progression.kind === 'milestones'
        ? ScientificEvidenceAcquisitionEngine.availabilityFromMilestones(
            generationKey,
            points,
            progression.milestones,
            PulsarTimingObservationEngine.evidenceRule(type),
            type,
            ObservationInstrumentLevel.LEVEL_4,
          )
        : ScientificEvidenceAcquisitionEngine.availability(
            generationKey,
            points,
            progression.known,
            PulsarTimingObservationEngine.evidenceRule(type),
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
    const observedType = PULSAR_TIMING_OBSERVATION_INSTRUMENTS.find(type =>
      measuredEvidence?.sourceKey === `PULSAR_TIMING_${type}:${type}`,
    );

    return Object.freeze({
      measured: measuredEvidence !== null,
      canMeasure: measuredEvidence === null && chosen !== undefined,
      instrumentLabel: chosen === undefined
        ? 'Radio o rayos X · nivel 4'
        : `${instrumentLabel(chosen.type)} · nivel 4`,
      requirementLabel: chosen === undefined
        ? `Requiere instrumento nivel 4: ${nearest.availability.missingGlobalDiscoveryPoints.toString(10)} PD de desbloqueo pendientes y ${nearest.availability.missingMilestones.length} hitos pendientes.`
        : measuredEvidence === null
          ? 'Disponible · campaña temporal sin coste ni recompensa de PD.'
          : 'Sincronización completada y persistida como evidencia científica.',
      measuredInstrumentLabel: observedType === undefined ? null : instrumentLabel(observedType),
      facts: measuredEvidence === null
        ? Object.freeze([])
        : PulsarTimingObservationEngine.measurementFacts(profile),
    });
  }

  async measure(
    generationKey: UniverseGenerationKey,
    locator: GalacticObjectLocator,
  ): Promise<void> {
    await this.database.openDatabase();

    // 28.3 deliberately avoids a long-lived multi-store Dexie transaction.
    // This action neither spends/awards PD nor changes DiscoveryState: it only
    // appends one idempotent scientific-evidence row whose storage id is
    // deterministic. Keeping the procedural/profile and instrument-availability
    // reads outside a transaction prevents Dexie from committing while an
    // unrelated async boundary is pending (PrematureCommitError in
    // FakeIndexedDB and, potentially, some browser transaction schedulers).
    const state = await this.discoveryRepository.getState(generationKey, locator);
    if (PulsarTimingObservationEngine.physicalProfileOrNull(generationKey, locator, state) === null) {
      throw new RangeError('28.3 requiere un extremo confirmado con capacidad física de temporización de pulsos.');
    }

    const existing = await this.evidenceRepository.getEvidence(generationKey, locator);
    if (existingTimingEvidence(existing) !== null) return;

    const [points, progression] = await Promise.all([
      this.pointsRepository.getGlobalDiscoveryPoints(generationKey),
      this.progressionContext(generationKey),
    ]);
    const selected = PULSAR_TIMING_OBSERVATION_INSTRUMENTS.find(type => {
      const rule = PulsarTimingObservationEngine.evidenceRule(type);
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
      throw new RangeError('28.3 requiere radio o rayos X desbloqueados en nivel 4.');
    }

    const rule = PulsarTimingObservationEngine.evidenceRule(selected);
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

export const PULSAR_TIMING_OBSERVATION_RUNTIME = new InjectionToken<PulsarTimingObservationRuntime>(
  'PULSAR_TIMING_OBSERVATION_RUNTIME',
  {
    providedIn: 'root',
    factory: () => {
      const db = new GenesisIndexedDb();
      return new DexiePulsarTimingObservationRuntime(
        db,
        new DexieDiscoveryPointsRepository(db),
        new DexieDiscoveryRepository(db, TARGET_SEED_RESOLVER),
      );
    },
  },
);
