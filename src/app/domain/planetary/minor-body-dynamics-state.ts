import {
  type SystemLocator,
} from '../generation/procedural-locator';

import {
  type UniverseGenerationKey,
} from '../generation/universe-generation-key';

import {
  type SystemSeed,
} from '../seed/hierarchical-seeds';

import {
  type AsteroidBeltSystem,
} from './asteroid-belt-system';

import {
  type CapturedExtrasolarObjectSystem,
} from './captured-extrasolar-object-system';

import {
  type CometSystem,
} from './comet-system';

import {
  type InterstellarObjectSystem,
} from './interstellar-object-system';

import {
  MinorBodyGroundTruthInventory,
} from './minor-body-ground-truth-inventory';

import {
  type PlanetarySystem,
} from './planetary-system';

import {
  type TransNeptunianObjectSystem,
} from './trans-neptunian-object-system';

/**
 * Point-23.1 immutable dynamic boundary for one mature planetary system.
 *
 * The state deliberately contains only the complete phase-22 Ground Truth
 * minor-body inventory plus the exact source aggregates that produced it.
 * It does not yet normalize orbital elements, detect orbit crossings,
 * resonances, close encounters, giant-planet perturbations or impact risk;
 * those are points 23.2..23.13.
 *
 * Player knowledge is intentionally absent. An EXISTING but undiscovered body
 * participates in dynamics exactly like a DISCOVERED or CATALOGUED one.
 */
export class MinorBodyDynamicsState {

  readonly groundTruthInventory:
    MinorBodyGroundTruthInventory;

  constructor(
    readonly hostPlanetarySystem:
      PlanetarySystem,

    readonly asteroidBeltSystem:
      AsteroidBeltSystem,

    readonly cometSystem:
      CometSystem,

    readonly transNeptunianObjectSystem:
      TransNeptunianObjectSystem,

    readonly interstellarObjectSystem:
      InterstellarObjectSystem,

    readonly capturedExtrasolarObjectSystem:
      CapturedExtrasolarObjectSystem,
  ) {
    validateSharedHost(
      hostPlanetarySystem,
      asteroidBeltSystem.hostPlanetarySystem,
      'AsteroidBeltSystem',
    );

    validateSharedHost(
      hostPlanetarySystem,
      cometSystem.hostPlanetarySystem,
      'CometSystem',
    );

    validateSharedHost(
      hostPlanetarySystem,
      transNeptunianObjectSystem.hostPlanetarySystem,
      'TransNeptunianObjectSystem',
    );

    validateSharedHost(
      hostPlanetarySystem,
      interstellarObjectSystem.hostPlanetarySystem,
      'InterstellarObjectSystem',
    );

    validateSharedHost(
      hostPlanetarySystem,
      capturedExtrasolarObjectSystem.hostPlanetarySystem,
      'CapturedExtrasolarObjectSystem',
    );

    this.groundTruthInventory =
      new MinorBodyGroundTruthInventory(
        asteroidBeltSystem
          .relevantAsteroids,
        cometSystem
          .relevantComets,
        transNeptunianObjectSystem
          .relevantObjects,
        interstellarObjectSystem
          .relevantObjects,
        capturedExtrasolarObjectSystem
          .relevantObjects,
      );
  }

  get generationKey():
    UniverseGenerationKey {
    return this
      .hostPlanetarySystem
      .generationKey;
  }

  get systemLocator():
    SystemLocator {
    return this
      .hostPlanetarySystem
      .locator;
  }

  get systemSeed():
    SystemSeed {
    return this
      .hostPlanetarySystem
      .seed;
  }

  get existingMinorBodyCount():
    number {
    return this
      .groundTruthInventory
      .existingObjectCount;
  }

  get asteroidCount():
    number {
    return this
      .groundTruthInventory
      .asteroids
      .length;
  }

  get cometCount():
    number {
    return this
      .groundTruthInventory
      .comets
      .length;
  }

  get transNeptunianObjectCount():
    number {
    return this
      .groundTruthInventory
      .transNeptunianObjects
      .length;
  }

  get interstellarObjectCount():
    number {
    return this
      .groundTruthInventory
      .interstellarObjects
      .length;
  }

  get capturedExtrasolarObjectCount():
    number {
    return this
      .groundTruthInventory
      .capturedExtrasolarObjects
      .length;
  }

  /**
   * Bound bodies at the phase-23.1 boundary. The only explicitly unbound
   * phase-22 family is INTERSTELLAR_OBJECT (22.8).
   */
  get boundMinorBodyCount():
    number {
    return (
      this.existingMinorBodyCount -
      this.interstellarObjectCount
    );
  }

  get unboundMinorBodyCount():
    number {
    return this
      .interstellarObjectCount;
  }

  get hasMinorBodies():
    boolean {
    return (
      this.existingMinorBodyCount >
      0
    );
  }
}

function validateSharedHost(
  expected:
    PlanetarySystem,

  actual:
    PlanetarySystem,

  sourceName:
    string,
): void {
  if (
    actual !==
    expected
  ) {
    throw new RangeError(
      `MinorBodyDynamicsState requires ${sourceName} to reference the exact host PlanetarySystem instance.`,
    );
  }
}
