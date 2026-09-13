import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

import {
  SystemSceneScientificDisclosureTier,
  systemSceneScientificAccess,
} from './system-scene-scientific-access';

describe(
  'SystemScene scientific access contract point 26.2',
  () => {
    it(
      'should map DETECTED, DISCOVERED/VISITED, CATALOGUED and CONFIRMED onto the agreed 3D disclosure tiers',
      () => {
        expect(
          systemSceneScientificAccess(
            DiscoveryState.DETECTED.code,
          ),
        ).toEqual({
          disclosureTier:
            SystemSceneScientificDisclosureTier.UNRESOLVED,
          identifiedStarsVisible:
            false,
          resolvedSystemVisible:
            false,
          scientificBodyFichesUnlocked:
            false,
        });

        for (
          const state
          of [
            DiscoveryState.DISCOVERED,
            DiscoveryState.VISITED,
          ]
        ) {
          expect(
            systemSceneScientificAccess(
              state.code,
            ),
          ).toEqual({
            disclosureTier:
              SystemSceneScientificDisclosureTier.IDENTIFIED_STELLAR,
            identifiedStarsVisible:
              true,
            resolvedSystemVisible:
              false,
            scientificBodyFichesUnlocked:
              false,
          });
        }

        expect(
          systemSceneScientificAccess(
            DiscoveryState.CATALOGUED.code,
          ),
        ).toEqual({
          disclosureTier:
            SystemSceneScientificDisclosureTier.CATALOGUED_SYSTEM,
          identifiedStarsVisible:
            true,
          resolvedSystemVisible:
            true,
          scientificBodyFichesUnlocked:
            false,
        });

        expect(
          systemSceneScientificAccess(
            DiscoveryState.CONFIRMED.code,
          ),
        ).toEqual({
          disclosureTier:
            SystemSceneScientificDisclosureTier.CONFIRMED_SYSTEM,
          identifiedStarsVisible:
            true,
          resolvedSystemVisible:
            true,
          scientificBodyFichesUnlocked:
            true,
        });
      },
    );

    it(
      'should never unlock individual scientific body fiches before CONFIRMED',
      () => {
        for (
          const state
          of [
            DiscoveryState.DETECTED,
            DiscoveryState.DISCOVERED,
            DiscoveryState.VISITED,
            DiscoveryState.CATALOGUED,
          ]
        ) {
          expect(
            systemSceneScientificAccess(
              state.code,
            )
              .scientificBodyFichesUnlocked,
          ).toBe(false);
        }

        expect(
          systemSceneScientificAccess(
            DiscoveryState.CONFIRMED.code,
          )
            .scientificBodyFichesUnlocked,
        ).toBe(true);
      },
    );
  },
);
