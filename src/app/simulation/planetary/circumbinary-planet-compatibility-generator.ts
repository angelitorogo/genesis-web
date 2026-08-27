import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  CircumbinaryPlanetCompatibility,
  CircumbinaryPlanetCompatibilityRegime,
} from '../../domain/planetary/circumbinary-planet-compatibility';

import {
  type StellarCompanion,
} from '../../domain/stellar/stellar-companion';

import {
  type StellarOrbitHierarchy,
} from '../../domain/stellar/stellar-orbit-hierarchy';

import {
  type StellarPhysicalProperties,
} from '../../domain/stellar/stellar-physical-properties';

import {
  StellarSystemComponentLabel,
} from '../../domain/stellar/stellar-system-component-label';

import {
  StellarSystemMultiplicity,
} from '../../domain/stellar/stellar-system-multiplicity';

/**
 * Holman-Wiegert empirical fits were calibrated down to mass fraction 0.1.
 * Point 16.2 can create lighter companions, so V1 clamps only the stability
 * fit input upward to 0.1. This is conservative for both formulae used here;
 * the real generated stellar masses remain unchanged and are reported in the
 * compatibility result through their actual fractions.
 */
export const CIRCUMBINARY_V1_MIN_CALIBRATED_MASS_FRACTION =
  0.10;

export const CIRCUMBINARY_V1_MAX_CALIBRATED_MASS_FRACTION =
  0.50;

/**
 * Small deterministic buffers keep generated planets away from the empirical
 * critical boundary rather than treating the fit itself as a hard exact wall.
 */
export const CIRCUMBINARY_V1_INNER_STABILITY_BUFFER =
  1.05;

export const CIRCUMBINARY_V1_OUTER_STABILITY_BUFFER =
  0.95;

const CIRCUMBINARY_V1_MAX_CALIBRATED_ECCENTRICITY =
  0.80;

/**
 * Point-16.5 pure dynamical circumbinary compatibility calculator.
 *
 * The inner P-type critical radius follows the Holman & Wiegert (1999)
 * empirical circumbinary fit. For a hierarchical triple, the outer C orbit is
 * treated as the perturbing companion of the inner A+B barycentre and the
 * corresponding S-type fit supplies a conservative outer cutoff.
 *
 * No PRNG, seed, planet formation roll, habitability calculation or planet
 * materialization occurs here. Those separations keep the frozen 16.1..16.4
 * stellar architecture untouched and leave HZ coupling to point 16.6.
 */
export class CircumbinaryPlanetCompatibilityGenerator {

  private constructor() {}

  static generateBinary(
    generationKey:
      UniverseGenerationKey,

    orbitHierarchy:
      StellarOrbitHierarchy,

    primaryPhysicalProperties:
      StellarPhysicalProperties,

    secondaryCompanion:
      StellarCompanion,
  ): CircumbinaryPlanetCompatibility {

    assertSupportedVersion(
      generationKey,
    );

    assertHierarchy(
      orbitHierarchy,
      StellarSystemMultiplicity.BINARY,
    );

    assertCompanionLabel(
      secondaryCompanion,
      StellarSystemComponentLabel.B,
      'secondaryCompanion',
    );

    const innerOrbit =
      orbitHierarchy
        .innerOrbit!;

    assertCalibratedEccentricity(
      innerOrbit.eccentricity,
      'innerOrbit.eccentricity',
    );

    const primaryMass =
      primaryPhysicalProperties
        .initialMassSolar;

    const secondaryMass =
      secondaryCompanion
        .physicalProperties
        .initialMassSolar;

    const centralMass =
      primaryMass +
      secondaryMass;

    const binaryMassFraction =
      secondaryMass /
      centralMass;

    const effectiveMassFraction =
      calibratedMassFraction(
        binaryMassFraction,
      );

    const criticalFactor =
      pTypeCriticalFactorV1(
        innerOrbit.eccentricity,
        effectiveMassFraction,
      );

    const minimumStableSemiMajorAxisAu =
      innerOrbit
        .semiMajorAxisAu *
      criticalFactor *
      CIRCUMBINARY_V1_INNER_STABILITY_BUFFER;

    const referenceMinimumPeriodYears =
      keplerPeriodYearsV1(
        minimumStableSemiMajorAxisAu,
        centralMass,
      );

    return new CircumbinaryPlanetCompatibility(
      StellarSystemMultiplicity.BINARY,
      CircumbinaryPlanetCompatibilityRegime.OPEN_OUTER,
      minimumStableSemiMajorAxisAu,
      null,
      referenceMinimumPeriodYears,
      null,
      binaryMassFraction,
      null,
    );
  }

