import { DiscoveryState, type DiscoveryStateValue } from '../../domain/discovery/discovery-state';
import { ScientificObservationEvidenceRule } from '../../domain/discovery/scientific-observation-evidence-rule';
import { type CompactAccretionDisk } from '../../domain/stellar/compact-accretion-disk';
import { type UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { ObservationActionType } from '../../domain/observation/observation-action';
import { ObservationInstrumentType } from '../../domain/observation/observation-instrument';
import { ObservationInstrumentLevel } from '../../domain/observation/observation-instrument-capability';
import { CompactAccretionEngine } from '../stellar/compact-accretion-engine';
import { GalaxyGenerator } from '../universe/galaxy-generator';

/** 28.1: an observational campaign, not a second generator or a measured SED. */
export const ACCRETION_DISK_OBSERVATION_INSTRUMENTS = Object.freeze([
  ObservationInstrumentType.SPECTROSCOPY,
  ObservationInstrumentType.X_RAY,
] as const);

export const ACCRETION_DISK_EVIDENCE_DIMENSION = 'ACCRETION_DISK_28_1';
export const ACCRETION_DISK_EVIDENCE_CODE = 'NUCLEAR_DISK_OBSERVATION';

export class AccretionDiskObservationEngine {
  private constructor() {}

  static physicalDiskOrNull(
    generationKey: UniverseGenerationKey,
    galaxyIndex: bigint,
    knowledgeState: DiscoveryStateValue,
  ): CompactAccretionDisk | null {
    if (DiscoveryState.fromCode(knowledgeState.code).code < DiscoveryState.CONFIRMED.code) {
      return null; // Do not even regenerate a hidden nucleus before confirmation.
    }
    return CompactAccretionEngine.fromExistingGalaxy(
      GalaxyGenerator.generate(generationKey, galaxyIndex),
    )?.disk ?? null;
  }

  static evidenceRule(instrumentType: ObservationInstrumentType): ScientificObservationEvidenceRule {
    if (!ACCRETION_DISK_OBSERVATION_INSTRUMENTS.includes(
      instrumentType as typeof ACCRETION_DISK_OBSERVATION_INSTRUMENTS[number],
    )) {
      throw new RangeError('28.1 requires spectroscopy or X-ray observation.');
    }
    return new ScientificObservationEvidenceRule({
      profileCode: 'ACTIVE_GALACTIC_NUCLEUS',
      ruleCode: 'OBSERVE_ACCRETION_DISK_28_1',
      observationActionType: ObservationActionType.OBSERVE,
      compatibleInstrumentTypes: [instrumentType],
      minimumInstrumentLevel: ObservationInstrumentLevel.LEVEL_3,
      dimensionCode: ACCRETION_DISK_EVIDENCE_DIMENSION,
      evidenceCode: ACCRETION_DISK_EVIDENCE_CODE,
      sourceKey: `ACCRETION_DISK_${instrumentType}`,
      independenceKey: `ACCRETION_DISK_${instrumentType}_CAMPAIGN`,
    });
  }

  /** Only existing 27.7 model parameters; NONE of these are observed fluxes or measured masses. */
  static modelFacts(disk: CompactAccretionDisk): readonly Readonly<{ label: string; value: string }>[] {
    return Object.freeze([
      { label: 'Régimen de referencia', value: `${(disk.eddingtonRatio * 100).toFixed(1)} % del límite de Eddington` },
      { label: 'Radio interior (modelo no rotante)', value: `${disk.innerRadiusKm.toExponential(3)} km` },
      { label: 'Radio exterior ilustrativo', value: `${disk.outerRadiusKm.toExponential(3)} km` },
      { label: 'Luminosidad bolométrica (modelo)', value: `${disk.bolometricLuminosityWatts.toExponential(3)} W` },
      { label: 'Acreción (modelo estacionario)', value: `${disk.massAccretionRateKgPerSecond.toExponential(3)} kg/s` },
      { label: 'Temperatura efectiva máxima (modelo)', value: `${disk.maximumEffectiveTemperatureKelvin.toExponential(3)} K` },
    ].map(fact => Object.freeze(fact)));
  }
}
