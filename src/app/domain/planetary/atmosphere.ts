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
  type PlanetType,
} from './planet-type';

import {
  type PlanetaryDesignation,
} from './planetary-designation';

import {
  type PlanetarySystem,
} from './planetary-system';

/**
 * Point-20.1 atmosphere aggregate boundary for one mature Planet.
 *
 * The atmosphere deliberately reuses the planet's canonical BodyLocator and
 * BodySeed. Point 20.1 introduces no AtmosphereSeed and generates no pressure,
 * density or gas inventory: those start at point 20.2. Retention/loss,
 * greenhouse forcing, climate, hydrology, geology, magnetosphere and radiation
 * remain points 20.3..20.10.
 *
 * V1 exists for every physically coherent phase-19 Planet, including worlds
 * whose later point-20.2 bulk atmosphere may resolve to a negligible/zero
 * surface pressure. Giant-planet deep envelopes also use this same boundary;
 * point 20.1 does not pretend that they possess a solid atmospheric surface.
 */
export class Atmosphere {

  constructor(
    readonly hostPlanet:
      Planet,
  ) {
    if (
      !hostPlanet
        .isTypePhysicallyCoherent
    ) {
      throw new RangeError(
        'Point-20.1 Atmosphere requires a point-19.7 physically coherent Planet.',
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
        'Point-20.1 Atmosphere requires a positive integer planetOrdinal.',
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
        'Point-20.1 Atmosphere must preserve the canonical BodyLocator belonging to planetOrdinal.',
      );
    }

    if (
      hostPlanet
        .seed
        .kind !==
      'body'
    ) {
      throw new RangeError(
        'Point-20.1 Atmosphere requires the canonical BodySeed of its host Planet.',
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

  get planetOrdinal():
    number {

    return this
      .hostPlanet
      .planetOrdinal;
  }

  get locator():
    BodyLocator {

    return this
      .hostPlanet
      .locator;
  }

  get seed():
    BodySeed {

    return this
      .hostPlanet
      .seed;
  }

  get designation():
    PlanetaryDesignation {

    return this
      .hostPlanet
      .designation;
  }

  get name():
    string {

    return this
      .hostPlanet
      .name;
  }

  get planetType():
    PlanetType {

    return this
      .hostPlanet
      .planetType;
  }

  get sourceMassEarth():
    number {

    return this
      .hostPlanet
      .massEarth;
  }

  get sourceRadiusEarth():
    number {

    return this
      .hostPlanet
      .radiusEarth;
  }

  get sourceSurfaceGravityEarth():
    number {

    return this
      .hostPlanet
      .surfaceGravityEarth;
  }

  get sourceEnvelopeMassFraction01():
    number {

    return this
      .hostPlanet
      .physicalProperties
      .envelopeMassFraction01;
  }

  get sourceReferenceMeanInsolationEarth():
    number {

    return this
      .hostPlanet
      .typeClassification
      .referenceMeanInsolationEarth;
  }

  get sourceReferenceBondAlbedo01():
    number {

    return this
      .hostPlanet
      .referenceBondAlbedo01;
  }
}
