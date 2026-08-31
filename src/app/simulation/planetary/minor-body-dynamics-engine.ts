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
  type MinorBodyOrbitalElementsCatalog,
} from '../../domain/planetary/minor-body-orbital-elements-catalog';

import {
  type MinorBodyOrbitProximityCatalog,
} from '../../domain/planetary/minor-body-orbit-proximity-catalog';

import {
  type MinorBodyResonanceCatalog,
} from '../../domain/planetary/minor-body-resonance-catalog';

import {
  type MinorBodyGiantInfluenceCatalog,
} from '../../domain/planetary/minor-body-giant-influence-catalog';

import {
  type MinorBodyCloseEncounterCatalog,
} from '../../domain/planetary/minor-body-close-encounter-catalog';

import {
  type MoonSystem,
} from '../../domain/planetary/moon-system';

import {
  type Planet,
} from '../../domain/planetary/planet';

import {
  type PlanetarySystem,
} from '../../domain/planetary/planetary-system';

import {
  type TransNeptunianObjectSystem,
} from '../../domain/planetary/trans-neptunian-object-system';

import {
  MinorBodyOrbitalElementsEngine,
} from './minor-body-orbital-elements-engine';

import {
  MinorBodyOrbitProximityEngine,
} from './minor-body-orbit-proximity-engine';

import {
  MinorBodyResonanceEngine,
} from './minor-body-resonance-engine';

import {
  MinorBodyGiantInfluenceEngine,
} from './minor-body-giant-influence-engine';

import {
  MinorBodyCloseEncounterEngine,
} from './minor-body-close-encounter-engine';

/**
 * Point-23.1 coordinator for phase-23 minor-body dynamics.
 *
 * V1 initializes the dynamics boundary from the complete phase-22 Ground Truth
 * population. It intentionally consumes no discovery/catalogue state.
 * Point 23.2 exposes a normalized orbital-elements catalog without changing
 * the point-23.1 boundary or any phase-22 orbit. Point 23.3 adds a pure
 * geometry matrix against materialized planets/relevant moons. Point 23.4 now
 * adds low-order resonance candidates and simplified local chaotic zones. Point
 * 23.5 classifies giant-planet perturbation/capture/ejection potentials. Point
 * 23.6 now resolves close-encounter temporal opportunities and materializes one
 * unambiguous post-encounter orbital transition per minor body; impacts remain
 * reserved for point 23.7+.
 *
 * Point 23.1 introduces zero procedural seeds/hashes/PRNG draws. Point 23.6
 * adds one domain-separated SHA-256 temporal sample per approach candidate, but
 * still derives zero hierarchical seeds and consumes zero PRNG draws.
 */
export class MinorBodyDynamicsEngine {

  private constructor() {}

  /** Point-23.6 close-encounter resolution and post-encounter orbit transitions. */
  static closeEncounters(
    giantInfluenceCatalog:
      MinorBodyGiantInfluenceCatalog,
  ): MinorBodyCloseEncounterCatalog {
    return MinorBodyCloseEncounterEngine
      .generate(
        giantInfluenceCatalog,
      );
  }

  /** Point-23.5 giant-planet perturbation/capture/ejection potential projection. */
  static giantInfluences(
    resonanceCatalog:
      MinorBodyResonanceCatalog,
  ): MinorBodyGiantInfluenceCatalog {
    return MinorBodyGiantInfluenceEngine
      .generate(
        resonanceCatalog,
      );
  }

  /** Point-23.4 low-order resonance / simplified local-instability projection. */
  static resonances(
    orbitalCatalog:
      MinorBodyOrbitalElementsCatalog,

    proximityCatalog:
      MinorBodyOrbitProximityCatalog,
  ): MinorBodyResonanceCatalog {
    return MinorBodyResonanceEngine
      .generate(
        orbitalCatalog,
        proximityCatalog,
      );
  }

  /**
   * Point-23.3 geometry-only crossing/approach projection. Callers pass the
   * already-materialized point-19 Planets and point-21 MoonSystems so this
   * stage never re-generates target bodies or replaces their identities.
   */
  static proximities(
    orbitalCatalog:
      MinorBodyOrbitalElementsCatalog,

    planets:
      readonly Planet[],

    moonSystems:
      readonly MoonSystem[],
  ): MinorBodyOrbitProximityCatalog {
    return MinorBodyOrbitProximityEngine
      .generate(
        orbitalCatalog,
        planets,
        moonSystems,
      );
  }

  /**
   * Point-23.2 common orbital projection. Kept on the phase coordinator so
   * later dynamics stages can evolve from one stable public entry point.
   */
  static orbitalElements(
    dynamicsState:
      MinorBodyDynamicsState,
  ): MinorBodyOrbitalElementsCatalog {
    return MinorBodyOrbitalElementsEngine
      .generate(
        dynamicsState,
      );
  }

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
