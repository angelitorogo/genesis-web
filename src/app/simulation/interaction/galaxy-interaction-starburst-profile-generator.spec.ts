import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  GalaxyInteractionStage,
  GalaxyStarburstState,
} from '../../domain/interaction/galaxy-interaction-starburst-profile';

import {
  type Galaxy,
} from '../../domain/universe/galaxy';

import {
  GalaxyType,
} from '../../domain/universe/galaxy-type';

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
  GalaxyInteractionStarburstProfileGenerator,
} from './galaxy-interaction-starburst-profile-generator';

describe(
  'GalaxyInteractionStarburstProfileGenerator',
  () => {
    const canonicalSeed =
      UniverseSeed.parse(
        '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
      );

    const canonicalGenerationKey =
      new UniverseGenerationKey(
        canonicalSeed,
        GeneratorVersion.V1,
      );

    function withStarFormationRate(
      galaxy:
        Galaxy,

      starFormationRateSolarMassesPerYear:
        number,
    ): Galaxy {

      return {
        ...galaxy,
        physicalProperties: {
          ...galaxy
            .physicalProperties,
          starFormationRateSolarMassesPerYear,
        },
      } as Galaxy;
    }

    function withDifferentPhysicalProperties(
      galaxy:
        Galaxy,
    ): Galaxy {

      return {
        ...galaxy,
        physicalProperties: {
          ...galaxy
            .physicalProperties,
          ageBillionYears:
            1.0,
          diameterLightYears:
            1_000_000.0,
          massSolarMasses:
            9.9e13,
          stellarPopulation:
            9_000_000_000_000n,
          metallicitySolarRatio:
            2.4,
          starFormationRateSolarMassesPerYear:
            1000.0,
        },
      } as Galaxy;
    }

    it(
      'should reproduce the frozen V1 Caeloria interaction and starburst baseline vector',
      () => {
        const profile =
          GalaxyInteractionStarburstProfileGenerator
            .generate(
              GalaxyGenerator.generate(
                canonicalGenerationKey,
                0n,
              ),
            );

        expect(
          profile.galaxyIndex,
        ).toBe(
          0n,
        );

        expect(
          profile.interactionStage,
        ).toBe(
          GalaxyInteractionStage.NONE,
        );

        expect(
          profile.companionGalaxyIndex,
        ).toBeNull();

        expect(
          profile.interactionStrength,
        ).toBe(
          0.0,
        );

        expect(
          profile.starburstState,
        ).toBe(
          GalaxyStarburstState.NONE,
        );

        expect(
          profile.starFormationRateMultiplier,
        ).toBe(
          1.0,
        );

        expect(
          profile.hasInteraction,
        ).toBe(
          false,
        );

        expect(
          profile.hasCompanion,
        ).toBe(
          false,
        );

        expect(
          profile.isStarFormationEnhanced,
        ).toBe(
          false,
        );

        expect(
          profile.isStarburst,
        ).toBe(
          false,
        );
      },
    );

    it(
      'should always generate exactly the same baseline profile for the same galaxy',
      () => {
        const galaxy =
          GalaxyGenerator.generate(
            canonicalGenerationKey,
            42n,
          );

        expect(
          GalaxyInteractionStarburstProfileGenerator
            .generate(
              galaxy,
            ),
        ).toEqual(
          GalaxyInteractionStarburstProfileGenerator
            .generate(
              galaxy,
            ),
        );
      },
    );

    it(
      'should remain independent of interaction profile query order',
      () => {
        const target =
          GalaxyGenerator.generate(
            canonicalGenerationKey,
            42n,
          );

        const expected =
          GalaxyInteractionStarburstProfileGenerator
            .generate(
              target,
            );

        for (
          const index of
          [
            0n,
            1n,
            3n,
            4n,
            10n,
            20n,
            331n,
            987654321n,
          ]
        ) {
          GalaxyInteractionStarburstProfileGenerator
            .generate(
              GalaxyGenerator.generate(
                canonicalGenerationKey,
                index,
              ),
            );
        }

        expect(
          GalaxyInteractionStarburstProfileGenerator
            .generate(
              target,
            ),
        ).toEqual(
          expected,
        );
      },
    );

    it(
      'should keep the whole deterministic sample 0..4095 at V1 baseline',
      () => {
        let interactions =
          0;

        let nonBaselineStarbursts =
          0;

        for (
          let index =
            0n;
          index <
            4096n;
          index +=
            1n
        ) {
          const profile =
            GalaxyInteractionStarburstProfileGenerator
              .generate(
                GalaxyGenerator.generate(
                  canonicalGenerationKey,
                  index,
                ),
              );

          if (
            profile.interactionStage !==
            GalaxyInteractionStage.NONE
          ) {
            interactions +=
              1;
          }

          if (
            profile.starburstState !==
            GalaxyStarburstState.NONE
          ) {
            nonBaselineStarbursts +=
              1;
          }

          expect(
            profile.companionGalaxyIndex,
          ).toBeNull();

          expect(
            profile.interactionStrength,
          ).toBe(
            0.0,
          );

          expect(
            profile.starFormationRateMultiplier,
          ).toBe(
            1.0,
          );
        }

        expect(
          interactions,
        ).toBe(
          0,
        );

        expect(
          nonBaselineStarbursts,
        ).toBe(
          0,
        );
      }, 15_000,
    );

    it(
      'should keep all canonical galaxy morphologies at V1 baseline',
      () => {
        const cases = [
          {
            index:
              0n,
            type:
              GalaxyType.ELLIPTICAL,
          },
          {
            index:
              1n,
            type:
              GalaxyType.BARRED_SPIRAL,
          },
          {
            index:
              3n,
            type:
              GalaxyType.SPIRAL,
          },
          {
            index:
              4n,
            type:
              GalaxyType.DWARF,
          },
          {
            index:
              10n,
            type:
              GalaxyType.IRREGULAR,
          },
        ];

        for (
          const item of
          cases
        ) {
          const galaxy =
            GalaxyGenerator.generate(
              canonicalGenerationKey,
              item.index,
            );

          expect(
            galaxy.type,
          ).toBe(
            item.type,
          );

          const profile =
            GalaxyInteractionStarburstProfileGenerator
              .generate(
                galaxy,
              );

          expect(
            profile.interactionStage,
          ).toBe(
            GalaxyInteractionStage.NONE,
          );

          expect(
            profile.starburstState,
          ).toBe(
            GalaxyStarburstState.NONE,
          );
        }
      },
    );

    it(
      'should not infer starburst from a high absolute star formation rate',
      () => {
        const galaxy =
          withStarFormationRate(
            GalaxyGenerator.generate(
              canonicalGenerationKey,
              0n,
            ),
            1000.0,
          );

        const profile =
          GalaxyInteractionStarburstProfileGenerator
            .generate(
              galaxy,
            );

        expect(
          profile.starburstState,
        ).toBe(
          GalaxyStarburstState.NONE,
        );

        expect(
          profile.starFormationRateMultiplier,
        ).toBe(
          1.0,
        );
      },
    );

    it(
      'should keep AGN and QUASAR galaxies at the independent V1 interaction baseline',
      () => {
        for (
          const index of
          [
            20n,
            331n,
          ]
        ) {
          const profile =
            GalaxyInteractionStarburstProfileGenerator
              .generate(
                GalaxyGenerator.generate(
                  canonicalGenerationKey,
                  index,
                ),
              );

          expect(
            profile.interactionStage,
          ).toBe(
            GalaxyInteractionStage.NONE,
          );

          expect(
            profile.companionGalaxyIndex,
          ).toBeNull();

          expect(
            profile.interactionStrength,
          ).toBe(
            0.0,
          );

          expect(
            profile.starburstState,
          ).toBe(
            GalaxyStarburstState.NONE,
          );

          expect(
            profile.starFormationRateMultiplier,
          ).toBe(
            1.0,
          );
        }
      },
    );

    it(
      'should support the maximum signed Long galaxy index at baseline',
      () => {
        const maxIndex =
          9_223_372_036_854_775_807n;

        const profile =
          GalaxyInteractionStarburstProfileGenerator
            .generate(
              GalaxyGenerator.generate(
                canonicalGenerationKey,
                maxIndex,
              ),
            );

        expect(
          profile.galaxyIndex,
        ).toBe(
          maxIndex,
        );

        expect(
          profile.interactionStage,
        ).toBe(
          GalaxyInteractionStage.NONE,
        );
      },
    );

    it(
      'should not perturb physical galaxy generation',
      () => {
        const before =
          GalaxyGenerator.generate(
            canonicalGenerationKey,
            42n,
          );

        GalaxyInteractionStarburstProfileGenerator
          .generate(
            before,
          );

        const after =
          GalaxyGenerator.generate(
            canonicalGenerationKey,
            42n,
          );

        expect(
          after,
        ).toEqual(
          before,
        );
      },
    );

    it(
      'should not infer V1 interaction or starburst from physical properties',
      () => {
        const galaxy =
          GalaxyGenerator.generate(
            canonicalGenerationKey,
            42n,
          );

        const changed =
          withDifferentPhysicalProperties(
            galaxy,
          );

        expect(
          GalaxyInteractionStarburstProfileGenerator
            .generate(
              changed,
            ),
        ).toEqual(
          GalaxyInteractionStarburstProfileGenerator
            .generate(
              galaxy,
            ),
        );
      },
    );

    it(
      'should reject unsupported generator versions',
      () => {
        const galaxy =
          GalaxyGenerator.generate(
            canonicalGenerationKey,
            0n,
          );

        const unsupportedGalaxy =
          {
            ...galaxy,
            generationKey: {
              universeSeed:
                canonicalSeed,
              generatorVersion: {
                code:
                  999,
              },
            },
          } as unknown as
            Galaxy;

        expect(
          () =>
            GalaxyInteractionStarburstProfileGenerator
              .generate(
                unsupportedGalaxy,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
