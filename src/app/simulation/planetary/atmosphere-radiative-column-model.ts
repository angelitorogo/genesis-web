import {
  AtmosphereGas,
} from '../../domain/planetary/atmosphere-gas';

import {
  type AtmosphereGasComponent,
} from '../../domain/planetary/atmosphere-gas-component';

import {
  greenhouseTemperatureAmplificationFactor,
} from '../../domain/planetary/atmosphere-greenhouse-effect';

import {
  PLANET_V1_EARTH_SURFACE_GRAVITY_METERS_PER_SECOND_SQUARED,
} from '../../domain/planetary/planet-physical-properties';

const EARTH_REFERENCE_PRESSURE_PASCAL =
  101_325;

const WATER_TRIPLE_POINT_TEMPERATURE_KELVIN =
  273.16;

const WATER_TRIPLE_POINT_VAPOR_PRESSURE_PASCAL =
  611.657;

/** Approximate L_v / R_v for water around the terrestrial climate range. */
const WATER_CLAUSIUS_CLAPEYRON_KELVIN =
  5_423;

const MAX_PRESSURE_BROADENING_FACTOR =
  2.5;

const MAX_HYDROGEN_CIA_OPTICAL_DEPTH =
  8;

const MAX_DENSE_CONTINUUM_OPTICAL_DEPTH =
  50;

export interface AtmosphereRadiativeGasDiagnostic {
  readonly gas:
    AtmosphereGas;

  readonly mixingRatio01:
    number;

  readonly partialPressurePascal:
    number;

  readonly columnMassEarth:
    number;

  readonly effectivePartialPressurePascal:
    number;

  readonly effectiveColumnMassEarth:
    number;

  readonly opticalDepthContribution:
    number;
}

export interface AtmosphereRadiativeColumnState {
  readonly totalColumnMassEarth:
    number;

  readonly pressureBroadeningFactor:
    number;

  readonly infraredOpticalDepthProxy:
    number;

  readonly preliminarySurfaceTemperatureKelvin:
    number;

  readonly greenhouseGasDiagnostics:
    readonly AtmosphereRadiativeGasDiagnostic[];
}

interface SaturatingGasProfile {
  readonly maximumLineOpticalDepth:
    number;

  readonly saturationColumnMassEarth:
    number;

  readonly saturationExponent:
    number;
}

const SATURATING_GAS_PROFILES:
  Readonly<Partial<Record<AtmosphereGas, SaturatingGasProfile>>> =
  Object.freeze({
    [AtmosphereGas.CARBON_DIOXIDE]:
      Object.freeze({
        maximumLineOpticalDepth: 2.0,
        saturationColumnMassEarth: 0.20,
        saturationExponent: 0.78,
      }),

    [AtmosphereGas.WATER_VAPOR]:
      Object.freeze({
        maximumLineOpticalDepth: 2.6,
        saturationColumnMassEarth: 0.012,
        saturationExponent: 0.72,
      }),

    [AtmosphereGas.METHANE]:
      Object.freeze({
        maximumLineOpticalDepth: 1.5,
        saturationColumnMassEarth: 0.008,
        saturationExponent: 0.72,
      }),

    [AtmosphereGas.SULFUR_DIOXIDE]:
      Object.freeze({
        maximumLineOpticalDepth: 1.0,
        saturationColumnMassEarth: 0.025,
        saturationExponent: 0.75,
      }),

    [AtmosphereGas.AMMONIA]:
      Object.freeze({
        maximumLineOpticalDepth: 1.5,
        saturationColumnMassEarth: 0.006,
        saturationExponent: 0.70,
      }),
  });

/**
 * Hotfix climático — physically bounded procedural longwave-column model.
 *
 * The model deliberately remains grey/coarse, but unlike the old V1 proxy it
 * does not derive optical depth from greenhouse mixing ratio alone. Each gas is
 * evaluated from its absolute partial pressure and P/g column. Strong molecular
 * bands use a smooth saturating response. N2/Ar/O2/He/CO contribute no direct
 * line opacity here, while total column still broadens active molecular bands.
 *
 * H2 is handled separately through a collision-induced absorption proxy that
 * scales with both the H2 column and the total atmospheric column. H2O gets a
 * single bounded feedback pass: the radiatively active vapor pressure cannot
 * exceed either the retained inventory or the saturation vapor pressure at the
 * preliminary greenhouse temperature. This prevents cold, thin atmospheres from
 * using an arbitrarily large H2O mixing ratio as if all of it could remain vapor.
 */
