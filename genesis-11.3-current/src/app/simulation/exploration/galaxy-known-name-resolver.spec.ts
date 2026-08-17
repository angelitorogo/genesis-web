import {
  afterEach,
  vi,
} from 'vitest';

import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

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
  GalaxyDesignationGenerator,
} from '../universe/galaxy-designation-generator';

import {
  GalaxyKnownNameResolver,
} from './galaxy-known-name-resolver';

describe(
  'GalaxyKnownNameResolver',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    afterEach(
      () => {
        vi.restoreAllMocks();
      },
    );

    it(
      'should keep UNKNOWN and DETECTED proper names hidden without invoking designation generation',
      () => {
        const generateSpy =
          vi.spyOn(
            GalaxyDesignationGenerator,
            'generate',
          );

        expect(
          GalaxyKnownNameResolver
            .resolve(
              generationKey,
              0n,
              DiscoveryState.UNKNOWN,
            ),
        ).toBeNull();

        expect(
          GalaxyKnownNameResolver
            .resolve(
              generationKey,
              1n,
              DiscoveryState.DETECTED,
            ),
        ).toBeNull();

        expect(
          generateSpy,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'should reveal the canonical Caeloria proper name from DISCOVERED',
      () => {
        expect(
          GalaxyKnownNameResolver
            .resolve(
              generationKey,
              0n,
              DiscoveryState.DISCOVERED,
            ),
        ).toBe(
          'Caeloria',
        );
      },
    );

    it(
      'should reveal the frozen galaxy-one proper name only once it is DISCOVERED',
      () => {
        expect(
          GalaxyKnownNameResolver
            .resolve(
              generationKey,
              1n,
              DiscoveryState.DETECTED,
            ),
        ).toBeNull();

        expect(
          GalaxyKnownNameResolver
            .resolve(
              generationKey,
              1n,
              DiscoveryState.DISCOVERED,
            ),
        ).toBe(
          'Kelphiis',
        );
      },
    );

    it(
      'should preserve the known proper name through VISITED and higher global states',
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
            GalaxyKnownNameResolver
              .resolve(
                generationKey,
                0n,
                state,
              ),
          ).toBe(
            'Caeloria',
          );
        }
      },
    );

    it(
      'should reject invalid runtime DiscoveryState values through the canonical state contract',
      () => {
        expect(
          () =>
            GalaxyKnownNameResolver
              .resolve(
                generationKey,
                0n,
                {
                  name:
                    'INVALID',

                  code:
                    999,
                } as unknown as
                  typeof DiscoveryState.DISCOVERED,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
