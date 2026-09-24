import { AtmosphereGas } from '../../domain/planetary/atmosphere-gas';

const VERY_HIGH_SATURATION_PRESSURE_PASCAL = 1e12;

interface PhaseCurve {
  readonly tripleTemperatureKelvin: number;
  readonly triplePressurePascal: number;
  readonly normalBoilingTemperatureKelvin: number;
  readonly criticalTemperatureKelvin: number;
  readonly criticalPressurePascal: number;
  /** Solid-vapor branch is slightly steeper than the liquid-vapor branch. */
  readonly sublimationSlopeMultiplier: number;
}

const PHASE_CURVES: Readonly<Partial<Record<AtmosphereGas, PhaseCurve>>> = Object.freeze({
  [AtmosphereGas.CARBON_DIOXIDE]: Object.freeze({
    tripleTemperatureKelvin: 216.592,
    triplePressurePascal: 518_500,
    normalBoilingTemperatureKelvin: 194.67, // normal sublimation point
    criticalTemperatureKelvin: 304.128,
    criticalPressurePascal: 7_377_300,
    sublimationSlopeMultiplier: 1,
  }),
  [AtmosphereGas.AMMONIA]: Object.freeze({
    tripleTemperatureKelvin: 195.40,
    triplePressurePascal: 6_060,
    normalBoilingTemperatureKelvin: 239.82,
    criticalTemperatureKelvin: 405.40,
    criticalPressurePascal: 11_330_000,
    sublimationSlopeMultiplier: 1.18,
  }),
  [AtmosphereGas.METHANE]: Object.freeze({
    tripleTemperatureKelvin: 90.694,
    triplePressurePascal: 11_696,
    normalBoilingTemperatureKelvin: 111.66,
    criticalTemperatureKelvin: 190.564,
    criticalPressurePascal: 4_599_200,
    sublimationSlopeMultiplier: 1.14,
  }),
  [AtmosphereGas.SULFUR_DIOXIDE]: Object.freeze({
    tripleTemperatureKelvin: 197.69,
    triplePressurePascal: 1_670,
    normalBoilingTemperatureKelvin: 263.05,
    criticalTemperatureKelvin: 430.64,
    criticalPressurePascal: 7_884_000,
    sublimationSlopeMultiplier: 1.16,
  }),
  [AtmosphereGas.NITROGEN]: Object.freeze({
    tripleTemperatureKelvin: 63.151,
    triplePressurePascal: 12_520,
    normalBoilingTemperatureKelvin: 77.355,
    criticalTemperatureKelvin: 126.192,
    criticalPressurePascal: 3_395_800,
    sublimationSlopeMultiplier: 1.10,
  }),
  [AtmosphereGas.CARBON_MONOXIDE]: Object.freeze({
    tripleTemperatureKelvin: 68.16,
    triplePressurePascal: 15_400,
    normalBoilingTemperatureKelvin: 81.64,
    criticalTemperatureKelvin: 132.86,
    criticalPressurePascal: 3_499_000,
    sublimationSlopeMultiplier: 1.10,
  }),
  [AtmosphereGas.ARGON]: Object.freeze({
    tripleTemperatureKelvin: 83.806,
    triplePressurePascal: 68_900,
    normalBoilingTemperatureKelvin: 87.302,
    criticalTemperatureKelvin: 150.687,
    criticalPressurePascal: 4_863_000,
    sublimationSlopeMultiplier: 1.08,
  }),
  [AtmosphereGas.OXYGEN]: Object.freeze({
    tripleTemperatureKelvin: 54.36,
    triplePressurePascal: 146,
    normalBoilingTemperatureKelvin: 90.188,
    criticalTemperatureKelvin: 154.581,
    criticalPressurePascal: 5_043_000,
    sublimationSlopeMultiplier: 1.10,
  }),
});

export const NON_WATER_CONDENSABLE_GASES: readonly AtmosphereGas[] = Object.freeze([
  AtmosphereGas.CARBON_DIOXIDE,
  AtmosphereGas.AMMONIA,
  AtmosphereGas.METHANE,
  AtmosphereGas.SULFUR_DIOXIDE,
  AtmosphereGas.NITROGEN,
  AtmosphereGas.CARBON_MONOXIDE,
  AtmosphereGas.ARGON,
  AtmosphereGas.OXYGEN,
]);

export function condensableSaturationPressurePascal(
  gas: AtmosphereGas,
  temperatureKelvin: number,
): number | null {
  if (!Number.isFinite(temperatureKelvin) || temperatureKelvin <= 0) {
    throw new RangeError(`temperatureKelvin must be finite and positive: ${temperatureKelvin}.`);
  }

  const curve = PHASE_CURVES[gas];
  if (curve === undefined) return null;

  if (temperatureKelvin >= curve.criticalTemperatureKelvin) {
    return VERY_HIGH_SATURATION_PRESSURE_PASCAL;
  }

  const liquidSlope = slopeFromTwoPoints(
    curve.tripleTemperatureKelvin,
    curve.triplePressurePascal,
    curve.normalBoilingTemperatureKelvin,
    101_325,
  );

  if (temperatureKelvin >= curve.tripleTemperatureKelvin) {
    return finitePositivePressure(
      curve.triplePressurePascal * Math.exp(
        liquidSlope * (
          1 / curve.tripleTemperatureKelvin -
          1 / temperatureKelvin
        ),
      ),
      curve.criticalPressurePascal,
    );
  }

  let sublimationSlope = liquidSlope * curve.sublimationSlopeMultiplier;

  /* CO2 has a measured 1-atm sublimation point, so use both solid-vapor
   * anchors directly instead of deriving the low-temperature slope from the
   * liquid-vapor branch. */
  if (gas === AtmosphereGas.CARBON_DIOXIDE) {
    sublimationSlope = slopeFromTwoPoints(
      curve.normalBoilingTemperatureKelvin,
      101_325,
      curve.tripleTemperatureKelvin,
      curve.triplePressurePascal,
    );
  }

  return finitePositivePressure(
    curve.triplePressurePascal * Math.exp(
      sublimationSlope * (
        1 / curve.tripleTemperatureKelvin -
        1 / temperatureKelvin
      ),
    ),
    curve.triplePressurePascal,
  );
}

function slopeFromTwoPoints(
  temperature1Kelvin: number,
  pressure1Pascal: number,
  temperature2Kelvin: number,
  pressure2Pascal: number,
): number {
  return Math.log(pressure2Pascal / pressure1Pascal) /
    (1 / temperature1Kelvin - 1 / temperature2Kelvin);
}

function finitePositivePressure(value: number, upperBound: number): number {
  if (!Number.isFinite(value)) return upperBound;
  return Math.max(0, Math.min(upperBound, value));
}
