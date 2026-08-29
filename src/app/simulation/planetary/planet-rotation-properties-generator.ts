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
  type BodySeed,
} from '../../domain/seed/hierarchical-seeds';

import {
  type PlanetPhysicalProperties,
} from '../../domain/planetary/planet-physical-properties';

import {
  apparentSolarDayHours,
  PlanetRotationProperties,
} from '../../domain/planetary/planet-rotation-properties';

import {
  type PlanetaryArchitectureSlot,
} from '../../domain/planetary/planetary-architecture-slot';

import {
  type PlanetarySystem,
} from '../../domain/planetary/planetary-system';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  Sfc64Random,
} from '../random/sfc64-random';

const V1_PLANET_SPIN_BRANCH =
  utf8ToBytes(
    'GENESIS-PLANET-ROTATION-SPIN-V1',
  );

const V1_PLANET_OBLIQUITY_BRANCH =
  utf8ToBytes(
    'GENESIS-PLANET-ROTATION-OBLIQUITY-V1',
  );

const V1_GRAVITATIONAL_CONSTANT_SI =
  6.67430e-11;

const V1_SECONDS_PER_HOUR =
  3_600;

const V1_GRAMS_PER_CUBIC_CENTIMETER_TO_KILOGRAMS_PER_CUBIC_METER =
  1_000;

const V1_BREAKUP_SAFETY_FACTOR =
  1.15;

const V1_FREE_SPIN_REFERENCE_MIN_HOURS =
  4;

const V1_FREE_SPIN_REFERENCE_MAX_HOURS =
  240;

const V1_FREE_SPIN_HARD_MAX_HOURS =
  1_440;

const V1_SYNCHRONIZATION_FORCING_THRESHOLD =
  700;

const V1_TIDAL_BRAKING_START_FORCING =
  20;

const V1_TIDAL_BRAKING_FULL_FORCING =
  700;

const V1_SYNCHRONIZATION_MAX_ECCENTRICITY =
  0.12;

const V1_SYNCHRONIZED_MAX_AXIAL_TILT_DEGREES =
  2;

/**
 * Point-19.3 deterministic spin/solar-day/obliquity generator.
 *
 * V1 consumes two independent branches of the existing BodySeed and never
 * changes point-18 orbital geometry or point-19.2 bulk physics. The free-spin
 * floor is tied to the density-dependent rotational breakup limit. Strong,
 * low-eccentricity stellar tides may synchronize close planets; weaker tides
 * only brake the free spin toward the frozen point-18.4 orbital period.
 *
 * This is intentionally a coarse rotational model rather than a full tidal
 * evolution integrator. Resonant spin states, atmospheric thermal tides,
 * satellite torques and long-term obliquity chaos remain outside point 19.3.
 */
export class PlanetRotationPropertiesGenerator {

  private constructor() {}

  static generate(
    generationKey:
      UniverseGenerationKey,

    planetarySystem:
      PlanetarySystem,

    physicalProperties:
      PlanetPhysicalProperties,
  ): PlanetRotationProperties {

    assertGenerationContext(
      generationKey,
      planetarySystem,
    );

    const index =
      validatePhysicalPropertiesIdentity(
        planetarySystem,
        physicalProperties,
      );

    return generateRotationV1(
      planetarySystem,
      index,
      physicalProperties,
    );
  }

  static generateAll(
    generationKey:
      UniverseGenerationKey,

    planetarySystem:
      PlanetarySystem,

    physicalProperties:
      readonly PlanetPhysicalProperties[],
  ): readonly PlanetRotationProperties[] {

    assertGenerationContext(
      generationKey,
      planetarySystem,
    );

    if (
      physicalProperties.length !==
      planetarySystem.planetCount
    ) {
      throw new RangeError(
        'PlanetRotationPropertiesGenerator requires exactly one point-19.2 physical state for every mature planet.',
      );
    }

    return Object.freeze(
      physicalProperties.map(
        (
          properties,
          index,
        ) => {
          const resolvedIndex =
            validatePhysicalPropertiesIdentity(
              planetarySystem,
              properties,
            );

          if (
            resolvedIndex !==
            index
          ) {
            throw new RangeError(
              'Point-19.2 physical states must be supplied in frozen planetOrdinal order.',
            );
          }

          return generateRotationV1(
            planetarySystem,
            index,
            properties,
          );
        },
      ),
    );
  }
}

function assertGenerationContext(
  generationKey:
    UniverseGenerationKey,

  planetarySystem:
    PlanetarySystem,
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

  if (
    !generationKey.equals(
      planetarySystem.generationKey,
    )
  ) {
    throw new RangeError(
      'PlanetRotationPropertiesGenerator requires the PlanetarySystem to share the supplied UniverseGenerationKey.',
    );
  }
}

