export type StellarYouthStageName =
  | 'PROTOSTAR'
  | 'PRE_MAIN_SEQUENCE'
  | 'YOUNG_STAR'
  | 'YOUNG_BROWN_DWARF';

/**
 * Point-17.1 early stellar-formation overlay.
 *
 * These values deliberately do not extend StellarEvolutionState. Phase 14/15
 * evolution codes are frozen and represent the long-lived evolutionary family;
 * point 17.1 adds a more specific early-age formation interpretation without
 * perturbing those serialized states or their deterministic vectors.
 */
export class StellarYouthStage {

  static readonly PROTOSTAR =
    new StellarYouthStage(
      'PROTOSTAR',
      1,
    );

  static readonly PRE_MAIN_SEQUENCE =
    new StellarYouthStage(
      'PRE_MAIN_SEQUENCE',
      2,
    );

  static readonly YOUNG_STAR =
    new StellarYouthStage(
      'YOUNG_STAR',
      3,
    );

  static readonly YOUNG_BROWN_DWARF =
    new StellarYouthStage(
      'YOUNG_BROWN_DWARF',
      4,
    );

  static readonly values:
    readonly StellarYouthStage[] =
      Object.freeze([
        StellarYouthStage.PROTOSTAR,
        StellarYouthStage.PRE_MAIN_SEQUENCE,
        StellarYouthStage.YOUNG_STAR,
        StellarYouthStage.YOUNG_BROWN_DWARF,
      ]);

  private constructor(
    readonly name:
      StellarYouthStageName,

    readonly code:
      number,
  ) {}

  static fromCodeOrNull(
    code:
      number,
  ): StellarYouthStage | null {

    return (
      StellarYouthStage.values
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
  ): StellarYouthStage {

    const value =
      StellarYouthStage
        .fromCodeOrNull(
          code,
        );

    if (
      value ===
        null
    ) {
      throw new RangeError(
        `Unknown StellarYouthStage code: ${code}.`,
      );
    }

    return value;
  }
}
