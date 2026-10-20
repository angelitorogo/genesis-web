import { type AtmosphereGas } from './atmosphere-gas';
import type { MoonAtmospherePhysicalBalance32F1 } from './moon-atmosphere-physical-32-f-1';
import type { MoonAtmosphereFormationEvolution32F1e } from './moon-atmosphere-formation-evolution-32-f-1e';
import type { MoonAtmosphereAutomaticConstraints32F1c } from './moon-atmosphere-automatic-constraints-32-f-1c';

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
  readonly pressureBasis: 'CONDITIONAL_SCENARIO' | 'UNRESOLVED' | 'PHYSICAL_BALANCE';
  /** Independent 32.F.1 mass/rate balance when explicitly supplied; otherwise null. */
  readonly physicalBalance32F1?: MoonAtmospherePhysicalBalance32F1 | null;
  /** Automatic V2 gravity/temperature constraints, never a pressure source. */
  readonly automaticConstraints32F1c?: MoonAtmosphereAutomaticConstraints32F1c | null;
  /** Conditional one-orbit water-vapor sensitivity, never real surface pressure. */
  readonly formationEvolution32F1e?: MoonAtmosphereFormationEvolution32F1e | null;
  readonly species: readonly MoonAtmosphereSpeciesAssessment[];
  readonly irradiationReferenceEarth: number;
  readonly chargedParticleEnvironment: 'UNRESOLVED';
  readonly hostMagnetosphereShielding: 'UNRESOLVED';
}
