import { AtmosphereGas } from '../../domain/planetary/atmosphere-gas';
import { AtmosphereGasComponent } from '../../domain/planetary/atmosphere-gas-component';
import { greenhouseLongwaveTrappingFraction01 } from '../../domain/planetary/atmosphere-greenhouse-effect';
import { atmosphereMultispeciesRadiativeColumnState } from './atmosphere-multispecies-condensation-model';
import { resolvePlanetaryAtmosphericColumn } from './planetary-shared-atmosphere-kernel';

/** 31.4k: conventional and compact pathways must resolve the SAME physics for
 * the same initial P, g, gases and radiative equilibrium (no separate solver). */
describe('31.4k — núcleo atmosférico compartido', () => {
  const input = Object.freeze({
    retainedSurfacePressurePascal: 90_000,
    surfaceGravityMetersPerSecondSquared: 9.8,
    equilibriumTemperatureKelvin: 255,
    gasComponents: Object.freeze([
      new AtmosphereGasComponent(AtmosphereGas.NITROGEN, 0.75),
      new AtmosphereGasComponent(AtmosphereGas.CARBON_DIOXIDE, 0.20),
      new AtmosphereGasComponent(AtmosphereGas.WATER_VAPOR, 0.05),
    ]),
    climateContext: Object.freeze({isTidallySynchronized: false, dayLengthHours: 24}),
  });
  it('shares the same condensable multiespecies closure and greenhouse diagnostics', () => {
    const shared = resolvePlanetaryAtmosphericColumn(input);
    const underlying = atmosphereMultispeciesRadiativeColumnState(
      input.retainedSurfacePressurePascal,
      input.surfaceGravityMetersPerSecondSquared,
      input.equilibriumTemperatureKelvin,
      input.gasComponents,
      input.climateContext,
    );
    expect(shared).toEqual(underlying);
    expect(shared.condensableEquilibriumState.converged).toBe(true);
    expect(shared.effectiveSurfacePressurePascal).toBeGreaterThan(0);
    const trapping = greenhouseLongwaveTrappingFraction01(shared.infraredOpticalDepthProxy);
    expect(trapping).toBeGreaterThanOrEqual(0);
    expect(trapping).toBeLessThanOrEqual(1);
  });
});
