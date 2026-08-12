import {
  DiscoveryState,
  type DiscoveryStateValue,
} from '../discovery/discovery-state';

import {
  GalaxyLocator,
} from '../generation/procedural-locator';

import {
  GeneratorVersion,
} from '../generation/generator-version';

import {
  UniverseGenerationKey,
} from '../generation/universe-generation-key';

import {
  UniverseSeed,
} from '../universe/universe-seed';

import {
  ObservationSession,
  Observatory,
} from './observatory';

describe(
  'Observatory',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    it(
      'should contain exactly the universe generation key as observational context',
      () => {
        const observatory =
          new Observatory(
            generationKey,
          );

        expect(
          observatory.generationKey,
        ).toBe(
          generationKey,
        );

        expect(
          Object.keys(
            observatory,
          ),
        ).toEqual([
          'generationKey',
        ]);
      },
    );

    it(
      'should preserve a prepared target and derive its generation key from the observatory',
      () => {
        const observatory =
          new Observatory(
            generationKey,
          );

        const locator =
          new GalaxyLocator(
            0n,
          );

        const session =
          new ObservationSession(
            observatory,
            locator,
            DiscoveryState.DISCOVERED,
          );

        expect(
          session.observatory,
        ).toBe(
          observatory,
        );

        expect(
          session.targetLocator,
        ).toBe(
          locator,
        );

        expect(
          session.targetKnowledgeState,
        ).toBe(
          DiscoveryState.DISCOVERED,
        );

        expect(
          session.generationKey,
        ).toBe(
          generationKey,
        );

        expect(
          Object.keys(
            session,
          ).sort(),
        ).toEqual(
          [
            'observatory',
            'targetKnowledgeState',
            'targetLocator',
          ].sort(),
        );
      },
    );

    it(
      'should accept every known DiscoveryState from DETECTED through CONFIRMED',
      () => {
        const observatory =
          new Observatory(
            generationKey,
          );

        const states:
          readonly DiscoveryStateValue[] =
          [
            DiscoveryState.DETECTED,
            DiscoveryState.DISCOVERED,
            DiscoveryState.VISITED,
            DiscoveryState.CATALOGUED,
            DiscoveryState.CONFIRMED,
          ];

        for (
          const state
          of states
        ) {
          expect(
            new ObservationSession(
              observatory,
              new GalaxyLocator(
                BigInt(
                  state.code,
                ),
              ),
              state,
            )
              .targetKnowledgeState,
          ).toBe(
            state,
          );
        }
      },
    );

    it(
      'should reject UNKNOWN and invalid runtime knowledge states',
      () => {
        const observatory =
          new Observatory(
            generationKey,
          );

        expect(
          () =>
            new ObservationSession(
              observatory,
              new GalaxyLocator(
                0n,
              ),
              DiscoveryState.UNKNOWN,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new ObservationSession(
              observatory,
              new GalaxyLocator(
                0n,
              ),
              {
                name:
                  'INVALID',

                code:
                  999,
              } as unknown as
                DiscoveryStateValue,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
