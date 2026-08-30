import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  type PlanetInternalComposition,
} from '../../domain/planetary/planet-internal-composition';

import {
  type PlanetPhysicalProperties,
} from '../../domain/planetary/planet-physical-properties';

import {
  PlanetRarityAssessment,
  planetRarityTraitsForSourcesV1,
} from '../../domain/planetary/planet-rarity-assessment';

import {
  type PlanetRotationProperties,
} from '../../domain/planetary/planet-rotation-properties';

import {
  type PlanetSurfaceBaseProperties,
} from '../../domain/planetary/planet-surface-base-properties';

import {
  type PlanetTypeClassification,
} from '../../domain/planetary/planet-type-classification';

import {
  type PlanetTypePhysicalCoherenceAssessment,
} from '../../domain/planetary/planet-type-physical-coherence-assessment';

import {
  type PlanetarySystem,
} from '../../domain/planetary/planetary-system';

/**
 * Point-19.8 deterministic basic-rarity materializer.
 *
 * V1 derives zero new seeds and consumes zero PRNG draws. Rarity traits are
 * explicit tail diagnostics over the already-generated phase-18/19 physical
 * state. This prevents "special planet" rolls from changing the planet after
 * its physics is known and keeps phase-20+ atmosphere/life/moon/history rarity
 * concerns outside the phase-19 boundary.
 */
export class PlanetRarityGenerator {

  private constructor() {}

  static generate(
    generationKey:
      UniverseGenerationKey,

    planetarySystem:
      PlanetarySystem,

    physicalProperties:
      PlanetPhysicalProperties,

    rotationProperties:
      PlanetRotationProperties,

    typeClassification:
      PlanetTypeClassification,

    internalComposition:
      PlanetInternalComposition,

    surfaceBaseProperties:
      PlanetSurfaceBaseProperties,

    typePhysicalCoherenceAssessment:
      PlanetTypePhysicalCoherenceAssessment,
  ): PlanetRarityAssessment {

    assertGenerationContext(
      generationKey,
      planetarySystem,
    );

    const index =
      validateInputs(
        planetarySystem,
        physicalProperties,
        rotationProperties,
        typeClassification,
        internalComposition,
        surfaceBaseProperties,
        typePhysicalCoherenceAssessment,
      );

    return assessV1(
      planetarySystem,
      index,
      physicalProperties,
      rotationProperties,
      typeClassification,
      internalComposition,
      surfaceBaseProperties,
      typePhysicalCoherenceAssessment,
    );
  }

