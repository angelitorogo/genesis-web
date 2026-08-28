export type ProtoplanetCandidateCompositionName =
  | 'REFRACTORY_RICH'
  | 'ROCKY'
  | 'ICE_RICH'
  | 'VOLATILE_RICH';

/**
 * Point-17.4 broad solid-composition family of one protoplanet candidate.
 *
 * This is an initial condensed-solids classification inherited from the
 * point-17.3 condensation region where the candidate forms. It is not a final
 * mature-planet composition and it does not include a primordial H/He envelope.
 */
export class ProtoplanetCandidateComposition {

  static readonly REFRACTORY_RICH =
    new ProtoplanetCandidateComposition(
      'REFRACTORY_RICH',
      1,
      0.01,
    );

  static readonly ROCKY =
    new ProtoplanetCandidateComposition(
      'ROCKY',
      2,
      0.06,
    );

  static readonly ICE_RICH =
    new ProtoplanetCandidateComposition(
      'ICE_RICH',
      3,
      0.45,
    );

  static readonly VOLATILE_RICH =
    new ProtoplanetCandidateComposition(
      'VOLATILE_RICH',
      4,
      0.68,
    );

  static readonly values:
    readonly ProtoplanetCandidateComposition[] =
      Object.freeze([
        ProtoplanetCandidateComposition.REFRACTORY_RICH,
        ProtoplanetCandidateComposition.ROCKY,
        ProtoplanetCandidateComposition.ICE_RICH,
        ProtoplanetCandidateComposition.VOLATILE_RICH,
      ]);

  private constructor(
    readonly name:
      ProtoplanetCandidateCompositionName,

    readonly code:
      number,

    readonly nominalIceMassFraction01:
      number,
  ) {}

  static fromCodeOrNull(
    code:
      number,
  ): ProtoplanetCandidateComposition | null {

    return (
      ProtoplanetCandidateComposition.values
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
  ): ProtoplanetCandidateComposition {

    const value =
      ProtoplanetCandidateComposition
        .fromCodeOrNull(
          code,
        );

    if (
      value ===
        null
    ) {
      throw new RangeError(
        `Unknown ProtoplanetCandidateComposition code: ${code}.`,
      );
    }

    return value;
  }
}
