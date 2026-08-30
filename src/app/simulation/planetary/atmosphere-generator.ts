import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  Atmosphere,
} from '../../domain/planetary/atmosphere';

import {
  type Planet,
} from '../../domain/planetary/planet';

import {
  type PlanetarySystem,
} from '../../domain/planetary/planetary-system';

/**
 * Point-20.1 deterministic Atmosphere materializer.
 *
 * V1 binds one already-generated, physically coherent phase-19 Planet into an
 * Atmosphere aggregate. It consumes zero PRNG draws, derives zero new seeds and
 * deliberately does not materialize pressure, density or gases before point
 * 20.2. BodyLocator/BodySeed remain the canonical identity throughout phase 20.
 */
export class AtmosphereGenerator {

  private constructor() {}

  static generate(
    generationKey:
      UniverseGenerationKey,

    planet:
      Planet,
  ): Atmosphere {

    assertSupportedGenerationKey(
      generationKey,
    );

    assertPlanetGenerationContext(
      generationKey,
      planet,
    );

    return new Atmosphere(
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
  ): readonly Atmosphere[] {

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
        'AtmosphereGenerator requires the PlanetarySystem to share the supplied UniverseGenerationKey.',
      );
    }

    if (
      planets.length !==
      planetarySystem
        .planetCount
    ) {
      throw new RangeError(
        'AtmosphereGenerator.generateAll requires exactly one point-19 Planet for every mature planet in the supplied PlanetarySystem.',
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
              'AtmosphereGenerator.generateAll requires every Planet to retain the exact supplied PlanetarySystem aggregate.',
            );
          }

          if (
            planet
              .planetOrdinal !==
            index +
              1
          ) {
            throw new RangeError(
              'AtmosphereGenerator.generateAll requires Planets in frozen contiguous planetOrdinal order.',
            );
          }

          return this.generate(
            generationKey,
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
      'AtmosphereGenerator requires the Planet to share the supplied UniverseGenerationKey.',
    );
  }

  if (
    !planet
      .isTypePhysicallyCoherent
  ) {
    throw new RangeError(
      'AtmosphereGenerator requires a point-19.7 physically coherent Planet.',
    );
  }
}
