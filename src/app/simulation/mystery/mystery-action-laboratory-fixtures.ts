import { GeneratorVersion } from '../../domain/generation/generator-version';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { SystemLocator } from '../../domain/generation/procedural-locator';
import {
  LocatedObservationObject, ObservationTransientCandidate, ObservationTransientCandidateId,
} from '../../domain/observation/observation-classification';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import type { UnclassifiedSource, UnknownPhenomenon } from '../../domain/mystery/mystery-observational-subject';
import type { MysteryEvidenceInput } from '../../domain/mystery/mystery-observational-evidence';
import type {
  MysteryInstrument, MysteryObservationRequest, MysteryAcquisitionPacket,
} from '../../domain/mystery/mystery-observation-action';
import { MysteryIdentityEngine } from './mystery-identity-engine';

const key = new UniverseGenerationKey(
  UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1'), GeneratorVersion.V2,
);
const candidate = new ObservationTransientCandidate(key, new ObservationTransientCandidateId(17n));
const located = new LocatedObservationObject(key, new SystemLocator(0n, -40n, 8n));
const source = MysteryIdentityEngine.createSource(candidate, 'QA-30.3-RADIO');
const tensionSource = MysteryIdentityEngine.createSource(located, 'QA-30.3-TENSION');
const variableSource = MysteryIdentityEngine.createSource(located, 'QA-30.3-VARIABLE');
const unlocated = MysteryIdentityEngine.createPhenomenon(candidate, 'QA-30.3-ISOLATED');
const blockedSource = MysteryIdentityEngine.createSource(located, 'QA-30.3-UNSUPPORTED');
const radio = {
  campaignKey: 'RADIO-FIRST', epochKey: 'OBS-WINDOW-1',
  componentKey: 'CORE', band: 'RADIO' as const, observable: 'FLUX_DENSITY_JY' as const,
};

export interface MysteryActionsLabAction {
  readonly request: MysteryObservationRequest;
  readonly label: string;
  readonly explanation: string;
  /** Observations are expressly provided by the laboratory acquisition fixture. */
  readonly packet: MysteryAcquisitionPacket;
}
export interface MysteryActionsLabCase {
  readonly id: string;
  readonly label: string;
  readonly title: string;
  readonly description: string;
  readonly subject: UnclassifiedSource | UnknownPhenomenon;
  readonly initial: readonly MysteryEvidenceInput[];
  readonly instruments: readonly MysteryInstrument[];
  readonly actions: readonly MysteryActionsLabAction[];
}
const opticalSpectrograph: MysteryInstrument = {
  id: 'OPT-SPEC', operational: true,
  reachableScopes: ['UNLOCATED', 'SYSTEM'],
  modes: [{
    kind: 'SPECTROSCOPY', bands: ['OPTICAL'], observables: ['ENERGY_FLUX_W_M2'],
    maximumExposureSeconds: 3600,
  }],
};
const opticalTelescope: MysteryInstrument = {
  id: 'OPT-IMAGER', operational: true,
  reachableScopes: ['UNLOCATED', 'SYSTEM'],
  modes: [{
    kind: 'NEW_BAND', bands: ['OPTICAL', 'INFRARED'], observables: ['FLUX_DENSITY_JY'],
    maximumExposureSeconds: 1800,
  }],
};
const radioArray: MysteryInstrument = {
  id: 'RADIO-ARRAY', operational: true,
  reachableScopes: ['UNLOCATED', 'SYSTEM'],
  modes: [{
    kind: 'TEMPORAL_FOLLOW_UP', bands: ['RADIO'], observables: ['FLUX_DENSITY_JY'],
    maximumExposureSeconds: 3600,
  }],
};
const multiBand: MysteryInstrument = {
  id: 'MULTI-SURVEY', operational: true,
  reachableScopes: ['SYSTEM'],
  modes: [{
    kind: 'MULTIBAND_CAMPAIGN', bands: ['OPTICAL', 'INFRARED'],
    observables: ['FLUX_DENSITY_JY'], maximumExposureSeconds: 5400,
  }],
};
const astrometricArray: MysteryInstrument = {
  id: 'ASTROMETRY-ARRAY', operational: true,
  reachableScopes: ['UNLOCATED', 'SYSTEM'],
  modes: [{
    kind: 'ASTROMETRY', bands: ['RADIO'], observables: ['ANGULAR_OFFSET_ARCSEC'],
    maximumExposureSeconds: 2400,
  }],
};
const unavailableXray: MysteryInstrument = {
  id: 'XRAY-OFFLINE', operational: false,
  reachableScopes: ['UNLOCATED', 'SYSTEM'],
  modes: [{ kind: 'NEW_BAND', bands: ['X_RAY'], observables: ['ENERGY_FLUX_W_M2'], maximumExposureSeconds: 3600 }],
};
const req = (
  subject: UnclassifiedSource | UnknownPhenomenon,
  id: string,
  instrumentId: string,
  kind: MysteryObservationRequest['kind'],
  bands: MysteryObservationRequest['bands'],
  observables: MysteryObservationRequest['observables'],
  epochKey: string,
  campaignKey: string,
  exposureSeconds = 1200,
): MysteryObservationRequest => ({
  id, subjectId: subject.id, instrumentId, kind, bands, observables,
  campaignKey, epochKey, componentKey: 'CORE', exposureSeconds,
});

