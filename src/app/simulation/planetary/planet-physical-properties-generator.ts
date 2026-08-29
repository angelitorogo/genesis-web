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
  type BodyLocator,
} from '../../domain/generation/procedural-locator';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  type BodySeed,
} from '../../domain/seed/hierarchical-seeds';

import {
  type PlanetaryArchitectureSlot,
} from '../../domain/planetary/planetary-architecture-slot';

import {
  PLANET_V1_EARTH_MEAN_DENSITY_GRAMS_PER_CUBIC_CENTIMETER,
  PLANET_V1_EARTH_SURFACE_GRAVITY_METERS_PER_SECOND_SQUARED,
  PlanetPhysicalProperties,
} from '../../domain/planetary/planet-physical-properties';

import {
  type PlanetarySystem,
} from '../../domain/planetary/planetary-system';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  Sfc64Random,
} from '../random/sfc64-random';

const V1_PLANET_MASS_BRANCH =
  utf8ToBytes(
    'GENESIS-PLANET-PHYSICAL-MASS-V1',
  );

const V1_PLANET_BULK_BRANCH =
  utf8ToBytes(
    'GENESIS-PLANET-PHYSICAL-BULK-V1',
  );

const V1_REFRACTORY_RICH_DENSITY_GRAMS_PER_CUBIC_CENTIMETER =
  7.2;

const V1_ROCKY_DENSITY_GRAMS_PER_CUBIC_CENTIMETER =
  5.5;

const V1_ICE_RICH_DENSITY_GRAMS_PER_CUBIC_CENTIMETER =
  3.0;

const V1_VOLATILE_RICH_DENSITY_GRAMS_PER_CUBIC_CENTIMETER =
  2.2;

const V1_MIN_MEAN_DENSITY_GRAMS_PER_CUBIC_CENTIMETER =
  0.20;

const V1_MAX_MEAN_DENSITY_GRAMS_PER_CUBIC_CENTIMETER =
  20;

const V1_ENVELOPE_DENSITY_DILUTION =
  0.82;

const V1_MIN_ENVELOPE_DENSITY_FACTOR =
  0.16;

const V1_MASS_COMPRESSION_LOG10_FACTOR =
  0.08;

const V1_BULK_DENSITY_SCATTER_MIN =
  0.94;

const V1_BULK_DENSITY_SCATTER_MAX =
  1.06;

interface EnvelopeTargetV1 {
  readonly slot:
    PlanetaryArchitectureSlot;

  readonly targetEnvelopeMassEarth:
    number;
}

/**
 * Point-19.2 deterministic bulk-physics generator.
 *
 * The frozen point-18.2 solid core is never reduced or re-randomized. V1 may add
 * a retained gas-envelope mass from the finite point-17.7
 * maxGasCaptureBudgetEarth. Every planet receives an independent BodySeed branch;
 * the complete system is then normalized against the global budget so query
 * order cannot change any mass.
 *
 * Radius is derived from total mass and one continuous bulk-density proxy based
 * on the inherited solid mixture plus envelope fraction. No point-19.4 planet
 * type or point-19.5 internal-composition class is assigned here.
 */
export class PlanetPhysicalPropertiesGenerator {

  private constructor() {}

  static generate(
    generationKey:
      UniverseGenerationKey,

    planetarySystem:
      PlanetarySystem,

    locator:
      BodyLocator,
  ): PlanetPhysicalProperties {

    assertGenerationContext(
      generationKey,
      planetarySystem,
    );

    if (
      !sameSystemAddress(
        planetarySystem,
        locator,
      )
    ) {
      throw new RangeError(
        'PlanetPhysicalPropertiesGenerator BodyLocator must belong to the supplied PlanetarySystem.',
      );
    }

    if (
      locator.bodyIndex >=
      BigInt(
        planetarySystem
          .planetCount,
      )
    ) {
      throw new RangeError(
        `PlanetPhysicalPropertiesGenerator BodyLocator bodyIndex ${locator.bodyIndex} does not address an existing mature planet.`,
      );
    }

    const properties =
      generateAllPhysicalPropertiesV1(
        planetarySystem,
      );

    return properties[
      Number(
        locator.bodyIndex,
      )
    ];
  }