function validatePhysicalPropertiesIdentity(
  planetarySystem:
    PlanetarySystem,

  physicalProperties:
    PlanetPhysicalProperties,
): number {

  const index =
    physicalProperties
      .planetOrdinal -
    1;

  if (
    !Number.isInteger(
      index,
    ) ||
    index <
      0 ||
    index >=
      planetarySystem.planetCount
  ) {
    throw new RangeError(
      'Point-19.2 physical properties must address an existing mature planet.',
    );
  }

  const slot =
    planetarySystem
      .planetSlots[index];

  if (
    slot.planetOrdinal !==
      physicalProperties.planetOrdinal ||
    !sameBodyLocator(
      slot.bodyLocator,
      physicalProperties.bodyLocator,
    ) ||
    slot.bodySeed.normalizedValue !==
      physicalProperties.bodySeed.normalizedValue
  ) {
    throw new RangeError(
      'Point-19.3 rotation generation must preserve the exact point-18/19.2 BodyLocator and BodySeed identity.',
    );
  }

  return index;
}

function generateRotationV1(
  planetarySystem:
    PlanetarySystem,

  index:
    number,

  physicalProperties:
    PlanetPhysicalProperties,
): PlanetRotationProperties {

  const slot =
    planetarySystem
      .planetSlots[index];

  const orbit =
    planetarySystem
      .orbits[index];

  const orbitalPeriod =
    planetarySystem
      .orbitalPeriods[index];

  const sourceOrbitalPeriodHours =
    orbitalPeriod
      .periodDays *
    24;

  const minimumSafeRotationPeriodHours =
    breakupSafeRotationPeriodHoursV1(
      physicalProperties
        .densityGramsPerCubicCentimeter,
    );

  const tidalForcing =
    tidalForcingProxyV1(
      orbitalPeriod
        .gravitatingMassSolar,
      orbit
        .semiMajorAxisAu,
      physicalProperties,
    );

  const canSynchronize =
    tidalForcing >=
      V1_SYNCHRONIZATION_FORCING_THRESHOLD &&
    orbit.eccentricity <=
      V1_SYNCHRONIZATION_MAX_ECCENTRICITY &&
    sourceOrbitalPeriodHours >=
      minimumSafeRotationPeriodHours;

  const spinRandom =
    randomForBodyBranchV1(
      physicalProperties.bodySeed,
      V1_PLANET_SPIN_BRANCH,
    );

  const freeRotationPeriodHours =
    freeRotationPeriodHoursV1(
      slot,
      physicalProperties,
      minimumSafeRotationPeriodHours,
      spinRandom,
    );

  const rotationPeriodHours =
    canSynchronize
      ? sourceOrbitalPeriodHours
      : tidallyBrakedRotationPeriodHoursV1(
          freeRotationPeriodHours,
          sourceOrbitalPeriodHours,
          minimumSafeRotationPeriodHours,
          tidalForcing,
        );

  const obliquityRandom =
    randomForBodyBranchV1(
      physicalProperties.bodySeed,
      V1_PLANET_OBLIQUITY_BRANCH,
    );

  const axialTiltDegrees =
    axialTiltDegreesV1(
      slot,
      canSynchronize,
      obliquityRandom,
    );

  const dayLengthHours =
    apparentSolarDayHours(
      rotationPeriodHours,
      sourceOrbitalPeriodHours,
      axialTiltDegrees >
        90,
    );

  return new PlanetRotationProperties(
    physicalProperties.planetOrdinal,
    physicalProperties.bodyLocator,
    physicalProperties.bodySeed,
    sourceOrbitalPeriodHours,
    rotationPeriodHours,
    dayLengthHours,
    axialTiltDegrees,
  );
}

function breakupSafeRotationPeriodHoursV1(
  densityGramsPerCubicCentimeter:
    number,
): number {

  const densityKilogramsPerCubicMeter =
    densityGramsPerCubicCentimeter *
    V1_GRAMS_PER_CUBIC_CENTIMETER_TO_KILOGRAMS_PER_CUBIC_METER;

  const breakupPeriodSeconds =
    Math.sqrt(
      3 *
      Math.PI /
      (
        V1_GRAVITATIONAL_CONSTANT_SI *
        densityKilogramsPerCubicMeter
      ),
    );

  return (
    breakupPeriodSeconds /
    V1_SECONDS_PER_HOUR *
    V1_BREAKUP_SAFETY_FACTOR
  );
}

function tidalForcingProxyV1(
  gravitatingMassSolar:
    number,

  semiMajorAxisAu:
    number,

  physicalProperties:
    PlanetPhysicalProperties,
): number {

  return (
    gravitatingMassSolar **
      2 *
    physicalProperties
      .radiusEarth **
      5 /
    (
      physicalProperties
        .massEarth *
      semiMajorAxisAu **
        6
    )
  );
}

