import { AtmosphereGas } from '../../domain/planetary/atmosphere-gas';
import { AtmosphereGasComponent } from '../../domain/planetary/atmosphere-gas-component';
import {
  NON_WATER_CONDENSABLE_GASES,
  condensableSaturationPressurePascal,
} from './atmosphere-condensable-thermodynamics';
import {
  atmosphereMultispeciesRadiativeColumnState,
} from './atmosphere-multispecies-condensation-model';

const EARTH_GRAVITY = 9.80665;

function gases(entries: readonly Readonly<[AtmosphereGas, number]>[]): readonly AtmosphereGasComponent[] {
  return entries.map(([gas, fraction]) => new AtmosphereGasComponent(gas, fraction));
}

function state(
  pressurePascal: number,
  gravityEarth: number,
  equilibriumTemperatureKelvin: number,
  composition: readonly Readonly<[AtmosphereGas, number]>[],
  synchronized = false,
) {
  return atmosphereMultispeciesRadiativeColumnState(
    pressurePascal,
    gravityEarth * EARTH_GRAVITY,
    equilibriumTemperatureKelvin,
    gases(composition),
    {
      isTidallySynchronized: synchronized,
      dayLengthHours: synchronized ? null : 24,
    },
  );
}

function species(result: ReturnType<typeof state>, gas: AtmosphereGas) {
  const value = result.condensableEquilibriumState.species(gas);
  if (value === null) throw new Error(`Expected ${gas} condensable diagnostic.`);
  return value;
}

