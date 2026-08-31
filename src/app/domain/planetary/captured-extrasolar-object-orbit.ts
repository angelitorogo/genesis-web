const TWO_PI_SQUARED = 4 * Math.PI * Math.PI;
const DAYS_PER_JULIAN_YEAR = 365.25;
const TOLERANCE = 1e-9;

export class CapturedExtrasolarObjectOrbit {
  constructor(
    readonly gravitatingMassSolar: number,
    readonly semiMajorAxisAu: number,
    readonly eccentricity: number,
    readonly inclinationDegrees: number,
    readonly longitudeOfAscendingNodeDegrees: number,
    readonly argumentOfPeriapsisDegrees: number,
    readonly meanAnomalyDegrees: number,
    readonly periapsisAu: number,
    readonly apoapsisAu: number,
    readonly periodYears: number,
  ) {
    for (const [name, value] of [
      ['gravitatingMassSolar', gravitatingMassSolar],
      ['semiMajorAxisAu', semiMajorAxisAu],
      ['periapsisAu', periapsisAu],
      ['apoapsisAu', apoapsisAu],
      ['periodYears', periodYears],
    ] as const) {
      if (!Number.isFinite(value) || value <= 0) {
        throw new RangeError(`${name} must be positive and finite.`);
      }
    }

    if (!Number.isFinite(eccentricity) || eccentricity < 0 || eccentricity >= 1) {
      throw new RangeError('Captured extrasolar objects must be bound with eccentricity inside [0,1).');
    }

    if (!Number.isFinite(inclinationDegrees) || inclinationDegrees < 0 || inclinationDegrees > 180) {
      throw new RangeError('inclinationDegrees must be inside [0,180].');
    }

    for (const [name, value] of [
      ['longitudeOfAscendingNodeDegrees', longitudeOfAscendingNodeDegrees],
      ['argumentOfPeriapsisDegrees', argumentOfPeriapsisDegrees],
      ['meanAnomalyDegrees', meanAnomalyDegrees],
    ] as const) {
      if (!Number.isFinite(value) || value < 0 || value >= 360) {
        throw new RangeError(`${name} must be inside [0,360).`);
      }
    }

    if (relativeError(periapsisAu, semiMajorAxisAu * (1 - eccentricity)) > TOLERANCE) {
      throw new RangeError('Captured periapsis must satisfy q = a (1 - e).');
    }

    if (relativeError(apoapsisAu, semiMajorAxisAu * (1 + eccentricity)) > TOLERANCE) {
      throw new RangeError('Captured apoapsis must satisfy Q = a (1 + e).');
    }

    const expectedPeriodYears = Math.sqrt(
      semiMajorAxisAu ** 3 / gravitatingMassSolar,
    );

    if (relativeError(periodYears, expectedPeriodYears) > TOLERANCE) {
      throw new RangeError('Captured orbital period must satisfy the host-dominated Kepler relation.');
    }
  }

  get periodDays(): number {
    return this.periodYears * DAYS_PER_JULIAN_YEAR;
  }

  get isBound(): boolean {
    return true;
  }

  get specificOrbitalEnergyAu2PerYear2(): number {
    return -TWO_PI_SQUARED * this.gravitatingMassSolar / (2 * this.semiMajorAxisAu);
  }
}

function relativeError(first: number, second: number): number {
  return Math.abs(first - second) / Math.max(1, Math.abs(first), Math.abs(second));
}
