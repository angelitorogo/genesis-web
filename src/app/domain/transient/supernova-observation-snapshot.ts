import { type SupernovaPhase } from './supernova-phase';

export interface SupernovaObservationSnapshot {
  readonly elapsedDays: number;
  readonly phase: SupernovaPhase;
  readonly bolometricLuminosityWatts: number;
  readonly absoluteBolometricMagnitude: number;
  readonly photosphericTemperatureKelvin: number;
  readonly ejectaRadiusAu: number;
  readonly normalizedBrightness: number;
}
