import { type TidalDisruptionEncounterProfile } from './tidal-disruption-encounter-profile';

export const TidalDisruptionOutcome = Object.freeze({
  EXTERNAL_DISRUPTION_EXPECTED: 'EXTERNAL_DISRUPTION_EXPECTED',
  GRAZING_PARTIAL_DISRUPTION_UNRESOLVED: 'GRAZING_PARTIAL_DISRUPTION_UNRESOLVED',
  DIRECT_CAPTURE_NONSPINNING_REFERENCE: 'DIRECT_CAPTURE_NONSPINNING_REFERENCE',
} as const);
export type TidalDisruptionOutcome =
  typeof TidalDisruptionOutcome[keyof typeof TidalDisruptionOutcome];

export const TidalFallbackResolution = Object.freeze({
  FROZEN_IN_REFERENCE_AVAILABLE: 'FROZEN_IN_REFERENCE_AVAILABLE',
  BOUND_MASS_FRACTION_UNRESOLVED: 'BOUND_MASS_FRACTION_UNRESOLVED',
  NO_EXTERNAL_FALLBACK_REFERENCE: 'NO_EXTERNAL_FALLBACK_REFERENCE',
} as const);
export type TidalFallbackResolution =
  typeof TidalFallbackResolution[keyof typeof TidalFallbackResolution];

/**
 * 29.6 intrinsic TDE characterization.
 *
 * r_cap is the Schwarzschild marginally-bound/parabolic capture reference
 * 4GM/c² = 2 r_s. It is intentionally labelled a non-spinning reference:
 * Kerr spin and orientation are not part of this profile and can move the
 * relativistic capture boundary.
 */
export class TidalDisruptionEventProfile {
  constructor(
    readonly sourceEncounter: TidalDisruptionEncounterProfile,
    readonly tidalRadiusMeters: number,
    readonly pericenterMeters: number,
    readonly schwarzschildRadiusMeters: number,
    readonly nonSpinningParabolicCaptureRadiusMeters: number,
    readonly tidalToSchwarzschildRatio: number,
    readonly pericenterToCaptureRatio: number,
    readonly nonSpinningCaptureMassLimitSolar: number,
    readonly outcome: TidalDisruptionOutcome,
    readonly fallbackResolution: TidalFallbackResolution,
    readonly mostBoundFallbackTimeSeconds: number | null,
    readonly peakFallbackRateSolarPerYear: number | null,
    readonly canonicalEnergySpreadJoulePerKg: number | null,
    readonly eddingtonLuminosityReferenceWatts: number,
    readonly blackHoleSpinDimensionless: null,
    readonly radiativeEfficiency: null,
    readonly intrinsicBolometricLuminosityWatts: null,
    readonly observedFluxWattsPerSquareMeter: null,
  ) {
    for (const [name, value] of Object.entries({
      tidalRadiusMeters,
      pericenterMeters,
      schwarzschildRadiusMeters,
      nonSpinningParabolicCaptureRadiusMeters,
      tidalToSchwarzschildRatio,
      pericenterToCaptureRatio,
      nonSpinningCaptureMassLimitSolar,
      eddingtonLuminosityReferenceWatts,
    })) {
      if (!Number.isFinite(value) || value <= 0) {
        throw new RangeError(`${name} must be finite and > 0.`);
      }
    }

    const shouldHaveFallback = outcome === TidalDisruptionOutcome.EXTERNAL_DISRUPTION_EXPECTED;
    if (shouldHaveFallback) {
      if (fallbackResolution !== TidalFallbackResolution.FROZEN_IN_REFERENCE_AVAILABLE ||
          mostBoundFallbackTimeSeconds === null || peakFallbackRateSolarPerYear === null ||
          canonicalEnergySpreadJoulePerKg === null) {
        throw new RangeError('External 29.6 disruptions require the canonical fallback reference tuple.');
      }
      for (const [name, value] of Object.entries({
        mostBoundFallbackTimeSeconds,
        peakFallbackRateSolarPerYear,
        canonicalEnergySpreadJoulePerKg,
      })) {
        if (!Number.isFinite(value) || value <= 0) {
          throw new RangeError(`${name} must be finite and > 0 when fallback is resolved.`);
        }
      }
    } else if (mostBoundFallbackTimeSeconds !== null || peakFallbackRateSolarPerYear !== null ||
               canonicalEnergySpreadJoulePerKg !== null) {
      throw new RangeError('29.6 cannot fabricate a fallback normalization for unresolved grazing/capture cases.');
    }

    if (outcome === TidalDisruptionOutcome.GRAZING_PARTIAL_DISRUPTION_UNRESOLVED &&
        fallbackResolution !== TidalFallbackResolution.BOUND_MASS_FRACTION_UNRESOLVED) {
      throw new RangeError('Grazing 29.6 encounters must keep the stripped/bound mass fraction unresolved.');
    }
    if (outcome === TidalDisruptionOutcome.DIRECT_CAPTURE_NONSPINNING_REFERENCE &&
        fallbackResolution !== TidalFallbackResolution.NO_EXTERNAL_FALLBACK_REFERENCE) {
      throw new RangeError('Direct-capture reference cases cannot expose an external fallback curve.');
    }

    if (blackHoleSpinDimensionless !== null || radiativeEfficiency !== null ||
        intrinsicBolometricLuminosityWatts !== null || observedFluxWattsPerSquareMeter !== null) {
      throw new RangeError('29.6 cannot synthesize Kerr, radiative-efficiency or observer-flux quantities.');
    }
  }

  get victimKind() { return this.sourceEncounter.victimKind; }
  get blackHoleMassSolar() { return this.sourceEncounter.blackHoleMassSolar; }
  get stellarMassSolar() { return this.sourceEncounter.stellarMassSolar; }
  get stellarRadiusSolar() { return this.sourceEncounter.stellarRadiusSolar; }
  get penetrationFactorBeta() { return this.sourceEncounter.penetrationFactorBeta; }
}

export interface NormalizedTidalFallbackSample {
  readonly timeOverMostBoundReturn: number;
  readonly timeSinceDisruptionSeconds: number;
  readonly normalizedFallbackRate: number;
}

export interface NormalizedTidalFallbackCurve {
  readonly mostBoundFallbackTimeSeconds: number;
  readonly endTimeOverMostBoundReturn: number;
  readonly samples: readonly NormalizedTidalFallbackSample[];
}
