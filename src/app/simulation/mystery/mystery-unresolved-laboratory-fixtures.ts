import type { MysteryEvidenceInput } from '../../domain/mystery/mystery-observational-evidence';
import type { MysteryClosureScope } from '../../domain/mystery/mystery-unresolved-review';
import type { UnclassifiedSource, UnknownPhenomenon } from '../../domain/mystery/mystery-observational-subject';
import { MYSTERY_CLASSIFICATION_CASES } from './mystery-classification-laboratory-fixtures';

const from = (id: string) => {
  const found = MYSTERY_CLASSIFICATION_CASES.find(c => c.id === id);
  if (!found) throw new Error(`Missing existing 30.4 fixture: ${id}`);
  return found;
};
const incomplete = from('insufficient');
const variable = from('provisional');
const outside = from('outside');
const epochPeriod = (key: string, epoch: string, value: number): MysteryEvidenceInput => ({
  kind: 'DETECTION', observationKey: key, campaignKey: 'RADIO-PERIOD-CAMPAIGN',
  epochKey: epoch, componentKey: 'CORE', band: 'RADIO', observable: 'PERIOD_S',
  value, sigmaMinus: .001, sigmaPlus: .001,
});

export interface MysteryUnresolvedLabCase {
  readonly id: string;
  readonly label: string;
  readonly title: string;
  readonly description: string;
  readonly subject: UnclassifiedSource | UnknownPhenomenon;
  readonly initial: readonly MysteryEvidenceInput[];
  readonly later: readonly MysteryEvidenceInput[];
  readonly closeScope: MysteryClosureScope;
}

export const MYSTERY_UNRESOLVED_CASES: readonly MysteryUnresolvedLabCase[] = Object.freeze([
  {
    id: 'insufficient', label: 'Datos insuficientes', title: 'No hay información discriminante suficiente',
    description: 'Una detección radio, un límite óptico y una ausencia de rayos X no identifican una clase.',
    subject: incomplete.subject, initial: incomplete.initial, later: [], closeScope: 'CURRENT_CAMPAIGN',
  },
  {
    id: 'subdetermined', label: 'Subdeterminado', title: 'Dos firmas observacionales compatibles',
    description: 'El mismo conjunto contiene variabilidad y periodicidad radio: no se elige arbitrariamente una firma única, ni un progenitor físico.',
    subject: variable.subject,
    initial: [
      ...variable.initial,
      epochPeriod('SUBDET-PERIOD-A', 'OBS-WINDOW-1', .728),
      epochPeriod('SUBDET-PERIOD-B', 'OBS-WINDOW-2', .7285),
    ], later: [], closeScope: 'CURRENT_CAMPAIGN',
  },
  {
    id: 'taxonomy', label: 'Fuera de reglas', title: 'Firma medible sin regla 30.4 aplicable',
    description: 'Existe una detección significativa de rayos X, pero la taxonomía observacional actual solo evalúa variabilidad y periodicidad de radio. No significa física nueva.',
    subject: outside.subject, initial: outside.initial, later: [],
    closeScope: 'CURRENT_OBSERVATIONAL_TAXONOMY',
  },
  {
    id: 'closed', label: 'Cerrar investigación', title: 'Caso no resuelto en una campaña finalizada',
    description: 'Cerrar un expediente de observación es válido; no afirma que la fuente sea incognoscible para siempre.',
    subject: incomplete.subject, initial: incomplete.initial, later: [], closeScope: 'CURRENT_CAMPAIGN',
  },
  {
    id: 'reopened', label: 'Nueva evidencia', title: 'Una observación posterior reabre el expediente',
    description: 'Se conserva el cierre anterior como historial, pero nuevos datos cambian la revisión activa.',
    subject: incomplete.subject, initial: incomplete.initial,
    later: [{ kind: 'DETECTION', observationKey: 'AFTER-CLOSURE-OBS', campaignKey: 'LATER-CAMPAIGN',
      epochKey: 'LATER-EPOCH', componentKey: 'CORE', band: 'INFRARED',
      observable: 'ENERGY_FLUX_W_M2', value: .000004, sigmaMinus: .0000002, sigmaPlus: .0000003 }],
    closeScope: 'CURRENT_CAMPAIGN',
  },
  {
    id: 'classified', label: 'Clase observacional', title: 'Una firma clasificada aún no revela la naturaleza física',
    description: '30.4 ya justifica «fuente variable de radio», por lo que no debe etiquetarse como expediente observacionalmente sin clasificar.',
    subject: variable.subject, initial: variable.initial, later: [], closeScope: 'CURRENT_CAMPAIGN',
  },
]);
