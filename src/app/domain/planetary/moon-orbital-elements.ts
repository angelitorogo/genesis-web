/**
 * Point-21.3 planetocentric orbit for one relevant moon.
 *
 * The orbit is a frozen geometric/Keplerian baseline only. Point 21.4 owns tidal
 * evolution and locking; this object therefore carries no tidal verdict.
 */
export class MoonOrbitalElements {

  constructor(
    readonly hostPlanetOrdinal:
      number,

    readonly moonOrdinal:
      number,

    readonly semiMajorAxisPlanetRadii:
      number,

    readonly semiMajorAxisKilometers:
      number,

    readonly eccentricity:
      number,

    readonly inclinationDegrees:
      number,

    readonly orbitalPeriodDays:
      number,

    readonly rocheLimitPlanetRadii:
      number,

    readonly sourceHillSphereRadiusPlanetRadii:
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
      semiMajorAxisPlanetRadii,
      'semiMajorAxisPlanetRadii',
    );

    assertPositiveFinite(
      semiMajorAxisKilometers,
      'semiMajorAxisKilometers',
    );

    if (
      !Number.isFinite(
        eccentricity,
      ) ||
      eccentricity <
        0 ||
      eccentricity >=
        1
    ) {
      throw new RangeError(
        'eccentricity must be finite and in [0, 1).',
      );
    }

    if (
      !Number.isFinite(
        inclinationDegrees,
      ) ||
      inclinationDegrees <
        0 ||
      inclinationDegrees >
        180
    ) {
      throw new RangeError(
        'inclinationDegrees must be finite and in [0, 180].',
      );
    }

    assertPositiveFinite(
      orbitalPeriodDays,
      'orbitalPeriodDays',
    );

    assertPositiveFinite(
      rocheLimitPlanetRadii,
      'rocheLimitPlanetRadii',
    );

    assertPositiveFinite(
      sourceHillSphereRadiusPlanetRadii,
      'sourceHillSphereRadiusPlanetRadii',
    );

    if (
      semiMajorAxisPlanetRadii <=
      rocheLimitPlanetRadii
    ) {
      throw new RangeError(
        'Relevant moon orbit must remain outside its modeled Roche limit.',
      );
    }

    if (
      semiMajorAxisPlanetRadii >=
      sourceHillSphereRadiusPlanetRadii *
        0.5
    ) {
      throw new RangeError(
        'Relevant moon orbit must remain inside the conservative prograde half-Hill boundary.',
      );
    }
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
