import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

import {
  GALAXY_CATALOGUE_DISCOVERY_POINT_COST,
  GALAXY_CONFIRM_DISCOVERY_POINT_COST,
  GalaxyScientificStateTransitionAction,
  GalaxyScientificStateTransitionEngine,
} from './galaxy-scientific-state-transition-engine';

describe(
  'GalaxyScientificStateTransitionEngine point 26.1',
  () => {
    it(
      'should validate only DETECTED to DISCOVERED at zero PD cost',
      () => {
        const result =
          GalaxyScientificStateTransitionEngine
            .evaluate(
              DiscoveryState.DETECTED,
              GalaxyScientificStateTransitionAction.VALIDATE_DETECTION,
            );

        expect(
          result.stateBefore,
        ).toBe(
          DiscoveryState.DETECTED,
        );

        expect(
          result.stateAfter,
        ).toBe(
          DiscoveryState.DISCOVERED,
        );

        expect(
          result.discoveryPointCost,
        ).toBe(
          0n,
        );
      },
    );

    it(
      'should catalogue only the exact VISITED milestone for the frozen 250 PD galaxy cost',
      () => {
        const result =
          GalaxyScientificStateTransitionEngine
            .evaluate(
              DiscoveryState.VISITED,
              GalaxyScientificStateTransitionAction.CATALOGUE,
            );

        expect(
          result.stateBefore,
        ).toBe(
          DiscoveryState.VISITED,
        );

        expect(
          result.stateAfter,
        ).toBe(
          DiscoveryState.CATALOGUED,
        );

        expect(
          result.discoveryPointCost,
        ).toBe(
          250n,
        );

        expect(
          result.discoveryPointCost,
        ).toBe(
          GALAXY_CATALOGUE_DISCOVERY_POINT_COST,
        );

        expect(
          Object.isFrozen(
            result,
          ),
        ).toBe(true);
      },
    );

    it(
      'should confirm only the exact CATALOGUED milestone for the frozen 500 PD galaxy cost',
      () => {
        const result =
          GalaxyScientificStateTransitionEngine
            .evaluate(
              DiscoveryState.CATALOGUED,
              GalaxyScientificStateTransitionAction.CONFIRM,
            );

        expect(
          result.stateAfter,
        ).toBe(
          DiscoveryState.CONFIRMED,
        );

        expect(
          result.discoveryPointCost,
        ).toBe(
          500n,
        );

        expect(
          result.discoveryPointCost,
        ).toBe(
          GALAXY_CONFIRM_DISCOVERY_POINT_COST,
        );
      },
    );

    it(
      'should reject skipping, repeating or downgrading scientific milestones',
      () => {
        for (
          const state
          of [
            DiscoveryState.UNKNOWN,
            DiscoveryState.DISCOVERED,
            DiscoveryState.VISITED,
            DiscoveryState.CATALOGUED,
            DiscoveryState.CONFIRMED,
          ]
        ) {
          expect(
            () =>
              GalaxyScientificStateTransitionEngine
                .evaluate(
                  state,
                  GalaxyScientificStateTransitionAction.VALIDATE_DETECTION,
                ),
          ).toThrow(
            RangeError,
          );
        }

        for (
          const state
          of [
            DiscoveryState.UNKNOWN,
            DiscoveryState.DETECTED,
            DiscoveryState.DISCOVERED,
            DiscoveryState.CATALOGUED,
            DiscoveryState.CONFIRMED,
          ]
        ) {
          expect(
            () =>
              GalaxyScientificStateTransitionEngine
                .evaluate(
                  state,
                  GalaxyScientificStateTransitionAction.CATALOGUE,
                ),
          ).toThrow(
            RangeError,
          );
        }

        for (
          const state
          of [
            DiscoveryState.UNKNOWN,
            DiscoveryState.DETECTED,
            DiscoveryState.DISCOVERED,
            DiscoveryState.VISITED,
            DiscoveryState.CONFIRMED,
          ]
        ) {
          expect(
            () =>
              GalaxyScientificStateTransitionEngine
                .evaluate(
                  state,
                  GalaxyScientificStateTransitionAction.CONFIRM,
                ),
          ).toThrow(
            RangeError,
          );
        }
      },
    );
  },
);
