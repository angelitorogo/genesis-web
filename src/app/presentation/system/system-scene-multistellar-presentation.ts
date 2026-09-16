export const SystemSceneHabitableZoneVisualRegimeV4 =
  Object.freeze({
    CIRCUMSTELLAR:
      'CIRCUMSTELLAR',

    CIRCUMBINARY_RADIATIVE_ONLY:
      'CIRCUMBINARY_RADIATIVE_ONLY',

    CIRCUMBINARY_RADIATIVE_NOT_APPLICABLE:
      'CIRCUMBINARY_RADIATIVE_NOT_APPLICABLE',

    CIRCUMBINARY_PARTIALLY_STABLE:
      'CIRCUMBINARY_PARTIALLY_STABLE',

    CIRCUMBINARY_FULLY_STABLE:
      'CIRCUMBINARY_FULLY_STABLE',
  } as const);

export type SystemSceneHabitableZoneVisualRegimeV4 =
  typeof SystemSceneHabitableZoneVisualRegimeV4[
    keyof typeof SystemSceneHabitableZoneVisualRegimeV4
  ];

export interface SystemSceneMultistellarStarInputV4 {
  readonly id:
    string;

  readonly label:
    string;

  /** Photosphere radius after the generic V3 HZ host-envelope limiter. */
  readonly baseRadiusScene:
    number;

  /** V3 optical radius after gentle halo adaptation. */
  readonly opticalRadiusScene:
    number;
}

export interface SystemSceneMultistellarStarLayoutV4 {
  readonly id:
    string;

  readonly label:
    string;

  readonly radiusScene:
    number;

  readonly opticalRadiusScene:
    number;

  readonly limitedByInnerPair:
    boolean;

  readonly limitedByTertiaryClearance:
    boolean;
}

export interface SystemSceneMultistellarPresentationV4 {
  readonly version:
    4;

  readonly architecture:
    'BINARY' |
    'TRIPLE';

  /** Minimum projected A-B centre-to-centre separation over the inner orbit. */
  readonly innerPairMinimumCenterSeparationScene:
    number;

  /** Maximum permitted sum of A+B photosphere radii. */
  readonly innerPairPhotosphereBudgetScene:
    number;

  /** Guaranteed presentation gap between A and B photospheres at periapsis. */
  readonly innerPairMinimumPhotosphereGapScene:
    number;

  /**
   * For TRIPLE only: conservative minimum projected separation from C's centre
   * to the nearest A/B centre after accounting for the inner-pair excursion.
   */
  readonly tertiaryMinimumCenterSeparationToInnerStarScene:
    number | null;

  readonly tertiaryMinimumPhotosphereGapScene:
    number | null;

  readonly limited:
    boolean;

  readonly stars:
    readonly SystemSceneMultistellarStarLayoutV4[];
}

const INNER_PAIR_MAX_PHOTOSPHERE_FRACTION =
  0.58;

const TERTIARY_MAX_PHOTOSPHERE_FRACTION =
  0.60;

const VALUE_TOLERANCE =
  1e-9;

/**
 * Phase-26 V4 renderer-only deconfliction for multi-star systems.
 *
 * The authoritative stellar orbit remains untouched. Only the rendered
 * photosphere radii may shrink. Optical radii shrink more gently so close
 * binaries/triples keep visible corona, bloom and glare while the solid
 * stellar discs never visually merge at their closest allowed separation.
 */
