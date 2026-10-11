import { UnclassifiedSource, UnknownPhenomenon } from '../../domain/mystery/mystery-observational-subject';
import type {
  MysteryEvidenceInput, MysteryObservable, MysteryBand,
} from '../../domain/mystery/mystery-observational-evidence';
import type {
  MysteryInstrument, MysteryObservationRequest,
  MysteryObservationPlan, MysteryObservationRun, MysteryAcquisitionPacket,
  MysteryActionResult, MysteryActionBlockReason, MysteryObservationKind,
} from '../../domain/mystery/mystery-observation-action';
import { MysteryEvidenceEngine } from './mystery-evidence-engine';

const KEY = /^[A-Za-z0-9_.:/-]{1,128}$/;
const KINDS: readonly MysteryObservationKind[] = [
  'SPECTROSCOPY', 'NEW_BAND', 'MULTIBAND_CAMPAIGN', 'ASTROMETRY', 'TEMPORAL_FOLLOW_UP',
];
const BANDS: readonly MysteryBand[] = [
  'RADIO', 'MICROWAVE', 'INFRARED', 'OPTICAL', 'ULTRAVIOLET',
  'X_RAY', 'GAMMA_RAY', 'GRAVITATIONAL_WAVE', 'UNRESOLVED',
];
const OBSERVABLES: readonly MysteryObservable[] = [
  'FLUX_DENSITY_JY', 'ENERGY_FLUX_W_M2', 'FREQUENCY_HZ', 'DURATION_S',
  'PERIOD_S', 'ANGULAR_OFFSET_ARCSEC', 'RADIAL_VELOCITY_M_S',
  'POLARIZATION_FRACTION', 'DIMENSIONLESS_RATIO', 'STRAIN',
];

function sortAscii(a: string, b: string): number { return a === b ? 0 : a < b ? -1 : 1; }
function stableKey(value: string, label: string): string {
  if (typeof value !== 'string' || !KEY.test(value)) throw new RangeError(`Invalid 30.3 ${label}.`);
  return value.toUpperCase();
}
function assertFinitePositive(value: number, label: string): void {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    throw new RangeError(`30.3 ${label} must be finite and strictly positive.`);
  }
}
function checkedValues<T extends string>(values: readonly T[], known: readonly T[], label: string): readonly T[] {
  if (!Array.isArray(values) || !values.length || values.length > 12 ||
      values.some(v => !known.includes(v)) || new Set(values).size !== values.length) {
    throw new RangeError(`Invalid 30.3 ${label}.`);
  }
  return Object.freeze([...values]);
}
function validateRequest(request: MysteryObservationRequest): void {
  if (!request || typeof request !== 'object') throw new TypeError('Explicit action required.');
  for (const [key, val] of [
    ['id', request.id], ['instrumentId', request.instrumentId],
    ['campaignKey', request.campaignKey], ['epochKey', request.epochKey],
    ['componentKey', request.componentKey],
  ] as const) stableKey(val, key);
  if (!/^(?:UCS30|UPH30)-[A-F0-9]{32}$/.test(request.subjectId)) {
    throw new RangeError('Action must target the original opaque observational identity.');
  }
  if (!KINDS.includes(request.kind)) throw new RangeError('Unsupported scientific action.');
  checkedValues(request.bands, BANDS, 'bands');
  checkedValues(request.observables, OBSERVABLES, 'observables');
  if (request.bands.includes('UNRESOLVED')) throw new RangeError('An instrument must request a known observing band.');
  if ((request.kind === 'MULTIBAND_CAMPAIGN') !== (request.bands.length > 1)) {
    throw new RangeError('Only a multiband campaign may request more than one band.');
  }
  if (request.kind === 'ASTROMETRY' && !request.observables.includes('ANGULAR_OFFSET_ARCSEC')) {
    throw new RangeError('An astrometric request needs an angular observable.');
  }
  assertFinitePositive(request.exposureSeconds, 'exposureSeconds');
}
function validateInstruments(instruments: readonly MysteryInstrument[]): ReadonlyMap<string, MysteryInstrument> {
  if (!Array.isArray(instruments) || instruments.length > 64) throw new RangeError('Invalid instrument registry.');
  const registry = new Map<string, MysteryInstrument>();
  for (const instrument of instruments) {
    if (!instrument || typeof instrument.operational !== 'boolean') throw new RangeError('Invalid instrument.');
    const id = stableKey(instrument.id, 'instrument id');
    if (registry.has(id)) throw new RangeError('Duplicate instrument id.');
    if (!Array.isArray(instrument.reachableScopes) || !Array.isArray(instrument.modes)) {
      throw new RangeError('Instrument capabilities must be explicit.');
    }
    for (const mode of instrument.modes) {
      if (!KINDS.includes(mode.kind)) throw new RangeError('Unknown instrument mode.');
      checkedValues(mode.bands, BANDS, 'mode bands');
      checkedValues(mode.observables, OBSERVABLES, 'mode observables');
      assertFinitePositive(mode.maximumExposureSeconds, 'maximum exposure');
    }
    registry.set(id, instrument);
  }
  return registry;
}
function blockedReason(
  request: MysteryObservationRequest, instrument: MysteryInstrument | undefined,
  scopeKind: string,
): MysteryActionBlockReason | null {
  if (!instrument || !instrument.operational) return 'INSTRUMENT_UNAVAILABLE';
  if (!instrument.reachableScopes.includes(scopeKind as never)) return 'OUTSIDE_POINTING_SCOPE';
  const modes = instrument.modes.filter(mode => mode.kind === request.kind);
  if (modes.length === 0) return 'MODE_UNSUPPORTED';
  const supportingBands = modes.filter(mode => request.bands.every(band => mode.bands.includes(band)));
  if (supportingBands.length === 0) return 'BAND_UNSUPPORTED';
  const supportingQuantities = supportingBands.filter(mode =>
    request.observables.every(observable => mode.observables.includes(observable)));
  if (supportingQuantities.length === 0) return 'MEASUREMENT_UNSUPPORTED';
  if (!supportingQuantities.some(mode => request.exposureSeconds <= mode.maximumExposureSeconds)) {
    return 'EXPOSURE_EXCEEDS_CAPACITY';
  }
  return null;
}

