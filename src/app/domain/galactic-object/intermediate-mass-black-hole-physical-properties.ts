import { StellarBlackHole } from '../stellar/stellar-black-hole';

/**
 * 27.2 — A deliberately bounded, approximate intermediate-mass class.
 * The 100–100,000 M☉ interval is a GENESIS modelling convention, not an
 * assertion that observational classifications have universally fixed edges.
 * Rs is the non-rotating Schwarzschild *reference*, not an observed horizon.
 */
export class IntermediateMassBlackHolePhysicalProperties {
  static readonly MIN_MASS_SOLAR = 100;
  static readonly MAX_MASS_SOLAR_EXCLUSIVE = 100_000;

  constructor(
    readonly massSolar: number,
    readonly schwarzschildRadiusKm: number,
  ) {
    if (!Number.isFinite(massSolar) ||
        massSolar < IntermediateMassBlackHolePhysicalProperties.MIN_MASS_SOLAR ||
        massSolar >= IntermediateMassBlackHolePhysicalProperties.MAX_MASS_SOLAR_EXCLUSIVE) {
      throw new RangeError('An intermediate-mass black hole must have 100 <= massSolar < 100,000.');
    }

    const referenceRadius = StellarBlackHole.schwarzschildRadiusFor(massSolar);
    if (!Number.isFinite(schwarzschildRadiusKm) ||
        Math.abs(schwarzschildRadiusKm - referenceRadius) > referenceRadius * 1e-12) {
      throw new RangeError('Schwarzschild reference radius must be consistent with massSolar.');
    }
    Object.freeze(this);
  }
}
