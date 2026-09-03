import {
  DiscoveryState,
  type DiscoveryStateValue,
} from './discovery-state';

import {
  DiscoveryStateTransitionContractV1,
  DiscoveryStateTransitionKind,
} from './discovery-state-transition-contract';

describe(
  'DiscoveryStateTransitionContractV1 point 26.A.1',
  () => {
    const progression = [
      DiscoveryState.UNKNOWN,
      DiscoveryState.DETECTED,
      DiscoveryState.DISCOVERED,
      DiscoveryState.VISITED,
      DiscoveryState.CATALOGUED,
      DiscoveryState.CONFIRMED,
    ] as const;

    it(
      'should freeze the exact six-state official progression without changing stable DiscoveryState codes',
      () => {
        expect(
          DiscoveryStateTransitionContractV1
            .progression,
        ).toEqual(
          progression,
        );

        expect(
          DiscoveryStateTransitionContractV1
            .progression
            .map(
              state =>
                state.code,
            ),
        ).toEqual([
          0,
          1,
          2,
          3,
          4,
          5,
        ]);

        expect(
          Object.isFrozen(
            DiscoveryStateTransitionContractV1
              .progression,
          ),
        ).toBe(true);
      },
    );

    it(
      'should expose exactly one next state and make CONFIRMED terminal',
      () => {
        expect(
          DiscoveryStateTransitionContractV1
            .nextOrNull(
              DiscoveryState.UNKNOWN,
            ),
        ).toBe(
          DiscoveryState.DETECTED,
        );

        expect(
          DiscoveryStateTransitionContractV1
            .nextOrNull(
              DiscoveryState.DETECTED,
            ),
        ).toBe(
          DiscoveryState.DISCOVERED,
        );

        expect(
          DiscoveryStateTransitionContractV1
            .nextOrNull(
              DiscoveryState.DISCOVERED,
            ),
        ).toBe(
          DiscoveryState.VISITED,
        );

        expect(
          DiscoveryStateTransitionContractV1
            .nextOrNull(
              DiscoveryState.VISITED,
            ),
        ).toBe(
          DiscoveryState.CATALOGUED,
        );

        expect(
          DiscoveryStateTransitionContractV1
            .nextOrNull(
              DiscoveryState.CATALOGUED,
            ),
        ).toBe(
          DiscoveryState.CONFIRMED,
        );

        expect(
          DiscoveryStateTransitionContractV1
            .nextOrNull(
              DiscoveryState.CONFIRMED,
            ),
        ).toBeNull();
      },
    );

    it(
      'should allow only adjacent forward advancement across the complete state matrix',
      () => {
        for (
          let beforeIndex =
            0;
          beforeIndex <
            progression.length;
          beforeIndex +=
            1
        ) {
          for (
            let afterIndex =
              0;
            afterIndex <
              progression.length;
            afterIndex +=
              1
          ) {
            const stateBefore =
              progression[
                beforeIndex
              ]!;

            const stateAfter =
              progression[
                afterIndex
              ]!;

            const assessment =
              DiscoveryStateTransitionContractV1
                .assess(
                  stateBefore,
                  stateAfter,
                );

            const delta =
              afterIndex -
              beforeIndex;

            expect(
              assessment.isAllowed,
            ).toBe(
              delta ===
                0 ||
              delta ===
                1,
            );

            expect(
              assessment.advancesKnowledge,
            ).toBe(
              delta ===
              1,
            );

            expect(
              assessment.kind,
            ).toBe(
              delta ===
                0
                ? DiscoveryStateTransitionKind.IDEMPOTENT
                : delta ===
                    1
                  ? DiscoveryStateTransitionKind.ADVANCE
                  : delta >
                      1
                    ? DiscoveryStateTransitionKind.SKIP
                    : DiscoveryStateTransitionKind.REGRESSION,
            );
          }
        }
      },
    );

    it(
      'should keep same-state retries idempotent without treating them as scientific progress',
      () => {
        for (
          const state
          of progression
        ) {
          const assessment =
            DiscoveryStateTransitionContractV1
              .assess(
                state,
                state,
              );

          expect(
            assessment.kind,
          ).toBe(
            DiscoveryStateTransitionKind
              .IDEMPOTENT,
          );

          expect(
            assessment.isAllowed,
          ).toBe(true);

          expect(
            assessment.advancesKnowledge,
          ).toBe(false);

          expect(
            Object.isFrozen(
              assessment,
            ),
          ).toBe(true);
        }
      },
    );

    it(
      'should reject forward skips and every regression',
      () => {
        const skip =
          DiscoveryStateTransitionContractV1
            .assess(
              DiscoveryState.DETECTED,
              DiscoveryState.CATALOGUED,
            );

        expect(
          skip.kind,
        ).toBe(
          DiscoveryStateTransitionKind
            .SKIP,
        );

        expect(
          skip.isAllowed,
        ).toBe(false);

        const regression =
          DiscoveryStateTransitionContractV1
            .assess(
              DiscoveryState.CATALOGUED,
              DiscoveryState.DISCOVERED,
            );

        expect(
          regression.kind,
        ).toBe(
          DiscoveryStateTransitionKind
            .REGRESSION,
        );

        expect(
          regression.isAllowed,
        ).toBe(false);

        expect(
          () =>
            DiscoveryStateTransitionContractV1
              .assertAllowed(
                DiscoveryState.DETECTED,
                DiscoveryState.CATALOGUED,
              ),
        ).toThrow(
          /26\.A\.1.*SKIP/,
        );

        expect(
          () =>
            DiscoveryStateTransitionContractV1
              .assertAllowed(
                DiscoveryState.CATALOGUED,
                DiscoveryState.DISCOVERED,
              ),
        ).toThrow(
          /26\.A\.1.*REGRESSION/,
        );
      },
    );

    it(
      'should canonicalize equivalent state values by stable code before assessing them',
      () => {
        const detectedClone =
          {
            code:
              DiscoveryState.DETECTED.code,
          } as DiscoveryStateValue;

        const discoveredClone =
          {
            code:
              DiscoveryState.DISCOVERED.code,
          } as DiscoveryStateValue;

        const assessment =
          DiscoveryStateTransitionContractV1
            .assess(
              detectedClone,
              discoveredClone,
            );

        expect(
          assessment.stateBefore,
        ).toBe(
          DiscoveryState.DETECTED,
        );

        expect(
          assessment.stateAfter,
        ).toBe(
          DiscoveryState.DISCOVERED,
        );

        expect(
          assessment.kind,
        ).toBe(
          DiscoveryStateTransitionKind
            .ADVANCE,
        );

        expect(
          () =>
            DiscoveryStateTransitionContractV1
              .assertAllowed(
                detectedClone,
                discoveredClone,
              ),
        ).not.toThrow();
      },
    );
  },
);
