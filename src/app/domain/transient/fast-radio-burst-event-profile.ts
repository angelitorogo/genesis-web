import { type FastRadioBurstSourceProfile } from './fast-radio-burst-source-profile';

export const FastRadioBurstOutcome = Object.freeze({
  INTRINSIC_COHERENT_RADIO_BURST: 'INTRINSIC_COHERENT_RADIO_BURST',
  BURST_ENGINE_UNRESOLVED: 'BURST_ENGINE_UNRESOLVED',
} as const);

export type FastRadioBurstOutcome =
  typeof FastRadioBurstOutcome[keyof typeof FastRadioBurstOutcome];

/**
 * 29.8 intrinsic FRB characterization plus an optional cold-plasma propagation
 * reference. No observed flux, fluence, isotropic-equivalent energy or distance
 * is inferred from the source or from DM.
 */
export class FastRadioBurstEventProfile {
  constructor(
    readonly source: FastRadioBurstSourceProfile,
    readonly outcome: FastRadioBurstOutcome,
    readonly wavelengthMeters: number | null,
    readonly fractionalBandwidth: number | null,
    readonly lightCrossingUpperScaleMeters: number | null,
    readonly spectralLowEdgeHz: number | null,
    readonly spectralHighEdgeHz: number | null,
    readonly coldPlasmaDispersionDelaySeconds: number | null,
    readonly luminosityDistanceParsec: null,
    readonly sourceRedshift: null,
    readonly observedWidthSeconds: null,
    readonly observedFluenceJoulesPerSquareMeter: null,
    readonly observedPeakFluxWattsPerSquareMeter: null,
    readonly isotropicEquivalentRadioEnergyJoules: null,
    readonly rotationMeasureRadiansPerSquareMeter: null,
    readonly scatteringTimescaleSeconds: null,
    readonly polarizationFraction: null,
    readonly repetitionPeriodSeconds: null,
  ) {
    const resolved = outcome === FastRadioBurstOutcome.INTRINSIC_COHERENT_RADIO_BURST;
    const derived = [
      wavelengthMeters,
      fractionalBandwidth,
      lightCrossingUpperScaleMeters,
      spectralLowEdgeHz,
      spectralHighEdgeHz,
    ];

    if (resolved) {
      if (derived.some(value => value === null || !Number.isFinite(value) || value <= 0)) {
        throw new RangeError('A resolved 29.8 FRB requires finite positive intrinsic radio scales.');
      }
      if (fractionalBandwidth! >= 2) {
        throw new RangeError('fractionalBandwidth must remain below 2.');
      }
    } else if (derived.some(value => value !== null)) {
      throw new RangeError('An unresolved 29.8 FRB engine cannot expose derived radio scales.');
    }

    if (
      coldPlasmaDispersionDelaySeconds !== null &&
      (!resolved || !Number.isFinite(coldPlasmaDispersionDelaySeconds) ||
        coldPlasmaDispersionDelaySeconds <= 0)
    ) {
      throw new RangeError('A dispersion delay must be finite, positive and tied to a resolved burst.');
    }

    Object.freeze(this);
  }
}
