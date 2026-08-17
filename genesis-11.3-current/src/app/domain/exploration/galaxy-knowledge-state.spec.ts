import {
  DiscoveryState,
} from '../discovery/discovery-state';

import {
  GalaxyKnowledgeState,
} from './galaxy-knowledge-state';

describe(
  'GalaxyKnowledgeState',
  () => {
    it(
      'should expose exactly the frozen point-11.2 four-state lifecycle',
      () => {
        expect(
          GalaxyKnowledgeState
            .values
            .map(
              (
                state,
              ) =>
                [
                  state.name,
                  state.code,
                ],
            ),
        ).toEqual([
          [
            'UNKNOWN',
            0,
          ],
          [
            'DETECTED',
            1,
          ],
          [
            'DISCOVERED',
            2,
          ],
          [
            'VISITED',
            3,
          ],
        ]);
      },
    );

    it(
      'should preserve UNKNOWN, DETECTED and DISCOVERED one-to-one',
      () => {
        expect(
          GalaxyKnowledgeState
            .fromDiscoveryState(
              DiscoveryState.UNKNOWN,
            ),
        ).toBe(
          GalaxyKnowledgeState.UNKNOWN,
        );

        expect(
          GalaxyKnowledgeState
            .fromDiscoveryState(
              DiscoveryState.DETECTED,
            ),
        ).toBe(
          GalaxyKnowledgeState.DETECTED,
        );

        expect(
          GalaxyKnowledgeState
            .fromDiscoveryState(
              DiscoveryState.DISCOVERED,
            ),
        ).toBe(
          GalaxyKnowledgeState.DISCOVERED,
        );
      },
    );

    it(
      'should project VISITED and every higher global knowledge state to VISITED',
      () => {
        for (
          const state
          of [
            DiscoveryState.VISITED,
            DiscoveryState.CATALOGUED,
            DiscoveryState.CONFIRMED,
          ]
        ) {
          expect(
            GalaxyKnowledgeState
              .fromDiscoveryState(
                state,
              ),
          ).toBe(
            GalaxyKnowledgeState.VISITED,
          );
        }
      },
    );

    it(
      'should round-trip every galaxy lifecycle state by code',
      () => {
        for (
          const state
          of GalaxyKnowledgeState
            .values
        ) {
          expect(
            GalaxyKnowledgeState
              .fromCode(
                state.code,
              ),
          ).toBe(
            state,
          );
        }
      },
    );

    it(
      'should reject unknown galaxy lifecycle codes',
      () => {
        expect(
          GalaxyKnowledgeState
            .fromCodeOrNull(
              -1,
            ),
        ).toBeNull();

        expect(
          GalaxyKnowledgeState
            .fromCodeOrNull(
              4,
            ),
        ).toBeNull();

        expect(
          () =>
            GalaxyKnowledgeState
              .fromCode(
                99,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
