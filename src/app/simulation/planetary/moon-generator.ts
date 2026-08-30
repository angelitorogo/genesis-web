import {
  sha256,
} from '@noble/hashes/sha2.js';

import {
  hexToBytes,
  utf8ToBytes,
} from '@noble/hashes/utils.js';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  MoonPopulationProfile,
} from '../../domain/planetary/moon-population-profile';

import {
  MoonSystem,
} from '../../domain/planetary/moon-system';

import {
  type Planet,
} from '../../domain/planetary/planet';

import {
  PlanetType,
} from '../../domain/planetary/planet-type';

import {
  type PlanetarySystem,
} from '../../domain/planetary/planetary-system';

const V1_MOON_COUNT_BRANCH =
  utf8ToBytes(
    'GENESIS-MOON-COUNT-V1',
  );

const V1_EARTH_MASS_IN_SOLAR_MASSES =
  3.00348961491547e-6;

const V1_EARTH_RADIUS_IN_AU =
  4.26352124542639e-5;

const V1_MIN_USEFUL_HILL_RADIUS_PLANET_RADII =
  8;

const V1_FULL_CAPACITY_HILL_RADIUS_PLANET_RADII =
  1_200;

interface MoonCountTypeModelV1 {
  readonly maximumMoonCount:
    number;

  readonly baseMoonlessProbability01:
    number;

  readonly massReferenceEarth:
    number;

  readonly countBiasExponent:
    number;
}

interface MoonCountSamplesV1 {
  readonly moonless:
    number;

  readonly abundance:
    number;
}

/**
 * Phase-21 deterministic Moon-system materializer.
 *
 * Point 21.1 established one MoonSystem boundary per mature Planet. Point 21.2
 * adds only the total modeled natural-satellite count. V1 depends on the host
 * planet family, bulk mass/radius and the Hill sphere available at orbital
 * periapsis. This prevents close-in planets from receiving implausibly large
 * satellite systems while letting giant planets sustain much richer counts.
 *
 * The two count samples are read directly from a SHA-256 domain-separated hash
 * of the existing host BodySeed. V1 consumes zero PRNG draws and creates no
 * hierarchical MoonSeed/MoonLocator. Individual moon identities and seeds stay
 * reserved for point 21.8.
 */
export class MoonGenerator {

  private constructor() {}

  static generate(
    generationKey:
      UniverseGenerationKey,

    planet:
      Planet,
  ): MoonSystem {

    assertSupportedGenerationKey(
      generationKey,
    );

    assertPlanetGenerationContext(
      generationKey,
      planet,
    );

    return new MoonSystem(
      planet,
      populationProfileV1(
        planet,
      ),
    );
  }

  static generateAll(
    generationKey:
      UniverseGenerationKey,

    planetarySystem:
      PlanetarySystem,

    planets:
      readonly Planet[],
  ): readonly MoonSystem[] {

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
        'MoonGenerator requires the PlanetarySystem to share the supplied UniverseGenerationKey.',
      );
    }

    if (
      planets.length !==
      planetarySystem
        .planetCount
    ) {
      throw new RangeError(
        'MoonGenerator.generateAll requires exactly one point-19 Planet for every mature planet in the supplied PlanetarySystem.',
      );
    }

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
              'MoonGenerator.generateAll requires every Planet to retain the exact supplied PlanetarySystem aggregate.',
            );
          }

          if (
            planet
              .planetOrdinal !==
            index +
              1
          ) {
            throw new RangeError(
              'MoonGenerator.generateAll requires Planets in frozen contiguous planetOrdinal order.',
            );
          }

          assertPlanetGenerationContext(
            generationKey,
            planet,
          );

          return new MoonSystem(
            planet,
            populationProfileV1(
              planet,
            ),
          );
        },
      ),
    );
  }
}

function populationProfileV1(
  planet:
    Planet,
): MoonPopulationProfile {

  const hillSphereRadiusPlanetRadii =
    hillSphereRadiusPlanetRadiiV1(
      planet,
    );

  const satelliteCapacityIndex01 =
    satelliteCapacityIndexV1(
      hillSphereRadiusPlanetRadii,
    );

  const samples =
    countSamplesV1(
      planet,
    );

  const moonCount =
    moonCountV1(
      planet,
      satelliteCapacityIndex01,
      samples,
    );

  return new MoonPopulationProfile(
    planet
      .planetOrdinal,
    planet
      .locator,
    planet
      .seed,
    planet
      .planetType,
    planet
      .massEarth,
    planet
      .radiusEarth,
    planet
      .orbit
      .semiMajorAxisAu,
    planet
      .orbit
      .eccentricity,
    planet
      .orbitalPeriod
      .gravitatingMassSolar,
    hillSphereRadiusPlanetRadii,
    satelliteCapacityIndex01,
    moonCount,
  );
}

function hillSphereRadiusPlanetRadiiV1(
  planet:
    Planet,
): number {

  const planetMassSolar =
    planet
      .massEarth *
    V1_EARTH_MASS_IN_SOLAR_MASSES;

  const periapsisAu =
    planet
      .orbit
      .semiMajorAxisAu *
    (
      1 -
      planet
        .orbit
        .eccentricity
    );

  const hillRadiusAu =
    periapsisAu *
    (
      planetMassSolar /
      (
        3 *
        planet
          .orbitalPeriod
          .gravitatingMassSolar
      )
    ) **
      (1 / 3);

  const planetRadiusAu =
    planet
      .radiusEarth *
    V1_EARTH_RADIUS_IN_AU;

  return Math.max(
    0,
    hillRadiusAu /
      planetRadiusAu,
  );
}

