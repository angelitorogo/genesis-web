import {
  sha256,
} from '@noble/hashes/sha2.js';

import {
  bytesToHex,
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
  type AsteroidBeltPopulationProfile,
} from '../../domain/planetary/asteroid-belt-population-profile';

import {
  AsteroidBeltRegion,
} from '../../domain/planetary/asteroid-belt-region';

import {
  AsteroidIdentity,
} from '../../domain/planetary/asteroid-identity';

import {
  AsteroidOrbitalElements,
} from '../../domain/planetary/asteroid-orbital-elements';

import {
  type PlanetarySystem,
} from '../../domain/planetary/planetary-system';

import {
  RelevantAsteroid,
} from '../../domain/planetary/relevant-asteroid';

const V1_ID_DOMAIN =
  utf8ToBytes(
    'GENESIS-RELEVANT-ASTEROID-ID-V1',
  );

const V1_PROPERTY_DOMAIN =
  utf8ToBytes(
    'GENESIS-RELEVANT-ASTEROID-PROPERTIES-V1',
  );

const V1_MAX_RELEVANT_ASTEROIDS_PER_BELT =
  8;

const V1_REFERENCE_RETAINED_MASS_EARTH =
  0.2;

const V1_MASS_SUPPORT_FLOOR_EARTH =
  0.001;

const V1_MIN_RELEVANT_DIAMETER_KILOMETERS =
  15;

/**
 * Point-22.3 deterministic individual-asteroid materializer.
 *
 * Only a bounded relevant sample is created from each point-22.2 statistical
 * belt. V1 derives identity and property samples directly from SystemSeed via
 * SHA-256 domain separation: zero PRNG draws and zero new hierarchical seeds.
 * Taxonomy belongs to 22.4 and discovery/catalogue state to 22.10.
 */
export class AsteroidGenerator {

  private constructor() {}

  static generate(
    generationKey:
      UniverseGenerationKey,

    planetarySystem:
      PlanetarySystem,

    populationProfiles:
      readonly AsteroidBeltPopulationProfile[],
  ): readonly RelevantAsteroid[] {

    assertContext(
      generationKey,
      planetarySystem,
      populationProfiles,
    );

    const asteroids:
      RelevantAsteroid[] =
      [];

    for (
      const profile
      of populationProfiles
    ) {
      const relevantCount =
        relevantCountV1(
          profile,
        );

      for (
        let asteroidOrdinal = 1;
        asteroidOrdinal <=
          relevantCount;
        asteroidOrdinal += 1
      ) {
        asteroids.push(
          materializeAsteroidV1(
            planetarySystem,
            profile,
            asteroidOrdinal,
          ),
        );
      }
    }

    return Object.freeze([
      ...asteroids,
    ]);
  }
}

function relevantCountV1(
  profile:
    AsteroidBeltPopulationProfile,
): number {

  if (
    !profile.exists
  ) {
    return 0;
  }

  const massSupport =
    retainedMassSupportIndex01V1(
      profile.retainedMassEarth,
    );

  const relevanceSupport =
    clamp01(
      0.75 *
        profile.populationIndex01 +
      0.25 *
        massSupport,
    );

  return clampInteger(
    1 +
      Math.floor(
        (
          V1_MAX_RELEVANT_ASTEROIDS_PER_BELT -
          1
        ) *
          relevanceSupport,
      ),
    1,
    V1_MAX_RELEVANT_ASTEROIDS_PER_BELT,
  );
}

function materializeAsteroidV1(
  planetarySystem:
    PlanetarySystem,

  profile:
    AsteroidBeltPopulationProfile,

  asteroidOrdinal:
    number,
): RelevantAsteroid {

  if (
    profile.innerEdgeAu ===
      null ||
    profile.outerEdgeAu ===
      null ||
    profile.peakAu ===
      null
  ) {
    throw new RangeError(
      'Existing point-22.2 belt profile requires complete geometry before asteroid materialization.',
    );
  }

  const identity =
    asteroidIdentityV1(
      planetarySystem,
      profile.region,
      asteroidOrdinal,
    );

  const massSupport =
    retainedMassSupportIndex01V1(
      profile.retainedMassEarth,
    );

  const diameterSupport =
    clamp01(
      0.55 *
        profile.populationIndex01 +
      0.45 *
        massSupport,
    );

  const maximumDiameterKilometers =
    120 +
    780 *
      diameterSupport;

  const rankScale =
    asteroidOrdinal **
      -0.62;

  const diameterVariation =
    0.72 +
    0.28 *
      sample01V1(
        identity.proceduralId,
        'DIAMETER',
      );

  const diameterKilometers =
    Math.max(
      V1_MIN_RELEVANT_DIAMETER_KILOMETERS,
      maximumDiameterKilometers *
        rankScale *
        diameterVariation,
    );

  const orbit =
    orbitalElementsV1(
      profile,
      identity,
    );

  return new RelevantAsteroid(
    identity,
    profile,
    diameterKilometers,
    orbit,
  );
}

function asteroidIdentityV1(
  planetarySystem:
    PlanetarySystem,

  beltRegion:
    AsteroidBeltRegion,

  asteroidOrdinal:
    number,
): AsteroidIdentity {

  const regionCode =
    beltRegion ===
      AsteroidBeltRegion.INNER
      ? 0
      : 1;

  const digest =
    sha256
      .create()
      .update(
        V1_ID_DOMAIN,
      )
      .update(
        hexToBytes(
          planetarySystem
            .seed
            .normalizedValue,
        ),
      )
      .update(
        Uint8Array.of(
          regionCode,
        ),
      )
      .update(
        uint32BigEndianBytes(
          asteroidOrdinal -
            1,
        ),
      )
      .digest();

  return new AsteroidIdentity(
    planetarySystem.locator,
    planetarySystem.seed,
    beltRegion,
    asteroidOrdinal,
    bytesToHex(
      digest.slice(
        0,
        16,
      ),
    ).toUpperCase(),
  );
}