/** No canonical association, randomness, wall clock, database or hidden classification is consulted. */
export class MysteryObservationActionEngine {
  private constructor() {}

  static plan(
    subject: UnclassifiedSource | UnknownPhenomenon,
    instruments: readonly MysteryInstrument[],
    requests: readonly MysteryObservationRequest[],
  ): readonly MysteryObservationPlan[] {
    if (!(subject instanceof UnclassifiedSource) && !(subject instanceof UnknownPhenomenon)) {
      throw new TypeError('A 30.1 mystery subject is required.');
    }
    if (!Array.isArray(requests) || requests.length > 64) throw new RangeError('Too many observing actions.');
    const registry = validateInstruments(instruments);
    const keys = new Set<string>();
    const plans = requests.map(request => {
      validateRequest(request);
      if (request.subjectId !== subject.id) throw new RangeError('Action belongs to another mystery.');
      const id = stableKey(request.id, 'action id');
      if (keys.has(id)) throw new RangeError('Duplicate action key.');
      keys.add(id);
      const reason = blockedReason(request, registry.get(stableKey(request.instrumentId, 'instrument id')), subject.scope.kind);
      return Object.freeze({ request, status: reason ? 'BLOCKED' : 'AVAILABLE', reason } as const);
    });
    return Object.freeze(plans.sort((a, b) => sortAscii(a.request.id, b.request.id)));
  }

  /**
   * Executes only explicitly acquired measurements. In particular, an available
   * instrument NEVER synthesizes a signal, detection or Ground Truth class.
   * Observing again replays the identical action result; a changed payload is an error.
   */
  static evaluate(
    subject: UnclassifiedSource | UnknownPhenomenon,
    originalEvidence: readonly MysteryEvidenceInput[],
    instruments: readonly MysteryInstrument[],
    requests: readonly MysteryObservationRequest[],
    runs: readonly MysteryObservationRun[],
  ): MysteryActionResult {
    const plans = this.plan(subject, instruments, requests);
    if (!Array.isArray(runs) || runs.length > 64) throw new RangeError('Too many action executions.');
    const planMap = new Map(plans.map(plan => [plan.request.id, plan]));
    if (planMap.size !== plans.length || plans.some(plan => plan.request.subjectId !== subject.id)) {
      throw new RangeError('Invalid plan set or mystery subject.');
    }
    const byAction = new Map<string, MysteryAcquisitionPacket>();
    for (const run of runs) {
      const plan = planMap.get(run.requestId);
      if (!plan || plan.status !== 'AVAILABLE') throw new RangeError('Cannot execute an unavailable observation.');
      const packet = run.packet;
      if (!packet || packet.requestId !== plan.request.id ||
          !Array.isArray(packet.evidence) || packet.evidence.length > 16) {
        throw new RangeError('Missing or invalid explicit acquisition packet.');
      }
      packet.evidence.forEach((record: MysteryEvidenceInput, index: number) => {
        const expected = `${plan.request.id}-R${index + 1}`;
        if (record.observationKey !== expected ||
            record.campaignKey !== plan.request.campaignKey ||
            record.epochKey !== plan.request.epochKey ||
            (record.componentKey !== plan.request.componentKey &&
              !record.componentKey.startsWith(`${plan.request.componentKey}-`)) ||
            !plan.request.bands.includes(record.band) ||
            !plan.request.observables.includes(record.observable)) {
          throw new RangeError('Acquired evidence does not belong to the authorized action/epoch/band.');
        }
      });
      const existing = byAction.get(run.requestId);
      if (existing && JSON.stringify(existing.evidence) !== JSON.stringify(packet.evidence)) {
        throw new RangeError('An observation replay cannot change its acquired measurements.');
      }
      byAction.set(run.requestId, packet);
    }
    const completedActionIds = Object.freeze([...byAction.keys()].sort(sortAscii));
    const evidence: MysteryEvidenceInput[] = [...originalEvidence];
    for (const actionId of completedActionIds) evidence.push(...byAction.get(actionId)!.evidence);
    return Object.freeze({
      assessment: MysteryEvidenceEngine.assess(subject, evidence),
      completedActionIds,
      availableCount: plans.filter(plan => plan.status === 'AVAILABLE').length,
      blockedCount: plans.filter(plan => plan.status === 'BLOCKED').length,
      classificationChanged: false as const,
      persistedEvents: 0 as const,
      awardedPD: 0 as const,
    });
  }
}
