import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  ATMOSPHERE_V1_DEEP_ENVELOPE_REFERENCE_PRESSURE_PASCAL,
  ATMOSPHERE_V1_DENSITY_REFERENCE_TEMPERATURE_KELVIN,
  type AtmosphereBulkProperties,
  idealGasDensityKilogramsPerCubicMeter,
} from '../../domain/planetary/atmosphere-bulk-properties';

import {
  atmosphereGasMolarMassGramsPerMole,
} from '../../domain/planetary/atmosphere-gas';

import {
  AtmosphereGasComponent,
} from '../../domain/planetary/atmosphere-gas-component';

import {
  AtmosphereGasRetention,
} from '../../domain/planetary/atmosphere-gas-retention';

import {
  AtmospherePressureRegime,
  atmospherePressureRegimeForSurfacePressurePascal,
} from '../../domain/planetary/atmosphere-pressure-regime';

import {
  AtmosphereRetentionRegime,
  atmosphereRetentionRegimeForRetainedMoleInventoryFraction01,
} from '../../domain/planetary/atmosphere-retention-regime';

import {
  AtmosphereRetentionState,
} from '../../domain/planetary/atmosphere-retention-state';

import {
  type Planet,
} from '../../domain/planetary/planet';

import {
  type PlanetarySystem,
} from '../../domain/planetary/planetary-system';

import {
  PlanetType,
} from '../../domain/planetary/planet-type';

const V1_EARTH_ESCAPE_VELOCITY_KILOMETERS_PER_SECOND =
  11.186;

const V1_EARTH_ABSORBED_FLUX_REFERENCE =
  0.70;

const V1_ESCAPE_RESISTANCE_LOGISTIC_MIDPOINT =
  10;

const V1_ESCAPE_RESISTANCE_LOGISTIC_WIDTH =
  2.2;

const CONSISTENCY_TOLERANCE =
  1e-9;

/**
 * Point-20.3 deterministic atmospheric retention/loss generator.
 *
 * V1 applies no new PRNG and derives no new seed. It transforms the frozen
 * point-20.2 gas inventory using a Jeans-like dimensionless escape-resistance
 * proxy based on gas molar mass, planetary escape well (M/R) and absorbed
 * stellar irradiation. This is a coarse long-term escape model rather than a
 * hydrodynamic/photochemical integrator; stellar-wind detail and climate
 * temperatures remain outside point 20.3.
 *
 * Solid-world retained pressure scales with the surviving mole inventory.
 * Deep-envelope worlds retain null solid-surface pressure and are characterized
 * through relative inventory/composition at the fixed point-20.2 reference
 * pressure level.
 */
export class AtmosphereRetentionGenerator {

  private constructor() {}

  static generate(
    generationKey:
      UniverseGenerationKey,

    planet:
      Planet,

    bulkProperties:
      AtmosphereBulkProperties,
  ): AtmosphereRetentionState {

    assertGenerationContext(
      generationKey,
      planet,
      bulkProperties,
    );

    return generateRetentionStateV1(
      planet,
      bulkProperties,
    );
  }

  static generateAll(
    generationKey:
      UniverseGenerationKey,

    planetarySystem:
      PlanetarySystem,

    planets:
      readonly Planet[],

    bulkProperties:
      readonly AtmosphereBulkProperties[],
  ): readonly AtmosphereRetentionState[] {

    if (
      !generationKey.equals(
        planetarySystem.generationKey,
      )
    ) {
      throw new RangeError(
        'AtmosphereRetentionGenerator requires the PlanetarySystem to share the supplied UniverseGenerationKey.',
      );
    }

    if (
      planets.length !==
        planetarySystem.planetCount ||
      bulkProperties.length !==
        planetarySystem.planetCount
    ) {
      throw new RangeError(
        'AtmosphereRetentionGenerator.generateAll requires exactly one Planet and point-20.2 bulk state for every mature planet.',
      );
    }

    return Object.freeze(
      planets.map(
        (
          planet,
          index,
        ) => {
          if (
            planet.hostPlanetarySystem !==
            planetarySystem ||
            planet.planetOrdinal !==
            index +
              1
          ) {
            throw new RangeError(
              'AtmosphereRetentionGenerator.generateAll requires Planets from the exact supplied system in frozen planetOrdinal order.',
            );
          }

          const bulk =
            bulkProperties[index];

          assertGenerationContext(
            generationKey,
            planet,
            bulk,
          );

          return generateRetentionStateV1(
            planet,
            bulk,
          );
        },
      ),
    );
  }
}