  static generateAll(
    generationKey:
      UniverseGenerationKey,

    planetarySystem:
      PlanetarySystem,
  ): readonly PlanetPhysicalProperties[] {

    assertGenerationContext(
      generationKey,
      planetarySystem,
    );

    return Object.freeze(
      generateAllPhysicalPropertiesV1(
        planetarySystem,
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
      'PlanetPhysicalPropertiesGenerator requires the PlanetarySystem to share the supplied UniverseGenerationKey.',
    );
  }
}

function generateAllPhysicalPropertiesV1(
  planetarySystem:
    PlanetarySystem,
): PlanetPhysicalProperties[] {

  if (
    planetarySystem.planetCount ===
    0
  ) {
    return [];
  }

  const availableEnvelopeMassEarth =
    planetarySystem
      .formationBlueprint
      .maxGasCaptureBudgetEarth;

  const targets =
    planetarySystem
      .planetSlots
      .map(
        slot =>
          envelopeTargetV1(
            slot,
            availableEnvelopeMassEarth,
          ),
      );

  const targetEnvelopeMassEarth =
    sum(
      targets.map(
        target =>
          target.targetEnvelopeMassEarth,
      ),
    );

  const budgetScale =
    targetEnvelopeMassEarth <=
      0
      ? 0
      : Math.min(
          1,
          availableEnvelopeMassEarth /
            targetEnvelopeMassEarth,
        );

  return targets.map(
    target =>
      materializePropertiesV1(
        target.slot,
        target.targetEnvelopeMassEarth *
          budgetScale,
      ),
  );
}

function envelopeTargetV1(
  slot:
    PlanetaryArchitectureSlot,

  availableEnvelopeMassEarth:
    number,
): EnvelopeTargetV1 {

  const potential =
    slot
      .inheritedEnvelopeAcquisitionPotential01;

  if (
    potential <=
      0 ||
    availableEnvelopeMassEarth <=
      0
  ) {
    return {
      slot,
      targetEnvelopeMassEarth:
        0,
    };
  }

  const massRandom =
    randomForBodyBranchV1(
      slot.bodySeed,
      V1_PLANET_MASS_BRANCH,
    );

  /*
   * This is intentionally the same core-dependent capacity envelope used by
   * point 17.7 when it froze maxGasCaptureBudgetEarth. Point 19.2 turns that
   * maximum into actual retained mass, rather than inventing a second unrelated
   * gas reservoir.
   */
  const coreLimitedEnvelopeCapacityEarth =
    Math.min(
      availableEnvelopeMassEarth,
      slot
        .inheritedSolidCoreMassEarth *
      potential *
      (
        4 +
        45 *
          potential
      ),
    );

  const stochasticCaptureEfficiency =
    lerp(
      0.55,
      0.95,
      massRandom.nextDouble(),
    );

  const retentionEfficiency =
    lerp(
      0.65,
      1,
      slot
        .inheritedVolatileRetentionPotential01,
    );

  return {
    slot,
    targetEnvelopeMassEarth:
      coreLimitedEnvelopeCapacityEarth *
      stochasticCaptureEfficiency *
      retentionEfficiency,
  };
}

function materializePropertiesV1(
  slot:
    PlanetaryArchitectureSlot,

  accretedEnvelopeMassEarth:
    number,
): PlanetPhysicalProperties {

  const massEarth =
    slot
      .inheritedSolidCoreMassEarth +
    accretedEnvelopeMassEarth;

  const composition =
    slot
      .inheritedCompositionMixture;

  const solidDensityProxy =
    composition
      .refractoryRichFraction01 *
      V1_REFRACTORY_RICH_DENSITY_GRAMS_PER_CUBIC_CENTIMETER +
    composition
      .rockyFraction01 *
      V1_ROCKY_DENSITY_GRAMS_PER_CUBIC_CENTIMETER +
    composition
      .iceRichFraction01 *
      V1_ICE_RICH_DENSITY_GRAMS_PER_CUBIC_CENTIMETER +
    composition
      .volatileRichFraction01 *
      V1_VOLATILE_RICH_DENSITY_GRAMS_PER_CUBIC_CENTIMETER;

  const envelopeMassFraction01 =
    accretedEnvelopeMassEarth /
    massEarth;

  const envelopeDensityFactor =
    clamp(
      1 -
        V1_ENVELOPE_DENSITY_DILUTION *
          Math.sqrt(
            envelopeMassFraction01,
          ),
      V1_MIN_ENVELOPE_DENSITY_FACTOR,
      1,
    );

  const compressionFactor =
    1 +
    V1_MASS_COMPRESSION_LOG10_FACTOR *
      Math.log10(
        1 +
        massEarth,
      );

  const bulkRandom =
    randomForBodyBranchV1(
      slot.bodySeed,
      V1_PLANET_BULK_BRANCH,
    );

  const densityScatter =
    lerp(
      V1_BULK_DENSITY_SCATTER_MIN,
      V1_BULK_DENSITY_SCATTER_MAX,
      bulkRandom.nextDouble(),
    );

  const densityGramsPerCubicCentimeter =
    clamp(
      solidDensityProxy *
        envelopeDensityFactor *
        compressionFactor *
        densityScatter,
      V1_MIN_MEAN_DENSITY_GRAMS_PER_CUBIC_CENTIMETER,
      V1_MAX_MEAN_DENSITY_GRAMS_PER_CUBIC_CENTIMETER,
    );

  const radiusEarth =
    Math.cbrt(
      massEarth *
      PLANET_V1_EARTH_MEAN_DENSITY_GRAMS_PER_CUBIC_CENTIMETER /
      densityGramsPerCubicCentimeter,
    );

  const surfaceGravityEarth =
    massEarth /
    radiusEarth **
      2;

  const surfaceGravityMetersPerSecondSquared =
    surfaceGravityEarth *
    PLANET_V1_EARTH_SURFACE_GRAVITY_METERS_PER_SECOND_SQUARED;

  return new PlanetPhysicalProperties(
    slot.planetOrdinal,
    slot.bodyLocator,
    slot.bodySeed,
    slot.inheritedSolidCoreMassEarth,
    accretedEnvelopeMassEarth,
    massEarth,
    radiusEarth,
    densityGramsPerCubicCentimeter,
    surfaceGravityEarth,
    surfaceGravityMetersPerSecondSquared,
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

function sameSystemAddress(
  planetarySystem:
    PlanetarySystem,

  locator:
    BodyLocator,
): boolean {

  return (
    planetarySystem.locator.galaxyIndex ===
      locator.galaxyIndex &&
    planetarySystem.locator.sectorKey ===
      locator.sectorKey &&
    planetarySystem.locator.galacticObjectIndex ===
      locator.galacticObjectIndex
  );
}

function sum(
  values:
    readonly number[],
): number {

  return values.reduce(
    (
      total,
      value,
    ) =>
      total +
      value,
    0,
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
