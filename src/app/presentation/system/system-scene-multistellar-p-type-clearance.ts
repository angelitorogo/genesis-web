export const SystemSceneMultistellarPTypeConsistencyRegimeV51 =
  Object.freeze({
    CONSISTENT:
      'CONSISTENT',

    LEGACY_PLANET_INSIDE_STABILITY_FLOOR:
      'LEGACY_PLANET_INSIDE_STABILITY_FLOOR',

    STELLAR_EXCURSION_REACHES_STABILITY_FLOOR:
      'STELLAR_EXCURSION_REACHES_STABILITY_FLOOR',

    NO_STABILITY_REFERENCE:
      'NO_STABILITY_REFERENCE',
  } as const);

export type SystemSceneMultistellarPTypeConsistencyRegimeV51 =
  typeof SystemSceneMultistellarPTypeConsistencyRegimeV51[
    keyof typeof SystemSceneMultistellarPTypeConsistencyRegimeV51
  ];

export interface SystemSceneMultistellarPTypeClearanceInputV51 {
  readonly architecture:
    'BINARY' |
    'TRIPLE';

  readonly stellarOuterExcursionAu:
    number;

  readonly circumbinaryStabilityInnerEdgeAu:
    number | null;

  readonly nearestPlanetPeriapsisAu:
    number | null;

  readonly uncompressedStellarCenterEnvelopeScene:
    number;

  readonly projectedStabilityInnerEdgeScene:
    number | null;

  readonly projectedNearestPlanetPeriapsisScene:
    number | null;
}

export interface SystemSceneMultistellarPTypeClearanceV51 {
  readonly version:
    5.1;

  readonly architecture:
    'BINARY' |
    'TRIPLE';

  readonly consistencyRegime:
    SystemSceneMultistellarPTypeConsistencyRegimeV51;

  readonly stellarOuterExcursionAu:
    number;

  readonly circumbinaryStabilityInnerEdgeAu:
    number | null;

  readonly nearestPlanetPeriapsisAu:
    number | null;

  readonly physicalStabilityClearanceAu:
    number | null;

  readonly physicalPlanetClearanceAu:
    number | null;

  readonly visualClearanceBoundaryScene:
    number | null;

  readonly uncompressedStellarCenterEnvelopeScene:
    number;

  readonly targetStellarCenterEnvelopeScene:
    number | null;

  readonly innerPairPresentationScale:
    number;

  readonly presentationCompressed:
    boolean;
}

const VALUE_TOLERANCE =
  1e-9;

/**
 * Renderer-only V5.1 consistency bridge for P-type systems.
 *
 * Scientific AU values are inspected, never modified. The renderer uses the
 * authoritative P-type stability floor and nearest planetary periapsis only to
 * decide how much scene-space should be reserved for the A-B stellar motion.
 * If the old/global projection makes the stellar-centre envelope consume the
 * planetary region, the inner stellar motion is compacted uniformly for
 * presentation. Star A/B keep their mass-ratio geometry, eccentricity and
 * phase; planets, HZ and all authoritative orbital elements remain untouched.
 */
