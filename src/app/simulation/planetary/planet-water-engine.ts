import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  type BodyLocator,
} from '../../domain/generation/procedural-locator';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  AtmosphereGas,
} from '../../domain/planetary/atmosphere-gas';

import {
  type AtmosphereGasComponent,
} from '../../domain/planetary/atmosphere-gas-component';

import {
  type AtmosphereRetentionState,
} from '../../domain/planetary/atmosphere-retention-state';

import {
  type Planet,
} from '../../domain/planetary/planet';

import {
  type PlanetClimateState,
} from '../../domain/planetary/planet-climate-state';

import {
  type PlanetClimateVariabilityState,
} from '../../domain/planetary/planet-climate-variability-state';

import {
  PlanetSurfaceWaterRegime,
  planetSurfaceWaterRegimeForCoverage01,
} from '../../domain/planetary/planet-surface-water-regime';

import {
  PlanetType,
} from '../../domain/planetary/planet-type';

import {
  PlanetWaterInventory,
} from '../../domain/planetary/planet-water-inventory';

import {
  PlanetWaterPhaseRegime,
  planetWaterPhaseRegimeForFractions01,
} from '../../domain/planetary/planet-water-phase-regime';

import {
  type PlanetarySystem,
} from '../../domain/planetary/planetary-system';

export const WATER_V1_FREEZING_TEMPERATURE_KELVIN =
  273.15;

export const WATER_V1_TRIPLE_POINT_PRESSURE_PASCAL =
  611.657;

export const WATER_V1_CRITICAL_PRESSURE_PASCAL =
  22_064_000;

export const WATER_V1_CRITICAL_TEMPERATURE_KELVIN =
  647.096;

const WATER_V1_MILLIMETERS_MERCURY_PASCAL =
  133.322368;

const WATER_V1_PHASE_FRACTION_EPSILON =
  1e-12;

const CONSISTENCY_TOLERANCE =
  1e-9;

/**
 * Point-20.7 deterministic water/hydrosphere projection.
 *
 * V1 consumes zero PRNG draws and derives zero new seeds. It combines the
 * frozen phase-19 water-bearing interior/type prior with point-20.3 retained
 * atmospheric H2O, point-20.5 mean surface temperature and point-20.6 thermal
 * extrema/stability. The resulting waterInventoryIndex01 is a relative proxy,
 * not an invented ocean mass. Ordinary liquid-water viability uses the water
 * triple point plus a pressure-dependent boiling boundary. Point 20.8 still owns
 * geology, outgassing, tectonics and a future detailed volatile cycle.
 */
export class PlanetWaterEngine {

  private constructor() {}

  static generate(
    generationKey:
      UniverseGenerationKey,

    planet:
      Planet,

    retentionState:
      AtmosphereRetentionState,

    climateState:
      PlanetClimateState,

    climateVariabilityState:
      PlanetClimateVariabilityState,
  ): PlanetWaterInventory {

    assertGenerationContext(
      generationKey,
      planet,
      retentionState,
      climateState,
      climateVariabilityState,
    );

    return generateWaterInventoryV1(
      planet,
      retentionState,
      climateState,
      climateVariabilityState,
    );
  }

  static generateAll(
    generationKey:
      UniverseGenerationKey,

    planetarySystem:
      PlanetarySystem,

    planets:
      readonly Planet[],

    retentionStates:
      readonly AtmosphereRetentionState[],

    climateStates:
      readonly PlanetClimateState[],

    climateVariabilityStates:
      readonly PlanetClimateVariabilityState[],
  ): readonly PlanetWaterInventory[] {

    assertSupportedGenerationKey(
      generationKey,
    );

    if (
      !generationKey.equals(
        planetarySystem.generationKey,
      )
    ) {
      throw new RangeError(
        'PlanetWaterEngine requires the PlanetarySystem to share the supplied UniverseGenerationKey.',
      );
    }

    if (
      planets.length !==
        planetarySystem.planetCount ||
      retentionStates.length !==
        planetarySystem.planetCount ||
      climateStates.length !==
        planetarySystem.planetCount ||
      climateVariabilityStates.length !==
        planetarySystem.planetCount
    ) {
      throw new RangeError(
        'PlanetWaterEngine.generateAll requires one Planet and one point-20.3/20.5/20.6 source state for every mature planet.',
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
              'PlanetWaterEngine.generateAll requires Planets from the exact supplied system in frozen planetOrdinal order.',
            );
          }

          const retentionState =
            retentionStates[index];

          const climateState =
            climateStates[index];

          const climateVariabilityState =
            climateVariabilityStates[index];

          assertGenerationContext(
            generationKey,
            planet,
            retentionState,
            climateState,
            climateVariabilityState,
          );

          return generateWaterInventoryV1(
            planet,
            retentionState,
            climateState,
            climateVariabilityState,
          );
        },
      ),
    );
  }
}

