import {
  ObservationCertainty,
} from '../../domain/observation/observation-certainty';

const SUPPORTED_CERTAINTIES:
  readonly ObservationCertainty[] =
  Object.freeze([
    ObservationCertainty
      .CANDIDATE,

    ObservationCertainty
      .PROBABLE,

    ObservationCertainty
      .CONFIRMED,
  ]);

validateV1CertaintyCatalog();

/**
 * Frozen qualitative V1 observational-certainty state-machine catalog.
 *
 * The catalog is intentionally:
 * - non-probabilistic;
 * - instrument-independent;
 * - capability-independent;
 * - DiscoveryState-independent;
 * - PRNG-free.
 */
export class ObservationCertaintyCatalogV1 {

  private constructor() {}

  static readonly supportedCertainties =
    SUPPORTED_CERTAINTIES;

  static readonly initialCertainty =
    ObservationCertainty
      .CANDIDATE;

  static readonly maximumCertainty =
    ObservationCertainty
      .CONFIRMED;

  static nextCertainty(
    certainty:
      ObservationCertainty,
  ): ObservationCertainty | null {

    const index =
      SUPPORTED_CERTAINTIES
        .indexOf(
          certainty,
        );

    if (
      index <
      0
    ) {
      throw new RangeError(
        'Unsupported ObservationCertainty.',
      );
    }

    return index ===
      SUPPORTED_CERTAINTIES.length -
        1
      ? null
      : SUPPORTED_CERTAINTIES[
          index +
            1
        ];
  }

  static previousCertainty(
    certainty:
      ObservationCertainty,
  ): ObservationCertainty | null {

    const index =
      SUPPORTED_CERTAINTIES
        .indexOf(
          certainty,
        );

    if (
      index <
      0
    ) {
      throw new RangeError(
        'Unsupported ObservationCertainty.',
      );
    }

    return index ===
      0
      ? null
      : SUPPORTED_CERTAINTIES[
          index -
            1
        ];
  }

  static distanceInStages(
    from:
      ObservationCertainty,

    to:
      ObservationCertainty,
  ): number {

    assertSupported(
      from,
    );

    assertSupported(
      to,
    );

    return to.rank -
      from.rank;
  }
}

function validateV1CertaintyCatalog():
  void {

  if (
    SUPPORTED_CERTAINTIES.length !==
      3
  ) {
    throw new Error(
      'V1 certainty catalog must contain exactly three stages.',
    );
  }

  if (
    new Set(
      SUPPORTED_CERTAINTIES,
    ).size !==
    SUPPORTED_CERTAINTIES.length
  ) {
    throw new Error(
      'V1 certainty catalog cannot contain duplicates.',
    );
  }

  const expectedRanks =
    [
      1,
      2,
      3,
    ];

  for (
    let index =
      0;
    index <
      SUPPORTED_CERTAINTIES.length;
    index +=
      1
  ) {
    if (
      SUPPORTED_CERTAINTIES[
        index
      ].rank !==
      expectedRanks[
        index
      ]
    ) {
      throw new Error(
        'V1 certainty ranks must be exactly 1, 2 and 3.',
      );
    }
  }

  if (
    SUPPORTED_CERTAINTIES[
      0
    ] !==
      ObservationCertainty
        .CANDIDATE ||
    SUPPORTED_CERTAINTIES[
      SUPPORTED_CERTAINTIES.length -
        1
    ] !==
      ObservationCertainty
        .CONFIRMED
  ) {
    throw new Error(
      'V1 certainty initial and maximum stages must be CANDIDATE and CONFIRMED.',
    );
  }
}

function assertSupported(
  certainty:
    ObservationCertainty,
): void {

  if (
    !SUPPORTED_CERTAINTIES
      .includes(
        certainty,
      )
  ) {
    throw new RangeError(
      'Unsupported ObservationCertainty.',
    );
  }
}
