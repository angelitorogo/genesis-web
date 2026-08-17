import {
  GalaxyExplorationProgress,
} from './galaxy-exploration-progress';

describe(
  'GalaxyExplorationProgress',
  () => {

    it(
      'should accept valid non-negative signed Long values',
      () => {
        const progress =
          new GalaxyExplorationProgress(
            0n,
            2n,
          );

        expect(
          progress.galaxyIndex,
        ).toBe(
          0n,
        );

        expect(
          progress.galaxyProgressUnits,
        ).toBe(
          2n,
        );
      },
    );

    it(
      'should reject negative galaxy indices',
      () => {
        expect(
          () =>
            new GalaxyExplorationProgress(
              -1n,
              0n,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject negative galaxy progress units',
      () => {
        expect(
          () =>
            new GalaxyExplorationProgress(
              0n,
              -1n,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should support the maximum signed Long values and reject overflow',
      () => {
        const max =
          9_223_372_036_854_775_807n;

        expect(
          new GalaxyExplorationProgress(
            max,
            max,
          ),
        ).toEqual(
          new GalaxyExplorationProgress(
            max,
            max,
          ),
        );

        expect(
          () =>
            new GalaxyExplorationProgress(
              max +
                1n,
              0n,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new GalaxyExplorationProgress(
              0n,
              max +
                1n,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
