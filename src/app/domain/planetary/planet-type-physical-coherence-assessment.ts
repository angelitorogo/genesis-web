import {
  type BodyLocator,
} from '../generation/procedural-locator';

import {
  type BodySeed,
} from '../seed/hierarchical-seeds';

import {
  PlanetType,
} from './planet-type';

import {
  PlanetTypePhysicalCoherenceIssue,
} from './planet-type-physical-coherence-issue';

const CONSISTENCY_TOLERANCE =
  1e-9;

/**
 * Point-19.7 auditable coherence result for one mature Planet.
 *
 * No prior product is mutated here. The assessment records the actual point-19.4
 * type, the independently expected type from point-19.2/19.5 physical sources,
 * and the exact numerical cross-checks used to diagnose any inconsistency.
 */
export class PlanetTypePhysicalCoherenceAssessment {

  readonly issues:
    readonly PlanetTypePhysicalCoherenceIssue[];

  constructor(
    readonly planetOrdinal:
      number,

    readonly bodyLocator:
      BodyLocator,

    readonly bodySeed:
      BodySeed,

    readonly planetType:
      PlanetType,

    readonly expectedPlanetType:
      PlanetType,

    readonly sourceMassEarth:
      number,

    readonly sourceRadiusEarth:
      number,

    readonly sourceDensityGramsPerCubicCentimeter:
      number,

    readonly expectedDensityGramsPerCubicCentimeter:
      number,

    readonly sourceEnvelopeMassFraction01:
      number,

    readonly internalEnvelopeMassFraction01:
      number,

    readonly classificationIceBearingSolidFraction01:
      number,

    readonly compositionSourceIceBearingFraction01:
      number,

    readonly internalIceBearingSolidFraction01:
      number,

    readonly expectedInternalIceBearingSolidFraction01:
      number,

    issues:
      readonly PlanetTypePhysicalCoherenceIssue[],
  ) {
    if (
      !Number.isInteger(
        planetOrdinal,
      ) ||
      planetOrdinal <=
        0
    ) {
      throw new RangeError(
        'planetOrdinal must be a positive integer.',
      );
    }

    if (
      bodyLocator.bodyIndex !==
      BigInt(
        planetOrdinal -
          1,
      )
    ) {
      throw new RangeError(
        'Point-19.7 coherence assessment must use the BodyLocator belonging to planetOrdinal.',
      );
    }

    if (
      bodySeed.kind !==
      'body'
    ) {
      throw new RangeError(
        'PlanetTypePhysicalCoherenceAssessment requires a BodySeed.',
      );
    }

    assertPlanetType(
      planetType,
      'planetType',
    );

    assertPlanetType(
      expectedPlanetType,
      'expectedPlanetType',
    );

    assertPositiveFinite(
      sourceMassEarth,
      'sourceMassEarth',
    );

    assertPositiveFinite(
      sourceRadiusEarth,
      'sourceRadiusEarth',
    );

    assertPositiveFinite(
      sourceDensityGramsPerCubicCentimeter,
      'sourceDensityGramsPerCubicCentimeter',
    );

    assertPositiveFinite(
      expectedDensityGramsPerCubicCentimeter,
      'expectedDensityGramsPerCubicCentimeter',
    );

    assertNormalized(
      sourceEnvelopeMassFraction01,
      'sourceEnvelopeMassFraction01',
    );

    assertNormalized(
      internalEnvelopeMassFraction01,
      'internalEnvelopeMassFraction01',
    );

    assertNormalized(
      classificationIceBearingSolidFraction01,
      'classificationIceBearingSolidFraction01',
    );

    assertNormalized(
      compositionSourceIceBearingFraction01,
      'compositionSourceIceBearingFraction01',
    );

    assertNormalized(
      internalIceBearingSolidFraction01,
      'internalIceBearingSolidFraction01',
    );

    assertNormalized(
      expectedInternalIceBearingSolidFraction01,
      'expectedInternalIceBearingSolidFraction01',
    );

    const issueSet =
      new Set(
        issues,
      );

    if (
      issueSet.size !==
      issues.length
    ) {
      throw new RangeError(
        'Point-19.7 coherence issues must be unique.',
      );
    }

    for (
      const issue
      of issues
    ) {
      if (
        !Object.values(
          PlanetTypePhysicalCoherenceIssue,
        ).includes(
          issue,
        )
      ) {
        throw new RangeError(
          'Point-19.7 coherence issues must contain known diagnostic values only.',
        );
      }
    }

    assertIssueMatchesComparison(
      issueSet,
      PlanetTypePhysicalCoherenceIssue.BULK_MASS_RADIUS_DENSITY_MISMATCH,
      !approximatelyEqual(
        sourceDensityGramsPerCubicCentimeter,
        expectedDensityGramsPerCubicCentimeter,
      ),
    );

    assertIssueMatchesComparison(
      issueSet,
      PlanetTypePhysicalCoherenceIssue.ENVELOPE_MASS_FRACTION_MISMATCH,
      !approximatelyEqual(
        sourceEnvelopeMassFraction01,
        internalEnvelopeMassFraction01,
      ),
    );

    assertIssueMatchesComparison(
      issueSet,
      PlanetTypePhysicalCoherenceIssue.ICE_BEARING_COMPOSITION_MISMATCH,
      !approximatelyEqual(
        classificationIceBearingSolidFraction01,
        compositionSourceIceBearingFraction01,
      ) ||
      !approximatelyEqual(
        internalIceBearingSolidFraction01,
        expectedInternalIceBearingSolidFraction01,
      ),
    );

    assertIssueMatchesComparison(
      issueSet,
      PlanetTypePhysicalCoherenceIssue.TYPE_RULE_MISMATCH,
      planetType !==
        expectedPlanetType,
    );

    this.issues =
      Object.freeze([
        ...issues,
      ]);
  }

  get isCoherent():
    boolean {

    return this
      .issues
      .length ===
      0;
  }
}

function assertPlanetType(
  value:
    PlanetType,

  propertyName:
    string,
): void {

  if (
    !Object.values(
      PlanetType,
    ).includes(
      value,
    )
  ) {
    throw new RangeError(
      `${propertyName} must be a known PlanetType.`,
    );
  }
}

function assertPositiveFinite(
  value:
    number,

  propertyName:
    string,
): void {

  if (
    !Number.isFinite(
      value,
    ) ||
    value <=
      0
  ) {
    throw new RangeError(
      `${propertyName} must be finite and greater than 0: ${value}.`,
    );
  }
}

function assertNormalized(
  value:
    number,

  propertyName:
    string,
): void {

  if (
    !Number.isFinite(
      value,
    ) ||
    value <
      0 ||
    value >
      1
  ) {
    throw new RangeError(
      `${propertyName} must be finite and in [0, 1]: ${value}.`,
    );
  }
}

function assertIssueMatchesComparison(
  issues:
    ReadonlySet<PlanetTypePhysicalCoherenceIssue>,

  issue:
    PlanetTypePhysicalCoherenceIssue,

  expectedPresent:
    boolean,
): void {

  if (
    issues.has(
      issue,
    ) !==
    expectedPresent
  ) {
    throw new RangeError(
      `Point-19.7 issue ${issue} does not match its recorded physical comparison.`,
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