function freeRotationPeriodHoursV1(
  slot:
    PlanetaryArchitectureSlot,

  physicalProperties:
    PlanetPhysicalProperties,

  minimumSafeRotationPeriodHours:
    number,

  random:
    Sfc64Random,
): number {

  const logarithmicDraw =
    random.nextDouble();

  const scatterDraw =
    random.nextDouble();

  const referencePeriodHours =
    logarithmicLerp(
      V1_FREE_SPIN_REFERENCE_MIN_HOURS,
      V1_FREE_SPIN_REFERENCE_MAX_HOURS,
      logarithmicDraw,
    );

  const massFactor =
    clamp(
      physicalProperties
        .massEarth **
        -0.08,
      0.68,
      1.35,
    );

  const envelopeFactor =
    lerp(
      1,
      0.62,
      Math.sqrt(
        physicalProperties
          .envelopeMassFraction01,
      ),
    );

  const dynamicalFactor =
    lerp(
      1.12,
      0.82,
      slot
        .inheritedDynamicalExcitationIndex01,
    );

  const scatterFactor =
    lerp(
      0.76,
      1.34,
      scatterDraw,
    );

  return clamp(
    referencePeriodHours *
      massFactor *
      envelopeFactor *
      dynamicalFactor *
      scatterFactor,
    minimumSafeRotationPeriodHours,
    Math.max(
      minimumSafeRotationPeriodHours,
      V1_FREE_SPIN_HARD_MAX_HOURS,
    ),
  );
}

function tidallyBrakedRotationPeriodHoursV1(
  freeRotationPeriodHours:
    number,

  orbitalPeriodHours:
    number,

  minimumSafeRotationPeriodHours:
    number,

  tidalForcing:
    number,
): number {

  if (
    tidalForcing <=
    V1_TIDAL_BRAKING_START_FORCING
  ) {
    return freeRotationPeriodHours;
  }

  const braking01 =
    clamp(
      (
        Math.log10(
          tidalForcing,
        ) -
        Math.log10(
          V1_TIDAL_BRAKING_START_FORCING,
        )
      ) /
      (
        Math.log10(
          V1_TIDAL_BRAKING_FULL_FORCING,
        ) -
        Math.log10(
          V1_TIDAL_BRAKING_START_FORCING,
        )
      ),
      0,
      1,
    );

  const maximumBrakeFraction =
    0.92;

  const target =
    lerp(
      freeRotationPeriodHours,
      orbitalPeriodHours,
      braking01 *
        maximumBrakeFraction,
    );

  return Math.max(
    minimumSafeRotationPeriodHours,
    target,
  );
}

function axialTiltDegreesV1(
  slot:
    PlanetaryArchitectureSlot,

  isSynchronized:
    boolean,

  random:
    Sfc64Random,
): number {

  if (
    isSynchronized
  ) {
    return (
      V1_SYNCHRONIZED_MAX_AXIAL_TILT_DEGREES *
      random.nextDouble() **
        2
    );
  }

  const collisionExcitation =
    clamp(
      slot.phase17CollisionCount *
        0.16 +
      slot.phase18ConsolidationCount *
        0.12,
      0,
      1,
    );

  const excitation =
    clamp(
      0.72 *
        slot
          .inheritedDynamicalExcitationIndex01 +
      0.28 *
        collisionExcitation,
      0,
      1,
    );

  const branchDraw =
    random.nextDouble();

  const magnitudeDraw =
    random.nextDouble();

  const retrogradeProbability =
    0.01 +
    0.20 *
      excitation;

  if (
    branchDraw <
    retrogradeProbability
  ) {
    return 90 +
      90 *
        Math.sqrt(
          magnitudeDraw,
        );
  }

  const maximumProgradeTiltDegrees =
    8 +
    74 *
      excitation;

  return (
    maximumProgradeTiltDegrees *
    magnitudeDraw **
      2
  );
}

function randomForBodyBranchV1(
  bodySeed:
    BodySeed,

  branch:
    Uint8Array,
): Sfc64Random {

  const digest =
    sha256
      .create()
      .update(
        branch,
      )
      .update(
        hexToBytes(
          bodySeed
            .normalizedValue,
        ),
      )
      .digest();

  const normalized =
    bytesToHex(
      digest.slice(
        0,
        16,
      ),
    )
      .toUpperCase();

  return new Sfc64Random(
    universeSeedFromNormalized128(
      normalized,
    ),
  );
}

function universeSeedFromNormalized128(
  normalized:
    string,
): UniverseSeed {

  const canonical =
    normalized
      .match(
        /.{4}/gu,
      )
      ?.join(
        '-',
      );

  if (
    canonical ===
    undefined
  ) {
    throw new RangeError(
      `Cannot format normalized 128-bit seed: ${normalized}.`,
    );
  }

  return UniverseSeed.parse(
    canonical,
  );
}

function sameBodyLocator(
  left:
    PlanetPhysicalProperties['bodyLocator'],

  right:
    PlanetaryArchitectureSlot['bodyLocator'],
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

function logarithmicLerp(
  minimum:
    number,

  maximum:
    number,

  t:
    number,
): number {

  return Math.exp(
    lerp(
      Math.log(
        minimum,
      ),
      Math.log(
        maximum,
      ),
      t,
    ),
  );
}

function lerp(
  minimum:
    number,

  maximum:
    number,

  t:
    number,
): number {

  return minimum +
    (
      maximum -
      minimum
    ) *
    t;
}

function clamp(
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
