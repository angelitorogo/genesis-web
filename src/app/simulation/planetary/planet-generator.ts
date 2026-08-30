import {
  type BodyLocator,
} from '../../domain/generation/procedural-locator';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  Planet,
} from '../../domain/planetary/planet';

import {
  type PlanetInternalComposition,
} from '../../domain/planetary/planet-internal-composition';

import {
  type PlanetPhysicalProperties,
} from '../../domain/planetary/planet-physical-properties';

import {
  type PlanetRarityAssessment,
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

import {
  PlanetInternalCompositionGenerator,
} from './planet-internal-composition-generator';

import {
  PlanetPhysicalPropertiesGenerator,
} from './planet-physical-properties-generator';

import {
  PlanetRarityGenerator,
} from './planet-rarity-generator';

import {
  PlanetRotationPropertiesGenerator,
} from './planet-rotation-properties-generator';

import {
  PlanetSurfaceBaseGenerator,
} from './planet-surface-base-generator';

import {
  PlanetTypeGenerator,
} from './planet-type-generator';

import {
  PlanetTypePhysicalCoherenceGenerator,
} from './planet-type-physical-coherence-generator';

/**
 * Point-19.1 deterministic Planet materializer.
 *
 * The generator addresses a planet through the canonical BodyLocator already
 * chosen by point 18.2 and binds the exact phase-18 slot/orbit/period/HZ/
 * designation projections into one Planet domain entity.
 *
 * Point 19.2 enriches that boundary with deterministic bulk physical
 * properties, point 19.3 adds deterministic rotation/day/axial tilt, point 19.4
 * derives one coarse physical planet type, point 19.5 adds an approximate
 * conserved internal-composition budget and point 19.6 adds reference Bond
 * albedo plus a coarse surface base. Point 19.7 adds a zero-entropy physical
 * coherence audit across type, bulk state and internal composition. Point 19.8
 * closes phase 19 with zero-entropy basic rarity diagnostics over the already
 * generated physical tails. No PlanetSeed level is introduced and all point-18
 * products remain frozen.
 */
export class PlanetGenerator {

  private constructor() {}

  static generate(
    generationKey:
      UniverseGenerationKey,

    planetarySystem:
      PlanetarySystem,

    locator:
      BodyLocator,
  ): Planet {

    if (
      generationKey
        .generatorVersion !==
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
        'PlanetGenerator requires the PlanetarySystem to share the supplied UniverseGenerationKey.',
      );
    }

    if (
      !sameSystemAddress(
        planetarySystem,
        locator,
      )
    ) {
      throw new RangeError(
        'PlanetGenerator BodyLocator must belong to the supplied PlanetarySystem.',
      );
    }

    if (
      locator.bodyIndex >=
      BigInt(
        planetarySystem
          .planetCount,
      )
    ) {
      throw new RangeError(
        `PlanetGenerator BodyLocator bodyIndex ${locator.bodyIndex} does not address an existing mature planet.`,
      );
    }

    const index =
      Number(
        locator.bodyIndex,
      );

    const slot =
      planetarySystem
        .planetSlots[index];

    if (
      !sameBodyLocator(
        slot.bodyLocator,
        locator,
      )
    ) {
      throw new RangeError(
        'PlanetGenerator must resolve the canonical point-18.2 BodyLocator for the requested planet.',
      );
    }

    const physicalProperties =
      PlanetPhysicalPropertiesGenerator
        .generate(
          generationKey,
          planetarySystem,
          slot.bodyLocator,
        );

    const rotationProperties =
      PlanetRotationPropertiesGenerator
        .generate(
          generationKey,
          planetarySystem,
          physicalProperties,
        );

    const typeClassification =
      PlanetTypeGenerator
        .generate(
          generationKey,
          planetarySystem,
          physicalProperties,
        );

    const internalComposition =
      PlanetInternalCompositionGenerator
        .generate(
          generationKey,
          planetarySystem,
          physicalProperties,
        );

    const surfaceBaseProperties =
      PlanetSurfaceBaseGenerator
        .generate(
          generationKey,
          planetarySystem,
          typeClassification,
          internalComposition,
        );

    const typePhysicalCoherenceAssessment =
      PlanetTypePhysicalCoherenceGenerator
        .generate(
          generationKey,
          physicalProperties,
          typeClassification,
          internalComposition,
        );

    const rarityAssessment =
      PlanetRarityGenerator
        .generate(
          generationKey,
          planetarySystem,
          physicalProperties,
          rotationProperties,
          typeClassification,
          internalComposition,
          surfaceBaseProperties,
          typePhysicalCoherenceAssessment,
        );

    return materializePlanet(
      planetarySystem,
      index,
      physicalProperties,
      rotationProperties,
      typeClassification,
      internalComposition,
      surfaceBaseProperties,
      typePhysicalCoherenceAssessment,
      rarityAssessment,
    );
  }

  static generateAll(
    generationKey:
      UniverseGenerationKey,

    planetarySystem:
      PlanetarySystem,
  ): readonly Planet[] {

    if (
      generationKey
        .generatorVersion !==
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
        'PlanetGenerator requires the PlanetarySystem to share the supplied UniverseGenerationKey.',
      );
    }

    const physicalProperties =
      PlanetPhysicalPropertiesGenerator
        .generateAll(
          generationKey,
          planetarySystem,
        );

    const rotationProperties =
      PlanetRotationPropertiesGenerator
        .generateAll(
          generationKey,
          planetarySystem,
          physicalProperties,
        );

    const typeClassifications =
      PlanetTypeGenerator
        .generateAll(
          generationKey,
          planetarySystem,
          physicalProperties,
        );

    const internalCompositions =
      PlanetInternalCompositionGenerator
        .generateAll(
          generationKey,
          planetarySystem,
          physicalProperties,
        );

    const surfaceBaseProperties =
      PlanetSurfaceBaseGenerator
        .generateAll(
          generationKey,
          planetarySystem,
          typeClassifications,
          internalCompositions,
        );

    const typePhysicalCoherenceAssessments =
      PlanetTypePhysicalCoherenceGenerator
        .generateAll(
          generationKey,
          physicalProperties,
          typeClassifications,
          internalCompositions,
        );

    const rarityAssessments =
      PlanetRarityGenerator
        .generateAll(
          generationKey,
          planetarySystem,
          physicalProperties,
          rotationProperties,
          typeClassifications,
          internalCompositions,
          surfaceBaseProperties,
          typePhysicalCoherenceAssessments,
        );

    return Object.freeze(
      physicalProperties
        .map(
          (
            properties,
            index,
          ) =>
            materializePlanet(
              planetarySystem,
              index,
              properties,
              rotationProperties[index],
              typeClassifications[index],
              internalCompositions[index],
              surfaceBaseProperties[index],
              typePhysicalCoherenceAssessments[index],
              rarityAssessments[index],
            ),
        ),
    );
  }
}

function materializePlanet(
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

  rarityAssessment:
    PlanetRarityAssessment,
): Planet {

  return new Planet(
    planetarySystem,
    index +
      1,
    planetarySystem
      .planetSlots[index],
    planetarySystem
      .orbits[index],
    planetarySystem
      .orbitalPeriods[index],
    planetarySystem
      .orbitHabitableZoneClassifications[index],
    planetarySystem
      .planetDesignations[index],
    physicalProperties,
    rotationProperties,
    typeClassification,
    internalComposition,
    surfaceBaseProperties,
    typePhysicalCoherenceAssessment,
    rarityAssessment,
  );
}

function sameSystemAddress(
  planetarySystem:
    PlanetarySystem,

  locator:
    BodyLocator,
): boolean {

  return (
    planetarySystem.locator.galaxyIndex ===
      locator.galaxyIndex &&
    planetarySystem.locator.sectorKey ===
      locator.sectorKey &&
    planetarySystem.locator.galacticObjectIndex ===
      locator.galacticObjectIndex
  );
}

function sameBodyLocator(
  left:
    BodyLocator,

  right:
    BodyLocator,
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
