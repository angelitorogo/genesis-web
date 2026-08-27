/**
 * Simplified Keplerian relative orbit used by phase 16.
 *
 * Point 16.4 deliberately stores only the elements required by the later
 * circumbinary/HZ stability contracts: semi-major axis, eccentricity and a
 * reference Keplerian period. Orientation, anomaly/phase, precession and
 * N-body perturbations remain outside the V1 contract.
 */
export class StellarRelativeOrbit {

  constructor(
    readonly semiMajorAxisAu:
      number,

    readonly eccentricity:
      number,

    readonly periodYears:
      number,
  ) {
    assertPositiveFinite(
      semiMajorAxisAu,
      'semiMajorAxisAu',
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
        `eccentricity must be finite and in [0, 1): ${eccentricity}.`,
      );
    }

    assertPositiveFinite(
      periodYears,
      'periodYears',
    );
  }

  get periastronAu():
    number {

    return this
      .semiMajorAxisAu *
      (
        1 -
        this.eccentricity
      );
  }

  get apoastronAu():
    number {

    return this
      .semiMajorAxisAu *
      (
        1 +
        this.eccentricity
      );
  }

  get periodDays():
    number {

    return this
      .periodYears *
      365.25;
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
