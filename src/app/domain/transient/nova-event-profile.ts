import { type NovaProgenitorProfile } from './nova-progenitor';
import { type NovaType } from './nova-type';

export class NovaEventProfile {
  constructor(
    readonly type: NovaType,
    readonly progenitor: NovaProgenitorProfile,
    readonly ejectaMassSolar: number,
    readonly retainedEnvelopeMassSolar: number,
    readonly kineticEnergyJoules: number,
    readonly characteristicEjectaVelocityKmS: number,
    readonly peakBolometricLuminosityWatts: number,
    readonly peakAbsoluteBolometricMagnitude: number,
    readonly peakPhotosphericTemperatureKelvin: number,
    readonly riseTimeDays: number,
    readonly declineTwoMagnitudeDays: number,
    readonly nebularTransitionDays: number,
    readonly returnToQuiescenceDays: number,
    readonly recurrenceIntervalYears: number,
  ) {
    assertPositive(ejectaMassSolar, 'ejectaMassSolar');
    assertNonNegative(retainedEnvelopeMassSolar, 'retainedEnvelopeMassSolar');
    assertPositive(kineticEnergyJoules, 'kineticEnergyJoules');
    assertPositive(characteristicEjectaVelocityKmS, 'characteristicEjectaVelocityKmS');
    assertPositive(peakBolometricLuminosityWatts, 'peakBolometricLuminosityWatts');
    assertPositive(peakPhotosphericTemperatureKelvin, 'peakPhotosphericTemperatureKelvin');
    assertPositive(riseTimeDays, 'riseTimeDays');
    assertPositive(declineTwoMagnitudeDays, 'declineTwoMagnitudeDays');
    assertPositive(nebularTransitionDays, 'nebularTransitionDays');
    assertPositive(returnToQuiescenceDays, 'returnToQuiescenceDays');
    assertPositive(recurrenceIntervalYears, 'recurrenceIntervalYears');

    if (ejectaMassSolar + retainedEnvelopeMassSolar > progenitor.ignitionEnvelopeMassSolar * 1.000001) {
      throw new RangeError('Nova event cannot process more envelope mass than was accumulated.');
    }
    if (!(riseTimeDays < nebularTransitionDays && nebularTransitionDays < returnToQuiescenceDays)) {
      throw new RangeError('Nova temporal milestones must be strictly ordered.');
    }
  }
}

function assertPositive(value: number, name: string): void {
  if (!Number.isFinite(value) || value <= 0) throw new RangeError(`${name} must be finite and > 0.`);
}
function assertNonNegative(value: number, name: string): void {
  if (!Number.isFinite(value) || value < 0) throw new RangeError(`${name} must be finite and >= 0.`);
}