export function atmosphereRadiativeColumnState(
  retainedSurfacePressurePascal:
    number,

  surfaceGravityMetersPerSecondSquared:
    number,

  equilibriumTemperatureKelvin:
    number,

  gasComponents:
    readonly AtmosphereGasComponent[],
): AtmosphereRadiativeColumnState {

  assertPositiveFinite(
    retainedSurfacePressurePascal,
    'retainedSurfacePressurePascal',
  );

  assertPositiveFinite(
    surfaceGravityMetersPerSecondSquared,
    'surfaceGravityMetersPerSecondSquared',
  );

  assertPositiveFinite(
    equilibriumTemperatureKelvin,
    'equilibriumTemperatureKelvin',
  );

  const surfaceGravityEarth =
    surfaceGravityMetersPerSecondSquared /
    PLANET_V1_EARTH_SURFACE_GRAVITY_METERS_PER_SECOND_SQUARED;

  const totalColumnMassEarth =
    retainedSurfacePressurePascal /
    EARTH_REFERENCE_PRESSURE_PASCAL /
    surfaceGravityEarth;

  const pressureBroadeningFactor =
    Math.min(
      MAX_PRESSURE_BROADENING_FACTOR,
      1 +
        0.35 *
          Math.log1p(
            totalColumnMassEarth,
          ),
    );

  const diagnostics:
    AtmosphereRadiativeGasDiagnostic[] =
    [];

  let nonWaterLineOpticalDepth =
    0;

  let hydrogenMoleFraction01 =
    0;

  let nonWaterGreenhouseMoleFraction01 =
    0;

  let waterComponent:
    AtmosphereGasComponent | null =
    null;

  for (
    const component of
    gasComponents
  ) {
    const partialPressurePascal =
      retainedSurfacePressurePascal *
      component.moleFraction01;

    const columnMassEarth =
      partialPressurePascal /
      EARTH_REFERENCE_PRESSURE_PASCAL /
      surfaceGravityEarth;

    if (
      component.gas ===
      AtmosphereGas.WATER_VAPOR
    ) {
      waterComponent =
        component;
      continue;
    }

    if (
      component.gas ===
      AtmosphereGas.HYDROGEN
    ) {
      hydrogenMoleFraction01 =
        component.moleFraction01;
      continue;
    }

    const profile =
      SATURATING_GAS_PROFILES[
        component.gas
      ];

    if (
      profile ===
      undefined
    ) {
      continue;
    }

    const opticalDepthContribution =
      saturatingLineOpticalDepth(
        columnMassEarth,
        profile,
      ) *
      pressureBroadeningFactor;

    nonWaterLineOpticalDepth +=
      opticalDepthContribution;

    nonWaterGreenhouseMoleFraction01 +=
      component.moleFraction01;

    diagnostics.push(
      Object.freeze({
        gas: component.gas,
        mixingRatio01: component.moleFraction01,
        partialPressurePascal,
        columnMassEarth,
        effectivePartialPressurePascal: partialPressurePascal,
        effectiveColumnMassEarth: columnMassEarth,
        opticalDepthContribution,
      }),
    );
  }

  const hydrogenPartialPressurePascal =
    retainedSurfacePressurePascal *
    hydrogenMoleFraction01;

  const hydrogenColumnMassEarth =
    hydrogenPartialPressurePascal /
    EARTH_REFERENCE_PRESSURE_PASCAL /
    surfaceGravityEarth;

  const hydrogenCollisionInducedOpticalDepth =
    hydrogenMoleFraction01 <=
      0
      ? 0
      : Math.min(
          MAX_HYDROGEN_CIA_OPTICAL_DEPTH,
          0.7 *
            Math.log1p(
              hydrogenColumnMassEarth *
              totalColumnMassEarth /
              0.03,
            ),
        );

  if (
    hydrogenMoleFraction01 >
    0
  ) {
    diagnostics.push(
      Object.freeze({
        gas: AtmosphereGas.HYDROGEN,
        mixingRatio01: hydrogenMoleFraction01,
        partialPressurePascal: hydrogenPartialPressurePascal,
        columnMassEarth: hydrogenColumnMassEarth,
        effectivePartialPressurePascal: hydrogenPartialPressurePascal,
        effectiveColumnMassEarth: hydrogenColumnMassEarth,
        opticalDepthContribution: hydrogenCollisionInducedOpticalDepth,
      }),
    );
  }

  const preliminaryDenseContinuumOpticalDepth =
    denseAtmosphereContinuumOpticalDepth(
      totalColumnMassEarth,
      nonWaterGreenhouseMoleFraction01 +
        0.2 *
          hydrogenMoleFraction01,
    );

  const preliminaryOpticalDepth =
    nonWaterLineOpticalDepth +
    hydrogenCollisionInducedOpticalDepth +
    preliminaryDenseContinuumOpticalDepth;

  const preliminarySurfaceTemperatureKelvin =
    equilibriumTemperatureKelvin *
    greenhouseTemperatureAmplificationFactor(
      preliminaryOpticalDepth,
    );

  let waterLineOpticalDepth =
    0;

  let effectiveWaterMoleFraction01 =
    0;

  if (
    waterComponent !==
      null
  ) {
    const actualWaterPartialPressurePascal =
      retainedSurfacePressurePascal *
      waterComponent.moleFraction01;

    const saturationVaporPressurePascal =
      waterSaturationVaporPressurePascal(
        preliminarySurfaceTemperatureKelvin,
      );

    const effectiveWaterPartialPressurePascal =
      Math.min(
        actualWaterPartialPressurePascal,
        saturationVaporPressurePascal,
      );

    const actualWaterColumnMassEarth =
      actualWaterPartialPressurePascal /
      EARTH_REFERENCE_PRESSURE_PASCAL /
      surfaceGravityEarth;

    const effectiveWaterColumnMassEarth =
      effectiveWaterPartialPressurePascal /
      EARTH_REFERENCE_PRESSURE_PASCAL /
      surfaceGravityEarth;

    const waterProfile =
      SATURATING_GAS_PROFILES[
        AtmosphereGas.WATER_VAPOR
      ]!;

    waterLineOpticalDepth =
      saturatingLineOpticalDepth(
        effectiveWaterColumnMassEarth,
        waterProfile,
      ) *
      pressureBroadeningFactor;

    effectiveWaterMoleFraction01 =
      effectiveWaterPartialPressurePascal /
      retainedSurfacePressurePascal;

    diagnostics.push(
      Object.freeze({
        gas: AtmosphereGas.WATER_VAPOR,
        mixingRatio01: waterComponent.moleFraction01,
        partialPressurePascal: actualWaterPartialPressurePascal,
        columnMassEarth: actualWaterColumnMassEarth,
        effectivePartialPressurePascal: effectiveWaterPartialPressurePascal,
        effectiveColumnMassEarth: effectiveWaterColumnMassEarth,
        opticalDepthContribution: waterLineOpticalDepth,
      }),
    );
  }

  const finalDenseContinuumOpticalDepth =
    denseAtmosphereContinuumOpticalDepth(
      totalColumnMassEarth,
      nonWaterGreenhouseMoleFraction01 +
        effectiveWaterMoleFraction01 +
        0.2 *
          hydrogenMoleFraction01,
    );

  const infraredOpticalDepthProxy =
    nonWaterLineOpticalDepth +
    hydrogenCollisionInducedOpticalDepth +
    waterLineOpticalDepth +
    finalDenseContinuumOpticalDepth;

  return Object.freeze({
    totalColumnMassEarth,
    pressureBroadeningFactor,
    infraredOpticalDepthProxy,
    preliminarySurfaceTemperatureKelvin,
    greenhouseGasDiagnostics:
      Object.freeze([
        ...diagnostics,
      ]),
  });
}

