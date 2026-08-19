/**
 * Point-13.6 source-family classifications inferred from a synthesized
 * spectrum.
 *
 * This deliberately does NOT replace point-8.9 ObservationClassification.
 * The latter remains the general observed-knowledge contract that may stay
 * Unclassified. Point 13.6 only expresses what the spectral morphology itself
 * supports.
 */
export enum SpectroscopicSourceClassification {
  UNCLASSIFIED =
    'UNCLASSIFIED',

  STELLAR_PHOTOSPHERIC =
    'STELLAR_PHOTOSPHERIC',

  ATMOSPHERIC_ABSORPTION =
    'ATMOSPHERIC_ABSORPTION',

  NEBULAR_EMISSION =
    'NEBULAR_EMISSION',

  SUPERNOVA_REMNANT_SHOCK =
    'SUPERNOVA_REMNANT_SHOCK',

  ACTIVE_GALACTIC_NUCLEUS =
    'ACTIVE_GALACTIC_NUCLEUS',
}

/**
 * Candidate-only point-13.6 interpretation status.
 *
 * PROBABLE / CONFIRMED are intentionally absent. Dedicated biosignature and
 * technosignature confirmation workflows are later-roadmap responsibilities.
 */
export enum SpectroscopicCandidateStatus {
  NONE =
    'NONE',

  CANDIDATE =
    'CANDIDATE',
}

/**
 * Observable spectral evidence supported by the simplified V1 interpretation
 * layer.
 *
 * These values describe evidence, not Ground Truth. In particular, a
 * biosignature candidate does not mean that life exists, and a
 * technosignature candidate does not mean that a civilization exists.
 */
export enum SpectroscopicEvidenceIndicator {
  OXYGEN_METHANE_DISEQUILIBRIUM_CANDIDATE =
    'OXYGEN_METHANE_DISEQUILIBRIUM_CANDIDATE',

  NARROW_ISOLATED_OPTICAL_EMISSION_ANOMALY =
    'NARROW_ISOLATED_OPTICAL_EMISSION_ANOMALY',
}

const BIOSIGNATURE_INDICATORS =
  new Set<
    SpectroscopicEvidenceIndicator
  >([
    SpectroscopicEvidenceIndicator
      .OXYGEN_METHANE_DISEQUILIBRIUM_CANDIDATE,
  ]);

const TECHNOSIGNATURE_INDICATORS =
  new Set<
    SpectroscopicEvidenceIndicator
  >([
    SpectroscopicEvidenceIndicator
      .NARROW_ISOLATED_OPTICAL_EMISSION_ANOMALY,
  ]);

/**
 * Pure point-13.6 observed spectral interpretation.
 *
 * No probability/confidence score is present by design. Point 13.7 will add
 * instrumental uncertainty, while the later biosignature/technosignature
 * phases own multi-observation confirmation and false-positive handling.
 */
export class SpectroscopicInterpretation {

  readonly indicators:
    readonly SpectroscopicEvidenceIndicator[];

  constructor(
    readonly sourceClassification:
      SpectroscopicSourceClassification,

    indicators:
      readonly SpectroscopicEvidenceIndicator[],
  ) {
    if (
      !Object.values(
        SpectroscopicSourceClassification,
      ).includes(
        sourceClassification,
      )
    ) {
      throw new RangeError(
        `Unsupported SpectroscopicSourceClassification: ${String(sourceClassification)}.`,
      );
    }

    const supportedIndicators =
      new Set(
        Object.values(
          SpectroscopicEvidenceIndicator,
        ),
      );

    const uniqueIndicators =
      new Set<
        SpectroscopicEvidenceIndicator
      >();

    for (
      const indicator
      of indicators
    ) {
      if (
        !supportedIndicators.has(
          indicator,
        )
      ) {
        throw new RangeError(
          `Unsupported SpectroscopicEvidenceIndicator: ${String(indicator)}.`,
        );
      }

      if (
        uniqueIndicators.has(
          indicator,
        )
      ) {
        throw new RangeError(
          `Duplicate spectroscopic evidence indicator: ${indicator}.`,
        );
      }

      uniqueIndicators.add(
        indicator,
      );
    }

    this.indicators =
      Object.freeze(
        [
          ...uniqueIndicators,
        ]
          .sort(
            (
              left,
              right,
            ) =>
              left.localeCompare(
                right,
              ),
          ),
      );
  }

  get biosignatureStatus():
    SpectroscopicCandidateStatus {

    return this
      .indicators
      .some(
        indicator =>
          BIOSIGNATURE_INDICATORS
            .has(
              indicator,
            ),
      )
      ? SpectroscopicCandidateStatus
          .CANDIDATE
      : SpectroscopicCandidateStatus
          .NONE;
  }

  get technosignatureStatus():
    SpectroscopicCandidateStatus {

    return this
      .indicators
      .some(
        indicator =>
          TECHNOSIGNATURE_INDICATORS
            .has(
              indicator,
            ),
      )
      ? SpectroscopicCandidateStatus
          .CANDIDATE
      : SpectroscopicCandidateStatus
          .NONE;
  }

  get isSourceClassified():
    boolean {

    return this
      .sourceClassification !==
      SpectroscopicSourceClassification
        .UNCLASSIFIED;
  }

  get hasBiosignatureCandidate():
    boolean {

    return this
      .biosignatureStatus ===
      SpectroscopicCandidateStatus
        .CANDIDATE;
  }

  get hasTechnosignatureCandidate():
    boolean {

    return this
      .technosignatureStatus ===
      SpectroscopicCandidateStatus
        .CANDIDATE;
  }
}
