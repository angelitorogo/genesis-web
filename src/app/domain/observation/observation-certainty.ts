/**
 * Canonical qualitative V1 observational-certainty stages.
 *
 * rank is explicit and must never be inferred from declaration order.
 *
 * ObservationCertainty is deliberately independent from DiscoveryState:
 *
 * ObservationCertainty.CONFIRMED !== DiscoveryState.CONFIRMED
 *
 * A confirmed observational hypothesis does not automatically mutate
 * discovery knowledge.
 */
export class ObservationCertainty {

  static readonly CANDIDATE =
    Object.freeze(
      new ObservationCertainty(
        'CANDIDATE',
        1,
      ),
    );

  static readonly PROBABLE =
    Object.freeze(
      new ObservationCertainty(
        'PROBABLE',
        2,
      ),
    );

  static readonly CONFIRMED =
    Object.freeze(
      new ObservationCertainty(
        'CONFIRMED',
        3,
      ),
    );

  static readonly values:
    readonly ObservationCertainty[] =
    Object.freeze([
      ObservationCertainty
        .CANDIDATE,

      ObservationCertainty
        .PROBABLE,

      ObservationCertainty
        .CONFIRMED,
    ]);

  private constructor(
    readonly name:
      string,

    readonly rank:
      number,
  ) {}

  static fromRank(
    rank:
      number,
  ): ObservationCertainty {

    const certainty =
      ObservationCertainty
        .values
        .find(
          (
            candidate,
          ) =>
            candidate.rank ===
            rank,
        );

    if (
      certainty ===
      undefined
    ) {
      throw new RangeError(
        `Unsupported ObservationCertainty rank: ${rank}.`,
      );
    }

    return certainty;
  }
}

/**
 * Immutable qualitative assessment for one observational hypothesis/finding.
 *
 * Point 8.5 intentionally stores only the qualitative certainty stage.
 * There is no numeric probability, confidence score, evidence score,
 * uncertainty interval, target locator, instrument or DiscoveryState here.
 */
export class ObservationCertaintyAssessment {

  constructor(
    readonly certainty:
      ObservationCertainty,
  ) {
    assertCanonicalCertainty(
      certainty,
      'certainty',
    );
  }

  get isCandidate():
    boolean {

    return this.certainty ===
      ObservationCertainty
        .CANDIDATE;
  }

  get isProbable():
    boolean {

    return this.certainty ===
      ObservationCertainty
        .PROBABLE;
  }

  get isConfirmed():
    boolean {

    return this.certainty ===
      ObservationCertainty
        .CONFIRMED;
  }
}

/**
 * Result of evaluating one requested qualitative certainty transition.
 */
export class ObservationCertaintyTransition {

  constructor(
    readonly previousCertainty:
      ObservationCertainty,

    readonly newCertainty:
      ObservationCertainty,
  ) {
    assertCanonicalCertainty(
      previousCertainty,
      'previousCertainty',
    );

    assertCanonicalCertainty(
      newCertainty,
      'newCertainty',
    );
  }

  get didChange():
    boolean {

    return this
      .previousCertainty !==
      this
        .newCertainty;
  }

  get didAdvance():
    boolean {

    return this
      .newCertainty
      .rank >
      this
        .previousCertainty
        .rank;
  }

  get isIdempotent():
    boolean {

    return this
      .previousCertainty ===
      this
        .newCertainty;
  }
}

function assertCanonicalCertainty(
  certainty:
    ObservationCertainty,

  propertyName:
    string,
): void {

  if (
    !ObservationCertainty
      .values
      .includes(
        certainty,
      )
  ) {
    throw new RangeError(
      `${propertyName} must be a canonical ObservationCertainty.`,
    );
  }
}
