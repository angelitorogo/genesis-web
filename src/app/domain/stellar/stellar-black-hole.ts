import { type StellarBlackHoleFormationChannel } from './stellar-black-hole-formation-channel';
import { Star } from './star';

/**
 * Point 27.1: read-only physical profile for a *formed stellar* black hole.
 *
 * `massSolar` is a coarse remnant-mass estimate, NOT the historical point-15.1
 * progenitor/reference `StellarPhysicalProperties.currentMassSolar` field.
 * `schwarzschildRadiusKm` is the NON-ROTATING Schwarzschild reference (2GM/c²),
 * not a measured horizon for an object of unknown spin. No accretion, jets,
 * Hawking temperature, Kerr spin, observations or knowledge state are inferred.
 */
export class StellarBlackHole {
  /** SI reference constants; solar mass is a conventional approximate value. */
  static readonly GRAVITATIONAL_CONSTANT_SI = 6.67430e-11;
  static readonly SOLAR_MASS_KG = 1.98847e30;
  static readonly LIGHT_SPEED_M_PER_S = 299_792_458;
  static readonly MIN_MODEL_MASS_SOLAR = 3.05;

  readonly formationChannel: StellarBlackHoleFormationChannel;

  constructor(
    readonly star: Star,
    readonly progenitorInitialMassSolar: number,
    readonly massSolar: number,
    readonly schwarzschildRadiusKm: number,
    readonly formationAgeBillionYears: number,
    readonly ageSinceFormationBillionYears: number,
  ) {
    if (!(star instanceof Star) || star.evolutionState.name !== 'STELLAR_BLACK_HOLE' ||
        star.blackHoleFormationChannel === null) {
      throw new TypeError('A stellar black hole requires an existing STELLAR_BLACK_HOLE Star.');
    }
    this.formationChannel = star.blackHoleFormationChannel;
    if (!Number.isFinite(progenitorInitialMassSolar) || progenitorInitialMassSolar <= 0 ||
        !Number.isFinite(massSolar) || massSolar < StellarBlackHole.MIN_MODEL_MASS_SOLAR ||
        massSolar >= progenitorInitialMassSolar) {
      throw new RangeError('Stellar black-hole mass must be finite, at least 3.05 M☉, and below its progenitor mass.');
    }
    const expectedRadiusKm = StellarBlackHole.schwarzschildRadiusFor(massSolar);
    if (!Number.isFinite(schwarzschildRadiusKm) ||
        Math.abs(schwarzschildRadiusKm - expectedRadiusKm) > expectedRadiusKm * 1e-12) {
      throw new RangeError('Schwarzschild reference radius must agree with the remnant mass.');
    }
    if (!Number.isFinite(formationAgeBillionYears) || formationAgeBillionYears <= 0 ||
        !Number.isFinite(ageSinceFormationBillionYears) || ageSinceFormationBillionYears < 0) {
      throw new RangeError('Stellar black-hole formation and elapsed ages must be finite and nonnegative.');
    }
    Object.freeze(this);
  }

  static schwarzschildRadiusFor(massSolar: number): number {
    if (!Number.isFinite(massSolar) || massSolar <= 0) {
      throw new RangeError('Schwarzschild reference requires a positive finite mass.');
    }
    return 2 * StellarBlackHole.GRAVITATIONAL_CONSTANT_SI *
      StellarBlackHole.SOLAR_MASS_KG * massSolar /
      (StellarBlackHole.LIGHT_SPEED_M_PER_S ** 2) / 1_000;
  }
}
