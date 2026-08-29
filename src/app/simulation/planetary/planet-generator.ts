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
  type PlanetarySystem,
} from '../../domain/planetary/planetary-system';

/**
 * Point-19.1 deterministic Planet materializer.
 *
 * The generator addresses a planet through the canonical BodyLocator already
 * chosen by point 18.2 and binds the exact phase-18 slot/orbit/period/HZ/
 * designation projections into one Planet domain entity.
 *
 * V1 consumes zero PRNG draws and derives zero seeds. Point 19.1 therefore
 * cannot perturb any frozen procedural vector. Physical generation starts at
 * point 19.2 and must consume the existing BodySeed through independent
 * point-specific branches rather than inventing a PlanetSeed level.
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

    return new Planet(
      planetarySystem,
      index +
        1,
      slot,
      planetarySystem
        .orbits[index],
      planetarySystem
        .orbitalPeriods[index],
      planetarySystem
        .orbitHabitableZoneClassifications[index],
      planetarySystem
        .planetDesignations[index],
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

    return Object.freeze(
      planetarySystem
        .planetSlots
        .map(
          slot =>
            this.generate(
              generationKey,
              planetarySystem,
              slot.bodyLocator,
            ),
        ),
    );
  }
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
