import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  PlanetGeologyRegime,
  planetGeologyRegimeForActivityIndex01,
} from '../../domain/planetary/planet-geology-regime';

import {
  PlanetGeologyState,
} from '../../domain/planetary/planet-geology-state';

import {
  type Planet,
} from '../../domain/planetary/planet';

import {
  PlanetTectonicRegime,
  planetTectonicRegimeForMobilityIndex01,
} from '../../domain/planetary/planet-tectonic-regime';

import {
  PlanetType,
} from '../../domain/planetary/planet-type';

import {
  PlanetVolcanismRegime,
  planetVolcanismRegimeForIndex01,
} from '../../domain/planetary/planet-volcanism-regime';

import {
  type PlanetWaterInventory,
} from '../../domain/planetary/planet-water-inventory';

import {
  type PlanetarySystem,
} from '../../domain/planetary/planetary-system';

const CONSISTENCY_TOLERANCE =
  1e-9;

/**
 * Point-20.8 deterministic approximate geology/volcanism/tectonics engine.
 *
 * V1 consumes zero PRNG draws and derives zero new seeds. It combines the
 * frozen point-19 bulk/interior composition, the point-19.4 tidal-heating proxy
 * and point-20.7 surface-water state. The output is intentionally normalized and
 * comparative: no crust thickness, plate count, mantle temperature, eruption
 * frequency or absolute heat flux is invented.
 *
 * Planetary age is deliberately not reconstructed here because the current
 * Planet aggregate does not retain a point-15.3 lifetime profile. V1 therefore
 * models relative present-day heat retention mainly from size/composition plus
 * tidal forcing. Deep-envelope worlds keep surface geology undefined.
 */
export class PlanetGeologyEngine {

  private constructor() {}

  static generate(
    generationKey:
      UniverseGenerationKey,

    planet:
      Planet,

    waterInventory:
      PlanetWaterInventory,
  ): PlanetGeologyState {

    assertGenerationContext(
      generationKey,
      planet,
      waterInventory,
    );

    return generateGeologyV1(
      planet,
      waterInventory,
    );
  }

  static generateAll(
    generationKey:
      UniverseGenerationKey,

    planetarySystem:
      PlanetarySystem,

    planets:
      readonly Planet[],

    waterInventories:
      readonly PlanetWaterInventory[],
  ): readonly PlanetGeologyState[] {

    assertSupportedGenerationKey(
      generationKey,
    );

    if (
      !generationKey.equals(
        planetarySystem.generationKey,
      )
    ) {
      throw new RangeError(
        'PlanetGeologyEngine requires the PlanetarySystem to share the supplied UniverseGenerationKey.',
      );
    }

    if (
      planets.length !==
        planetarySystem.planetCount ||
      waterInventories.length !==
        planetarySystem.planetCount
    ) {
      throw new RangeError(
        'PlanetGeologyEngine.generateAll requires one Planet and one point-20.7 water state for every mature planet.',
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
              'PlanetGeologyEngine.generateAll requires Planets from the exact supplied system in frozen planetOrdinal order.',
            );
          }

          const waterInventory =
            waterInventories[index];

          assertGenerationContext(
            generationKey,
            planet,
            waterInventory,
          );

          return generateGeologyV1(
            planet,
            waterInventory,
          );
        },
      ),
    );
  }
}

