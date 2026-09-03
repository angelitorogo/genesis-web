import {
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
  GalaxyGenerator,
} from '../universe/galaxy-generator';

import {
  GalaxyScientificProfileEngine,
} from './galaxy-scientific-profile-engine';

describe(
  'GalaxyScientificProfileEngine point 26.1',
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
      'should keep exact physical Ground Truth unavailable below CATALOGUED',
      () => {
        const generatorSpy =
          vi.spyOn(
            GalaxyGenerator,
            'generate',
          );

        for (
          const state
          of [
            DiscoveryState.DETECTED,
            DiscoveryState.DISCOVERED,
            DiscoveryState.VISITED,
          ]
        ) {
          const profile =
            GalaxyScientificProfileEngine
              .build(
                generationKey,
                0n,
                state,
              );

          expect(
            profile.physicalProperties,
          ).toBeNull();
          expect(
            profile.structure,
          ).toBeNull();
          expect(
            profile.nucleus,
          ).toBeNull();
          expect(
            Object.isFrozen(
              profile,
            ),
          ).toBe(true);
        }

        expect(
          generatorSpy,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'should expose baseline physical properties at CATALOGUED without confirmed structure or nucleus',
      () => {
        const profile =
          GalaxyScientificProfileEngine
            .build(
              generationKey,
              0n,
              DiscoveryState.CATALOGUED,
            );

        expect(
          profile
            .physicalProperties
            ?.ageBillionYears,
        ).toBe(
          10.107100969452105,
        );
        expect(
          profile
            .physicalProperties
            ?.diameterLightYears,
        ).toBe(
          171801.38478681122,
        );
        expect(
          profile
            .physicalProperties
            ?.totalMassSolarMasses,
        ).toBe(
          5.0144255724751245e11,
        );
        expect(
          profile
            .physicalProperties
            ?.stellarPopulation,
        ).toBe(
          244730302878n,
        );
        expect(
          profile
            .physicalProperties
            ?.metallicitySolarRatio,
        ).toBe(
          1.3261045785469736,
        );
        expect(
          profile
            .physicalProperties
            ?.starFormationRateSolarMassesPerYear,
        ).toBe(
          0.19950335429750066,
        );
        expect(
          profile.structure,
        ).toBeNull();
        expect(
          profile.nucleus,
        ).toBeNull();
        expect(
          Object.isFrozen(
            profile.physicalProperties,
          ),
        ).toBe(true);
      },
    );

    it(
      'should add exact structure and nuclear facts only at CONFIRMED',
      () => {
        const profile =
          GalaxyScientificProfileEngine
            .build(
              generationKey,
              0n,
              DiscoveryState.CONFIRMED,
            );

        expect(
          profile.physicalProperties,
        ).not.toBeNull();
        expect(
          profile.structure,
        ).not.toBeNull();
        expect(
          profile
            .structure
            ?.spiralArmCount,
        ).toBeGreaterThanOrEqual(
          0,
        );
        expect(
          profile.nucleus,
        ).toEqual({
          present:
            true,
          stateName:
            'QUIESCENT',
          supermassiveBlackHoleMassSolarMasses:
            1.3908163761111212e8,
        });
        expect(
          Object.isFrozen(
            profile.structure,
          ),
        ).toBe(true);
        expect(
          Object.isFrozen(
            profile.nucleus,
          ),
        ).toBe(true);
      },
    );

    it(
      'should reject UNKNOWN and invalid galaxy indices without leaking content',
      () => {
        expect(
          () =>
            GalaxyScientificProfileEngine
              .build(
                generationKey,
                0n,
                DiscoveryState.UNKNOWN,
              ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            GalaxyScientificProfileEngine
              .build(
                generationKey,
                -1n,
                DiscoveryState.CONFIRMED,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