describe('multispecies atmospheric condensation equilibrium', () => {
  it('strongly collapses incompatible CO2/SO2 on a Vathum-like ~75 K retained atmosphere', () => {
    const result = state(
      78_500,
      0.41,
      62,
      [
        [AtmosphereGas.NITROGEN, 0.61],
        [AtmosphereGas.CARBON_DIOXIDE, 0.269],
        [AtmosphereGas.ARGON, 0.080],
        [AtmosphereGas.CARBON_MONOXIDE, 0.023],
        [AtmosphereGas.SULFUR_DIOXIDE, 0.018],
      ],
    );

    expect(species(result, AtmosphereGas.CARBON_DIOXIDE).condensedFractionOfRetained01)
      .toBeGreaterThan(0.95);
    expect(species(result, AtmosphereGas.SULFUR_DIOXIDE).condensedFractionOfRetained01)
      .toBeGreaterThan(0.95);
    expect(result.effectiveSurfacePressurePascal).toBeLessThan(50_000);
    expect(result.condensableEquilibriumState.converged).toBe(true);
  });

  it('uses partial pressure rather than percentage for a Pulaer-like trace atmosphere', () => {
    const composition: readonly Readonly<[AtmosphereGas, number]>[] = [
      [AtmosphereGas.CARBON_DIOXIDE, 0.40],
      [AtmosphereGas.METHANE, 0.10],
      [AtmosphereGas.NITROGEN, 0.50],
    ];

    const microscopic = state(0.001, 0.22, 93, composition);
    const largerTrace = state(0.7, 0.22, 93, composition);

    expect(species(microscopic, AtmosphereGas.CARBON_DIOXIDE).condensedFractionOfRetained01)
      .toBeLessThan(species(largerTrace, AtmosphereGas.CARBON_DIOXIDE).condensedFractionOfRetained01);
    expect(largerTrace.effectiveSurfacePressurePascal).toBeGreaterThan(0);
    expect(0.7 - largerTrace.effectiveSurfacePressurePascal).toBeLessThan(0.7);
  });

  it('applies a bounded synchronous cold-trap temperature without treating Tmin as global', () => {
    const composition: readonly Readonly<[AtmosphereGas, number]>[] = [
      [AtmosphereGas.NITROGEN, 0.40],
      [AtmosphereGas.CARBON_DIOXIDE, 0.40],
      [AtmosphereGas.ARGON, 0.13],
      [AtmosphereGas.SULFUR_DIOXIDE, 0.05],
      [AtmosphereGas.WATER_VAPOR, 0.02],
    ];

    const rotating = state(64, 0.38, 160, composition, false);
    const synchronous = state(64, 0.38, 160, composition, true);
    const phase = synchronous.condensableEquilibriumState;

    expect(phase.coldTrapWeight01).toBeGreaterThan(0);
    expect(phase.effectiveCondensationTemperatureKelvin)
      .toBeLessThan(phase.meanSurfaceTemperatureKelvin);
    expect(phase.effectiveCondensationTemperatureKelvin)
      .toBeGreaterThan(phase.meanSurfaceTemperatureKelvin * 0.6);
    expect(synchronous.effectiveSurfacePressurePascal)
      .toBeLessThanOrEqual(rotating.effectiveSurfacePressurePascal);
    expect(synchronous.effectiveSurfacePressurePascal).toBeGreaterThan(10);
  });

  it('keeps a Triaraia-B4-like intermediate atmosphere substantial when pCO2 is below saturation', () => {
    const result = state(
      176_000,
      1.03,
      205,
      [
        [AtmosphereGas.NITROGEN, 0.586],
        [AtmosphereGas.CARBON_DIOXIDE, 0.281],
        [AtmosphereGas.ARGON, 0.084],
        [AtmosphereGas.CARBON_MONOXIDE, 0.022],
        [AtmosphereGas.SULFUR_DIOXIDE, 0.026],
        [AtmosphereGas.WATER_VAPOR, 0.001],
      ],
    );

    expect(result.effectiveSurfacePressurePascal).toBeGreaterThan(150_000);
    expect(species(result, AtmosphereGas.CARBON_DIOXIDE).condensedFractionOfRetained01)
      .toBeLessThan(1e-6);
  });

  it('leaves warm and hot CO2 controls essentially unchanged', () => {
    const warm = state(
      97_000,
      1.01,
      260,
      [
        [AtmosphereGas.CARBON_DIOXIDE, 0.28],
        [AtmosphereGas.NITROGEN, 0.60],
        [AtmosphereGas.ARGON, 0.08],
        [AtmosphereGas.WATER_VAPOR, 0.04],
      ],
    );
    const hot = state(
      40_000,
      0.35,
      355,
      [
        [AtmosphereGas.CARBON_DIOXIDE, 0.65],
        [AtmosphereGas.NITROGEN, 0.30],
        [AtmosphereGas.WATER_VAPOR, 0.05],
      ],
      true,
    );

    expect(species(warm, AtmosphereGas.CARBON_DIOXIDE).condensedFractionOfRetained01).toBe(0);
    expect(species(hot, AtmosphereGas.CARBON_DIOXIDE).condensedFractionOfRetained01).toBe(0);
  });

  it('conserves every retained condensable between gas and condensed reservoirs and normalizes final gas', () => {
    const result = state(
      80_000,
      0.5,
      120,
      [
        [AtmosphereGas.NITROGEN, 0.40],
        [AtmosphereGas.CARBON_DIOXIDE, 0.25],
        [AtmosphereGas.METHANE, 0.10],
        [AtmosphereGas.AMMONIA, 0.05],
        [AtmosphereGas.SULFUR_DIOXIDE, 0.05],
        [AtmosphereGas.ARGON, 0.05],
        [AtmosphereGas.WATER_VAPOR, 0.10],
      ],
    );

    for (const equilibrium of result.condensableEquilibriumState.speciesEquilibria) {
      expect(
        equilibrium.effectivePartialPressurePascal +
        equilibrium.condensedPartialPressurePascal,
      ).toBeCloseTo(equilibrium.sourcePartialPressurePascal, 7);
    }

    expect(result.effectiveGasComponents.reduce(
      (sum, component) => sum + component.moleFraction01,
      0,
    )).toBeCloseTo(1, 10);
  });

  it('has finite monotonic saturation curves over representative valid ranges', () => {
    for (const gas of NON_WATER_CONDENSABLE_GASES) {
      const temperatures = [70, 90, 120, 160, 200, 250, 300, 400];
      const pressures = temperatures.map(temperature =>
        condensableSaturationPressurePascal(gas, temperature)!);

      for (const pressure of pressures) {
        expect(Number.isFinite(pressure)).toBe(true);
        expect(pressure).toBeGreaterThanOrEqual(0);
      }
      for (let index = 1; index < pressures.length; index += 1) {
        expect(pressures[index]).toBeGreaterThanOrEqual(pressures[index - 1]);
      }
    }
  });

  it('allows a slow CO2 phase/greenhouse closure to converge beyond the former 16-iteration ceiling', () => {
    const result = atmosphereMultispeciesRadiativeColumnState(
      732_042.140734355,
      7.143331932176571,
      153.21788979694247,
      gases([
        [AtmosphereGas.NITROGEN, 0.2683983451450539],
        [AtmosphereGas.CARBON_DIOXIDE, 0.34065872427060073],
        [AtmosphereGas.WATER_VAPOR, 0.39094293058434526],
      ]),
      {
        isTidallySynchronized: false,
        dayLengthHours: 404.98583198867146,
      },
    );

    const carbonDioxide = species(result, AtmosphereGas.CARBON_DIOXIDE);
    const saturationTolerancePascal = Math.max(
      0.05,
      1e-7 * Math.max(
        1,
        carbonDioxide.sourcePartialPressurePascal,
        carbonDioxide.saturationPressurePascal,
      ),
    );

    expect(result.condensableEquilibriumState.iterationCount).toBeGreaterThan(16);
    expect(result.condensableEquilibriumState.converged).toBe(true);
    expect(
      carbonDioxide.effectivePartialPressurePascal -
        carbonDioxide.saturationPressurePascal,
    ).toBeLessThanOrEqual(saturationTolerancePascal);
  });

  it('keeps iterating through a very slow multispecies cold-trap closure beyond 256 iterations', () => {
    const result = atmosphereMultispeciesRadiativeColumnState(
      3_128_487.3809378957,
      16.25291851561602,
      70.87297657271847,
      gases([
        [AtmosphereGas.NITROGEN, 0.11679350920704819],
        [AtmosphereGas.CARBON_DIOXIDE, 0.10945632396931336],
        [AtmosphereGas.ARGON, 0.09145716857563473],
        [AtmosphereGas.CARBON_MONOXIDE, 0.1408651153942383],
        [AtmosphereGas.SULFUR_DIOXIDE, 0.18338169941718635],
        [AtmosphereGas.METHANE, 0.01839070784604999],
        [AtmosphereGas.AMMONIA, 0.29194070488389073],
        [AtmosphereGas.WATER_VAPOR, 0.04771477070663825],
      ]),
      {
        isTidallySynchronized: true,
        dayLengthHours: 3339.634264731721,
      },
    );

    expect(result.condensableEquilibriumState.iterationCount).toBeGreaterThan(256);
    expect(result.condensableEquilibriumState.converged).toBe(true);

    for (const equilibrium of result.condensableEquilibriumState.speciesEquilibria) {
      const saturationTolerancePascal = Math.max(
        0.05,
        1e-7 * Math.max(
          1,
          equilibrium.sourcePartialPressurePascal,
          equilibrium.saturationPressurePascal,
        ),
      );

      expect(
        equilibrium.effectivePartialPressurePascal -
          equilibrium.saturationPressurePascal,
      ).toBeLessThanOrEqual(saturationTolerancePascal);
    }
  });

  it('publishes a slow methane closure only after the final gas phase respects saturation within solver tolerance', () => {
    const result = state(
      100_000,
      0.55,
      70,
      [
        [AtmosphereGas.NITROGEN, 0.92],
        [AtmosphereGas.METHANE, 0.08],
      ],
    );

    const methane = species(result, AtmosphereGas.METHANE);
    const saturationTolerancePascal = Math.max(
      0.05,
      1e-7 * Math.max(
        1,
        methane.sourcePartialPressurePascal,
        methane.saturationPressurePascal,
      ),
    );

    expect(result.condensableEquilibriumState.iterationCount).toBeGreaterThan(1);
    expect(result.condensableEquilibriumState.converged).toBe(true);
    expect(
      methane.effectivePartialPressurePascal - methane.saturationPressurePascal,
    ).toBeLessThanOrEqual(saturationTolerancePascal);
  });

  it('is exactly deterministic for identical retained inventory and forcing', () => {
    const args = [
      80_000,
      0.5,
      120,
      [
        [AtmosphereGas.NITROGEN, 0.55],
        [AtmosphereGas.CARBON_DIOXIDE, 0.30],
        [AtmosphereGas.METHANE, 0.05],
        [AtmosphereGas.WATER_VAPOR, 0.10],
      ] as const,
    ] as const;

    expect(state(...args)).toEqual(state(...args));
  });

  it('omits an unrepresentable cryogenic trace species instead of constructing a zero mole fraction', () => {
    const result = state(
      1e12,
      1,
      1,
      [
        [AtmosphereGas.NITROGEN, 0.50],
        [AtmosphereGas.CARBON_DIOXIDE, 0.50],
      ],
    );

    expect(result.effectiveGasComponents.every(component => component.moleFraction01 > 0)).toBe(true);
    expect(result.effectiveGasComponents.every(component => Number.isFinite(component.moleFraction01))).toBe(true);
    expect(result.condensableEquilibriumState.converged).toBe(true);
  });

});
