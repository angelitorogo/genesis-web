import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  type AtmosphereRetentionState,
} from '../../domain/planetary/atmosphere-retention-state';

import {
  PlanetGeologyRegime,
} from '../../domain/planetary/planet-geology-regime';

import {
  type PlanetGeologyState,
} from '../../domain/planetary/planet-geology-state';

import {
  planetMagneticFieldRegimeForIndex01,
} from '../../domain/planetary/planet-magnetic-field-regime';

import {
  planetMagnetosphereRegimeForState,
} from '../../domain/planetary/planet-magnetosphere-regime';

import {
  PlanetMagnetosphereState,
} from '../../domain/planetary/planet-magnetosphere-state';

import {
  type Planet,
} from '../../domain/planetary/planet';

import {
  PlanetType,
} from '../../domain/planetary/planet-type';

import {
  type PlanetarySystem,
} from '../../domain/planetary/planetary-system';

const CONSISTENCY_TOLERANCE =
  1e-9;

const SUSTAINED_DYNAMO_THRESHOLD =
  0.35;

/**
 * Point-20.9 deterministic approximate magnetic-field / magnetosphere engine.
 *
 * V1 consumes zero PRNG draws and derives zero new seeds. It estimates whether
 * conductive fluid, internal convection and rotation can sustain a global
 * dynamo. Solid worlds consume point-20.8 heat/activity proxies; mini-Neptunes
 * and giant planets use their already-frozen deep-envelope mass/composition
 * because point 20.8 correctly leaves their surface geology undefined.
 *
 * The magnetosphere then competes against a coarse stellar-wind pressure proxy
 * derived from the frozen reference mean insolation. This is deliberately not a
 * stellar-wind/activity model and it does not compute particle dose, aurorae,
 * atmospheric sputtering or surface radiation; point 20.10 owns protection and
 * radiation at the surface.
 */
export class PlanetMagnetosphereEngine {

  private constructor() {}

  static generate(
    generationKey:
      UniverseGenerationKey,

    planet:
      Planet,

    retentionState:
      AtmosphereRetentionState,

    geologyState:
      PlanetGeologyState,
  ): PlanetMagnetosphereState {

    assertGenerationContext(
      generationKey,
      planet,
      retentionState,
      geologyState,
    );

    return generateMagnetosphereV1(
      planet,
      retentionState,
      geologyState,
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

    geologyStates:
      readonly PlanetGeologyState[],
  ): readonly PlanetMagnetosphereState[] {

    assertSupportedGenerationKey(
      generationKey,
    );

    if (
      !generationKey.equals(
        planetarySystem.generationKey,
      )
    ) {
      throw new RangeError(
        'PlanetMagnetosphereEngine requires the PlanetarySystem to share the supplied UniverseGenerationKey.',
      );
    }

    if (
      planets.length !==
        planetarySystem.planetCount ||
      retentionStates.length !==
        planetarySystem.planetCount ||
      geologyStates.length !==
        planetarySystem.planetCount
    ) {
      throw new RangeError(
        'PlanetMagnetosphereEngine.generateAll requires one Planet, point-20.3 retention state and point-20.8 geology state for every mature planet.',
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
              'PlanetMagnetosphereEngine.generateAll requires Planets from the exact supplied system in frozen planetOrdinal order.',
            );
          }

          const retentionState =
            retentionStates[index];

          const geologyState =
            geologyStates[index];

          assertGenerationContext(
            generationKey,
            planet,
            retentionState,
            geologyState,
          );

          return generateMagnetosphereV1(
            planet,
            retentionState,
            geologyState,
          );
        },
      ),
    );
  }
}

