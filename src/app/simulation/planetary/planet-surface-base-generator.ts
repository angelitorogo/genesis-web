import {
  sha256,
} from '@noble/hashes/sha2.js';

import {
  bytesToHex,
  hexToBytes,
  utf8ToBytes,
} from '@noble/hashes/utils.js';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  type BodySeed,
} from '../../domain/seed/hierarchical-seeds';

import {
  type PlanetInternalComposition,
} from '../../domain/planetary/planet-internal-composition';

import {
  PlanetSurfaceBaseProperties,
} from '../../domain/planetary/planet-surface-base-properties';

import {
  PlanetSurfaceBaseRegime,
} from '../../domain/planetary/planet-surface-base-regime';

import {
  PlanetType,
} from '../../domain/planetary/planet-type';

import {
  type PlanetTypeClassification,
} from '../../domain/planetary/planet-type-classification';

import {
  type PlanetaryArchitectureSlot,
} from '../../domain/planetary/planetary-architecture-slot';

import {
  type PlanetarySystem,
} from '../../domain/planetary/planetary-system';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  Sfc64Random,
} from '../random/sfc64-random';

const V1_PLANET_SURFACE_ALBEDO_BRANCH =
  utf8ToBytes(
    'GENESIS-PLANET-SURFACE-ALBEDO-V1',
  );

const V1_PLANET_SURFACE_PATTERN_BRANCH =
  utf8ToBytes(
    'GENESIS-PLANET-SURFACE-PATTERN-V1',
  );

interface SurfaceFractionsV1 {
  readonly mineral:
    number;

  readonly volatileBearing:
    number;

  readonly molten:
    number;

  readonly deepEnvelope:
    number;
}

interface RangeV1 {
  readonly minimum:
    number;

  readonly maximum:
    number;
}

/**
 * Point-19.6 deterministic reference-albedo and surface-base generator.
 *
 * V1 consumes two independent branches of the existing BodySeed: one for a
 * bounded albedo scatter and one for coarse surface-expression/roughness
 * variation. The branch labels are independent from points 19.2 and 19.3, so
 * materialization order cannot perturb already-frozen bulk or rotation values.
 *
 * The generated fractions are baseline surface expressions, not final climate
 * maps. No atmosphere, cloud deck, liquid-water inventory, weather, tectonics
 * or detailed volcanism is materialized here; phase 20 owns those refinements.
 */
export class PlanetSurfaceBaseGenerator {

  private constructor() {}

  static generate(
    generationKey:
      UniverseGenerationKey,

    planetarySystem:
      PlanetarySystem,

    typeClassification:
      PlanetTypeClassification,

    internalComposition:
      PlanetInternalComposition,
  ): PlanetSurfaceBaseProperties {

    assertGenerationContext(
      generationKey,
      planetarySystem,
    );

    validateSourceIdentity(
      planetarySystem,
      typeClassification,
      internalComposition,
    );

    return generateSurfaceV1(
      typeClassification,
      internalComposition,
    );
  }

  static generateAll(
    generationKey:
      UniverseGenerationKey,

    planetarySystem:
      PlanetarySystem,

    typeClassifications:
      readonly PlanetTypeClassification[],

    internalCompositions:
      readonly PlanetInternalComposition[],
  ): readonly PlanetSurfaceBaseProperties[] {

    assertGenerationContext(
      generationKey,
      planetarySystem,
    );

    if (
      typeClassifications.length !==
        planetarySystem.planetCount ||
      internalCompositions.length !==
        planetarySystem.planetCount
    ) {
      throw new RangeError(
        'PlanetSurfaceBaseGenerator requires exactly one point-19.4 type and one point-19.5 composition for every mature planet.',
      );
    }

    return Object.freeze(
      typeClassifications.map(
        (
          typeClassification,
          index,
        ) => {
          const internalComposition =
            internalCompositions[index];

          const resolvedIndex =
            validateSourceIdentity(
              planetarySystem,
              typeClassification,
              internalComposition,
            );

          if (
            resolvedIndex !==
            index
          ) {
            throw new RangeError(
              'Point-19.4/19.5 source states must be supplied in frozen planetOrdinal order for point 19.6 surface generation.',
            );
          }

          return generateSurfaceV1(
            typeClassification,
            internalComposition,
          );
        },
      ),
    );
  }
}

function assertGenerationContext(
  generationKey:
    UniverseGenerationKey,

  planetarySystem:
    PlanetarySystem,
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
      planetarySystem.generationKey,
    )
  ) {
    throw new RangeError(
      'PlanetSurfaceBaseGenerator requires the PlanetarySystem to share the supplied UniverseGenerationKey.',
    );
  }
}

