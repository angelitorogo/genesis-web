import {
  type BodyLocator,
} from '../generation/procedural-locator';

import {
  type BodySeed,
} from '../seed/hierarchical-seeds';

import {
  atmosphereGasMolarMassGramsPerMole,
} from './atmosphere-gas';

import {
  type AtmosphereGasComponent,
} from './atmosphere-gas-component';

import {
  AtmospherePressureRegime,
  atmospherePressureRegimeForSurfacePressurePascal,
} from './atmosphere-pressure-regime';

import {
  PlanetType,
} from './planet-type';

export const ATMOSPHERE_V1_DENSITY_REFERENCE_TEMPERATURE_KELVIN =
  288.15;

export const ATMOSPHERE_V1_DEEP_ENVELOPE_REFERENCE_PRESSURE_PASCAL =
  101_325;

const UNIVERSAL_GAS_CONSTANT_JOULES_PER_MOLE_KELVIN =
  8.31446261815324;

const CONSISTENCY_TOLERANCE =
  1e-9;

/**
 * Point-20.2 baseline pressure/density/gas inventory for one Atmosphere.
 *
 * For solid-surface worlds, surfacePressurePascal is the source pressure before
 * point-20.3 evolutionary retention/loss is applied. For deep-envelope worlds
 * there is no phase-19 solid surface, so surfacePressurePascal is null and the
 * density is instead reported at a fixed one-atmosphere reference level.
 *
 * referenceDensityKilogramsPerCubicMeter is deliberately evaluated at the
 * explicit densityReferenceTemperatureKelvin rather than pretending point 20.2
 * already knows the planet's climate temperature; point 20.5 owns that physics.
 */
export class AtmosphereBulkProperties {

  readonly gasComponents:
    readonly AtmosphereGasComponent[];

