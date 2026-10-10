/**
 * 30.2: observed values are not a classification, nor a canonical-source truth.
 * 30.7 will enrich acquisition provenance and reliability; comparison here is
 * deliberately restricted to explicitly commensurable, co-epoch measurements.
 */
import type {
  ObservedUnclassifiedSource,
  ObservedUnknownPhenomenon,
} from './mystery-observational-subject';

/** Each observable encodes its unit, so numerical comparison cannot mix units. */
export type MysteryObservable =
  | 'FLUX_DENSITY_JY'
  | 'ENERGY_FLUX_W_M2'
  | 'FREQUENCY_HZ'
  | 'DURATION_S'
  | 'PERIOD_S'
  | 'ANGULAR_OFFSET_ARCSEC'
  | 'RADIAL_VELOCITY_M_S'
  | 'POLARIZATION_FRACTION'
  | 'DIMENSIONLESS_RATIO'
  | 'STRAIN';

export type MysteryBand =
  | 'RADIO' | 'MICROWAVE' | 'INFRARED' | 'OPTICAL'
  | 'ULTRAVIOLET' | 'X_RAY' | 'GAMMA_RAY' | 'GRAVITATIONAL_WAVE'
  | 'UNRESOLVED';

/**
 * An epoch comparison tag is supplied by the observational campaign.
 * Different epochs are *not* a physical contradiction: transients can evolve.
 */
export interface MysteryObservationContext {
  readonly observationKey: string;
  readonly campaignKey: string;
  readonly epochKey: string;
  readonly componentKey: string;
  readonly band: MysteryBand;
  readonly observable: MysteryObservable;
}

export type MysteryMissingReason =
  | 'NOT_MEASURED' | 'INSUFFICIENT_SENSITIVITY'
  | 'OUTSIDE_COVERAGE' | 'NOT_RESOLVED';

export type MysteryEvidenceInput =
  | (MysteryObservationContext & {
      readonly kind: 'DETECTION';
      readonly value: number;
      /** One-sigma uncertainties; positive and asymmetric if necessary. */
      readonly sigmaMinus: number;
      readonly sigmaPlus: number;
    })
  | (MysteryObservationContext & {
      readonly kind: 'UPPER_LIMIT';
      readonly limit: number;
      /** Detection threshold explicitly provided by the observer. */
      readonly thresholdSigma: number;
    })
  | (MysteryObservationContext & {
      readonly kind: 'MISSING';
      readonly reason: MysteryMissingReason;
    });

export type MysteryObservedEvidence = MysteryEvidenceInput & { readonly id: string };

/** A non-overlap is a candidate for follow-up, NOT a proven physical impossibility. */
export interface MysteryApparentTension {
  readonly kind: 'APPARENT_INTERVAL_TENSION';
  readonly evidenceIds: readonly [string, string];
  readonly observable: MysteryObservable;
  readonly band: MysteryBand;
  readonly epochKey: string;
  readonly componentKey: string;
  readonly comparisonSigma: 2;
}

export interface MysteryEvidenceSummary {
  readonly total: number;
  readonly detections: number;
  readonly upperLimits: number;
  readonly missing: number;
  readonly apparentTensions: number;
  /** Coverage completeness is never claimed by a finite 30.2 evidence set. */
  readonly partial: boolean;
  /** Model remains unclassified regardless of this evidence. */
  readonly classificationChanged: false;
}

export interface MysteryEvidenceAssessment {
  readonly subject: ObservedUnclassifiedSource | ObservedUnknownPhenomenon;
  readonly evidence: readonly MysteryObservedEvidence[];
  readonly tensions: readonly MysteryApparentTension[];
  readonly summary: MysteryEvidenceSummary;
}
