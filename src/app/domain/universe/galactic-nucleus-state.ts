export type GalacticNucleusStateName =
  | 'QUIESCENT'
  | 'AGN'
  | 'QUASAR';

/**
 * Canonical physical state of a galactic nucleus.
 *
 * Codes are part of the cross-platform GENESIS domain contract and match
 * the Android implementation exactly.
 */
export class GalacticNucleusState {

  static readonly QUIESCENT =
    new GalacticNucleusState(
      'QUIESCENT',
      1,
    );

  static readonly AGN =
    new GalacticNucleusState(
      'AGN',
      2,
    );

  static readonly QUASAR =
    new GalacticNucleusState(
      'QUASAR',
      3,
    );

  static readonly values:
    readonly GalacticNucleusState[] =
      Object.freeze([
        GalacticNucleusState.QUIESCENT,
        GalacticNucleusState.AGN,
        GalacticNucleusState.QUASAR,
      ]);

  private constructor(
    readonly name:
      GalacticNucleusStateName,

    readonly code:
      number,
  ) {}

  static fromCodeOrNull(
    code:
      number,
  ): GalacticNucleusState | null {

    return (
      GalacticNucleusState.values
        .find(
          (
            value,
          ) =>
            value.code ===
            code,
        ) ??
      null
    );
  }

  static fromCode(
    code:
      number,
  ): GalacticNucleusState {

    const value =
      GalacticNucleusState
        .fromCodeOrNull(
          code,
        );

    if (
      value ===
      null
    ) {
      throw new RangeError(
        `Unknown GalacticNucleusState code: ${code}.`,
      );
    }

    return value;
  }
}