export function buildSystemSceneMultistellarPresentationV4(
  architecture:
    'BINARY' |
    'TRIPLE',

  stars:
    readonly SystemSceneMultistellarStarInputV4[],

  innerPairMinimumCenterSeparationScene:
    number,

  tertiaryMinimumCenterSeparationToInnerStarScene:
    number | null,
): SystemSceneMultistellarPresentationV4 {

  assertPositiveFinite(
    innerPairMinimumCenterSeparationScene,
    'innerPairMinimumCenterSeparationScene',
  );

  if (
    architecture ===
      'BINARY' &&
    tertiaryMinimumCenterSeparationToInnerStarScene !==
      null
  ) {
    throw new RangeError(
      'BINARY multistellar presentation cannot define tertiary clearance.',
    );
  }

  if (
    architecture ===
      'TRIPLE'
  ) {
    assertPositiveFinite(
      tertiaryMinimumCenterSeparationToInnerStarScene,
      'tertiaryMinimumCenterSeparationToInnerStarScene',
    );
  }

  const sourceByLabel =
    new Map(
      stars.map(
        star => [
          star.label,
          Object.freeze({
            ...star,
            baseRadiusScene:
              positiveFiniteOr(
                star.baseRadiusScene,
                0.01,
              ),
            opticalRadiusScene:
              positiveFiniteOr(
                star.opticalRadiusScene,
                positiveFiniteOr(
                  star.baseRadiusScene,
                  0.01,
                ),
              ),
          }),
        ] as const,
      ),
    );

  const primary =
    sourceByLabel.get('A');
  const secondary =
    sourceByLabel.get('B');

  if (
    primary ===
      undefined ||
    secondary ===
      undefined
  ) {
    throw new RangeError(
      'Multistellar V4 presentation requires stellar components A and B.',
    );
  }

  const radii =
    new Map<string, number>(
      stars.map(
        star => [
          star.id,
          positiveFiniteOr(
            star.baseRadiusScene,
            0.01,
          ),
        ],
      ),
    );

  const opticalRadii =
    new Map<string, number>(
      stars.map(
        star => [
          star.id,
          positiveFiniteOr(
            star.opticalRadiusScene,
            positiveFiniteOr(
              star.baseRadiusScene,
              0.01,
            ),
          ),
        ],
      ),
    );

  const limitedByInnerPair =
    new Set<string>();
  const limitedByTertiary =
    new Set<string>();

  const pairBudget =
    innerPairMinimumCenterSeparationScene *
    INNER_PAIR_MAX_PHOTOSPHERE_FRACTION;

  const primaryRadius =
    radii.get(primary.id)!;
  const secondaryRadius =
    radii.get(secondary.id)!;
  const pairRadiusSum =
    primaryRadius +
    secondaryRadius;

  if (
    pairRadiusSum >
      pairBudget +
        VALUE_TOLERANCE
  ) {
    const scale =
      pairBudget /
      pairRadiusSum;

    radii.set(
      primary.id,
      primaryRadius *
        scale,
    );
    radii.set(
      secondary.id,
      secondaryRadius *
        scale,
    );

    opticalRadii.set(
      primary.id,
      deriveLimitedOpticalRadiusScene(
        sourceByLabel.get(primary.label)!.opticalRadiusScene,
        sourceByLabel.get(primary.label)!.baseRadiusScene,
        radii.get(primary.id)!,
      ),
    );
    opticalRadii.set(
      secondary.id,
      deriveLimitedOpticalRadiusScene(
        sourceByLabel.get(secondary.label)!.opticalRadiusScene,
        sourceByLabel.get(secondary.label)!.baseRadiusScene,
        radii.get(secondary.id)!,
      ),
    );

    limitedByInnerPair.add(
      primary.id,
    );
    limitedByInnerPair.add(
      secondary.id,
    );
  }

  let tertiaryGap:
    number | null =
    null;

  if (
    architecture ===
      'TRIPLE'
  ) {
    const tertiary =
      sourceByLabel.get('C');

    if (
      tertiary ===
        undefined
    ) {
      throw new RangeError(
        'TRIPLE multistellar V4 presentation requires stellar component C.',
      );
    }

    const tertiarySeparation =
      tertiaryMinimumCenterSeparationToInnerStarScene!;

    const tertiaryBudget =
      tertiarySeparation *
      TERTIARY_MAX_PHOTOSPHERE_FRACTION;

    const innerMaximumRadius =
      Math.max(
        radii.get(primary.id)!,
        radii.get(secondary.id)!,
      );

    const tertiaryRadius =
      radii.get(tertiary.id)!;

    const combined =
      innerMaximumRadius +
      tertiaryRadius;

    if (
      combined >
        tertiaryBudget +
          VALUE_TOLERANCE
    ) {
      const scale =
        tertiaryBudget /
        combined;

      radii.set(
        primary.id,
        radii.get(primary.id)! *
          scale,
      );
      radii.set(
        secondary.id,
        radii.get(secondary.id)! *
          scale,
      );
      radii.set(
        tertiary.id,
        tertiaryRadius *
          scale,
      );

      opticalRadii.set(
        primary.id,
        deriveLimitedOpticalRadiusScene(
          sourceByLabel.get(primary.label)!.opticalRadiusScene,
          sourceByLabel.get(primary.label)!.baseRadiusScene,
          radii.get(primary.id)!,
        ),
      );
      opticalRadii.set(
        secondary.id,
        deriveLimitedOpticalRadiusScene(
          sourceByLabel.get(secondary.label)!.opticalRadiusScene,
          sourceByLabel.get(secondary.label)!.baseRadiusScene,
          radii.get(secondary.id)!,
        ),
      );
      opticalRadii.set(
        tertiary.id,
        deriveLimitedOpticalRadiusScene(
          sourceByLabel.get(tertiary.label)!.opticalRadiusScene,
          sourceByLabel.get(tertiary.label)!.baseRadiusScene,
          radii.get(tertiary.id)!,
        ),
      );

      limitedByTertiary.add(
        primary.id,
      );
      limitedByTertiary.add(
        secondary.id,
      );
      limitedByTertiary.add(
        tertiary.id,
      );
    }

    tertiaryGap =
      Math.max(
        0,
        tertiarySeparation -
          (
            Math.max(
              radii.get(primary.id)!,
              radii.get(secondary.id)!,
            ) +
            radii.get(tertiary.id)!
          ),
      );
  }

  const layouts =
    Object.freeze(
      stars.map(
        star =>
          Object.freeze({
            id:
              star.id,
            label:
              star.label,
            radiusScene:
              radii.get(
                star.id,
              ) ??
              positiveFiniteOr(
                star.baseRadiusScene,
                0.01,
              ),
            opticalRadiusScene:
              Math.max(
                radii.get(
                  star.id,
                ) ??
                  positiveFiniteOr(
                    star.baseRadiusScene,
                    0.01,
                  ),
                opticalRadii.get(
                  star.id,
                ) ??
                  positiveFiniteOr(
                    star.opticalRadiusScene,
                    positiveFiniteOr(
                      star.baseRadiusScene,
                      0.01,
                    ),
                  ),
              ),
            limitedByInnerPair:
              limitedByInnerPair.has(
                star.id,
              ),
            limitedByTertiaryClearance:
              limitedByTertiary.has(
                star.id,
              ),
          }),
      ),
    );

  const finalPrimary =
    layouts.find(
      star =>
        star.label ===
        'A',
    )!;
  const finalSecondary =
    layouts.find(
      star =>
        star.label ===
        'B',
    )!;

  const pairGap =
    Math.max(
      0,
      innerPairMinimumCenterSeparationScene -
        finalPrimary.radiusScene -
        finalSecondary.radiusScene,
    );

  return Object.freeze({
    version:
      4 as const,
    architecture,
    innerPairMinimumCenterSeparationScene,
    innerPairPhotosphereBudgetScene:
      pairBudget,
    innerPairMinimumPhotosphereGapScene:
      pairGap,
    tertiaryMinimumCenterSeparationToInnerStarScene:
      architecture ===
        'TRIPLE'
        ? tertiaryMinimumCenterSeparationToInnerStarScene
        : null,
    tertiaryMinimumPhotosphereGapScene:
      architecture ===
        'TRIPLE'
        ? tertiaryGap
        : null,
    limited:
      layouts.some(
        star =>
          star.limitedByInnerPair ||
          star.limitedByTertiaryClearance,
      ),
    stars:
      layouts,
  });
}

