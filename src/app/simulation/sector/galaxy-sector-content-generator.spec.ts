import {
  GalacticObjectLocator,
  SectorLocator,
  SystemLocator,
} from '../../domain/generation/procedural-locator';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  GalaxyRegion,
} from '../../domain/sector/galaxy-region';

import {
  Galaxy,
} from '../../domain/universe/galaxy';

import {
  GalaxyType,
} from '../../domain/universe/galaxy-type';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  InitialGalaxyGenerator,
} from '../universe/initial-galaxy-generator';

import {
  GalaxySectorContentGenerator,
} from './galaxy-sector-content-generator';

import {
  SectorSeedResolver,
} from './sector-seed-resolver';

describe(
  'GalaxySectorContentGenerator',
  () => {
    const canonicalUniverseSeed =
      UniverseSeed.parse(
        '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
      );

    const canonicalGenerationKey =
      new UniverseGenerationKey(
        canonicalUniverseSeed,
        GeneratorVersion.V1,
      );

    const canonicalGalaxy =
      InitialGalaxyGenerator
        .generate(
          canonicalGenerationKey,
        );

    it(
      'should reproduce the frozen V1 central-sector content and density for Caeloria',
      () => {
        const coordinates = {
          x:
            0,

          y:
            0,
        };

        const content =
          GalaxySectorContentGenerator
            .generate(
              canonicalGalaxy,
              coordinates,
            );

        const expectedSectorSeed =
          SectorSeedResolver
            .resolve(
              canonicalGenerationKey,

              new SectorLocator(
                0n,
                0n,
              ),
            );

        expect(
          canonicalGalaxy
            .designation
            .name,
        ).toBe(
          'Caeloria',
        );

        expect(
          content
            .generationKey,
        ).toBe(
          canonicalGenerationKey,
        );

        expect(
          content.coordinates,
        ).toEqual(
          coordinates,
        );

        expect(
          content
            .locator
            .galaxyIndex,
        ).toBe(
          0n,
        );

        expect(
          content
            .locator
            .sectorKey,
        ).toBe(
          0n,
        );

        expect(
          content
            .seed
            .normalizedValue,
        ).toBe(
          expectedSectorSeed
            .normalizedValue,
        );

        expect(
          content
            .seed
            .normalizedValue,
        ).toBe(
          '5DD1335F6B5BE1533C30799ADCB91286',
        );

        expect(
          content
            .stellarDensity
            .region,
        ).toBe(
          GalaxyRegion.CENTRAL,
        );

        expect(
          content
            .stellarDensity
            .normalizedRadius,
        ).toBe(
          0,
        );

        expect(
          content
            .stellarDensity
            .relativeDensity,
        ).toBe(
          0.9541515810763022,
        );

        /*
         * Point-5.x ordinary content remains unchanged, but the galactic-centre
         * contract now reserves GalacticObject index 0 for the nucleus.
         */
        expect(
          content
            .systemLocators,
        ).toEqual([]);

        expect(
          content
            .galacticObjectLocators,
        ).toEqual([
          new GalacticObjectLocator(
            0n,
            0n,
            0n,
          ),
        ]);
      },
    );

    it(
      'should reserve GalacticObject index zero at 0,0 for every galaxy morphology',
      () => {
        for (
          const type of GalaxyType.values
        ) {
          const galaxy =
            galaxyWithType(
              canonicalGalaxy,
              type,
            );

          const content =
            GalaxySectorContentGenerator
              .generate(
                galaxy,
                {
                  x:
                    0,

                  y:
                    0,
                },
              );

          expect(
            content
              .galacticObjectLocators
              .some(
                (locator) =>
                  locator.galacticObjectIndex ===
                    0n &&
                  locator.sectorKey ===
                    0n,
              ),
          ).toBe(
            true,
          );
        }
      },
    );

    it(
      'should always reproduce exactly the same content and density for the same sector',
      () => {
        const coordinates = {
          x:
            0,

          y:
            0,
        };

        const first =
          GalaxySectorContentGenerator
            .generate(
              canonicalGalaxy,
              coordinates,
            );

        const second =
          GalaxySectorContentGenerator
            .generate(
              canonicalGalaxy,
              coordinates,
            );

        expect(
          second,
        ).toEqual(
          first,
        );

        expect(
          second,
        ).not.toBe(
          first,
        );

        expect(
          second.stellarDensity,
        ).not.toBe(
          first.stellarDensity,
        );

        expect(
          second.systemLocators,
        ).not.toBe(
          first.systemLocators,
        );

        expect(
          second
            .galacticObjectLocators,
        ).not.toBe(
          first
            .galacticObjectLocators,
        );
      },
    );

    it(
      'should remain independent of interleaved sector generation order',
      () => {
        const coordinatesA = {
          x:
            0,

          y:
            0,
        };

        const coordinatesB = {
          x:
            1,

          y:
            0,
        };

        const firstA =
          GalaxySectorContentGenerator
            .generate(
              canonicalGalaxy,
              coordinatesA,
            );

        const firstB =
          GalaxySectorContentGenerator
            .generate(
              canonicalGalaxy,
              coordinatesB,
            );

        const secondB =
          GalaxySectorContentGenerator
            .generate(
              canonicalGalaxy,
              coordinatesB,
            );

        const secondA =
          GalaxySectorContentGenerator
            .generate(
              canonicalGalaxy,
              coordinatesA,
            );

        expect(
          secondA,
        ).toEqual(
          firstA,
        );

        expect(
          secondB,
        ).toEqual(
          firstB,
        );
      },
    );

    it(
      'should produce different procedural identities for different coordinates',
      () => {
        const first =
          GalaxySectorContentGenerator
            .generate(
              canonicalGalaxy,

              {
                x:
                  0,

                y:
                  0,
              },
            );

        const second =
          GalaxySectorContentGenerator
            .generate(
              canonicalGalaxy,

              {
                x:
                  0,

                y:
                  1,
              },
            );

        expect(
          second.coordinates,
        ).not.toEqual(
          first.coordinates,
        );

        expect(
          second.locator,
        ).not.toEqual(
          first.locator,
        );

        expect(
          second
            .seed
            .normalizedValue,
        ).not.toBe(
          first
            .seed
            .normalizedValue,
        );

        expect(
          second
            .stellarDensity
            .normalizedRadius,
        ).not.toBe(
          first
            .stellarDensity
            .normalizedRadius,
        );
      },
    );

    it(
      'should reject coordinates outside the galaxy sector grid',
      () => {
        expect(
          () =>
            GalaxySectorContentGenerator
              .generate(
                canonicalGalaxy,

                {
                  x:
                    87,

                  y:
                    0,
                },
              ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should leave a bounding-grid corner outside the nominal galaxy empty with zero density',
      () => {
        const content =
          GalaxySectorContentGenerator
            .generate(
              canonicalGalaxy,

              {
                x:
                  86,

                y:
                  86,
              },
            );

        expect(
          content.coordinates,
        ).toEqual({
          x:
            86,

          y:
            86,
        });

        expect(
          content
            .stellarDensity
            .region,
        ).toBe(
          GalaxyRegion
            .OUTSIDE_NOMINAL,
        );

        expect(
          content
            .stellarDensity
            .normalizedRadius,
        ).toBe(
          Math.SQRT2,
        );

        expect(
          content
            .stellarDensity
            .relativeDensity,
        ).toBe(
          0,
        );

        expect(
          content
            .systemLocators,
        ).toEqual([]);

        expect(
          content
            .galacticObjectLocators,
        ).toEqual([]);
      },
    );

    it(
      'should generate child locators with the canonical parent and sequential keys',
      () => {
        const sampleCoordinates = [
          {
            x:
              0,

            y:
              0,
          },

          {
            x:
              1,

            y:
              0,
          },

          {
            x:
              -1,

            y:
              0,
          },

          {
            x:
              0,

            y:
              1,
          },

          {
            x:
              0,

            y:
              -1,
          },
        ];

        for (
          const coordinates
          of sampleCoordinates
        ) {
          const content =
            GalaxySectorContentGenerator
              .generate(
                canonicalGalaxy,
                coordinates,
              );

          expect(
            content
              .systemLocators
              .map(
                (locator) =>
                  locator
                    .galacticObjectIndex,
              ),
          ).toEqual(
            Array.from(
              {
                length:
                  content
                    .systemLocators
                    .length,
              },

              (
                _,
                index,
              ) =>
                BigInt(
                  index,
                ),
            ),
          );

          expect(
            content
              .galacticObjectLocators
              .map(
                (locator) =>
                  locator
                    .galacticObjectIndex,
              ),
          ).toEqual(
            Array.from(
              {
                length:
                  content
                    .galacticObjectLocators
                    .length,
              },

              (
                _,
                index,
              ) =>
                BigInt(
                  index,
                ),
            ),
          );

          for (
            const locator
            of content
              .systemLocators
          ) {
            expect(
              locator,
            ).toBeInstanceOf(
              SystemLocator,
            );

            expect(
              locator
                .galaxyIndex,
            ).toBe(
              content
                .locator
                .galaxyIndex,
            );

            expect(
              locator
                .sectorKey,
            ).toBe(
              content
                .locator
                .sectorKey,
            );
          }

          for (
            const locator
            of content
              .galacticObjectLocators
          ) {
            expect(
              locator,
            ).toBeInstanceOf(
              GalacticObjectLocator,
            );

            expect(
              locator
                .galaxyIndex,
            ).toBe(
              content
                .locator
                .galaxyIndex,
            );

            expect(
              locator
                .sectorKey,
            ).toBe(
              content
                .locator
                .sectorKey,
            );
          }
        }
      },
    );

    it(
      'should respect the frozen V1 profile caps for every galaxy type',
      () => {
        const profiles = [
          {
            type:
              GalaxyType
                .BARRED_SPIRAL,

            maxSystems:
              28,

            maxGalacticObjects:
              5,
          },

          {
            type:
              GalaxyType
                .SPIRAL,

            maxSystems:
              26,

            maxGalacticObjects:
              5,
          },

          {
            type:
              GalaxyType
                .ELLIPTICAL,

            maxSystems:
              32,

            maxGalacticObjects:
              4,
          },

          {
            type:
              GalaxyType
                .IRREGULAR,

            maxSystems:
              16,

            maxGalacticObjects:
              6,
          },

          {
            type:
              GalaxyType
                .DWARF,

            maxSystems:
              10,

            maxGalacticObjects:
              4,
          },
        ];

        const sampleCoordinates = [
          -10,
          -5,
          0,
          5,
          10,
        ];

        for (
          const profile
          of profiles
        ) {
          const galaxy =
            galaxyWithType(
              canonicalGalaxy,
              profile.type,
            );

          for (
            const x
            of sampleCoordinates
          ) {
            for (
              const y
              of sampleCoordinates
            ) {
              const content =
                GalaxySectorContentGenerator
                  .generate(
                    galaxy,

                    {
                      x,
                      y,
                    },
                  );

              expect(
                content
                  .stellarDensity
                  .relativeDensity,
              ).toBeGreaterThanOrEqual(
                0,
              );

              expect(
                content
                  .stellarDensity
                  .relativeDensity,
              ).toBeLessThanOrEqual(
                1,
              );

              expect(
                content
                  .systemLocators
                  .length,
              ).toBeLessThanOrEqual(
                profile
                  .maxSystems,
              );

              expect(
                content
                  .galacticObjectLocators
                  .length,
              ).toBeLessThanOrEqual(
                profile
                  .maxGalacticObjects,
              );

              if (
                content
                  .systemLocators
                  .length >
                0
              ) {
                expect(
                  content
                    .systemLocators
                    .length,
                ).toBeGreaterThanOrEqual(
                  1,
                );
              }
            }
          }
        }
      },
    );
  },
);

function galaxyWithType(
  source:
    Galaxy,

  type:
    GalaxyType,
): Galaxy {

  return new Galaxy(
    source.generationKey,
    source.index,
    source.seed,
    source.designation,
    type,
    source.physicalProperties,
    source.nucleus,
  );
}