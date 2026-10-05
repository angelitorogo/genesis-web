import { type DiscoveryStateValue } from '../../domain/discovery/discovery-state';
import { ScientificObservationEvidenceRule } from '../../domain/discovery/scientific-observation-evidence-rule';
import { GalacticObjectLocator } from '../../domain/generation/procedural-locator';
import { type UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { ObservationActionType } from '../../domain/observation/observation-action';
import { ObservationInstrumentType } from '../../domain/observation/observation-instrument';
import { ObservationInstrumentLevel } from '../../domain/observation/observation-instrument-capability';
import {
  GalacticPulsarTimingProfileEngine,
  type GalacticPulsarTimingProfile,
} from '../galactic-object/pulsar-timing-profile-engine';

export const PULSAR_TIMING_OBSERVATION_INSTRUMENTS = Object.freeze([
  ObservationInstrumentType.RADIO,
  ObservationInstrumentType.X_RAY,
] as const);

export const PULSAR_TIMING_EVIDENCE_DIMENSION = 'PULSAR_TIMING_28_3';
export const PULSAR_TIMING_EVIDENCE_CODE = 'SYNCHRONIZED_PULSE_PERIOD';

/** 28.3 observed timing campaign. It never changes DiscoveryState or awards PD. */
export class PulsarTimingObservationEngine {
  private constructor() {}

  static physicalProfileOrNull(
    generationKey: UniverseGenerationKey,
    locator: GalacticObjectLocator,
    knowledgeState: DiscoveryStateValue,
  ): GalacticPulsarTimingProfile | null {
    return GalacticPulsarTimingProfileEngine.resolveConfirmed(
      generationKey,
      locator,
      knowledgeState,
    );
  }

  static evidenceRule(instrumentType: ObservationInstrumentType): ScientificObservationEvidenceRule {
    if (!PULSAR_TIMING_OBSERVATION_INSTRUMENTS.includes(
      instrumentType as typeof PULSAR_TIMING_OBSERVATION_INSTRUMENTS[number],
    )) {
      throw new RangeError('28.3 requires radio or X-ray pulse timing.');
    }

    return new ScientificObservationEvidenceRule({
      profileCode: 'PULSE_TIMING_CAPABLE_EXTREME',
      ruleCode: 'SYNCHRONIZE_MEASURE_PULSES_28_3',
      observationActionType: ObservationActionType.MEASURE_PERIOD,
      compatibleInstrumentTypes: [instrumentType],
      minimumInstrumentLevel: ObservationInstrumentLevel.LEVEL_4,
      dimensionCode: PULSAR_TIMING_EVIDENCE_DIMENSION,
      evidenceCode: PULSAR_TIMING_EVIDENCE_CODE,
      sourceKey: `PULSAR_TIMING_${instrumentType}`,
      independenceKey: `PULSAR_TIMING_${instrumentType}_CAMPAIGN`,
    });
  }

  static measurementFacts(
    profile: GalacticPulsarTimingProfile,
  ): readonly Readonly<{ label: string; value: string }>[] {
    return Object.freeze([
      Object.freeze({
        label: 'Período de pulso',
        value: formatPeriod(profile.pulsePeriodSeconds),
      }),
      Object.freeze({
        label: 'Frecuencia de pulsos',
        value: formatFrequency(profile.pulseFrequencyHz),
      }),
      Object.freeze({
        label: 'Ancho efectivo de pulso',
        value: formatPeriod(profile.pulseWidthSeconds),
      }),
      Object.freeze({
        label: 'Ciclo de trabajo',
        value: `${(profile.dutyCycle01 * 100).toFixed(2)} %`,
      }),
      Object.freeze({
        label: 'Fase de referencia',
        value: `φ₀ = ${profile.referencePhase01.toFixed(6)} ciclos`,
      }),
      Object.freeze({
        label: 'Ventana sincronizada',
        value: `${profile.synchronizationWindowSeconds.toFixed(0)} s`,
      }),
      Object.freeze({
        label: 'Pulsos alineados',
        value: profile.synchronizedPulseCount.toLocaleString('es-ES'),
      }),
    ]);
  }
}

function formatPeriod(seconds: number): string {
  if (seconds < 0.1) return `${(seconds * 1_000).toFixed(seconds < 0.01 ? 3 : 2)} ms`;
  return `${seconds.toFixed(seconds < 1 ? 4 : 3)} s`;
}

function formatFrequency(hz: number): string {
  if (hz >= 100) return `${hz.toFixed(2)} Hz`;
  if (hz >= 10) return `${hz.toFixed(3)} Hz`;
  return `${hz.toFixed(4)} Hz`;
}
