import { GeneratorVersion } from '../../../../domain/generation/generator-version';
import { UniverseGenerationKey } from '../../../../domain/generation/universe-generation-key';
import { SystemLocator } from '../../../../domain/generation/procedural-locator';
import {
  LocatedObservationObject, ObservationTransientCandidate,
  ObservationTransientCandidateId,
} from '../../../../domain/observation/observation-classification';
import { UniverseSeed } from '../../../../domain/universe/universe-seed';
import type { MysteryEvidenceInput } from '../../../../domain/mystery/mystery-observational-evidence';
import { MysteryIdentityEngine } from '../../../../simulation/mystery/mystery-identity-engine';
import { MysteryEvidenceEngine } from '../../../../simulation/mystery/mystery-evidence-engine';

const key = new UniverseGenerationKey(
  UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1'), GeneratorVersion.V2,
);
const candidate = new ObservationTransientCandidate(key, new ObservationTransientCandidateId(17n));
const located = new LocatedObservationObject(key, new SystemLocator(0n, -40n, 8n));
const unknownRadio = MysteryIdentityEngine.createSource(candidate, 'QA-30.2-RADIO');
const overlapping = MysteryIdentityEngine.createSource(located, 'QA-30.2-TENSION');
const variable = MysteryIdentityEngine.createSource(located, 'QA-30.2-VARIABLE');
const phenomenon = MysteryIdentityEngine.createPhenomenon(candidate, 'QA-30.2-PHENOMENON');

const radio = { campaignKey: 'RADIO-CAMPAIGN', epochKey: 'OBS-WINDOW-1',
  componentKey: 'CORE', band: 'RADIO' as const, observable: 'FLUX_DENSITY_JY' as const };

export const MYSTERY_EVIDENCE_LABORATORY_CASES = Object.freeze([
  {
    id: 'partial', label: 'Señal parcial', title: 'Cobertura incompleta sin origen identificado',
    description: 'La detección de radio, el límite óptico y la ausencia de rayos X son tres resultados diferentes.',
    assessment: MysteryEvidenceEngine.assess(unknownRadio, [
      { ...radio, observationKey: 'DETECTION-A', kind: 'DETECTION', value: 0.86, sigmaMinus: 0.09, sigmaPlus: 0.13 },
      { ...radio, observationKey: 'OPTICAL-LIMIT', band: 'OPTICAL', kind: 'UPPER_LIMIT', limit: 0.12, thresholdSigma: 5 },
      { ...radio, observationKey: 'XRAY-GAP', band: 'X_RAY', kind: 'MISSING', reason: 'OUTSIDE_COVERAGE' },
    ] satisfies MysteryEvidenceInput[]),
  },
  {
    id: 'tension', label: 'Tensión aparente', title: 'Dos medidas aparentemente incompatibles',
    description: 'Dos intervalos de 2σ, misma banda y época, no se solapan. No se asigna una clase física.',
    assessment: MysteryEvidenceEngine.assess(overlapping, [
      { ...radio, observationKey: 'ANTENNA-A', kind: 'DETECTION', value: 2.1, sigmaMinus: 0.1, sigmaPlus: 0.1 },
      { ...radio, observationKey: 'ANTENNA-B', campaignKey: 'INDEPENDENT-CAMPAIGN',
        kind: 'DETECTION', value: 3.6, sigmaMinus: 0.1, sigmaPlus: 0.2 },
    ] satisfies MysteryEvidenceInput[]),
  },
  {
    id: 'variability', label: 'Épocas distintas', title: 'Variabilidad no es una contradicción',
    description: 'Señales de radio en dos épocas diferentes; el modelo no supone una fuente estática.',
    assessment: MysteryEvidenceEngine.assess(variable, [
      { ...radio, observationKey: 'FIRST-EPOCH', kind: 'DETECTION', value: 1.3, sigmaMinus: 0.04, sigmaPlus: 0.04 },
      { ...radio, observationKey: 'SECOND-EPOCH', epochKey: 'OBS-WINDOW-2',
        kind: 'DETECTION', value: 9.2, sigmaMinus: 0.1, sigmaPlus: 0.1 },
    ] satisfies MysteryEvidenceInput[]),
  },
  {
    id: 'phenomenon', label: 'Fenómeno aislado', title: 'Fenómeno sin fuente asociada',
    description: 'Un fenómeno puede existir solo como candidato observacional, incluso sin ninguna medida cuantitativa.',
    assessment: MysteryEvidenceEngine.assess(phenomenon, [
      { ...radio, observationKey: 'NO-INSPECTION', kind: 'MISSING', reason: 'NOT_MEASURED' },
    ] satisfies MysteryEvidenceInput[]),
  },
]);
