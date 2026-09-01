import {
  buildTripleHierarchicalSystemScaleV1,
} from './system-scene-scale-projection';

import {
  buildTripleDensePlanetaryLayoutV1,
} from './system-scene-triple-planetary-layout';

describe(
  'buildTripleDensePlanetaryLayoutV1',
  () => {
    it(
      'should preserve orbital ordering while enforcing visible clearance in dense packs',
      () => {
        const scale =
          buildTripleHierarchicalSystemScaleV1({
            outerRadiusAu:
              24,
            targetOuterRadiusScene:
              4.8,
            innerBinaryPeriapsisAu:
              0.08,
            innerBinaryApoapsisAu:
              0.16,
            localPlanetOuterRadiusAu:
              3.4,
            outerRelativePeriapsisAu:
              8,
            outerRelativeApoapsisAu:
              18,
            primaryStarRadiusScene:
              0.28,
            secondaryStarRadiusScene:
              0.26,
            tertiaryStarRadiusScene:
              0.24,
            maxPlanetRadiusScene:
              0.072,
            innerPairOuterScale:
              0.36,
            tertiaryOuterScale:
              -0.64,
          });

        const layout =
          buildTripleDensePlanetaryLayoutV1(
            [
              body(0, 0.42, 0.03, 0.035),
              body(1, 0.56, 0.04, 0.044),
              body(2, 0.73, 0.02, 0.052),
              body(3, 0.94, 0.05, 0.061),
              body(4, 1.18, 0.03, 0.068),
              body(5, 1.45, 0.02, 0.072),
              body(6, 1.78, 0.04, 0.054),
              body(7, 2.12, 0.02, 0.049),
              body(8, 2.55, 0.03, 0.043),
              body(9, 3.05, 0.02, 0.038),
            ],
            scale,
          );

        expect(layout).not.toBeNull();

        const entries =
          layout!.entries;

        expect(entries).toHaveLength(10);

        for (
          let index = 1;
          index <
            entries.length;
          index += 1
        ) {
          const previous =
            entries[index - 1]!;
          const current =
            entries[index]!;

          expect(
            current.semiMajorScene,
          ).toBeGreaterThan(
            previous.semiMajorScene,
          );

          expect(
            current.semiMajorScene -
              previous.semiMajorScene,
          ).toBeGreaterThanOrEqual(
            previous.radiusScene +
            current.radiusScene +
            0.02,
          );
        }
      },
    );

    it(
      'should reduce visible radii uniformly when the local planetary package is dense',
      () => {
        const scale =
          buildTripleHierarchicalSystemScaleV1({
            outerRadiusAu:
              22,
            targetOuterRadiusScene:
              4.8,
            innerBinaryPeriapsisAu:
              0.07,
            innerBinaryApoapsisAu:
              0.14,
            localPlanetOuterRadiusAu:
              2.6,
            outerRelativePeriapsisAu:
              7,
            outerRelativeApoapsisAu:
              16,
            primaryStarRadiusScene:
              0.3,
            secondaryStarRadiusScene:
              0.28,
            tertiaryStarRadiusScene:
              0.25,
            maxPlanetRadiusScene:
              0.072,
            innerPairOuterScale:
              0.4,
            tertiaryOuterScale:
              -0.6,
          });

        const planets =
          Array.from(
            {
              length:
                12,
            },
            (
              _,
              index,
            ) =>
              body(
                index,
                0.34 +
                  index *
                    0.17,
                0.025,
                0.066,
              ),
          );

        const layout =
          buildTripleDensePlanetaryLayoutV1(
            planets,
            scale,
          )!;

        expect(
          layout.radiusScale,
        ).toBeLessThanOrEqual(
          1,
        );

        expect(
          layout.radiusScale,
        ).toBeGreaterThanOrEqual(
          0.46,
        );

        for (
          const entry
          of layout.entries
        ) {
          expect(
            entry.radiusScene,
          ).toBeLessThanOrEqual(
            0.066,
          );

          expect(
            entry.scenePerAu,
          ).toBeGreaterThan(
            0,
          );
        }
      },
    );
  },
);

function body(
  ordinal:
    number,

  semiMajorAxisAu:
    number,

  eccentricity:
    number,

  radiusScene:
    number,
) {

  return Object.freeze({
    ordinal,
    semiMajorAxisAu,
    eccentricity,
    radiusScene,
  });
}
