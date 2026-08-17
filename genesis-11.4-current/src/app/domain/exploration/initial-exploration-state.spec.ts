import {
  DiscoveryState,
} from '../discovery/discovery-state';

import {
  GalaxyLocator,
  type ProceduralLocator,
} from '../generation/procedural-locator';

import {
  InitialExplorationState,
  type InitialExplorationDiscoveryState,
} from './initial-exploration-state';

describe(
  'InitialExplorationState',
  () => {
    const initialGalaxyLocator =
      new GalaxyLocator(
        0n,
      );

    function createKnownDiscoveries():
      ReadonlyMap<
        ProceduralLocator,
        InitialExplorationDiscoveryState
      > {

      return new Map<
        ProceduralLocator,
        InitialExplorationDiscoveryState
      >([
        [
          initialGalaxyLocator,
          DiscoveryState.DISCOVERED,
        ],
      ]);
    }

    it(
      'should preserve its complete exploration snapshot',
      () => {
        const state =
          new InitialExplorationState(
            0n,
            0n,
            createKnownDiscoveries(),
          );

        expect(
          state.activeGalaxyIndex,
        ).toBe(
          0n,
        );

        expect(
          state.discoveryPoints,
        ).toBe(
          0n,
        );

        expect(
          state
            .knownDiscoveries
            .size,
        ).toBe(
          1,
        );

        expect(
          state
            .knownDiscoveries
            .get(
              initialGalaxyLocator,
            ),
        ).toBe(
          DiscoveryState.DISCOVERED,
        );
      },
    );

    it(
      'should preserve signed Long.MAX_VALUE values',
      () => {
        const longMax =
          9223372036854775807n;

        const state =
          new InitialExplorationState(
            longMax,
            longMax,
            createKnownDiscoveries(),
          );

        expect(
          state.activeGalaxyIndex,
        ).toBe(
          longMax,
        );

        expect(
          state.discoveryPoints,
        ).toBe(
          longMax,
        );
      },
    );

    it(
      'should snapshot known discoveries instead of retaining the input map',
      () => {
        const mutableInput =
          new Map<
            ProceduralLocator,
            InitialExplorationDiscoveryState
          >([
            [
              initialGalaxyLocator,
              DiscoveryState.DISCOVERED,
            ],
          ]);

        const state =
          new InitialExplorationState(
            0n,
            0n,
            mutableInput,
          );

        expect(
          state.knownDiscoveries,
        ).not.toBe(
          mutableInput,
        );

        mutableInput.clear();

        expect(
          mutableInput.size,
        ).toBe(
          0,
        );

        expect(
          state
            .knownDiscoveries
            .size,
        ).toBe(
          1,
        );

        expect(
          state
            .knownDiscoveries
            .get(
              initialGalaxyLocator,
            ),
        ).toBe(
          DiscoveryState.DISCOVERED,
        );
      },
    );

    it(
      'should reject a negative active galaxy index',
      () => {
        expect(
          () =>
            new InitialExplorationState(
              -1n,
              0n,
              createKnownDiscoveries(),
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject an active galaxy index above signed Long.MAX_VALUE',
      () => {
        expect(
          () =>
            new InitialExplorationState(
              9223372036854775808n,
              0n,
              createKnownDiscoveries(),
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject negative discovery points',
      () => {
        expect(
          () =>
            new InitialExplorationState(
              0n,
              -1n,
              createKnownDiscoveries(),
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject discovery points above signed Long.MAX_VALUE',
      () => {
        expect(
          () =>
            new InitialExplorationState(
              0n,
              9223372036854775808n,
              createKnownDiscoveries(),
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject materialized UNKNOWN discoveries',
      () => {
        const invalidDiscoveries =
          new Map<
            ProceduralLocator,
            InitialExplorationDiscoveryState
          >([
            [
              initialGalaxyLocator,
              DiscoveryState.UNKNOWN,
            ],
          ]);

        expect(
          () =>
            new InitialExplorationState(
              0n,
              0n,
              invalidDiscoveries,
            ),
        ).toThrow(
          'knownDiscoveries must not materialize DiscoveryState.UNKNOWN.',
        );
      },
    );
  },
);