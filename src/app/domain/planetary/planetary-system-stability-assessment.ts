import {
  type SystemLocator,
} from '../generation/procedural-locator';

import {
  PlanetaryOrbitalPairStability,
} from './planetary-orbital-pair-stability';

import {
  PlanetaryOrbitalPairStabilityRegime,
} from './planetary-orbital-pair-stability-regime';

import {
  PlanetarySystemOrbitTopology,
} from './planetary-system-orbit-topology';

import {
  PlanetarySystemStabilityRegime,
} from './planetary-system-stability-regime';

/**
 * Point-18.5 basic stability summary for the frozen 18.2-18.4 architecture.
 *
 * This object is diagnostic: it does not move planets, change planet count or
 * rewrite any earlier orbital element. Pairwise V1 checks use inherited solid
 * core masses, mutual-Hill spacing and the already-frozen non-crossing ellipses.
 * Multiple-star systems additionally preserve the point-16.5 P-type limits.
 */
export class PlanetarySystemStabilityAssessment {

  readonly pairAssessments:
    readonly PlanetaryOrbitalPairStability[];

  constructor(
    readonly systemLocator:
      SystemLocator,

    readonly orbitTopology:
      PlanetarySystemOrbitTopology,

    readonly regime:
      PlanetarySystemStabilityRegime,

    readonly planetCount:
      number,

    readonly gravitatingMassSolar:
      number | null,

    readonly innerCriticalBoundaryAu:
      number | null,

    readonly outerCriticalBoundaryAu:
      number | null,

    readonly innerBoundaryClearanceAu:
      number | null,

    readonly outerBoundaryClearanceAu:
      number | null,

    pairAssessments:
      readonly PlanetaryOrbitalPairStability[],
  ) {
    if (
      !Object.values(
        PlanetarySystemOrbitTopology,
      ).includes(
        orbitTopology,
      )
    ) {
      throw new RangeError(
        'orbitTopology must be a known PlanetarySystemOrbitTopology.',
      );
    }

    if (
      !Object.values(
        PlanetarySystemStabilityRegime,
      ).includes(
        regime,
      )
    ) {
      throw new RangeError(
        'regime must be a known PlanetarySystemStabilityRegime.',
      );
    }

    if (
      !Number.isInteger(
        planetCount,
      ) ||
      planetCount <
        0
    ) {
      throw new RangeError(
        'planetCount must be a non-negative integer.',
      );
    }

    validateMass(
      gravitatingMassSolar,
      planetCount,
    );

    validateBoundaries(
      orbitTopology,
      innerCriticalBoundaryAu,
      outerCriticalBoundaryAu,
      innerBoundaryClearanceAu,
      outerBoundaryClearanceAu,
      planetCount,
    );

    validatePairs(
      planetCount,
      pairAssessments,
    );

    validateRegime(
      regime,
      planetCount,
      pairAssessments,
      innerBoundaryClearanceAu,
      outerBoundaryClearanceAu,
    );

    this.pairAssessments =
      Object.freeze([
        ...pairAssessments,
      ]);
  }

  get pairCount():
    number {

    return this
      .pairAssessments
      .length;
  }

  get unstablePairCount():
    number {

    return this
      .pairAssessments
      .filter(
        pair =>
          pair.regime ===
          PlanetaryOrbitalPairStabilityRegime.UNSTABLE,
      )
      .length;
  }

  get marginalPairCount():
    number {

    return this
      .pairAssessments
      .filter(
        pair =>
          pair.regime ===
          PlanetaryOrbitalPairStabilityRegime.MARGINAL,
      )
      .length;
  }

  get minimumMutualHillSeparation():
    number | null {

    if (
      this.pairAssessments.length ===
      0
    ) {
      return null;
    }

    return Math.min(
      ...this
        .pairAssessments
        .map(
          pair =>
            pair
              .separationMutualHillRadii,
        ),
    );
  }

  get minimumRadialClearanceAu():
    number | null {

    if (
      this.pairAssessments.length ===
      0
    ) {
      return null;
    }

    return Math.min(
      ...this
        .pairAssessments
        .map(
          pair =>
            pair.radialClearanceAu,
        ),
    );
  }

  get isStable():
    boolean {

    return this.regime ===
      PlanetarySystemStabilityRegime.STABLE;
  }
}

function validateMass(
  gravitatingMassSolar:
    number | null,

  planetCount:
    number,
): void {

  if (
    planetCount ===
    0
  ) {
    if (
      gravitatingMassSolar !==
      null
    ) {
      throw new RangeError(
        'A point-18.5 assessment without planets must not assert a gravitating planet-orbit mass.',
      );
    }

    return;
  }

  if (
    gravitatingMassSolar ===
      null ||
    !Number.isFinite(
      gravitatingMassSolar,
    ) ||
    gravitatingMassSolar <=
      0
  ) {
    throw new RangeError(
      'A non-empty point-18.5 assessment requires a positive finite gravitating host mass.',
    );
  }
}

