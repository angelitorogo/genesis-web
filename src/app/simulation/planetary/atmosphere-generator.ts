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

import {
  AtmosphereBulkPropertiesGenerator,
} from './atmosphere-bulk-properties-generator';

import {
  AtmosphereRetentionGenerator,
} from './atmosphere-retention-generator';

import {
  AtmosphereGreenhouseEffectGenerator,
} from './atmosphere-greenhouse-effect-generator';

/**
 * Phase-20 deterministic Atmosphere materializer.
 *
 * Point 20.1 binds the physical Planet into the atmosphere aggregate. Point
 * 20.2 delegates baseline pressure/density/gas materialization, point 20.3
 * applies deterministic retention/loss and point 20.4 derives an approximate
 * greenhouse/longwave blanketing state from the retained atmosphere. The Planet
 * BodySeed remains the canonical identity; no AtmosphereSeed is introduced.
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

    const bulkProperties =
      AtmosphereBulkPropertiesGenerator
        .generate(
          generationKey,
          planet,
        );

    const retentionState =
      AtmosphereRetentionGenerator
        .generate(
          generationKey,
          planet,
          bulkProperties,
        );

    const greenhouseEffect =
      AtmosphereGreenhouseEffectGenerator
        .generate(
          generationKey,
          planet,
          retentionState,
        );

    return new Atmosphere(
      planet,
      bulkProperties,
      retentionState,
      greenhouseEffect,
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

    const bulkProperties =
      AtmosphereBulkPropertiesGenerator
        .generateAll(
          generationKey,
          planetarySystem,
          planets,
        );

    const retentionStates =
      AtmosphereRetentionGenerator
        .generateAll(
          generationKey,
          planetarySystem,
          planets,
          bulkProperties,
        );

    const greenhouseEffects =
      AtmosphereGreenhouseEffectGenerator
        .generateAll(
          generationKey,
          planetarySystem,
          planets,
          retentionStates,
        );

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

          return new Atmosphere(
            planet,
            bulkProperties[index],
            retentionStates[index],
            greenhouseEffects[index],
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