  static generateTriple(
    generationKey:
      UniverseGenerationKey,

    orbitHierarchy:
      StellarOrbitHierarchy,

    primaryPhysicalProperties:
      StellarPhysicalProperties,

    secondaryCompanion:
      StellarCompanion,

    tertiaryCompanion:
      StellarCompanion,
  ): CircumbinaryPlanetCompatibility {

    assertSupportedVersion(
      generationKey,
    );

    assertHierarchy(
      orbitHierarchy,
      StellarSystemMultiplicity.TRIPLE,
    );

    assertCompanionLabel(
      secondaryCompanion,
      StellarSystemComponentLabel.B,
      'secondaryCompanion',
    );

    assertCompanionLabel(
      tertiaryCompanion,
      StellarSystemComponentLabel.C,
      'tertiaryCompanion',
    );

    const innerOrbit =
      orbitHierarchy
        .innerOrbit!;

    const outerOrbit =
      orbitHierarchy
        .outerOrbit!;

    assertCalibratedEccentricity(
      innerOrbit.eccentricity,
      'innerOrbit.eccentricity',
    );

    assertCalibratedEccentricity(
      outerOrbit.eccentricity,
      'outerOrbit.eccentricity',
    );

    const primaryMass =
      primaryPhysicalProperties
        .initialMassSolar;

    const secondaryMass =
      secondaryCompanion
        .physicalProperties
        .initialMassSolar;

    const tertiaryMass =
      tertiaryCompanion
        .physicalProperties
        .initialMassSolar;

    const centralMass =
      primaryMass +
      secondaryMass;

    const totalMass =
      centralMass +
      tertiaryMass;

    const binaryMassFraction =
      secondaryMass /
      centralMass;

    const effectiveBinaryMassFraction =
      calibratedMassFraction(
        binaryMassFraction,
      );

    const pTypeCriticalFactor =
      pTypeCriticalFactorV1(
        innerOrbit.eccentricity,
        effectiveBinaryMassFraction,
      );

    const minimumStableSemiMajorAxisAu =
      innerOrbit
        .semiMajorAxisAu *
      pTypeCriticalFactor *
      CIRCUMBINARY_V1_INNER_STABILITY_BUFFER;

    const tertiaryMassFraction =
      tertiaryMass /
      totalMass;

    const effectiveTertiaryMassFraction =
      calibratedMassFraction(
        tertiaryMassFraction,
      );

    const sTypeCriticalFactor =
      sTypeCriticalFactorV1(
        outerOrbit.eccentricity,
        effectiveTertiaryMassFraction,
      );

    const maximumStableSemiMajorAxisAu =
      outerOrbit
        .semiMajorAxisAu *
      sTypeCriticalFactor *
      CIRCUMBINARY_V1_OUTER_STABILITY_BUFFER;

    const referenceMinimumPeriodYears =
      keplerPeriodYearsV1(
        minimumStableSemiMajorAxisAu,
        centralMass,
      );

    const referenceMaximumPeriodYears =
      keplerPeriodYearsV1(
        maximumStableSemiMajorAxisAu,
        centralMass,
      );

    const regime =
      maximumStableSemiMajorAxisAu >
        minimumStableSemiMajorAxisAu
        ? CircumbinaryPlanetCompatibilityRegime.TERTIARY_BOUNDED
        : CircumbinaryPlanetCompatibilityRegime.DYNAMICALLY_EXCLUDED;

    return new CircumbinaryPlanetCompatibility(
      StellarSystemMultiplicity.TRIPLE,
      regime,
      minimumStableSemiMajorAxisAu,
      maximumStableSemiMajorAxisAu,
      referenceMinimumPeriodYears,
      referenceMaximumPeriodYears,
      binaryMassFraction,
      tertiaryMassFraction,
    );
  }
}

function pTypeCriticalFactorV1(
  eccentricity:
    number,

  massFraction:
    number,
): number {

  const e2 =
    eccentricity *
    eccentricity;

  const mu2 =
    massFraction *
    massFraction;

  return (
    1.60 +
    5.10 *
      eccentricity -
    2.22 *
      e2 +
    4.12 *
      massFraction -
    4.27 *
      eccentricity *
      massFraction -
    5.09 *
      mu2 +
    4.61 *
      e2 *
      mu2
  );
}

function sTypeCriticalFactorV1(
  eccentricity:
    number,

  massFraction:
    number,
): number {

  const e2 =
    eccentricity *
    eccentricity;

  return (
    0.464 -
    0.380 *
      massFraction -
    0.631 *
      eccentricity +
    0.586 *
      massFraction *
      eccentricity +
    0.150 *
      e2 -
    0.198 *
      massFraction *
      e2
  );
}

function calibratedMassFraction(
  massFraction:
    number,
): number {

  return Math.min(
    CIRCUMBINARY_V1_MAX_CALIBRATED_MASS_FRACTION,
    Math.max(
      CIRCUMBINARY_V1_MIN_CALIBRATED_MASS_FRACTION,
      massFraction,
    ),
  );
}

function keplerPeriodYearsV1(
  semiMajorAxisAu:
    number,

  centralMassSolar:
    number,
): number {

  return Math.sqrt(
    semiMajorAxisAu **
      3 /
    centralMassSolar,
  );
}

function assertHierarchy(
  hierarchy:
    StellarOrbitHierarchy,

  expectedMultiplicity:
    StellarSystemMultiplicity,
): void {

  if (
    hierarchy.multiplicity !==
    expectedMultiplicity
  ) {
    throw new RangeError(
      `Expected ${expectedMultiplicity.name} stellar orbit hierarchy.`,
    );
  }
}

function assertCompanionLabel(
  companion:
    StellarCompanion,

  expectedLabel:
    StellarSystemComponentLabel,

  propertyName:
    string,
): void {

  if (
    companion.componentLabel !==
    expectedLabel
  ) {
    throw new RangeError(
      `${propertyName} must be component ${expectedLabel.name}.`,
    );
  }
}

function assertCalibratedEccentricity(
  eccentricity:
    number,

  propertyName:
    string,
): void {

  if (
    eccentricity >
    CIRCUMBINARY_V1_MAX_CALIBRATED_ECCENTRICITY
  ) {
    throw new RangeError(
      `${propertyName} exceeds the point-16.5 empirical stability calibration ceiling ${CIRCUMBINARY_V1_MAX_CALIBRATED_ECCENTRICITY}: ${eccentricity}.`,
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
