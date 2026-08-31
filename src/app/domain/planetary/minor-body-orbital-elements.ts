import {
  MinorBodyKind,
  type MinorBodyKindValue,
} from './minor-body-kind';

import {
  MinorBodyOrbitConicRegime,
  type MinorBodyOrbitConicRegimeValue,
} from './minor-body-orbit-conic-regime';

const CONSISTENCY_TOLERANCE =
  1e-9;

const TWO_PI_SQUARED =
  4 * Math.PI * Math.PI;

/**
 * Point-23.2 normalized orbital geometry shared by every phase-22 minor-body
 * family.
 *
 * This is an adapter over already-frozen Ground Truth, not a new orbit
 * generator. Bound bodies retain an elliptic osculating-style orbit and expose
 * finite apoapsis/period/mean anomaly. 22.8 interstellar visitors retain their
 * hyperbolic signed semi-major axis and therefore deliberately expose null
 * apoapsis, null period and null mean anomaly.
 *
 * The common shape allows points 23.3+ to reason about geometry without
 * branching on five unrelated phase-22 model classes.
 */
export class MinorBodyOrbitalElements {

  constructor(
    readonly kind:
      MinorBodyKindValue,

    readonly proceduralId:
      string,

    readonly localDesignation:
      string,

    readonly conicRegime:
      MinorBodyOrbitConicRegimeValue,

    readonly gravitatingMassSolar:
      number,

    readonly semiMajorAxisAu:
      number,

    readonly eccentricity:
      number,

    readonly inclinationDegrees:
      number,

    readonly longitudeAscendingNodeDegrees:
      number,

    readonly argumentOfPeriapsisDegrees:
      number,

    readonly meanAnomalyDegrees:
      number | null,

    readonly periapsisAu:
      number,

    readonly apoapsisAu:
      number | null,

    readonly orbitalPeriodYears:
      number | null,
  ) {
    if (
      !MinorBodyKind
        .values
        .includes(
          kind,
        )
    ) {
      throw new RangeError(
        'kind must be a known MinorBodyKind.',
      );
    }

    if (
      !/^[0-9A-F]{32}$/
        .test(
          proceduralId,
        )
    ) {
      throw new RangeError(
        'proceduralId must be the frozen uppercase 128-bit minor-body identity.',
      );
    }

    if (
      localDesignation
        .trim()
        .length ===
      0
    ) {
      throw new RangeError(
        'localDesignation must be non-empty.',
      );
    }

    if (
      !MinorBodyOrbitConicRegime
        .values
        .includes(
          conicRegime,
        )
    ) {
      throw new RangeError(
        'conicRegime must be a known MinorBodyOrbitConicRegime.',
      );
    }

    assertPositiveFinite(
      gravitatingMassSolar,
      'gravitatingMassSolar',
    );

    if (
      !Number.isFinite(
        semiMajorAxisAu,
      ) ||
      semiMajorAxisAu ===
        0
    ) {
      throw new RangeError(
        'semiMajorAxisAu must be finite and non-zero.',
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
        'inclinationDegrees must be finite in [0, 180].',
      );
    }

    assertAngle(
      longitudeAscendingNodeDegrees,
      'longitudeAscendingNodeDegrees',
    );

    assertAngle(
      argumentOfPeriapsisDegrees,
      'argumentOfPeriapsisDegrees',
    );

    assertPositiveFinite(
      periapsisAu,
      'periapsisAu',
    );

    if (
      conicRegime ===
      MinorBodyOrbitConicRegime.ELLIPTIC
    ) {
      validateElliptic(
        gravitatingMassSolar,
        semiMajorAxisAu,
        eccentricity,
        meanAnomalyDegrees,
        periapsisAu,
        apoapsisAu,
        orbitalPeriodYears,
      );
    } else {
      validateHyperbolic(
        semiMajorAxisAu,
        eccentricity,
        meanAnomalyDegrees,
        periapsisAu,
        apoapsisAu,
        orbitalPeriodYears,
      );
    }
  }

  get isBound():
    boolean {
    return (
      this.conicRegime ===
      MinorBodyOrbitConicRegime.ELLIPTIC
    );
  }

  get isHyperbolic():
    boolean {
    return (
      this.conicRegime ===
      MinorBodyOrbitConicRegime.HYPERBOLIC
    );
  }

  get isRetrograde():
    boolean {
    return (
      this.inclinationDegrees >
      90
    );
  }

