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
  type PlanetarySystem,
} from './planetary-system';

/**
 * Point-22.1 root aggregate for the minor-body belt context of one mature
 * PlanetarySystem.
 *
 * This first phase-22 boundary deliberately owns only the exact host system.
 * It does not materialize inner/outer belts, statistical populations,
 * discoverable asteroids, asteroid taxonomy, comets, trans-Neptunian analogues,
 * interstellar/captured objects or discovery/catalogue state. Those products
 * remain points 22.2..22.10.
 *
 * Point 22.1 introduces no new procedural-identity level. The canonical
 * SystemLocator/SystemSeed pair identifies the parent system only and is never
 * reused as the identity of a future individual minor body.
 */
export class AsteroidBeltSystem {

  constructor(
    readonly hostPlanetarySystem:
      PlanetarySystem,
  ) {
    if (
      hostPlanetarySystem
        .seed
        .kind !==
      'system'
    ) {
      throw new RangeError(
        'AsteroidBeltSystem requires the canonical SystemSeed of its host PlanetarySystem.',
      );
    }
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

  get maturePlanetCount():
    number {

    return this
      .hostPlanetarySystem
      .planetCount;
  }
}