function generateWaterInventoryV1(
  planet:
    Planet,

  retentionState:
    AtmosphereRetentionState,

  climateState:
    PlanetClimateState,

  climateVariabilityState:
    PlanetClimateVariabilityState,
): PlanetWaterInventory {

  const retainedAtmosphericWaterVaporMoleFraction01 =
    retainedWaterVaporMoleFraction01(
      retentionState,
    );

  const sourceIceBearingInteriorFraction01 =
    planet.internalComposition
      .iceBearingFractionOfSolids01;

  const waterInventoryIndex01 =
    waterInventoryIndexForPlanetV1(
      planet.planetType,
      sourceIceBearingInteriorFraction01,
      retainedAtmosphericWaterVaporMoleFraction01,
    );

  const isDeepEnvelope =
    climateState.meanSurfaceTemperatureKelvin ===
    null;

  if (
    isDeepEnvelope
  ) {
    return new PlanetWaterInventory(
      planet.planetOrdinal,
      planet.locator,
      planet.seed,
      planet.planetType,
      sourceIceBearingInteriorFraction01,
      null,
      retainedAtmosphericWaterVaporMoleFraction01,
      null,
      null,
      null,
      null,
      waterInventoryIndex01,
      null,
      null,
      null,
      null,
      null,
      PlanetWaterPhaseRegime.DEEP_ENVELOPE,
      PlanetSurfaceWaterRegime.DEEP_ENVELOPE,
      false,
    );
  }

  const retainedSurfacePressurePascal =
    retentionState.retainedSurfacePressurePascal!;

  const minimumSurfaceTemperatureKelvin =
    climateVariabilityState.minimumSurfaceTemperatureKelvin!;

  const maximumSurfaceTemperatureKelvin =
    climateVariabilityState.maximumSurfaceTemperatureKelvin!;

  const phaseFractions =
    waterPhaseFractionsV1(
      waterInventoryIndex01,
      retainedSurfacePressurePascal,
      retainedAtmosphericWaterVaporMoleFraction01,
      minimumSurfaceTemperatureKelvin,
      maximumSurfaceTemperatureKelvin,
    );

  const phaseRegime =
    planetWaterPhaseRegimeForFractions01(
      phaseFractions.iceFraction01,
      phaseFractions.liquidFraction01,
      phaseFractions.vaporFraction01,
      false,
    );

  const coverages =
    surfaceWaterCoveragesV1(
      planet.planetType,
      waterInventoryIndex01,
      phaseFractions.iceFraction01,
      phaseFractions.liquidFraction01,
      climateVariabilityState.stabilityIndex01!,
    );

  const surfaceWaterRegime =
    planetSurfaceWaterRegimeForCoverage01(
      coverages.surfaceLiquidWaterCoverageFraction01,
      false,
    );

  const boilingTemperatureKelvin =
    waterBoilingTemperatureKelvinForPressurePascal(
      retainedSurfacePressurePascal,
    );

  const meanSurfaceTemperatureKelvin =
    climateState.meanSurfaceTemperatureKelvin!;

  const hasPersistentSurfaceLiquidWater =
    boilingTemperatureKelvin !==
      null &&
    meanSurfaceTemperatureKelvin >=
      WATER_V1_FREEZING_TEMPERATURE_KELVIN &&
    meanSurfaceTemperatureKelvin <
      boilingTemperatureKelvin &&
    phaseFractions.liquidFraction01 >=
      0.35 &&
    coverages.surfaceLiquidWaterCoverageFraction01 >=
      0.01 &&
    climateVariabilityState.stabilityIndex01! >=
      0.35;

  return new PlanetWaterInventory(
    planet.planetOrdinal,
    planet.locator,
    planet.seed,
    planet.planetType,
    sourceIceBearingInteriorFraction01,
    retainedSurfacePressurePascal,
    retainedAtmosphericWaterVaporMoleFraction01,
    meanSurfaceTemperatureKelvin,
    minimumSurfaceTemperatureKelvin,
    maximumSurfaceTemperatureKelvin,
    climateVariabilityState.stabilityIndex01,
    waterInventoryIndex01,
    phaseFractions.iceFraction01,
    phaseFractions.liquidFraction01,
    phaseFractions.vaporFraction01,
    coverages.surfaceIceCoverageFraction01,
    coverages.surfaceLiquidWaterCoverageFraction01,
    phaseRegime,
    surfaceWaterRegime,
    hasPersistentSurfaceLiquidWater,
  );
}

