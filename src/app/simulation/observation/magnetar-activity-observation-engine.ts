import { type DiscoveryStateValue } from '../../domain/discovery/discovery-state';
import { ScientificObservationEvidenceRule } from '../../domain/discovery/scientific-observation-evidence-rule';
import { GalacticObjectLocator } from '../../domain/generation/procedural-locator';
import { type UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { ObservationActionType } from '../../domain/observation/observation-action';
import { ObservationInstrumentType } from '../../domain/observation/observation-instrument';
import { ObservationInstrumentLevel } from '../../domain/observation/observation-instrument-capability';
import {
  GalacticMagnetarActivityProfileEngine,
  type GalacticMagnetarActivityProfile,
} from '../galactic-object/magnetar-activity-profile-engine';

export const MAGNETAR_ACTIVITY_OBSERVATION_INSTRUMENTS = Object.freeze([
  ObservationInstrumentType.X_RAY,
  ObservationInstrumentType.GAMMA_RAY,
] as const);

export const MAGNETAR_ACTIVITY_EVIDENCE_DIMENSION = 'MAGNETAR_ACTIVITY_28_4';
export const MAGNETAR_ACTIVITY_EVIDENCE_CODE = 'MAGNETIC_FIELD_BURST_MONITORING';

/** 28.4 high-energy campaign. It never changes DiscoveryState or awards PD. */
export class MagnetarActivityObservationEngine {
  private constructor() {}

  static physicalProfileOrNull(
    generationKey: UniverseGenerationKey,
    locator: GalacticObjectLocator,
    knowledgeState: DiscoveryStateValue,
  ): GalacticMagnetarActivityProfile | null {
    return GalacticMagnetarActivityProfileEngine.resolveConfirmed(
      generationKey,
      locator,
      knowledgeState,
    );
  }

  static evidenceRule(instrumentType: ObservationInstrumentType): ScientificObservationEvidenceRule {
    if (!MAGNETAR_ACTIVITY_OBSERVATION_INSTRUMENTS.includes(
      instrumentType as typeof MAGNETAR_ACTIVITY_OBSERVATION_INSTRUMENTS[number],
    )) {
      throw new RangeError('28.4 requires X-ray or gamma-ray monitoring.');
    }

    return new ScientificObservationEvidenceRule({
      profileCode: 'MAGNETAR_MAGNETIC_ACTIVITY',
      ruleCode: 'MEASURE_FIELD_MONITOR_BURSTS_28_4',
      observationActionType: ObservationActionType.TEMPORAL_MONITORING,
      compatibleInstrumentTypes: [instrumentType],
      minimumInstrumentLevel: ObservationInstrumentLevel.LEVEL_4,
      dimensionCode: MAGNETAR_ACTIVITY_EVIDENCE_DIMENSION,
      evidenceCode: MAGNETAR_ACTIVITY_EVIDENCE_CODE,
      sourceKey: `MAGNETAR_ACTIVITY_${instrumentType}`,
      independenceKey: `MAGNETAR_ACTIVITY_${instrumentType}_CAMPAIGN`,
    });
  }

  static measurementFacts(
    profile: GalacticMagnetarActivityProfile,
  ): readonly Readonly<{ label: string; value: string }>[] {
    const facts: Readonly<{ label: string; value: string }>[] = [
      Object.freeze({
        label: 'Campo dipolar inferido',
        value: formatField(profile.dipolarMagneticFieldTesla),
      }),
      Object.freeze({
        label: 'Derivada del período',
        value: `${formatScientific(profile.periodDerivativeSecondsPerSecond)} s/s`,
      }),
      Object.freeze({
        label: 'Edad característica dipolar',
        value: formatYears(profile.characteristicAgeYears),
      }),
      Object.freeze({
        label: 'Ventana de monitorización',
        value: `${(profile.monitoringWindowSeconds / 3600).toFixed(0)} h`,
      }),
      Object.freeze({
        label: 'Régimen de estallidos cortos',
        value: activityLabel(profile.burstActivityRegime),
      }),
      Object.freeze({
        label: 'Estallidos detectados',
        value: profile.detectedBurstCount.toLocaleString('es-ES'),
      }),
    ];

    if (profile.strongestBurstDurationSeconds !== null) {
      facts.push(Object.freeze({
        label: 'Duración del estallido más intenso',
        value: formatDuration(profile.strongestBurstDurationSeconds),
      }));
    }
    if (profile.shortestBurstSeparationSeconds !== null) {
      facts.push(Object.freeze({
        label: 'Separación mínima entre estallidos',
        value: formatDuration(profile.shortestBurstSeparationSeconds),
      }));
    }

    return Object.freeze(facts);
  }
}

function formatField(tesla: number): string {
  const gauss = tesla * 1e4;
  return `${formatScientific(tesla)} T · ${formatScientific(gauss)} G`;
}

function formatScientific(value: number): string {
  return value.toExponential(3).replace('e+', 'e');
}

function formatYears(years: number): string {
  if (years >= 1e6) return `${(years / 1e6).toFixed(2)} Ma`;
  if (years >= 1e3) return `${(years / 1e3).toFixed(2)} ka`;
  return `${years.toFixed(1)} años`;
}

function formatDuration(seconds: number): string {
  if (seconds < 1) return `${(seconds * 1000).toFixed(seconds < 0.1 ? 1 : 0)} ms`;
  if (seconds < 60) return `${seconds.toFixed(seconds < 10 ? 2 : 1)} s`;
  return `${(seconds / 60).toFixed(2)} min`;
}

function activityLabel(regime: GalacticMagnetarActivityProfile['burstActivityRegime']): string {
  switch (regime) {
    case 'ACTIVE': return 'Activo';
    case 'INTERMITTENT': return 'Intermitente';
    default: return 'Sin estallidos en la ventana';
  }
}
