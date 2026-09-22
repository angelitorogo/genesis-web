import { StellarNeutronStar } from './stellar-neutron-star';

/**
 * 27.6 — a rare high-field *birth channel* of an EXISTING 27.4 neutron star.
 * All quantities are illustrative intrinsic Ground Truth, never observations.
 * This is a decaying dipole approximation, not an interior-field, crust,
 * radiative-transfer, magnetohydrodynamics or burst/event model.
 */
export class StellarMagnetar {
  static readonly SECONDS_PER_YEAR = 31_557_600;
  static readonly YEARS_PER_GYR = 1e9;
  static readonly RESIDUAL_FIELD_TESLA = 1e7;
  static readonly ACTIVE_FIELD_THRESHOLD_TESLA = 3e9;
  static readonly ACTIVE_AGE_LIMIT_YEARS = 100_000;
  static readonly VACUUM_PERMEABILITY_SI = 4 * Math.PI * 1e-7;

  readonly ageSinceFormationYears: number;
  readonly dipolarMagneticFieldTesla: number;
  readonly spinPeriodSeconds: number;
  readonly spinFrequencyHz: number;
  readonly periodDerivativeSecondsPerSecond: number;
  /** A homogeneous-field scale, NOT available energy or a predicted flare. */
  readonly magneticEnergyReferenceJoules: number;
  /** An intrinsic high-field regime, NOT a detected outburst or observation. */
  readonly highFieldActive: boolean;

  constructor(
    readonly neutronStar: StellarNeutronStar,
    readonly birthDipolarMagneticFieldTesla: number,
    readonly fieldDecayTimescaleYears: number,
    readonly birthSpinPeriodSeconds: number,
  ) {
    if (!(neutronStar instanceof StellarNeutronStar)) {
      throw new TypeError('27.6 requires an existing 27.4 neutron-star profile.');
    }
    if (!Number.isFinite(birthDipolarMagneticFieldTesla) ||
        birthDipolarMagneticFieldTesla < 1e10 ||
        birthDipolarMagneticFieldTesla > 1e11 ||
        !Number.isFinite(fieldDecayTimescaleYears) ||
        fieldDecayTimescaleYears < 1_000 || fieldDecayTimescaleYears > 20_000 ||
        !Number.isFinite(birthSpinPeriodSeconds) ||
        birthSpinPeriodSeconds < 0.005 || birthSpinPeriodSeconds > 0.15) {
      throw new RangeError('Magnetar birth field, decay time or spin lies outside the illustrative model.');
    }

    const ageYears = neutronStar.ageSinceFormationBillionYears * StellarMagnetar.YEARS_PER_GYR;
    if (!Number.isFinite(ageYears) || ageYears < 0) {
      throw new RangeError('The magnetar requires a finite nonnegative remnant age.');
    }
    this.ageSinceFormationYears = ageYears;
    const tauSeconds = fieldDecayTimescaleYears * StellarMagnetar.SECONDS_PER_YEAR;
    const elapsedSeconds = ageYears * StellarMagnetar.SECONDS_PER_YEAR;
    const fieldExcess = birthDipolarMagneticFieldTesla - StellarMagnetar.RESIDUAL_FIELD_TESLA;
    const exponent = -elapsedSeconds / tauSeconds;
    this.dipolarMagneticFieldTesla = StellarMagnetar.RESIDUAL_FIELD_TESLA +
      fieldExcess * Math.exp(exponent);

    // Pdot=K/P, K=(B[G]/3.2e19)^2. Analytic integral of B(t)^2 with
    // B(t)=B_floor+(B_birth-B_floor)exp(-t/tau). This avoids using the
    // current field as though it had been constant since birth.
    const bFloor = StellarMagnetar.RESIDUAL_FIELD_TESLA;
    const integralTeslaSquaredSeconds = bFloor ** 2 * elapsedSeconds +
      2 * bFloor * fieldExcess * tauSeconds * -Math.expm1(exponent) +
      fieldExcess ** 2 * tauSeconds / 2 * -Math.expm1(2 * exponent);
    const dipoleCoefficient = (1e4 / 3.2e19) ** 2;
    this.spinPeriodSeconds = Math.sqrt(birthSpinPeriodSeconds ** 2 +
      2 * dipoleCoefficient * integralTeslaSquaredSeconds);
    this.spinFrequencyHz = 1 / this.spinPeriodSeconds;
    this.periodDerivativeSecondsPerSecond = dipoleCoefficient *
      this.dipolarMagneticFieldTesla ** 2 / this.spinPeriodSeconds;

    const radiusMetres = neutronStar.radiusKm * 1_000;
    this.magneticEnergyReferenceJoules = this.dipolarMagneticFieldTesla ** 2 /
      (2 * StellarMagnetar.VACUUM_PERMEABILITY_SI) *
      ((4 / 3) * Math.PI * radiusMetres ** 3);
    this.highFieldActive = ageYears <= StellarMagnetar.ACTIVE_AGE_LIMIT_YEARS &&
      this.dipolarMagneticFieldTesla >= StellarMagnetar.ACTIVE_FIELD_THRESHOLD_TESLA;

    if (![this.ageSinceFormationYears, this.dipolarMagneticFieldTesla,
      this.spinPeriodSeconds, this.spinFrequencyHz,
      this.periodDerivativeSecondsPerSecond, this.magneticEnergyReferenceJoules]
        .every(Number.isFinite) ||
        this.spinPeriodSeconds < birthSpinPeriodSeconds ||
        this.dipolarMagneticFieldTesla < StellarMagnetar.RESIDUAL_FIELD_TESLA ||
        this.dipolarMagneticFieldTesla > birthDipolarMagneticFieldTesla ||
        this.periodDerivativeSecondsPerSecond <= 0 ||
        this.magneticEnergyReferenceJoules <= 0) {
      throw new RangeError('The magnetar physical projection must remain finite and coherent.');
    }
    Object.freeze(this);
  }
}
