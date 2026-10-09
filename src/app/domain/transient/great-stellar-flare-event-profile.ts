import { type GreatStellarFlareSourceProfile } from './great-stellar-flare-source-profile';

export const GreatStellarFlareOutcome = Object.freeze({
  EXPLICIT_LARGE_STELLAR_FLARE: 'EXPLICIT_LARGE_STELLAR_FLARE',
  STATISTICAL_ACTIVITY_WITHOUT_EVENT: 'STATISTICAL_ACTIVITY_WITHOUT_EVENT',
  ORDINARY_STELLAR_FLARE_MODEL_NOT_APPLICABLE: 'ORDINARY_STELLAR_FLARE_MODEL_NOT_APPLICABLE',
} as const);

export type GreatStellarFlareOutcome =
  typeof GreatStellarFlareOutcome[keyof typeof GreatStellarFlareOutcome];

/**
 * 29.9 intrinsic characterization of a large stellar flare.
 *
 * Only source-frame quantities derivable from an explicit event are populated.
 * Peak light-curve shape, observer flux/fluence, CME/particle properties and
 * planetary dose remain unresolved because they need additional physics and
 * geometry rather than a bolometric event energy alone.
 */
export class GreatStellarFlareEventProfile {
  constructor(
    readonly source: GreatStellarFlareSourceProfile,
    readonly outcome: GreatStellarFlareOutcome,
    readonly stellarLuminosityWatts: number | null,
    readonly meanFlarePowerWatts: number | null,
    readonly equivalentDurationSeconds: number | null,
    readonly energyToTypicalRatio: number | null,
    readonly energyToMaximumFraction: number | null,
    readonly meanPowerToStellarLuminosityRatio: number | null,
    readonly observedBolometricFluxWattsPerSquareMeter: null,
    readonly observedFluenceJoulesPerSquareMeter: null,
    readonly peakFlareLuminosityWatts: null,
    readonly flareTemperatureKelvin: null,
    readonly emittingAreaSquareMeters: null,
    readonly cmeEnergyJoules: null,
    readonly chargedParticleEnergyJoules: null,
    readonly planetaryIncidentEnergyJoulesPerSquareMeter: null,
    readonly nextFlareTimeSeconds: null,
    readonly recurrencePeriodSeconds: null,
  ) {
    const explicit = outcome === GreatStellarFlareOutcome.EXPLICIT_LARGE_STELLAR_FLARE;
    const statistical = outcome === GreatStellarFlareOutcome.STATISTICAL_ACTIVITY_WITHOUT_EVENT;
    const notApplicable =
      outcome === GreatStellarFlareOutcome.ORDINARY_STELLAR_FLARE_MODEL_NOT_APPLICABLE;

    if (!explicit && !statistical && !notApplicable) {
      throw new RangeError('Unsupported 29.9 stellar-flare outcome.');
    }

    if (notApplicable) {
      if (
        stellarLuminosityWatts !== null ||
        meanFlarePowerWatts !== null ||
        equivalentDurationSeconds !== null ||
        energyToTypicalRatio !== null ||
        energyToMaximumFraction !== null ||
        meanPowerToStellarLuminosityRatio !== null
      ) {
        throw new RangeError('A non-applicable 29.9 profile cannot expose ordinary-flare derived values.');
      }
      Object.freeze(this);
      return;
    }

    assertPositive(stellarLuminosityWatts, 'stellarLuminosityWatts');

    const eventDerived = [
      meanFlarePowerWatts,
      equivalentDurationSeconds,
      energyToTypicalRatio,
      energyToMaximumFraction,
      meanPowerToStellarLuminosityRatio,
    ];

    if (explicit) {
      if (eventDerived.some(value => value === null || !Number.isFinite(value) || value <= 0)) {
        throw new RangeError('An explicit 29.9 flare requires finite positive derived event quantities.');
      }
      if (energyToMaximumFraction! > 1) {
        throw new RangeError('energyToMaximumFraction must remain in (0, 1].');
      }
    } else if (eventDerived.some(value => value !== null)) {
      throw new RangeError('Statistical-only 29.9 activity cannot expose individual-event derived quantities.');
    }

    Object.freeze(this);
  }
}

function assertPositive(
  value: number | null,
  propertyName: string,
): asserts value is number {
  if (value === null || !Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${propertyName} must be finite and greater than 0.`);
  }
}
