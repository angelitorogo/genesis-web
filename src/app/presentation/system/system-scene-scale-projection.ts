export const SystemSceneScaleProjectionMode =
  Object.freeze({
    LINEAR_FIT:
      'LINEAR_FIT',

    SINGLE_ADAPTIVE_LOG_V1:
      'SINGLE_ADAPTIVE_LOG_V1',

    BINARY_ADAPTIVE_LOG_V1:
      'BINARY_ADAPTIVE_LOG_V1',

    TRIPLE_ADAPTIVE_LOG_V1:
      'TRIPLE_ADAPTIVE_LOG_V1',

    TRIPLE_HIERARCHICAL_V1:
      'TRIPLE_HIERARCHICAL_V1',
  } as const);

export type SystemSceneScaleProjectionMode =
  typeof SystemSceneScaleProjectionMode[
    keyof typeof SystemSceneScaleProjectionMode
  ];

export const SystemSceneProjectionSpace =
  Object.freeze({
    GLOBAL:
      'GLOBAL',

    TRIPLE_OUTER:
      'TRIPLE_OUTER',

    TRIPLE_LOCAL:
      'TRIPLE_LOCAL',
  } as const);

export type SystemSceneProjectionSpace =
  typeof SystemSceneProjectionSpace[
    keyof typeof SystemSceneProjectionSpace
  ];

export interface SystemSceneRadialScaleSnapshot {
  readonly outerRadiusAu:
    number;

  readonly targetOuterRadiusScene:
    number;

  readonly innerReferenceAu:
    number | null;

  readonly innerReferenceScene:
    number | null;

  readonly logarithmicStrength:
    number;
}

export interface SystemSceneTripleHierarchyScaleSnapshot {
  readonly outer:
    SystemSceneRadialScaleSnapshot;

  readonly local:
    SystemSceneRadialScaleSnapshot;
}

export interface SystemSceneScaleSnapshot {
  readonly outerRadiusAu:
    number;

  /**
   * Legacy linear-equivalent scale retained for compatibility/debugging.
   * Point 24.5 consumers must use the projection helpers below when the
   * projection mode is adaptive.
   */
  readonly orbitScaleScenePerAu:
    number;

  readonly targetOuterRadiusScene:
    number;

  readonly projectionMode?:
    SystemSceneScaleProjectionMode;

  readonly innerReferenceAu?:
    number | null;

  readonly innerReferenceScene?:
    number | null;

  readonly logarithmicStrength?:
    number;

  readonly tripleHierarchy?:
    SystemSceneTripleHierarchyScaleSnapshot | null;
}

export interface SystemSceneScaleVector {
  readonly x:
    number;

  readonly y:
    number;

  readonly z:
    number;
}

export interface SingleAdaptiveSystemScaleInput {
  readonly outerRadiusAu:
    number;

  readonly targetOuterRadiusScene:
    number;

  readonly innerPeriapsisAu:
    number | null;

  readonly starRadiusScene:
    number;

  readonly maxPlanetRadiusScene:
    number;
}

export interface MultipleAdaptiveSystemScaleInput {
  readonly architecture:
    'BINARY' |
    'TRIPLE';

  readonly outerRadiusAu:
    number;

  readonly targetOuterRadiusScene:
    number;

  readonly innerBinaryPeriapsisAu:
    number | null;

  readonly primaryStarRadiusScene:
    number;

  readonly secondaryStarRadiusScene:
    number;
}

export interface TripleHierarchicalSystemScaleInput {
  readonly outerRadiusAu:
    number;

  readonly targetOuterRadiusScene:
    number;

  readonly innerBinaryPeriapsisAu:
    number;

  readonly innerBinaryApoapsisAu:
    number;

  readonly localPlanetOuterRadiusAu:
    number;

  readonly outerRelativePeriapsisAu:
    number;

  readonly outerRelativeApoapsisAu:
    number;

  readonly primaryStarRadiusScene:
    number;

  readonly secondaryStarRadiusScene:
    number;

