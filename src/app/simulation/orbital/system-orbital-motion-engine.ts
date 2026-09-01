export interface SystemOrbitalMotionDefinition {
  readonly id:
    string;

  readonly semiMajorAxisAu:
    number;

  readonly eccentricity:
    number;

  readonly periodDays:
    number;

  readonly rotationDegrees:
    number;

  readonly inclinationDegrees:
    number;

  readonly longitudeAscendingNodeDegrees?:
    number;

  readonly argumentOfPeriapsisDegrees?:
    number;

  readonly epochMeanAnomalyDegrees:
    number;
}

export interface SystemOrbitalPositionAu {
  readonly xAu:
    number;

  readonly yAu:
    number;

  readonly zAu:
    number;
}

const TWO_PI =
  Math.PI * 2;

const KEPLER_SOLVER_ITERATIONS =
  10;

/**
 * Point-24.3 absolute-time Keplerian orbital projector.
 *
 * The engine consumes periods/eccentricities already frozen by phases 16/18
 * and, when supplied, the full Ω/i/ω orientation already frozen by phases
 * 22/23 for bound minor bodies.
 * It never integrates frame deltas. A body position is a pure function of the
 * requested simulation time, so the same instant produces the same position
 * regardless of whether the browser rendered 30, 60 or 144 frames beforehand.
 *
 * Orientation/epoch anomaly remain presentation coordinates because phase
 * 16.4/18.3 deliberately did not freeze an absolute orbital epoch. The engine
 * therefore does not promote those presentation values into Ground Truth.
 */
export class SystemOrbitalMotionEngine {

  private constructor() {}

  static positionAtSimulationDay(
    motion:
      SystemOrbitalMotionDefinition,

    simulationDay:
      number,
  ): SystemOrbitalPositionAu {

    assertMotion(
      motion,
    );

    if (
      !Number.isFinite(
        simulationDay,
      )
    ) {
      throw new RangeError(
        `simulationDay must be finite: ${simulationDay}.`,
      );
    }

    const epochMeanAnomalyRadians =
      degreesToRadians(
        normalizeDegrees(
          motion.epochMeanAnomalyDegrees,
        ),
      );

    const elapsedCycles =
      simulationDay /
      motion.periodDays;

    const meanAnomalyRadians =
      normalizeRadians(
        epochMeanAnomalyRadians +
        elapsedCycles *
          TWO_PI,
      );

    const eccentricAnomalyRadians =
      solveEccentricAnomaly(
        meanAnomalyRadians,
        motion.eccentricity,
      );

    const semiMinorAxisAu =
      motion.semiMajorAxisAu *
      Math.sqrt(
        1 -
        motion.eccentricity **
          2,
      );

    const localXAu =
      motion.semiMajorAxisAu *
      (
        Math.cos(
          eccentricAnomalyRadians,
        ) -
        motion.eccentricity
      );

    const localZAu =
      semiMinorAxisAu *
      Math.sin(
        eccentricAnomalyRadians,
      );

    if (
      motion.longitudeAscendingNodeDegrees !==
        undefined &&
      motion.argumentOfPeriapsisDegrees !==
        undefined
    ) {
      return rotateOrbitVectorWithNodeAndPeriapsis(
        localXAu,
        localZAu,
        motion.longitudeAscendingNodeDegrees,
        motion.inclinationDegrees,
        motion.argumentOfPeriapsisDegrees,
      );
    }

    return rotateOrbitVector(
      localXAu,
      localZAu,
      motion.rotationDegrees,
      motion.inclinationDegrees,
    );
  }

  static sampleClosedOrbitPath(
    motion:
      SystemOrbitalMotionDefinition,

    sampleCount:
      number,
  ):
    readonly SystemOrbitalPositionAu[] {

    assertMotion(
      motion,
    );

    if (
      !Number.isInteger(
        sampleCount,
      ) ||
      sampleCount <
        4
    ) {
      throw new RangeError(
        `sampleCount must be an integer >= 4: ${sampleCount}.`,
      );
    }

    const semiMinorAxisAu =
      motion.semiMajorAxisAu *
      Math.sqrt(
        1 -
        motion.eccentricity **
          2,
      );

    return Object.freeze(
      Array.from(
        {
          length:
            sampleCount,
        },
        (
          _,
          index,
        ) => {
          const eccentricAnomalyRadians =
            TWO_PI *
            index /
            sampleCount;

          const localXAu =
            motion.semiMajorAxisAu *
            (
              Math.cos(
                eccentricAnomalyRadians,
              ) -
              motion.eccentricity
            );

          const localZAu =
            semiMinorAxisAu *
            Math.sin(
              eccentricAnomalyRadians,
            );

          return motion.longitudeAscendingNodeDegrees !==
              undefined &&
            motion.argumentOfPeriapsisDegrees !==
              undefined
            ? rotateOrbitVectorWithNodeAndPeriapsis(
                localXAu,
                localZAu,
                motion.longitudeAscendingNodeDegrees,
                motion.inclinationDegrees,
                motion.argumentOfPeriapsisDegrees,
              )
            : rotateOrbitVector(
                localXAu,
                localZAu,
                motion.rotationDegrees,
                motion.inclinationDegrees,
              );
        },
      ),
    );
  }
}

function solveEccentricAnomaly(
  meanAnomalyRadians:
    number,

  eccentricity:
    number,
): number {

  let eccentricAnomaly =
    eccentricity <
      0.8
      ? meanAnomalyRadians
      : Math.PI;

  for (
    let iteration = 0;
    iteration <
      KEPLER_SOLVER_ITERATIONS;
    iteration += 1
  ) {
    const residual =
      eccentricAnomaly -
      eccentricity *
        Math.sin(
          eccentricAnomaly,
        ) -
      meanAnomalyRadians;

    const derivative =
      1 -
      eccentricity *
        Math.cos(
          eccentricAnomaly,
        );

    eccentricAnomaly -=
      residual /
      derivative;
  }

  return eccentricAnomaly;
}

