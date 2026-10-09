import {
  FastRadioBurstEngineState,
  FastRadioBurstRepetitionState,
  FastRadioBurstSourceKind,
  FastRadioBurstSourceProfile,
} from '../../../../domain/transient/fast-radio-burst-source-profile';
import { FastRadioBurstEventEngine } from '../../../../simulation/transient/fast-radio-burst-event-engine';

export const FastRadioBurstLaboratoryCaseId = Object.freeze({
  MAGNETAR_BURST: 'MAGNETAR_BURST',
  MAGNETAR_REPEATER: 'MAGNETAR_REPEATER',
  DISPERSION_REFERENCE: 'DISPERSION_REFERENCE',
  UNKNOWN_SOURCE_BURST: 'UNKNOWN_SOURCE_BURST',
  NS_NS_ENGINE_UNRESOLVED: 'NS_NS_ENGINE_UNRESOLVED',
} as const);
export type FastRadioBurstLaboratoryCaseId =
  typeof FastRadioBurstLaboratoryCaseId[keyof typeof FastRadioBurstLaboratoryCaseId];

export interface FastRadioBurstLaboratoryCase {
  readonly id: FastRadioBurstLaboratoryCaseId;
  readonly buttonLabel: string;
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly profile: ReturnType<typeof FastRadioBurstEventEngine.characterize>;
}

function resolved(
  sourceKind: FastRadioBurstSourceKind,
  repetitionState: FastRadioBurstRepetitionState,
  durationSeconds: number,
  centerFrequencyHz: number,
  bandwidthHz: number,
  dm: number | null = null,
  lowHz: number | null = null,
  highHz: number | null = null,
) {
  return FastRadioBurstEventEngine.characterize(new FastRadioBurstSourceProfile(
    sourceKind,
    FastRadioBurstEngineState.COHERENT_RADIO_BURST_CONFIRMED,
    repetitionState,
    durationSeconds,
    centerFrequencyHz,
    bandwidthHz,
    dm,
    lowHz,
    highHz,
  ));
}

export const FAST_RADIO_BURST_LABORATORY_CASES: readonly FastRadioBurstLaboratoryCase[] =
  Object.freeze([
    Object.freeze({
      id: FastRadioBurstLaboratoryCaseId.MAGNETAR_BURST,
      buttonLabel: 'Magnetar',
      eyebrow: 'MAGNETAR · BURST',
      title: 'Burst coherente de un magnetar',
      description:
        'El magnetar es un progenitor físicamente compatible, pero el burst se especifica explícitamente: 29.8 no convierte automáticamente la clasificación magnetar en un FRB.',
      profile: resolved(
        FastRadioBurstSourceKind.MAGNETAR,
        FastRadioBurstRepetitionState.REPETITION_UNRESOLVED,
        0.0012,
        1.4e9,
        400e6,
      ),
    }),
    Object.freeze({
      id: FastRadioBurstLaboratoryCaseId.MAGNETAR_REPEATER,
      buttonLabel: 'Repetidor',
      eyebrow: 'MAGNETAR · REPETIDOR',
      title: 'Actividad FRB repetidora confirmada',
      description:
        'La repetición está dada como estado explícito del fixture. GENESIS no infiere un periodo, una cadencia estacionaria ni una distribución temporal a partir de esa etiqueta.',
      profile: resolved(
        FastRadioBurstSourceKind.MAGNETAR,
        FastRadioBurstRepetitionState.REPEATING_CONFIRMED,
        0.003,
        1.3e9,
        600e6,
      ),
    }),
    Object.freeze({
      id: FastRadioBurstLaboratoryCaseId.DISPERSION_REFERENCE,
      buttonLabel: 'Dispersión',
      eyebrow: 'PROPAGACIÓN · DM',
      title: 'Barrido de dispersión en plasma frío',
      description:
        'DM y la banda observadora están fijados solo para demostrar la propagación. La DM produce un retraso cromático calculable, pero no se convierte en distancia, redshift ni energía.',
      profile: resolved(
        FastRadioBurstSourceKind.UNKNOWN_SOURCE,
        FastRadioBurstRepetitionState.REPETITION_UNRESOLVED,
        0.002,
        1.35e9,
        300e6,
        560,
        1.2e9,
        1.5e9,
      ),
    }),
    Object.freeze({
      id: FastRadioBurstLaboratoryCaseId.UNKNOWN_SOURCE_BURST,
      buttonLabel: 'Fuente desconocida',
      eyebrow: 'FUENTE COMPACTA · ABIERTA',
      title: 'FRB intrínseco con progenitor no clasificado',
      description:
        'El burst puede estar caracterizado sin que GENESIS fuerce una identificación del motor. La taxonomía del evento y la del progenitor permanecen separadas.',
      profile: resolved(
        FastRadioBurstSourceKind.UNKNOWN_SOURCE,
        FastRadioBurstRepetitionState.REPETITION_UNRESOLVED,
        0.0007,
        800e6,
        250e6,
      ),
    }),
    Object.freeze({
      id: FastRadioBurstLaboratoryCaseId.NS_NS_ENGINE_UNRESOLVED,
      buttonLabel: 'NS–NS',
      eyebrow: 'FUSIÓN NS–NS · LÍMITE',
      title: 'Una fusión NS–NS no implica un FRB',
      description:
        '29.4 puede resolver la fusión y 29.5 sus ondas gravitacionales, pero 29.8 necesita además un mecanismo de radio coherente explícito. Mientras falte, el FRB permanece sin resolver.',
      profile: FastRadioBurstEventEngine.characterize(new FastRadioBurstSourceProfile(
        FastRadioBurstSourceKind.COMPACT_MERGER_NS_NS_CANDIDATE,
        FastRadioBurstEngineState.BURST_ENGINE_UNRESOLVED,
        FastRadioBurstRepetitionState.REPETITION_UNRESOLVED,
        null,
        null,
        null,
        null,
        null,
        null,
      )),
    }),
  ]);
