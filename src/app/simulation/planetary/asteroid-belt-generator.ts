import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  AsteroidBeltSystem,
} from '../../domain/planetary/asteroid-belt-system';

import {
  type PlanetarySystem,
} from '../../domain/planetary/planetary-system';

/**
 * Point-22.1 deterministic asteroid-belt boundary materializer.
 *
 * V1 binds one AsteroidBeltSystem to an already-frozen mature PlanetarySystem.
 * No belt count, radial belt architecture, population statistics or individual
 * minor bodies are generated yet. Point 22.1 consumes zero PRNG draws and
 * derives zero new seeds; points 22.2+ own the actual minor-body products.
 */
export class AsteroidBeltGenerator {

  private constructor() {}

  static generate(
    generationKey:
      UniverseGenerationKey,

    planetarySystem:
      PlanetarySystem,
  ): AsteroidBeltSystem {

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
        'AsteroidBeltGenerator requires the PlanetarySystem to share the supplied UniverseGenerationKey.',
      );
    }

    return new AsteroidBeltSystem(
      planetarySystem,
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
