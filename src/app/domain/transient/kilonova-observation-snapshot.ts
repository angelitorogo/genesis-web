import { type KilonovaPhase } from './kilonova-phase';

export interface KilonovaObservationSnapshot {
  readonly elapsedDays: number;
  readonly phase: KilonovaPhase;
  readonly blueLuminosityWatts: number;
  readonly redLuminosityWatts: number;
  readonly bolometricLuminosityWatts: number;
  readonly blueEjectaRadiusAu: number;
  readonly redEjectaRadiusAu: number;
}