function validateSourceIdentity(
  planetarySystem:
    PlanetarySystem,

  typeClassification:
    PlanetTypeClassification,

  internalComposition:
    PlanetInternalComposition,
): number {

  const index =
    typeClassification.planetOrdinal -
    1;

  if (
    index <
      0 ||
    index >=
      planetarySystem.planetCount
  ) {
    throw new RangeError(
      'Point-19.4 type classification does not address an existing mature planet.',
    );
  }

  const slot =
    planetarySystem.planetSlots[index];

  if (
    !sameBodyIdentity(
      slot,
      typeClassification,
    ) ||
    !sameBodyIdentity(
      slot,
      internalComposition,
    )
  ) {
    throw new RangeError(
      'PlanetSurfaceBaseGenerator requires point-19.4/19.5 source states to preserve the exact point-18 BodyLocator/BodySeed identity.',
    );
  }

  if (
    internalComposition.planetOrdinal !==
    typeClassification.planetOrdinal
  ) {
    throw new RangeError(
      'Point-19.4 type and point-19.5 composition must address the same planetOrdinal.',
    );
  }

  if (
    !approximatelyEqual(
      typeClassification
        .sourceEnvelopeMassFraction01,
      internalComposition
        .gaseousEnvelopeMassFraction01,
    )
  ) {
    throw new RangeError(
      'Point-19.6 requires point-19.4 and point-19.5 to agree on the frozen envelope mass fraction.',
    );
  }

  if (
    !approximatelyEqual(
      typeClassification
        .sourceIceBearingSolidFraction01,
      internalComposition
        .sourceIceBearingFraction01,
    )
  ) {
    throw new RangeError(
      'Point-19.6 requires point-19.4 and point-19.5 to agree on the frozen source ice-bearing fraction.',
    );
  }

  return index;
}

function generateSurfaceV1(
  typeClassification:
    PlanetTypeClassification,

  internalComposition:
    PlanetInternalComposition,
): PlanetSurfaceBaseProperties {

  const patternRandom =
    randomForBodyBranchV1(
      typeClassification.bodySeed,
      V1_PLANET_SURFACE_PATTERN_BRANCH,
    );

  const albedoRandom =
    randomForBodyBranchV1(
      typeClassification.bodySeed,
      V1_PLANET_SURFACE_ALBEDO_BRANCH,
    );

  const surfaceRegime =
    surfaceRegimeForTypeV1(
      typeClassification.planetType,
    );

  const surfaceFractions =
    surfaceFractionsV1(
      typeClassification,
      internalComposition,
      patternRandom.nextDouble(),
    );

  const referenceBondAlbedo01 =
    referenceBondAlbedoV1(
      typeClassification,
      surfaceFractions,
      albedoRandom.nextDouble(),
    );

  const baseSolidSurfaceRoughness01 =
    solidSurfaceRoughnessV1(
      typeClassification.planetType,
      patternRandom.nextDouble(),
    );

  return new PlanetSurfaceBaseProperties(
    typeClassification.planetOrdinal,
    typeClassification.bodyLocator,
    typeClassification.bodySeed,
    typeClassification.planetType,
    typeClassification.sourceEnvelopeMassFraction01,
    internalComposition.iceBearingFractionOfSolids01,
    typeClassification.referenceMeanInsolationEarth,
    surfaceRegime,
    referenceBondAlbedo01,
    surfaceFractions.mineral,
    surfaceFractions.volatileBearing,
    surfaceFractions.molten,
    surfaceFractions.deepEnvelope,
    baseSolidSurfaceRoughness01,
  );
}

function surfaceRegimeForTypeV1(
  planetType:
    PlanetType,
): PlanetSurfaceBaseRegime {

  switch (
    planetType
  ) {
    case PlanetType.ROCKY:
      return PlanetSurfaceBaseRegime.MINERAL_REGOLITH;

    case PlanetType.SUPER_EARTH:
      return PlanetSurfaceBaseRegime.MASSIVE_MINERAL_REGOLITH;

    case PlanetType.DESERT:
      return PlanetSurfaceBaseRegime.ARID_MINERAL;

    case PlanetType.OCEAN:
      return PlanetSurfaceBaseRegime.VOLATILE_RICH_SOLID;

    case PlanetType.ICE:
      return PlanetSurfaceBaseRegime.FROZEN_VOLATILE;

    case PlanetType.VOLCANIC:
      return PlanetSurfaceBaseRegime.THERMALLY_REWORKED_MINERAL;

    case PlanetType.MINI_NEPTUNE:
    case PlanetType.GAS_GIANT:
      return PlanetSurfaceBaseRegime.DEEP_ENVELOPE;

    case PlanetType.ICE_GIANT:
      return PlanetSurfaceBaseRegime.ICE_RICH_DEEP_ENVELOPE;
  }
}

