import type { MysteryEvidenceInput } from '../../domain/mystery/mystery-observational-evidence';
import { UnclassifiedSource, UnknownPhenomenon } from '../../domain/mystery/mystery-observational-subject';
import { MYSTERY_ACTION_LABORATORY_CASES } from './mystery-action-laboratory-fixtures';

const action = MYSTERY_ACTION_LABORATORY_CASES;
const source = action[0].subject;
const variable = action[2].subject;
const unlocated = action[3].subject;
const radio = {
  band: 'RADIO' as const, observable: 'FLUX_DENSITY_JY' as const,
  componentKey: 'CORE', epochKey: 'OBS-1', campaignKey: 'RADIO-A',
};
const measure = (id: string, epochKey: string, campaignKey: string, value: number,
                 sigmaMinus = .1, sigmaPlus = .1): MysteryEvidenceInput => ({
  ...radio, observationKey: id, epochKey, campaignKey, kind: 'DETECTION', value, sigmaMinus, sigmaPlus,
});
const period = (id: string, epochKey: string, campaignKey: string, value: number): MysteryEvidenceInput => ({
  ...radio, observable: 'PERIOD_S', observationKey: id, epochKey, campaignKey,
  kind: 'DETECTION', value, sigmaMinus: .001, sigmaPlus: .001,
});

export interface MysteryClassificationLabCase {
  readonly id: string;
  readonly label: string;
  readonly title: string;
  readonly description: string;
  readonly subject: UnclassifiedSource | UnknownPhenomenon;
  readonly initial: readonly MysteryEvidenceInput[];
  readonly steps: readonly { readonly label: string; readonly evidence: readonly MysteryEvidenceInput[] }[];
}

export const MYSTERY_CLASSIFICATION_CASES: readonly MysteryClassificationLabCase[] = Object.freeze([
  {
    id: 'insufficient', label: 'Insuficiente', title: 'Una señal no demuestra una clase',
    description: 'Radio detectada, límite óptico y ausencia de rayos X: evidencia incompleta aunque los valores sean legítimos.',
    subject: source, initial: action[0].initial, steps: [],
  },
  {
    id: 'provisional', label: 'Variable provisional', title: 'Variabilidad de radio candidata',
    description: 'Dos medidas de radio con S/N ≥ 5 en épocas separadas y bandas comparables; todavía falta repetición independiente.',
    subject: variable, initial: action[2].initial, steps: [],
  },
  {
    id: 'supported', label: 'Réplica independiente', title: 'Variabilidad respaldada por tres épocas',
    description: 'Partimos de dos épocas; una campaña independiente aporta una tercera. Se clasifica solo la variabilidad observable.',
    subject: variable, initial: action[2].initial, steps: [
      { label: 'Añadir réplica radio · época 3', evidence: [measure('RADIO-INDEPENDENT-3', 'OBS-WINDOW-3', 'OTHER-CAMPAIGN', 2.8)] },
    ],
  },
  {
    id: 'reopen', label: 'Reabrir revisión', title: 'Nueva tensión reabre una clasificación',
    description: 'Tras una réplica independiente, una medición incompatible en la misma época obliga a revisar el resultado.',
    subject: variable, initial: action[2].initial, steps: [
      { label: 'Añadir réplica independiente', evidence: [measure('RADIO-FOLLOWUP-3', 'OBS-WINDOW-3', 'INDEPENDENT-ARRAY', 2.8)] },
      { label: 'Incorporar medida en tensión · época 3', evidence: [measure('RADIO-TENSION-3', 'OBS-WINDOW-3', 'SECOND-ARRAY', 7.7)] },
    ],
  },
  {
    id: 'periodic', label: 'Señal periódica', title: 'Periodicidad de radio sin declarar púlsar',
    description: 'Las mediciones de periodo deben solaparse dentro de 2σ. La coincidencia no identifica un progenitor.',
    subject: unlocated, initial: [
      measure('PERIODIC-FLUX', 'P-EPOCH-1', 'RADIO-ARRAY-A', 3.4),
      period('PERIODIC-A', 'P-EPOCH-1', 'RADIO-ARRAY-A', .728),
      period('PERIODIC-B', 'P-EPOCH-2', 'RADIO-ARRAY-A', .7286),
    ], steps: [
      { label: 'Repetir periodo con campaña independiente', evidence: [period('PERIODIC-C', 'P-EPOCH-3', 'RADIO-ARRAY-B', .729)] },
    ],
  },
  {
    id: 'outside', label: 'Sin clase compatible', title: 'Señal fuera de la taxonomía disponible',
    description: 'Las medidas de rayos X son reales, pero estas reglas solo describen variabilidad y periodicidad radio.',
    subject: unlocated, initial: [{ ...radio, observationKey: 'XRAY-SIGNAL', band: 'X_RAY',
      observable: 'ENERGY_FLUX_W_M2', kind: 'DETECTION', value: .0000024, sigmaMinus: .0000002,
      sigmaPlus: .0000003 }], steps: [],
  },
]);
