import {
  type SystemSceneScaleSnapshot,
} from './system-scene-scale-projection';

export interface TriplePlanetaryLayoutBodyInput {
  readonly ordinal:
    number;

  readonly semiMajorAxisAu:
    number;

  readonly eccentricity:
    number;

  readonly radiusScene:
    number;
}

export interface TriplePlanetaryLayoutEntry {
  readonly ordinal:
    number;

  readonly radiusScene:
    number;

  readonly semiMajorScene:
    number;

  readonly periapsisScene:
    number;

  readonly apoapsisScene:
    number;

  readonly scenePerAu:
    number;
}

export interface TriplePlanetaryLayoutResult {
  readonly radiusScale:
    number;

  readonly minimumTrackGapScene:
    number;

  readonly entries:
    readonly TriplePlanetaryLayoutEntry[];
}

const TRIPLE_DENSE_MIN_VISIBLE_RADIUS_SCALE =
  0.46;

const TRIPLE_DENSE_MIN_PLANET_RADIUS_SCENE =
  0.015;

const TRIPLE_DENSE_TRACK_GAP_SCENE =
  0.022;

const TRIPLE_DENSE_OUTER_MARGIN_SCENE =
  0.055;

const TRIPLE_DENSE_INNER_MARGIN_SCENE =
  0.055;

const LAYOUT_SEARCH_STEPS =
  24;

/**
 * Point-24.5 V4 presentation-only deconfliction for TRIPLE circumbinary
 * planets.
 *
 * Physical semi-major axes, eccentricities, periods and Kepler phases remain
 * untouched. Each planet receives only a presentation AU->scene multiplier.
 * The multipliers preserve physical orbital ordering while enforcing a
 * minimum separation between neighbouring visual orbital tracks. If a dense
 * package cannot fit at the established 24.5 body exaggeration, every visible
 * planet radius is reduced by one common factor, preserving relative size
 * ordering. SystemScene keeps a larger invisible picking proxy independently
 * of this visible radius.
 */
export function buildTripleDensePlanetaryLayoutV1(
  planets:
    readonly TriplePlanetaryLayoutBodyInput[],

  scale:
    SystemSceneScaleSnapshot,
): TriplePlanetaryLayoutResult | null {

  const localScale =
    scale.tripleHierarchy
      ?.local ??
    null;

  if (
    localScale ===
      null ||
    planets.length ===
      0
  ) {
    return null;
  }

  const sorted =
    [...planets]
      .filter(
        planet =>
          Number.isFinite(
            planet.semiMajorAxisAu,
          ) &&
          planet.semiMajorAxisAu >
            0 &&
          Number.isFinite(
            planet.eccentricity,
          ) &&
          planet.eccentricity >=
            0 &&
          planet.eccentricity <
            1,
      )
      .sort(
        (
          first,
          second,
        ) =>
          first.semiMajorAxisAu -
          second.semiMajorAxisAu,
      );

  if (
    sorted.length ===
      0
  ) {
    return null;
  }

  const outerLimitScene =
    Math.max(
      0.1,
      localScale.targetOuterRadiusScene -
        TRIPLE_DENSE_OUTER_MARGIN_SCENE,
    );

  const innerLimitScene =
    Math.min(
      outerLimitScene *
        0.72,
      Math.max(
        (
          localScale.innerReferenceScene ??
          0
        ) +
          TRIPLE_DENSE_INNER_MARGIN_SCENE,
        localScale.targetOuterRadiusScene *
          0.34,
      ),
    );

  const fullSize =
    layoutForRadiusScale(
      sorted,
      1,
      innerLimitScene,
      outerLimitScene,
    );

  if (
    fullSize.fits
  ) {
    return freezeLayout(
      1,
      fullSize.entries,
    );
  }

  const minimumSize =
    layoutForRadiusScale(
      sorted,
      TRIPLE_DENSE_MIN_VISIBLE_RADIUS_SCALE,
      innerLimitScene,
      outerLimitScene,
    );

  if (
    !minimumSize.fits
  ) {
    return freezeLayout(
      TRIPLE_DENSE_MIN_VISIBLE_RADIUS_SCALE,
      evenlyPackedFallback(
        sorted,
        TRIPLE_DENSE_MIN_VISIBLE_RADIUS_SCALE,
        innerLimitScene,
        outerLimitScene,
      ),
    );
  }

  let lower =
    TRIPLE_DENSE_MIN_VISIBLE_RADIUS_SCALE;
  let upper =
    1;
  let best =
    minimumSize.entries;

  for (
    let step = 0;
    step <
      LAYOUT_SEARCH_STEPS;
    step += 1
  ) {
    const candidateScale =
      (
        lower +
        upper
      ) /
      2;

    const candidate =
      layoutForRadiusScale(
        sorted,
        candidateScale,
        innerLimitScene,
        outerLimitScene,
      );

    if (
      candidate.fits
    ) {
      lower =
        candidateScale;
      best =
        candidate.entries;
    } else {
      upper =
        candidateScale;
    }
  }

  return freezeLayout(
    lower,
    best,
  );
}