function assertGenerationContext(
  generationKey:
    UniverseGenerationKey,

  planet:
    Planet,

  bulkProperties:
    AtmosphereBulkProperties,
): void {

  if (
    generationKey.generatorVersion !==
    GeneratorVersion.V1
  ) {
    throw new RangeError(
      `Unsupported GeneratorVersion: ${generationKey.generatorVersion.code}.`,
    );
  }

  if (
    !generationKey.equals(
      planet.generationKey,
    )
  ) {
    throw new RangeError(
      'AtmosphereRetentionGenerator requires the Planet to share the supplied UniverseGenerationKey.',
    );
  }

  if (
    !planet.isTypePhysicallyCoherent
  ) {
    throw new RangeError(
      'AtmosphereRetentionGenerator requires a point-19.7 physically coherent Planet.',
    );
  }

  if (
    bulkProperties.planetOrdinal !==
      planet.planetOrdinal ||
    !sameBodyLocator(
      bulkProperties.bodyLocator,
      planet.locator,
    ) ||
    bulkProperties.bodySeed.normalizedValue !==
      planet.seed.normalizedValue
  ) {
    throw new RangeError(
      'AtmosphereRetentionGenerator requires the point-20.2 bulk state to preserve the exact Planet identity.',
    );
  }

  if (
    bulkProperties.sourcePlanetType !==
      planet.planetType ||
    !approximatelyEqual(
      bulkProperties.sourceMassEarth,
      planet.massEarth,
    ) ||
    !approximatelyEqual(
      bulkProperties.sourceRadiusEarth,
      planet.radiusEarth,
    ) ||
    !approximatelyEqual(
      bulkProperties.sourceReferenceMeanInsolationEarth,
      planet.typeClassification
        .referenceMeanInsolationEarth,
    ) ||
    !approximatelyEqual(
      bulkProperties.sourceReferenceBondAlbedo01,
      planet.referenceBondAlbedo01,
    )
  ) {
    throw new RangeError(
      'AtmosphereRetentionGenerator requires the point-20.2 bulk state to preserve the exact phase-19 source physics used by point 20.3.',
    );
  }
}

function generateRetentionStateV1(
  planet:
    Planet,

  bulkProperties:
    AtmosphereBulkProperties,
): AtmosphereRetentionState {

  const escapeVelocityKilometersPerSecond =
    V1_EARTH_ESCAPE_VELOCITY_KILOMETERS_PER_SECOND *
    Math.sqrt(
      planet.massEarth /
      planet.radiusEarth,
    );

  const escapeHeatingFactor =
    escapeHeatingFactorV1(
      bulkProperties
        .sourceReferenceMeanInsolationEarth,
      bulkProperties
        .sourceReferenceBondAlbedo01,
    );

  if (
    bulkProperties.isVacuum
  ) {
    return new AtmosphereRetentionState(
      planet.planetOrdinal,
      planet.locator,
      planet.seed,
      bulkProperties.pressureRegime,
      bulkProperties.surfacePressurePascal,
      bulkProperties.sourceReferenceMeanInsolationEarth,
      bulkProperties.sourceReferenceBondAlbedo01,
      escapeVelocityKilometersPerSecond,
      escapeHeatingFactor,
      0,
      0,
      AtmosphereRetentionRegime.VACUUM,
      AtmospherePressureRegime.VACUUM,
      0,
      0,
      ATMOSPHERE_V1_DENSITY_REFERENCE_TEMPERATURE_KELVIN,
      0,
      null,
      [],
      [],
    );
  }

  const rawRetentions =
    bulkProperties.gasComponents.map(
      component => {
        const retentionFraction01 =
          gasRetentionFractionV1(
            planet,
            component.gas,
            escapeHeatingFactor,
          );

        return {
          gas:
            component.gas,
          sourceMoleFraction01:
            component.moleFraction01,
          retentionFraction01,
          retainedSourceMoles:
            component.moleFraction01 *
            retentionFraction01,
        };
      },
    );

  const retainedMoleInventoryFraction01 =
    clamp(
      rawRetentions.reduce(
        (
          total,
          retention,
        ) =>
          total +
          retention.retainedSourceMoles,
        0,
      ),
      0,
      1,
    );

  const lostMoleInventoryFraction01 =
    clamp(
      1 -
        retainedMoleInventoryFraction01,
      0,
      1,
    );

  const gasRetentions =
    Object.freeze(
      rawRetentions.map(
        retention =>
          new AtmosphereGasRetention(
            retention.gas,
            retention.sourceMoleFraction01,
            retention.retentionFraction01,
            1 -
              retention.retentionFraction01,
            retainedMoleInventoryFraction01 >
              0
              ? retention.retainedSourceMoles /
                retainedMoleInventoryFraction01
              : 0,
          ),
      ),
    );

  const retainedGasComponents =
    Object.freeze(
      gasRetentions
        .filter(
          retention =>
            retention.retainedMoleFraction01 >
            0,
        )
        .map(
          retention =>
            new AtmosphereGasComponent(
              retention.gas,
              retention.retainedMoleFraction01,
            ),
        ),
    );

  const retainedMeanMolarMassGramsPerMole =
    meanMolarMassV1(
      retainedGasComponents,
    );

  const deepEnvelope =
    bulkProperties.isDeepEnvelope;

  const retainedSurfacePressurePascal =
    deepEnvelope
      ? null
      : bulkProperties.surfacePressurePascal! *
        retainedMoleInventoryFraction01;

  const retainedPressureRegime =
    deepEnvelope
      ? AtmospherePressureRegime.DEEP_ENVELOPE
      : atmospherePressureRegimeForSurfacePressurePascal(
          retainedSurfacePressurePascal!,
        );

  const retainedDensityReferencePressurePascal =
    deepEnvelope
      ? ATMOSPHERE_V1_DEEP_ENVELOPE_REFERENCE_PRESSURE_PASCAL
      : retainedSurfacePressurePascal!;

  const retainedReferenceDensityKilogramsPerCubicMeter =
    idealGasDensityKilogramsPerCubicMeter(
      retainedDensityReferencePressurePascal,
      ATMOSPHERE_V1_DENSITY_REFERENCE_TEMPERATURE_KELVIN,
      retainedMeanMolarMassGramsPerMole,
    );

  return new AtmosphereRetentionState(
    planet.planetOrdinal,
    planet.locator,
    planet.seed,
    bulkProperties.pressureRegime,
    bulkProperties.surfacePressurePascal,
    bulkProperties.sourceReferenceMeanInsolationEarth,
    bulkProperties.sourceReferenceBondAlbedo01,
    escapeVelocityKilometersPerSecond,
    escapeHeatingFactor,
    retainedMoleInventoryFraction01,
    lostMoleInventoryFraction01,
    atmosphereRetentionRegimeForRetainedMoleInventoryFraction01(
      retainedMoleInventoryFraction01,
      false,
      bulkProperties.isDeepEnvelope,
    ),
    retainedPressureRegime,
    retainedSurfacePressurePascal,
    retainedDensityReferencePressurePascal,
    ATMOSPHERE_V1_DENSITY_REFERENCE_TEMPERATURE_KELVIN,
    retainedReferenceDensityKilogramsPerCubicMeter,
    retainedMeanMolarMassGramsPerMole,
    gasRetentions,
    retainedGasComponents,
  );
}

