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
  GiantMoonArchitectureEngine,
} from './giant-moon-architecture-engine';

import {
  MoonEnvironmentEngine,
} from './moon-environment-engine';

import {
  MoonHabitabilityEngine,
} from './moon-habitability-engine';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  MoonOrbitalElements,
} from '../../domain/planetary/moon-orbital-elements';

import {
  MoonPhysicalProperties,
} from '../../domain/planetary/moon-physical-properties';

import {
  MoonPopulationProfile,
} from '../../domain/planetary/moon-population-profile';

import {
  moonTidalLockingRegimeForIndex01,
  MoonTidalLockingRegime,
} from '../../domain/planetary/moon-tidal-locking-regime';

import {
  moonTidalMigrationRegimeV1,
  MoonTidalState,
  synchronousOrbitPlanetRadiiV1,
} from '../../domain/planetary/moon-tidal-state';

import {
  moonTidalRegimeForHeatingIndex01,
} from '../../domain/planetary/moon-tidal-regime';

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

import {
  RelevantMoon,
} from '../../domain/planetary/relevant-moon';

const V1_MOON_COUNT_BRANCH =
  utf8ToBytes(
    'GENESIS-MOON-COUNT-V1',
  );

const V1_RELEVANT_MOON_BRANCH =
  utf8ToBytes(
    'GENESIS-RELEVANT-MOON-PROPERTIES-V1',
  );

const V1_MOON_TIDAL_BRANCH =
  utf8ToBytes(
    'GENESIS-MOON-TIDAL-STATE-V1',
  );

const V1_EARTH_MASS_IN_SOLAR_MASSES =
  3.00348961491547e-6;

const V1_EARTH_RADIUS_IN_AU =
  4.26352124542639e-5;

const V1_EARTH_RADIUS_KILOMETERS =
  6_371;

const V1_EARTH_MASS_KILOGRAMS =
  5.9722e24;

const V1_EARTH_MEAN_DENSITY_GRAMS_PER_CUBIC_CENTIMETER =
  5.514;

const V1_GRAVITATIONAL_CONSTANT =
  6.67430e-11;

const V1_SECONDS_PER_DAY =
  86_400;

const V1_MIN_USEFUL_HILL_RADIUS_PLANET_RADII =
  8;

const V1_FULL_CAPACITY_HILL_RADIUS_PLANET_RADII =
  1_200;

const V1_PROGRADE_STABLE_HILL_FRACTION =
  0.45;


const V1_REFERENCE_MOON_MASS_EARTH =
  0.0123;

const V1_REFERENCE_MOON_RADIUS_EARTH =
  0.2727;

const V1_REFERENCE_MOON_SEMI_MAJOR_AXIS_KILOMETERS =
  384_400;

const V1_IO_HOST_MASS_EARTH =
  317.8;

const V1_IO_MOON_RADIUS_EARTH =
  0.286;

const V1_IO_ECCENTRICITY =
  0.0041;

const V1_IO_SEMI_MAJOR_AXIS_KILOMETERS =
  421_700;

const V1_MIN_PRIMORDIAL_MOON_ROTATION_HOURS =
  6;

const V1_MAX_PRIMORDIAL_MOON_ROTATION_HOURS =
  72;

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

interface RelevantMoonTypeModelV1 {
  readonly maximumRelevantMoonCount:
    number;

  readonly minimumRelevantMassFraction01:
    number;

  readonly maximumRelevantMassFraction01:
    number;

  readonly minimumDensityGramsPerCubicCentimeter:
    number;

  readonly maximumDensityGramsPerCubicCentimeter:
    number;

  readonly maximumOuterOrbitPlanetRadii:
    number;

  readonly orbitPlacementExponent:
    number;

  readonly maximumEccentricity:
    number;

  readonly maximumInclinationDegrees:
    number;
}

interface RelevantMoonSamplesV1 {
  readonly massWeight:
    number;

  readonly density:
    number;

  readonly eccentricity:
    number;

  readonly inclination:
    number;
}

