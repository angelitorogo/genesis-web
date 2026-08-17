import {
  DiscoveryState,
} from '../discovery/discovery-state';

import {
  ExplorationSectorProgressResult,
} from './exploration-sector-progress-result';

describe(
  'ExplorationSectorProgressResult',
  () => {
    it(
      'should expose only safe progression values for a static DETECTED result',
      () => {
        const result =
          new ExplorationSectorProgressResult(
            14,
            10n,
            24n,
            2n,
            4n,
            DiscoveryState.DETECTED,
            DiscoveryState.DETECTED,
          );

        expect(
          result.didAwardDiscoveryPoints,
        ).toBe(true);

        expect(
          result.galaxyProgressDelta,
        ).toBe(2n);

        expect(
          Object.keys(result),
        ).not.toContain(
          'groundTruth',
        );
      },
    );

    it(
      'should support transient progression without inventing a persisted result state',
      () => {
        const result =
          new ExplorationSectorProgressResult(
            2,
            0n,
            2n,
            2n,
            3n,
            DiscoveryState.DETECTED,
            null,
          );

        expect(
          result.resultState,
        ).toBeNull();
      },
    );

    it(
      'should support idempotent repeated scans with zero PD and zero local delta',
      () => {
        const result =
          new ExplorationSectorProgressResult(
            0,
            14n,
            14n,
            4n,
            4n,
            DiscoveryState.DETECTED,
            DiscoveryState.DETECTED,
          );

        expect(
          result.didAwardDiscoveryPoints,
        ).toBe(false);

        expect(
          result.galaxyProgressDelta,
        ).toBe(0n);
      },
    );

    it(
      'should reject inconsistent global totals and regressive local progress',
      () => {
        expect(
          () =>
            new ExplorationSectorProgressResult(
              2,
              0n,
              3n,
              2n,
              3n,
              DiscoveryState.DETECTED,
              null,
            ),
        ).toThrow(RangeError);

        expect(
          () =>
            new ExplorationSectorProgressResult(
              0,
              0n,
              0n,
              3n,
              2n,
              DiscoveryState.DETECTED,
              null,
            ),
        ).toThrow(RangeError);
      },
    );

    it(
      'should reject UNKNOWN states, invalid awards and signed-Long overflow',
      () => {
        expect(
          () =>
            new ExplorationSectorProgressResult(
              -1,
              0n,
              0n,
              0n,
              0n,
              DiscoveryState.DETECTED,
              null,
            ),
        ).toThrow(RangeError);

        expect(
          () =>
            new ExplorationSectorProgressResult(
              0,
              0n,
              0n,
              0n,
              0n,
              DiscoveryState.UNKNOWN,
              null,
            ),
        ).toThrow(RangeError);

        expect(
          () =>
            new ExplorationSectorProgressResult(
              0,
              9_223_372_036_854_775_808n,
              9_223_372_036_854_775_808n,
              0n,
              0n,
              DiscoveryState.DETECTED,
              null,
            ),
        ).toThrow(RangeError);
      },
    );
  },
);