  readonly tertiaryStarRadiusScene:
    number;

  readonly maxPlanetRadiusScene:
    number;

  readonly innerPairOuterScale:
    number;

  readonly tertiaryOuterScale:
    number;
}

const SINGLE_V1_LOGARITHMIC_STRENGTH =
  8;

const SINGLE_V1_MIN_INNER_REFERENCE_SCENE =
  0.72;

const SINGLE_V1_MAX_INNER_REFERENCE_SCENE =
  1.08;

const MULTIPLE_V1_LOGARITHMIC_STRENGTH =
  7;

const MULTIPLE_V1_MIN_INNER_REFERENCE_SCENE =
  0.68;

const MULTIPLE_V1_MAX_INNER_REFERENCE_SCENE =
  1.26;

const TRIPLE_HIERARCHICAL_LOCAL_LOGARITHMIC_STRENGTH =
  7;

const TRIPLE_HIERARCHICAL_OUTER_LOGARITHMIC_STRENGTH =
  4.5;

const TRIPLE_HIERARCHICAL_LOCAL_PLANET_TARGET_SCENE =
  2.18;

const TRIPLE_HIERARCHICAL_LOCAL_STELLAR_TARGET_SCENE =
  1.28;

const TRIPLE_HIERARCHICAL_OUTER_CLEARANCE_SCENE =
  0.48;

/**
 * Presentation-only point-24.5 scale contract for single-star systems.
 *
 * Physical AU values are never modified. The transform is monotonic and
 * radial: it reserves readable space around the photosphere, then compresses
 * the remaining orbital span logarithmically until the outermost visible
 * apoapsis reaches targetOuterRadiusScene.
 */
export function buildSingleAdaptiveSystemScaleV1(
  input:
    SingleAdaptiveSystemScaleInput,
): SystemSceneScaleSnapshot {

  const outerRadiusAu =
    positiveFiniteOr(
      input.outerRadiusAu,
      1,
    );

  const targetOuterRadiusScene =
    positiveFiniteOr(
      input.targetOuterRadiusScene,
      4.8,
    );

  const innerReferenceAu =
    input.innerPeriapsisAu !==
      null &&
    Number.isFinite(
      input.innerPeriapsisAu,
    ) &&
    input.innerPeriapsisAu >
      0 &&
    input.innerPeriapsisAu <
      outerRadiusAu
      ? input.innerPeriapsisAu
      : null;

  const bodyClearanceScene =
    Math.max(
      input.starRadiusScene *
        1.8,
      input.starRadiusScene +
        input.maxPlanetRadiusScene +
        0.30,
    );

  const innerReferenceScene =
    innerReferenceAu ===
      null
      ? null
      : clamp(
          bodyClearanceScene,
          SINGLE_V1_MIN_INNER_REFERENCE_SCENE,
          Math.min(
            SINGLE_V1_MAX_INNER_REFERENCE_SCENE,
            targetOuterRadiusScene *
              0.34,
          ),
        );

  return Object.freeze({
    outerRadiusAu,
    orbitScaleScenePerAu:
      targetOuterRadiusScene /
      outerRadiusAu,
    targetOuterRadiusScene,
    projectionMode:
      SystemSceneScaleProjectionMode
        .SINGLE_ADAPTIVE_LOG_V1,
    innerReferenceAu,
    innerReferenceScene,
    logarithmicStrength:
      SINGLE_V1_LOGARITHMIC_STRENGTH,
  });
}

/**
 * Point-24.5 adaptive presentation scale for BINARY/TRIPLE systems.
 *
 * The physical A-B relative periapsis is used as the inner reference. Because
 * the transform is linear inside that reference, the two barycentric stellar
 * radii still add up to the requested visual A-B clearance at periapsis. The
 * rest of the hierarchy is then compressed logarithmically toward the outer
 * system bound. Physical AU values remain untouched.
 */
