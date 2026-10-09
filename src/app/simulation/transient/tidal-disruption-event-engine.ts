import {
  TidalDisruptionEventProfile,
  TidalDisruptionOutcome,
  TidalFallbackResolution,
  type NormalizedTidalFallbackCurve,
} from '../../domain/transient/tidal-disruption-event-profile';
import { type TidalDisruptionEncounterProfile } from '../../domain/transient/tidal-disruption-encounter-profile';

const GRAVITATIONAL_CONSTANT = 6.67430e-11;
const SPEED_OF_LIGHT = 299_792_458;
const SOLAR_MASS_KG = 1.98847e30;
const SOLAR_RADIUS_METERS = 6.957e8;
const JULIAN_YEAR_SECONDS = 365.25 * 86_400;
const TWO_PI = 2 * Math.PI;
const EDDINGTON_LUMINOSITY_WATTS_PER_SOLAR_MASS = 1.26e31;

/** Classical star–IMBH/SMBH tidal-disruption physics for phase 29.6. */
export class TidalDisruptionEventEngine {
  private constructor() {}

  static deriveProfile(encounter: TidalDisruptionEncounterProfile): TidalDisruptionEventProfile {
    const blackHoleMassKg = encounter.blackHoleMassSolar * SOLAR_MASS_KG;
    const stellarMassKg = encounter.stellarMassSolar * SOLAR_MASS_KG;
    const stellarRadiusMeters = encounter.stellarRadiusSolar * SOLAR_RADIUS_METERS;

    const tidalRadiusMeters = stellarRadiusMeters *
      (encounter.blackHoleMassSolar / encounter.stellarMassSolar) ** (1 / 3);
    const pericenterMeters = tidalRadiusMeters / encounter.penetrationFactorBeta;
    const schwarzschildRadiusMeters = 2 * GRAVITATIONAL_CONSTANT * blackHoleMassKg / SPEED_OF_LIGHT ** 2;

    // Schwarzschild marginally-bound radius for a parabolic encounter.
    // This is a reference capture boundary only; Kerr spin/orientation remain unknown.
    const nonSpinningParabolicCaptureRadiusMeters = 2 * schwarzschildRadiusMeters;
    const tidalToSchwarzschildRatio = tidalRadiusMeters / schwarzschildRadiusMeters;
    const pericenterToCaptureRatio = pericenterMeters / nonSpinningParabolicCaptureRadiusMeters;

    // Critical BH mass for THIS beta under the same non-spinning parabolic
    // reference: r_t / beta = 4GM/c². The beta=1 value is the familiar
    // capture-adjusted Hills scale; deeper encounters lower the limit.
    const betaOneCaptureMassKg =
      (SPEED_OF_LIGHT ** 2 * stellarRadiusMeters / (4 * GRAVITATIONAL_CONSTANT)) ** (3 / 2) /
      Math.sqrt(stellarMassKg);
    const nonSpinningCaptureMassLimitSolar =
      betaOneCaptureMassKg / SOLAR_MASS_KG /
      encounter.penetrationFactorBeta ** (3 / 2);

    let outcome: TidalDisruptionOutcome;
    let fallbackResolution: TidalFallbackResolution;
    let mostBoundFallbackTimeSeconds: number | null = null;
    let peakFallbackRateSolarPerYear: number | null = null;
    let canonicalEnergySpreadJoulePerKg: number | null = null;

    if (pericenterMeters <= nonSpinningParabolicCaptureRadiusMeters) {
      outcome = TidalDisruptionOutcome.DIRECT_CAPTURE_NONSPINNING_REFERENCE;
      fallbackResolution = TidalFallbackResolution.NO_EXTERNAL_FALLBACK_REFERENCE;
    } else if (encounter.penetrationFactorBeta >= 1) {
      outcome = TidalDisruptionOutcome.EXTERNAL_DISRUPTION_EXPECTED;
      fallbackResolution = TidalFallbackResolution.FROZEN_IN_REFERENCE_AVAILABLE;

      // Canonical frozen-in energy spread evaluated at the tidal radius. This
      // deliberately avoids inventing a beta-dependent hydrodynamic correction.
      canonicalEnergySpreadJoulePerKg =
        GRAVITATIONAL_CONSTANT * blackHoleMassKg * stellarRadiusMeters /
        tidalRadiusMeters ** 2;
      const mostBoundSemiMajorAxisMeters =
        GRAVITATIONAL_CONSTANT * blackHoleMassKg /
        (2 * canonicalEnergySpreadJoulePerKg);
      mostBoundFallbackTimeSeconds = TWO_PI * Math.sqrt(
        mostBoundSemiMajorAxisMeters ** 3 /
        (GRAVITATIONAL_CONSTANT * blackHoleMassKg),
      );
      peakFallbackRateSolarPerYear =
        encounter.stellarMassSolar /
        (3 * (mostBoundFallbackTimeSeconds / JULIAN_YEAR_SECONDS));
    } else {
      outcome = TidalDisruptionOutcome.GRAZING_PARTIAL_DISRUPTION_UNRESOLVED;
      fallbackResolution = TidalFallbackResolution.BOUND_MASS_FRACTION_UNRESOLVED;
    }

    return new TidalDisruptionEventProfile(
      encounter,
      tidalRadiusMeters,
      pericenterMeters,
      schwarzschildRadiusMeters,
      nonSpinningParabolicCaptureRadiusMeters,
      tidalToSchwarzschildRatio,
      pericenterToCaptureRatio,
      nonSpinningCaptureMassLimitSolar,
      outcome,
      fallbackResolution,
      mostBoundFallbackTimeSeconds,
      peakFallbackRateSolarPerYear,
      canonicalEnergySpreadJoulePerKg,
      EDDINGTON_LUMINOSITY_WATTS_PER_SOLAR_MASS * encounter.blackHoleMassSolar,
      null,
      null,
      null,
      null,
    );
  }

  /**
   * Dimensionless t^(-5/3) fallback reference. It is a mass-return curve, not
   * luminosity, accretion rate at the horizon or observed flux.
   */
  static normalizedFallbackCurve(
    profile: TidalDisruptionEventProfile,
    sampleCount = 180,
  ): NormalizedTidalFallbackCurve | null {
    if (!Number.isInteger(sampleCount) || sampleCount < 32 || sampleCount > 2_048) {
      throw new RangeError('normalizedFallbackCurve sampleCount must be an integer in [32, 2048].');
    }
    if (profile.mostBoundFallbackTimeSeconds === null ||
        profile.fallbackResolution !== TidalFallbackResolution.FROZEN_IN_REFERENCE_AVAILABLE) {
      return null;
    }
    const mostBoundFallbackTimeSeconds = profile.mostBoundFallbackTimeSeconds;

    const endTimeOverMostBoundReturn = 30;
    const samples = Array.from({ length: sampleCount }, (_, index) => {
      const progress = index / (sampleCount - 1);
      // Logarithmic time spacing preserves the steep early decline and the tail.
      const timeOverMostBoundReturn = Math.exp(
        Math.log(endTimeOverMostBoundReturn) * progress,
      );
      return Object.freeze({
        timeOverMostBoundReturn,
        timeSinceDisruptionSeconds:
          mostBoundFallbackTimeSeconds * timeOverMostBoundReturn,
        normalizedFallbackRate: timeOverMostBoundReturn ** (-5 / 3),
      });
    });

    return Object.freeze({
      mostBoundFallbackTimeSeconds,
      endTimeOverMostBoundReturn,
      samples: Object.freeze(samples),
    });
  }
}
