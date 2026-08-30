import {
  type BodyLocator,
} from '../generation/procedural-locator';

import {
  type BodySeed,
} from '../seed/hierarchical-seeds';

import {
  ATMOSPHERE_V1_DEEP_ENVELOPE_REFERENCE_PRESSURE_PASCAL,
  ATMOSPHERE_V1_DENSITY_REFERENCE_TEMPERATURE_KELVIN,
  idealGasDensityKilogramsPerCubicMeter,
} from './atmosphere-bulk-properties';

import {
  atmosphereGasMolarMassGramsPerMole,
} from './atmosphere-gas';

import {
  type AtmosphereGasComponent,
} from './atmosphere-gas-component';

import {
  type AtmosphereGasRetention,
} from './atmosphere-gas-retention';

import {
  AtmospherePressureRegime,
  atmospherePressureRegimeForSurfacePressurePascal,
} from './atmosphere-pressure-regime';

import {
  AtmosphereRetentionRegime,
  atmosphereRetentionRegimeForRetainedMoleInventoryFraction01,
} from './atmosphere-retention-regime';

const CONSISTENCY_TOLERANCE =
  1e-9;

/**
 * Point-20.3 retained atmospheric state after applying long-term escape to the
 * frozen point-20.2 source inventory.
 *
 * This contract does not modify point-20.2. It records the surviving relative
 * gas inventory, a retained solid-surface pressure when such a surface exists,
 * and the resulting composition. Deep-envelope worlds keep null surface
 * pressure and use the same fixed one-atmosphere density reference level as
 * point 20.2.
 */
export class AtmosphereRetentionState {

  readonly gasRetentions:
    readonly AtmosphereGasRetention[];

  readonly retainedGasComponents:
    readonly AtmosphereGasComponent[];