const optical = req(source, 'OPT-SPECTRUM', 'OPT-SPEC', 'SPECTROSCOPY', ['OPTICAL'], ['ENERGY_FLUX_W_M2'], 'OBS-WINDOW-2', 'OPTICAL-CAMPAIGN');
const xray = req(source, 'XRAY-OBS', 'XRAY-OFFLINE', 'NEW_BAND', ['X_RAY'], ['ENERGY_FLUX_W_M2'], 'OBS-WINDOW-2', 'XRAY-CAMPAIGN');
const freshEpoch = req(tensionSource, 'RADIO-REPEAT', 'RADIO-ARRAY', 'TEMPORAL_FOLLOW_UP', ['RADIO'], ['FLUX_DENSITY_JY'], 'OBS-WINDOW-2', 'RADIO-REPEAT-CAMPAIGN');
const campaign = req(variableSource, 'TWO-BAND-SURVEY', 'MULTI-SURVEY', 'MULTIBAND_CAMPAIGN', ['OPTICAL', 'INFRARED'], ['FLUX_DENSITY_JY'], 'OBS-WINDOW-3', 'SURVEY-CAMPAIGN', 4500);
const astrometry = req(unlocated, 'LOCALIZE-RADIO', 'ASTROMETRY-ARRAY', 'ASTROMETRY', ['RADIO'], ['ANGULAR_OFFSET_ARCSEC'], 'OBS-WINDOW-2', 'POSITION-CAMPAIGN');
const impossiblePointing = req(blockedSource, 'UNREACHABLE-CAMPAIGN', 'MULTI-SURVEY', 'MULTIBAND_CAMPAIGN', ['RADIO', 'X_RAY'], ['FLUX_DENSITY_JY'], 'OBS-WINDOW-4', 'BLIND-CAMPAIGN');