export function buildMultipleAdaptiveSystemScaleV1(
  input:
    MultipleAdaptiveSystemScaleInput,
): SystemSceneScaleSnapshot {

  const outerRadiusAu =
    positiveFiniteOr(
      input.outerRadiusAu,
      1,
    );

  const targetOuterRadiusScene =
    positiveFiniteOr(
      input.targetOuterRadiusScene,
      4.8,
    );

  const innerReferenceAu =
    input.innerBinaryPeriapsisAu !==
      null &&
    Number.isFinite(
      input.innerBinaryPeriapsisAu,
    ) &&
    input.innerBinaryPeriapsisAu >
      0 &&
    input.innerBinaryPeriapsisAu <
      outerRadiusAu
      ? input.innerBinaryPeriapsisAu
      : null;

  const pairClearanceScene =
    input.primaryStarRadiusScene +
    input.secondaryStarRadiusScene +
    0.24;

  const innerReferenceScene =
    innerReferenceAu ===
      null
      ? null
      : clamp(
          pairClearanceScene,
          MULTIPLE_V1_MIN_INNER_REFERENCE_SCENE,
          Math.min(
            MULTIPLE_V1_MAX_INNER_REFERENCE_SCENE,
            targetOuterRadiusScene *
              0.36,
          ),
        );

  return Object.freeze({
    outerRadiusAu,
    orbitScaleScenePerAu:
      targetOuterRadiusScene /
      outerRadiusAu,
    targetOuterRadiusScene,
    projectionMode:
      input.architecture ===
        'TRIPLE'
        ? SystemSceneScaleProjectionMode
            .TRIPLE_ADAPTIVE_LOG_V1
        : SystemSceneScaleProjectionMode
            .BINARY_ADAPTIVE_LOG_V1,
    innerReferenceAu,
    innerReferenceScene,
    logarithmicStrength:
      MULTIPLE_V1_LOGARITHMIC_STRENGTH,
  });
}

/**
 * Point-24.5 V3 hierarchical presentation scale for TRIPLE systems.
 *
 * The A-B + circumbinary-planet subsystem gets its own local radial scale.
 * The A+B barycentre and C use a separate outer radial scale. Consumers must
 * compose projected outer anchor + projected local offset; the outer nonlinear
 * transform must never be applied to the already-resolved inner geometry.
 */