  constructor(
    readonly planetOrdinal:
      number,

    readonly bodyLocator:
      BodyLocator,

    readonly bodySeed:
      BodySeed,

    readonly sourcePressureRegime:
      AtmospherePressureRegime,

    readonly sourceSurfacePressurePascal:
      number | null,

    readonly sourceReferenceMeanInsolationEarth:
      number,

    readonly sourceReferenceBondAlbedo01:
      number,

    readonly escapeVelocityKilometersPerSecond:
      number,

    readonly escapeHeatingFactor:
      number,

    readonly retainedMoleInventoryFraction01:
      number,

    readonly lostMoleInventoryFraction01:
      number,

    readonly retentionRegime:
      AtmosphereRetentionRegime,

    readonly retainedPressureRegime:
      AtmospherePressureRegime,

    readonly retainedSurfacePressurePascal:
      number | null,

    readonly retainedDensityReferencePressurePascal:
      number,

    readonly densityReferenceTemperatureKelvin:
      number,

    readonly retainedReferenceDensityKilogramsPerCubicMeter:
      number,

    readonly retainedMeanMolarMassGramsPerMole:
      number | null,

    gasRetentions:
      readonly AtmosphereGasRetention[],

    retainedGasComponents:
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
        'Point-20.3 retention state must use the BodyLocator belonging to planetOrdinal.',
      );
    }

    if (
      bodySeed.kind !==
      'body'
    ) {
      throw new RangeError(
        'AtmosphereRetentionState requires a BodySeed.',
      );
    }

    assertKnownPressureRegime(
      sourcePressureRegime,
      'sourcePressureRegime',
    );

    assertKnownPressureRegime(
      retainedPressureRegime,
      'retainedPressureRegime',
    );

    if (
      !Object.values(
        AtmosphereRetentionRegime,
      ).includes(
        retentionRegime,
      )
    ) {
      throw new RangeError(
        'retentionRegime must be a known AtmosphereRetentionRegime.',
      );
    }

    assertPositiveFinite(
      sourceReferenceMeanInsolationEarth,
      'sourceReferenceMeanInsolationEarth',
    );

    assertNormalized(
      sourceReferenceBondAlbedo01,
      'sourceReferenceBondAlbedo01',
    );

    assertPositiveFinite(
      escapeVelocityKilometersPerSecond,
      'escapeVelocityKilometersPerSecond',
    );

    assertPositiveFinite(
      escapeHeatingFactor,
      'escapeHeatingFactor',
    );

    assertNormalized(
      retainedMoleInventoryFraction01,
      'retainedMoleInventoryFraction01',
    );

    assertNormalized(
      lostMoleInventoryFraction01,
      'lostMoleInventoryFraction01',
    );

    assertNonNegativeFinite(
      retainedDensityReferencePressurePascal,
      'retainedDensityReferencePressurePascal',
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
        'Point-20.3 retained reference density must preserve the frozen point-20.2 reference temperature.',
      );
    }

    assertNonNegativeFinite(
      retainedReferenceDensityKilogramsPerCubicMeter,
      'retainedReferenceDensityKilogramsPerCubicMeter',
    );

    validateUniqueGasRetentions(
      gasRetentions,
    );

    validateUniqueGasComponents(
      retainedGasComponents,
    );

    const sourceVacuum =
      sourcePressureRegime ===
      AtmospherePressureRegime.VACUUM;

    const sourceDeepEnvelope =
      sourcePressureRegime ===
      AtmospherePressureRegime.DEEP_ENVELOPE;

    const expectedRetentionRegime =
      atmosphereRetentionRegimeForRetainedMoleInventoryFraction01(
        retainedMoleInventoryFraction01,
        sourceVacuum,
        sourceDeepEnvelope,
      );

    if (
      retentionRegime !==
      expectedRetentionRegime
    ) {
      throw new RangeError(
        'retentionRegime must match the surviving point-20.2 source inventory and deep-envelope semantics.',
      );
    }

    if (
      sourceVacuum
    ) {
      validateVacuumState(
        sourceSurfacePressurePascal,
        retainedMoleInventoryFraction01,
        lostMoleInventoryFraction01,
        retentionRegime,
        retainedPressureRegime,
        retainedSurfacePressurePascal,
        retainedDensityReferencePressurePascal,
        retainedReferenceDensityKilogramsPerCubicMeter,
        retainedMeanMolarMassGramsPerMole,
        gasRetentions,
        retainedGasComponents,
      );
    } else {
      if (
        !approximatelyEqual(
          retainedMoleInventoryFraction01 +
            lostMoleInventoryFraction01,
          1,
        )
      ) {
        throw new RangeError(
          'Point-20.3 retained and lost source-inventory fractions must sum to 1 for a non-vacuum atmosphere.',
        );
      }

      if (
        gasRetentions.length ===
        0
      ) {
        throw new RangeError(
          'A non-vacuum point-20.3 atmosphere requires gas-retention diagnostics.',
        );
      }

      validateGasRetentionNormalization(
        gasRetentions,
        retainedMoleInventoryFraction01,
        retainedGasComponents,
      );

      if (
        sourceDeepEnvelope
      ) {
        validateDeepEnvelopeState(
          sourceSurfacePressurePascal,
          retentionRegime,
          retainedPressureRegime,
          retainedSurfacePressurePascal,
          retainedDensityReferencePressurePascal,
        );
      } else {
        validateSolidSurfaceState(
          sourceSurfacePressurePascal,
          retainedMoleInventoryFraction01,
          retainedPressureRegime,
          retainedSurfacePressurePascal,
          retainedDensityReferencePressurePascal,
        );
      }

      validateRetainedGasThermodynamics(
        retainedDensityReferencePressurePascal,
        densityReferenceTemperatureKelvin,
        retainedReferenceDensityKilogramsPerCubicMeter,
        retainedMeanMolarMassGramsPerMole,
        retainedGasComponents,
      );
    }

    this.gasRetentions =
      Object.freeze([
        ...gasRetentions,
      ]);

    this.retainedGasComponents =
      Object.freeze([
        ...retainedGasComponents,
      ]);
  }

  get hasRetainedGasInventory():
    boolean {

    return this
      .retainedGasComponents
      .length >
      0;
  }

  get isVacuum():
    boolean {

    return this
      .retentionRegime ===
      AtmosphereRetentionRegime.VACUUM;
  }

  get isDeepEnvelope():
    boolean {

    return this
      .retentionRegime ===
      AtmosphereRetentionRegime.DEEP_ENVELOPE;
  }
}

