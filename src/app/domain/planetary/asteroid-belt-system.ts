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
  type AsteroidBeltPopulationProfile,
} from './asteroid-belt-population-profile';

import {
  AsteroidBeltRegion,
} from './asteroid-belt-region';

import {
  type PlanetarySystem,
} from './planetary-system';

import {
  type RelevantAsteroid,
} from './relevant-asteroid';

const CONSISTENCY_TOLERANCE =
  1e-9;

/**
 * Phase-22 root aggregate for the minor-body belt context of one mature
 * PlanetarySystem.
 *
 * Point 22.1 established the exact host boundary. Point 22.2 now adds one
 * deterministic INNER and one OUTER statistical population profile. Point 22.3
 * additionally attaches a bounded set of individually relevant asteroids while
 * leaving taxonomy to 22.4 and discovery/catalogue state to 22.10. Cometary/TNO,
 * interstellar and captured populations remain later point-22 products.
 */
export class AsteroidBeltSystem {

  readonly populationProfiles:
    readonly AsteroidBeltPopulationProfile[];

  readonly relevantAsteroids:
    readonly RelevantAsteroid[];

  constructor(
    readonly hostPlanetarySystem:
      PlanetarySystem,

    readonly innerBelt:
      AsteroidBeltPopulationProfile,

    readonly outerBelt:
      AsteroidBeltPopulationProfile,

    relevantAsteroids:
      readonly RelevantAsteroid[] =
      [],
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

    if (
      innerBelt.region !==
      AsteroidBeltRegion.INNER
    ) {
      throw new RangeError(
        'AsteroidBeltSystem innerBelt must use the INNER region.',
      );
    }

    if (
      outerBelt.region !==
      AsteroidBeltRegion.OUTER
    ) {
      throw new RangeError(
        'AsteroidBeltSystem outerBelt must use the OUTER region.',
      );
    }

    const inheritedResidualDustMassEarth =
      hostPlanetarySystem
        .formationBlueprint
        .residualDustMassEarth;

    for (
      const profile
      of [
        innerBelt,
        outerBelt,
      ]
    ) {
      if (
        !approximatelyEqual(
          profile.sourceResidualDustMassEarth,
          inheritedResidualDustMassEarth,
        )
      ) {
        throw new RangeError(
          'Point-22.2 belt profiles must preserve the exact point-17.7 residual-dust reservoir.',
        );
      }
    }

    if (
      innerBelt.retainedMassEarth +
        outerBelt.retainedMassEarth -
        inheritedResidualDustMassEarth >
      CONSISTENCY_TOLERANCE
    ) {
      throw new RangeError(
        'Point-22.2 combined belt mass cannot exceed the inherited residual-dust reservoir.',
      );
    }

    this.populationProfiles =
      Object.freeze([
        innerBelt,
        outerBelt,
      ]);

    validateRelevantAsteroids(
      relevantAsteroids,
      innerBelt,
      outerBelt,
    );

    this.relevantAsteroids =
      Object.freeze([
        ...relevantAsteroids,
      ]);
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

  get innerBeltExists():
    boolean {

    return this
      .innerBelt
      .exists;
  }

  get outerBeltExists():
    boolean {

    return this
      .outerBelt
      .exists;
  }

  get beltCount():
    number {

    return this
      .populationProfiles
      .filter(
        profile =>
          profile.exists,
      )
      .length;
  }

  get hasBelts():
    boolean {

    return (
      this.beltCount >
      0
    );
  }

  get belts():
    readonly AsteroidBeltPopulationProfile[] {

    return Object.freeze(
      this
        .populationProfiles
        .filter(
          profile =>
            profile.exists,
        ),
    );
  }

  get totalRetainedBeltMassEarth():
    number {

    return this
      .innerBelt
      .retainedMassEarth +
      this
        .outerBelt
        .retainedMassEarth;
  }

  get relevantAsteroidCount():
    number {

    return this
      .relevantAsteroids
      .length;
  }

  get hasRelevantAsteroids():
    boolean {

    return (
      this.relevantAsteroidCount >
      0
    );
  }

  get innerRelevantAsteroidCount():
    number {

    return this
      .relevantAsteroids
      .filter(
        asteroid =>
          asteroid.beltRegion ===
          AsteroidBeltRegion.INNER,
      )
      .length;
  }

  get outerRelevantAsteroidCount():
    number {

    return this
      .relevantAsteroids
      .filter(
        asteroid =>
          asteroid.beltRegion ===
          AsteroidBeltRegion.OUTER,
      )
      .length;
  }
}

function validateRelevantAsteroids(
  asteroids:
    readonly RelevantAsteroid[],

  innerBelt:
    AsteroidBeltPopulationProfile,

  outerBelt:
    AsteroidBeltPopulationProfile,
): void {

  const proceduralIds =
    new Set<string>();

  let expectedInnerOrdinal =
    1;

  let expectedOuterOrdinal =
    1;

  let seenOuter =
    false;

  for (
    const asteroid
    of asteroids
  ) {
    const expectedProfile =
      asteroid.beltRegion ===
        AsteroidBeltRegion.INNER
        ? innerBelt
        : outerBelt;

    if (
      asteroid.sourceBeltProfile !==
      expectedProfile ||
      !expectedProfile.exists
    ) {
      throw new RangeError(
        'Point-22.3 relevant asteroids must preserve the exact existing point-22.2 belt profile.',
      );
    }

    if (
      asteroid.beltRegion ===
      AsteroidBeltRegion.OUTER
    ) {
      seenOuter =
        true;

      if (
        asteroid.asteroidOrdinal !==
        expectedOuterOrdinal
      ) {
        throw new RangeError(
          'OUTER relevant asteroid ordinals must be contiguous and start at 1.',
        );
      }

      expectedOuterOrdinal +=
        1;
    } else {
      if (
        seenOuter ||
        asteroid.asteroidOrdinal !==
          expectedInnerOrdinal
      ) {
        throw new RangeError(
          'INNER relevant asteroid ordinals must be contiguous, start at 1 and precede OUTER asteroids.',
        );
      }

      expectedInnerOrdinal +=
        1;
    }

    if (
      proceduralIds.has(
        asteroid.proceduralId,
      )
    ) {
      throw new RangeError(
        'Point-22.3 relevant asteroid procedural ids must be unique within the system.',
      );
    }

    proceduralIds.add(
      asteroid.proceduralId,
    );
  }
}

function approximatelyEqual(
  left:
    number,

  right:
    number,
): boolean {

  const scale =
    Math.max(
      1,
      Math.abs(
        left,
      ),
      Math.abs(
        right,
      ),
    );

  return (
    Math.abs(
      left -
      right,
    ) <=
    CONSISTENCY_TOLERANCE *
      scale
  );
}