function rotateOrbitVectorWithNodeAndPeriapsis(
  localXAu:
    number,

  localZAu:
    number,

  longitudeAscendingNodeDegrees:
    number,

  inclinationDegrees:
    number,

  argumentOfPeriapsisDegrees:
    number,
): SystemOrbitalPositionAu {

  const nodeRadians =
    degreesToRadians(
      longitudeAscendingNodeDegrees,
    );

  const inclinationRadians =
    degreesToRadians(
      inclinationDegrees,
    );

  const periapsisRadians =
    degreesToRadians(
      argumentOfPeriapsisDegrees,
    );

  const cosPeriapsis =
    Math.cos(
      periapsisRadians,
    );

  const sinPeriapsis =
    Math.sin(
      periapsisRadians,
    );

  const xPeriapsis =
    localXAu *
      cosPeriapsis -
    localZAu *
      sinPeriapsis;

  const zPeriapsis =
    localXAu *
      sinPeriapsis +
    localZAu *
      cosPeriapsis;

  const xInclined =
    xPeriapsis;

  const yInclined =
    -zPeriapsis *
    Math.sin(
      inclinationRadians,
    );

  const zInclined =
    zPeriapsis *
    Math.cos(
      inclinationRadians,
    );

  const cosNode =
    Math.cos(
      nodeRadians,
    );

  const sinNode =
    Math.sin(
      nodeRadians,
    );

  return Object.freeze({
    xAu:
      xInclined *
        cosNode -
      zInclined *
        sinNode,
    yAu:
      yInclined,
    zAu:
      xInclined *
        sinNode +
      zInclined *
        cosNode,
  });
}

function rotateOrbitVector(
  localXAu:
    number,

  localZAu:
    number,

  rotationDegrees:
    number,

  inclinationDegrees:
    number,
): SystemOrbitalPositionAu {

  const rotationRadians =
    degreesToRadians(
      rotationDegrees,
    );

  const inclinationRadians =
    degreesToRadians(
      inclinationDegrees,
    );

  const x1 =
    localXAu;

  const y1 =
    -localZAu *
    Math.sin(
      inclinationRadians,
    );

  const z1 =
    localZAu *
    Math.cos(
      inclinationRadians,
    );

  const cosRotation =
    Math.cos(
      rotationRadians,
    );

  const sinRotation =
    Math.sin(
      rotationRadians,
    );

  return Object.freeze({
    xAu:
      x1 *
        cosRotation -
      z1 *
        sinRotation,
    yAu:
      y1,
    zAu:
      x1 *
        sinRotation +
      z1 *
        cosRotation,
  });
}

function assertMotion(
  motion:
    SystemOrbitalMotionDefinition,
): void {

  if (
    motion.id.length ===
    0
  ) {
    throw new RangeError(
      'System orbital motion id cannot be empty.',
    );
  }

  const hasNode =
    motion.longitudeAscendingNodeDegrees !==
    undefined;

  const hasPeriapsisArgument =
    motion.argumentOfPeriapsisDegrees !==
    undefined;

  if (
    hasNode !==
    hasPeriapsisArgument
  ) {
    throw new RangeError(
      'Full orbital orientation requires both longitudeAscendingNodeDegrees and argumentOfPeriapsisDegrees.',
    );
  }

  if (
    hasNode &&
    (
      !Number.isFinite(
        motion.longitudeAscendingNodeDegrees ??
          Number.NaN,
      ) ||
      !Number.isFinite(
        motion.argumentOfPeriapsisDegrees ??
          Number.NaN,
      )
    )
  ) {
    throw new RangeError(
      'Full orbital orientation angles must be finite.',
    );
  }

  assertPositiveFinite(
    motion.semiMajorAxisAu,
    'semiMajorAxisAu',
  );

  assertPositiveFinite(
    motion.periodDays,
    'periodDays',
  );

  if (
    !Number.isFinite(
      motion.eccentricity,
    ) ||
    motion.eccentricity <
      0 ||
    motion.eccentricity >=
      1
  ) {
    throw new RangeError(
      `eccentricity must be finite and in [0, 1): ${motion.eccentricity}.`,
    );
  }

  assertFinite(
    motion.rotationDegrees,
    'rotationDegrees',
  );
  assertFinite(
    motion.inclinationDegrees,
    'inclinationDegrees',
  );
  assertFinite(
    motion.epochMeanAnomalyDegrees,
    'epochMeanAnomalyDegrees',
  );
}

function assertPositiveFinite(
  value:
    number,

  name:
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
      `${name} must be finite and greater than 0: ${value}.`,
    );
  }
}

function assertFinite(
  value:
    number,

  name:
    string,
): void {

  if (
    !Number.isFinite(
      value,
    )
  ) {
    throw new RangeError(
      `${name} must be finite: ${value}.`,
    );
  }
}

function degreesToRadians(
  value:
    number,
): number {

  return value *
    Math.PI /
    180;
}

function normalizeDegrees(
  value:
    number,
): number {

  const normalized =
    value %
    360;

  return normalized <
    0
    ? normalized +
        360
    : normalized;
}

function normalizeRadians(
  value:
    number,
): number {

  const normalized =
    value %
    TWO_PI;

  return normalized <
    0
    ? normalized +
        TWO_PI
    : normalized;
}
