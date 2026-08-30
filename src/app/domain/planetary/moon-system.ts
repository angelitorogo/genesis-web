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
  type MoonPopulationProfile,
} from './moon-population-profile';

import {
  type Planet,
} from './planet';

import {
  type PlanetarySystem,
} from './planetary-system';

const SOURCE_TOLERANCE =
  1e-9;

/**
 * Phase-21 root aggregate for the natural-satellite system of one mature Planet.
 *
 * Point 21.1 established the exact host-Planet boundary. Point 21.2 now adds the
 * deterministic total modeled moon count and its capacity/source diagnostics,
 * while still not materializing any individual Moon identity, MoonSeed, orbit,
 * physical state, tide, atmosphere, habitability or designation.
 *
 * The host Planet BodyLocator/BodySeed remain parent context only. Point 21.8
 * remains the owner of deterministic individual moon seeds/designations.
 */
export class MoonSystem {

  constructor(
    readonly hostPlanet:
      Planet,

    readonly populationProfile:
      MoonPopulationProfile,
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

    if (
      populationProfile
        .hostPlanetOrdinal !==
        hostPlanet
          .planetOrdinal ||
      !sameBodyLocator(
        populationProfile
          .hostPlanetLocator,
        hostPlanet
          .locator,
      ) ||
      populationProfile
        .hostPlanetSeed
        .normalizedValue !==
        hostPlanet
          .seed
          .normalizedValue
    ) {
      throw new RangeError(
        'MoonSystem point-21.2 population profile must preserve the exact host Planet identity.',
      );
    }

    if (
      populationProfile
        .sourcePlanetType !==
        hostPlanet
          .planetType ||
      !approximatelyEqual(
        populationProfile
          .sourceMassEarth,
        hostPlanet
          .massEarth,
      ) ||
      !approximatelyEqual(
        populationProfile
          .sourceRadiusEarth,
        hostPlanet
          .radiusEarth,
      ) ||
      !approximatelyEqual(
        populationProfile
          .sourceSemiMajorAxisAu,
        hostPlanet
          .orbit
          .semiMajorAxisAu,
      ) ||
      !approximatelyEqual(
        populationProfile
          .sourceEccentricity,
        hostPlanet
          .orbit
          .eccentricity,
      ) ||
      !approximatelyEqual(
        populationProfile
          .sourceGravitatingMassSolar,
        hostPlanet
          .orbitalPeriod
          .gravitatingMassSolar,
      )
    ) {
      throw new RangeError(
        'MoonSystem point-21.2 population sources must preserve the exact frozen host Planet type/bulk/orbital values.',
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

  get moonCount():
    number {

    return this
      .populationProfile
      .moonCount;
  }

  get hasMoons():
    boolean {

    return this
      .populationProfile
      .hasMoons;
  }

  get satelliteCapacityIndex01():
    number {

    return this
      .populationProfile
      .satelliteCapacityIndex01;
  }

  get hillSphereRadiusPlanetRadii():
    number {

    return this
      .populationProfile
      .hillSphereRadiusPlanetRadii;
  }
}

function sameBodyLocator(
  left:
    BodyLocator,

  right:
    BodyLocator,
): boolean {

  return (
    left.galaxyIndex ===
      right.galaxyIndex &&
    left.sectorKey ===
      right.sectorKey &&
    left.galacticObjectIndex ===
      right.galacticObjectIndex &&
    left.bodyIndex ===
      right.bodyIndex
  );
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
    SOURCE_TOLERANCE *
      scale
  );
}