function surfaceFractionsV1(
  typeClassification:
    PlanetTypeClassification,

  internalComposition:
    PlanetInternalComposition,

  patternDraw:
    number,
): SurfaceFractionsV1 {

  const iceBearingInteriorFraction01 =
    internalComposition
      .iceBearingFractionOfSolids01;

  switch (
    typeClassification.planetType
  ) {
    case PlanetType.ROCKY: {
      const volatileBearing =
        clamp(
          0.01 +
          0.12 *
            iceBearingInteriorFraction01 *
            lerp(
              0.65,
              1.0,
              patternDraw,
            ),
          0.005,
          0.15,
        );

      return solidFractions(
        volatileBearing,
        0,
      );
    }

    case PlanetType.SUPER_EARTH: {
      const volatileBearing =
        clamp(
          0.015 +
          0.14 *
            iceBearingInteriorFraction01 *
            lerp(
              0.65,
              1.0,
              patternDraw,
            ),
          0.005,
          0.18,
        );

      return solidFractions(
        volatileBearing,
        0,
      );
    }

    case PlanetType.DESERT:
      return solidFractions(
        lerp(
          0.005,
          0.06,
          patternDraw *
            iceBearingInteriorFraction01,
        ),
        0,
      );

    case PlanetType.OCEAN:
      return solidFractions(
        clamp(
          0.45 +
          0.40 *
            iceBearingInteriorFraction01 +
          0.05 *
            (
              patternDraw -
              0.5
            ),
          0.40,
          0.90,
        ),
        0,
      );

    case PlanetType.ICE:
      return solidFractions(
        clamp(
          0.70 +
          0.25 *
            iceBearingInteriorFraction01 +
          0.03 *
            (
              patternDraw -
              0.5
            ),
          0.68,
          0.98,
        ),
        0,
      );

    case PlanetType.VOLCANIC: {
      const heatingStrength =
        normalizedHeatingStrengthV1(
          typeClassification,
        );

      const molten =
        clamp(
          0.30 +
          0.50 *
            heatingStrength +
          0.08 *
            patternDraw,
          0.25,
          0.90,
        );

      return solidFractions(
        0,
        molten,
      );
    }

    case PlanetType.MINI_NEPTUNE:
    case PlanetType.GAS_GIANT:
    case PlanetType.ICE_GIANT:
      return {
        mineral:
          0,
        volatileBearing:
          0,
        molten:
          0,
        deepEnvelope:
          1,
      };
  }
}

function solidFractions(
  volatileBearing:
    number,

  molten:
    number,
): SurfaceFractionsV1 {

  const mineral =
    Math.max(
      0,
      1 -
        volatileBearing -
        molten,
    );

  return {
    mineral,
    volatileBearing,
    molten,
    deepEnvelope:
      0,
  };
}

function normalizedHeatingStrengthV1(
  typeClassification:
    PlanetTypeClassification,
): number {

  const tidalStrength =
    clamp01(
      Math.log10(
        1 +
        typeClassification
          .tidalHeatingProxy,
      ) /
      4,
    );

  const irradiationStrength =
    clamp01(
      Math.log10(
        1 +
        typeClassification
          .referenceMeanInsolationEarth,
      ) /
      3,
    );

  return Math.max(
    tidalStrength,
    irradiationStrength,
  );
}

function referenceBondAlbedoV1(
  typeClassification:
    PlanetTypeClassification,

  surfaceFractions:
    SurfaceFractionsV1,

  scatterDraw:
    number,
): number {

  const range =
    albedoRangeV1(
      typeClassification.planetType,
    );

  const physicalBias =
    albedoPhysicalBiasV1(
      typeClassification.planetType,
      surfaceFractions,
    );

  const normalized =
    clamp01(
      0.75 *
        physicalBias +
      0.25 *
        scatterDraw,
    );

  return lerp(
    range.minimum,
    range.maximum,
    normalized,
  );
}

