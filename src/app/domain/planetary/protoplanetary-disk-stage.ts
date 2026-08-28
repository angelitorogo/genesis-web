export type ProtoplanetaryDiskStageName =
  | 'EMBEDDED_ACCRETION_DISK'
  | 'MASSIVE_PRIMORDIAL_DISK'
  | 'EVOLVING_PRIMORDIAL_DISK'
  | 'DISPERSING_DISK';

/**
 * Point-17.2 coarse evolutionary stage of a primordial planet-forming disk.
 *
 * These stages describe only the bulk disk envelope. Point 17.3 owns internal
 * gaps, gas/dust partition and condensation regions, while points 17.4+ own
 * protoplanets and their dynamics.
 */
export class ProtoplanetaryDiskStage {

  static readonly EMBEDDED_ACCRETION_DISK =
    new ProtoplanetaryDiskStage(
      'EMBEDDED_ACCRETION_DISK',
      1,
    );

  static readonly MASSIVE_PRIMORDIAL_DISK =
    new ProtoplanetaryDiskStage(
      'MASSIVE_PRIMORDIAL_DISK',
      2,
    );

  static readonly EVOLVING_PRIMORDIAL_DISK =
    new ProtoplanetaryDiskStage(
      'EVOLVING_PRIMORDIAL_DISK',
      3,
    );

  static readonly DISPERSING_DISK =
    new ProtoplanetaryDiskStage(
      'DISPERSING_DISK',
      4,
    );

  static readonly values:
    readonly ProtoplanetaryDiskStage[] =
      Object.freeze([
        ProtoplanetaryDiskStage.EMBEDDED_ACCRETION_DISK,
        ProtoplanetaryDiskStage.MASSIVE_PRIMORDIAL_DISK,
        ProtoplanetaryDiskStage.EVOLVING_PRIMORDIAL_DISK,
        ProtoplanetaryDiskStage.DISPERSING_DISK,
      ]);

  private constructor(
    readonly name:
      ProtoplanetaryDiskStageName,

    readonly code:
      number,
  ) {}

  static fromCodeOrNull(
    code:
      number,
  ): ProtoplanetaryDiskStage | null {

    return (
      ProtoplanetaryDiskStage.values
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
  ): ProtoplanetaryDiskStage {

    const value =
      ProtoplanetaryDiskStage
        .fromCodeOrNull(
          code,
        );

    if (
      value ===
        null
    ) {
      throw new RangeError(
        `Unknown ProtoplanetaryDiskStage code: ${code}.`,
      );
    }

    return value;
  }
}
