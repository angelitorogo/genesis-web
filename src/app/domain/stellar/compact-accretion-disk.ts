import { IntermediateMassBlackHole } from '../galactic-object/intermediate-mass-black-hole';
import { GalacticSupermassiveBlackHole } from '../universe/galactic-supermassive-black-hole';
import { GalacticNucleusState } from '../universe/galactic-nucleus-state';
import { StellarBlackHole } from './stellar-black-hole';

/** The existing 27.1–27.3 objects are the sole authority for BH identity and mass. */
export type BlackHoleAccretionHost =
  StellarBlackHole | IntermediateMassBlackHole | GalacticSupermassiveBlackHole;
export type BlackHoleAccretionHostKind = 'STELLAR' | 'INTERMEDIATE' | 'SUPERMASSIVE';

/**
 * 27.7 — bounded, steady, non-spinning thin-disk REFERENCE, not a Kerr/MHD
 * solution or a measured disk. Intrinsic Ground Truth; not observed knowledge.
 * A bare black hole does not imply a disk: the caller supplies an active state.
 */
export class CompactAccretionDisk {
  static readonly EDDINGTON_LUMINOSITY_PER_SOLAR_MASS_WATTS = 1.26e31;
  static readonly STEFAN_BOLTZMANN_SI = 5.670374419e-8;
  static readonly REFERENCE_RADIATIVE_EFFICIENCY = 0.1;

  readonly hostKind: BlackHoleAccretionHostKind;
  readonly massSolar: number;
  readonly schwarzschildRadiusKm: number;
  readonly innerRadiusKm: number;
  readonly outerRadiusKm: number;
  readonly eddingtonLuminosityWatts: number;
  readonly bolometricLuminosityWatts: number;
  readonly massAccretionRateKgPerSecond: number;
  readonly maximumEffectiveTemperatureKelvin: number;

  constructor(
    readonly host: BlackHoleAccretionHost,
    readonly eddingtonRatio: number,
  ) {
    if (host instanceof StellarBlackHole) {
      this.hostKind = 'STELLAR';
      this.massSolar = host.massSolar;
      this.schwarzschildRadiusKm = host.schwarzschildRadiusKm;
    } else if (host instanceof IntermediateMassBlackHole) {
      this.hostKind = 'INTERMEDIATE';
      this.massSolar = host.physicalProperties.massSolar;
      this.schwarzschildRadiusKm = host.physicalProperties.schwarzschildRadiusKm;
    } else if (host instanceof GalacticSupermassiveBlackHole) {
      if (host.nucleusState === GalacticNucleusState.QUIESCENT) {
        throw new RangeError('An inactive canonical galactic nucleus cannot acquire a disk by construction.');
      }
      this.hostKind = 'SUPERMASSIVE';
      this.massSolar = host.physicalProfile.massSolarMasses;
      this.schwarzschildRadiusKm = host.physicalProfile.schwarzschildRadiusKm;
    } else {
      throw new TypeError('27.7 needs a previously generated 27.1, 27.2 or 27.3 black hole.');
    }
    if (!Number.isFinite(eddingtonRatio) || eddingtonRatio <= 0 || eddingtonRatio > 1) {
      throw new RangeError('The steady thin-disk approximation requires 0 < Eddington ratio <= 1.');
    }
    this.eddingtonLuminosityWatts =
      this.massSolar * CompactAccretionDisk.EDDINGTON_LUMINOSITY_PER_SOLAR_MASS_WATTS;
    this.bolometricLuminosityWatts = this.eddingtonLuminosityWatts * eddingtonRatio;
    this.massAccretionRateKgPerSecond = this.bolometricLuminosityWatts /
      (CompactAccretionDisk.REFERENCE_RADIATIVE_EFFICIENCY * StellarBlackHole.LIGHT_SPEED_M_PER_S ** 2);
    // R_ISCO = 6GM/c² = 3Rs ONLY for a non-rotating Schwarzschild reference.
    this.innerRadiusKm = 3 * this.schwarzschildRadiusKm;
    // A visualization/reference extent; NOT a self-gravity or tidal truncation result.
    this.outerRadiusKm = 1_000 * this.schwarzschildRadiusKm;
    const rInMetres = this.innerRadiusKm * 1_000;
    const massKg = this.massSolar * StellarBlackHole.SOLAR_MASS_KG;
    // Thin-disk zero-torque T_eff,max = 0.488 * [3GM Mdot/(8*pi*sigma*Rin^3)]^(1/4).
    this.maximumEffectiveTemperatureKelvin = 0.488 * Math.pow(
      3 * StellarBlackHole.GRAVITATIONAL_CONSTANT_SI * massKg * this.massAccretionRateKgPerSecond /
        (8 * Math.PI * CompactAccretionDisk.STEFAN_BOLTZMANN_SI * rInMetres ** 3),
      0.25,
    );
    if (![this.massSolar, this.schwarzschildRadiusKm, this.innerRadiusKm,
      this.outerRadiusKm, this.eddingtonLuminosityWatts, this.bolometricLuminosityWatts,
      this.massAccretionRateKgPerSecond, this.maximumEffectiveTemperatureKelvin]
      .every(value => Number.isFinite(value) && value > 0) ||
      this.innerRadiusKm >= this.outerRadiusKm) {
      throw new RangeError('27.7 accretion disk must have finite, positive, coherent reference scales.');
    }
    Object.freeze(this);
  }
}