/**
 * Phase-21 deterministic Moon-system materializer.
 *
 * Point 21.1 established one MoonSystem boundary per mature Planet and point
 * 21.2 added the total modeled natural-satellite count. Point 21.3 now
 * materializes only a bounded set of relevant moons with bulk mass/radius/
 * density/gravity and stable planetocentric Keplerian orbits. Point 21.4 adds
 * mature-system tidal forcing/heating, 1:1 spin-locking and first-order orbital
 * migration direction without modifying the frozen 21.3 mass/orbit products.
 * Point 21.5 adds first-order atmosphere/water/geology projections derived from
 * the same frozen moon state and host stellar-insolation reference. Point 21.6
 * adds independent surface/subsurface potential-habitability candidate scoring.
 * Point 21.7 specializes gas/ice-giant systems without changing any frozen
 * point-21.2-21.6 population, physical, orbital, tidal or environment result.
 *
 * Large minor-moon populations remain summarized by moonCount. Every relevant
 * moon is addressed only by a local moonOrdinal. All samples are read directly
 * from SHA-256 domain-separated hashes of the existing host BodySeed; V1 consumes
 * zero PRNG draws and creates no MoonSeed/MoonLocator. Point 21.8 remains the
 * owner of individual moon seeds/designations.
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

    const populationProfile =
      populationProfileV1(
        planet,
      );

    const relevantMoons =
      relevantMoonsV1(
        planet,
        populationProfile,
      );

    const giantMoonProfile =
      GiantMoonArchitectureEngine
        .generateSystemProfile(
          planet,
          populationProfile,
          relevantMoons,
        );

    return new MoonSystem(
      planet,
      populationProfile,
      relevantMoons,
      giantMoonProfile,
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

          const populationProfile =
            populationProfileV1(
              planet,
            );

          const relevantMoons =
            relevantMoonsV1(
              planet,
              populationProfile,
            );

          const giantMoonProfile =
            GiantMoonArchitectureEngine
              .generateSystemProfile(
                planet,
                populationProfile,
                relevantMoons,
              );

          return new MoonSystem(
            planet,
            populationProfile,
            relevantMoons,
            giantMoonProfile,
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

function relevantMoonsV1(
  planet:
    Planet,

  populationProfile:
    MoonPopulationProfile,
): readonly RelevantMoon[] {

  if (
    populationProfile
      .moonCount ===
    0
  ) {
    return Object.freeze([]);
  }

  const model =
    relevantMoonTypeModelV1(
      planet
        .planetType,
    );

  const relevantMoonCount =
    Math.min(
      populationProfile
        .moonCount,
      model
        .maximumRelevantMoonCount,
    );

  const hostSamples =
    relevantMoonDigestV1(
      planet,
      'host',
    );

  const massBudgetSample =
    uint32UnitV1(
      hostSamples,
      0,
    );

  const compactnessSample =
    uint32UnitV1(
      hostSamples,
      4,
    );

  const relevantMassFraction01 =
    lerp(
      model
        .minimumRelevantMassFraction01,
      model
        .maximumRelevantMassFraction01,
      massBudgetSample,
    ) *
    (
      0.55 +
      0.45 *
        populationProfile
          .satelliteCapacityIndex01
    );

  const relevantMassBudgetEarth =
    planet
      .massEarth *
    relevantMassFraction01;

  const samples =
    Array.from(
      {
        length:
          relevantMoonCount,
      },
      (
        _,
        index,
      ) =>
        relevantMoonSamplesV1(
          planet,
          index +
            1,
        ),
    );

  const rawMassWeights =
    samples.map(
      (
        sample,
        index,
      ) =>
        (
          0.35 +
          0.65 *
            sample
              .massWeight
        ) /
        (
          index +
          1
        ) **
          0.35,
    );

  const weightTotal =
    rawMassWeights.reduce(
      (
        total,
        weight,
      ) =>
        total +
        weight,
      0,
    );

  const physicalProperties =
    samples.map(
      (
        sample,
        index,
      ) => {
        const moonOrdinal =
          index +
          1;

        const massEarth =
          relevantMassBudgetEarth *
          rawMassWeights[index] /
          weightTotal;

        const density =
          lerp(
            model
              .minimumDensityGramsPerCubicCentimeter,
            model
              .maximumDensityGramsPerCubicCentimeter,
            sample
              .density,
          );

        const radiusEarth =
          (
            massEarth *
            V1_EARTH_MEAN_DENSITY_GRAMS_PER_CUBIC_CENTIMETER /
            density
          ) **
            (1 / 3);

        const surfaceGravityEarth =
          massEarth /
          radiusEarth **
            2;

        return new MoonPhysicalProperties(
          planet
            .planetOrdinal,
          moonOrdinal,
          massEarth,
          radiusEarth,
          density,
          surfaceGravityEarth,
        );
      },
    );

  const hostDensity =
    V1_EARTH_MEAN_DENSITY_GRAMS_PER_CUBIC_CENTIMETER *
    planet
      .massEarth /
    planet
      .radiusEarth **
      3;

  const rocheLimits =
    physicalProperties.map(
      physical =>
        2.44 *
        (
          hostDensity /
          physical
            .meanDensityGramsPerCubicCentimeter
        ) **
          (1 / 3),
    );

  const innerStableOrbit =
    Math.max(
      2.2,
      Math.max(
        ...rocheLimits,
      ) *
        1.05,
    );

  const outerStableOrbit =
    Math.min(
      model
        .maximumOuterOrbitPlanetRadii,
      populationProfile
        .hillSphereRadiusPlanetRadii *
        V1_PROGRADE_STABLE_HILL_FRACTION,
    );

  if (
    outerStableOrbit <=
    innerStableOrbit
  ) {
    return Object.freeze([]);
  }

  const usedOuterOrbit =
    innerStableOrbit +
    (
      outerStableOrbit -
      innerStableOrbit
    ) *
    (
      0.55 +
      0.45 *
        compactnessSample
    );

  const relevantMoons =
    physicalProperties.map(
      (
        physical,
        index,
      ) => {
        const moonOrdinal =
          index +
          1;

        const placement01 =
          (
            moonOrdinal /
            (
              relevantMoonCount +
              1
            )
          ) **
          model
            .orbitPlacementExponent;

        const semiMajorAxisPlanetRadii =
          innerStableOrbit +
          (
            usedOuterOrbit -
            innerStableOrbit
          ) *
          placement01;

        const semiMajorAxisKilometers =
          semiMajorAxisPlanetRadii *
          planet
            .radiusEarth *
          V1_EARTH_RADIUS_KILOMETERS;

        const eccentricity =
          samples[index]
            .eccentricity *
          model
            .maximumEccentricity;

        const inclinationDegrees =
          samples[index]
            .inclination *
          model
            .maximumInclinationDegrees;

        const orbitalPeriodDays =
          orbitalPeriodDaysV1(
            planet,
            physical,
            semiMajorAxisKilometers,
          );

        const orbit =
          new MoonOrbitalElements(
            planet
              .planetOrdinal,
            moonOrdinal,
            semiMajorAxisPlanetRadii,
            semiMajorAxisKilometers,
            eccentricity,
            inclinationDegrees,
            orbitalPeriodDays,
            rocheLimits[index],
            populationProfile
              .hillSphereRadiusPlanetRadii,
          );

        const tidalState =
          moonTidalStateV1(
            planet,
            physical,
            orbit,
          );

        const environmentState =
          MoonEnvironmentEngine
            .generate(
              planet,
              physical,
              tidalState,
            );

        const habitabilityState =
          MoonHabitabilityEngine
            .generate(
              environmentState,
            );

        const giantMoonState =
          GiantMoonArchitectureEngine
            .generateMoonState(
              planet,
              physical,
              orbit,
              tidalState,
              environmentState,
              habitabilityState,
            );

        return new RelevantMoon(
          planet
            .planetOrdinal,
          planet
            .locator,
          planet
            .seed,
          moonOrdinal,
          physical,
          orbit,
          tidalState,
          environmentState,
          habitabilityState,
          giantMoonState,
        );
      },
    );

  return Object.freeze(
    relevantMoons,
  );
}

function moonTidalStateV1(
  planet:
    Planet,

  physical:
    MoonPhysicalProperties,

  orbit:
    MoonOrbitalElements,
): MoonTidalState {

  const synchronousOrbitPlanetRadii =
    synchronousOrbitPlanetRadiiV1(
      planet
        .massEarth,
      planet
        .radiusEarth,
      planet
        .rotationPeriodHours,
    );

  const tidalForcingIndex01 =
    tidalForcingIndexV1(
      planet,
      physical,
      orbit,
    );

  const tidalHeatingIndex01 =
    tidalHeatingIndexV1(
      planet,
      physical,
      orbit,
    );

  const tidalLockingIndex01 =
    tidalLockingIndexV1(
      planet,
      physical,
      orbit,
    );

  const tidalLockingRegime =
    moonTidalLockingRegimeForIndex01(
      tidalLockingIndex01,
    );

  const rotationPeriodHours =
    moonRotationPeriodHoursV1(
      planet,
      orbit,
      tidalLockingIndex01,
      tidalLockingRegime,
    );

  return new MoonTidalState(
    planet
      .planetOrdinal,
    physical
      .moonOrdinal,
    planet
      .massEarth,
    planet
      .radiusEarth,
    planet
      .rotationPeriodHours,
    planet
      .isRetrogradeRotation,
    physical
      .massEarth,
    physical
      .radiusEarth,
    orbit
      .semiMajorAxisPlanetRadii,
    orbit
      .semiMajorAxisKilometers,
    orbit
      .eccentricity,
    orbit
      .orbitalPeriodDays,
    synchronousOrbitPlanetRadii,
    tidalForcingIndex01,
    tidalHeatingIndex01,
    moonTidalRegimeForHeatingIndex01(
      tidalHeatingIndex01,
    ),
    tidalLockingIndex01,
    tidalLockingRegime,
    rotationPeriodHours,
    moonTidalMigrationRegimeV1(
      planet
        .isRetrogradeRotation,
      orbit
        .semiMajorAxisPlanetRadii,
      synchronousOrbitPlanetRadii,
    ),
  );
}

function tidalForcingIndexV1(
  planet:
    Planet,

  physical:
    MoonPhysicalProperties,

  orbit:
    MoonOrbitalElements,
): number {

  const relativeForcing =
    planet
      .massEarth *
    (
      physical
        .radiusEarth /
      V1_REFERENCE_MOON_RADIUS_EARTH
    ) *
    (
      V1_REFERENCE_MOON_SEMI_MAJOR_AXIS_KILOMETERS /
      orbit
        .semiMajorAxisKilometers
    ) **
      3;

  return logarithmicIndex01(
    relativeForcing,
    -2,
    2,
  );
}

function tidalHeatingIndexV1(
  planet:
    Planet,

  physical:
    MoonPhysicalProperties,

  orbit:
    MoonOrbitalElements,
): number {

  if (
    orbit
      .eccentricity <=
    0
  ) {
    return 0;
  }

  const relativeIoHeating =
    (
      planet
        .massEarth /
      V1_IO_HOST_MASS_EARTH
    ) **
      2 *
    (
      physical
        .radiusEarth /
      V1_IO_MOON_RADIUS_EARTH
    ) **
      5 *
    (
      orbit
        .eccentricity /
      V1_IO_ECCENTRICITY
    ) **
      2 *
    (
      V1_IO_SEMI_MAJOR_AXIS_KILOMETERS /
      orbit
        .semiMajorAxisKilometers
    ) **
      6;

  return logarithmicIndex01(
    relativeIoHeating,
    -3,
    0,
  );
}

function tidalLockingIndexV1(
  planet:
    Planet,

  physical:
    MoonPhysicalProperties,

  orbit:
    MoonOrbitalElements,
): number {

  const relativeEarthMoonLocking =
    planet
      .massEarth **
      2 *
    (
      physical
        .radiusEarth /
      V1_REFERENCE_MOON_RADIUS_EARTH
    ) **
      3 *
    (
      V1_REFERENCE_MOON_MASS_EARTH /
      physical
        .massEarth
    ) *
    (
      V1_REFERENCE_MOON_SEMI_MAJOR_AXIS_KILOMETERS /
      orbit
        .semiMajorAxisKilometers
    ) **
      6;

  return logarithmicIndex01(
    relativeEarthMoonLocking,
    -3,
    1,
  );
}

function moonRotationPeriodHoursV1(
  planet:
    Planet,

  orbit:
    MoonOrbitalElements,

  tidalLockingIndex01:
    number,

  tidalLockingRegime:
    MoonTidalLockingRegime,
): number {

  const synchronousRotationPeriodHours =
    orbit
      .orbitalPeriodDays *
    24;

  if (
    tidalLockingRegime ===
    MoonTidalLockingRegime.SYNCHRONIZED
  ) {
    return synchronousRotationPeriodHours;
  }

  const digest =
    tidalDigestV1(
      planet,
      orbit
        .moonOrdinal,
    );

  const primordialSample =
    uint32UnitV1(
      digest,
      0,
    );

  const primordialRotationPeriodHours =
    V1_MIN_PRIMORDIAL_MOON_ROTATION_HOURS *
    (
      V1_MAX_PRIMORDIAL_MOON_ROTATION_HOURS /
      V1_MIN_PRIMORDIAL_MOON_ROTATION_HOURS
    ) **
      primordialSample;

  const relaxation01 =
    tidalLockingRegime ===
      MoonTidalLockingRegime.UNLOCKED
      ? 0.15 *
        tidalLockingIndex01 /
        0.20
      : 0.15 +
        0.65 *
        (
          tidalLockingIndex01 -
          0.20
        ) /
        0.30;

  const primordialFrequency =
    1 /
    primordialRotationPeriodHours;

  const synchronousFrequency =
    1 /
    synchronousRotationPeriodHours;

  const relaxedFrequency =
    lerp(
      primordialFrequency,
      synchronousFrequency,
      clamp01(
        relaxation01,
      ),
    );

  return 1 /
    relaxedFrequency;
}

function tidalDigestV1(
  planet:
    Planet,

  moonOrdinal:
    number,
): Uint8Array {

  return sha256
    .create()
    .update(
      V1_MOON_TIDAL_BRANCH,
    )
    .update(
      hexToBytes(
        planet
          .seed
          .normalizedValue,
      ),
    )
    .update(
      utf8ToBytes(
        `moon:${moonOrdinal}`,
      ),
    )
    .digest();
}

function logarithmicIndex01(
  positiveValue:
    number,

  minimumLog10:
    number,

  maximumLog10:
    number,
): number {

  if (
    !Number.isFinite(
      positiveValue,
    ) ||
    positiveValue <=
      0
  ) {
    return 0;
  }

  const logValue =
    Math.log10(
      positiveValue,
    );

  return clamp01(
    (
      logValue -
      minimumLog10
    ) /
    (
      maximumLog10 -
      minimumLog10
    ),
  );
}

function orbitalPeriodDaysV1(
  planet:
    Planet,

  physical:
    MoonPhysicalProperties,

  semiMajorAxisKilometers:
    number,
): number {

  const semiMajorAxisMeters =
    semiMajorAxisKilometers *
    1_000;

  const gravitatingMassKilograms =
    (
      planet
        .massEarth +
      physical
        .massEarth
    ) *
    V1_EARTH_MASS_KILOGRAMS;

  const orbitalPeriodSeconds =
    2 *
    Math.PI *
    Math.sqrt(
      semiMajorAxisMeters **
        3 /
      (
        V1_GRAVITATIONAL_CONSTANT *
        gravitatingMassKilograms
      ),
    );

  return orbitalPeriodSeconds /
    V1_SECONDS_PER_DAY;
}

function relevantMoonTypeModelV1(
  planetType:
    PlanetType,
): RelevantMoonTypeModelV1 {

  switch (
    planetType
  ) {
    case PlanetType.ROCKY:
      return relevantMoonTypeModel(
        3,
        0.002,
        0.020,
        2.6,
        4.2,
        120,
        0.65,
        0.10,
        18,
      );

    case PlanetType.SUPER_EARTH:
      return relevantMoonTypeModel(
        4,
        0.001,
        0.012,
        2.4,
        4.5,
        115,
        0.75,
        0.09,
        15,
      );

    case PlanetType.DESERT:
      return relevantMoonTypeModel(
        3,
        0.001,
        0.015,
        2.7,
        4.4,
        120,
        0.70,
        0.11,
        18,
      );

    case PlanetType.OCEAN:
      return relevantMoonTypeModel(
        4,
        0.0015,
        0.018,
        1.6,
        3.5,
        110,
        0.75,
        0.08,
        14,
      );

    case PlanetType.ICE:
      return relevantMoonTypeModel(
        5,
        0.001,
        0.012,
        1.1,
        2.6,
        110,
        0.90,
        0.08,
        14,
      );

    case PlanetType.VOLCANIC:
      return relevantMoonTypeModel(
        3,
        0.001,
        0.015,
        2.8,
        4.8,
        100,
        0.75,
        0.12,
        16,
      );

    case PlanetType.MINI_NEPTUNE:
      return relevantMoonTypeModel(
        6,
        0.00002,
        0.001,
        1.2,
        3.3,
        90,
        1.35,
        0.06,
        10,
      );

    case PlanetType.GAS_GIANT:
      return relevantMoonTypeModel(
        8,
        0.00002,
        0.00025,
        1.2,
        3.6,
        65,
        2.0,
        0.05,
        8,
      );

    case PlanetType.ICE_GIANT:
      return relevantMoonTypeModel(
        8,
        0.00002,
        0.00035,
        1.0,
        2.8,
        60,
        1.8,
        0.06,
        10,
      );
  }

  throw new RangeError(
    `Unsupported PlanetType for point 21.3: ${planetType}.`,
  );
}

function relevantMoonTypeModel(
  maximumRelevantMoonCount:
    number,

  minimumRelevantMassFraction01:
    number,

  maximumRelevantMassFraction01:
    number,

  minimumDensityGramsPerCubicCentimeter:
    number,

  maximumDensityGramsPerCubicCentimeter:
    number,

  maximumOuterOrbitPlanetRadii:
    number,

  orbitPlacementExponent:
    number,

  maximumEccentricity:
    number,

  maximumInclinationDegrees:
    number,
): RelevantMoonTypeModelV1 {

  return {
    maximumRelevantMoonCount,
    minimumRelevantMassFraction01,
    maximumRelevantMassFraction01,
    minimumDensityGramsPerCubicCentimeter,
    maximumDensityGramsPerCubicCentimeter,
    maximumOuterOrbitPlanetRadii,
    orbitPlacementExponent,
    maximumEccentricity,
    maximumInclinationDegrees,
  };
}

function relevantMoonSamplesV1(
  planet:
    Planet,

  moonOrdinal:
    number,
): RelevantMoonSamplesV1 {

  const digest =
    relevantMoonDigestV1(
      planet,
      `moon:${moonOrdinal}`,
    );

  return {
    massWeight:
      uint32UnitV1(
        digest,
        0,
      ),
    density:
      uint32UnitV1(
        digest,
        4,
      ),
    eccentricity:
      uint32UnitV1(
        digest,
        8,
      ),
    inclination:
      uint32UnitV1(
        digest,
        12,
      ),
  };
}

function relevantMoonDigestV1(
  planet:
    Planet,

  label:
    string,
): Uint8Array {

  return sha256
    .create()
    .update(
      V1_RELEVANT_MOON_BRANCH,
    )
    .update(
      hexToBytes(
        planet
          .seed
          .normalizedValue,
      ),
    )
    .update(
      utf8ToBytes(
        label,
      ),
    )
    .digest();
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

function lerp(
  start:
    number,

  end:
    number,

  t:
    number,
): number {

  return start +
    (
      end -
      start
    ) *
    t;
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