  constructor(
    readonly planetOrdinal:
      number,

    readonly bodyLocator:
      BodyLocator,

    readonly bodySeed:
      BodySeed,

    readonly sourcePlanetType:
      PlanetType,

    readonly sourceMassEarth:
      number,

    readonly sourceRadiusEarth:
      number,

    readonly sourceSurfaceGravityEarth:
      number,

    readonly sourceEnvelopeMassFraction01:
      number,

    readonly sourceIceBearingInteriorFraction01:
      number,

    readonly sourceReferenceMeanInsolationEarth:
      number,

    readonly sourceReferenceBondAlbedo01:
      number,

    readonly pressureRegime:
      AtmospherePressureRegime,

    readonly surfacePressurePascal:
      number | null,

    readonly densityReferencePressurePascal:
      number,

    readonly densityReferenceTemperatureKelvin:
      number,

    readonly referenceDensityKilogramsPerCubicMeter:
      number,

    readonly meanMolarMassGramsPerMole:
      number | null,

    gasComponents:
      readonly AtmosphereGasComponent[],
  ) {
    if (
      !Number.isInteger(
        planetOrdinal,
      ) ||
      planetOrdinal <=
        0
    ) {
      throw new RangeError(
        'planetOrdinal must be a positive integer.',
      );
    }

    if (
      bodyLocator.bodyIndex !==
      BigInt(
        planetOrdinal -
          1,
      )
    ) {
      throw new RangeError(
        'Point-20.2 atmosphere bulk properties must use the BodyLocator belonging to planetOrdinal.',
      );
    }

    if (
      bodySeed.kind !==
      'body'
    ) {
      throw new RangeError(
        'AtmosphereBulkProperties requires a BodySeed.',
      );
    }

    if (
      !Object.values(
        PlanetType,
      ).includes(
        sourcePlanetType,
      )
    ) {
      throw new RangeError(
        'sourcePlanetType must be a known PlanetType.',
      );
    }

    assertPositiveFinite(
      sourceMassEarth,
      'sourceMassEarth',
    );

    assertPositiveFinite(
      sourceRadiusEarth,
      'sourceRadiusEarth',
    );

    assertPositiveFinite(
      sourceSurfaceGravityEarth,
      'sourceSurfaceGravityEarth',
    );

    assertNormalized(
      sourceEnvelopeMassFraction01,
      'sourceEnvelopeMassFraction01',
    );

    assertNormalized(
      sourceIceBearingInteriorFraction01,
      'sourceIceBearingInteriorFraction01',
    );

    assertPositiveFinite(
      sourceReferenceMeanInsolationEarth,
      'sourceReferenceMeanInsolationEarth',
    );

    assertNormalized(
      sourceReferenceBondAlbedo01,
      'sourceReferenceBondAlbedo01',
    );

    if (
      !Object.values(
        AtmospherePressureRegime,
      ).includes(
        pressureRegime,
      )
    ) {
      throw new RangeError(
        'pressureRegime must be a known AtmospherePressureRegime.',
      );
    }

    assertNonNegativeFinite(
      densityReferencePressurePascal,
      'densityReferencePressurePascal',
    );

    assertPositiveFinite(
      densityReferenceTemperatureKelvin,
      'densityReferenceTemperatureKelvin',
    );

    if (
      !approximatelyEqual(
        densityReferenceTemperatureKelvin,
        ATMOSPHERE_V1_DENSITY_REFERENCE_TEMPERATURE_KELVIN,
      )
    ) {
      throw new RangeError(
        'Point-20.2 reference density must use the frozen V1 reference temperature rather than a climate temperature.',
      );
    }

    assertNonNegativeFinite(
      referenceDensityKilogramsPerCubicMeter,
      'referenceDensityKilogramsPerCubicMeter',
    );

    validateUniqueGasComponents(
      gasComponents,
    );

    const gasFractionTotal =
      gasComponents.reduce(
        (
          total,
          component,
        ) =>
          total +
          component.moleFraction01,
        0,
      );

    const isVacuum =
      pressureRegime ===
      AtmospherePressureRegime.VACUUM;

    const isDeepEnvelope =
      pressureRegime ===
      AtmospherePressureRegime.DEEP_ENVELOPE;

    const sourceTypeIsDeepEnvelope =
      sourcePlanetType ===
        PlanetType.MINI_NEPTUNE ||
      sourcePlanetType ===
        PlanetType.GAS_GIANT ||
      sourcePlanetType ===
        PlanetType.ICE_GIANT;

    if (
      isDeepEnvelope !==
      sourceTypeIsDeepEnvelope
    ) {
      throw new RangeError(
        'Point-20.2 deep-envelope pressure semantics must match the frozen phase-19 planet type.',
      );
    }

    if (
      isVacuum
    ) {
      if (
        surfacePressurePascal !==
          0 ||
        densityReferencePressurePascal !==
          0 ||
        referenceDensityKilogramsPerCubicMeter !==
          0 ||
        meanMolarMassGramsPerMole !==
          null ||
        gasComponents.length !==
          0
      ) {
        throw new RangeError(
          'VACUUM point-20.2 atmospheres require zero pressure/density and an empty gas inventory.',
        );
      }
    } else {
      if (
        gasComponents.length ===
          0 ||
        !approximatelyEqual(
          gasFractionTotal,
          1,
        )
      ) {
        throw new RangeError(
          'Non-vacuum point-20.2 atmospheres require gas mole fractions that sum to 1.',
        );
      }

      if (
        meanMolarMassGramsPerMole ===
        null
      ) {
        throw new RangeError(
          'Non-vacuum point-20.2 atmospheres require a mean molar mass.',
        );
      }

      assertPositiveFinite(
        meanMolarMassGramsPerMole,
        'meanMolarMassGramsPerMole',
      );

      const expectedMeanMolarMass =
        gasComponents.reduce(
          (
            total,
            component,
          ) =>
            total +
            component.moleFraction01 *
              atmosphereGasMolarMassGramsPerMole(
                component.gas,
              ),
          0,
        );

      if (
        !approximatelyEqual(
          meanMolarMassGramsPerMole,
          expectedMeanMolarMass,
        )
      ) {
        throw new RangeError(
          'meanMolarMassGramsPerMole must equal the mole-fraction-weighted point-20.2 gas inventory.',
        );
      }

      const expectedDensity =
        idealGasDensityKilogramsPerCubicMeter(
          densityReferencePressurePascal,
          densityReferenceTemperatureKelvin,
          meanMolarMassGramsPerMole,
        );

      if (
        !approximatelyEqual(
          referenceDensityKilogramsPerCubicMeter,
          expectedDensity,
        )
      ) {
        throw new RangeError(
          'referenceDensityKilogramsPerCubicMeter must satisfy the ideal-gas reference relation for the point-20.2 pressure, temperature and mean molar mass.',
        );
      }
    }

    if (
      isDeepEnvelope
    ) {
      if (
        surfacePressurePascal !==
          null ||
        !approximatelyEqual(
          densityReferencePressurePascal,
          ATMOSPHERE_V1_DEEP_ENVELOPE_REFERENCE_PRESSURE_PASCAL,
        )
      ) {
        throw new RangeError(
          'DEEP_ENVELOPE point-20.2 atmospheres have no solid surface pressure and use the fixed V1 reference pressure for density.',
        );
      }
    } else {
      if (
        surfacePressurePascal ===
        null
      ) {
        throw new RangeError(
          'Solid-surface point-20.2 atmospheres require a finite surfacePressurePascal.',
        );
      }

      assertNonNegativeFinite(
        surfacePressurePascal,
        'surfacePressurePascal',
      );

      if (
        !approximatelyEqual(
          densityReferencePressurePascal,
          surfacePressurePascal,
        )
      ) {
        throw new RangeError(
          'Solid-surface point-20.2 atmospheric density must use the generated surface pressure as its reference pressure.',
        );
      }

      const expectedPressureRegime =
        atmospherePressureRegimeForSurfacePressurePascal(
          surfacePressurePascal,
        );

      if (
        pressureRegime !==
        expectedPressureRegime
      ) {
        throw new RangeError(
          'pressureRegime must match surfacePressurePascal for solid-surface point-20.2 atmospheres.',
        );
      }
    }

    this.gasComponents =
      Object.freeze([
        ...gasComponents,
      ]);
  }

