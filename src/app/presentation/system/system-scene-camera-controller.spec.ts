import {
  systemSceneBodyFocusDistance,
  systemSceneTrackedBodyMinDistanceV1,
  systemSceneCameraLimits,
  systemScenePointerTravelPixels,
} from './system-scene-camera-controller';

describe(
  'SystemSceneCameraController point 24.7 body tracking',
  () => {
    it(
      'should derive finite zoom/pan bounds from the visible system extent without touching domain physics',
      () => {
        const limits =
          systemSceneCameraLimits(
            4.8,
          );

        expect(
          limits.homeDistance,
        ).toBeCloseTo(
          10.8,
          12,
        );

        expect(
          limits.minDistance,
        ).toBeCloseTo(
          0.08,
          12,
        );

        expect(
          limits.maxDistance,
        ).toBeCloseTo(
          59.4,
          12,
        );

        expect(
          limits.maxTargetRadius,
        ).toBeCloseTo(
          6.96,
          12,
        );

        expect(
          systemSceneCameraLimits(
            Number.NaN,
          ),
        ).toEqual(
          systemSceneCameraLimits(
            4.8,
          ),
        );
      },
    );

    it(
      'should derive a readable body-follow distance from presentation radius without changing body coordinates',
      () => {
        expect(
          systemSceneBodyFocusDistance(
            0.30,
            0.28,
            59.4,
          ),
        ).toBeCloseTo(
          2.55,
          12,
        );

        expect(
          systemSceneBodyFocusDistance(
            0.04,
            0.28,
            59.4,
          ),
        ).toBeCloseTo(
          0.78,
          12,
        );

        expect(
          systemSceneBodyFocusDistance(
            Number.NaN,
            Number.NaN,
            Number.NaN,
          ),
        ).toBeGreaterThan(
          0,
        );
      },
    );

    it('allows much closer camera limits and body following only when the laboratory opts in', () => {
      const normal = systemSceneCameraLimits(8);
      const laboratory = systemSceneCameraLimits(8, true);
      expect(laboratory.homeDistance).toBe(normal.homeDistance);
      expect(laboratory.maxDistance).toBe(normal.maxDistance);
      expect(laboratory.minDistance).toBeLessThan(normal.minDistance * 0.1);
      expect(systemSceneCameraLimits(8)).toEqual(normal);
      expect(systemSceneBodyFocusDistance(0.04, laboratory.minDistance, laboratory.maxDistance, true))
        .toBeLessThan(systemSceneBodyFocusDistance(0.04, normal.minDistance, normal.maxDistance));
      expect(systemSceneBodyFocusDistance(0.30, laboratory.minDistance, laboratory.maxDistance, true))
        .toBeGreaterThan(0.30 * 3);
    });

    it('has the same near-zoom floor across single, binary and triple system extents', () => {
      const single = systemSceneCameraLimits(4.8);
      const binary = systemSceneCameraLimits(38);
      const triple = systemSceneCameraLimits(180);
      expect(single.minDistance).toBe(0.08);
      expect(binary.minDistance).toBe(single.minDistance);
      expect(triple.minDistance).toBe(single.minDistance);
      expect(triple.homeDistance).toBeGreaterThan(single.homeDistance);
    });

    it('allows close tracking around the body itself, not its stellar architecture', () => {
      expect(systemSceneTrackedBodyMinDistanceV1(0.3)).toBeCloseTo(0.336, 12);
      expect(systemSceneTrackedBodyMinDistanceV1(0.04)).toBeCloseTo(0.0448, 12);
      expect(systemSceneTrackedBodyMinDistanceV1(0.01)).toBe(0.025);
      expect(systemSceneTrackedBodyMinDistanceV1(Number.NaN)).toBeCloseTo(0.0448, 12);
      expect(systemSceneTrackedBodyMinDistanceV1(0.04)).toBeLessThan(
        systemSceneBodyFocusDistance(0.04, 0.08, 100),
      );
    });

    it(
      'should classify pointer travel independently from render frame rate',
      () => {
        expect(
          systemScenePointerTravelPixels(
            10,
            20,
            13,
            24,
          ),
        ).toBe(
          5,
        );
      },
    );
  },
);
