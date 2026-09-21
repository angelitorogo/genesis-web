import { StellarBlackHole } from '../stellar/stellar-black-hole';

/**
 * 27.3 — Derived, read-only physics of an ALREADY generated nuclear SMBH.
 *
 * All radii and times are Schwarzschild (non-spinning) reference values,
 * NOT direct measurements of a spinning horizon or evidence of accretion.
 * The host-mass ratio refers to GENESIS's total galactic mass, not bulge mass.
 * No luminosity, jet, accretion rate or formation history is inferred here.
 */
export class SupermassiveBlackHolePhysicalProfile {
  /** The frozen V1 galaxy generator caps its SMBH mass at 1% of total mass. */
  static readonly MAX_CANONICAL_HOST_MASS_FRACTION = 0.01;

  readonly massFractionOfGalaxy: number;
  readonly schwarzschildRadiusKm: number;
  readonly gravitationalTimeSeconds: number;

  constructor(
    readonly massSolarMasses: number,
    readonly hostTotalMassSolarMasses: number,
  ) {
    if (!Number.isFinite(massSolarMasses) || massSolarMasses <= 0 ||
        !Number.isFinite(hostTotalMassSolarMasses) || hostTotalMassSolarMasses <= 0) {
      throw new RangeError('27.3 requires finite positive canonical black-hole and host masses.');
    }

    this.massFractionOfGalaxy = massSolarMasses / hostTotalMassSolarMasses;
    if (!Number.isFinite(this.massFractionOfGalaxy) || this.massFractionOfGalaxy <= 0 ||
        this.massFractionOfGalaxy > SupermassiveBlackHolePhysicalProfile.MAX_CANONICAL_HOST_MASS_FRACTION + 1e-12) {
      throw new RangeError('27.3 SMBH mass must respect the frozen galaxy-generator 1% host-mass cap.');
    }

    this.schwarzschildRadiusKm = StellarBlackHole.schwarzschildRadiusFor(massSolarMasses);
    // t_g = GM/c^3 = (2GM/c^2)/(2c), using the EXACT SAME constants as 27.1.
    this.gravitationalTimeSeconds = this.schwarzschildRadiusKm * 1_000 /
      (2 * StellarBlackHole.LIGHT_SPEED_M_PER_S);
    if (!Number.isFinite(this.schwarzschildRadiusKm) || this.schwarzschildRadiusKm <= 0 ||
        !Number.isFinite(this.gravitationalTimeSeconds) || this.gravitationalTimeSeconds <= 0) {
      throw new RangeError('The derived Schwarzschild reference scales must be finite and positive.');
    }
    Object.freeze(this);
  }
}
