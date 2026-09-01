import {
  buildLinearFitSystemScale,
  buildMultipleAdaptiveSystemScaleV1,
  buildSingleAdaptiveSystemScaleV1,
  buildTripleHierarchicalSystemScaleV1,
  singleSystemPlanetRadiusScene,
  singleSystemStarRadiusScene,
  SystemSceneProjectionSpace,
  SystemSceneScaleProjectionMode,
  systemSceneProjectAuVector,
  systemSceneProjectAuVectorInSpace,
  systemSceneProjectedRadiusAu,
} from './system-scene-scale-projection';

describe(
  'SystemSceneScaleProjection point 24.5 V3',
  () => {
    it(
      'should reserve readable space for the innermost SINGLE periapsis while fitting the outer system',
      () => {
        const starRadiusScene =
          singleSystemStarRadiusScene(
            1,
          );

        const maxPlanetRadiusScene =
          singleSystemPlanetRadiusScene(
            11.2,
          );

        const scale =
          buildSingleAdaptiveSystemScaleV1({
            outerRadiusAu:
              12,
            targetOuterRadiusScene:
              4.8,
            innerPeriapsisAu:
              0.045,
            starRadiusScene,
            maxPlanetRadiusScene,
          });

        expect(
          scale.projectionMode,
        ).toBe(
          SystemSceneScaleProjectionMode
            .SINGLE_ADAPTIVE_LOG_V1,
        );

        expect(
          systemSceneProjectedRadiusAu(
            0.045,
            scale,
          ),
        ).toBeGreaterThan(
          starRadiusScene +
          maxPlanetRadiusScene +
          0.2,
        );

        expect(
          systemSceneProjectedRadiusAu(
            12,
            scale,
          ),
        ).toBeCloseTo(
          4.8,
          12,
        );
      },
    );

    it(
      'should remain monotonic and expand inner orbital separations compared with linear fit',
      () => {
        const adaptive =
          buildSingleAdaptiveSystemScaleV1({
            outerRadiusAu:
              10,
            targetOuterRadiusScene:
              4.8,
            innerPeriapsisAu:
              0.1,
            starRadiusScene:
              0.28,
            maxPlanetRadiusScene:
              0.06,
          });

        const linear =
          buildLinearFitSystemScale(
            10,
            4.8,
          );

        const physicalRadiiAu = [
          0.1,
          0.2,
          0.5,
          1,
          3,
          10,
        ];

        const projected =
          physicalRadiiAu.map(
            radiusAu =>
              systemSceneProjectedRadiusAu(
                radiusAu,
                adaptive,
              ),
          );

        expect(
          projected.every(
            (
              value,
              index,
            ) =>
              index ===
                0 ||
              value >
                projected[
                  index - 1
                ]!,
          ),
        ).toBe(true);

        expect(
          projected[0],
        ).toBeGreaterThan(
          systemSceneProjectedRadiusAu(
            physicalRadiiAu[0]!,
            linear,
          ),
        );
      },
    );

    it(
      'should preserve orbital direction while changing only radial presentation distance',
      () => {
        const scale =
          buildSingleAdaptiveSystemScaleV1({
            outerRadiusAu:
              8,
            targetOuterRadiusScene:
              4.8,
            innerPeriapsisAu:
              0.2,
            starRadiusScene:
              0.26,
            maxPlanetRadiusScene:
              0.05,
          });

        const projected =
          systemSceneProjectAuVector(
            {
              x:
                1,
              y:
                2,
              z:
                -3,
            },
            scale,
          );

        expect(
          projected.y /
          projected.x,
        ).toBeCloseTo(
          2,
          12,
        );

        expect(
          projected.z /
          projected.x,
        ).toBeCloseTo(
          -3,
          12,
        );
      },
    );

    it(
      'should reduce the 24.2 placeholder planet exaggeration now that 24.4 zoom exists',
      () => {
        const sunLike =
          singleSystemStarRadiusScene(
            1,
          );

        const earthLike =
          singleSystemPlanetRadiusScene(
            1,
          );

        const jupiterLike =
          singleSystemPlanetRadiusScene(
            11.2,
          );

        expect(
          earthLike,
        ).toBeLessThan(
          jupiterLike,
        );

        expect(
          jupiterLike /
          sunLike,
        ).toBeLessThan(
          0.3,
        );
      },
    );
    it(
      'should preserve the accepted BINARY adaptive scale unchanged',
      () => {
        const scale =
          buildMultipleAdaptiveSystemScaleV1({
            architecture:
              'BINARY',
            outerRadiusAu:
              16,
            targetOuterRadiusScene:
              4.8,
            innerBinaryPeriapsisAu:
              0.08,
            primaryStarRadiusScene:
              0.28,
            secondaryStarRadiusScene:
              0.24,
          });

        expect(
          scale.projectionMode,
        ).toBe(
          SystemSceneScaleProjectionMode
            .BINARY_ADAPTIVE_LOG_V1,
        );
      },
    );

    it(
      'should compose TRIPLE outer and local projection spaces without deforming the inner subsystem',
      () => {
        const scale =
          buildTripleHierarchicalSystemScaleV1({
            outerRadiusAu:
              18,
            targetOuterRadiusScene:
              4.8,
            innerBinaryPeriapsisAu:
              0.08,
            innerBinaryApoapsisAu:
              0.16,
            localPlanetOuterRadiusAu:
              3.4,
            outerRelativePeriapsisAu:
              5.2,
            outerRelativeApoapsisAu:
              12.4,
            primaryStarRadiusScene:
              0.28,
            secondaryStarRadiusScene:
              0.24,
            tertiaryStarRadiusScene:
              0.25,
            maxPlanetRadiusScene:
              0.07,
            innerPairOuterScale:
              -0.31,
            tertiaryOuterScale:
              0.69,
          });

        expect(
          scale.projectionMode,
        ).toBe(
          SystemSceneScaleProjectionMode
            .TRIPLE_HIERARCHICAL_V1,
        );

        const local =
          systemSceneProjectAuVectorInSpace(
            {
              x: 0.08,
              y: 0,
              z: 0,
            },
            scale,
            SystemSceneProjectionSpace.TRIPLE_LOCAL,
          );

        expect(
          Math.abs(
            local.x,
          ),
        ).toBeGreaterThan(
          0.52,
        );

        const outer =
          systemSceneProjectAuVectorInSpace(
            {
              x: 5.2,
              y: 0,
              z: 0,
            },
            scale,
            SystemSceneProjectionSpace.TRIPLE_OUTER,
          );

        expect(
          Math.abs(
            outer.x,
          ),
        ).toBeGreaterThan(
          scale.tripleHierarchy!
            .local
            .targetOuterRadiusScene,
        );
      },
    );


  },
);