export function buildSystemSceneMultistellarPTypeClearanceV51(
  input:
    SystemSceneMultistellarPTypeClearanceInputV51,
): SystemSceneMultistellarPTypeClearanceV51 {

  assertNonNegativeFinite(
    input.stellarOuterExcursionAu,
    'stellarOuterExcursionAu',
  );

  assertNonNegativeFinite(
    input.uncompressedStellarCenterEnvelopeScene,
    'uncompressedStellarCenterEnvelopeScene',
  );

  const stabilityInnerAu =
    positiveFiniteOrNull(
      input.circumbinaryStabilityInnerEdgeAu,
    );

  const planetPeriapsisAu =
    positiveFiniteOrNull(
      input.nearestPlanetPeriapsisAu,
    );

  const stabilityInnerScene =
    positiveFiniteOrNull(
      input.projectedStabilityInnerEdgeScene,
    );

  const planetPeriapsisScene =
    positiveFiniteOrNull(
      input.projectedNearestPlanetPeriapsisScene,
    );

  const physicalStabilityClearanceAu =
    stabilityInnerAu === null
      ? null
      : stabilityInnerAu -
        input.stellarOuterExcursionAu;

  const physicalPlanetClearanceAu =
    planetPeriapsisAu === null
      ? null
      : planetPeriapsisAu -
        input.stellarOuterExcursionAu;

  const consistencyRegime =
    resolveConsistencyRegime(
      input.stellarOuterExcursionAu,
      stabilityInnerAu,
      planetPeriapsisAu,
    );

  const boundaryCandidates =
    [
      stabilityInnerScene,
      planetPeriapsisScene,
    ].filter(
      (
        value,
      ): value is number =>
        value !== null,
    );

  const visualClearanceBoundaryScene =
    boundaryCandidates.length ===
      0
      ? null
      : Math.min(
          ...boundaryCandidates,
        );

  if (
    visualClearanceBoundaryScene ===
      null ||
    input.uncompressedStellarCenterEnvelopeScene <=
      Number.EPSILON
  ) {
    return Object.freeze({
      version:
        5.1 as const,
      architecture:
        input.architecture,
      consistencyRegime,
      stellarOuterExcursionAu:
        input.stellarOuterExcursionAu,
      circumbinaryStabilityInnerEdgeAu:
        stabilityInnerAu,
      nearestPlanetPeriapsisAu:
        planetPeriapsisAu,
      physicalStabilityClearanceAu,
      physicalPlanetClearanceAu,
      visualClearanceBoundaryScene,
      uncompressedStellarCenterEnvelopeScene:
        input.uncompressedStellarCenterEnvelopeScene,
      targetStellarCenterEnvelopeScene:
        null,
      innerPairPresentationScale:
        1,
      presentationCompressed:
        false,
    });
  }

  /*
   * Reserve most of the first P-type annulus for planets and halo clearance.
   * 36% leaves the stellar pair clearly readable while preventing the old
   * adaptive projection from visually placing A/B on top of the first planet.
   */
  const targetStellarCenterEnvelopeScene =
    visualClearanceBoundaryScene *
    0.36;

  const innerPairPresentationScale =
    clamp(
      targetStellarCenterEnvelopeScene /
        input.uncompressedStellarCenterEnvelopeScene,
      1e-6,
      1,
    );

  return Object.freeze({
    version:
      5.1 as const,
    architecture:
      input.architecture,
    consistencyRegime,
    stellarOuterExcursionAu:
      input.stellarOuterExcursionAu,
    circumbinaryStabilityInnerEdgeAu:
      stabilityInnerAu,
    nearestPlanetPeriapsisAu:
      planetPeriapsisAu,
    physicalStabilityClearanceAu,
    physicalPlanetClearanceAu,
    visualClearanceBoundaryScene,
    uncompressedStellarCenterEnvelopeScene:
      input.uncompressedStellarCenterEnvelopeScene,
    targetStellarCenterEnvelopeScene,
    innerPairPresentationScale,
    presentationCompressed:
      innerPairPresentationScale <
      1 -
        VALUE_TOLERANCE,
  });
}

function resolveConsistencyRegime(
  stellarOuterExcursionAu:
    number,

  stabilityInnerAu:
    number | null,

  planetPeriapsisAu:
    number | null,
): SystemSceneMultistellarPTypeConsistencyRegimeV51 {

  if (
    stabilityInnerAu ===
      null
  ) {
    return SystemSceneMultistellarPTypeConsistencyRegimeV51
      .NO_STABILITY_REFERENCE;
  }

  if (
    stellarOuterExcursionAu >=
      stabilityInnerAu -
        VALUE_TOLERANCE
  ) {
    return SystemSceneMultistellarPTypeConsistencyRegimeV51
      .STELLAR_EXCURSION_REACHES_STABILITY_FLOOR;
  }

  if (
    planetPeriapsisAu !==
      null &&
    planetPeriapsisAu <
      stabilityInnerAu -
        VALUE_TOLERANCE
  ) {
    return SystemSceneMultistellarPTypeConsistencyRegimeV51
      .LEGACY_PLANET_INSIDE_STABILITY_FLOOR;
  }

  return SystemSceneMultistellarPTypeConsistencyRegimeV51
    .CONSISTENT;
}

function positiveFiniteOrNull(
  value:
    number | null,
): number | null {

  return value !==
      null &&
    Number.isFinite(
      value,
    ) &&
    value >
      0
      ? value
      : null;
}

function assertNonNegativeFinite(
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
      0
  ) {
    throw new RangeError(
      `${label} must be finite and non-negative: ${String(value)}.`,
    );
  }
}

function clamp(
  value:
    number,

  minimum:
    number,

  maximum:
    number,
): number {

  return Math.min(
    maximum,
    Math.max(
      minimum,
      value,
    ),
  );
}