export function waterBoilingTemperatureKelvinForPressurePascal(
  pressurePascal:
    number,
): number | null {

  if (
    !Number.isFinite(
      pressurePascal,
    ) ||
    pressurePascal <
      0
  ) {
    throw new RangeError(
      'Water phase pressure must be finite and non-negative.',
    );
  }

  if (
    pressurePascal <
    WATER_V1_TRIPLE_POINT_PRESSURE_PASCAL
  ) {
    return null;
  }

  if (
    pressurePascal >=
    WATER_V1_CRITICAL_PRESSURE_PASCAL
  ) {
    return WATER_V1_CRITICAL_TEMPERATURE_KELVIN;
  }

  const pressureMillimetersMercury =
    pressurePascal /
    WATER_V1_MILLIMETERS_MERCURY_PASCAL;

  const coefficients =
    pressurePascal <=
      101_325
      ? {
          a:
            8.07131,
          b:
            1730.63,
          c:
            233.426,
        }
      : {
          a:
            8.14019,
          b:
            1810.94,
          c:
            244.485,
        };

  const temperatureCelsius =
    coefficients.b /
      (
        coefficients.a -
        Math.log10(
          pressureMillimetersMercury,
        )
      ) -
    coefficients.c;

  return clamp(
    WATER_V1_FREEZING_TEMPERATURE_KELVIN,
    WATER_V1_CRITICAL_TEMPERATURE_KELVIN,
    temperatureCelsius +
      273.15,
  );
}

function waterPhaseFractionsV1(
  waterInventoryIndex01:
    number,

  retainedSurfacePressurePascal:
    number,

  retainedAtmosphericWaterVaporMoleFraction01:
    number,

  minimumSurfaceTemperatureKelvin:
    number,

  maximumSurfaceTemperatureKelvin:
    number,
): {
  readonly iceFraction01:
    number;
  readonly liquidFraction01:
    number;
  readonly vaporFraction01:
    number;
} {

  if (
    waterInventoryIndex01 <=
    WATER_V1_PHASE_FRACTION_EPSILON
  ) {
    return {
      iceFraction01:
        0,
      liquidFraction01:
        0,
      vaporFraction01:
        0,
    };
  }

  const boilingTemperatureKelvin =
    waterBoilingTemperatureKelvinForPressurePascal(
      retainedSurfacePressurePascal,
    );

  const iceThermalFraction01 =
    fractionOfThermalEnvelopeBelowThreshold01(
      minimumSurfaceTemperatureKelvin,
      maximumSurfaceTemperatureKelvin,
      WATER_V1_FREEZING_TEMPERATURE_KELVIN,
    );

  let liquidThermalFraction01:
    number;

  let vaporThermalFraction01:
    number;

  if (
    boilingTemperatureKelvin ===
    null
  ) {
    liquidThermalFraction01 =
      0;

    vaporThermalFraction01 =
      1 -
      iceThermalFraction01;
  } else {
    vaporThermalFraction01 =
      fractionOfThermalEnvelopeAboveThreshold01(
        minimumSurfaceTemperatureKelvin,
        maximumSurfaceTemperatureKelvin,
        boilingTemperatureKelvin,
      );

    liquidThermalFraction01 =
      clamp01(
        1 -
        iceThermalFraction01 -
        vaporThermalFraction01,
      );
  }

  const retainedVaporFloor01 =
    Math.min(
      0.18,
      Math.sqrt(
        retainedAtmosphericWaterVaporMoleFraction01,
      ) *
        0.24,
    );

  const thermalShare01 =
    1 -
    retainedVaporFloor01;

  const iceFraction01 =
    iceThermalFraction01 *
    thermalShare01;

  const liquidFraction01 =
    liquidThermalFraction01 *
    thermalShare01;

  const vaporFraction01 =
    vaporThermalFraction01 *
      thermalShare01 +
    retainedVaporFloor01;

  return normalizePhaseFractions(
    iceFraction01,
    liquidFraction01,
    vaporFraction01,
  );
}