function validateVacuumState(
  sourceSurfacePressurePascal:
    number | null,

  retainedMoleInventoryFraction01:
    number,

  lostMoleInventoryFraction01:
    number,

  retentionRegime:
    AtmosphereRetentionRegime,

  retainedPressureRegime:
    AtmospherePressureRegime,

  retainedSurfacePressurePascal:
    number | null,

  retainedDensityReferencePressurePascal:
    number,

  retainedReferenceDensityKilogramsPerCubicMeter:
    number,

  retainedMeanMolarMassGramsPerMole:
    number | null,

  gasRetentions:
    readonly AtmosphereGasRetention[],

  retainedGasComponents:
    readonly AtmosphereGasComponent[],
): void {

  if (
    sourceSurfacePressurePascal !==
      0 ||
    retainedMoleInventoryFraction01 !==
      0 ||
    lostMoleInventoryFraction01 !==
      0 ||
    retentionRegime !==
      AtmosphereRetentionRegime.VACUUM ||
    retainedPressureRegime !==
      AtmospherePressureRegime.VACUUM ||
    retainedSurfacePressurePascal !==
      0 ||
    retainedDensityReferencePressurePascal !==
      0 ||
    retainedReferenceDensityKilogramsPerCubicMeter !==
      0 ||
    retainedMeanMolarMassGramsPerMole !==
      null ||
    gasRetentions.length !==
      0 ||
    retainedGasComponents.length !==
      0
  ) {
    throw new RangeError(
      'A point-20.3 vacuum source must remain an empty zero-pressure retained state.',
    );
  }
}

function validateDeepEnvelopeState(
  sourceSurfacePressurePascal:
    number | null,

  retentionRegime:
    AtmosphereRetentionRegime,

  retainedPressureRegime:
    AtmospherePressureRegime,

  retainedSurfacePressurePascal:
    number | null,

  retainedDensityReferencePressurePascal:
    number,
): void {

  if (
    sourceSurfacePressurePascal !==
      null ||
    retentionRegime !==
      AtmosphereRetentionRegime.DEEP_ENVELOPE ||
    retainedPressureRegime !==
      AtmospherePressureRegime.DEEP_ENVELOPE ||
    retainedSurfacePressurePascal !==
      null ||
    !approximatelyEqual(
      retainedDensityReferencePressurePascal,
      ATMOSPHERE_V1_DEEP_ENVELOPE_REFERENCE_PRESSURE_PASCAL,
    )
  ) {
    throw new RangeError(
      'Point-20.3 deep-envelope worlds must preserve null solid-surface pressure and the fixed reference-density pressure level.',
    );
  }
}

function validateSolidSurfaceState(
  sourceSurfacePressurePascal:
    number | null,

  retainedMoleInventoryFraction01:
    number,

  retainedPressureRegime:
    AtmospherePressureRegime,

  retainedSurfacePressurePascal:
    number | null,

  retainedDensityReferencePressurePascal:
    number,
): void {

  if (
    sourceSurfacePressurePascal ===
      null ||
    sourceSurfacePressurePascal <=
      0 ||
    retainedSurfacePressurePascal ===
      null
  ) {
    throw new RangeError(
      'Point-20.3 solid-surface worlds require finite source and retained surface pressures.',
    );
  }

  const expectedPressure =
    sourceSurfacePressurePascal *
    retainedMoleInventoryFraction01;

  if (
    !approximatelyEqual(
      retainedSurfacePressurePascal,
      expectedPressure,
    ) ||
    !approximatelyEqual(
      retainedDensityReferencePressurePascal,
      retainedSurfacePressurePascal,
    ) ||
    retainedPressureRegime !==
      atmospherePressureRegimeForSurfacePressurePascal(
        retainedSurfacePressurePascal,
      )
  ) {
    throw new RangeError(
      'Point-20.3 retained solid-surface pressure must be the point-20.2 source pressure scaled by the surviving mole inventory.',
    );
  }
}

