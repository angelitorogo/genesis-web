import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils.js';
import {
  UnclassifiedSource, UnknownPhenomenon,
} from '../../domain/mystery/mystery-observational-subject';
import type {
  MysteryBand, MysteryEvidenceAssessment, MysteryEvidenceInput,
  MysteryObservedEvidence, MysteryObservable, MysteryApparentTension,
  MysteryMissingReason,
} from '../../domain/mystery/mystery-observational-evidence';

const DOMAIN = 'GENESIS-30.2-EVIDENCE-V1';
const KEY = /^[A-Za-z0-9_.:/-]{1,128}$/;
const BANDS: readonly MysteryBand[] = [
  'RADIO', 'MICROWAVE', 'INFRARED', 'OPTICAL', 'ULTRAVIOLET',
  'X_RAY', 'GAMMA_RAY', 'GRAVITATIONAL_WAVE', 'UNRESOLVED',
];
const OBSERVABLES: readonly MysteryObservable[] = [
  'FLUX_DENSITY_JY', 'ENERGY_FLUX_W_M2', 'FREQUENCY_HZ',
  'DURATION_S', 'PERIOD_S', 'ANGULAR_OFFSET_ARCSEC',
  'RADIAL_VELOCITY_M_S', 'POLARIZATION_FRACTION',
  'DIMENSIONLESS_RATIO', 'STRAIN',
];
const REASONS: readonly MysteryMissingReason[] = [
  'NOT_MEASURED', 'INSUFFICIENT_SENSITIVITY',
  'OUTSIDE_COVERAGE', 'NOT_RESOLVED',
];

/** Pure read-only reduction of explicitly supplied observations. */
export class MysteryEvidenceEngine {
  private constructor() {}

  static assess(
    subject: UnclassifiedSource | UnknownPhenomenon,
    rawEvidence: readonly MysteryEvidenceInput[],
  ): MysteryEvidenceAssessment {
    if (!(subject instanceof UnclassifiedSource) && !(subject instanceof UnknownPhenomenon)) {
      throw new TypeError('30.2 requires a genuine 30.1 observational identity.');
    }
    if (!Array.isArray(rawEvidence) || rawEvidence.length > 256) {
      throw new RangeError('30.2 accepts up to 256 explicit evidence entries per assessment.');
    }
    const byKey = new Map<string, MysteryObservedEvidence>();
    for (const raw of rawEvidence) {
      const item = normalize(subject.id, raw);
      const existing = byKey.get(item.id);
      if (existing && JSON.stringify(existing) !== JSON.stringify(item)) {
        throw new RangeError('One observation identity cannot carry contradictory measurement payloads.');
      }
      byKey.set(item.id, item);
    }
    const evidence = Object.freeze([...byKey.values()].sort((a, b) => asciiCompare(a.id, b.id)));
    const tensions: MysteryApparentTension[] = [];
    // Different epochs, spectral components, observables or bands are not comparable.
    const detected = evidence.filter((e): e is Extract<MysteryObservedEvidence, { kind: 'DETECTION' }> => e.kind === 'DETECTION');
    for (let i = 0; i < detected.length; i++) {
      const a = detected[i];
      for (let j = i + 1; j < detected.length; j++) {
        const b = detected[j];
        if (a.observable !== b.observable || a.band !== b.band ||
            a.epochKey !== b.epochKey || a.componentKey !== b.componentKey) continue;
        const aLow = a.value - 2 * a.sigmaMinus;
        const aHigh = a.value + 2 * a.sigmaPlus;
        const bLow = b.value - 2 * b.sigmaMinus;
        const bHigh = b.value + 2 * b.sigmaPlus;
        if (aHigh < bLow || bHigh < aLow) {
          tensions.push(Object.freeze({
            kind: 'APPARENT_INTERVAL_TENSION',
            evidenceIds: Object.freeze([a.id, b.id]) as readonly [string, string],
            observable: a.observable, band: a.band,
            epochKey: a.epochKey, componentKey: a.componentKey,
            comparisonSigma: 2,
          }));
        }
      }
    }
    const frozenTensions = Object.freeze(tensions.sort((a, b) =>
      asciiCompare(a.evidenceIds[0], b.evidenceIds[0]) ||
      asciiCompare(a.evidenceIds[1], b.evidenceIds[1])));
    const detections = detected.length;
    const upperLimits = evidence.filter(item => item.kind === 'UPPER_LIMIT').length;
    const missing = evidence.length - detections - upperLimits;
    return Object.freeze({
      subject: subject.toObservedRecord(), evidence, tensions: frozenTensions,
      summary: Object.freeze({
        total: evidence.length, detections, upperLimits, missing,
        apparentTensions: frozenTensions.length,
        // No exhaustive survey contract exists in 30.2: even all detections are partial evidence.
        partial: true,
        classificationChanged: false as const,
      }),
    });
  }
}