function generateGeologyV1(
  planet:
    Planet,

  waterInventory:
    PlanetWaterInventory,
): PlanetGeologyState {

  const sourceMetallicCoreMassFraction01 =
    planet.internalComposition
      .metallicCoreMassFraction01;

  const sourceSilicateInteriorMassFraction01 =
    planet.internalComposition
      .silicateInteriorMassFraction01;

  const sourceVolatileRichInteriorMassFraction01 =
    planet.internalComposition
      .volatileRichInteriorMassFraction01;

  const sourceCondensedIceMassFraction01 =
    planet.internalComposition
      .condensedIceMassFraction01;

  const sourceIceBearingInteriorFraction01 =
    planet.internalComposition
      .iceBearingFractionOfSolids01;

  const sourceTidalHeatingProxy =
    planet.typeClassification
      .tidalHeatingProxy;

  if (
    waterInventory.surfaceLiquidWaterCoverageFraction01 ===
    null
  ) {
    return new PlanetGeologyState(
      planet.planetOrdinal,
      planet.locator,
      planet.seed,
      planet.planetType,
      planet.massEarth,
      planet.radiusEarth,
      planet.surfaceGravityEarth,
      sourceMetallicCoreMassFraction01,
      sourceSilicateInteriorMassFraction01,
      sourceVolatileRichInteriorMassFraction01,
      sourceCondensedIceMassFraction01,
      sourceIceBearingInteriorFraction01,
      sourceTidalHeatingProxy,
      waterInventory.waterInventoryIndex01,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      PlanetGeologyRegime.DEEP_ENVELOPE,
      PlanetVolcanismRegime.DEEP_ENVELOPE,
      PlanetTectonicRegime.DEEP_ENVELOPE,
    );
  }

  const internalHeatRetentionIndex01 =
    internalHeatRetentionIndexV1(
      planet.massEarth,
      planet.radiusEarth,
      sourceMetallicCoreMassFraction01,
      sourceSilicateInteriorMassFraction01,
    );

  const tidalHeatingIndex01 =
    tidalHeatingIndexV1(
      sourceTidalHeatingProxy,
    );

  const mantleConvectionIndex01 =
    mantleConvectionIndexV1(
      internalHeatRetentionIndex01,
      tidalHeatingIndex01,
      planet.planetType,
    );

  const geologicalActivityIndex01 =
    clamp01(
      0.68 *
        mantleConvectionIndex01 +
      0.22 *
        tidalHeatingIndex01 +
      (
        planet.planetType ===
        PlanetType.VOLCANIC
          ? 0.10
          : 0
      ),
    );

  const volcanismIndex01 =
    clamp01(
      0.62 *
        mantleConvectionIndex01 +
      0.28 *
        tidalHeatingIndex01 +
      (
        planet.planetType ===
        PlanetType.VOLCANIC
          ? 0.18
          : 0
      ),
    );

  const tectonicMobilityIndex01 =
    tectonicMobilityIndexV1(
      mantleConvectionIndex01,
      planet.surfaceGravityEarth,
      sourceSilicateInteriorMassFraction01,
      waterInventory
        .surfaceLiquidWaterCoverageFraction01,
    );

  const volatileReservoirIndex01 =
    clamp01(
      3 *
        (
          sourceVolatileRichInteriorMassFraction01 +
          sourceCondensedIceMassFraction01
        ),
    );

  const volatileOutgassingPotential01 =
    clamp01(
      volcanismIndex01 *
      (
        0.35 +
        0.65 *
          volatileReservoirIndex01
      ),
    );

  const surfaceRenewalPotential01 =
    clamp01(
      Math.max(
        volcanismIndex01 *
          0.72,
        tectonicMobilityIndex01 *
          0.88,
      ),
    );

  return new PlanetGeologyState(
    planet.planetOrdinal,
    planet.locator,
    planet.seed,
    planet.planetType,
    planet.massEarth,
    planet.radiusEarth,
    planet.surfaceGravityEarth,
    sourceMetallicCoreMassFraction01,
    sourceSilicateInteriorMassFraction01,
    sourceVolatileRichInteriorMassFraction01,
    sourceCondensedIceMassFraction01,
    sourceIceBearingInteriorFraction01,
    sourceTidalHeatingProxy,
    waterInventory.waterInventoryIndex01,
    waterInventory.surfaceLiquidWaterCoverageFraction01,
    internalHeatRetentionIndex01,
    tidalHeatingIndex01,
    mantleConvectionIndex01,
    geologicalActivityIndex01,
    volcanismIndex01,
    tectonicMobilityIndex01,
    volatileOutgassingPotential01,
    surfaceRenewalPotential01,
    planetGeologyRegimeForActivityIndex01(
      geologicalActivityIndex01,
    ),
    planetVolcanismRegimeForIndex01(
      volcanismIndex01,
    ),
    planetTectonicRegimeForMobilityIndex01(
      tectonicMobilityIndex01,
    ),
  );
}

function internalHeatRetentionIndexV1(
  massEarth:
    number,

  radiusEarth:
    number,

  metallicCoreMassFraction01:
    number,

  silicateInteriorMassFraction01:
    number,
): number {

  const radiusRetentionIndex01 =
    clamp01(
      (
        radiusEarth -
        0.35
      ) /
      1.65,
    );

  const massRetentionIndex01 =
    clamp01(
      (
        Math.log10(
          Math.max(
            massEarth,
            1e-12,
          ),
        ) +
        1.15
      ) /
      1.50,
    );

  const bulkRetentionIndex01 =
    clamp01(
      0.55 *
        radiusRetentionIndex01 +
      0.45 *
        massRetentionIndex01,
    );

  const rockyHeatSourcePotential01 =
    clamp01(
      0.75 *
        clamp01(
          silicateInteriorMassFraction01 /
          0.70,
        ) +
      0.25 *
        clamp01(
          metallicCoreMassFraction01 /
          0.35,
        ),
    );

  return clamp01(
    0.62 *
      bulkRetentionIndex01 +
    0.38 *
      rockyHeatSourcePotential01,
  );
}

