import {
  TransientFollowUpClassification as Classification,
  TransientFollowUpFamily as Family,
  TransientFollowUpOrigin as Origin,
  TransientObservationSignature as Signature,
  TransientTemporalPhase as Phase,
  type TransientFollowUpAssessment,
  type TransientFollowUpClassification,
  type TransientFollowUpFamily,
  type TransientFollowUpInput,
  type TransientExplicitObservation,
  type TransientModelMilestone,
} from '../../domain/transient/transient-follow-up-profile';

const COMPATIBLE_BY_SIGNATURE: Readonly<Record<Signature, readonly TransientFollowUpFamily[]>> = {
  [Signature.OPTICAL_BRIGHTENING]: [Family.SUPERNOVA, Family.NOVA, Family.KILONOVA, Family.TIDAL_DISRUPTION, Family.STELLAR_FLARE],
  [Signature.SUPERNOVA_SPECTRUM]: [Family.SUPERNOVA],
  [Signature.NOVA_SPECTRUM]: [Family.NOVA],
  [Signature.RED_BLUE_KILONOVA]: [Family.KILONOVA],
  [Signature.GW_CHIRP]: [Family.COMPACT_MERGER, Family.GRAVITATIONAL_WAVE],
  [Signature.GAMMA_PROMPT]: [Family.GAMMA_RAY_BURST],
  [Signature.RADIO_MILLISECOND_PULSE]: [Family.FAST_RADIO_BURST],
  [Signature.TIDAL_SPECTRAL_SIGNATURE]: [Family.TIDAL_DISRUPTION],
  [Signature.STELLAR_MAGNETIC_FLARE]: [Family.STELLAR_FLARE],
};

const familyOrder = Object.values(Family);

/**
 * 29.10: never mixes observer-frame samples with source-frame model milestones.
 * A matching signature produces compatibility only; neither a canonical
 * progenitor nor an observed physical event is synthesized.
 */
export class TransientFollowUpEngine {
  private constructor() {}

  static characterize(source: TransientFollowUpInput): TransientFollowUpAssessment {
    validate(source);
    const modelMilestones = Object.freeze(
      [...source.modelMilestones].sort((a, b) => a.timeAfterOnsetSeconds - b.timeAfterOnsetSeconds || a.id.localeCompare(b.id)),
    );
    const observations = Object.freeze(
      [...source.observations].sort((a, b) => a.timeAfterObserverReferenceSeconds - b.timeAfterObserverReferenceSeconds || a.id.localeCompare(b.id)),
    );
    const compatible = new Set<TransientFollowUpFamily>();
    for (const observation of observations) {
      for (const family of COMPATIBLE_BY_SIGNATURE[observation.signature]) compatible.add(family);
    }
    const compatibleFamilies = Object.freeze(familyOrder.filter(value => compatible.has(value)));
    const classification = classify(source, compatibleFamilies);
    return Object.freeze({
      id: source.id,
      family: source.family,
      classification,
      modelMilestones,
      observations,
      compatibleFamilies,
      forecastDelayYears: source.forecastDelayYears,
      observedEpoch: null,
      luminosityDistanceParsec: null,
      observerToSourceTimeConversion: null,
      inventedEventCount: 0 as const,
    });
  }

  /** A source-frame phase may advance only at an EXPLICITLY modeled milestone. */
  static modelPhaseAt(profile: TransientFollowUpAssessment, seconds: number): TransientModelMilestone | null {
    assertNonNegative(seconds, 'source-frame evaluation time');
    let result: TransientModelMilestone | null = null;
    for (const item of profile.modelMilestones) {
      if (item.timeAfterOnsetSeconds > seconds) break;
      result = item;
    }
    return result;
  }
}

