import {
  DiscoveryState,
} from '../discovery/discovery-state';

import {
  DiscoveryTargetType,
} from '../discovery/discovery-target-type';

import {
  DiscoveryRewardReason,
} from './discovery-reward-reason';

import {
  DiscoveryRewardResult,
} from './discovery-reward-result';

import {
  ExplorationProgressResult,
} from './exploration-progress-result';

describe(
  'DiscoveryRewardResult',
  () => {

    function progressingResult():
      ExplorationProgressResult {

      return new ExplorationProgressResult(
        DiscoveryTargetType.SYSTEM,
        DiscoveryState.UNKNOWN,
        DiscoveryState.DISCOVERED,
        [
          DiscoveryState.DETECTED,
          DiscoveryState.DISCOVERED,
        ],
        18,
      );
    }

    function sameStateResult():
      ExplorationProgressResult {

      return new ExplorationProgressResult(
        DiscoveryTargetType.SYSTEM,
        DiscoveryState.DISCOVERED,
        DiscoveryState.DISCOVERED,
        [],
        0,
      );
    }

    it(
      'should expose base bonus total and immutable canonical reasons',
      () => {
        const result =
          new DiscoveryRewardResult(
            progressingResult(),
            [
              DiscoveryRewardReason.SYSTEM_DISCOVERY,
              DiscoveryRewardReason.EXTREME_EVENT_CONFIRMATION,
            ],
            192,
            210,
          );

        expect(
          result.baseDiscoveryPoints,
        ).toBe(
          18,
        );

        expect(
          result.didAwardBonus,
        ).toBe(
          true,
        );

        expect(
          result.totalAwardedDiscoveryPoints,
        ).toBe(
          210,
        );

        expect(
          Object.isFrozen(
            result.awardedRewardReasons,
          ),
        ).toBe(
          true,
        );
      },
    );

    it(
      'should reject invalid bonus total values and inconsistent totals',
      () => {
        expect(
          () =>
            new DiscoveryRewardResult(
              progressingResult(),
              [],
              -1,
              17,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new DiscoveryRewardResult(
              progressingResult(),
              [],
              0,
              -1,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new DiscoveryRewardResult(
              progressingResult(),
              [],
              12,
              31,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject duplicate unsupported and non-canonical reward reason lists',
      () => {
        expect(
          () =>
            new DiscoveryRewardResult(
              progressingResult(),
              [
                DiscoveryRewardReason.SYSTEM_DISCOVERY,
                DiscoveryRewardReason.SYSTEM_DISCOVERY,
              ],
              24,
              42,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new DiscoveryRewardResult(
              progressingResult(),
              [
                DiscoveryRewardReason.EXTREME_EVENT_CONFIRMATION,
                DiscoveryRewardReason.SYSTEM_DISCOVERY,
              ],
              192,
              210,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new DiscoveryRewardResult(
              progressingResult(),
              [
                'UNKNOWN_REASON' as
                  DiscoveryRewardReason,
              ],
              1,
              19,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should enforce zero reward invariants when no discovery progress occurred',
      () => {
        const valid =
          new DiscoveryRewardResult(
            sameStateResult(),
            [],
            0,
            0,
          );

        expect(
          valid.didAwardBonus,
        ).toBe(
          false,
        );

        expect(
          () =>
            new DiscoveryRewardResult(
              sameStateResult(),
              [
                DiscoveryRewardReason.SYSTEM_DISCOVERY,
              ],
              0,
              0,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new DiscoveryRewardResult(
              sameStateResult(),
              [],
              1,
              1,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
