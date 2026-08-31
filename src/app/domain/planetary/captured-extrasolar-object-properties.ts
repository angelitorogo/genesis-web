import {
  CapturedExtrasolarObjectCaptureRegime,
  type CapturedExtrasolarObjectCaptureRegime as CaptureRegime,
} from './captured-extrasolar-object-capture-regime';
import {
  CapturedExtrasolarObjectCompositionRegime,
  type CapturedExtrasolarObjectCompositionRegime as CompositionRegime,
} from './captured-extrasolar-object-composition-regime';

export class CapturedExtrasolarObjectProperties {
  constructor(
    readonly captureOrdinal: number,
    readonly compositionRegime: CompositionRegime,
    readonly captureRegime: CaptureRegime,
    readonly diameterKilometers: number,
    readonly refractoryFraction01: number,
    readonly volatileFraction01: number,
    readonly porosityIndex01: number,
    readonly bulkDensityGramsPerCubicCentimeter: number,
    readonly geometricAlbedo: number,
    readonly incomingHyperbolicExcessVelocityKmPerSecond: number,
    readonly captureEnergyRemovalIndex01: number,
  ) {
    if (!Number.isInteger(captureOrdinal) || captureOrdinal <= 0) {
      throw new RangeError('captureOrdinal must be positive.');
    }

    if (!Object.values(CapturedExtrasolarObjectCompositionRegime).includes(compositionRegime)) {
      throw new RangeError('Unknown captured-extrasolar composition regime.');
    }

    if (!Object.values(CapturedExtrasolarObjectCaptureRegime).includes(captureRegime)) {
      throw new RangeError('Unknown captured-extrasolar capture regime.');
    }

    for (const [name, value] of [
      ['diameterKilometers', diameterKilometers],
      ['bulkDensityGramsPerCubicCentimeter', bulkDensityGramsPerCubicCentimeter],
      ['incomingHyperbolicExcessVelocityKmPerSecond', incomingHyperbolicExcessVelocityKmPerSecond],
    ] as const) {
      if (!Number.isFinite(value) || value <= 0) {
        throw new RangeError(`${name} must be positive and finite.`);
      }
    }

    for (const [name, value] of [
      ['refractoryFraction01', refractoryFraction01],
      ['volatileFraction01', volatileFraction01],
      ['porosityIndex01', porosityIndex01],
      ['geometricAlbedo', geometricAlbedo],
      ['captureEnergyRemovalIndex01', captureEnergyRemovalIndex01],
    ] as const) {
      if (!Number.isFinite(value) || value < 0 || value > 1) {
        throw new RangeError(`${name} must be inside [0,1].`);
      }
    }

    if (Math.abs(refractoryFraction01 + volatileFraction01 - 1) > 1e-12) {
      throw new RangeError('Captured-extrasolar refractory and volatile fractions must sum to 1.');
    }
  }

  get isVolatileRich(): boolean {
    return this.compositionRegime === CapturedExtrasolarObjectCompositionRegime.VOLATILE_RICH;
  }
}
