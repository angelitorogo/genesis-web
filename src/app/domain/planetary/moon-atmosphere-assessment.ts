import { type AtmosphereGas } from './atmosphere-gas';

/**
 * B — First-order, explicitly conditional lunar gas-column characterization.
 * No observational pressure, atmospheric history, charged-particle flux,
 * stellar EUV or host magnetosphere are available from phase 21.
 * This scenario must NOT be used as a proven surface pressure or as a
 * retroactive input to the frozen 21.5–21.6 water/habitability engines.
 */
export interface MoonAtmosphereSpeciesAssessment {
  readonly gas: AtmosphereGas;
  readonly moleFraction01: number;
  readonly partialPressurePascal: number;
}

export interface MoonAtmosphereAssessment {
  /** Estimated available volatile source; not an observed inventory. */
  readonly volatileInventoryIndex01: number;
  readonly thermalEscapeSupportIndex01: number;
  readonly replenishmentSupportIndex01: number;
  readonly condensationRemovalIndex01: number;
  /** Null if a hydrostatic pressure estimate is not physically defensible. */
  readonly estimatedSurfacePressurePascal: number | null;
  readonly pressureBasis: 'CONDITIONAL_SCENARIO' | 'UNRESOLVED';
  readonly species: readonly MoonAtmosphereSpeciesAssessment[];
  readonly irradiationReferenceEarth: number;
  readonly chargedParticleEnvironment: 'UNRESOLVED';
  readonly hostMagnetosphereShielding: 'UNRESOLVED';
}
