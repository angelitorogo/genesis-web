import { InjectionToken } from '@angular/core';
import { DiscoveryState } from '../../domain/discovery/discovery-state';
import { ScientificEvidence } from '../../domain/discovery/scientific-evidence';
import { GalaxyLocator, type ProceduralLocator } from '../../domain/generation/procedural-locator';
import { type UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { ObservationInstrumentType } from '../../domain/observation/observation-instrument';
import { ObservationInstrumentLevel } from '../../domain/observation/observation-instrument-capability';
import { type DiscoveryPointsRepository, type DiscoveryRepository } from '../../domain/repository/genesis-repositories';
import { GenesisIndexedDb } from '../../data/local/indexed-db/genesis-indexed-db';
import { DexieScientificEvidenceRepository } from '../../data/local/repository/dexie-scientific-evidence.repository';
import { DexieDiscoveryPointsRepository } from '../../data/local/repository/dexie-discovery-points.repository';
import { DexieDiscoveryRepository, type ProceduralTargetSeedResolver } from '../../data/local/repository/dexie-discovery.repository';
import {
  ACCRETION_DISK_EVIDENCE_CODE, ACCRETION_DISK_EVIDENCE_DIMENSION,
  ACCRETION_DISK_OBSERVATION_INSTRUMENTS, AccretionDiskObservationEngine,
} from '../../simulation/observation/accretion-disk-observation-engine';
import { ScientificEvidenceAcquisitionEngine } from '../../simulation/observation/scientific-evidence-acquisition-engine';
import { ProceduralTargetResolver } from '../../simulation/regeneration/procedural-target-resolver';

export interface AccretionDiskObservationStatus {
  readonly observed: boolean;
  readonly canObserve: boolean;
  readonly instrumentLabel: string;
  readonly requirementLabel: string;
  readonly observedInstrumentLabel: string | null;
  readonly modelFacts: readonly Readonly<{ label: string; value: string }>[];
}

export interface AccretionDiskObservationRuntime {
  /** Null means no confirmed physical disk, including all quiescent nuclei. */
  inspect(generationKey: UniverseGenerationKey, galaxyIndex: bigint): Promise<AccretionDiskObservationStatus | null>;
  observe(generationKey: UniverseGenerationKey, galaxyIndex: bigint): Promise<void>;
}

function instrumentLabel(instrumentType: ObservationInstrumentType): string {
  return instrumentType === ObservationInstrumentType.X_RAY ? 'Rayos X' : 'Espectroscopia';
}

function existingDiskEvidence(evidence: readonly ScientificEvidence[]): ScientificEvidence | null {
  return evidence.find(item =>
    item.dimensionCode === ACCRETION_DISK_EVIDENCE_DIMENSION &&
    item.evidenceCode === ACCRETION_DISK_EVIDENCE_CODE &&
    ACCRETION_DISK_OBSERVATION_INSTRUMENTS.some(type => item.sourceKey === `ACCRETION_DISK_${type}:${type}` &&
      item.independenceKey === `ACCRETION_DISK_${type}_CAMPAIGN`),
  ) ?? null;
}

/** No schema changes, no PD awards and no discovery-state transitions. */
export class DexieAccretionDiskObservationRuntime implements AccretionDiskObservationRuntime {
  private readonly evidenceRepository: DexieScientificEvidenceRepository;

  constructor(
    private readonly database: GenesisIndexedDb,
    private readonly pointsRepository: DiscoveryPointsRepository,
    private readonly discoveryRepository: DiscoveryRepository,
    resolver: ProceduralTargetSeedResolver = TARGET_SEED_RESOLVER,
  ) {
    this.evidenceRepository = new DexieScientificEvidenceRepository(database, resolver);
  }

  async inspect(generationKey: UniverseGenerationKey, galaxyIndex: bigint): Promise<AccretionDiskObservationStatus | null> {
    const locator = new GalaxyLocator(galaxyIndex);
    const state = await this.discoveryRepository.getState(generationKey, locator);
    // No intrinsic physics regeneration before a persisted confirmed galaxy.
    const disk = AccretionDiskObservationEngine.physicalDiskOrNull(generationKey, galaxyIndex, state);
    if (disk === null) return null;
    const [evidence, points, known] = await Promise.all([
      this.evidenceRepository.getEvidence(generationKey, locator),
      this.pointsRepository.getGlobalDiscoveryPoints(generationKey),
      this.discoveryRepository.getKnownDiscoveries(generationKey),
    ]);
    const observedEvidence = existingDiskEvidence(evidence);
    const choices = ACCRETION_DISK_OBSERVATION_INSTRUMENTS.map(type => ({
      type,
      availability: ScientificEvidenceAcquisitionEngine.availability(
        generationKey, points, known, AccretionDiskObservationEngine.evidenceRule(type),
        type, ObservationInstrumentLevel.LEVEL_3,
      ),
    }));
    const chosen = choices.find(choice => choice.availability.isAvailable);
    const nearest = choices.reduce((a, b) =>
      a.availability.missingMilestones.length < b.availability.missingMilestones.length ? a :
      a.availability.missingMilestones.length > b.availability.missingMilestones.length ? b :
      a.availability.missingGlobalDiscoveryPoints <= b.availability.missingGlobalDiscoveryPoints ? a : b,
    );
    const observedType = ACCRETION_DISK_OBSERVATION_INSTRUMENTS.find(
      type => observedEvidence?.sourceKey === `ACCRETION_DISK_${type}:${type}`,
    );
    return Object.freeze({
      observed: observedEvidence !== null,
      canObserve: observedEvidence === null && chosen !== undefined,
      instrumentLabel: chosen === undefined ? 'Espectroscopia o rayos X (nivel 3)' : `${instrumentLabel(chosen.type)} · nivel 3`,
      requirementLabel: chosen === undefined
        ? `Requiere instrumento nivel 3: ${nearest.availability.missingGlobalDiscoveryPoints.toString(10)} PD de desbloqueo pendientes y ${nearest.availability.missingMilestones.length} hitos pendientes.`
        : 'Disponible · observación sin coste ni recompensa de PD.',
      observedInstrumentLabel: observedType === undefined ? null : instrumentLabel(observedType),
      modelFacts: observedEvidence === null ? Object.freeze([]) : AccretionDiskObservationEngine.modelFacts(disk),
    });
  }

  async observe(generationKey: UniverseGenerationKey, galaxyIndex: bigint): Promise<void> {
    await this.database.openDatabase();
    await this.database.transaction('rw', this.database.universes, this.database.discoveries,
      this.database.progress, this.database.observations, async () => {
        const locator = new GalaxyLocator(galaxyIndex);
        const state = await this.discoveryRepository.getState(generationKey, locator);
        if (DiscoveryState.fromCode(state.code) !== DiscoveryState.CONFIRMED ||
            AccretionDiskObservationEngine.physicalDiskOrNull(generationKey, galaxyIndex, state) === null) {
          throw new RangeError('28.1 requiere una galaxia confirmada con un núcleo realmente activo y disco 27.7.');
        }
        const existing = await this.evidenceRepository.getEvidence(generationKey, locator);
        if (existingDiskEvidence(existing) !== null) return; // Idempotent, no duplicate campaign.
        const points = await this.pointsRepository.getGlobalDiscoveryPoints(generationKey);
        const known = await this.discoveryRepository.getKnownDiscoveries(generationKey);
        const selected = ACCRETION_DISK_OBSERVATION_INSTRUMENTS.find(type =>
          ScientificEvidenceAcquisitionEngine.availability(generationKey, points, known,
            AccretionDiskObservationEngine.evidenceRule(type), type, ObservationInstrumentLevel.LEVEL_3).isAvailable,
        );
        if (selected === undefined) {
          throw new RangeError('28.1 requiere espectroscopia o rayos X desbloqueados en nivel 3.');
        }
        const acquired = ScientificEvidenceAcquisitionEngine.acquire(
          generationKey, points, known, AccretionDiskObservationEngine.evidenceRule(selected),
          selected, ObservationInstrumentLevel.LEVEL_3, Date.now(),
        );
        await this.evidenceRepository.recordEvidence(generationKey, locator, acquired.evidence);
      });
  }
}

const TARGET_SEED_RESOLVER: ProceduralTargetSeedResolver = Object.freeze({
  resolveTargetSeedNormalized(key: UniverseGenerationKey, locator: ProceduralLocator): string {
    return ProceduralTargetResolver.resolveTargetSeed(key, locator).normalizedValue;
  },
});

export const ACCRETION_DISK_OBSERVATION_RUNTIME = new InjectionToken<AccretionDiskObservationRuntime>(
  'ACCRETION_DISK_OBSERVATION_RUNTIME', { providedIn: 'root', factory: () => {
    const db = new GenesisIndexedDb();
    return new DexieAccretionDiskObservationRuntime(db,
      new DexieDiscoveryPointsRepository(db), new DexieDiscoveryRepository(db, TARGET_SEED_RESOLVER));
  } },
);