function layoutForRadiusScale(
  sorted:
    readonly TriplePlanetaryLayoutBodyInput[],

  radiusScale:
    number,

  innerLimitScene:
    number,

  outerLimitScene:
    number,
): {
  readonly fits:
    boolean;

  readonly entries:
    readonly TriplePlanetaryLayoutEntry[];
} {

  const radii =
    sorted.map(
      planet =>
        Math.max(
          TRIPLE_DENSE_MIN_PLANET_RADIUS_SCENE,
          planet.radiusScene *
            radiusScale,
        ),
    );

  const firstCenterScene =
    innerLimitScene +
    radii[0]!;

  const lastCenterScene =
    outerLimitScene -
    radii[
      radii.length -
      1
    ]!;

  if (
    lastCenterScene <=
    firstCenterScene
  ) {
    return Object.freeze({
      fits:
        false,
      entries:
        Object.freeze([]),
    });
  }

  const firstPhysicalRadius =
    sorted[0]!
      .semiMajorAxisAu;

  const lastPhysicalRadius =
    sorted[
      sorted.length -
      1
    ]!
      .semiMajorAxisAu;

  const logarithmicDenominator =
    lastPhysicalRadius >
      firstPhysicalRadius
      ? Math.log(
          lastPhysicalRadius /
          firstPhysicalRadius,
        )
      : 0;

  const centers =
    sorted.map(
      (
        planet,
        index,
      ) => {
        const normalizedPhysicalRank =
          logarithmicDenominator >
            Number.EPSILON
            ? Math.log(
                planet.semiMajorAxisAu /
                firstPhysicalRadius,
              ) /
              logarithmicDenominator
            : sorted.length <=
                1
              ? 0
              : index /
                (
                  sorted.length -
                  1
                );

        return firstCenterScene +
          normalizedPhysicalRank *
          (
            lastCenterScene -
            firstCenterScene
          );
      },
    );

  centers[0] =
    firstCenterScene;

  for (
    let index = 1;
    index <
      centers.length;
    index += 1
  ) {
    const minimumCenter =
      centers[
        index -
        1
      ]! +
      radii[
        index -
        1
      ]! +
      radii[index]! +
      TRIPLE_DENSE_TRACK_GAP_SCENE;

    centers[index] =
      Math.max(
        centers[index]!,
        minimumCenter,
      );
  }

  if (
    centers[
      centers.length -
      1
    ]! >
    lastCenterScene
  ) {
    centers[
      centers.length -
      1
    ] =
      lastCenterScene;

    for (
      let index =
        centers.length -
        2;
      index >=
        0;
      index -= 1
    ) {
      const maximumCenter =
        centers[
          index +
          1
        ]! -
        radii[index]! -
        radii[
          index +
          1
        ]! -
        TRIPLE_DENSE_TRACK_GAP_SCENE;

      centers[index] =
        Math.min(
          centers[index]!,
          maximumCenter,
        );
    }
  }

  if (
    centers[0]! <
    firstCenterScene -
      1e-9
  ) {
    return Object.freeze({
      fits:
        false,
      entries:
        Object.freeze([]),
    });
  }

  const entries =
    sorted.map(
      (
        planet,
        index,
      ) => {
        const semiMajorScene =
          centers[index]!;
        const eccentricity =
          planet.eccentricity;

        return Object.freeze({
          ordinal:
            planet.ordinal,
          radiusScene:
            radii[index]!,
          semiMajorScene,
          periapsisScene:
            semiMajorScene *
            (
              1 -
              eccentricity
            ),
          apoapsisScene:
            semiMajorScene *
            (
              1 +
              eccentricity
            ),
          scenePerAu:
            semiMajorScene /
            planet.semiMajorAxisAu,
        });
      },
    );

  return Object.freeze({
    fits:
      true,
    entries:
      Object.freeze(entries),
  });
}

function evenlyPackedFallback(
  sorted:
    readonly TriplePlanetaryLayoutBodyInput[],

  radiusScale:
    number,

  innerLimitScene:
    number,

  outerLimitScene:
    number,
): readonly TriplePlanetaryLayoutEntry[] {

  const radii =
    sorted.map(
      planet =>
        Math.max(
          TRIPLE_DENSE_MIN_PLANET_RADIUS_SCENE,
          planet.radiusScene *
            radiusScale,
        ),
    );

  const centers: number[] = [
    innerLimitScene +
      radii[0]!,
  ];

  for (
    let index = 1;
    index <
      sorted.length;
    index += 1
  ) {
    centers.push(
      centers[
        index -
        1
      ]! +
      radii[
        index -
        1
      ]! +
      radii[index]! +
      TRIPLE_DENSE_TRACK_GAP_SCENE,
    );
  }

  const lastMaximum =
    outerLimitScene -
    radii[
      radii.length -
      1
    ]!;

  const slack =
    Math.max(
      0,
      lastMaximum -
        centers[
          centers.length -
          1
        ]!,
    );

  return Object.freeze(
    sorted.map(
      (
        planet,
        index,
      ) => {
        const normalized =
          sorted.length <=
            1
            ? 0
            : index /
              (
                sorted.length -
                1
              );

        const semiMajorScene =
          centers[index]! +
          slack *
          normalized;

        return Object.freeze({
          ordinal:
            planet.ordinal,
          radiusScene:
            radii[index]!,
          semiMajorScene,
          periapsisScene:
            semiMajorScene *
            (
              1 -
              planet.eccentricity
            ),
          apoapsisScene:
            semiMajorScene *
            (
              1 +
              planet.eccentricity
            ),
          scenePerAu:
            semiMajorScene /
            planet.semiMajorAxisAu,
        });
      },
    ),
  );
}

function freezeLayout(
  radiusScale:
    number,

  entries:
    readonly TriplePlanetaryLayoutEntry[],
): TriplePlanetaryLayoutResult {

  return Object.freeze({
    radiusScale,
    minimumTrackGapScene:
      TRIPLE_DENSE_TRACK_GAP_SCENE,
    entries:
      Object.freeze(
        [...entries],
      ),
  });
}