export function buildTripleHierarchicalSystemScaleV1(
  input:
    TripleHierarchicalSystemScaleInput,
): SystemSceneScaleSnapshot {

  const targetOuterRadiusScene =
    positiveFiniteOr(
      input.targetOuterRadiusScene,
      4.8,
    );

  const pairClearanceScene =
    clamp(
      input.primaryStarRadiusScene +
        input.secondaryStarRadiusScene +
        0.24,
      MULTIPLE_V1_MIN_INNER_REFERENCE_SCENE,
      MULTIPLE_V1_MAX_INNER_REFERENCE_SCENE,
    );

  const hasPlanets =
    input.localPlanetOuterRadiusAu >
      Number.EPSILON;

  const localTargetRadiusScene =
    Math.max(
      pairClearanceScene *
        1.42,
      hasPlanets
        ? TRIPLE_HIERARCHICAL_LOCAL_PLANET_TARGET_SCENE
        : TRIPLE_HIERARCHICAL_LOCAL_STELLAR_TARGET_SCENE,
    );

  const localOuterRadiusAu =
    positiveFiniteOr(
      Math.max(
        input.innerBinaryApoapsisAu,
        input.localPlanetOuterRadiusAu,
      ),
      input.innerBinaryApoapsisAu,
    );

  const localScale =
    Object.freeze({
      outerRadiusAu:
        localOuterRadiusAu,
      targetOuterRadiusScene:
        localTargetRadiusScene,
      innerReferenceAu:
        positiveFiniteOr(
          input.innerBinaryPeriapsisAu,
          localOuterRadiusAu * 0.2,
        ),
      innerReferenceScene:
        pairClearanceScene,
      logarithmicStrength:
        TRIPLE_HIERARCHICAL_LOCAL_LOGARITHMIC_STRENGTH,
    } satisfies SystemSceneRadialScaleSnapshot);

  const innerPairScale =
    Math.abs(
      input.innerPairOuterScale,
    );

  const tertiaryScale =
    Math.abs(
      input.tertiaryOuterScale,
    );

  const outerFitFromInnerPair =
    innerPairScale >
      Number.EPSILON
      ? (
          targetOuterRadiusScene -
          localTargetRadiusScene -
          0.18
        ) /
        innerPairScale
      : Number.POSITIVE_INFINITY;

  const outerFitFromTertiary =
    tertiaryScale >
      Number.EPSILON
      ? (
          targetOuterRadiusScene -
          input.tertiaryStarRadiusScene -
          0.18
        ) /
        tertiaryScale
      : Number.POSITIVE_INFINITY;

  const outerTargetRelativeScene =
    clamp(
      Math.min(
        targetOuterRadiusScene,
        outerFitFromInnerPair,
        outerFitFromTertiary,
      ),
      localTargetRadiusScene +
        input.tertiaryStarRadiusScene +
        TRIPLE_HIERARCHICAL_OUTER_CLEARANCE_SCENE +
        0.35,
      targetOuterRadiusScene,
    );

  const outerPeriapsisScene =
    Math.min(
      outerTargetRelativeScene *
        0.82,
      Math.max(
        localTargetRadiusScene +
          input.tertiaryStarRadiusScene +
          input.maxPlanetRadiusScene +
          TRIPLE_HIERARCHICAL_OUTER_CLEARANCE_SCENE,
        pairClearanceScene *
          2.15,
      ),
    );

  const outerScale =
    Object.freeze({
      outerRadiusAu:
        positiveFiniteOr(
          input.outerRelativeApoapsisAu,
          1,
        ),
      targetOuterRadiusScene:
        outerTargetRelativeScene,
      innerReferenceAu:
        positiveFiniteOr(
          input.outerRelativePeriapsisAu,
          input.outerRelativeApoapsisAu *
            0.5,
        ),
      innerReferenceScene:
        outerPeriapsisScene,
      logarithmicStrength:
        TRIPLE_HIERARCHICAL_OUTER_LOGARITHMIC_STRENGTH,
    } satisfies SystemSceneRadialScaleSnapshot);

  return Object.freeze({
    outerRadiusAu:
      positiveFiniteOr(
        input.outerRadiusAu,
        input.outerRelativeApoapsisAu,
      ),
    orbitScaleScenePerAu:
      targetOuterRadiusScene /
      positiveFiniteOr(
        input.outerRadiusAu,
        1,
      ),
    targetOuterRadiusScene,
    projectionMode:
      SystemSceneScaleProjectionMode
        .TRIPLE_HIERARCHICAL_V1,
    innerReferenceAu:
      localScale.innerReferenceAu,
    innerReferenceScene:
      localScale.innerReferenceScene,
    logarithmicStrength:
      localScale.logarithmicStrength,
    tripleHierarchy:
      Object.freeze({
        outer:
          outerScale,
        local:
          localScale,
      }),
  });
}

export function buildLinearFitSystemScale(
  outerRadiusAu:
    number,

  targetOuterRadiusScene:
    number,
): SystemSceneScaleSnapshot {

  const safeOuterRadiusAu =
    positiveFiniteOr(
      outerRadiusAu,
      1,
    );

  const safeTargetOuterRadiusScene =
    positiveFiniteOr(
      targetOuterRadiusScene,
      4.8,
    );

  return Object.freeze({
    outerRadiusAu:
      safeOuterRadiusAu,
    orbitScaleScenePerAu:
      safeTargetOuterRadiusScene /
      safeOuterRadiusAu,
    targetOuterRadiusScene:
      safeTargetOuterRadiusScene,
    projectionMode:
      SystemSceneScaleProjectionMode
        .LINEAR_FIT,
    innerReferenceAu:
      null,
    innerReferenceScene:
      null,
    logarithmicStrength:
      0,
  });
}