function orbitalElementsV1(
  profile:
    AsteroidBeltPopulationProfile,

  identity:
    AsteroidIdentity,
): AsteroidOrbitalElements {

  if (
    profile.innerEdgeAu ===
      null ||
    profile.outerEdgeAu ===
      null ||
    profile.peakAu ===
      null
  ) {
    throw new RangeError(
      'Existing point-22.2 belt profile requires complete geometry.',
    );
  }

  const logInner =
    Math.log(
      profile.innerEdgeAu,
    );

  const logOuter =
    Math.log(
      profile.outerEdgeAu,
    );

  const logPeak =
    Math.log(
      profile.peakAu,
    );

  const radialSample =
    sample01V1(
      identity.proceduralId,
      'RADIAL',
    );

  const uniformLogAxis =
    logInner +
    radialSample *
      (
        logOuter -
        logInner
      );

  const semiMajorAxisAu =
    Math.exp(
      0.62 *
        uniformLogAxis +
      0.38 *
        logPeak,
    );

  const maximumGeometricEccentricity =
    Math.max(
      0,
      Math.min(
        0.24,
        0.86 *
          Math.min(
            (
              semiMajorAxisAu -
              profile.innerEdgeAu
            ) /
              semiMajorAxisAu,
            (
              profile.outerEdgeAu -
              semiMajorAxisAu
            ) /
              semiMajorAxisAu,
          ),
      ),
    );

  const eccentricity =
    maximumGeometricEccentricity *
    sample01V1(
      identity.proceduralId,
      'ECCENTRICITY',
    );

  const inclinationCeilingDegrees =
    profile.region ===
      AsteroidBeltRegion.INNER
      ? 22
      : 35;

  const inclinationDegrees =
    inclinationCeilingDegrees *
    (
      sample01V1(
        identity.proceduralId,
        'INCLINATION',
      ) **
        1.7
    );

  return new AsteroidOrbitalElements(
    profile.region,
    identity.asteroidOrdinal,
    profile.innerEdgeAu,
    profile.outerEdgeAu,
    profile.peakAu,
    semiMajorAxisAu,
    eccentricity,
    inclinationDegrees,
    360 *
      sample01V1(
        identity.proceduralId,
        'NODE',
      ),
    360 *
      sample01V1(
        identity.proceduralId,
        'PERIAPSIS',
      ),
    360 *
      sample01V1(
        identity.proceduralId,
        'MEAN_ANOMALY',
      ),
  );
}

function sample01V1(
  proceduralId:
    string,

  label:
    string,
): number {

  const digest =
    sha256
      .create()
      .update(
        V1_PROPERTY_DOMAIN,
      )
      .update(
        hexToBytes(
          proceduralId,
        ),
      )
      .update(
        utf8ToBytes(
          label,
        ),
      )
      .digest();

  const value =
    (
      digest[0] *
        0x1000000 +
      digest[1] *
        0x10000 +
      digest[2] *
        0x100 +
      digest[3]
    ) >>>
    0;

  return (
    value /
    0x100000000
  );
}

function retainedMassSupportIndex01V1(
  retainedMassEarth:
    number,
): number {

  return clamp01(
    Math.log1p(
      retainedMassEarth /
        V1_MASS_SUPPORT_FLOOR_EARTH,
    ) /
    Math.log1p(
      V1_REFERENCE_RETAINED_MASS_EARTH /
        V1_MASS_SUPPORT_FLOOR_EARTH,
    ),
  );
}

function assertContext(
  generationKey:
    UniverseGenerationKey,

  planetarySystem:
    PlanetarySystem,

  populationProfiles:
    readonly AsteroidBeltPopulationProfile[],
): void {

  if (
    generationKey.generatorVersion !==
    GeneratorVersion.V1
  ) {
    throw new RangeError(
      `Unsupported GeneratorVersion: ${generationKey.generatorVersion.code}.`,
    );
  }

  if (
    !generationKey.equals(
      planetarySystem.generationKey,
    )
  ) {
    throw new RangeError(
      'AsteroidGenerator requires the PlanetarySystem to share the supplied UniverseGenerationKey.',
    );
  }

  if (
    populationProfiles.length !==
      2 ||
    populationProfiles[0].region !==
      AsteroidBeltRegion.INNER ||
    populationProfiles[1].region !==
      AsteroidBeltRegion.OUTER
  ) {
    throw new RangeError(
      'AsteroidGenerator requires the ordered INNER/OUTER point-22.2 population profiles.',
    );
  }

  const residualDustMassEarth =
    planetarySystem
      .formationBlueprint
      .residualDustMassEarth;

  for (
    const profile
    of populationProfiles
  ) {
    if (
      profile.sourceResidualDustMassEarth !==
      residualDustMassEarth
    ) {
      throw new RangeError(
        'AsteroidGenerator population profiles must preserve the exact point-17.7 residual-dust reservoir.',
      );
    }
  }
}

function uint32BigEndianBytes(
  value:
    number,
): Uint8Array {

  if (
    !Number.isInteger(
      value,
    ) ||
    value <
      0 ||
    value >
      0xFFFFFFFF
  ) {
    throw new RangeError(
      'Asteroid identity index must fit an unsigned 32-bit integer.',
    );
  }

  return Uint8Array.of(
    value >>>
      24,
    value >>>
      16,
    value >>>
      8,
    value,
  );
}

function clampInteger(
  value:
    number,

  minimum:
    number,

  maximum:
    number,
): number {

  return Math.min(
    maximum,
    Math.max(
      minimum,
      value,
    ),
  );
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
