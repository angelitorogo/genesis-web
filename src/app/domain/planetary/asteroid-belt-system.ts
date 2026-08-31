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

const CONSISTENCY_TOLERANCE =
  1e-9;

/**
 * Phase-22 root aggregate for the minor-body belt context of one mature
 * PlanetarySystem.
 *
 * Point 22.1 established the exact host boundary. Point 22.2 now adds one
 * deterministic INNER and one OUTER statistical population profile. These
 * profiles describe existence, radial geometry and retained population mass,
 * but still do not materialize individual asteroids, taxonomy, cometary/TNO
 * populations, interstellar/captured objects or discovery/catalogue state.
 */
export class AsteroidBeltSystem {

  readonly populationProfiles:
    readonly AsteroidBeltPopulationProfile[];

  constructor(
    readonly hostPlanetarySystem:
      PlanetarySystem,

    readonly innerBelt:
      AsteroidBeltPopulationProfile,

    readonly outerBelt:
      AsteroidBeltPopulationProfile,
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
