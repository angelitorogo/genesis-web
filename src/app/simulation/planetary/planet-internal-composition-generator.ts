import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  PlanetInternalComposition,
} from '../../domain/planetary/planet-internal-composition';

import {
  type PlanetPhysicalProperties,
} from '../../domain/planetary/planet-physical-properties';

import {
  type PlanetaryArchitectureSlot,
} from '../../domain/planetary/planetary-architecture-slot';

import {
  type PlanetarySystem,
} from '../../domain/planetary/planetary-system';

interface SolidMaterialProfileV1 {
  readonly metallicCoreFraction01:
    number;

  readonly silicateInteriorFraction01:
    number;

  readonly condensedIceFraction01:
    number;

  readonly volatileRichInteriorFraction01:
    number;
}

/*
 * Each row maps one frozen point-17.4/17.5 source family to a coarse internal
 * solid-material budget. The ice-bearing total intentionally matches the
 * nominal ice fraction frozen by the original source family:
 *   REFRACTORY_RICH 0.01, ROCKY 0.06, ICE_RICH 0.45, VOLATILE_RICH 0.68.
 *
 * The metal/silicate split is an explicit V1 approximation. It is not a
 * mineralogical model and does not claim core radius or thermodynamic phase.
 */
const V1_REFRACTORY_RICH_PROFILE:
  SolidMaterialProfileV1 =
  Object.freeze({
    metallicCoreFraction01:
      0.46,
    silicateInteriorFraction01:
      0.53,
    condensedIceFraction01:
      0.005,
    volatileRichInteriorFraction01:
      0.005,
  });

const V1_ROCKY_PROFILE:
  SolidMaterialProfileV1 =
  Object.freeze({
    metallicCoreFraction01:
      0.30,
    silicateInteriorFraction01:
      0.64,
    condensedIceFraction01:
      0.04,
    volatileRichInteriorFraction01:
      0.02,
  });

const V1_ICE_RICH_PROFILE:
  SolidMaterialProfileV1 =
  Object.freeze({
    metallicCoreFraction01:
      0.10,
    silicateInteriorFraction01:
      0.45,
    condensedIceFraction01:
      0.36,
    volatileRichInteriorFraction01:
      0.09,
  });

const V1_VOLATILE_RICH_PROFILE:
  SolidMaterialProfileV1 =
  Object.freeze({
    metallicCoreFraction01:
      0.08,
    silicateInteriorFraction01:
      0.24,
    condensedIceFraction01:
      0.34,
    volatileRichInteriorFraction01:
      0.34,
  });

/**
 * Point-19.5 deterministic approximate internal-composition generator.
 *
 * V1 consumes zero PRNG draws and derives zero new seeds. It linearly maps the
 * frozen point-18.2 source-family mixture into four solid internal mass buckets,
 * then carries the exact point-19.2 accreted gas mass as the fifth bucket.
 * Therefore point 19.5 cannot create/destroy mass or silently reinterpret the
 * global gas budget already resolved in point 19.2.
 *
 * Planet type is intentionally not an input. Point 19.5 is an independent
 * physical projection from the same frozen history; point 19.7 will own the
 * explicit type <-> mass/radius/composition coherence checks.
 */
export class PlanetInternalCompositionGenerator {

  private constructor() {}

  static generate(
    generationKey:
      UniverseGenerationKey,

    planetarySystem:
      PlanetarySystem,

    physicalProperties:
      PlanetPhysicalProperties,
  ): PlanetInternalComposition {

    assertGenerationContext(
      generationKey,
      planetarySystem,
    );

    const index =
      validatePhysicalPropertiesIdentity(
        planetarySystem,
        physicalProperties,
      );

    return materializeCompositionV1(
      planetarySystem.planetSlots[index],
      physicalProperties,
    );
  }