function surfaceWaterCoveragesV1(
  planetType:
    PlanetType,

  waterInventoryIndex01:
    number,

  iceFraction01:
    number,

  liquidFraction01:
    number,

  climateStabilityIndex01:
    number,
): {
  readonly surfaceIceCoverageFraction01:
    number;
  readonly surfaceLiquidWaterCoverageFraction01:
    number;
} {

  if (
    waterInventoryIndex01 <=
    WATER_V1_PHASE_FRACTION_EPSILON
  ) {
    return {
      surfaceIceCoverageFraction01:
        0,
      surfaceLiquidWaterCoverageFraction01:
        0,
    };
  }

  const stabilityCoverageFactor =
    0.65 +
    0.35 *
      climateStabilityIndex01;

  const surfaceLiquidWaterCoverageFraction01 =
    clamp01(
      waterInventoryIndex01 *
        liquidFraction01 *
        liquidCoverageMultiplierForTypeV1(
          planetType,
        ) *
        stabilityCoverageFactor,
    );

  const surfaceIceCoverageFraction01 =
    clamp01(
      waterInventoryIndex01 *
        iceFraction01 *
        iceCoverageMultiplierForTypeV1(
          planetType,
        ),
    );

  const combinedCoverage =
    surfaceLiquidWaterCoverageFraction01 +
    surfaceIceCoverageFraction01;

  if (
    combinedCoverage <=
    1
  ) {
    return {
      surfaceIceCoverageFraction01,
      surfaceLiquidWaterCoverageFraction01,
    };
  }

  return {
    surfaceIceCoverageFraction01:
      surfaceIceCoverageFraction01 /
      combinedCoverage,
    surfaceLiquidWaterCoverageFraction01:
      surfaceLiquidWaterCoverageFraction01 /
      combinedCoverage,
  };
}

function waterInventoryIndexForPlanetV1(
  planetType:
    PlanetType,

  iceBearingInteriorFraction01:
    number,

  retainedAtmosphericWaterVaporMoleFraction01:
    number,
): number {

  const interiorSignal =
    Math.sqrt(
      iceBearingInteriorFraction01,
    );

  const atmosphericSignal =
    Math.sqrt(
      retainedAtmosphericWaterVaporMoleFraction01,
    );

  const weights =
    waterInventoryWeightsForTypeV1(
      planetType,
    );

  return clamp01(
    weights.base +
      weights.interior *
        interiorSignal +
      weights.atmosphere *
        atmosphericSignal,
  );
}

function waterInventoryWeightsForTypeV1(
  planetType:
    PlanetType,
): {
  readonly base:
    number;
  readonly interior:
    number;
  readonly atmosphere:
    number;
} {

  switch (
    planetType
  ) {
    case PlanetType.ROCKY:
      return {
        base:
          0,
        interior:
          0.70,
        atmosphere:
          0.15,
      };

    case PlanetType.SUPER_EARTH:
      return {
        base:
          0,
        interior:
          0.72,
        atmosphere:
          0.15,
      };

    case PlanetType.DESERT:
      return {
        base:
          0,
        interior:
          0.18,
        atmosphere:
          0.10,
      };

    case PlanetType.OCEAN:
      return {
        base:
          0.65,
        interior:
          0.30,
        atmosphere:
          0.05,
      };

    case PlanetType.ICE:
      return {
        base:
          0.60,
        interior:
          0.35,
        atmosphere:
          0.05,
      };

    case PlanetType.VOLCANIC:
      return {
        base:
          0,
        interior:
          0.35,
        atmosphere:
          0.12,
      };

    case PlanetType.MINI_NEPTUNE:
      return {
        base:
          0.20,
        interior:
          0.45,
        atmosphere:
          0.15,
      };

    case PlanetType.GAS_GIANT:
      return {
        base:
          0.10,
        interior:
          0.25,
        atmosphere:
          0.18,
      };

    case PlanetType.ICE_GIANT:
      return {
        base:
          0.45,
        interior:
          0.45,
        atmosphere:
          0.15,
      };
  }

  throw new RangeError(
    `Unsupported PlanetType for point-20.7 water inventory: ${String(planetType)}.`,
  );
}

