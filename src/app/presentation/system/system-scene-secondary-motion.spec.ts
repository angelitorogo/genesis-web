import {
  systemSceneMinorBodyPresentationTimeScale,
  systemSceneMoonPresentationTimeScale,
} from './system-scene-secondary-motion';

describe(
  'SystemScene secondary motion point 24.6',
  () => {
    it(
      'should slow visually-fast moon contributions without changing their physical period',
      () => {
        const scale =
          systemSceneMoonPresentationTimeScale(
            2,
            36,
          );

        expect(
          scale,
        ).toBeCloseTo(
          2 /
          36 /
          8,
          12,
        );

        expect(
          scale,
        ).toBeLessThan(
          1,
        );
      },
    );

    it(
      'should not slow a moon that is already readable at the system playback cadence',
      () => {
        expect(
          systemSceneMoonPresentationTimeScale(
            90,
            5,
          ),
        ).toBe(
          1,
        );
      },
    );

    it(
      'should keep an absolute lower bound for extreme accelerated scenes',
      () => {
        expect(
          systemSceneMoonPresentationTimeScale(
            0.1,
            3_650,
          ),
        ).toBe(
          0.001,
        );
      },
    );


    it(
      'should slow visually-fast minor-body contributions without changing their physical period',
      () => {
        const scale =
          systemSceneMinorBodyPresentationTimeScale(
            12,
            36,
          );

        expect(
          scale,
        ).toBeCloseTo(
          12 /
          36 /
          12,
          12,
        );

        expect(
          scale,
        ).toBeLessThan(
          1,
        );
      },
    );

    it(
      'should keep full cadence for already-readable minor-body periods',
      () => {
        expect(
          systemSceneMinorBodyPresentationTimeScale(
            365,
            12,
          ),
        ).toBe(
          1,
        );
      },
    );
  },
);