/** Locale-independent ordering for cross-browser/seed replay. */
function asciiCompare(a: string, b: string): number {
  return a === b ? 0 : a < b ? -1 : 1;
}

function stableKey(value: string, field: string): string {
  if (typeof value !== 'string' || !KEY.test(value)) {
    throw new RangeError(`Invalid 30.2 ${field}; use a stable explicit observation key.`);
  }
  return value.toUpperCase();
}

function number(value: number, field: string, strictlyPositive = false): number {
  if (typeof value !== 'number' || !Number.isFinite(value) ||
      (strictlyPositive ? value <= 0 : value < 0)) {
    throw new RangeError(`Invalid 30.2 ${field}.`);
  }
  return value;
}

function normalize(subjectId: string, input: MysteryEvidenceInput): MysteryObservedEvidence {
  if (!input || typeof input !== 'object') throw new TypeError('A real evidence record is required.');
  const observationKey = stableKey(input.observationKey, 'observationKey');
  const campaignKey = stableKey(input.campaignKey, 'campaignKey');
  const epochKey = stableKey(input.epochKey, 'epochKey');
  const componentKey = stableKey(input.componentKey, 'componentKey');
  if (!BANDS.includes(input.band) || !OBSERVABLES.includes(input.observable)) {
    throw new RangeError('Unsupported band/observable; quantities and units must be explicit.');
  }
  const id = `EVD30-${bytesToHex(sha256(utf8ToBytes(JSON.stringify([
    DOMAIN, subjectId, observationKey,
  ]))).slice(0, 16)).toUpperCase()}`;
  const common = { id, observationKey, campaignKey, epochKey, componentKey,
    band: input.band, observable: input.observable };
  if (input.kind === 'DETECTION') {
    // Radial velocity and strain may legitimately be signed.
    const signed = input.observable === 'RADIAL_VELOCITY_M_S' || input.observable === 'STRAIN';
    const value = signed && typeof input.value === 'number' && Number.isFinite(input.value)
      ? input.value : number(input.value, 'value');
    const sigmaMinus = number(input.sigmaMinus, 'sigmaMinus', true);
    const sigmaPlus = number(input.sigmaPlus, 'sigmaPlus', true);
    if (!Number.isFinite(value - 2 * sigmaMinus) || !Number.isFinite(value + 2 * sigmaPlus)) {
      throw new RangeError('Measurement interval must remain finite.');
    }
    if (input.observable === 'POLARIZATION_FRACTION' && (value > 1 || value < 0)) {
      throw new RangeError('Polarization fraction must lie in [0, 1].');
    }
    return Object.freeze({ ...common, kind: 'DETECTION', value, sigmaMinus, sigmaPlus });
  }
  if (input.kind === 'UPPER_LIMIT') {
    const limit = number(input.limit, 'limit');
    const thresholdSigma = number(input.thresholdSigma, 'thresholdSigma', true);
    return Object.freeze({ ...common, kind: 'UPPER_LIMIT', limit, thresholdSigma });
  }
  if (input.kind === 'MISSING' && REASONS.includes(input.reason)) {
    return Object.freeze({ ...common, kind: 'MISSING', reason: input.reason });
  }
  throw new RangeError('Unsupported evidence type or absence reason.');
}