  /**
   * Specific two-body orbital energy in AU^2 / year^2.
   * Negative means bound; positive means hyperbolic/unbound.
   */
  get specificOrbitalEnergyAu2PerYear2():
    number {
    return (
      -TWO_PI_SQUARED *
      this.gravitatingMassSolar /
      (
        2 *
        this.semiMajorAxisAu
      )
    );
  }
}

function validateElliptic(
  gravitatingMassSolar:
    number,

  semiMajorAxisAu:
    number,

  eccentricity:
    number,

  meanAnomalyDegrees:
    number | null,

  periapsisAu:
    number,

  apoapsisAu:
    number | null,

  orbitalPeriodYears:
    number | null,
): void {
  if (
    semiMajorAxisAu <=
    0
  ) {
    throw new RangeError(
      'ELLIPTIC minor-body orbits require a positive semiMajorAxisAu.',
    );
  }

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
      'ELLIPTIC minor-body eccentricity must be finite in [0, 1).',
    );
  }

  if (
    meanAnomalyDegrees ===
    null
  ) {
    throw new RangeError(
      'ELLIPTIC minor-body orbits require meanAnomalyDegrees.',
    );
  }

  assertAngle(
    meanAnomalyDegrees,
    'meanAnomalyDegrees',
  );

  if (
    apoapsisAu ===
      null ||
    orbitalPeriodYears ===
      null
  ) {
    throw new RangeError(
      'ELLIPTIC minor-body orbits require finite apoapsis and orbital period.',
    );
  }

  assertPositiveFinite(
    apoapsisAu,
    'apoapsisAu',
  );

  assertPositiveFinite(
    orbitalPeriodYears,
    'orbitalPeriodYears',
  );

  const expectedPeriapsisAu =
    semiMajorAxisAu *
    (
      1 -
      eccentricity
    );

  const expectedApoapsisAu =
    semiMajorAxisAu *
    (
      1 +
      eccentricity
    );

  const expectedPeriodYears =
    Math.sqrt(
      semiMajorAxisAu **
        3 /
      gravitatingMassSolar,
    );

  if (
    !approximatelyEqual(
      periapsisAu,
      expectedPeriapsisAu,
    ) ||
    !approximatelyEqual(
      apoapsisAu,
      expectedApoapsisAu,
    ) ||
    !approximatelyEqual(
      orbitalPeriodYears,
      expectedPeriodYears,
    )
  ) {
    throw new RangeError(
      'ELLIPTIC minor-body elements must satisfy their apsidal and host-dominated Kepler relations.',
    );
  }
}

function validateHyperbolic(
  semiMajorAxisAu:
    number,

  eccentricity:
    number,

  meanAnomalyDegrees:
    number | null,

  periapsisAu:
    number,

  apoapsisAu:
    number | null,

  orbitalPeriodYears:
    number | null,
): void {
  if (
    semiMajorAxisAu >=
    0
  ) {
    throw new RangeError(
      'HYPERBOLIC minor-body trajectories require a negative semiMajorAxisAu.',
    );
  }

  if (
    !Number.isFinite(
      eccentricity,
    ) ||
    eccentricity <=
      1
  ) {
    throw new RangeError(
      'HYPERBOLIC minor-body eccentricity must be finite and greater than 1.',
    );
  }

  if (
    meanAnomalyDegrees !==
      null ||
    apoapsisAu !==
      null ||
    orbitalPeriodYears !==
      null
  ) {
    throw new RangeError(
      'HYPERBOLIC point-23.2 trajectories must not invent elliptic mean anomaly, apoapsis or orbital period.',
    );
  }

  const expectedPeriapsisAu =
    Math.abs(
      semiMajorAxisAu,
    ) *
    (
      eccentricity -
      1
    );

  if (
    !approximatelyEqual(
      periapsisAu,
      expectedPeriapsisAu,
    )
  ) {
    throw new RangeError(
      'HYPERBOLIC minor-body periapsis must satisfy q = |a| (e - 1).',
    );
  }
}

function assertAngle(
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
    value >=
      360
  ) {
    throw new RangeError(
      `${label} must be finite in [0, 360).`,
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
      `${label} must be positive and finite.`,
    );
  }
}

function approximatelyEqual(
  first:
    number,

  second:
    number,
): boolean {
  const scale =
    Math.max(
      1,
      Math.abs(
        first,
      ),
      Math.abs(
        second,
      ),
    );

  return (
    Math.abs(
      first -
      second,
    ) <=
    CONSISTENCY_TOLERANCE *
    scale
  );
}
