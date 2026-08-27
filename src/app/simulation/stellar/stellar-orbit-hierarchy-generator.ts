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
  type SystemSeed,
} from '../../domain/seed/hierarchical-seeds';

import {
  StellarOrbitHierarchy,
  STELLAR_TRIPLE_V1_MIN_HIERARCHY_SEPARATION_RATIO,
} from '../../domain/stellar/stellar-orbit-hierarchy';

import {
  type StellarPhysicalProperties,
} from '../../domain/stellar/stellar-physical-properties';

import {
  StellarRelativeOrbit,
} from '../../domain/stellar/stellar-relative-orbit';

import {
  type StellarCompanion,
} from '../../domain/stellar/stellar-companion';

import {
  StellarSystemComponentLabel,
} from '../../domain/stellar/stellar-system-component-label';

import {
  StellarSystemMultiplicity,
} from '../../domain/stellar/stellar-system-multiplicity';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  Sfc64Random,
} from '../random/sfc64-random';

const V1_BINARY_INNER_ORBIT_BRANCH =
  utf8ToBytes(
    'GENESIS-STELLAR-BINARY-INNER-ORBIT-V1',
  );

const V1_TRIPLE_OUTER_ORBIT_BRANCH =
  utf8ToBytes(
    'GENESIS-STELLAR-TRIPLE-OUTER-ORBIT-V1',
  );

const V1_SOLAR_RADIUS_AU =
  0.004650467260962157;

const V1_MIN_BINARY_SEMI_MAJOR_AXIS_AU =
  0.02;

const V1_MAX_BINARY_SEMI_MAJOR_AXIS_AU =
  80;

const V1_MIN_REFERENCE_PERIASTRON_RADII =
  4;

const V1_MAX_INNER_ECCENTRICITY =
  0.72;

const V1_MAX_OUTER_ECCENTRICITY =
  0.60;

const V1_MIN_OUTER_SEPARATION_RATIO =
  STELLAR_TRIPLE_V1_MIN_HIERARCHY_SEPARATION_RATIO +
  1;

const V1_MAX_OUTER_SEPARATION_RATIO =
  24;

/**
 * Point-16.4 deterministic simplified orbit materializer.
 *
 * The A-B inner orbit is derived from a branch independent from component B/C
 * generation and therefore remains identical when the same system is viewed
 * as BINARY or TRIPLE. TRIPLE adds an independent outer branch for C relative
 * to the A+B barycentre and constructs it so the domain hierarchy boundary is
 * satisfied by construction.
 *
 * Periods use the V1 reference/initial stellar masses because phase 15 does not
 * define a remnant-current-mass contract. They are reference Keplerian periods,
 * not an N-body evolution model.
 */
export class StellarOrbitHierarchyGenerator {

  private constructor() {}

  static generateSingle(
    generationKey:
      UniverseGenerationKey,
  ): StellarOrbitHierarchy {

    assertSupportedVersion(
      generationKey,
    );

    return new StellarOrbitHierarchy(
      StellarSystemMultiplicity.SINGLE,
      null,
      null,
    );
  }

  static generateBinary(
    generationKey:
      UniverseGenerationKey,

    systemSeed:
      SystemSeed,

    primaryPhysicalProperties:
      StellarPhysicalProperties,

    secondaryCompanion:
      StellarCompanion,
  ): StellarOrbitHierarchy {

    assertSupportedVersion(
      generationKey,
    );

    assertComponentLabel(
      secondaryCompanion,
      StellarSystemComponentLabel.B,
      'secondaryCompanion',
    );

    const innerOrbit =
      generateInnerOrbitV1(
        systemSeed,
        primaryPhysicalProperties,
        secondaryCompanion,
      );

    return new StellarOrbitHierarchy(
      StellarSystemMultiplicity.BINARY,
      innerOrbit,
      null,
    );
  }

