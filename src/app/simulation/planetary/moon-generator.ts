import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  MoonSystem,
} from '../../domain/planetary/moon-system';

import {
  type Planet,
} from '../../domain/planetary/planet';

import {
  type PlanetarySystem,
} from '../../domain/planetary/planetary-system';

/**
 * Point-21.1 deterministic Moon-system materializer.
 *
 * V1 establishes only one MoonSystem boundary per already-materialized mature
 * Planet. It consumes zero PRNG draws, derives zero seeds and introduces no
 * MoonLocator/MoonSeed. Moon population size begins at 21.2 and individual
 * deterministic seeds/designations remain point 21.8.
 */
export class MoonGenerator {

  private constructor() {}

  static generate(
    generationKey:
      UniverseGenerationKey,

    planet:
      Planet,
  ): MoonSystem {

    assertSupportedGenerationKey(
      generationKey,
    );

    assertPlanetGenerationContext(
      generationKey,
      planet,
    );

    return new MoonSystem(
      planet,
    );
  }

  static generateAll(
    generationKey:
      UniverseGenerationKey,

    planetarySystem:
      PlanetarySystem,

    planets:
      readonly Planet[],
  ): readonly MoonSystem[] {

    assertSupportedGenerationKey(
      generationKey,
    );

    if (
      !generationKey.equals(
        planetarySystem
          .generationKey,
      )
    ) {
      throw new RangeError(
        'MoonGenerator requires the PlanetarySystem to share the supplied UniverseGenerationKey.',
      );
    }

    if (
      planets.length !==
      planetarySystem
        .planetCount
    ) {
      throw new RangeError(
        'MoonGenerator.generateAll requires exactly one point-19 Planet for every mature planet in the supplied PlanetarySystem.',
      );
    }

    return Object.freeze(
      planets.map(
        (
          planet,
          index,
        ) => {
          if (
            planet
              .hostPlanetarySystem !==
            planetarySystem
          ) {
            throw new RangeError(
              'MoonGenerator.generateAll requires every Planet to retain the exact supplied PlanetarySystem aggregate.',
            );
          }

          if (
            planet
              .planetOrdinal !==
            index +
              1
          ) {
            throw new RangeError(
              'MoonGenerator.generateAll requires Planets in frozen contiguous planetOrdinal order.',
            );
          }

          assertPlanetGenerationContext(
            generationKey,
            planet,
          );

          return new MoonSystem(
            planet,
          );
        },
      ),
    );
  }
}

function assertSupportedGenerationKey(
  generationKey:
    UniverseGenerationKey,
): void {

  if (
    generationKey
      .generatorVersion !==
    GeneratorVersion.V1
  ) {
    throw new RangeError(
      `Unsupported GeneratorVersion: ${generationKey.generatorVersion.code}.`,
    );
  }
}

function assertPlanetGenerationContext(
  generationKey:
    UniverseGenerationKey,

  planet:
    Planet,
): void {

  if (
    !generationKey.equals(
      planet
        .generationKey,
    )
  ) {
    throw new RangeError(
      'MoonGenerator requires the host Planet to share the supplied UniverseGenerationKey.',
    );
  }

  if (
    !planet
      .isTypePhysicallyCoherent
  ) {
    throw new RangeError(
      'MoonGenerator requires a point-19.7 physically coherent host Planet.',
    );
  }
}
