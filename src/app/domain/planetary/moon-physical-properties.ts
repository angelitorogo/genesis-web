/**
 * Point-21.3 bulk physical state for one individually materialized relevant moon.
 *
 * No atmosphere, water, geology, tides, habitability, designation or MoonSeed is
 * owned here. Those remain later 21.x contracts.
 */
export class MoonPhysicalProperties {

  constructor(
    readonly hostPlanetOrdinal:
      number,

    readonly moonOrdinal:
      number,

    readonly massEarth:
      number,

    readonly radiusEarth:
      number,

    readonly meanDensityGramsPerCubicCentimeter:
      number,

    readonly surfaceGravityEarth:
      number,
  ) {
    assertPositiveInteger(
      hostPlanetOrdinal,
      'hostPlanetOrdinal',
    );

    assertPositiveInteger(
      moonOrdinal,
      'moonOrdinal',
    );

    assertPositiveFinite(
      massEarth,
      'massEarth',
    );

    assertPositiveFinite(
      radiusEarth,
      'radiusEarth',
    );

    assertPositiveFinite(
      meanDensityGramsPerCubicCentimeter,
      'meanDensityGramsPerCubicCentimeter',
    );

    assertPositiveFinite(
      surfaceGravityEarth,
      'surfaceGravityEarth',
    );
  }
}

function assertPositiveInteger(
  value:
    number,

  propertyName:
    string,
): void {

  if (
    !Number.isInteger(
      value,
    ) ||
    value <=
      0
  ) {
    throw new RangeError(
      `${propertyName} must be a positive integer: ${value}.`,
    );
  }
}

function assertPositiveFinite(
  value:
    number,

  propertyName:
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
      `${propertyName} must be finite and greater than 0: ${value}.`,
    );
  }
}
