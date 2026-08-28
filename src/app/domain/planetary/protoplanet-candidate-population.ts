import {
  type ProtoplanetCandidate,
} from './protoplanet-candidate';

const CONSISTENCY_TOLERANCE =
  1e-9;

/**
 * Point-17.4 snapshot of all distinct protoplanet candidates materialized from
 * one point-17.3 dust reservoir.
 *
 * Only condensed solid mass is committed to candidates in this point. The
 * remaining dust stays in the disk. Gas is never removed here; a candidate's
 * gasAccretionPotential01 is only a future-growth indicator for points 17.5+.
 */
export class ProtoplanetCandidatePopulation {

  readonly candidates:
    readonly ProtoplanetCandidate[];

  constructor(
    readonly sourceInnerRadiusAu:
      number,

    readonly sourceOuterRadiusAu:
      number,

    readonly sourceDustMassEarth:
      number,

    readonly candidateSolidMassEarth:
      number,

    readonly residualDustMassEarth:
      number,

    readonly dustConversionFraction01:
      number,

    candidates:
      readonly ProtoplanetCandidate[],
  ) {
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
      sourceDustMassEarth,
      'sourceDustMassEarth',
    );

    assertNonNegativeFinite(
      candidateSolidMassEarth,
      'candidateSolidMassEarth',
    );

    assertNonNegativeFinite(
      residualDustMassEarth,
      'residualDustMassEarth',
    );

    if (
      !approximatelyEqual(
        candidateSolidMassEarth +
          residualDustMassEarth,
        sourceDustMassEarth,
      )
    ) {
      throw new RangeError(
        'candidateSolidMassEarth + residualDustMassEarth must equal sourceDustMassEarth.',
      );
    }

    assertNormalized(
      dustConversionFraction01,
      'dustConversionFraction01',
    );

    const expectedConversionFraction =
      sourceDustMassEarth ===
        0
        ? 0
        : candidateSolidMassEarth /
          sourceDustMassEarth;

    if (
      !approximatelyEqual(
        dustConversionFraction01,
        expectedConversionFraction,
      )
    ) {
      throw new RangeError(
        'dustConversionFraction01 must match candidateSolidMassEarth / sourceDustMassEarth.',
      );
    }

    validateCandidates(
      candidates,
      sourceInnerRadiusAu,
      sourceOuterRadiusAu,
      candidateSolidMassEarth,
    );

    this.candidates =
      Object.freeze([
        ...candidates,
      ]);
  }

  get hasCandidates():
    boolean {

    return (
      this.candidates.length >
      0
    );
  }
}

function validateCandidates(
  candidates:
    readonly ProtoplanetCandidate[],

  sourceInnerRadiusAu:
    number,

  sourceOuterRadiusAu:
    number,

  expectedCandidateMassEarth:
    number,
): void {

  const ordinals =
    new Set<number>();

  let previousRadiusAu =
    -Infinity;

  let accumulatedMassEarth =
    0;

  for (
    const candidate
    of candidates
  ) {
    if (
      candidate.orbitalRadiusAu <
        sourceInnerRadiusAu -
          CONSISTENCY_TOLERANCE ||
      candidate.orbitalRadiusAu >
        sourceOuterRadiusAu +
          CONSISTENCY_TOLERANCE
    ) {
      throw new RangeError(
        'Every protoplanet candidate must remain inside the source disk envelope.',
      );
    }

    if (
      candidate.orbitalRadiusAu <
      previousRadiusAu -
        CONSISTENCY_TOLERANCE
    ) {
      throw new RangeError(
        'Protoplanet candidates must be sorted by initial orbital radius.',
      );
    }

    if (
      ordinals.has(
        candidate.formationOrdinal,
      )
    ) {
      throw new RangeError(
        'Protoplanet candidate formation ordinals must be unique inside one population.',
      );
    }

    ordinals.add(
      candidate.formationOrdinal,
    );

    previousRadiusAu =
      candidate.orbitalRadiusAu;

    accumulatedMassEarth +=
      candidate.solidMassEarth;
  }

  if (
    !approximatelyEqual(
      accumulatedMassEarth,
      expectedCandidateMassEarth,
    )
  ) {
    throw new RangeError(
      'candidateSolidMassEarth must equal the sum of all candidate solid masses.',
    );
  }

  if (
    candidates.length ===
      0 &&
    expectedCandidateMassEarth >
      CONSISTENCY_TOLERANCE
  ) {
    throw new RangeError(
      'A population without candidates cannot contain committed candidate mass.',
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
      `${propertyName} must be finite and in range [0, 1]: ${value}.`,
    );
  }
}

function approximatelyEqual(
  first:
    number,

  second:
    number,
): boolean {

  const scale =
    Math.max(
      1,
      Math.abs(
        first,
      ),
      Math.abs(
        second,
      ),
    );

  return (
    Math.abs(
      first -
      second,
    ) <=
    CONSISTENCY_TOLERANCE *
      scale
  );
}