function generateMagnetosphereV1(
  planet:
    Planet,

  retentionState:
    AtmosphereRetentionState,

  geologyState:
    PlanetGeologyState,
): PlanetMagnetosphereState {

  const metallicCoreMassFraction01 =
    planet.internalComposition
      .metallicCoreMassFraction01;

  const gaseousEnvelopeMassFraction01 =
    planet.internalComposition
      .gaseousEnvelopeMassFraction01;

  const iceBearingInteriorFraction01 =
    planet.internalComposition
      .iceBearingFractionOfSolids01;

  const conductiveDynamoMaterialIndex01 =
    conductiveDynamoMaterialIndexV1(
      planet.planetType,
      planet.massEarth,
      metallicCoreMassFraction01,
      gaseousEnvelopeMassFraction01,
      iceBearingInteriorFraction01,
    );

  const convectivePowerIndex01 =
    convectivePowerIndexV1(
      planet.planetType,
      planet.massEarth,
      gaseousEnvelopeMassFraction01,
      iceBearingInteriorFraction01,
      geologyState,
    );

  const rotationDynamoEfficiency01 =
    rotationDynamoEfficiencyV1(
      planet.rotationPeriodHours,
    );

  const dynamoPotentialIndex01 =
    clamp01(
      Math.sqrt(
        conductiveDynamoMaterialIndex01 *
        convectivePowerIndex01,
      ) *
      (
        0.15 +
        0.85 *
          rotationDynamoEfficiency01
      ),
    );

  const sizeSupport01 =
    0.88 +
    0.12 *
      clamp01(
        planet.radiusEarth /
        1.5,
      );

  const intrinsicMagneticFieldIndex01 =
    clamp01(
      dynamoPotentialIndex01 *
      sizeSupport01,
    );

  const stellarWindPressureProxyEarth =
    clamp(
      planet.typeClassification
        .referenceMeanInsolationEarth,
      0.01,
      100,
    );

  const atmosphericObstacleIndex01 =
    atmosphericObstacleIndexV1(
      retentionState
        .retainedSurfacePressurePascal,
    );

  const windInteractionIndex01 =
    stellarWindPressureProxyEarth /
    (
      stellarWindPressureProxyEarth +
      0.10
    );

  const inducedMagnetospherePotentialIndex01 =
    clamp01(
      atmosphericObstacleIndex01 *
      windInteractionIndex01,
    );

  const hasSustainedDynamo =
    dynamoPotentialIndex01 >=
      SUSTAINED_DYNAMO_THRESHOLD &&
    intrinsicMagneticFieldIndex01 >=
      SUSTAINED_DYNAMO_THRESHOLD;

  const magnetosphericProtectionIndex01 =
    magnetosphericProtectionIndexV1(
      intrinsicMagneticFieldIndex01,
      stellarWindPressureProxyEarth,
      inducedMagnetospherePotentialIndex01,
      hasSustainedDynamo,
    );

  return new PlanetMagnetosphereState(
    planet.planetOrdinal,
    planet.locator,
    planet.seed,
    planet.planetType,
    planet.massEarth,
    planet.radiusEarth,
    planet.rotationPeriodHours,
    planet.isTidallySynchronized,
    metallicCoreMassFraction01,
    gaseousEnvelopeMassFraction01,
    iceBearingInteriorFraction01,
    planet.typeClassification
      .referenceMeanInsolationEarth,
    retentionState
      .retainedSurfacePressurePascal,
    geologyState.geologyRegime,
    geologyState.internalHeatRetentionIndex01,
    geologyState.geologicalActivityIndex01,
    geologyState.tidalHeatingIndex01,
    conductiveDynamoMaterialIndex01,
    convectivePowerIndex01,
    rotationDynamoEfficiency01,
    dynamoPotentialIndex01,
    intrinsicMagneticFieldIndex01,
    stellarWindPressureProxyEarth,
    inducedMagnetospherePotentialIndex01,
    magnetosphericProtectionIndex01,
    planetMagneticFieldRegimeForIndex01(
      intrinsicMagneticFieldIndex01,
    ),
    planetMagnetosphereRegimeForState(
      magnetosphericProtectionIndex01,
      hasSustainedDynamo,
      inducedMagnetospherePotentialIndex01,
    ),
    hasSustainedDynamo,
  );
}

