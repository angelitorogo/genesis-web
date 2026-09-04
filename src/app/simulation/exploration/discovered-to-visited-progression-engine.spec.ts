import {
  DiscoveryState,
  type DiscoveryStateValue,
} from '../../domain/discovery/discovery-state';

import {
  DiscoveredToVisitedEntryKind,
} from '../../domain/discovery/discovered-to-visited-entry';

import {
  DiscoveredToVisitedProgressionEngine,
} from './discovered-to-visited-progression-engine';

describe(
  'DiscoveredToVisitedProgressionEngine point 26.A.4',
  () => {
    it(
      'should advance exactly DISCOVERED to VISITED for either official detailed-entry surface',
      () => {
        for (
          const kind
          of Object.values(
            DiscoveredToVisitedEntryKind,
          )
        ) {
          const result =
            DiscoveredToVisitedProgressionEngine
              .evaluate(
                DiscoveryState.DISCOVERED,
                kind,
              );

          expect(
            result.stateBefore,
          ).toBe(
            DiscoveryState.DISCOVERED,
          );

          expect(
            result.stateAfter,
          ).toBe(
            DiscoveryState.VISITED,
          );

          expect(
            result.isVisitEligible,
          ).toBe(true);

          expect(
            result.didAdvance,
          ).toBe(true);
        }
      },
    );

    it(
      'should keep DETECTED unresolved when its existing read-only route is opened',
      () => {
        const result =
          DiscoveredToVisitedProgressionEngine
            .evaluate(
              DiscoveryState.DETECTED,
              DiscoveredToVisitedEntryKind
                .SCENE,
            );

        expect(
          result.stateBefore,
        ).toBe(
          DiscoveryState.DETECTED,
        );

        expect(
          result.stateAfter,
        ).toBe(
          DiscoveryState.DETECTED,
        );

        expect(
          result.isVisitEligible,
        ).toBe(false);

        expect(
          result.didAdvance,
        ).toBe(false);
      },
    );

    it(
      'should make repeated entries idempotent and preserve higher scientific states without regression',
      () => {
        for (
          const state
          of [
            DiscoveryState.VISITED,
            DiscoveryState.CATALOGUED,
            DiscoveryState.CONFIRMED,
          ]
        ) {
          const result =
            DiscoveredToVisitedProgressionEngine
              .evaluate(
                state,
                DiscoveredToVisitedEntryKind
                  .DETAILED_CARD,
              );

          expect(
            result.stateBefore,
          ).toBe(
            state,
          );

          expect(
            result.stateAfter,
          ).toBe(
            state,
          );

          expect(
            result.isVisitEligible,
          ).toBe(true);

          expect(
            result.didAdvance,
          ).toBe(false);
        }
      },
    );

    it(
      'should reject UNKNOWN so entering a route cannot materialize previously unknown knowledge',
      () => {
        expect(
          () =>
            DiscoveredToVisitedProgressionEngine
              .evaluate(
                DiscoveryState.UNKNOWN,
                DiscoveredToVisitedEntryKind
                  .SCENE,
              ),
        ).toThrow(
          /UNKNOWN/,
        );
      },
    );

    it(
      'should reject synthetic entry kinds before any state transition is assessed',
      () => {
        expect(
          () =>
            DiscoveredToVisitedProgressionEngine
              .evaluate(
                DiscoveryState.DISCOVERED,
                'PREVIEW' as never,
              ),
        ).toThrow(
          /entry kind|detailed-entry kind/i,
        );
      },
    );

    it(
      'should canonicalize equivalent state values by stable code and return interaction metadata only',
      () => {
        const discoveredClone =
          {
            code:
              DiscoveryState.DISCOVERED.code,
          } as DiscoveryStateValue;

        const result =
          DiscoveredToVisitedProgressionEngine
            .evaluate(
              discoveredClone,
              DiscoveredToVisitedEntryKind
                .SCENE,
            );

        expect(
          result.stateBefore,
        ).toBe(
          DiscoveryState.DISCOVERED,
        );

        expect(
          Object.keys(
            result,
          ),
        ).toEqual([
          'entryKind',
          'stateBefore',
          'stateAfter',
          'isVisitEligible',
          'didAdvance',
        ]);

        expect(
          Object.isFrozen(
            result,
          ),
        ).toBe(true);
      },
    );
  },
);
