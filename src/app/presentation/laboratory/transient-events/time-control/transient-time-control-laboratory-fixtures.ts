import type { TransientScheduledProjection } from '../../../../domain/transient/transient-time-control-profile';
import { TRANSIENT_FOLLOW_UP_LABORATORY_CASES } from '../follow-up/transient-follow-up-laboratory-fixtures';

export interface TransientTimeControlLaboratoryCase {
  readonly id: string;
  readonly label: string;
  readonly explanation: string;
  readonly scheduled: readonly TransientScheduledProjection[];
}
const previous = TRANSIENT_FOLLOW_UP_LABORATORY_CASES;
function fromPrevious(id: string, onset: number | null, due: number | null): TransientScheduledProjection {
  const fixture = previous.find(item => item.id === id);
  if (!fixture) throw new RangeError(`Missing canonical 29.10 fixture: ${id}`);
  return Object.freeze({ id: fixture.assessment.id, assessment: fixture.assessment,
    sourceOnsetSimulationSeconds: onset, dueSimulationSeconds: due });
}
const nova = fromPrevious('nova', 20, null);
const kilo = fromPrevious('kilonova', 20, null);
const grb = fromPrevious('grb', 20, null);
const frb = fromPrevious('frb', 20, null);
const flare = fromPrevious('flare', 20, null);
const tde = fromPrevious('tde', 20, null);
const statistical = fromPrevious('statistics', null, null);
const candidate = fromPrevious('optical', null, null);
const messenger = fromPrevious('multimessenger', null, null);
const futureYears = previous.find(item => item.id === 'future-merger')!.assessment.forecastDelayYears!;
/** Explicit reference: t=0 is the stellar canonical age in the lab, NOT UTC. */
const future = fromPrevious('future-merger', null, futureYears * 365.25 * 86400);

/** All scheduled references remain read-only and deterministic, never events of the player's galaxy. */
export const TRANSIENT_TIME_CONTROL_LABORATORY_CASES: readonly TransientTimeControlLaboratoryCase[] = Object.freeze([
  { id: 'nova', label: 'Nova', explanation: 'Avance y rebobinado de hitos derivados de la nova de 29.2, sin fotometría observada.', scheduled: [nova] },
  { id: 'kilonova', label: 'Kilonova', explanation: 'Los picos azul y rojo de 29.3 se atraviesan solo al avanzar la simulación.', scheduled: [kilo] },
  { id: 'grb', label: 'GRB largo', explanation: 'Breakout y apagado proceden del modelo 29.7: no son un T90 medido.', scheduled: [grb] },
  { id: 'frb', label: 'FRB', explanation: 'Un burst individual no recibe recurrencias ni periodos desde el reloj.', scheduled: [frb] },
  { id: 'flare', label: 'Llamarada', explanation: 'Una llamarada explícita evoluciona por duración; su tasa media nunca agenda la siguiente.', scheduled: [flare] },
  { id: 'tde', label: 'TDE', explanation: 'Fallback de referencia ≠ curva de luminosidad observada.', scheduled: [tde] },
  { id: 'future', label: 'Fusión futura', explanation: 'La predicción canónica de 29.4, incluso vencida, sigue sin ser una detección o evento confirmado.', scheduled: [future] },
  { id: 'statistical', label: 'Solo estadística', explanation: 'Sin evento individual no se fabrican hitos ni nuevas llamaradas.', scheduled: [statistical] },
  { id: 'candidate', label: 'Señal óptica', explanation: 'El tiempo del observador no se transforma en tiempo fuente ni en época terrestre.', scheduled: [candidate] },
  { id: 'multimessenger', label: 'Multimensajero', explanation: 'Las dos observaciones siguen en su propio marco; no crean contrapartes ni progenitores.', scheduled: [messenger] },
  { id: 'combined', label: 'Conjunto', explanation: 'Proyección simultánea, independiente del orden y sin escritura de la partida.', scheduled: [nova, kilo, grb, frb, flare, tde, future, statistical, candidate, messenger] },
]);