function conductiveDynamoMaterialIndexV1(
  planetType:
    PlanetType,

  massEarth:
    number,

  metallicCoreMassFraction01:
    number,

  gaseousEnvelopeMassFraction01:
    number,

  iceBearingInteriorFraction01:
    number,
): number {

  const metallicCoreSupport01 =
    clamp01(
      metallicCoreMassFraction01 /
      0.35,
    );

  const iceFluidSupport01 =
    clamp01(
      iceBearingInteriorFraction01 /
      0.80,
    );

  const envelopeSupport01 =
    clamp01(
      gaseousEnvelopeMassFraction01 /
      0.35,
    );

  const giantMassSupport01 =
    clamp01(
      Math.log10(
        1 +
        massEarth,
      ) /
      Math.log10(
        1 +
        318,
      ),
    );

  if (
    planetType ===
    PlanetType.GAS_GIANT
  ) {
    return clamp01(
      0.70 +
      0.20 *
        giantMassSupport01 +
      0.10 *
        clamp01(
          gaseousEnvelopeMassFraction01 /
          0.50,
        ),
    );
  }

  if (
    planetType ===
    PlanetType.ICE_GIANT
  ) {
    return clamp01(
      0.50 +
      0.30 *
        iceFluidSupport01 +
      0.20 *
        envelopeSupport01,
    );
  }

  if (
    planetType ===
    PlanetType.MINI_NEPTUNE
  ) {
    return clamp01(
      0.30 +
      0.35 *
        envelopeSupport01 +
      0.25 *
        iceFluidSupport01 +
      0.10 *
        clamp01(
          metallicCoreMassFraction01 /
          0.25,
        ),
    );
  }

  if (
    planetType ===
    PlanetType.ICE
  ) {
    return clamp01(
      0.70 *
        metallicCoreSupport01 +
      0.30 *
        iceFluidSupport01,
    );
  }

  return clamp01(
    0.90 *
      metallicCoreSupport01 +
    0.10 *
      iceFluidSupport01,
  );
}

function convectivePowerIndexV1(
  planetType:
    PlanetType,

  massEarth:
    number,

  gaseousEnvelopeMassFraction01:
    number,

  iceBearingInteriorFraction01:
    number,

  geologyState:
    PlanetGeologyState,
): number {

  if (
    geologyState.geologyRegime !==
    PlanetGeologyRegime.DEEP_ENVELOPE
  ) {
    return clamp01(
      0.60 *
        geologyState
          .internalHeatRetentionIndex01! +
      0.25 *
        geologyState
          .geologicalActivityIndex01! +
      0.15 *
        geologyState
          .tidalHeatingIndex01!,
    );
  }

  const giantMassSupport01 =
    clamp01(
      Math.log10(
        1 +
        massEarth,
      ) /
      Math.log10(
        1 +
        318,
      ),
    );

  const envelopeSupport01 =
    clamp01(
      gaseousEnvelopeMassFraction01 /
      0.35,
    );

  const iceFluidSupport01 =
    clamp01(
      iceBearingInteriorFraction01 /
      0.80,
    );

  const typePrior =
    planetType ===
      PlanetType.GAS_GIANT
      ? 0.50
      : planetType ===
        PlanetType.ICE_GIANT
        ? 0.42
        : 0.28;

  return clamp01(
    typePrior +
    0.32 *
      giantMassSupport01 +
    0.12 *
      envelopeSupport01 +
    0.10 *
      iceFluidSupport01,
  );
}

function rotationDynamoEfficiencyV1(
  rotationPeriodHours:
    number,
): number {

  return 1 /
    (
      1 +
      (
        rotationPeriodHours /
        96
      ) **
        0.90
    );
}

function atmosphericObstacleIndexV1(
  retainedSurfacePressurePascal:
    number | null,
): number {

  if (
    retainedSurfacePressurePascal ===
    null
  ) {
    return 1;
  }

  return clamp01(
    1 -
    Math.exp(
      -retainedSurfacePressurePascal /
      5_000,
    ),
  );
}