  get isVacuum():
    boolean {

    return this
      .pressureRegime ===
      AtmospherePressureRegime.VACUUM;
  }

  get isDeepEnvelope():
    boolean {

    return this
      .pressureRegime ===
      AtmospherePressureRegime.DEEP_ENVELOPE;
  }

  get hasGasInventory():
    boolean {

    return this
      .gasComponents
      .length >
      0;
  }
}

export function idealGasDensityKilogramsPerCubicMeter(
  pressurePascal:
    number,

  temperatureKelvin:
    number,

  meanMolarMassGramsPerMole:
    number,
): number {

  assertNonNegativeFinite(
    pressurePascal,
    'pressurePascal',
  );

  assertPositiveFinite(
    temperatureKelvin,
    'temperatureKelvin',
  );

  assertPositiveFinite(
    meanMolarMassGramsPerMole,
    'meanMolarMassGramsPerMole',
  );

  return (
    pressurePascal *
    (
      meanMolarMassGramsPerMole /
      1_000
    ) /
    (
      UNIVERSAL_GAS_CONSTANT_JOULES_PER_MOLE_KELVIN *
      temperatureKelvin
    )
  );
}

function validateUniqueGasComponents(
  gasComponents:
    readonly AtmosphereGasComponent[],
): void {

  const gases =
    new Set(
      gasComponents.map(
        component =>
          component.gas,
      ),
    );

  if (
    gases.size !==
    gasComponents.length
  ) {
    throw new RangeError(
      'Point-20.2 gas inventory cannot contain duplicate gas species.',
    );
  }
}

function assertPositiveFinite(
  value:
    number,

  propertyName:
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
      `${propertyName} must be finite and greater than 0: ${value}.`,
    );
  }
}

function assertNonNegativeFinite(
  value:
    number,

  propertyName:
    string,
): void {

  if (
    !Number.isFinite(
      value,
    ) ||
    value <
      0
  ) {
    throw new RangeError(
      `${propertyName} must be finite and non-negative: ${value}.`,
    );
  }
}

function assertNormalized(
  value:
    number,

  propertyName:
    string,
): void {

  if (
    !Number.isFinite(
      value,
    ) ||
    value <
      0 ||
    value >
      1
  ) {
    throw new RangeError(
      `${propertyName} must be finite and in [0, 1]: ${value}.`,
    );
  }
}

function approximatelyEqual(
  left:
    number,

  right:
    number,
): boolean {

  const scale =
    Math.max(
      1,
      Math.abs(
        left,
      ),
      Math.abs(
        right,
      ),
    );

  return (
    Math.abs(
      left -
      right,
    ) <=
    CONSISTENCY_TOLERANCE *
      scale
  );
}