function validateGasRetentionNormalization(
  gasRetentions:
    readonly AtmosphereGasRetention[],

  retainedMoleInventoryFraction01:
    number,

  retainedGasComponents:
    readonly AtmosphereGasComponent[],
): void {

  const sourceFractionTotal =
    gasRetentions.reduce(
      (
        total,
        retention,
      ) =>
        total +
        retention.sourceMoleFraction01,
      0,
    );

  if (
    !approximatelyEqual(
      sourceFractionTotal,
      1,
    )
  ) {
    throw new RangeError(
      'Point-20.3 source gas mole fractions must sum to 1.',
    );
  }

  const computedRetainedInventory =
    gasRetentions.reduce(
      (
        total,
        retention,
      ) =>
        total +
        retention.sourceMoleFraction01 *
          retention.retentionFraction01,
      0,
    );

  if (
    !approximatelyEqual(
      computedRetainedInventory,
      retainedMoleInventoryFraction01,
    )
  ) {
    throw new RangeError(
      'Point-20.3 retained source-inventory fraction must equal the source-mole-weighted gas retention fractions.',
    );
  }

  const retainedFractionTotal =
    gasRetentions.reduce(
      (
        total,
        retention,
      ) =>
        total +
        retention.retainedMoleFraction01,
      0,
    );

  if (
    !approximatelyEqual(
      retainedFractionTotal,
      1,
    )
  ) {
    throw new RangeError(
      'Point-20.3 retained gas mole fractions must sum to 1 for a non-vacuum atmosphere.',
    );
  }

  if (
    retainedGasComponents.length !==
    gasRetentions.filter(
      retention =>
        retention.retainedMoleFraction01 >
        0,
    ).length
  ) {
    throw new RangeError(
      'Point-20.3 retained gas components must contain exactly the species with a positive retained mole fraction.',
    );
  }

  for (
    const retention
    of gasRetentions
  ) {
    const retainedComponent =
      retainedGasComponents.find(
        component =>
          component.gas ===
          retention.gas,
      );

    if (
      retention.retainedMoleFraction01 ===
      0
    ) {
      if (
        retainedComponent !==
        undefined
      ) {
        throw new RangeError(
          'A fully lost point-20.3 species cannot appear in retainedGasComponents.',
        );
      }
    } else if (
      retainedComponent ===
        undefined ||
      !approximatelyEqual(
        retainedComponent.moleFraction01,
        retention.retainedMoleFraction01,
      )
    ) {
      throw new RangeError(
        'Point-20.3 retained gas components must match the normalized per-species retention diagnostics.',
      );
    }
  }
}

function validateRetainedGasThermodynamics(
  referencePressurePascal:
    number,

  referenceTemperatureKelvin:
    number,

  referenceDensityKilogramsPerCubicMeter:
    number,

  meanMolarMassGramsPerMole:
    number | null,

  retainedGasComponents:
    readonly AtmosphereGasComponent[],
): void {

  if (
    retainedGasComponents.length ===
    0 ||
    meanMolarMassGramsPerMole ===
    null
  ) {
    throw new RangeError(
      'A non-vacuum point-20.3 state requires a retained gas composition and mean molar mass.',
    );
  }

  const expectedMolarMass =
    retainedGasComponents.reduce(
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
      expectedMolarMass,
    )
  ) {
    throw new RangeError(
      'Point-20.3 retained mean molar mass must match retainedGasComponents.',
    );
  }

  const expectedDensity =
    idealGasDensityKilogramsPerCubicMeter(
      referencePressurePascal,
      referenceTemperatureKelvin,
      meanMolarMassGramsPerMole,
    );

  if (
    !approximatelyEqual(
      referenceDensityKilogramsPerCubicMeter,
      expectedDensity,
    )
  ) {
    throw new RangeError(
      'Point-20.3 retained reference density must match retained pressure, reference temperature and retained mean molar mass.',
    );
  }
}

function validateUniqueGasRetentions(
  gasRetentions:
    readonly AtmosphereGasRetention[],
): void {

  const unique =
    new Set(
      gasRetentions.map(
        retention =>
          retention.gas,
      ),
    );

  if (
    unique.size !==
    gasRetentions.length
  ) {
    throw new RangeError(
      'Point-20.3 gas-retention diagnostics cannot contain duplicate species.',
    );
  }
}

function validateUniqueGasComponents(
  gasComponents:
    readonly AtmosphereGasComponent[],
): void {

  const unique =
    new Set(
      gasComponents.map(
        component =>
          component.gas,
      ),
    );

  if (
    unique.size !==
    gasComponents.length
  ) {
    throw new RangeError(
      'Point-20.3 retained gas components cannot contain duplicate species.',
    );
  }
}

function assertKnownPressureRegime(
  value:
    AtmospherePressureRegime,

  propertyName:
    string,
): void {

  if (
    !Object.values(
      AtmospherePressureRegime,
    ).includes(
      value,
    )
  ) {
    throw new RangeError(
      `${propertyName} must be a known AtmospherePressureRegime.`,
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
