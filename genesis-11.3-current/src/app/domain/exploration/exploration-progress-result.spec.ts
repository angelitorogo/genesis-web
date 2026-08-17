import {
  DiscoveryState,
} from '../discovery/discovery-state';

import {
  DiscoveryTargetType,
} from '../discovery/discovery-target-type';

import {
  ExplorationProgressResult,
} from './exploration-progress-result';

describe(
  'ExplorationProgressResult',
  () => {

    it(
      'should expose progression and freeze crossed milestones for a valid result',
      () => {
        const result =
          new ExplorationProgressResult(
            DiscoveryTargetType.SYSTEM,
            DiscoveryState.UNKNOWN,
            DiscoveryState.DISCOVERED,
            [
              DiscoveryState.DETECTED,
              DiscoveryState.DISCOVERED,
            ],
            18,
          );

        expect(
          result.didProgress,
        ).toBe(
          true,
        );

        expect(
          result.crossedMilestones,
        ).toEqual([
          DiscoveryState.DETECTED,
          DiscoveryState.DISCOVERED,
        ]);

        expect(
          Object.isFrozen(
            result.crossedMilestones,
          ),
        ).toBe(
          true,
        );
      },
    );

    it(
      'should validate same-state non-progress invariants',
      () => {
        const result =
          new ExplorationProgressResult(
            DiscoveryTargetType.BODY,
            DiscoveryState.DISCOVERED,
            DiscoveryState.DISCOVERED,
            [],
            0,
          );

        expect(
          result.didProgress,
        ).toBe(
          false,
        );

        expect(
          () =>
            new ExplorationProgressResult(
              DiscoveryTargetType.BODY,
              DiscoveryState.DISCOVERED,
              DiscoveryState.DISCOVERED,
              [
                DiscoveryState.VISITED,
              ],
              0,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new ExplorationProgressResult(
              DiscoveryTargetType.BODY,
              DiscoveryState.DISCOVERED,
              DiscoveryState.DISCOVERED,
              [],
              1,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject negative awards and regressive transitions',
      () => {
        expect(
          () =>
            new ExplorationProgressResult(
              DiscoveryTargetType.SYSTEM,
              DiscoveryState.UNKNOWN,
              DiscoveryState.DETECTED,
              [
                DiscoveryState.DETECTED,
              ],
              -1,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new ExplorationProgressResult(
              DiscoveryTargetType.SYSTEM,
              DiscoveryState.VISITED,
              DiscoveryState.DISCOVERED,
              [],
              0,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should enforce crossed milestone ordering uniqueness and bounds',
      () => {
        expect(
          () =>
            new ExplorationProgressResult(
              DiscoveryTargetType.SYSTEM,
              DiscoveryState.UNKNOWN,
              DiscoveryState.DISCOVERED,
              [
                DiscoveryState.UNKNOWN,
                DiscoveryState.DETECTED,
                DiscoveryState.DISCOVERED,
              ],
              18,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new ExplorationProgressResult(
              DiscoveryTargetType.SYSTEM,
              DiscoveryState.UNKNOWN,
              DiscoveryState.DISCOVERED,
              [
                DiscoveryState.DETECTED,
                DiscoveryState.DETECTED,
                DiscoveryState.DISCOVERED,
              ],
              18,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new ExplorationProgressResult(
              DiscoveryTargetType.SYSTEM,
              DiscoveryState.UNKNOWN,
              DiscoveryState.DISCOVERED,
              [
                DiscoveryState.DISCOVERED,
                DiscoveryState.DETECTED,
              ],
              18,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new ExplorationProgressResult(
              DiscoveryTargetType.SYSTEM,
              DiscoveryState.DETECTED,
              DiscoveryState.DISCOVERED,
              [
                DiscoveryState.DETECTED,
                DiscoveryState.DISCOVERED,
              ],
              12,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new ExplorationProgressResult(
              DiscoveryTargetType.SYSTEM,
              DiscoveryState.UNKNOWN,
              DiscoveryState.DETECTED,
              [],
              6,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
