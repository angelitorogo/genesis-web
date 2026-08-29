import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  PlanetaryDesignation,
} from '../../domain/planetary/planetary-designation';

import {
  type PlanetarySystemArchitecture,
} from '../../domain/planetary/planetary-system-architecture';

import {
  PlanetarySystemDesignationCatalog,
} from '../../domain/planetary/planetary-system-designation-catalog';

import {
  type StellarSystem,
} from '../../domain/stellar/stellar-system';

/**
 * V1 follows the familiar exoplanet-style lowercase suffix convention while
 * deliberately assigning suffixes by the frozen GENESIS radial planetOrdinal,
 * not by discovery order. This keeps Ground Truth deterministic regardless of
 * which planet the player discovers first.
 *
 * Point 17.4 caps the current V1 candidate population at 12, so the b..z range
 * has ample headroom without inventing a second naming tier.
 */
const V1_PLANET_SUFFIXES =
  Object.freeze(
    'bcdefghijklmnopqrstuvwxyz'
      .split(''),
  );

/**
 * Point-18.8 pure designation layer over the already-frozen point-18.2 mature
 * planet identities.
 *
 * No new seed or PRNG draw is introduced. The generator reuses the point-15.6
 * system designation and each point-18.2 BodyLocator/BodySeed exactly.
 */
export class PlanetarySystemDesignationGenerator {

  private constructor() {}

  static generate(
    generationKey:
      UniverseGenerationKey,

    stellarSystem:
      StellarSystem,

    architecture:
      PlanetarySystemArchitecture,
  ): PlanetarySystemDesignationCatalog {

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
        stellarSystem.generationKey,
      )
    ) {
      throw new RangeError(
        'PlanetarySystemDesignationGenerator requires the host StellarSystem to share the supplied UniverseGenerationKey.',
      );
    }

    if (
      !sameSystemLocator(
        stellarSystem.locator,
        architecture.systemLocator,
      )
    ) {
      throw new RangeError(
        'Point-18.8 architecture must belong to the host StellarSystem locator.',
      );
    }

    if (
      architecture.planetCount >
      V1_PLANET_SUFFIXES.length
    ) {
      throw new RangeError(
        `Point-18.8 V1 supports at most ${V1_PLANET_SUFFIXES.length} lettered planet designations.`,
      );
    }

    const designations =
      architecture
        .planetSlots
        .map(
          slot =>
            new PlanetaryDesignation(
              stellarSystem.designation,
              slot.planetOrdinal,
              slot.bodyLocator,
              slot.bodySeed,
              V1_PLANET_SUFFIXES[
                slot.planetOrdinal -
                  1
              ]!,
            ),
        );

    return new PlanetarySystemDesignationCatalog(
      stellarSystem.locator,
      stellarSystem.designation,
      architecture.planetCount,
      designations,
    );
  }
}

function sameSystemLocator(
  left:
    StellarSystem['locator'],

  right:
    PlanetarySystemArchitecture['systemLocator'],
): boolean {

  return (
    left.galaxyIndex ===
      right.galaxyIndex &&
    left.sectorKey ===
      right.sectorKey &&
    left.galacticObjectIndex ===
      right.galacticObjectIndex
  );
}