  static generateAll(
    generationKey:
      UniverseGenerationKey,

    planetarySystem:
      PlanetarySystem,

    physicalProperties:
      readonly PlanetPhysicalProperties[],

    rotationProperties:
      readonly PlanetRotationProperties[],

    typeClassifications:
      readonly PlanetTypeClassification[],

    internalCompositions:
      readonly PlanetInternalComposition[],

    surfaceBaseProperties:
      readonly PlanetSurfaceBaseProperties[],

    typePhysicalCoherenceAssessments:
      readonly PlanetTypePhysicalCoherenceAssessment[],
  ): readonly PlanetRarityAssessment[] {

    assertGenerationContext(
      generationKey,
      planetarySystem,
    );

    const expectedLength =
      planetarySystem
        .planetCount;

    const collections = [
      physicalProperties,
      rotationProperties,
      typeClassifications,
      internalCompositions,
      surfaceBaseProperties,
      typePhysicalCoherenceAssessments,
    ] as const;

    if (
      collections.some(
        collection =>
          collection.length !==
          expectedLength,
      )
    ) {
      throw new RangeError(
        'PlanetRarityGenerator requires one aligned point-19.2..19.7 source state for every mature planet.',
      );
    }

    return Object.freeze(
      physicalProperties.map(
        (
          properties,
          index,
        ) => {
          const resolvedIndex =
            validateInputs(
              planetarySystem,
              properties,
              rotationProperties[index],
              typeClassifications[index],
              internalCompositions[index],
              surfaceBaseProperties[index],
              typePhysicalCoherenceAssessments[index],
            );

          if (
            resolvedIndex !==
            index
          ) {
            throw new RangeError(
              'Point-19.8 inputs must be supplied in contiguous frozen planetOrdinal order.',
            );
          }

          return assessV1(
            planetarySystem,
            index,
            properties,
            rotationProperties[index],
            typeClassifications[index],
            internalCompositions[index],
            surfaceBaseProperties[index],
            typePhysicalCoherenceAssessments[index],
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
      'PlanetRarityGenerator requires the PlanetarySystem to share the supplied UniverseGenerationKey.',
    );
  }
}

function validateInputs(
  planetarySystem:
    PlanetarySystem,

  physicalProperties:
    PlanetPhysicalProperties,

  rotationProperties:
    PlanetRotationProperties,

  typeClassification:
    PlanetTypeClassification,

  internalComposition:
    PlanetInternalComposition,

  surfaceBaseProperties:
    PlanetSurfaceBaseProperties,

  typePhysicalCoherenceAssessment:
    PlanetTypePhysicalCoherenceAssessment,
): number {

  const index =
    physicalProperties
      .planetOrdinal -
    1;

  if (
    index <
      0 ||
    index >=
      planetarySystem.planetCount
  ) {
    throw new RangeError(
      'Point-19.8 sources do not address an existing mature planet.',
    );
  }

  const sources = [
    physicalProperties,
    rotationProperties,
    typeClassification,
    internalComposition,
    surfaceBaseProperties,
    typePhysicalCoherenceAssessment,
  ] as const;

  for (
    const source
    of sources
  ) {
    if (
      source.planetOrdinal !==
      physicalProperties.planetOrdinal ||
      !sameBodyLocator(
        source.bodyLocator,
        physicalProperties.bodyLocator,
      ) ||
      source.bodySeed.normalizedValue !==
        physicalProperties.bodySeed.normalizedValue
    ) {
      throw new RangeError(
        'Point-19.8 requires all source products to preserve the same BodyLocator/BodySeed/planetOrdinal identity.',
      );
    }
  }

  const slot =
    planetarySystem
      .planetSlots[index];

  if (
    !sameBodyLocator(
      slot.bodyLocator,
      physicalProperties.bodyLocator,
    ) ||
    slot.bodySeed.normalizedValue !==
      physicalProperties.bodySeed.normalizedValue
  ) {
    throw new RangeError(
      'PlanetRarityGenerator requires the canonical point-18 mature-planet identity.',
    );
  }

  if (
    typeClassification.planetType !==
      typePhysicalCoherenceAssessment.planetType ||
    typeClassification.planetType !==
      surfaceBaseProperties.sourcePlanetType
  ) {
    throw new RangeError(
      'Point-19.8 requires point-19.4, 19.6 and 19.7 to refer to the same planet type.',
    );
  }

  if (
    !approximatelyEqual(
      typeClassification.sourceMassEarth,
      physicalProperties.massEarth,
    ) ||
    !approximatelyEqual(
      typeClassification.sourceRadiusEarth,
      physicalProperties.radiusEarth,
    ) ||
    !approximatelyEqual(
      typeClassification.sourceDensityGramsPerCubicCentimeter,
      physicalProperties.densityGramsPerCubicCentimeter,
    ) ||
    !approximatelyEqual(
      typeClassification.sourceEnvelopeMassFraction01,
      physicalProperties.envelopeMassFraction01,
    )
  ) {
    throw new RangeError(
      'Point-19.8 requires the exact point-19.2 bulk sources frozen by point 19.4.',
    );
  }

  if (
    !approximatelyEqual(
      internalComposition.totalMassEarth,
      physicalProperties.massEarth,
    ) ||
    !approximatelyEqual(
      internalComposition.gaseousEnvelopeMassFraction01,
      physicalProperties.envelopeMassFraction01,
    )
  ) {
    throw new RangeError(
      'Point-19.8 requires point-19.5 composition to preserve the exact point-19.2 total/envelope mass budget.',
    );
  }

  if (
    !approximatelyEqual(
      surfaceBaseProperties.sourceEnvelopeMassFraction01,
      physicalProperties.envelopeMassFraction01,
    ) ||
    !approximatelyEqual(
      surfaceBaseProperties.sourceIceBearingInteriorFraction01,
      internalComposition.iceBearingFractionOfSolids01,
    ) ||
    !approximatelyEqual(
      surfaceBaseProperties.sourceReferenceMeanInsolationEarth,
      typeClassification.referenceMeanInsolationEarth,
    )
  ) {
    throw new RangeError(
      'Point-19.8 requires point-19.6 surface sources to preserve the point-19.2/19.4/19.5 physical context.',
    );
  }

  return index;
}

function assessV1(
  planetarySystem:
    PlanetarySystem,

  index:
    number,

  physicalProperties:
    PlanetPhysicalProperties,

  rotationProperties:
    PlanetRotationProperties,

  typeClassification:
    PlanetTypeClassification,

  internalComposition:
    PlanetInternalComposition,

  surfaceBaseProperties:
    PlanetSurfaceBaseProperties,

  typePhysicalCoherenceAssessment:
    PlanetTypePhysicalCoherenceAssessment,
): PlanetRarityAssessment {

  const orbit =
    planetarySystem
      .orbits[index];

  const metallicCoreFractionOfSolids01 =
    internalComposition
      .metallicCoreMassEarth /
    internalComposition
      .solidInteriorMassEarth;

  const sourceSnapshot = {
    planetType:
      typeClassification.planetType,
    massEarth:
      physicalProperties.massEarth,
    radiusEarth:
      physicalProperties.radiusEarth,
    densityGramsPerCubicCentimeter:
      physicalProperties.densityGramsPerCubicCentimeter,
    surfaceGravityEarth:
      physicalProperties.surfaceGravityEarth,
    envelopeMassFraction01:
      physicalProperties.envelopeMassFraction01,
    rotationPeriodHours:
      rotationProperties.rotationPeriodHours,
    axialTiltDegrees:
      rotationProperties.axialTiltDegrees,
    orbitalEccentricity:
      orbit.eccentricity,
    referenceMeanInsolationEarth:
      typeClassification.referenceMeanInsolationEarth,
    tidalHeatingProxy:
      typeClassification.tidalHeatingProxy,
    metallicCoreFractionOfSolids01,
    iceBearingFractionOfSolids01:
      internalComposition.iceBearingFractionOfSolids01,
    referenceBondAlbedo01:
      surfaceBaseProperties.referenceBondAlbedo01,
    typePhysicallyCoherent:
      typePhysicalCoherenceAssessment.isCoherent,
  } as const;

  const traits =
    planetRarityTraitsForSourcesV1(
      sourceSnapshot,
    );

  return new PlanetRarityAssessment(
    physicalProperties.planetOrdinal,
    physicalProperties.bodyLocator,
    physicalProperties.bodySeed,
    sourceSnapshot.planetType,
    sourceSnapshot.massEarth,
    sourceSnapshot.radiusEarth,
    sourceSnapshot.densityGramsPerCubicCentimeter,
    sourceSnapshot.surfaceGravityEarth,
    sourceSnapshot.envelopeMassFraction01,
    sourceSnapshot.rotationPeriodHours,
    sourceSnapshot.axialTiltDegrees,
    sourceSnapshot.orbitalEccentricity,
    sourceSnapshot.referenceMeanInsolationEarth,
    sourceSnapshot.tidalHeatingProxy,
    sourceSnapshot.metallicCoreFractionOfSolids01,
    sourceSnapshot.iceBearingFractionOfSolids01,
    sourceSnapshot.referenceBondAlbedo01,
    sourceSnapshot.typePhysicallyCoherent,
    traits,
  );
}

function sameBodyLocator(
  left:
    { readonly galaxyIndex: bigint; readonly sectorKey: bigint; readonly galacticObjectIndex: bigint; readonly bodyIndex: bigint },

  right:
    { readonly galaxyIndex: bigint; readonly sectorKey: bigint; readonly galacticObjectIndex: bigint; readonly bodyIndex: bigint },
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
