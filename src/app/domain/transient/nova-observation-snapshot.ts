import { type NovaPhase } from './nova-phase';

export interface NovaObservationSnapshot {
  readonly elapsedDays: number;
  readonly phase: NovaPhase;
  readonly normalizedBrightness: number;
  readonly bolometricLuminosityWatts: number;
  readonly absoluteBolometricMagnitude: number;
  readonly photosphericTemperatureKelvin: number;
  readonly ejectaRadiusAu: number;
}
