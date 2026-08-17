import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

import {
  GalaxyLocator,
} from '../../domain/generation/procedural-locator';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  HomeDashboardModel,
} from './home-dashboard-model';

describe(
  'HomeDashboardModel',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    it(
      'should reproduce the frozen Caeloria bootstrap dashboard values and derive its locator',
      () => {
        const dashboard =
          new HomeDashboardModel(
            generationKey,
            0n,
            DiscoveryState
              .DISCOVERED,
            2n,
            0n,
            'Caeloria',
          );

        expect(
          dashboard.generationKey,
        ).toBe(
          generationKey,
        );

        expect(
          dashboard.activeGalaxyIndex,
        ).toBe(
          0n,
        );

        expect(
          dashboard
            .activeGalaxyDiscoveryState,
        ).toBe(
          DiscoveryState
            .DISCOVERED,
        );

        expect(
          dashboard.galaxyProgressUnits,
        ).toBe(
          2n,
        );

        expect(
          dashboard.discoveryPoints,
        ).toBe(
          0n,
        );

        expect(
          dashboard.activeGalaxyKnownName,
        ).toBe(
          'Caeloria',
        );

        expect(
          dashboard.activeGalaxyLocator,
        ).toEqual(
          new GalaxyLocator(
            0n,
          ),
        );
      },
    );

    it(
      'should accept every known discovery state and signed Long maxima',
      () => {
        const max =
          9_223_372_036_854_775_807n;

        for (
          const state
          of [
            DiscoveryState.DETECTED,
            DiscoveryState.DISCOVERED,
            DiscoveryState.VISITED,
            DiscoveryState.CATALOGUED,
            DiscoveryState.CONFIRMED,
          ]
        ) {
          const dashboard =
            new HomeDashboardModel(
              generationKey,
              max,
              state,
              max,
              max,
            );

          expect(
            dashboard
              .activeGalaxyDiscoveryState,
          ).toBe(
            state,
          );
        }
      },
    );

    it(
      'should reject negative values and signed Long overflow',
      () => {
        const maxPlusOne =
          9_223_372_036_854_775_808n;

        for (
          const [
            galaxyIndex,
            progress,
            discoveryPoints,
          ]
          of [
            [
              -1n,
              0n,
              0n,
            ],
            [
              0n,
              -1n,
              0n,
            ],
            [
              0n,
              0n,
              -1n,
            ],
            [
              maxPlusOne,
              0n,
              0n,
            ],
            [
              0n,
              maxPlusOne,
              0n,
            ],
            [
              0n,
              0n,
              maxPlusOne,
            ],
          ] as const
        ) {
          expect(
            () =>
              new HomeDashboardModel(
                generationKey,
                galaxyIndex,
                DiscoveryState
                  .DISCOVERED,
                progress,
                discoveryPoints,
              ),
          ).toThrow(
            RangeError,
          );
        }
      },
    );

    it(
      'should reject blank names and proper names before DISCOVERED',
      () => {
        expect(
          () =>
            new HomeDashboardModel(
              generationKey,
              0n,
              DiscoveryState
                .DISCOVERED,
              0n,
              0n,
              '   ',
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new HomeDashboardModel(
              generationKey,
              1n,
              DiscoveryState
                .DETECTED,
              0n,
              0n,
              'Hidden-name',
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject UNKNOWN and invalid runtime discovery states',
      () => {
        expect(
          () =>
            new HomeDashboardModel(
              generationKey,
              0n,
              DiscoveryState
                .UNKNOWN,
              0n,
              0n,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new HomeDashboardModel(
              generationKey,
              0n,
              {
                name:
                  'INVALID',

                code:
                  999,
              } as unknown as
                typeof DiscoveryState.DISCOVERED,
              0n,
              0n,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