export function waterSaturationVaporPressurePascal(
  temperatureKelvin:
    number,
): number {

  assertPositiveFinite(
    temperatureKelvin,
    'temperatureKelvin',
  );

  const boundedTemperatureKelvin =
    Math.min(
      373.15,
      Math.max(
        150,
        temperatureKelvin,
      ),
    );

  return WATER_TRIPLE_POINT_VAPOR_PRESSURE_PASCAL *
    Math.exp(
      WATER_CLAUSIUS_CLAPEYRON_KELVIN *
      (
        1 /
          WATER_TRIPLE_POINT_TEMPERATURE_KELVIN -
        1 /
          boundedTemperatureKelvin
      ),
    );
}

function saturatingLineOpticalDepth(
  columnMassEarth:
    number,

  profile:
    SaturatingGasProfile,
): number {

  if (
    columnMassEarth <=
    0
  ) {
    return 0;
  }

  return profile.maximumLineOpticalDepth *
    (
      1 -
      Math.exp(
        -Math.pow(
          columnMassEarth /
          profile.saturationColumnMassEarth,
          profile.saturationExponent,
        ),
      )
    );
}

function denseAtmosphereContinuumOpticalDepth(
  totalColumnMassEarth:
    number,

  greenhouseActiveMoleFraction01:
    number,
): number {

  const excessColumnMassEarth =
    Math.max(
      0,
      totalColumnMassEarth -
        1,
    );

  if (
    excessColumnMassEarth ===
      0 ||
    greenhouseActiveMoleFraction01 <=
      0
  ) {
    return 0;
  }

  return Math.min(
    MAX_DENSE_CONTINUUM_OPTICAL_DEPTH,
    0.22 *
      greenhouseActiveMoleFraction01 *
      Math.pow(
        excessColumnMassEarth,
        1.22,
      ),
  );
}

function assertPositiveFinite(
  value:
    number,

  label:
    string,
): void {

  if (
    !Number.isFinite(
      value,
    ) ||
    value <=
      0
  ) {
    throw new RangeError(
      `${label} must be finite and greater than zero: ${value}.`,
    );
  }
}
