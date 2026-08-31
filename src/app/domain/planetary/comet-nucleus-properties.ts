const CONSISTENCY_TOLERANCE =
  1e-12;

/**
 * Point-22.5 first-order physical description of a frozen cometary nucleus.
 *
 * These are nucleus properties only. Orbital family/period and activity as a
 * function of heliocentric distance are intentionally absent until point 22.6.
 */
export class CometNucleusProperties {

  constructor(
    readonly cometOrdinal:
      number,

    readonly diameterKilometers:
      number,

    readonly iceFraction01:
      number,

    readonly dustFraction01:
      number,

    readonly porosityIndex01:
      number,

    readonly bulkDensityGramsPerCubicCentimeter:
      number,

    readonly geometricAlbedo:
      number,

    readonly volatileRichnessIndex01:
      number,
  ) {
    if (
      !Number.isInteger(
        cometOrdinal,
      ) ||
      cometOrdinal <=
        0
    ) {
      throw new RangeError(
        'cometOrdinal must be a positive integer.',
      );
    }

    assertPositiveFinite(
      diameterKilometers,
      'diameterKilometers',
    );

    assertUnitInterval(
      iceFraction01,
      'iceFraction01',
    );

    assertUnitInterval(
      dustFraction01,
      'dustFraction01',
    );

    if (
      Math.abs(
        iceFraction01 +
          dustFraction01 -
          1,
      ) >
      CONSISTENCY_TOLERANCE
    ) {
      throw new RangeError(
        'Comet nucleus ice and dust fractions must sum to 1.',
      );
    }

    assertUnitInterval(
      porosityIndex01,
      'porosityIndex01',
    );

    assertPositiveFinite(
      bulkDensityGramsPerCubicCentimeter,
      'bulkDensityGramsPerCubicCentimeter',
    );

    assertUnitInterval(
      geometricAlbedo,
      'geometricAlbedo',
    );

    assertUnitInterval(
      volatileRichnessIndex01,
      'volatileRichnessIndex01',
    );
  }
}

function assertPositiveFinite(
  value:
    number,

  label:
    string,
): void {

  if (
    !Number.isFinite(
      value,
    ) ||
    value <=
      0
  ) {
    throw new RangeError(
      `${label} must be a positive finite number.`,
    );
  }
}

function assertUnitInterval(
  value:
    number,

  label:
    string,
): void {

  if (
    !Number.isFinite(
      value,
    ) ||
    value <
      0 ||
    value >
      1
  ) {
    throw new RangeError(
      `${label} must be inside [0, 1].`,
    );
  }
}
