import {
  type PlanetaryFormationAnchor,
} from './planetary-formation-anchor';

import {
  PlanetaryFormationMaturityRegime,
} from './planetary-formation-maturity-regime';

const CONSISTENCY_TOLERANCE =
  1e-9;

/**
 * Point-17.7 endpoint of protoplanetary formation and input boundary for phase
 * 18.
 *
 * This blueprint deliberately does NOT contain a final planet count, planet
 * types, final orbital elements, periods, stability classes or planet physical
 * properties. Phase 18 owns the mature system architecture/orbits and phase 19
 * owns individual planet physics. Point 17.7 only carries forward the frozen
 * formation history and the reservoirs/potentials that those later generators
 * are allowed to consume.
 */
export class PlanetarySystemFormationBlueprint {

  readonly formationAnchors:
    readonly PlanetaryFormationAnchor[];

  constructor(
    readonly sourceDiskAgeMillionYears:
      number,

    readonly sourceDiskDispersalAgeMillionYears:
      number,

    readonly formationCompletionAgeMillionYears:
      number,

    readonly centralMassSolar:
      number,

    readonly sourceInnerRadiusAu:
      number,

    readonly sourceOuterRadiusAu:
      number,

    readonly sourceGasMassEarth:
      number,

    readonly sourceDustMassEarth:
      number,

    readonly sourceCandidateSolidMassEarth:
      number,

    readonly residualDustMassEarth:
      number,

    readonly maxGasCaptureBudgetEarth:
      number,

    readonly sourceCandidateCount:
      number,

    readonly sourceSurvivorCount:
      number,

    readonly sourceMigratedBodyCount:
      number,

    readonly sourceCollisionCount:
      number,

    readonly regime:
      PlanetaryFormationMaturityRegime,

    formationAnchors:
      readonly PlanetaryFormationAnchor[],
  ) {
    assertNonNegativeFinite(
      sourceDiskAgeMillionYears,
      'sourceDiskAgeMillionYears',
    );

    assertPositiveFinite(
      sourceDiskDispersalAgeMillionYears,
      'sourceDiskDispersalAgeMillionYears',
    );

    if (
      sourceDiskAgeMillionYears -
        sourceDiskDispersalAgeMillionYears >
      CONSISTENCY_TOLERANCE
    ) {
      throw new RangeError(
        'The source disk age cannot exceed the frozen dispersal age.',
      );
    }

    assertPositiveFinite(
      formationCompletionAgeMillionYears,
      'formationCompletionAgeMillionYears',
    );

    if (
      formationCompletionAgeMillionYears +
        CONSISTENCY_TOLERANCE <
      sourceDiskDispersalAgeMillionYears
    ) {
      throw new RangeError(
        'Formation completion cannot precede primordial-disk dispersal.',
      );
    }

    assertPositiveFinite(
      centralMassSolar,
      'centralMassSolar',
    );

    assertPositiveFinite(
      sourceInnerRadiusAu,
      'sourceInnerRadiusAu',
    );

    assertPositiveFinite(
      sourceOuterRadiusAu,
      'sourceOuterRadiusAu',
    );

    if (
      sourceInnerRadiusAu >=
      sourceOuterRadiusAu
    ) {
      throw new RangeError(
        'sourceInnerRadiusAu must be below sourceOuterRadiusAu.',
      );
    }

    assertNonNegativeFinite(
      sourceGasMassEarth,
      'sourceGasMassEarth',
    );

    assertNonNegativeFinite(
      sourceDustMassEarth,
      'sourceDustMassEarth',
    );

    assertNonNegativeFinite(
      sourceCandidateSolidMassEarth,
      'sourceCandidateSolidMassEarth',
    );

    assertNonNegativeFinite(
      residualDustMassEarth,
      'residualDustMassEarth',
    );

    if (
      !approximatelyEqual(
        sourceCandidateSolidMassEarth +
          residualDustMassEarth,
        sourceDustMassEarth,
      )
    ) {
      throw new RangeError(
        'Candidate solids plus residual dust must conserve the point-17.4 dust reservoir.',
      );
    }

    assertNonNegativeFinite(
      maxGasCaptureBudgetEarth,
      'maxGasCaptureBudgetEarth',
    );

    if (
      maxGasCaptureBudgetEarth -
        sourceGasMassEarth >
      CONSISTENCY_TOLERANCE
    ) {
      throw new RangeError(
        'maxGasCaptureBudgetEarth cannot exceed the point-17.3 gas reservoir.',
      );
    }

    assertNonNegativeInteger(
      sourceCandidateCount,
      'sourceCandidateCount',
    );

    assertNonNegativeInteger(
      sourceSurvivorCount,
      'sourceSurvivorCount',
    );

    assertNonNegativeInteger(
      sourceMigratedBodyCount,
      'sourceMigratedBodyCount',
    );

    assertNonNegativeInteger(
      sourceCollisionCount,
      'sourceCollisionCount',
    );

    if (
      sourceSurvivorCount >
        sourceCandidateCount ||
      sourceMigratedBodyCount >
        sourceSurvivorCount ||
      sourceCollisionCount !==
        sourceCandidateCount -
          sourceSurvivorCount
    ) {
      throw new RangeError(
        'Point-17.7 source population counters must remain consistent with point 17.5.',
      );
    }

    if (
      !Object.values(
        PlanetaryFormationMaturityRegime,
      ).includes(
        regime,
      )
    ) {
      throw new RangeError(
        'regime must be a known PlanetaryFormationMaturityRegime.',
      );
    }

    validateAnchors(
      formationAnchors,
      sourceInnerRadiusAu,
      sourceOuterRadiusAu,
      sourceCandidateCount,
      sourceSurvivorCount,
      sourceCandidateSolidMassEarth,
    );

    if (
      formationAnchors.length ===
        0 &&
      regime !==
        PlanetaryFormationMaturityRegime.NO_PLANET_FORMING_CORES
    ) {
      throw new RangeError(
        'An empty formation blueprint must use NO_PLANET_FORMING_CORES.',
      );
    }

    if (
      formationAnchors.length >
        0 &&
      regime ===
        PlanetaryFormationMaturityRegime.NO_PLANET_FORMING_CORES
    ) {
      throw new RangeError(
        'A non-empty formation blueprint cannot use NO_PLANET_FORMING_CORES.',
      );
    }

    this.formationAnchors =
      Object.freeze([
        ...formationAnchors,
      ]);
  }

