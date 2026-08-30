import {
  type BodyLocator,
  type SystemLocator,
} from '../generation/procedural-locator';

import {
  type UniverseGenerationKey,
} from '../generation/universe-generation-key';

import {
  type BodySeed,
} from '../seed/hierarchical-seeds';

import {
  type Planet,
} from './planet';

import {
  type PlanetarySystem,
} from './planetary-system';

/**
 * Point-21.1 root aggregate for the natural-satellite system of one mature
 * Planet.
 *
 * This first Moon boundary deliberately owns only the exact host Planet. It
 * does not materialize a moon count, individual Moon entities, moon locators,
 * moon seeds, orbital/physical properties, tides, atmospheres, habitability or
 * designations. Those contracts belong to points 21.2..21.8.
 *
 * In particular, point 21.1 introduces no new procedural-identity level. The
 * host Planet BodyLocator/BodySeed identify the parent context only; they are
 * never reused as the identity of a future moon. Point 21.8 remains the owner
 * of deterministic moon seeds/designations.
 */
export class MoonSystem {

  constructor(
    readonly hostPlanet:
      Planet,
  ) {
    if (
      !hostPlanet
        .isTypePhysicallyCoherent
    ) {
      throw new RangeError(
        'MoonSystem requires a point-19.7 physically coherent host Planet.',
      );
    }

    if (
      !Number.isInteger(
        hostPlanet
          .planetOrdinal,
      ) ||
      hostPlanet
        .planetOrdinal <=
        0
    ) {
      throw new RangeError(
        'MoonSystem requires a positive integer host planetOrdinal.',
      );
    }

    if (
      hostPlanet
        .locator
        .bodyIndex !==
      BigInt(
        hostPlanet
          .planetOrdinal -
          1,
      )
    ) {
      throw new RangeError(
        'MoonSystem must preserve the canonical host BodyLocator belonging to planetOrdinal.',
      );
    }

    if (
      hostPlanet
        .seed
        .kind !==
      'body'
    ) {
      throw new RangeError(
        'MoonSystem requires the canonical BodySeed of its host Planet.',
      );
    }
  }

  get generationKey():
    UniverseGenerationKey {

    return this
      .hostPlanet
      .generationKey;
  }

  get hostPlanetarySystem():
    PlanetarySystem {

    return this
      .hostPlanet
      .hostPlanetarySystem;
  }

  get systemLocator():
    SystemLocator {

    return this
      .hostPlanet
      .systemLocator;
  }

  get hostPlanetOrdinal():
    number {

    return this
      .hostPlanet
      .planetOrdinal;
  }

  get hostPlanetLocator():
    BodyLocator {

    return this
      .hostPlanet
      .locator;
  }

  get hostPlanetSeed():
    BodySeed {

    return this
      .hostPlanet
      .seed;
  }
}
