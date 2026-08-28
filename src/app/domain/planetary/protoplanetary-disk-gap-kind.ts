export type ProtoplanetaryDiskGapKindName =
  | 'VISCOSITY_TRANSITION_GAP'
  | 'CONDENSATION_FRONT_DEPLETION_GAP'
  | 'PHOTOEVAPORATIVE_GAP';

/**
 * Point-17.3 origin of an axisymmetric annular depletion in a primordial disk.
 *
 * None of these gap kinds implies the presence of a protoplanet. Point 17.4
 * owns protoplanet candidates; point 17.3 only describes disk substructure that
 * can exist before any candidate body is materialized.
 */
export class ProtoplanetaryDiskGapKind {

  static readonly VISCOSITY_TRANSITION_GAP =
    new ProtoplanetaryDiskGapKind(
      'VISCOSITY_TRANSITION_GAP',
      1,
    );

  static readonly CONDENSATION_FRONT_DEPLETION_GAP =
    new ProtoplanetaryDiskGapKind(
      'CONDENSATION_FRONT_DEPLETION_GAP',
      2,
    );

  static readonly PHOTOEVAPORATIVE_GAP =
    new ProtoplanetaryDiskGapKind(
      'PHOTOEVAPORATIVE_GAP',
      3,
    );

  static readonly values:
    readonly ProtoplanetaryDiskGapKind[] =
      Object.freeze([
        ProtoplanetaryDiskGapKind.VISCOSITY_TRANSITION_GAP,
        ProtoplanetaryDiskGapKind.CONDENSATION_FRONT_DEPLETION_GAP,
        ProtoplanetaryDiskGapKind.PHOTOEVAPORATIVE_GAP,
      ]);

  private constructor(
    readonly name:
      ProtoplanetaryDiskGapKindName,

    readonly code:
      number,
  ) {}

  static fromCodeOrNull(
    code:
      number,
  ): ProtoplanetaryDiskGapKind | null {

    return (
      ProtoplanetaryDiskGapKind.values
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
  ): ProtoplanetaryDiskGapKind {

    const value =
      ProtoplanetaryDiskGapKind
        .fromCodeOrNull(
          code,
        );

    if (
      value ===
        null
    ) {
      throw new RangeError(
        `Unknown ProtoplanetaryDiskGapKind code: ${code}.`,
      );
    }

    return value;
  }
}