  get anchorCount():
    number {

    return this
      .formationAnchors
      .length;
  }

  get hasFormationAnchors():
    boolean {

    return (
      this.anchorCount >
      0
    );
  }

  get isDynamicallyReworked():
    boolean {

    return (
      this.sourceCollisionCount >
        0 ||
      this.sourceMigratedBodyCount >
        0
    );
  }

  get hasStrongGasEnvelopeOpportunity():
    boolean {

    return this
      .formationAnchors
      .some(
        anchor =>
          anchor
            .envelopeAcquisitionPotential01 >=
          0.6,
      );
  }
}

function validateAnchors(
  anchors:
    readonly PlanetaryFormationAnchor[],

  sourceInnerRadiusAu:
    number,

  sourceOuterRadiusAu:
    number,

  sourceCandidateCount:
    number,

  sourceSurvivorCount:
    number,

  expectedSolidMassEarth:
    number,
): void {

  if (
    anchors.length !==
    sourceSurvivorCount
  ) {
    throw new RangeError(
      'formationAnchors must map one-to-one to point-17.5 survivors.',
    );
  }

  let previousRadiusAu =
    -Infinity;

  let accumulatedMassEarth =
    0;

  const sourceOrdinals =
    new Set<number>();

  for (
    let index = 0;
    index <
      anchors.length;
    index += 1
  ) {
    const anchor =
      anchors[
        index
      ];

    if (
      anchor.anchorOrdinal !==
      index +
        1
    ) {
      throw new RangeError(
        'Formation-anchor ordinals must be contiguous and start at 1.',
      );
    }

    if (
      anchor.assemblyRadiusAu <
        sourceInnerRadiusAu -
          CONSISTENCY_TOLERANCE ||
      anchor.assemblyRadiusAu >
        sourceOuterRadiusAu +
          CONSISTENCY_TOLERANCE
    ) {
      throw new RangeError(
        'Every formation anchor must remain inside the source disk envelope.',
      );
    }

    if (
      anchor.assemblyRadiusAu <
      previousRadiusAu -
        CONSISTENCY_TOLERANCE
    ) {
      throw new RangeError(
        'Formation anchors must be sorted by assembly radius.',
      );
    }

    previousRadiusAu =
      anchor.assemblyRadiusAu;

    accumulatedMassEarth +=
      anchor.solidCoreMassEarth;

    for (
      const sourceOrdinal
      of anchor.sourceFormationOrdinals
    ) {
      if (
        sourceOrdinals.has(
          sourceOrdinal,
        )
      ) {
        throw new RangeError(
          'Each point-17.4 source ordinal must belong to exactly one formation anchor.',
        );
      }

      sourceOrdinals.add(
        sourceOrdinal,
      );
    }
  }

  if (
    sourceOrdinals.size !==
    sourceCandidateCount
  ) {
    throw new RangeError(
      'Formation-anchor lineages must cover all point-17.4 candidates exactly once.',
    );
  }

  if (
    !approximatelyEqual(
      accumulatedMassEarth,
      expectedSolidMassEarth,
    )
  ) {
    throw new RangeError(
      'Formation-anchor solid masses must conserve the point-17.5 survivor mass.',
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

function assertNonNegativeFinite(
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
      0
  ) {
    throw new RangeError(
      `${propertyName} must be finite and non-negative: ${value}.`,
    );
  }
}

function assertNonNegativeInteger(
  value:
    number,

  propertyName:
    string,
): void {

  if (
    !Number.isInteger(
      value,
    ) ||
    value <
      0
  ) {
    throw new RangeError(
      `${propertyName} must be a non-negative integer.`,
    );
  }
}

function approximatelyEqual(
  first:
    number,

  second:
    number,
): boolean {

  return (
    Math.abs(
      first -
      second,
    ) <=
    CONSISTENCY_TOLERANCE *
      Math.max(
        1,
        Math.abs(
          first,
        ),
        Math.abs(
          second,
        ),
      )
  );
}