function liquidCoverageMultiplierForTypeV1(
  planetType:
    PlanetType,
): number {

  switch (
    planetType
  ) {
    case PlanetType.OCEAN:
      return 1.15;

    case PlanetType.ICE:
      return 1.00;

    case PlanetType.ROCKY:
      return 0.95;

    case PlanetType.SUPER_EARTH:
      return 0.90;

    case PlanetType.DESERT:
      return 0.40;

    case PlanetType.VOLCANIC:
      return 0.60;

    case PlanetType.MINI_NEPTUNE:
    case PlanetType.GAS_GIANT:
    case PlanetType.ICE_GIANT:
      return 0;
  }

  throw new RangeError(
    `Unsupported PlanetType for point-20.7 liquid coverage: ${String(planetType)}.`,
  );
}

function iceCoverageMultiplierForTypeV1(
  planetType:
    PlanetType,
): number {

  switch (
    planetType
  ) {
    case PlanetType.ICE:
      return 1.20;

    case PlanetType.OCEAN:
      return 0.95;

    case PlanetType.ROCKY:
      return 0.90;

    case PlanetType.SUPER_EARTH:
      return 0.90;

    case PlanetType.DESERT:
      return 0.55;

    case PlanetType.VOLCANIC:
      return 0.65;

    case PlanetType.MINI_NEPTUNE:
    case PlanetType.GAS_GIANT:
    case PlanetType.ICE_GIANT:
      return 0;
  }

  throw new RangeError(
    `Unsupported PlanetType for point-20.7 ice coverage: ${String(planetType)}.`,
  );
}

function retainedWaterVaporMoleFraction01(
  retentionState:
    AtmosphereRetentionState,
): number {

  return retentionState
    .retainedGasComponents
    .find(
      (component: AtmosphereGasComponent) =>
        component.gas ===
        AtmosphereGas.WATER_VAPOR,
    )
    ?.moleFraction01 ??
    0;
}

function fractionOfThermalEnvelopeBelowThreshold01(
  minimumKelvin:
    number,

  maximumKelvin:
    number,

  thresholdKelvin:
    number,
): number {

  const rangeKelvin =
    maximumKelvin -
    minimumKelvin;

  if (
    rangeKelvin <=
    CONSISTENCY_TOLERANCE
  ) {
    return maximumKelvin <
      thresholdKelvin
      ? 1
      : 0;
  }

  return clamp01(
    (
      thresholdKelvin -
      minimumKelvin
    ) /
      rangeKelvin,
  );
}

function fractionOfThermalEnvelopeAboveThreshold01(
  minimumKelvin:
    number,

  maximumKelvin:
    number,

  thresholdKelvin:
    number,
): number {

  const rangeKelvin =
    maximumKelvin -
    minimumKelvin;

  if (
    rangeKelvin <=
    CONSISTENCY_TOLERANCE
  ) {
    return minimumKelvin >
      thresholdKelvin
      ? 1
      : 0;
  }

  return clamp01(
    (
      maximumKelvin -
      thresholdKelvin
    ) /
      rangeKelvin,
  );
}

function normalizePhaseFractions(
  iceFraction01:
    number,

  liquidFraction01:
    number,

  vaporFraction01:
    number,
): {
  readonly iceFraction01:
    number;
  readonly liquidFraction01:
    number;
  readonly vaporFraction01:
    number;
} {

  const total =
    iceFraction01 +
    liquidFraction01 +
    vaporFraction01;

  if (
    total <=
    WATER_V1_PHASE_FRACTION_EPSILON
  ) {
    return {
      iceFraction01:
        0,
      liquidFraction01:
        0,
      vaporFraction01:
        0,
    };
  }

  return {
    iceFraction01:
      clamp01(
        iceFraction01 /
          total,
      ),
    liquidFraction01:
      clamp01(
        liquidFraction01 /
          total,
      ),
    vaporFraction01:
      clamp01(
        vaporFraction01 /
          total,
      ),
  };
}

