import type { MysteryOriginScopeKind } from './mystery-observational-subject';
import type {
  MysteryBand, MysteryEvidenceInput, MysteryObservable,
} from './mystery-observational-evidence';

/** 30.3: an instrument capability is an explicit observation contract, not a Ground Truth resolver. */
export type MysteryObservationKind =
  | 'SPECTROSCOPY' | 'NEW_BAND' | 'MULTIBAND_CAMPAIGN'
  | 'ASTROMETRY' | 'TEMPORAL_FOLLOW_UP';

export interface MysteryInstrumentMode {
  readonly kind: MysteryObservationKind;
  readonly bands: readonly MysteryBand[];
  readonly observables: readonly MysteryObservable[];
  /** Exposure budget of the individual observational request, in seconds. */
  readonly maximumExposureSeconds: number;
}

export interface MysteryInstrument {
  readonly id: string;
  readonly operational: boolean;
  readonly reachableScopes: readonly MysteryOriginScopeKind[];
  readonly modes: readonly MysteryInstrumentMode[];
}

export interface MysteryObservationRequest {
  readonly id: string;
  readonly subjectId: string;
  readonly instrumentId: string;
  readonly kind: MysteryObservationKind;
  /** One or more bands. A multi-band campaign must request at least two. */
  readonly bands: readonly MysteryBand[];
  readonly observables: readonly MysteryObservable[];
  readonly campaignKey: string;
  readonly epochKey: string;
  readonly componentKey: string;
  readonly exposureSeconds: number;
}

export type MysteryActionBlockReason =
  | 'INSTRUMENT_UNAVAILABLE' | 'OUTSIDE_POINTING_SCOPE'
  | 'MODE_UNSUPPORTED' | 'BAND_UNSUPPORTED'
  | 'MEASUREMENT_UNSUPPORTED' | 'EXPOSURE_EXCEEDS_CAPACITY';

export type MysteryObservationPlan = Readonly<{
  request: MysteryObservationRequest;
  status: 'AVAILABLE' | 'BLOCKED';
  reason: MysteryActionBlockReason | null;
}>;

/** Only an explicit observation packet can produce a new record. No synthetic measurement generator. */
export interface MysteryAcquisitionPacket {
  readonly requestId: string;
  /** Same action, same packet -> identical result. Different payload for same action -> rejected. */
  readonly evidence: readonly MysteryEvidenceInput[];
}

export interface MysteryObservationRun {
  readonly requestId: string;
  readonly packet: MysteryAcquisitionPacket;
}

export interface MysteryActionResult {
  readonly assessment: import('./mystery-observational-evidence').MysteryEvidenceAssessment;
  readonly completedActionIds: readonly string[];
  readonly availableCount: number;
  readonly blockedCount: number;
  readonly classificationChanged: false;
  readonly persistedEvents: 0;
  readonly awardedPD: 0;
}
