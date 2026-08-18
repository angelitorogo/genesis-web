import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  type Galaxy,
} from '../../domain/universe/galaxy';

import {
  GalaxyType,
} from '../../domain/universe/galaxy-type';

import {
  GalaxyWindingDirection,
} from '../../domain/universe/galaxy-visual-structure';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  GalaxyGenerator,
} from './galaxy-generator';

import {
  GalaxyVisualStructureGenerator,
} from './galaxy-visual-structure-generator';

describe(
  'GalaxyVisualStructureGenerator',
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

    it(
      'should reproduce the frozen Android V1 visual orientation for Caeloria',
      () => {
        const galaxy =
          GalaxyGenerator.generate(
            canonicalGenerationKey,
            0n,
          );

        const visual =
          GalaxyVisualStructureGenerator
            .generate(
              galaxy,
            );

        expect(
          visual.orientationRadians,
        ).toBe(
          4.854499218383662,
        );

        expect(
          visual.windingDirection,
        ).toBe(
          GalaxyWindingDirection
            .COUNTERCLOCKWISE,
        );

      },
    );

    it(
      'should always generate exactly the same visual structure for the same galaxy',
      () => {
        const galaxy =
          GalaxyGenerator.generate(
            canonicalGenerationKey,
            42n,
          );

        const first =
          GalaxyVisualStructureGenerator
            .generate(
              galaxy,
            );

        const second =
          GalaxyVisualStructureGenerator
            .generate(
              galaxy,
            );

        expect(
          second,
        ).toEqual(
          first,
        );
      },
    );

    it(
      'should remain independent of visual structure query order',
      () => {
        const targetGalaxy =
          GalaxyGenerator.generate(
            canonicalGenerationKey,
            42n,
          );

        const expected =
          GalaxyVisualStructureGenerator
            .generate(
              targetGalaxy,
            );

        for (
          const index of
          [
            1n,
            3n,
            4n,
            10n,
            987654321n,
          ]
        ) {
          GalaxyVisualStructureGenerator
            .generate(
              GalaxyGenerator.generate(
                canonicalGenerationKey,
                index,
              ),
            );
        }

        const after =
          GalaxyVisualStructureGenerator
            .generate(
              targetGalaxy,
            );

        expect(
          after,
        ).toEqual(
          expected,
        );
      },
    );

    it(
      'should preserve V1 region boundaries aligned with point five',
      () => {
        const visual =
          GalaxyVisualStructureGenerator
            .generate(
              GalaxyGenerator.generate(
                canonicalGenerationKey,
                1n,
              ),
            );

        expect(
          visual.regions
            .centralOuterRadiusNormalized,
        ).toBe(
          0.15,
        );

        expect(
          visual.regions
            .innerOuterRadiusNormalized,
        ).toBe(
          0.40,
        );

        expect(
          visual.regions
            .middleOuterRadiusNormalized,
        ).toBe(
          0.70,
        );

        expect(
          visual.regions
            .nominalOuterRadiusNormalized,
        ).toBe(
          1.00,
        );

        expect(
          visual.regions
            .haloOuterRadiusNormalized,
        ).toBeGreaterThan(
          1.00,
        );
      },
    );

    it(
      'should create a bar only for barred spiral galaxies',
      () => {
        const barred =
          GalaxyGenerator.generate(
            canonicalGenerationKey,
            1n,
          );

        expect(
          barred.type,
        ).toBe(
          GalaxyType.BARRED_SPIRAL,
        );

        const barredVisual =
          GalaxyVisualStructureGenerator
            .generate(
              barred,
            );

        expect(
          barredVisual.bar,
        ).not.toBeNull();

        expect(
          barredVisual.bar
            ?.angleRadians,
        ).toBe(
          barredVisual.orientationRadians,
        );

        for (
          const index of
          [
            0n,
            3n,
            4n,
            10n,
          ]
        ) {
          const galaxy =
            GalaxyGenerator.generate(
              canonicalGenerationKey,
              index,
            );

          expect(
            galaxy.type,
          ).not.toBe(
            GalaxyType.BARRED_SPIRAL,
          );

          expect(
            GalaxyVisualStructureGenerator
              .generate(
                galaxy,
              )
              .bar,
          ).toBeNull();
        }
      },
    );

    it(
      'should reflect morphology in arm count and coherence',
      () => {
        const cases = [
          {
            index:
              1n,
            type:
              GalaxyType.BARRED_SPIRAL,
            coherenceMin:
              0.84,
            coherenceMax:
              0.98,
          },
          {
            index:
              3n,
            type:
              GalaxyType.SPIRAL,
            coherenceMin:
              0.80,
            coherenceMax:
              0.97,
          },
          {
            index:
              4n,
            type:
              GalaxyType.DWARF,
            coherenceMin:
              0.35,
            coherenceMax:
              0.65,
          },
          {
            index:
              10n,
            type:
              GalaxyType.IRREGULAR,
            coherenceMin:
              0.15,
            coherenceMax:
              0.45,
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

          const visual =
            GalaxyVisualStructureGenerator
              .generate(
                galaxy,
              );

          expect(
            galaxy.type,
          ).toBe(
            item.type,
          );

          expect(
            visual.arms,
          ).toHaveLength(
            galaxy
              .physicalProperties
              .structure
              .spiralArmCount,
          );

          for (
            const arm of
            visual.arms
          ) {
            expect(
              arm.coherence,
            ).toBeGreaterThanOrEqual(
              item.coherenceMin,
            );

            expect(
              arm.coherence,
            ).toBeLessThanOrEqual(
              item.coherenceMax,
            );
          }
        }
      },
    );

    it(
      'should preserve all visual geometry contracts across sample 0..511',
      () => {
        for (
          let index =
            0n;
          index <
            512n;
          index +=
            1n
        ) {
          const galaxy =
            GalaxyGenerator.generate(
              canonicalGenerationKey,
              index,
            );

          const visual =
            GalaxyVisualStructureGenerator
              .generate(
                galaxy,
              );

          expect(
            visual.orientationRadians,
          ).toBeGreaterThanOrEqual(
            0.0,
          );

          expect(
            visual.orientationRadians,
          ).toBeLessThan(
            2 * Math.PI,
          );

          expect(
            visual.bulgeRadiusNormalized,
          ).toBeGreaterThan(
            0.0,
          );

          expect(
            visual.bulgeRadiusNormalized,
          ).toBeLessThan(
            1.0,
          );

          expect(
            visual.bulgeAxisRatio,
          ).toBeGreaterThan(
            0.0,
          );

          expect(
            visual.bulgeAxisRatio,
          ).toBeLessThanOrEqual(
            1.0,
          );

          expect(
            visual.regions
              .haloOuterRadiusNormalized,
          ).toBeGreaterThan(
            1.0,
          );

          expect(
            visual.arms,
          ).toHaveLength(
            galaxy
              .physicalProperties
              .structure
              .spiralArmCount,
          );

          expect(
            visual.bar !==
              null,
          ).toBe(
            galaxy.type ===
              GalaxyType.BARRED_SPIRAL,
          );

          visual.arms.forEach(
            (
              arm,
              armIndex,
            ) => {
              expect(
                arm.index,
              ).toBe(
                armIndex,
              );

              expect(
                arm.radialEndNormalized,
              ).toBeGreaterThan(
                arm.radialStartNormalized,
              );

              expect(
                arm.radialEndNormalized,
              ).toBeLessThanOrEqual(
                1.0,
              );
            },
          );
        }
      },
      30_000,
    );

    it(
      'should not perturb physical galaxy generation',
      () => {
        const before =
          GalaxyGenerator.generate(
            canonicalGenerationKey,
            1n,
          );

        GalaxyVisualStructureGenerator
          .generate(
            before,
          );

        const after =
          GalaxyGenerator.generate(
            canonicalGenerationKey,
            1n,
          );

        expect(
          after,
        ).toEqual(
          before,
        );
      },
    );

    it(
      'should derive visual structure from the galaxy seed independently across universes',
      () => {
        const otherKey =
          new UniverseGenerationKey(
            UniverseSeed.parse(
              '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B2',
            ),
            GeneratorVersion.V1,
          );

        const first =
          GalaxyVisualStructureGenerator
            .generate(
              GalaxyGenerator.generate(
                canonicalGenerationKey,
                42n,
              ),
            );

        const second =
          GalaxyVisualStructureGenerator
            .generate(
              GalaxyGenerator.generate(
                otherKey,
                42n,
              ),
            );

        expect(
          second,
        ).not.toEqual(
          first,
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
            GalaxyVisualStructureGenerator
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