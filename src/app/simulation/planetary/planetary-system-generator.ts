import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  PlanetarySystem,
} from '../../domain/planetary/planetary-system';

import {
  type PlanetarySystemFormationBlueprint,
} from '../../domain/planetary/planetary-system-formation-blueprint';

import {
  type StellarSystem,
} from '../../domain/stellar/stellar-system';

/**
 * Phase-18 deterministic planetary-system materializer.
 *
 * Point 18.1 establishes the generator boundary only. It binds the already
 * generated phase-16 stellar host to the frozen point-17.7 formation blueprint
 * and reuses the canonical SystemSeed as planetary-system identity.
 *
 * V1 consumes zero PRNG draws and derives zero additional seeds. Final planet
 * count/architecture starts at 18.2; orbital elements, periods, stability,
 * habitable-zone products and planet designations remain 18.3..18.8.
 */
export class PlanetarySystemGenerator {

  private constructor() {}

  static generate(
    generationKey:
      UniverseGenerationKey,

    stellarSystem:
      StellarSystem,

    formationBlueprint:
      PlanetarySystemFormationBlueprint,
  ): PlanetarySystem {

    if (
      generationKey
        .generatorVersion ===
      GeneratorVersion.V1
    ) {
      return this.generateV1(
        generationKey,
        stellarSystem,
        formationBlueprint,
      );
    }

    throw new RangeError(
      `Unsupported GeneratorVersion: ${generationKey.generatorVersion.code}.`,
    );
  }

  private static generateV1(
    generationKey:
      UniverseGenerationKey,

    stellarSystem:
      StellarSystem,

    formationBlueprint:
      PlanetarySystemFormationBlueprint,
  ): PlanetarySystem {

    if (
      !generationKey.equals(
        stellarSystem.generationKey,
      )
    ) {
      throw new RangeError(
        'PlanetarySystemGenerator requires the host StellarSystem to share the supplied UniverseGenerationKey.',
      );
    }

    return new PlanetarySystem(
      stellarSystem,
      formationBlueprint,
    );
  }
}
