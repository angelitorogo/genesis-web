import { DiscoveryState, type DiscoveryStateValue } from '../../domain/discovery/discovery-state';
import { type ScientificEvidence } from '../../domain/discovery/scientific-evidence';
import { ScientificObservationEvidenceRule } from '../../domain/discovery/scientific-observation-evidence-rule';
import { type UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { ObservationActionType } from '../../domain/observation/observation-action';
import { ObservationInstrumentType } from '../../domain/observation/observation-instrument';
import { ObservationInstrumentLevel } from '../../domain/observation/observation-instrument-capability';
import { type CompactAccretionDisk } from '../../domain/stellar/compact-accretion-disk';
import { GalaxyGenerator } from '../universe/galaxy-generator';
import { CompactAccretionEngine } from './compact-accretion-engine';

/** 28.1: observational campaign, not a new source of disks or a measurement. */
export const ACCRETION_DISK_OBSERVATION_RULE = new ScientificObservationEvidenceRule({
  profileCode: 'ACTIVE_GALACTIC_NUCLEUS',
  ruleCode: 'OBSERVE_NUCLEAR_ACCRETION_DISK_28_1',
  observationActionType: ObservationActionType.OBSERVE,
  compatibleInstrumentTypes: [ObservationInstrumentType.X_RAY, ObservationInstrumentType.OPTICAL],
  minimumInstrumentLevel: ObservationInstrumentLevel.LEVEL_3,
  dimensionCode: 'NUCLEAR_ACCRETION_DISK',
  evidenceCode: 'ACCRETION_DISK_OBSERVATION_CAMPAIGN',
  sourceKey: 'NUCLEAR_DISK_CAMPAIGN',
  independenceKey: 'NUCLEAR_DISK_CAMPAIGN',
});

/** Physical existence is checked ONLY after the caller's persisted CONFIRMED gate. */
export class AccretionDiskObservationEngine {
  private constructor() {}

  static existingDiskOrNull(
    generationKey: UniverseGenerationKey,
    galaxyIndex: bigint,
    persistedState: DiscoveryStateValue,
  ): CompactAccretionDisk | null {
    if (DiscoveryState.fromCode(persistedState.code).code < DiscoveryState.CONFIRMED.code) {
      return null;
    }
    // No new PRNG branch, accretion supply, random active state or physical object.
    return CompactAccretionEngine.fromExistingGalaxy(
      GalaxyGenerator.generate(generationKey, galaxyIndex),
    )?.disk ?? null;
  }

  static matchingEvidence(evidence: readonly ScientificEvidence[]): ScientificEvidence | null {
    return evidence.find(item =>
      item.dimensionCode === ACCRETION_DISK_OBSERVATION_RULE.dimensionCode &&
      item.evidenceCode === ACCRETION_DISK_OBSERVATION_RULE.evidenceCode &&
      item.independenceKey === ACCRETION_DISK_OBSERVATION_RULE.independenceKey &&
      item.sourceKey.startsWith(`${ACCRETION_DISK_OBSERVATION_RULE.sourceKey}:`) &&
      ACCRETION_DISK_OBSERVATION_RULE.compatibleInstrumentTypes.some(type =>
        item.sourceKey === `${ACCRETION_DISK_OBSERVATION_RULE.sourceKey}:${type}`,
      ),
    ) ?? null;
  }
}