  static generateTriple(
    generationKey:
      UniverseGenerationKey,

    systemSeed:
      SystemSeed,

    primaryPhysicalProperties:
      StellarPhysicalProperties,

    secondaryCompanion:
      StellarCompanion,

    tertiaryCompanion:
      StellarCompanion,
  ): StellarOrbitHierarchy {

    assertSupportedVersion(
      generationKey,
    );

    assertComponentLabel(
      secondaryCompanion,
      StellarSystemComponentLabel.B,
      'secondaryCompanion',
    );

    assertComponentLabel(
      tertiaryCompanion,
      StellarSystemComponentLabel.C,
      'tertiaryCompanion',
    );

    const innerOrbit =
      generateInnerOrbitV1(
        systemSeed,
        primaryPhysicalProperties,
        secondaryCompanion,
      );

    const outerRandom =
      randomForBranchV1(
        systemSeed,
        V1_TRIPLE_OUTER_ORBIT_BRANCH,
      );

    const outerEccentricity =
      V1_MAX_OUTER_ECCENTRICITY *
      Math.sqrt(
        outerRandom.nextDouble(),
      );

    const hierarchyRatio =
      lerp(
        V1_MIN_OUTER_SEPARATION_RATIO,
        V1_MAX_OUTER_SEPARATION_RATIO,
        outerRandom.nextDouble(),
      );

    const outerPeriastronAu =
      innerOrbit
        .apoastronAu *
      hierarchyRatio;

    const outerSemiMajorAxisAu =
      outerPeriastronAu /
      (
        1 -
        outerEccentricity
      );

    const totalReferenceMassSolar =
      primaryPhysicalProperties
        .initialMassSolar +
      secondaryCompanion
        .physicalProperties
        .initialMassSolar +
      tertiaryCompanion
        .physicalProperties
        .initialMassSolar;

    const outerPeriodYears =
      keplerPeriodYearsV1(
        outerSemiMajorAxisAu,
        totalReferenceMassSolar,
      );

    return new StellarOrbitHierarchy(
      StellarSystemMultiplicity.TRIPLE,
      innerOrbit,
      new StellarRelativeOrbit(
        outerSemiMajorAxisAu,
        outerEccentricity,
        outerPeriodYears,
      ),
    );
  }
}

function generateInnerOrbitV1(
  systemSeed:
    SystemSeed,

  primaryPhysicalProperties:
    StellarPhysicalProperties,

  secondaryCompanion:
    StellarCompanion,
): StellarRelativeOrbit {

  const random =
    randomForBranchV1(
      systemSeed,
      V1_BINARY_INNER_ORBIT_BRANCH,
    );

  const eccentricity =
    V1_MAX_INNER_ECCENTRICITY *
    Math.sqrt(
      random.nextDouble(),
    );

  const referenceRadiiAu =
    (
      primaryPhysicalProperties
        .radiusSolar +
      secondaryCompanion
        .physicalProperties
        .radiusSolar
    ) *
    V1_SOLAR_RADIUS_AU;

  const minimumPeriastronAu =
    Math.max(
      V1_MIN_BINARY_SEMI_MAJOR_AXIS_AU,
      referenceRadiiAu *
        V1_MIN_REFERENCE_PERIASTRON_RADII,
    );

  const minimumSemiMajorAxisAu =
    minimumPeriastronAu /
    (
      1 -
      eccentricity
    );

  const maximumSemiMajorAxisAu =
    Math.max(
      V1_MAX_BINARY_SEMI_MAJOR_AXIS_AU,
      minimumSemiMajorAxisAu *
        1.25,
    );

  const semiMajorAxisAu =
    logUniformV1(
      minimumSemiMajorAxisAu,
      maximumSemiMajorAxisAu,
      random.nextDouble(),
    );

  const totalReferenceMassSolar =
    primaryPhysicalProperties
      .initialMassSolar +
    secondaryCompanion
      .physicalProperties
      .initialMassSolar;

  const periodYears =
    keplerPeriodYearsV1(
      semiMajorAxisAu,
      totalReferenceMassSolar,
    );

  return new StellarRelativeOrbit(
    semiMajorAxisAu,
    eccentricity,
    periodYears,
  );
}

function randomForBranchV1(
  systemSeed:
    SystemSeed,

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
          systemSeed
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

function keplerPeriodYearsV1(
  semiMajorAxisAu:
    number,

  totalReferenceMassSolar:
    number,
): number {

  return Math.sqrt(
    semiMajorAxisAu **
      3 /
    totalReferenceMassSolar,
  );
}

function logUniformV1(
  min:
    number,

  max:
    number,

  draw:
    number,
): number {

  const logMin =
    Math.log10(
      min,
    );

  const logMax =
    Math.log10(
      max,
    );

  return 10 **
    lerp(
      logMin,
      logMax,
      draw,
    );
}

function assertComponentLabel(
  companion:
    StellarCompanion,

  expected:
    StellarSystemComponentLabel,

  parameterName:
    string,
): void {

  if (
    companion
      .componentLabel !==
    expected
  ) {
    throw new RangeError(
      `${parameterName} must be stellar component ${expected.name}.`,
    );
  }
}

function assertSupportedVersion(
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

function lerp(
  min:
    number,

  max:
    number,

  t:
    number,
): number {

  return (
    min +
    (
      max -
      min
    ) *
      t
  );
}
