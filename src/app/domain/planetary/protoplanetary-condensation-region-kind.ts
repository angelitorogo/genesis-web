export type ProtoplanetaryCondensationRegionKindName =
  | 'DUST_SUBLIMATION_ZONE'
  | 'REFRACTORY_SOLIDS'
  | 'ROCKY_SILICATE_SOLIDS'
  | 'WATER_ICE_RICH_SOLIDS'
  | 'CO2_ICE_RICH_SOLIDS'
  | 'VOLATILE_ICE_RICH_SOLIDS';

/**
 * Point-17.3 coarse equilibrium condensation regime in the radial disk.
 *
 * The taxonomy is intentionally broad. It is not a chemistry network and it
 * does not assign a final composition to a planet; it only marks which broad
 * solid reservoirs can remain condensed at a given disk temperature.
 */
export class ProtoplanetaryCondensationRegionKind {

  static readonly DUST_SUBLIMATION_ZONE =
    new ProtoplanetaryCondensationRegionKind(
      'DUST_SUBLIMATION_ZONE',
      1,
      0,
    );

  static readonly REFRACTORY_SOLIDS =
    new ProtoplanetaryCondensationRegionKind(
      'REFRACTORY_SOLIDS',
      2,
      0.18,
    );

  static readonly ROCKY_SILICATE_SOLIDS =
    new ProtoplanetaryCondensationRegionKind(
      'ROCKY_SILICATE_SOLIDS',
      3,
      0.42,
    );

  static readonly WATER_ICE_RICH_SOLIDS =
    new ProtoplanetaryCondensationRegionKind(
      'WATER_ICE_RICH_SOLIDS',
      4,
      0.72,
    );

  static readonly CO2_ICE_RICH_SOLIDS =
    new ProtoplanetaryCondensationRegionKind(
      'CO2_ICE_RICH_SOLIDS',
      5,
      0.90,
    );

  static readonly VOLATILE_ICE_RICH_SOLIDS =
    new ProtoplanetaryCondensationRegionKind(
      'VOLATILE_ICE_RICH_SOLIDS',
      6,
      1,
    );

  static readonly values:
    readonly ProtoplanetaryCondensationRegionKind[] =
      Object.freeze([
        ProtoplanetaryCondensationRegionKind.DUST_SUBLIMATION_ZONE,
        ProtoplanetaryCondensationRegionKind.REFRACTORY_SOLIDS,
        ProtoplanetaryCondensationRegionKind.ROCKY_SILICATE_SOLIDS,
        ProtoplanetaryCondensationRegionKind.WATER_ICE_RICH_SOLIDS,
        ProtoplanetaryCondensationRegionKind.CO2_ICE_RICH_SOLIDS,
        ProtoplanetaryCondensationRegionKind.VOLATILE_ICE_RICH_SOLIDS,
      ]);

  private constructor(
    readonly name:
      ProtoplanetaryCondensationRegionKindName,

    readonly code:
      number,

    readonly condensableSolidFraction01:
      number,
  ) {}

  static fromCodeOrNull(
    code:
      number,
  ): ProtoplanetaryCondensationRegionKind | null {

    return (
      ProtoplanetaryCondensationRegionKind.values
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
  ): ProtoplanetaryCondensationRegionKind {

    const value =
      ProtoplanetaryCondensationRegionKind
        .fromCodeOrNull(
          code,
        );

    if (
      value ===
        null
    ) {
      throw new RangeError(
        `Unknown ProtoplanetaryCondensationRegionKind code: ${code}.`,
      );
    }

    return value;
  }
}