export function systemSceneProjectedRadiusAu(
  radiusAu:
    number,

  scale:
    SystemSceneScaleSnapshot,
): number {

  if (
    !Number.isFinite(
      radiusAu,
    ) ||
    radiusAu <=
      0
  ) {
    return 0;
  }

  if (
    scale.projectionMode ===
      SystemSceneScaleProjectionMode
        .TRIPLE_HIERARCHICAL_V1 &&
    scale.tripleHierarchy !==
      null &&
    scale.tripleHierarchy !==
      undefined
  ) {
    return projectedRadiusWithRadialScale(
      radiusAu,
      scale.tripleHierarchy.local,
    );
  }

  if (
    !isAdaptiveSystemSceneScale(
      scale,
    )
  ) {
    return radiusAu *
      scale.orbitScaleScenePerAu;
  }

  const outerRadiusAu =
    positiveFiniteOr(
      scale.outerRadiusAu,
      1,
    );

  const targetOuterRadiusScene =
    positiveFiniteOr(
      scale.targetOuterRadiusScene,
      4.8,
    );

  const clampedRadiusAu =
    Math.min(
      radiusAu,
      outerRadiusAu,
    );

  const innerReferenceAu =
    scale.innerReferenceAu ??
    null;

  const innerReferenceScene =
    scale.innerReferenceScene ??
    null;

  if (
    innerReferenceAu ===
      null ||
    innerReferenceScene ===
      null ||
    innerReferenceAu <=
      0 ||
    innerReferenceAu >=
      outerRadiusAu
  ) {
    const normalized =
      clampedRadiusAu /
      outerRadiusAu;

    const strength =
      positiveFiniteOr(
        scale.logarithmicStrength ??
          SINGLE_V1_LOGARITHMIC_STRENGTH,
        SINGLE_V1_LOGARITHMIC_STRENGTH,
      );

    return targetOuterRadiusScene *
      logarithmicUnitInterval(
        normalized,
        strength,
      );
  }

  if (
    clampedRadiusAu <=
    innerReferenceAu
  ) {
    return innerReferenceScene *
      clampedRadiusAu /
      innerReferenceAu;
  }

  const normalizedOuterSpan =
    (
      clampedRadiusAu -
      innerReferenceAu
    ) /
    (
      outerRadiusAu -
      innerReferenceAu
    );

  const strength =
    positiveFiniteOr(
      scale.logarithmicStrength ??
        SINGLE_V1_LOGARITHMIC_STRENGTH,
      SINGLE_V1_LOGARITHMIC_STRENGTH,
    );

  return innerReferenceScene +
    (
      targetOuterRadiusScene -
      innerReferenceScene
    ) *
    logarithmicUnitInterval(
      normalizedOuterSpan,
      strength,
    );
}

export function systemSceneProjectAuVector(
  vectorAu:
    SystemSceneScaleVector,

  scale:
    SystemSceneScaleSnapshot,
): SystemSceneScaleVector {

  const radiusAu =
    Math.hypot(
      vectorAu.x,
      vectorAu.y,
      vectorAu.z,
    );

  if (
    radiusAu <=
      Number.EPSILON
  ) {
    return Object.freeze({
      x: 0,
      y: 0,
      z: 0,
    });
  }

  const projectedRadius =
    systemSceneProjectedRadiusAu(
      radiusAu,
      scale,
    );

  const factor =
    projectedRadius /
    radiusAu;

  return Object.freeze({
    x:
      vectorAu.x *
      factor,
    y:
      vectorAu.y *
      factor,
    z:
      vectorAu.z *
      factor,
  });
}

export function systemSceneProjectedRadiusAuInSpace(
  radiusAu:
    number,

  scale:
    SystemSceneScaleSnapshot,

  space:
    SystemSceneProjectionSpace,
): number {

  if (
    scale.projectionMode !==
      SystemSceneScaleProjectionMode
        .TRIPLE_HIERARCHICAL_V1 ||
    scale.tripleHierarchy ===
      null ||
    scale.tripleHierarchy ===
      undefined ||
    space ===
      SystemSceneProjectionSpace.GLOBAL
  ) {
    return systemSceneProjectedRadiusAu(
      radiusAu,
      scale,
    );
  }

  return projectedRadiusWithRadialScale(
    radiusAu,
    space ===
      SystemSceneProjectionSpace.TRIPLE_OUTER
      ? scale.tripleHierarchy.outer
      : scale.tripleHierarchy.local,
  );
}

