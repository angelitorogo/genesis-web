import { AtmosphereGas } from '../../domain/planetary/atmosphere-gas';
import { AtmosphereGasComponent } from '../../domain/planetary/atmosphere-gas-component';
import {
  atmosphereRadiativeColumnState,
  waterSaturationVaporPressurePascal,
} from './atmosphere-radiative-column-model';

const EARTH_GRAVITY = 9.80665;

function gases(entries: readonly Readonly<[AtmosphereGas, number]>[]): readonly AtmosphereGasComponent[] {
  return entries.map(([gas, moleFraction01]) => new AtmosphereGasComponent(gas, moleFraction01));
}

function waterState(
  pressurePascal: number,
  gravityEarth: number,
  equilibriumKelvin: number,
  composition: readonly Readonly<[AtmosphereGas, number]>[],
) {
  return atmosphereRadiativeColumnState(
    pressurePascal,
    gravityEarth * EARTH_GRAVITY,
    equilibriumKelvin,
    gases(composition),
  );
}

describe('thermodynamic atmospheric H2O closure', () => {
  it('freezes/condenses almost all provisional vapor on a Chuthoria-like cold world', () => {
    const state = waterState(
      300_000,
      1.07,
      187,
      [
        [AtmosphereGas.WATER_VAPOR, 0.10],
        [AtmosphereGas.CARBON_DIOXIDE, 0.25],
        [AtmosphereGas.NITROGEN, 0.65],
      ],
    );

    expect(state.resolvedSurfaceTemperatureKelvin).toBeLessThan(250);
    expect(state.effectiveWaterVaporPartialPressurePascal)
      .toBeLessThan(state.sourceWaterVaporPartialPressurePascal * 0.01);
    expect(state.effectiveWaterVaporPartialPressurePascal)
      .toBeLessThanOrEqual(state.saturationVaporPressurePascal * 1.000001);
    expect(state.condensedWaterPartialPressurePascal).toBeGreaterThan(20_000);
  });

  it('limits a Phoseria-like temperate atmosphere by saturation instead of retaining 10 percent H2O', () => {
    const state = waterState(
      61_600,
      0.33,
      224,
      [
        [AtmosphereGas.WATER_VAPOR, 0.10],
        [AtmosphereGas.CARBON_DIOXIDE, 0.20],
        [AtmosphereGas.NITROGEN, 0.70],
      ],
    );

    expect(state.resolvedSurfaceTemperatureKelvin).toBeGreaterThan(270);
    expect(state.resolvedSurfaceTemperatureKelvin).toBeLessThan(330);
    expect(state.effectiveWaterVaporMixingRatio01).toBeLessThan(0.10);
    const convergenceTolerancePascal = Math.max(
      0.05,
      state.saturationVaporPressurePascal * 1e-7,
    );

    expect(Math.abs(
      state.effectiveWaterVaporPartialPressurePascal -
      state.saturationVaporPressurePascal,
    )).toBeLessThanOrEqual(convergenceTolerancePascal);
  });

  it('does not let a Stinaion-like high-pressure temperate world keep 13 percent H2O gaseous', () => {
    const state = waterState(
      586_000,
      1.24,
      204,
      [
        [AtmosphereGas.WATER_VAPOR, 0.131],
        [AtmosphereGas.CARBON_DIOXIDE, 0.215],
        [AtmosphereGas.NITROGEN, 0.654],
      ],
    );

    expect(state.effectiveWaterVaporMixingRatio01).toBeLessThan(0.02);
    expect(state.condensedWaterPartialPressurePascal).toBeGreaterThan(50_000);
    expect(state.effectiveSurfacePressurePascal).toBeLessThan(586_000);
  });

  it('lets a Tromia-column-like dense water-rich atmosphere retain more vapor than a colder equivalent while condensing multi-bar excess', () => {
    const composition: readonly Readonly<[AtmosphereGas, number]>[] = [
      [AtmosphereGas.WATER_VAPOR, 0.224],
      [AtmosphereGas.CARBON_DIOXIDE, 0.08],
      [AtmosphereGas.METHANE, 0.02],
      [AtmosphereGas.NITROGEN, 0.676],
    ];

    const coldState = waterState(
      1_602_400,
      0.89,
      170,
      composition,
    );

    const state = waterState(
      1_602_400,
      0.89,
      205,
      composition,
    );

    expect(state.resolvedSurfaceTemperatureKelvin)
      .toBeGreaterThan(coldState.resolvedSurfaceTemperatureKelvin);
    expect(state.effectiveWaterVaporPartialPressurePascal)
      .toBeGreaterThan(coldState.effectiveWaterVaporPartialPressurePascal);
    expect(state.effectiveWaterVaporPartialPressurePascal)
      .toBeLessThan(state.sourceWaterVaporPartialPressurePascal * 0.10);
    expect(state.condensedWaterPartialPressurePascal).toBeGreaterThan(300_000);
  });

  it('raises the saturation-vapor ceiling monotonically with temperature over ice, temperate and hot regimes', () => {
    const temperatures = [230, 260, 280, 300, 320, 350];
    const pressures = temperatures.map(waterSaturationVaporPressurePascal);

    for (let index = 1; index < pressures.length; index += 1) {
      expect(pressures[index]).toBeGreaterThan(pressures[index - 1]);
    }
  });

  it('conserves retained H2O between effective atmospheric vapor and condensed reservoir', () => {
    const state = waterState(
      300_000,
      1,
      220,
      [
        [AtmosphereGas.WATER_VAPOR, 0.12],
        [AtmosphereGas.CARBON_DIOXIDE, 0.20],
        [AtmosphereGas.NITROGEN, 0.68],
      ],
    );

    expect(
      state.effectiveWaterVaporPartialPressurePascal +
      state.condensedWaterPartialPressurePascal,
    ).toBeCloseTo(state.sourceWaterVaporPartialPressurePascal, 8);
  });

  it('renormalizes the final gas composition to one after H2O condensation', () => {
    const state = waterState(
      500_000,
      1,
      220,
      [
        [AtmosphereGas.WATER_VAPOR, 0.20],
        [AtmosphereGas.CARBON_DIOXIDE, 0.10],
        [AtmosphereGas.NITROGEN, 0.70],
      ],
    );

    expect(
      state.effectiveGasComponents.reduce((sum, component) => sum + component.moleFraction01, 0),
    ).toBeCloseTo(1, 12);
  });

  it('is exactly deterministic for identical retained inventory and climate forcing', () => {
    const input = gases([
      [AtmosphereGas.WATER_VAPOR, 0.12],
      [AtmosphereGas.CARBON_DIOXIDE, 0.25],
      [AtmosphereGas.NITROGEN, 0.63],
    ]);

    expect(atmosphereRadiativeColumnState(250_000, 0.7 * EARTH_GRAVITY, 220, input))
      .toEqual(atmosphereRadiativeColumnState(250_000, 0.7 * EARTH_GRAVITY, 220, input));
  });

  it('converges within the bounded deterministic iteration budget without oscillation', () => {
    const fixtures = [
      waterState(300_000, 1.07, 187, [[AtmosphereGas.WATER_VAPOR, 0.10], [AtmosphereGas.CARBON_DIOXIDE, 0.25], [AtmosphereGas.NITROGEN, 0.65]]),
      waterState(61_600, 0.33, 224, [[AtmosphereGas.WATER_VAPOR, 0.10], [AtmosphereGas.CARBON_DIOXIDE, 0.20], [AtmosphereGas.NITROGEN, 0.70]]),
      waterState(586_000, 1.24, 204, [[AtmosphereGas.WATER_VAPOR, 0.131], [AtmosphereGas.CARBON_DIOXIDE, 0.215], [AtmosphereGas.NITROGEN, 0.654]]),
      waterState(1_602_400, 0.89, 205, [[AtmosphereGas.WATER_VAPOR, 0.224], [AtmosphereGas.CARBON_DIOXIDE, 0.08], [AtmosphereGas.METHANE, 0.02], [AtmosphereGas.NITROGEN, 0.676]]),
    ];

    for (const state of fixtures) {
      expect(state.waterVaporConverged).toBe(true);
      expect(state.waterVaporIterationCount).toBeGreaterThan(0);
      expect(state.waterVaporIterationCount).toBeLessThanOrEqual(8);
    }
  });

  it('keeps a pure-steam retained atmosphere numerically valid instead of requiring a dry-gas floor', () => {
    const state = waterState(
      500_000,
      1,
      400,
      [
        [AtmosphereGas.WATER_VAPOR, 1],
      ],
    );

    expect(state.effectiveSurfacePressurePascal).toBeGreaterThan(0);
    expect(state.effectiveWaterVaporMixingRatio01).toBeCloseTo(1, 12);
    expect(state.effectiveWaterVaporPartialPressurePascal)
      .toBeLessThanOrEqual(state.saturationVaporPressurePascal * 1.000001);
  });

  it('does not impose an arbitrary low H2O cap on a genuinely hot steam-capable atmosphere', () => {
    const state = waterState(
      1_000_000,
      1,
      450,
      [
        [AtmosphereGas.WATER_VAPOR, 0.30],
        [AtmosphereGas.CARBON_DIOXIDE, 0.10],
        [AtmosphereGas.NITROGEN, 0.60],
      ],
    );

    expect(state.condensedWaterPartialPressurePascal).toBeCloseTo(0, 8);
    expect(state.effectiveWaterVaporMixingRatio01).toBeCloseTo(0.30, 10);
  });
});