export const MYSTERY_ACTION_LABORATORY_CASES: readonly MysteryActionsLabCase[] = Object.freeze([
  {
    id: 'spectrum', label: 'Espectro + X offline', title: 'Radio detectada · espectro óptico solicitado',
    description: 'Un espectrógrafo obtiene dos componentes espectrales. El instrumento X está fuera de servicio, así que no produce datos.',
    subject: source,
    initial: [
      { ...radio, observationKey: 'RADIO-START', kind: 'DETECTION', value: 0.86, sigmaMinus: 0.09, sigmaPlus: 0.13 },
      { ...radio, observationKey: 'OPTICAL-LIMIT', band: 'OPTICAL', kind: 'UPPER_LIMIT', limit: 0.12, thresholdSigma: 5 },
      { ...radio, observationKey: 'XRAY-MISSING', band: 'X_RAY', kind: 'MISSING', reason: 'OUTSIDE_COVERAGE' },
    ],
    instruments: [opticalSpectrograph, unavailableXray],
    actions: [
      {
        request: optical, label: 'Obtener espectro óptico', explanation: 'Espectroscopia · 2 componentes medidas explícitamente',
        packet: { requestId: optical.id, evidence: [
          { observationKey: 'OPT-SPECTRUM-R1', campaignKey: optical.campaignKey, epochKey: optical.epochKey, componentKey: 'CORE-LINE-A', band: 'OPTICAL', observable: 'ENERGY_FLUX_W_M2', kind: 'DETECTION', value: 0.0000021, sigmaMinus: 0.0000003, sigmaPlus: 0.0000003 },
          { observationKey: 'OPT-SPECTRUM-R2', campaignKey: optical.campaignKey, epochKey: optical.epochKey, componentKey: 'CORE-LINE-B', band: 'OPTICAL', observable: 'ENERGY_FLUX_W_M2', kind: 'UPPER_LIMIT', limit: 0.0000009, thresholdSigma: 5 },
        ] },
      },
      { request: xray, label: 'Solicitar rayos X', explanation: 'Instrumento no operativo · acción bloqueada', packet: { requestId: xray.id, evidence: [] } },
    ],
  },
  {
    id: 'tension', label: 'Repetir medida', title: 'Tensión de radio: repetir en otra época',
    description: 'Una nueva medida puede ayudar a investigar la discrepancia sin borrar los resultados anteriores ni atribuir variabilidad como causa segura.',
    subject: tensionSource,
    initial: [
      { ...radio, observationKey: 'ANTENNA-A', kind: 'DETECTION', value: 2.1, sigmaMinus: 0.1, sigmaPlus: 0.1 },
      { ...radio, observationKey: 'ANTENNA-B', campaignKey: 'RADIO-INDEPENDENT', kind: 'DETECTION', value: 3.6, sigmaMinus: 0.1, sigmaPlus: 0.2 },
    ],
    instruments: [radioArray],
    actions: [{
      request: freshEpoch, label: 'Repetir seguimiento de radio', explanation: 'Nueva ventana temporal; tensión original conservada',
      packet: { requestId: freshEpoch.id, evidence: [{
        observationKey: 'RADIO-REPEAT-R1', campaignKey: freshEpoch.campaignKey, epochKey: freshEpoch.epochKey, componentKey: 'CORE',
        band: 'RADIO', observable: 'FLUX_DENSITY_JY', kind: 'DETECTION', value: 2.6, sigmaMinus: 0.15, sigmaPlus: 0.15,
      }] },
    }],
  },
  {
    id: 'campaign', label: 'Campaña multibanda', title: 'Campaña óptica + infrarroja',
    description: 'Un instrumento declara explícitamente ambas bandas y el tiempo de exposición; se adquieren datos solo en las bandas cubiertas.',
    subject: variableSource,
    initial: [
      { ...radio, observationKey: 'RADIO-EPOCH-1', kind: 'DETECTION', value: 1.3, sigmaMinus: 0.04, sigmaPlus: 0.04 },
      { ...radio, observationKey: 'RADIO-EPOCH-2', epochKey: 'OBS-WINDOW-2', kind: 'DETECTION', value: 9.2, sigmaMinus: 0.1, sigmaPlus: 0.1 },
    ],
    instruments: [multiBand, opticalTelescope],
    actions: [{
      request: campaign, label: 'Ejecutar campaña en dos bandas', explanation: 'Un resultado infrarrojo puede ser solo un límite',
      packet: { requestId: campaign.id, evidence: [
        { observationKey: 'TWO-BAND-SURVEY-R1', campaignKey: campaign.campaignKey, epochKey: campaign.epochKey, componentKey: 'CORE', band: 'OPTICAL', observable: 'FLUX_DENSITY_JY', kind: 'DETECTION', value: 0.32, sigmaMinus: 0.04, sigmaPlus: 0.05 },
        { observationKey: 'TWO-BAND-SURVEY-R2', campaignKey: campaign.campaignKey, epochKey: campaign.epochKey, componentKey: 'CORE', band: 'INFRARED', observable: 'FLUX_DENSITY_JY', kind: 'UPPER_LIMIT', limit: 0.18, thresholdSigma: 5 },
      ] },
    }],
  },
  {
    id: 'astrometry', label: 'Astrometría', title: 'Fenómeno no localizado: intento de posición',
    description: 'La capacidad astrométrica permite tomar una medida, pero no garantiza identificar la fuente física ni determinar el objeto canónico.',
    subject: unlocated,
    initial: [{ ...radio, observationKey: 'NO-INSPECTION', kind: 'MISSING', reason: 'NOT_MEASURED' }],
    instruments: [astrometricArray],
    actions: [{
      request: astrometry, label: 'Medir desplazamiento angular', explanation: 'Resultado explícito: límite superior, sin posición física de origen',
      packet: { requestId: astrometry.id, evidence: [{
        observationKey: 'LOCALIZE-RADIO-R1', campaignKey: astrometry.campaignKey, epochKey: astrometry.epochKey, componentKey: 'CORE',
        band: 'RADIO', observable: 'ANGULAR_OFFSET_ARCSEC', kind: 'UPPER_LIMIT', limit: 0.3, thresholdSigma: 5,
      }] },
    }],
  },
  {
    id: 'unsupported', label: 'Capacidad insuficiente', title: 'Acción fuera de las capacidades del instrumento',
    description: 'No basta con tener un instrumento disponible: debe cubrir la banda, magnitud, alcance y exposición solicitados.',
    subject: blockedSource,
    initial: [{ ...radio, observationKey: 'PENDING-BAND', kind: 'MISSING', reason: 'NOT_MEASURED' }],
    instruments: [multiBand],
    actions: [{ request: impossiblePointing, label: 'Campaña radio + X', explanation: 'Bandas fuera del contrato instrumental', packet: { requestId: impossiblePointing.id, evidence: [] } }],
  },
]);