/**
 * Presentation-only projection for scientific overlays that may extend beyond
 * the currently materialized system radius (for example a radiative HZ in a
 * compact/planetless system). Inside the validated 24.5 range this is exactly
 * the normal projection. Beyond it, the overlay continues monotonically with
 * a compressed logarithmic tail instead of clamping both boundaries onto the
 * same scene radius. Existing body/orbit projection is deliberately untouched.
 */
export function systemSceneProjectedOverlayRadiusAuInSpace(
  radiusAu:
    number,

  scale:
    SystemSceneScaleSnapshot,

  space:
    SystemSceneProjectionSpace,
): number {

  if (
    !Number.isFinite(
      radiusAu,
    ) ||
    radiusAu <=
      0
  ) {
    return 0;
  }

  if (
    !isAdaptiveSystemSceneScale(
      scale,
    )
  ) {
    return systemSceneProjectedRadiusAuInSpace(
      radiusAu,
      scale,
      space,
    );
  }

  const radialScale =
    scale.projectionMode ===
        SystemSceneScaleProjectionMode.TRIPLE_HIERARCHICAL_V1 &&
      scale.tripleHierarchy !==
        null &&
      scale.tripleHierarchy !==
        undefined
      ? space ===
          SystemSceneProjectionSpace.TRIPLE_OUTER
        ? scale.tripleHierarchy.outer
        : scale.tripleHierarchy.local
      : {
          outerRadiusAu:
            scale.outerRadiusAu,
          targetOuterRadiusScene:
            scale.targetOuterRadiusScene,
        };

  const outerRadiusAu =
    positiveFiniteOr(
      radialScale.outerRadiusAu,
      1,
    );

  if (
    radiusAu <=
      outerRadiusAu
  ) {
    return systemSceneProjectedRadiusAuInSpace(
      radiusAu,
      scale,
      space,
    );
  }

  const targetOuterRadiusScene =
    positiveFiniteOr(
      radialScale.targetOuterRadiusScene,
      4.8,
    );

  const excessRatio =
    radiusAu /
      outerRadiusAu -
    1;

  return targetOuterRadiusScene *
    (
      1 +
      0.32 *
        Math.log1p(
          2 *
          excessRatio,
        )
    );
}

export function systemSceneProjectAuVectorInSpace(
  vectorAu:
    SystemSceneScaleVector,

  scale:
    SystemSceneScaleSnapshot,

  space:
    SystemSceneProjectionSpace,
): SystemSceneScaleVector {

  const radiusAu =
    Math.hypot(
      vectorAu.x,
      vectorAu.y,
      vectorAu.z,
    );

  if (
    radiusAu <=
      Number.EPSILON
  ) {
    return Object.freeze({
      x: 0,
      y: 0,
      z: 0,
    });
  }

  const projectedRadius =
    systemSceneProjectedRadiusAuInSpace(
      radiusAu,
      scale,
      space,
    );

  const factor =
    projectedRadius /
    radiusAu;

  return Object.freeze({
    x:
      vectorAu.x *
      factor,
    y:
      vectorAu.y *
      factor,
    z:
      vectorAu.z *
      factor,
  });
}

/**
 * Point-24.5 body exaggeration shared by all stellar architectures once
 * camera navigation exists. Bodies remain readable without approaching the
 * oversized 24.2 placeholder proportions.
 */
export function adaptiveSystemStarRadiusScene(
  radiusSolar:
    number,
): number {

  const safeRadiusSolar =
    positiveFiniteOr(
      radiusSolar,
      1,
    );

  return clamp(
    0.21 +
      0.07 *
        Math.log2(
          1 +
          safeRadiusSolar,
        ),
    0.20,
    0.40,
  );
}