function validateBoundaries(
  topology:
    PlanetarySystemOrbitTopology,

  innerBoundary:
    number | null,

  outerBoundary:
    number | null,

  innerClearance:
    number | null,

  outerClearance:
    number | null,

  planetCount:
    number,
): void {

  if (
    topology ===
    PlanetarySystemOrbitTopology.CIRCUMSTELLAR
  ) {
    if (
      innerBoundary !==
        null ||
      outerBoundary !==
        null ||
      innerClearance !==
        null ||
      outerClearance !==
        null
    ) {
      throw new RangeError(
        'CIRCUMSTELLAR point-18.5 assessments do not use point-16.5 critical boundaries.',
      );
    }

    return;
  }

  if (
    innerBoundary !==
    null
  ) {
    assertPositiveFinite(
      innerBoundary,
      'innerCriticalBoundaryAu',
    );
  }

  if (
    outerBoundary !==
    null
  ) {
    assertPositiveFinite(
      outerBoundary,
      'outerCriticalBoundaryAu',
    );

    if (
      innerBoundary !==
        null &&
      outerBoundary <=
        innerBoundary
    ) {
      throw new RangeError(
        'outerCriticalBoundaryAu must exceed innerCriticalBoundaryAu when both exist.',
      );
    }
  }

  if (
    planetCount ===
    0
  ) {
    if (
      innerClearance !==
        null ||
      outerClearance !==
        null
    ) {
      throw new RangeError(
        'A planet-free point-18.5 assessment cannot expose orbital boundary clearances.',
      );
    }

    return;
  }

  if (
    innerBoundary ===
      null ||
    innerClearance ===
      null ||
    !Number.isFinite(
      innerClearance,
    )
  ) {
    throw new RangeError(
      'A non-empty CIRCUMBINARY point-18.5 assessment requires the inner critical boundary and its clearance.',
    );
  }

  if (
    outerBoundary ===
      null
  ) {
    if (
      outerClearance !==
      null
    ) {
      throw new RangeError(
        'An open-outer CIRCUMBINARY assessment cannot expose a finite outer-boundary clearance.',
      );
    }

    return;
  }

  if (
    outerClearance ===
      null ||
    !Number.isFinite(
      outerClearance,
    )
  ) {
    throw new RangeError(
      'A finite outer critical boundary requires an outerBoundaryClearanceAu.',
    );
  }
}

function validatePairs(
  planetCount:
    number,

  pairs:
    readonly PlanetaryOrbitalPairStability[],
): void {

  const expectedPairCount =
    Math.max(
      0,
      planetCount -
        1,
    );

  if (
    pairs.length !==
    expectedPairCount
  ) {
    throw new RangeError(
      'Point-18.5 requires exactly one adjacent-pair assessment between every two ordered planets.',
    );
  }

  for (
    let index = 0;
    index <
      pairs.length;
    index += 1
  ) {
    const pair =
      pairs[index];

    if (
      pair.innerPlanetOrdinal !==
        index +
          1 ||
      pair.outerPlanetOrdinal !==
        index +
          2
    ) {
      throw new RangeError(
        'Point-18.5 pair assessments must be contiguous and ordered by mature planet ordinal.',
      );
    }
  }
}

function validateRegime(
  regime:
    PlanetarySystemStabilityRegime,

  planetCount:
    number,

  pairs:
    readonly PlanetaryOrbitalPairStability[],

  innerBoundaryClearanceAu:
    number | null,

  outerBoundaryClearanceAu:
    number | null,
): void {

  if (
    planetCount ===
    0
  ) {
    if (
      regime !==
        PlanetarySystemStabilityRegime.EMPTY &&
      regime !==
        PlanetarySystemStabilityRegime.DYNAMICALLY_EXCLUDED
    ) {
      throw new RangeError(
        'Planet-free point-18.5 assessments must be EMPTY or DYNAMICALLY_EXCLUDED.',
      );
    }

    return;
  }

  if (
    regime ===
      PlanetarySystemStabilityRegime.EMPTY ||
    regime ===
      PlanetarySystemStabilityRegime.DYNAMICALLY_EXCLUDED
  ) {
    throw new RangeError(
      'A non-empty point-18.5 assessment cannot use a planet-free stability regime.',
    );
  }

  const boundaryFailure =
    (
      innerBoundaryClearanceAu !==
        null &&
      innerBoundaryClearanceAu <
        0
    ) ||
    (
      outerBoundaryClearanceAu !==
        null &&
      outerBoundaryClearanceAu <
        0
    );

  const hasUnstablePair =
    pairs.some(
      pair =>
        pair.regime ===
        PlanetaryOrbitalPairStabilityRegime.UNSTABLE,
    );

  const hasMarginalPair =
    pairs.some(
      pair =>
        pair.regime ===
        PlanetaryOrbitalPairStabilityRegime.MARGINAL,
    );

  const expected =
    boundaryFailure ||
      hasUnstablePair
      ? PlanetarySystemStabilityRegime.UNSTABLE
      : hasMarginalPair
        ? PlanetarySystemStabilityRegime.MARGINAL
        : PlanetarySystemStabilityRegime.STABLE;

  if (
    regime !==
    expected
  ) {
    throw new RangeError(
      `Point-18.5 stability regime must match the pair/boundary diagnostics: expected ${expected}.`,
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