function albedoRangeV1(
  planetType:
    PlanetType,
): RangeV1 {

  switch (
    planetType
  ) {
    case PlanetType.ROCKY:
      return range(0.08, 0.30);

    case PlanetType.SUPER_EARTH:
      return range(0.10, 0.32);

    case PlanetType.DESERT:
      return range(0.20, 0.42);

    case PlanetType.OCEAN:
      return range(0.10, 0.35);

    case PlanetType.ICE:
      return range(0.45, 0.75);

    case PlanetType.VOLCANIC:
      return range(0.05, 0.20);

    case PlanetType.MINI_NEPTUNE:
      return range(0.20, 0.48);

    case PlanetType.GAS_GIANT:
      return range(0.25, 0.55);

    case PlanetType.ICE_GIANT:
      return range(0.25, 0.58);
  }
}

function albedoPhysicalBiasV1(
  planetType:
    PlanetType,

  surfaceFractions:
    SurfaceFractionsV1,
): number {

  switch (
    planetType
  ) {
    case PlanetType.ROCKY:
      return 0.30 +
        0.45 *
          surfaceFractions.volatileBearing;

    case PlanetType.SUPER_EARTH:
      return 0.35 +
        0.40 *
          surfaceFractions.volatileBearing;

    case PlanetType.DESERT:
      return 0.65;

    case PlanetType.OCEAN:
      return 0.25 +
        0.45 *
          surfaceFractions.volatileBearing;

    case PlanetType.ICE:
      return 0.65 +
        0.30 *
          surfaceFractions.volatileBearing;

    case PlanetType.VOLCANIC:
      return 0.12 +
        0.18 *
          surfaceFractions.mineral;

    case PlanetType.MINI_NEPTUNE:
      return 0.50;

    case PlanetType.GAS_GIANT:
      return 0.55;

    case PlanetType.ICE_GIANT:
      return 0.65;
  }
}

function solidSurfaceRoughnessV1(
  planetType:
    PlanetType,

  draw:
    number,
): number | null {

  switch (
    planetType
  ) {
    case PlanetType.ROCKY:
      return lerp(0.55, 0.95, draw);

    case PlanetType.SUPER_EARTH:
      return lerp(0.45, 0.85, draw);

    case PlanetType.DESERT:
      return lerp(0.35, 0.75, draw);

    case PlanetType.OCEAN:
      return lerp(0.15, 0.55, draw);

    case PlanetType.ICE:
      return lerp(0.20, 0.60, draw);

    case PlanetType.VOLCANIC:
      return lerp(0.25, 0.70, draw);

    case PlanetType.MINI_NEPTUNE:
    case PlanetType.GAS_GIANT:
    case PlanetType.ICE_GIANT:
      return null;
  }
}

function range(
  minimum:
    number,

  maximum:
    number,
): RangeV1 {

  return {
    minimum,
    maximum,
  };
}

function sameBodyIdentity(
  slot:
    PlanetaryArchitectureSlot,

  bodyObject:
    Pick<
      PlanetTypeClassification,
      'bodyLocator' |
      'bodySeed'
    >,
): boolean {

  return (
    slot.bodyLocator.galaxyIndex ===
      bodyObject.bodyLocator.galaxyIndex &&
    slot.bodyLocator.sectorKey ===
      bodyObject.bodyLocator.sectorKey &&
    slot.bodyLocator.galacticObjectIndex ===
      bodyObject.bodyLocator.galacticObjectIndex &&
    slot.bodyLocator.bodyIndex ===
      bodyObject.bodyLocator.bodyIndex &&
    slot.bodySeed.normalizedValue ===
      bodyObject.bodySeed.normalizedValue
  );
}

function randomForBodyBranchV1(
  bodySeed:
    BodySeed,

  branch:
    Uint8Array,
): Sfc64Random {

  const digest =
    sha256
      .create()
      .update(
        branch,
      )
      .update(
        hexToBytes(
          bodySeed
            .normalizedValue,
        ),
      )
      .digest();

  const normalized =
    bytesToHex(
      digest.slice(
        0,
        16,
      ),
    )
      .toUpperCase();

  return new Sfc64Random(
    universeSeedFromNormalized128(
      normalized,
    ),
  );
}

function universeSeedFromNormalized128(
  normalized:
    string,
): UniverseSeed {

  const canonical =
    normalized
      .match(
        /.{4}/gu,
      )
      ?.join(
        '-',
      );

  if (
    canonical ===
    undefined
  ) {
    throw new RangeError(
      'Unable to format a deterministic point-19.6 surface branch seed.',
    );
  }

  return UniverseSeed.parse(
    canonical,
  );
}

function lerp(
  start:
    number,

  end:
    number,

  t:
    number,
): number {

  return start +
    (
      end -
      start
    ) *
    t;
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
    1e-9 *
    scale;
}
