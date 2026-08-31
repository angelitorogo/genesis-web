import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  type AsteroidBeltSystem,
} from '../../domain/planetary/asteroid-belt-system';

import {
  type CapturedExtrasolarObjectSystem,
} from '../../domain/planetary/captured-extrasolar-object-system';

import {
  type CometSystem,
} from '../../domain/planetary/comet-system';

import {
  type InterstellarObjectSystem,
} from '../../domain/planetary/interstellar-object-system';

import {
  MinorBodyDynamicsState,
} from '../../domain/planetary/minor-body-dynamics-state';

import {
  type PlanetarySystem,
} from '../../domain/planetary/planetary-system';

import {
  type TransNeptunianObjectSystem,
} from '../../domain/planetary/trans-neptunian-object-system';

/**
 * Point-23.1 coordinator for phase-23 minor-body dynamics.
 *
 * V1 initializes the dynamics boundary from the complete phase-22 Ground Truth
 * population. It intentionally consumes no discovery/catalogue state and does
 * not yet calculate any orbital evolution. Points 23.2+ enrich the returned
 * boundary with orbital normalization, crossings, resonances, perturbations,
 * encounters and impact products.
 *
 * Point 23.1 introduces zero procedural seeds, zero hashes and zero PRNG draws.
 */
export class MinorBodyDynamicsEngine {

  private constructor() {}

  static initialize(
    generationKey:
      UniverseGenerationKey,

    planetarySystem:
      PlanetarySystem,

    asteroidBeltSystem:
      AsteroidBeltSystem,

    cometSystem:
      CometSystem,

    transNeptunianObjectSystem:
      TransNeptunianObjectSystem,

    interstellarObjectSystem:
      InterstellarObjectSystem,

    capturedExtrasolarObjectSystem:
      CapturedExtrasolarObjectSystem,
  ): MinorBodyDynamicsState {
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
        planetarySystem
          .generationKey,
      )
    ) {
      throw new RangeError(
        'MinorBodyDynamicsEngine requires the host PlanetarySystem to share the supplied UniverseGenerationKey.',
      );
    }

    return new MinorBodyDynamicsState(
      planetarySystem,
      asteroidBeltSystem,
      cometSystem,
      transNeptunianObjectSystem,
      interstellarObjectSystem,
      capturedExtrasolarObjectSystem,
    );
  }
}