function tidalHeatingIndexV1(
  tidalHeatingProxy:
    number,
): number {

  return clamp01(
    Math.log10(
      1 +
      Math.max(
        0,
        tidalHeatingProxy,
      ),
    ) /
    3,
  );
}

function mantleConvectionIndexV1(
  internalHeatRetentionIndex01:
    number,

  tidalHeatingIndex01:
    number,

  planetType:
    PlanetType,
): number {

  const typePrior =
    planetType ===
      PlanetType.VOLCANIC
      ? 0.12
      : planetType ===
        PlanetType.SUPER_EARTH
        ? 0.03
        : 0;

  return clamp01(
    0.72 *
      internalHeatRetentionIndex01 +
    0.28 *
      tidalHeatingIndex01 +
    typePrior,
  );
}

function tectonicMobilityIndexV1(
  mantleConvectionIndex01:
    number,

  surfaceGravityEarth:
    number,

  silicateInteriorMassFraction01:
    number,

  surfaceLiquidWaterCoverageFraction01:
    number,
): number {

  const waterWeakeningSupport01 =
    Math.sqrt(
      clamp01(
        surfaceLiquidWaterCoverageFraction01,
      ),
    );

  const gravityMobilityWindow01 =
    clamp01(
      1 -
      Math.abs(
        Math.log2(
          Math.max(
            surfaceGravityEarth,
            0.05,
          ),
        ),
      ) /
      2,
    );

  const silicateMobilitySupport01 =
    clamp01(
      silicateInteriorMassFraction01 /
      0.70,
    );

  const dryLithospherePenalty =
    0.22 *
    (
      1 -
      waterWeakeningSupport01
    );

  return clamp01(
    0.52 *
      mantleConvectionIndex01 +
    0.22 *
      waterWeakeningSupport01 +
    0.14 *
      gravityMobilityWindow01 +
    0.12 *
      silicateMobilitySupport01 -
    dryLithospherePenalty,
  );
}

function assertGenerationContext(
  generationKey:
    UniverseGenerationKey,

  planet:
    Planet,

  waterInventory:
    PlanetWaterInventory,
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
      'PlanetGeologyEngine requires the Planet to share the supplied UniverseGenerationKey.',
    );
  }

  if (
    !planet.isTypePhysicallyCoherent
  ) {
    throw new RangeError(
      'PlanetGeologyEngine requires a point-19.7 physically coherent Planet.',
    );
  }

  if (
    waterInventory.planetOrdinal !==
      planet.planetOrdinal ||
    !sameBodyIdentity(
      planet,
      waterInventory,
    ) ||
    waterInventory.sourcePlanetType !==
      planet.planetType ||
    !approximatelyEqual(
      waterInventory.sourceIceBearingInteriorFraction01,
      planet.internalComposition
        .iceBearingFractionOfSolids01,
    )
  ) {
    throw new RangeError(
      'PlanetGeologyEngine requires the exact point-20.7 water inventory belonging to the supplied Planet.',
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
      waterInventory
        .surfaceLiquidWaterCoverageFraction01 ===
      null
    )
  ) {
    throw new RangeError(
      'Point-20.8 deep-envelope semantics must match the frozen point-20.7 surface-water boundary.',
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

  waterInventory:
    PlanetWaterInventory,
): boolean {

  return (
    waterInventory.bodyLocator.galaxyIndex ===
      planet.locator.galaxyIndex &&
    waterInventory.bodyLocator.sectorKey ===
      planet.locator.sectorKey &&
    waterInventory.bodyLocator.galacticObjectIndex ===
      planet.locator.galacticObjectIndex &&
    waterInventory.bodyLocator.bodyIndex ===
      planet.locator.bodyIndex &&
    waterInventory.bodySeed.normalizedValue ===
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

  return Math.min(
    1,
    Math.max(
      0,
      value,
    ),
  );
}
