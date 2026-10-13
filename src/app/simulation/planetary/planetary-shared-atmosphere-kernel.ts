import { type AtmosphereGasComponent } from '../../domain/planetary/atmosphere-gas-component';
import { type AtmosphereCondensationClimateContext,
  type AtmosphereMultispeciesRadiativeColumnState,
  atmosphereMultispeciesRadiativeColumnState,
} from './atmosphere-multispecies-condensation-model';

/**
 * 31.4k: one physical atmospheric-column entry point for conventional and
 * compact planetary hosts. The caller supplies a host-specific equilibrium
 * temperature and a properly sourced volatile inventory; the solver must
 * NEVER invent missing irradiation or a stellar evolutionary history.
 *
 * Identical physical inputs produce identical condensation, phase equilibrium,
 * greenhouse and redistribution states regardless of host category.
 */
export function resolvePlanetaryAtmosphericColumn(input: Readonly<{
  retainedSurfacePressurePascal: number;
  surfaceGravityMetersPerSecondSquared: number;
  equilibriumTemperatureKelvin: number;
  gasComponents: readonly AtmosphereGasComponent[];
  climateContext: AtmosphereCondensationClimateContext;
}>): AtmosphereMultispeciesRadiativeColumnState {
  return atmosphereMultispeciesRadiativeColumnState(
    input.retainedSurfacePressurePascal,
    input.surfaceGravityMetersPerSecondSquared,
    input.equilibriumTemperatureKelvin,
    input.gasComponents,
    input.climateContext,
  );
}