function assertGenerationContext(
  generationKey:
    UniverseGenerationKey,

  planet:
    Planet,

  retentionState:
    AtmosphereRetentionState,

  climateState:
    PlanetClimateState,

  climateVariabilityState:
    PlanetClimateVariabilityState,
): void {

  assertSupportedGenerationKey(
    generationKey,
  );

  if (
    !generationKey.equals(
      planet.generationKey,
    )
  ) {
    throw new RangeError(
      'PlanetWaterEngine requires the Planet to share the supplied UniverseGenerationKey.',
    );
  }

  if (
    !planet.isTypePhysicallyCoherent
  ) {
    throw new RangeError(
      'PlanetWaterEngine requires a point-19.7 physically coherent Planet.',
    );
  }

  assertBodyIdentity(
    planet,
    retentionState.planetOrdinal,
    retentionState.bodyLocator,
    retentionState.bodySeed.normalizedValue,
    'point-20.3 retention state',
  );

  assertBodyIdentity(
    planet,
    climateState.planetOrdinal,
    climateState.bodyLocator,
    climateState.bodySeed.normalizedValue,
    'point-20.5 climate state',
  );

  assertBodyIdentity(
    planet,
    climateVariabilityState.planetOrdinal,
    climateVariabilityState.bodyLocator,
    climateVariabilityState.bodySeed.normalizedValue,
    'point-20.6 climate variability state',
  );

  if (
    retentionState.retainedSurfacePressurePascal !==
      climateVariabilityState.sourceRetainedSurfacePressurePascal ||
    !nullableApproximatelyEqual(
      climateState.meanSurfaceTemperatureKelvin,
      climateVariabilityState.sourceMeanSurfaceTemperatureKelvin,
    ) ||
    !approximatelyEqual(
      climateState.equilibriumTemperatureKelvin,
      climateVariabilityState.sourceEquilibriumTemperatureKelvin,
    )
  ) {
    throw new RangeError(
      'PlanetWaterEngine requires the exact point-20.3/20.5/20.6 pressure and climate handoff for the same Planet.',
    );
  }
}

function assertBodyIdentity(
  planet:
    Planet,

  sourcePlanetOrdinal:
    number,

  sourceBodyLocator:
    BodyLocator,

  sourceSeedNormalizedValue:
    string,

  sourceName:
    string,
): void {

  if (
    sourcePlanetOrdinal !==
      planet.planetOrdinal ||
    sourceBodyLocator.galaxyIndex !==
      planet.locator.galaxyIndex ||
    sourceBodyLocator.sectorKey !==
      planet.locator.sectorKey ||
    sourceBodyLocator.galacticObjectIndex !==
      planet.locator.galacticObjectIndex ||
    sourceBodyLocator.bodyIndex !==
      planet.locator.bodyIndex ||
    sourceSeedNormalizedValue !==
      planet.seed.normalizedValue
  ) {
    throw new RangeError(
      `PlanetWaterEngine requires the exact ${sourceName} identity for the supplied Planet.`,
    );
  }
}

function assertSupportedGenerationKey(
  generationKey:
    UniverseGenerationKey,
): void {

  if (
    generationKey.generatorVersion !==
    GeneratorVersion.V1
  ) {
    throw new RangeError(
      `Unsupported GeneratorVersion: ${generationKey.generatorVersion.code}.`,
    );
  }
}

function nullableApproximatelyEqual(
  left:
    number | null,

  right:
    number | null,
): boolean {

  if (
    left ===
      null ||
    right ===
      null
  ) {
    return left ===
      right;
  }

  return approximatelyEqual(
    left,
    right,
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

  return Math.abs(
    left -
      right,
  ) <=
  CONSISTENCY_TOLERANCE *
    scale;
}

function clamp01(
  value:
    number,
): number {

  return clamp(
    0,
    1,
    value,
  );
}

function clamp(
  minimum:
    number,

  maximum:
    number,

  value:
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
