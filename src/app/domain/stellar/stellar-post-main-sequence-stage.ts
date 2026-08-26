export type StellarPostMainSequenceStageName =
  | 'RED_GIANT_BRANCH'
  | 'ASYMPTOTIC_GIANT_BRANCH'
  | 'SUPERGIANT';

/**
 * Point-14.4 coarse post-main-sequence evolutionary stage.
 *
 * GENESIS keeps this separate from spectral type/color. The two GIANT stages
 * distinguish the red-giant branch from the later asymptotic-giant branch,
 * while the massive-star branch is represented by SUPERGIANT. Point 15.2 may
 * later derive detailed spectral classification and color without changing
 * this evolutionary contract.
 *
 * Important roadmap boundary:
 * - no mass threshold is encoded here (points 14.8 and 15.1);
 * - no lifetime/age transition is encoded here (points 14.8-14.9 and 15.3);
 * - no effective temperature, color or spectral subtype is encoded here;
 * - no remnant outcome is inferred here (points 14.5-14.7).
 *
 * Codes are stable V1 serialization values. Consumers must compare name/code
 * rather than relying on singleton identity across structuredClone boundaries.
 */
export class StellarPostMainSequenceStage {

  static readonly RED_GIANT_BRANCH =
    new StellarPostMainSequenceStage(
      'RED_GIANT_BRANCH',
      1,
    );

  static readonly ASYMPTOTIC_GIANT_BRANCH =
    new StellarPostMainSequenceStage(
      'ASYMPTOTIC_GIANT_BRANCH',
      2,
    );

  static readonly SUPERGIANT =
    new StellarPostMainSequenceStage(
      'SUPERGIANT',
      3,
    );

  static readonly values:
    readonly StellarPostMainSequenceStage[] =
      Object.freeze([
        StellarPostMainSequenceStage.RED_GIANT_BRANCH,
        StellarPostMainSequenceStage.ASYMPTOTIC_GIANT_BRANCH,
        StellarPostMainSequenceStage.SUPERGIANT,
      ]);

  private constructor(
    readonly name:
      StellarPostMainSequenceStageName,

    readonly code:
      number,
  ) {}

  static fromCodeOrNull(
    code:
      number,
  ): StellarPostMainSequenceStage | null {

    return (
      StellarPostMainSequenceStage.values
        .find(
          value =>
            value.code ===
            code,
        ) ??
      null
    );
  }

  static fromCode(
    code:
      number,
  ): StellarPostMainSequenceStage {

    const value =
      StellarPostMainSequenceStage
        .fromCodeOrNull(
          code,
        );

    if (
      value ===
        null
    ) {
      throw new RangeError(
        `Unknown StellarPostMainSequenceStage code: ${code}.`,
      );
    }

    return value;
  }
}
