export type SystemSceneAsteroidBeltRegionV1 =
  | 'INNER'
  | 'OUTER';

export interface SystemSceneAsteroidBeltBandInputV1 {
  readonly region:
    SystemSceneAsteroidBeltRegionV1;

  readonly innerEdgeAu:
    number;

  readonly outerEdgeAu:
    number;

  readonly peakAu:
    number;

  readonly populationIndex01:
    number;

  readonly innerRadiusScene:
    number;

  readonly outerRadiusScene:
    number;

  readonly peakRadiusScene:
    number;
}

export interface SystemSceneAsteroidBeltBandPresentationV1 {
  readonly version:
    1;

  readonly region:
    SystemSceneAsteroidBeltRegionV1;

  readonly innerEdgeAu:
    number;

  readonly outerEdgeAu:
    number;

  readonly peakAu:
    number;

  readonly populationIndex01:
    number;

  readonly innerRadiusScene:
    number;

  readonly outerRadiusScene:
    number;

  readonly peakRadiusScene:
    number;

  readonly colorHex:
    string;

  readonly opacity:
    number;

  readonly peakOpacity:
    number;

  readonly boundaryOpacity:
    number;
}

/**
 * Point-25.11 read-only visual projection of one existing phase-22.2 belt.
 *
 * The AU edges/peak and populationIndex01 are copied exactly from the frozen
 * phase-22.2 population profile. Only opacity/color are presentation choices.
 * No synthetic asteroid count, particle position or extra belt is created.
 */
export function buildSystemSceneAsteroidBeltBandPresentationV1(
  input:
    SystemSceneAsteroidBeltBandInputV1,
): SystemSceneAsteroidBeltBandPresentationV1 {

  assertPositiveFinite(
    input.innerEdgeAu,
    'innerEdgeAu',
  );
  assertPositiveFinite(
    input.outerEdgeAu,
    'outerEdgeAu',
  );
  assertPositiveFinite(
    input.peakAu,
    'peakAu',
  );
  assertPositiveFinite(
    input.innerRadiusScene,
    'innerRadiusScene',
  );
  assertPositiveFinite(
    input.outerRadiusScene,
    'outerRadiusScene',
  );
  assertPositiveFinite(
    input.peakRadiusScene,
    'peakRadiusScene',
  );
  assertUnit(
    input.populationIndex01,
    'populationIndex01',
  );

  if (
    input.innerEdgeAu >=
      input.outerEdgeAu ||
    input.peakAu <
      input.innerEdgeAu ||
    input.peakAu >
      input.outerEdgeAu
  ) {
    throw new RangeError(
      'Asteroid-belt physical edges must be ordered and contain peakAu.',
    );
  }

  if (
    input.innerRadiusScene >=
      input.outerRadiusScene ||
    input.peakRadiusScene <
      input.innerRadiusScene ||
    input.peakRadiusScene >
      input.outerRadiusScene
  ) {
    throw new RangeError(
      'Asteroid-belt scene radii must preserve the physical radial ordering.',
    );
  }

  const population =
    input.populationIndex01;

  return Object.freeze({
    version:
      1 as const,
    region:
      input.region,
    innerEdgeAu:
      input.innerEdgeAu,
    outerEdgeAu:
      input.outerEdgeAu,
    peakAu:
      input.peakAu,
    populationIndex01:
      population,
    innerRadiusScene:
      input.innerRadiusScene,
    outerRadiusScene:
      input.outerRadiusScene,
    peakRadiusScene:
      input.peakRadiusScene,
    colorHex:
      input.region ===
        'INNER'
        ? '#89949D'
        : '#8EA5C8',
    opacity:
      0.045 +
      0.050 *
        population,
    peakOpacity:
      0.070 +
      0.080 *
        population,
    boundaryOpacity:
      0.120 +
      0.080 *
        population,
  });
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

function assertUnit(
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
      `${label} must belong to [0, 1].`,
    );
  }
}