function satelliteCapacityIndexV1(
  hillSphereRadiusPlanetRadii:
    number,
): number {

  if (
    hillSphereRadiusPlanetRadii <=
    V1_MIN_USEFUL_HILL_RADIUS_PLANET_RADII
  ) {
    return 0;
  }

  const logMinimum =
    Math.log10(
      V1_MIN_USEFUL_HILL_RADIUS_PLANET_RADII,
    );

  const logMaximum =
    Math.log10(
      V1_FULL_CAPACITY_HILL_RADIUS_PLANET_RADII,
    );

  return clamp01(
    (
      Math.log10(
        hillSphereRadiusPlanetRadii,
      ) -
      logMinimum
    ) /
    (
      logMaximum -
      logMinimum
    ),
  );
}

function moonCountV1(
  planet:
    Planet,

  satelliteCapacityIndex01:
    number,

  samples:
    MoonCountSamplesV1,
): number {

  if (
    satelliteCapacityIndex01 <=
    0
  ) {
    return 0;
  }

  const model =
    typeModelV1(
      planet
        .planetType,
    );

  const capacityMoonlessPenalty =
    (
      1 -
      satelliteCapacityIndex01
    ) *
    0.72;

  const moonlessProbability01 =
    clamp01(
      model
        .baseMoonlessProbability01 +
      capacityMoonlessPenalty,
    );

  if (
    samples
      .moonless <
    moonlessProbability01
  ) {
    return 0;
  }

  const massSupportIndex01 =
    clamp01(
      Math.log1p(
        planet
          .massEarth,
      ) /
      Math.log1p(
        model
          .massReferenceEarth,
      ),
    );

  const massSupportFactor =
    0.35 +
    0.65 *
      massSupportIndex01;

  const effectiveMaximum =
    Math.max(
      1,
      Math.min(
        model
          .maximumMoonCount,
        Math.floor(
          model
            .maximumMoonCount *
          satelliteCapacityIndex01 *
          massSupportFactor,
        ),
      ),
    );

  const shapedAbundance =
    samples
      .abundance **
    model
      .countBiasExponent;

  return Math.min(
    effectiveMaximum,
    1 +
      Math.floor(
        shapedAbundance *
        effectiveMaximum,
      ),
  );
}

function typeModelV1(
  planetType:
    PlanetType,
): MoonCountTypeModelV1 {

  switch (
    planetType
  ) {
    case PlanetType.ROCKY:
      return {
        maximumMoonCount:
          3,
        baseMoonlessProbability01:
          0.55,
        massReferenceEarth:
          1,
        countBiasExponent:
          1.80,
      };

    case PlanetType.SUPER_EARTH:
      return {
        maximumMoonCount:
          5,
        baseMoonlessProbability01:
          0.40,
        massReferenceEarth:
          6,
        countBiasExponent:
          1.60,
      };

    case PlanetType.DESERT:
      return {
        maximumMoonCount:
          3,
        baseMoonlessProbability01:
          0.60,
        massReferenceEarth:
          2,
        countBiasExponent:
          1.90,
      };

    case PlanetType.OCEAN:
      return {
        maximumMoonCount:
          4,
        baseMoonlessProbability01:
          0.45,
        massReferenceEarth:
          2,
        countBiasExponent:
          1.60,
      };

    case PlanetType.ICE:
      return {
        maximumMoonCount:
          6,
        baseMoonlessProbability01:
          0.35,
        massReferenceEarth:
          5,
        countBiasExponent:
          1.50,
      };

    case PlanetType.VOLCANIC:
      return {
        maximumMoonCount:
          3,
        baseMoonlessProbability01:
          0.60,
        massReferenceEarth:
          2,
        countBiasExponent:
          1.90,
      };

    case PlanetType.MINI_NEPTUNE:
      return {
        maximumMoonCount:
          16,
        baseMoonlessProbability01:
          0.20,
        massReferenceEarth:
          15,
        countBiasExponent:
          1.35,
      };

    case PlanetType.GAS_GIANT:
      return {
        maximumMoonCount:
          120,
        baseMoonlessProbability01:
          0.03,
        massReferenceEarth:
          318,
        countBiasExponent:
          1.25,
      };

    case PlanetType.ICE_GIANT:
      return {
        maximumMoonCount:
          60,
        baseMoonlessProbability01:
          0.08,
        massReferenceEarth:
          20,
        countBiasExponent:
          1.30,
      };
  }

  throw new RangeError(
    `Unsupported PlanetType for point 21.2: ${planetType}.`,
  );
}

function countSamplesV1(
  planet:
    Planet,
): MoonCountSamplesV1 {

  const digest =
    sha256
      .create()
      .update(
        V1_MOON_COUNT_BRANCH,
      )
      .update(
        hexToBytes(
          planet
            .seed
            .normalizedValue,
        ),
      )
      .digest();

  return {
    moonless:
      uint32UnitV1(
        digest,
        0,
      ),
    abundance:
      uint32UnitV1(
        digest,
        4,
      ),
  };
}

function uint32UnitV1(
  bytes:
    Uint8Array,

  offset:
    number,
): number {

  const value =
    (
      bytes[offset] *
        0x1000000 +
      bytes[offset + 1] *
        0x10000 +
      bytes[offset + 2] *
        0x100 +
      bytes[offset + 3]
    ) >>>
    0;

  return value /
    0x100000000;
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
      'MoonGenerator requires the host Planet to share the supplied UniverseGenerationKey.',
    );
  }

  if (
    !planet
      .isTypePhysicallyCoherent
  ) {
    throw new RangeError(
      'MoonGenerator requires a point-19.7 physically coherent host Planet.',
    );
  }
}

function clamp01(
  value:
    number,
): number {

  return Math.min(
    1,
    Math.max(
      0,
      value,
    ),
  );
}