function gasRetentionFractionV1(
  planet:
    Planet,

  gas:
    Parameters<typeof atmosphereGasMolarMassGramsPerMole>[0],

  escapeHeatingFactor:
    number,
): number {

  const molarMass =
    atmosphereGasMolarMassGramsPerMole(
      gas,
    );

  const gravityWellFactor =
    planet.massEarth /
    planet.radiusEarth;

  const escapeResistance =
    molarMass *
    gravityWellFactor /
    escapeHeatingFactor;

  const baseRetention =
    logisticRetentionV1(
      escapeResistance,
    );

  const retentionFloor =
    retentionFloorV1(
      planet,
    );

  return clamp(
    retentionFloor +
    (
      1 -
      retentionFloor
    ) *
      baseRetention,
    0,
    1,
  );
}

function retentionFloorV1(
  planet:
    Planet,
): number {

  switch (
    planet.planetType
  ) {
    case PlanetType.MINI_NEPTUNE:
      return 0.72;

    case PlanetType.ICE_GIANT:
      return 0.90;

    case PlanetType.GAS_GIANT:
      return 0.97;

    case PlanetType.ROCKY:
    case PlanetType.SUPER_EARTH:
    case PlanetType.DESERT:
    case PlanetType.OCEAN:
    case PlanetType.ICE:
    case PlanetType.VOLCANIC:
      return clamp(
        planet.physicalProperties
          .envelopeMassFraction01 *
          4,
        0,
        0.25,
      );
  }
}

function escapeHeatingFactorV1(
  referenceMeanInsolationEarth:
    number,

  referenceBondAlbedo01:
    number,
): number {

  const absorbedFlux =
    Math.max(
      1e-9,
      referenceMeanInsolationEarth *
      (
        1 -
        referenceBondAlbedo01
      ),
    );

  return clamp(
    (
      absorbedFlux /
      V1_EARTH_ABSORBED_FLUX_REFERENCE
    ) **
      0.25,
    0.20,
    20,
  );
}

function logisticRetentionV1(
  escapeResistance:
    number,
): number {

  return 1 /
    (
      1 +
      Math.exp(
        -(
          escapeResistance -
          V1_ESCAPE_RESISTANCE_LOGISTIC_MIDPOINT
        ) /
        V1_ESCAPE_RESISTANCE_LOGISTIC_WIDTH,
      )
    );
}

function meanMolarMassV1(
  gasComponents:
    readonly AtmosphereGasComponent[],
): number {

  return gasComponents.reduce(
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
}

function sameBodyLocator(
  left:
    AtmosphereBulkProperties['bodyLocator'],

  right:
    Planet['locator'],
): boolean {

  return (
    left.galaxyIndex ===
      right.galaxyIndex &&
    left.sectorKey ===
      right.sectorKey &&
    left.galacticObjectIndex ===
      right.galacticObjectIndex &&
    left.bodyIndex ===
      right.bodyIndex
  );
}

function clamp(
  value:
    number,

  minimum:
    number,

  maximum:
    number,
): number {

  return Math.min(
    maximum,
    Math.max(
      minimum,
      value,
    ),
  );
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
