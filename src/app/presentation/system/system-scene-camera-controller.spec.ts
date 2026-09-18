import {
  systemSceneBodyFocusDistance,
  systemSceneCameraLimits,
  systemSceneBinaryCloseUpMinDistance,
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
          0.28,
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

    it('should allow V2 binary close-up independent of the full A/B frame', () => {
      expect(systemSceneBinaryCloseUpMinDistance(2.2, 0.08)).toBeCloseTo(0.10, 12);
      expect(systemSceneBinaryCloseUpMinDistance(0.28, 0.08)).toBeCloseTo(0.10, 12);
      expect(systemSceneBinaryCloseUpMinDistance(2.2, 0.01)).toBeCloseTo(0.045, 12);
      expect(systemSceneBinaryCloseUpMinDistance(0.06, 0.08)).toBeCloseTo(0.06, 12);
      expect(() => systemSceneBinaryCloseUpMinDistance(2.2, Number.NaN)).toThrow(RangeError);
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
