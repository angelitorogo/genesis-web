import {
  SystemSceneActiveTime,
  systemSceneAnimationLoopRequired,
} from './system-scene-active-time';

describe(
  'SystemScene active renderer time point 24.9',
  () => {
    it(
      'should exclude hidden-tab intervals so orbital and tracking animation resume without a time jump',
      () => {
        const time =
          new SystemSceneActiveTime();

        expect(
          time.project(
            1_000,
          ),
        ).toBe(
          1_000,
        );

        time.setVisible(
          false,
          1_250,
        );

        expect(
          time.project(
            6_250,
          ),
        ).toBe(
          1_250,
        );

        time.setVisible(
          true,
          6_250,
        );

        expect(
          time.project(
            6_750,
          ),
        ).toBe(
          1_750,
        );
      },
    );

    it(
      'should make visibility transitions idempotent',
      () => {
        const time =
          new SystemSceneActiveTime();

        time.setVisible(
          false,
          2_000,
        );
        time.setVisible(
          false,
          2_500,
        );
        time.setVisible(
          true,
          5_000,
        );
        time.setVisible(
          true,
          5_500,
        );

        expect(
          time.project(
            6_000,
          ),
        ).toBe(
          3_000,
        );
      },
    );

    it(
      'should stop every animation loop while hidden and only run visible motion or body tracking',
      () => {
        expect(
          systemSceneAnimationLoopRequired(
            false,
            12,
            true,
          ),
        ).toBe(
          false,
        );

        expect(
          systemSceneAnimationLoopRequired(
            true,
            1,
            false,
          ),
        ).toBe(
          true,
        );

        expect(
          systemSceneAnimationLoopRequired(
            true,
            0,
            true,
          ),
        ).toBe(
          true,
        );

        expect(
          systemSceneAnimationLoopRequired(
            true,
            0,
            false,
          ),
        ).toBe(
          false,
        );
      },
    );

    it(
      'should reject non-finite timestamps rather than poisoning the renderer clock',
      () => {
        const time =
          new SystemSceneActiveTime();

        expect(
          () =>
            time.project(
              Number.NaN,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