export function systemSceneHabitableZoneVisualRegimeV4(
  topology:
    'CIRCUMSTELLAR' |
    'CIRCUMBINARY',

  dynamicallyHabitableInnerEdgeAu:
    number | null,

  dynamicallyHabitableOuterEdgeAu:
    number | null,

  dynamicalOverlapFraction01:
    number,

  radiativeReferenceApplicable:
    boolean = true,
): SystemSceneHabitableZoneVisualRegimeV4 {

  if (
    topology ===
      'CIRCUMSTELLAR'
  ) {
    return SystemSceneHabitableZoneVisualRegimeV4
      .CIRCUMSTELLAR;
  }

  if (
    !radiativeReferenceApplicable
  ) {
    return SystemSceneHabitableZoneVisualRegimeV4
      .CIRCUMBINARY_RADIATIVE_NOT_APPLICABLE;
  }

  const hasDynamicZone =
    dynamicallyHabitableInnerEdgeAu !==
      null &&
    dynamicallyHabitableOuterEdgeAu !==
      null;

  if (
    !hasDynamicZone ||
    dynamicalOverlapFraction01 <=
      VALUE_TOLERANCE
  ) {
    return SystemSceneHabitableZoneVisualRegimeV4
      .CIRCUMBINARY_RADIATIVE_ONLY;
  }

  if (
    dynamicalOverlapFraction01 >=
      1 -
        VALUE_TOLERANCE
  ) {
    return SystemSceneHabitableZoneVisualRegimeV4
      .CIRCUMBINARY_FULLY_STABLE;
  }

  return SystemSceneHabitableZoneVisualRegimeV4
    .CIRCUMBINARY_PARTIALLY_STABLE;
}


function deriveLimitedOpticalRadiusScene(
  baseOpticalRadiusScene:
    number,

  baseRadiusScene:
    number,

  limitedRadiusScene:
    number,
): number {

  const safeBaseOpticalRadius =
    positiveFiniteOr(
      baseOpticalRadiusScene,
      positiveFiniteOr(
        baseRadiusScene,
        limitedRadiusScene,
      ),
    );

  const safeBaseRadius =
    positiveFiniteOr(
      baseRadiusScene,
      limitedRadiusScene,
    );

  const shrinkRatio =
    Math.min(
      1,
      Math.max(
        0,
        limitedRadiusScene /
          safeBaseRadius,
      ),
    );

  const retainedOpticalRadius =
    safeBaseOpticalRadius *
    (
      0.68 +
      0.32 *
        shrinkRatio
    );

  return Math.max(
    limitedRadiusScene,
    Math.min(
      safeBaseOpticalRadius,
      retainedOpticalRadius,
      limitedRadiusScene *
        1.38,
    ),
  );
}

function assertPositiveFinite(
  value:
    number | null,

  label:
    string,
): asserts value is number {

  if (
    value ===
      null ||
    !Number.isFinite(
      value,
    ) ||
    value <=
      0
  ) {
    throw new RangeError(
      `${label} must be finite and greater than zero: ${String(value)}.`,
    );
  }
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
