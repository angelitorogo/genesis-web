/**
 * Structural radial region of a galactic sector.
 *
 * Codes are part of the frozen V1 domain contract.
 */
export class GalaxyRegion {

  static readonly CENTRAL =
    new GalaxyRegion(
      1,
      'CENTRAL',
    );

  static readonly INNER =
    new GalaxyRegion(
      2,
      'INNER',
    );

  static readonly MIDDLE =
    new GalaxyRegion(
      3,
      'MIDDLE',
    );

  static readonly OUTER =
    new GalaxyRegion(
      4,
      'OUTER',
    );

  static readonly OUTSIDE_NOMINAL =
    new GalaxyRegion(
      5,
      'OUTSIDE_NOMINAL',
    );

  static readonly values:
    readonly GalaxyRegion[] =
      Object.freeze([
        GalaxyRegion.CENTRAL,
        GalaxyRegion.INNER,
        GalaxyRegion.MIDDLE,
        GalaxyRegion.OUTER,
        GalaxyRegion.OUTSIDE_NOMINAL,
      ]);

  private constructor(
    readonly code:
      number,

    readonly name:
      string,
  ) {}

  static fromCodeOrNull(
    code:
      number,
  ): GalaxyRegion | null {

    return (
      this.values.find(
        (region) =>
          region.code ===
          code,
      ) ??
      null
    );
  }

  static fromCode(
    code:
      number,
  ): GalaxyRegion {

    const region =
      this.fromCodeOrNull(
        code,
      );

    if (
      region ===
      null
    ) {
      throw new RangeError(
        `Unknown GalaxyRegion code: ${code}.`,
      );
    }

    return region;
  }

  toString():
    string {

    return this.name;
  }
}