function classify(
  source: TransientFollowUpInput,
  candidates: readonly TransientFollowUpFamily[],
): TransientFollowUpClassification {
  switch (source.origin) {
    case Origin.CANONICAL_FUTURE: return Classification.CANONICAL_FUTURE;
    case Origin.INTRINSIC_EXPLICIT: return source.observations.length
      ? Classification.INTRINSIC_WITH_OBSERVATIONS : Classification.INTRINSIC_ONLY;
    case Origin.PROGENITOR_ONLY: return Classification.PROGENITOR_ONLY;
    case Origin.STATISTICAL_ONLY: return Classification.STATISTICAL_ONLY;
    case Origin.NOT_APPLICABLE: return Classification.NOT_APPLICABLE;
    case Origin.OBSERVATIONAL_CANDIDATE:
      return candidates.length === 1 || source.observations.some(item => item.signature !== Signature.OPTICAL_BRIGHTENING)
        ? Classification.OBSERVATION_COMPATIBLE
        : Classification.OBSERVATION_AMBIGUOUS;
  }
}

function validate(input: TransientFollowUpInput): void {
  if (typeof input.id !== 'string' || !input.id.trim()) throw new RangeError('29.10 requires a non-blank source identity.');
  if (!Object.values(Family).includes(input.family)) throw new RangeError('Unknown 29.10 family.');
  if (!Object.values(Origin).includes(input.origin)) throw new RangeError('Unknown 29.10 provenance.');
  if (!Array.isArray(input.modelMilestones) || !Array.isArray(input.observations)) {
    throw new RangeError('29.10 requires explicit timeline arrays.');
  }
  const isFuture = input.origin === Origin.CANONICAL_FUTURE;
  if (input.forecastDelayYears !== null && (!isFuture || !Number.isFinite(input.forecastDelayYears) || input.forecastDelayYears <= 0)) {
    throw new RangeError('Only canonical future events can carry a finite positive time-to-event.');
  }
  if (isFuture && input.forecastDelayYears === null) throw new RangeError('Future canonical events require a time-to-event.');
  if (isFuture && (input.observations.length || input.modelMilestones.length)) {
    throw new RangeError('A future canonical merger is not an observed or completed merger.');
  }
  if (input.origin === Origin.OBSERVATIONAL_CANDIDATE) {
    if (input.family !== Family.UNKNOWN || !input.observations.length || input.modelMilestones.length) {
      throw new RangeError('A purely observational candidate has unknown source, explicit evidence and no source model.');
    }
  } else if (input.family === Family.UNKNOWN) throw new RangeError('Unresolved observation candidates must use the UNKNOWN family.');
  const noPhysicalEvent = [Origin.PROGENITOR_ONLY, Origin.STATISTICAL_ONLY, Origin.NOT_APPLICABLE];
  if ((noPhysicalEvent as readonly string[]).includes(input.origin)) {
    if (input.modelMilestones.length || input.observations.length) {
      throw new RangeError('A progenitor/statistical/non-applicable case cannot fabricate an event timeline.');
    }
  }
  if (input.origin === Origin.INTRINSIC_EXPLICIT && !input.modelMilestones.length) {
    throw new RangeError('An intrinsic event requires at least one source-model milestone.');
  }
  checkUnique(input.modelMilestones, item => item.id, 'model');
  checkUnique(input.observations, item => item.id, 'observation');
  for (const item of input.modelMilestones) validateMilestone(item);
  for (const item of input.observations) validateObservation(item);
}

function checkUnique<T>(items: readonly T[], id: (item: T) => string, kind: string): void {
  if (new Set(items.map(id)).size !== items.length) throw new RangeError(`Duplicate 29.10 ${kind} identifiers.`);
}
function assertNonNegative(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0) throw new RangeError(`29.10 ${label} must be finite and nonnegative.`);
}
function validateMilestone(item: TransientModelMilestone): void {
  if (!item.id?.trim() || !item.label?.trim() || !Object.values(Phase).includes(item.phase)) throw new RangeError('Invalid 29.10 model milestone.');
  assertNonNegative(item.timeAfterOnsetSeconds, 'model time');
}
function validateObservation(item: TransientExplicitObservation): void {
  if (!item.id?.trim() || !item.label?.trim() || !Object.values(Signature).includes(item.signature)) throw new RangeError('Invalid 29.10 explicit observation.');
  assertNonNegative(item.timeAfterObserverReferenceSeconds, 'observer time');
}