function magnetosphericProtectionIndexV1(
  intrinsicMagneticFieldIndex01:
    number,

  stellarWindPressureProxyEarth:
    number,

  inducedMagnetospherePotentialIndex01:
    number,

  hasSustainedDynamo:
    boolean,
): number {

  if (
    hasSustainedDynamo
  ) {
    return clamp01(
      intrinsicMagneticFieldIndex01 /
      (
        intrinsicMagneticFieldIndex01 +
        0.42 *
          Math.sqrt(
            stellarWindPressureProxyEarth,
          )
      ),
    );
  }

  if (
    inducedMagnetospherePotentialIndex01 >=
    0.05
  ) {
    return Math.min(
      0.22,
      0.03 +
      0.16 *
        inducedMagnetospherePotentialIndex01,
    );
  }

  return 0;
}

function assertGenerationContext(
  generationKey:
    UniverseGenerationKey,

  planet:
    Planet,

  retentionState:
    AtmosphereRetentionState,

  geologyState:
    PlanetGeologyState,
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
      'PlanetMagnetosphereEngine requires the Planet to share the supplied UniverseGenerationKey.',
    );
  }

  if (
    !planet.isTypePhysicallyCoherent
  ) {
    throw new RangeError(
      'PlanetMagnetosphereEngine requires a point-19.7 physically coherent Planet.',
    );
  }

  if (
    retentionState.planetOrdinal !==
      planet.planetOrdinal ||
    !sameBodyIdentity(
      planet,
      retentionState,
    ) ||
    !approximatelyEqual(
      retentionState
        .sourceReferenceMeanInsolationEarth,
      planet.typeClassification
        .referenceMeanInsolationEarth,
    )
  ) {
    throw new RangeError(
      'PlanetMagnetosphereEngine requires the exact point-20.3 retention state belonging to the supplied Planet.',
    );
  }

  if (
    geologyState.planetOrdinal !==
      planet.planetOrdinal ||
    !sameBodyIdentity(
      planet,
      geologyState,
    ) ||
    geologyState.sourcePlanetType !==
      planet.planetType ||
    !approximatelyEqual(
      geologyState.sourceMassEarth,
      planet.massEarth,
    ) ||
    !approximatelyEqual(
      geologyState.sourceRadiusEarth,
      planet.radiusEarth,
    ) ||
    !approximatelyEqual(
      geologyState.sourceMetallicCoreMassFraction01,
      planet.internalComposition
        .metallicCoreMassFraction01,
    )
  ) {
    throw new RangeError(
      'PlanetMagnetosphereEngine requires the exact point-20.8 geology state belonging to the supplied Planet.',
    );
  }

  const deepEnvelopeType =
    planet.planetType ===
      PlanetType.MINI_NEPTUNE ||
    planet.planetType ===
      PlanetType.GAS_GIANT ||
    planet.planetType ===
      PlanetType.ICE_GIANT;

  if (
    deepEnvelopeType !==
    (
      geologyState.geologyRegime ===
      PlanetGeologyRegime.DEEP_ENVELOPE
    )
  ) {
    throw new RangeError(
      'Point-20.9 deep-envelope semantics must match the frozen point-20.8 geology boundary.',
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

function sameBodyIdentity(
  planet:
    Planet,

  source:
    AtmosphereRetentionState |
    PlanetGeologyState,
): boolean {

  return (
    source.bodyLocator.galaxyIndex ===
      planet.locator.galaxyIndex &&
    source.bodyLocator.sectorKey ===
      planet.locator.sectorKey &&
    source.bodyLocator.galacticObjectIndex ===
      planet.locator.galacticObjectIndex &&
    source.bodyLocator.bodyIndex ===
      planet.locator.bodyIndex &&
    source.bodySeed.normalizedValue ===
      planet.seed.normalizedValue
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
    value,
    0,
    1,
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