  static generateAll(
    generationKey:
      UniverseGenerationKey,

    planetarySystem:
      PlanetarySystem,

    physicalProperties:
      readonly PlanetPhysicalProperties[],
  ): readonly PlanetInternalComposition[] {

    assertGenerationContext(
      generationKey,
      planetarySystem,
    );

    if (
      physicalProperties.length !==
      planetarySystem.planetCount
    ) {
      throw new RangeError(
        'PlanetInternalCompositionGenerator requires exactly one point-19.2 physical state for every mature planet.',
      );
    }

    return Object.freeze(
      physicalProperties.map(
        (
          properties,
          index,
        ) => {
          const resolvedIndex =
            validatePhysicalPropertiesIdentity(
              planetarySystem,
              properties,
            );

          if (
            resolvedIndex !==
            index
          ) {
            throw new RangeError(
              'Point-19.2 physical states must be supplied in frozen planetOrdinal order for point 19.5 internal composition.',
            );
          }

          return materializeCompositionV1(
            planetarySystem.planetSlots[index],
            properties,
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
      'PlanetInternalCompositionGenerator requires the PlanetarySystem to share the supplied UniverseGenerationKey.',
    );
  }
}

function validatePhysicalPropertiesIdentity(
  planetarySystem:
    PlanetarySystem,

  physicalProperties:
    PlanetPhysicalProperties,
): number {

  const index =
    physicalProperties.planetOrdinal -
    1;

  if (
    index <
      0 ||
    index >=
      planetarySystem.planetCount
  ) {
    throw new RangeError(
      'Point-19.2 physical properties do not address an existing mature planet.',
    );
  }

  const slot =
    planetarySystem.planetSlots[index];

  if (
    !sameBodyIdentity(
      slot,
      physicalProperties,
    )
  ) {
    throw new RangeError(
      'PlanetInternalCompositionGenerator requires point-19.2 physical properties to preserve the exact point-18 BodyLocator/BodySeed identity.',
    );
  }

  if (
    !approximatelyEqual(
      slot.inheritedSolidCoreMassEarth,
      physicalProperties.inheritedSolidCoreMassEarth,
    )
  ) {
    throw new RangeError(
      'PlanetInternalCompositionGenerator requires the frozen point-18.2 solid mass to be preserved.',
    );
  }

  return index;
}

function materializeCompositionV1(
  slot:
    PlanetaryArchitectureSlot,

  physicalProperties:
    PlanetPhysicalProperties,
): PlanetInternalComposition {

  const mixture =
    slot.inheritedCompositionMixture;

  const materialProfile =
    weightedMaterialProfileV1(
      mixture.refractoryRichFraction01,
      mixture.rockyFraction01,
      mixture.iceRichFraction01,
      mixture.volatileRichFraction01,
    );

  const solidMassEarth =
    physicalProperties
      .inheritedSolidCoreMassEarth;

  const metallicCoreMassEarth =
    solidMassEarth *
    materialProfile
      .metallicCoreFraction01;

  const silicateInteriorMassEarth =
    solidMassEarth *
    materialProfile
      .silicateInteriorFraction01;

  const condensedIceMassEarth =
    solidMassEarth *
    materialProfile
      .condensedIceFraction01;

  /*
   * Use the residual for the fourth solid bucket so floating-point rounding can
   * never manufacture or lose solid mass across the four-material projection.
   */
  const volatileRichInteriorMassEarth =
    Math.max(
      0,
      solidMassEarth -
        metallicCoreMassEarth -
        silicateInteriorMassEarth -
        condensedIceMassEarth,
    );

  return new PlanetInternalComposition(
    physicalProperties.planetOrdinal,
    physicalProperties.bodyLocator,
    physicalProperties.bodySeed,
    solidMassEarth,
    physicalProperties.accretedEnvelopeMassEarth,
    mixture.refractoryRichFraction01,
    mixture.rockyFraction01,
    mixture.iceRichFraction01,
    mixture.volatileRichFraction01,
    metallicCoreMassEarth,
    silicateInteriorMassEarth,
    condensedIceMassEarth,
    volatileRichInteriorMassEarth,
    physicalProperties.accretedEnvelopeMassEarth,
  );
}

function weightedMaterialProfileV1(
  refractoryRichFraction01:
    number,

  rockyFraction01:
    number,

  iceRichFraction01:
    number,

  volatileRichFraction01:
    number,
): SolidMaterialProfileV1 {

  const metallicCoreFraction01 =
    weightedComponent(
      refractoryRichFraction01,
      rockyFraction01,
      iceRichFraction01,
      volatileRichFraction01,
      'metallicCoreFraction01',
    );

  const silicateInteriorFraction01 =
    weightedComponent(
      refractoryRichFraction01,
      rockyFraction01,
      iceRichFraction01,
      volatileRichFraction01,
      'silicateInteriorFraction01',
    );

  const condensedIceFraction01 =
    weightedComponent(
      refractoryRichFraction01,
      rockyFraction01,
      iceRichFraction01,
      volatileRichFraction01,
      'condensedIceFraction01',
    );

  const volatileRichInteriorFraction01 =
    Math.max(
      0,
      1 -
        metallicCoreFraction01 -
        silicateInteriorFraction01 -
        condensedIceFraction01,
    );

  return {
    metallicCoreFraction01,
    silicateInteriorFraction01,
    condensedIceFraction01,
    volatileRichInteriorFraction01,
  };
}

function weightedComponent(
  refractoryRichFraction01:
    number,

  rockyFraction01:
    number,

  iceRichFraction01:
    number,

  volatileRichFraction01:
    number,

  key:
    keyof SolidMaterialProfileV1,
): number {

  return (
    refractoryRichFraction01 *
      V1_REFRACTORY_RICH_PROFILE[key] +
    rockyFraction01 *
      V1_ROCKY_PROFILE[key] +
    iceRichFraction01 *
      V1_ICE_RICH_PROFILE[key] +
    volatileRichFraction01 *
      V1_VOLATILE_RICH_PROFILE[key]
  );
}

function sameBodyIdentity(
  slot:
    PlanetaryArchitectureSlot,

  physicalProperties:
    PlanetPhysicalProperties,
): boolean {

  return (
    slot.planetOrdinal ===
      physicalProperties.planetOrdinal &&
    slot.bodyLocator.galaxyIndex ===
      physicalProperties.bodyLocator.galaxyIndex &&
    slot.bodyLocator.sectorKey ===
      physicalProperties.bodyLocator.sectorKey &&
    slot.bodyLocator.galacticObjectIndex ===
      physicalProperties.bodyLocator.galacticObjectIndex &&
    slot.bodyLocator.bodyIndex ===
      physicalProperties.bodyLocator.bodyIndex &&
    slot.bodySeed.normalizedValue ===
      physicalProperties.bodySeed.normalizedValue
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
    1e-9 *
      scale
  );
}
