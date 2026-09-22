import { StellarBlackHole } from './stellar-black-hole';
import { CompactAccretionDisk } from './compact-accretion-disk';

/** Input from an INDEPENDENT future jet-launching model; NEVER inferred from AGN status. */
export interface RelativisticJetLaunchParameters {
  readonly launchingEstablished: true;
  readonly sourceIdentity: string;
  /** Bulk Lorentz factor, not an observed line-of-sight Doppler factor. */
  readonly bulkLorentzFactor: number;
  /** Angle of the bipolar jet axis to the observer; does not imply visibility. */
  readonly observerAxisAngleDegrees: number;
  /** Fraction of Mdot*c² channelled into both jets combined. */
  readonly kineticEnergyFraction: number;
}

/**
 * 27.7 — optional bipolar kinetic-power scale. No length, direction on the
 * galactic map, spin, beaming, detected radio flux, shocks or flare is invented.
 */
export class RelativisticJet {
  readonly launchParameters: Readonly<RelativisticJetLaunchParameters>;
  readonly bulkVelocityMetresPerSecond: number;
  readonly totalBipolarKineticPowerWatts: number;
  readonly powerPerJetWatts: number;

  constructor(
    readonly disk: CompactAccretionDisk,
    parameters: RelativisticJetLaunchParameters,
  ) {
    if (!(disk instanceof CompactAccretionDisk)) {
      throw new TypeError('27.7 relativistic jets require an existing accretion disk.');
    }
    if (!parameters || parameters.launchingEstablished !== true ||
      !/^[A-Za-z0-9:_-]{1,128}$/.test(parameters.sourceIdentity) ||
      !Number.isFinite(parameters.bulkLorentzFactor) ||
      parameters.bulkLorentzFactor < 1.1 || parameters.bulkLorentzFactor > 30 ||
      !Number.isFinite(parameters.observerAxisAngleDegrees) ||
      parameters.observerAxisAngleDegrees < 0 || parameters.observerAxisAngleDegrees > 180 ||
      !Number.isFinite(parameters.kineticEnergyFraction) ||
      parameters.kineticEnergyFraction <= 0 || parameters.kineticEnergyFraction > 0.4) {
      throw new RangeError('A jet requires explicit valid launching provenance, geometry and energetics.');
    }
    if (parameters.kineticEnergyFraction +
        CompactAccretionDisk.REFERENCE_RADIATIVE_EFFICIENCY > 1) {
      throw new RangeError('Total radiative and kinetic efficiencies cannot exceed rest-mass input.');
    }
    this.launchParameters = Object.freeze({ ...parameters });
    const beta = Math.sqrt(1 - 1 / parameters.bulkLorentzFactor ** 2);
    this.bulkVelocityMetresPerSecond = beta * StellarBlackHole.LIGHT_SPEED_M_PER_S;
    this.totalBipolarKineticPowerWatts = parameters.kineticEnergyFraction *
      disk.massAccretionRateKgPerSecond * StellarBlackHole.LIGHT_SPEED_M_PER_S ** 2;
    this.powerPerJetWatts = this.totalBipolarKineticPowerWatts / 2;
    if (![this.bulkVelocityMetresPerSecond, this.totalBipolarKineticPowerWatts,
      this.powerPerJetWatts].every(Number.isFinite) ||
      this.bulkVelocityMetresPerSecond <= 0 ||
      this.bulkVelocityMetresPerSecond >= StellarBlackHole.LIGHT_SPEED_M_PER_S ||
      this.powerPerJetWatts <= 0) {
      throw new RangeError('Jet power and speed must be finite and subluminal.');
    }
    Object.freeze(this);
  }
}
