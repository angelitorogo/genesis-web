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
  ExplorationEntryModel,
} from './exploration-entry-model';

describe(
  'ExplorationEntryModel',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    it(
      'should expose the exact point-9.2 entry context and derive the active GalaxyLocator',
      () => {
        const model =
          new ExplorationEntryModel(
            generationKey,
            3n,
            DiscoveryState
              .DISCOVERED,
            'Velthea',
          );

        expect(
          Object.keys(
            model,
          ),
        ).toEqual([
          'generationKey',
          'activeGalaxyIndex',
          'activeGalaxyKnownName',
          'activeGalaxyDiscoveryState',
        ]);

        expect(
          model.generationKey,
        ).toBe(
          generationKey,
        );

        expect(
          model.activeGalaxyIndex,
        ).toBe(
          3n,
        );

        expect(
          model.activeGalaxyDiscoveryState,
        ).toBe(
          DiscoveryState
            .DISCOVERED,
        );

        expect(
          model.activeGalaxyKnownName,
        ).toBe(
          'Velthea',
        );

        expect(
          model.activeGalaxyLocator,
        ).toEqual(
          new GalaxyLocator(
            3n,
          ),
        );
      },
    );

    it(
      'should canonicalize valid known DiscoveryState values',
      () => {
        const forgedState =
          {
            name:
              'DISCOVERED',

            code:
              2,
          } as unknown as
            typeof DiscoveryState.DISCOVERED;

        const model =
          new ExplorationEntryModel(
            generationKey,
            0n,
            forgedState,
          );

        expect(
          model.activeGalaxyDiscoveryState,
        ).toBe(
          DiscoveryState
            .DISCOVERED,
        );
      },
    );

    it(
      'should reject UNKNOWN as active galaxy knowledge',
      () => {
        expect(
          () =>
            new ExplorationEntryModel(
              generationKey,
              0n,
              DiscoveryState
                .UNKNOWN,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should enforce the non-negative signed-Long active galaxy index',
      () => {
        expect(
          () =>
            new ExplorationEntryModel(
              generationKey,
              -1n,
              DiscoveryState
                .DISCOVERED,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new ExplorationEntryModel(
              generationKey,
              9_223_372_036_854_775_808n,
              DiscoveryState
                .DISCOVERED,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
