import {
  buildLinearFitSystemScale,
  buildMultipleAdaptiveSystemScaleV1,
  buildMultipleAdaptiveSystemScaleV3,
  buildSingleAdaptiveSystemScaleV1,
  buildSingleAdaptiveSystemScaleV3,
  buildTripleHierarchicalSystemScaleV1,
  buildTripleHierarchicalSystemScaleV3,
  singleSystemPlanetRadiusScene,
  singleSystemStarRadiusScene,
  SystemSceneProjectionSpace,
  SystemSceneScaleProjectionMode,
  systemSceneProjectAuVector,
  systemSceneProjectAuVectorInSpace,
  systemSceneProjectedOverlayRadiusAuInSpace,
  systemSceneProjectedRadiusAu,
  systemSceneProjectedRadiusAuInSpace,
} from './system-scene-scale-projection';

describe(
  'SystemSceneScaleProjection points 24.5 + 24.7',
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
      'should let scientific overlays extend beyond the fitted 24.5 radius without changing normal body projection',
      () => {
        const scale =
          buildSingleAdaptiveSystemScaleV1({
            outerRadiusAu:
              2,
            targetOuterRadiusScene:
              4.8,
            innerPeriapsisAu:
              0.1,
            starRadiusScene:
              0.28,
            maxPlanetRadiusScene:
              0.06,
          });

        expect(
          systemSceneProjectedRadiusAu(
            6,
            scale,
          ),
        ).toBeCloseTo(
          4.8,
          12,
        );

        const overlayInner =
          systemSceneProjectedOverlayRadiusAuInSpace(
            3,
            scale,
            SystemSceneProjectionSpace.GLOBAL,
          );

        const overlayOuter =
          systemSceneProjectedOverlayRadiusAuInSpace(
            6,
            scale,
            SystemSceneProjectionSpace.GLOBAL,
          );

        expect(
          overlayInner,
        ).toBeGreaterThan(
          4.8,
        );

        expect(
          overlayOuter,
        ).toBeGreaterThan(
          overlayInner,
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
    it(
      'should reserve substantial inner resolution for the 0.11-0.20 AU SINGLE HZ without changing radial order',
      () => {
        const scale =
          buildSingleAdaptiveSystemScaleV3({
            outerRadiusAu: 8,
            targetOuterRadiusScene: 4.8,
            innerPeriapsisAu: 0.42,
            starRadiusScene: 0.34,
            maxPlanetRadiusScene: 0.06,
            habitableZoneInnerAu: 0.11,
            habitableZoneOuterAu: 0.20,
          });

        const project =
          (radiusAu: number) =>
            systemSceneProjectedRadiusAu(
              radiusAu,
              scale,
            );

        const hzInner = project(0.11);
        const hzOuter = project(0.20);

        expect(scale.projectionMode).toBe(
          SystemSceneScaleProjectionMode.SINGLE_PRESENTATION_V3,
        );
        expect(hzInner).toBeGreaterThan(0.85);
        expect(hzOuter - hzInner).toBeGreaterThan(0.30);
        expect(hzInner).toBeLessThan(hzOuter);
        expect(hzOuter).toBeLessThan(project(0.42));
        expect(project(0.42)).toBeLessThan(project(1.2));
        expect(project(1.2)).toBeLessThan(project(8));
      },
    );

    it(
      'should also keep the reported 0.13-0.23 AU SINGLE HZ readable while fitting the complete system',
      () => {
        const scale =
          buildSingleAdaptiveSystemScaleV3({
            outerRadiusAu: 11,
            targetOuterRadiusScene: 4.8,
            innerPeriapsisAu: 0.52,
            starRadiusScene: 0.38,
            maxPlanetRadiusScene: 0.065,
            habitableZoneInnerAu: 0.13,
            habitableZoneOuterAu: 0.23,
          });

        const inner = systemSceneProjectedRadiusAu(0.13, scale);
        const outer = systemSceneProjectedRadiusAu(0.23, scale);

        expect(inner).toBeGreaterThan(0.85);
        expect(outer - inner).toBeGreaterThan(0.30);
        expect(systemSceneProjectedRadiusAu(11, scale)).toBeCloseTo(4.8, 12);
      },
    );

    it(
      'should use one shared V3 radial projection for BINARY HZ, periapsis, apoapsis and belt radii',
      () => {
        const scale =
          buildMultipleAdaptiveSystemScaleV3({
            architecture: 'BINARY',
            outerRadiusAu: 9,
            targetOuterRadiusScene: 4.8,
            innerBinaryPeriapsisAu: 0.08,
            primaryStarRadiusScene: 0.30,
            secondaryStarRadiusScene: 0.25,
            habitableZoneInnerAu: 0.13,
            habitableZoneOuterAu: 0.23,
          });

        const project =
          (radiusAu: number) =>
            systemSceneProjectedRadiusAuInSpace(
              radiusAu,
              scale,
              SystemSceneProjectionSpace.GLOBAL,
            );

        const physical = [0.13, 0.23, 0.31, 0.36, 0.42, 0.80, 1.25];
        const projected = physical.map(project);

        expect(scale.projectionMode).toBe(
          SystemSceneScaleProjectionMode.BINARY_PRESENTATION_V3,
        );
        expect(project(0.23) - project(0.13)).toBeGreaterThan(0.30);
        expect(
          projected.every((value, index) =>
            index === 0 || value > projected[index - 1]!,
          ),
        ).toBe(true);
      },
    );

    it(
      'should preserve the same local radial projection for TRIPLE HZ, planets and belts',
      () => {
        const scale =
          buildTripleHierarchicalSystemScaleV3({
            outerRadiusAu: 18,
            targetOuterRadiusScene: 4.8,
            innerBinaryPeriapsisAu: 0.07,
            innerBinaryApoapsisAu: 0.15,
            localPlanetOuterRadiusAu: 3.4,
            outerRelativePeriapsisAu: 5.2,
            outerRelativeApoapsisAu: 12.4,
            primaryStarRadiusScene: 0.30,
            secondaryStarRadiusScene: 0.25,
            tertiaryStarRadiusScene: 0.27,
            maxPlanetRadiusScene: 0.07,
            innerPairOuterScale: -0.31,
            tertiaryOuterScale: 0.69,
            habitableZoneInnerAu: 0.11,
            habitableZoneOuterAu: 0.20,
          });

        const projectLocal =
          (radiusAu: number) =>
            systemSceneProjectedRadiusAuInSpace(
              radiusAu,
              scale,
              SystemSceneProjectionSpace.TRIPLE_LOCAL,
            );

        expect(scale.projectionMode).toBe(
          SystemSceneScaleProjectionMode.TRIPLE_PRESENTATION_V3,
        );
        expect(projectLocal(0.20) - projectLocal(0.11)).toBeGreaterThan(0.30);

        const physical = [0.11, 0.20, 0.28, 0.35, 0.44, 0.90, 1.40, 3.40];
        const projected = physical.map(projectLocal);

        expect(
          projected.every((value, index) =>
            index === 0 || value > projected[index - 1]!,
          ),
        ).toBe(true);
      },
    );


  },
);