export function adaptiveSystemPlanetRadiusScene(
  radiusEarth:
    number,
): number {

  const safeRadiusEarth =
    positiveFiniteOr(
      radiusEarth,
      1,
    );

  return clamp(
    0.019 +
      0.014 *
        Math.sqrt(
          safeRadiusEarth,
        ),
    0.026,
    0.072,
  );
}

export const singleSystemStarRadiusScene =
  adaptiveSystemStarRadiusScene;

export const singleSystemPlanetRadiusScene =
  adaptiveSystemPlanetRadiusScene;

export function isAdaptiveSystemSceneScale(
  scale:
    SystemSceneScaleSnapshot,
): boolean {

  return (
    scale.projectionMode ===
      SystemSceneScaleProjectionMode
        .SINGLE_ADAPTIVE_LOG_V1 ||
    scale.projectionMode ===
      SystemSceneScaleProjectionMode
        .BINARY_ADAPTIVE_LOG_V1 ||
    scale.projectionMode ===
      SystemSceneScaleProjectionMode
        .TRIPLE_ADAPTIVE_LOG_V1
    ||
    scale.projectionMode ===
      SystemSceneScaleProjectionMode
        .TRIPLE_HIERARCHICAL_V1
  );
}

function projectedRadiusWithRadialScale(
  radiusAu:
    number,

  scale:
    SystemSceneRadialScaleSnapshot,
): number {

  if (
    !Number.isFinite(
      radiusAu,
    ) ||
    radiusAu <=
      0
  ) {
    return 0;
  }

  const outerRadiusAu =
    positiveFiniteOr(
      scale.outerRadiusAu,
      1,
    );

  const targetOuterRadiusScene =
    positiveFiniteOr(
      scale.targetOuterRadiusScene,
      4.8,
    );

  const clampedRadiusAu =
    Math.min(
      radiusAu,
      outerRadiusAu,
    );

  const innerReferenceAu =
    scale.innerReferenceAu;

  const innerReferenceScene =
    scale.innerReferenceScene;

  if (
    innerReferenceAu ===
      null ||
    innerReferenceScene ===
      null ||
    innerReferenceAu <=
      0 ||
    innerReferenceAu >=
      outerRadiusAu
  ) {
    return targetOuterRadiusScene *
      logarithmicUnitInterval(
        clampedRadiusAu /
          outerRadiusAu,
        positiveFiniteOr(
          scale.logarithmicStrength,
          SINGLE_V1_LOGARITHMIC_STRENGTH,
        ),
      );
  }

  if (
    clampedRadiusAu <=
    innerReferenceAu
  ) {
    return innerReferenceScene *
      clampedRadiusAu /
      innerReferenceAu;
  }

  return innerReferenceScene +
    (
      targetOuterRadiusScene -
      innerReferenceScene
    ) *
    logarithmicUnitInterval(
      (
        clampedRadiusAu -
        innerReferenceAu
      ) /
      (
        outerRadiusAu -
        innerReferenceAu
      ),
      positiveFiniteOr(
        scale.logarithmicStrength,
        SINGLE_V1_LOGARITHMIC_STRENGTH,
      ),
    );
}

function logarithmicUnitInterval(
  value:
    number,

  strength:
    number,
): number {

  const normalized =
    clamp(
      value,
      0,
      1,
    );

  if (
    strength <=
      Number.EPSILON
  ) {
    return normalized;
  }

  return Math.log1p(
    strength *
    normalized,
  ) /
  Math.log1p(
    strength,
  );
}

function positiveFiniteOr(
  value:
    number,

  fallback:
    number,
): number {

  return Number.isFinite(
    value,
  ) &&
  value >
    0
    ? value
    : fallback;
}

function clamp(
  value:
    number,

  min:
    number,

  max:
    number,
): number {

  return Math.min(
    max,
    Math.max(
      min,
      value,
    ),
  );
}
