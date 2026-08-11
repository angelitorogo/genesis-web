import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  Galaxy,
} from '../../domain/universe/galaxy';

import {
  GalaxyPhysicalProperties,
} from '../../domain/universe/galaxy-physical-properties';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  InitialGalaxyGenerator,
} from '../universe/initial-galaxy-generator';

import {
  GalaxySectorGridGenerator,
} from './galaxy-sector-grid-generator';

describe(
  'GalaxySectorGridGenerator',
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
      'should reproduce the exact Android V1 sector grid for Caeloria',
      () => {
        const grid =
          GalaxySectorGridGenerator
            .generate(
              canonicalGalaxy,
            );

        expect(
          canonicalGalaxy
            .physicalProperties
            .diameterLightYears,
        ).toBe(
          171801.38478681122,
        );

        expect(
          grid.generationKey,
        ).toBe(
          canonicalGalaxy
            .generationKey,
        );

        expect(
          grid.galaxyIndex,
        ).toBe(
          0n,
        );

        expect(
          grid
            .sectorSizeLightYears,
        ).toBe(
          1000,
        );

        expect(
          grid
            .halfExtentInSectors,
        ).toBe(
          86,
        );

        expect(
          grid.minCoordinate,
        ).toBe(
          -86,
        );

        expect(
          grid.maxCoordinate,
        ).toBe(
          86,
        );

        expect(
          grid
            .sideLengthInSectors,
        ).toBe(
          173n,
        );

        expect(
          grid.contains({
            x:
              0,

            y:
              0,
          }),
        ).toBe(
          true,
        );

        expect(
          'sectors' in grid,
        ).toBe(
          false,
        );

        expect(
          'sectorSeed' in grid,
        ).toBe(
          false,
        );
      },
    );

    it(
      'should be exactly deterministic for the same galaxy',
      () => {
        const first =
          GalaxySectorGridGenerator
            .generate(
              canonicalGalaxy,
            );

        const second =
          GalaxySectorGridGenerator
            .generate(
              canonicalGalaxy,
            );

        expect(
          second,
        ).toEqual(
          first,
        );
      },
    );

    it(
      'should keep the side length odd and preserve a unique central sector',
      () => {
        const oneSectorGalaxy =
          galaxyWithDiameter(
            canonicalGalaxy,
            1000,
          );

        const threeSectorGalaxy =
          galaxyWithDiameter(
            canonicalGalaxy,
            2000,
          );

        const oneSectorGrid =
          GalaxySectorGridGenerator
            .generate(
              oneSectorGalaxy,
            );

        const threeSectorGrid =
          GalaxySectorGridGenerator
            .generate(
              threeSectorGalaxy,
            );

        expect(
          oneSectorGrid
            .halfExtentInSectors,
        ).toBe(
          0,
        );

        expect(
          oneSectorGrid
            .sideLengthInSectors,
        ).toBe(
          1n,
        );

        expect(
          oneSectorGrid
            .minCoordinate,
        ).toBe(
          0,
        );

        expect(
          oneSectorGrid
            .maxCoordinate,
        ).toBe(
          0,
        );

        expect(
          threeSectorGrid
            .halfExtentInSectors,
        ).toBe(
          1,
        );

        expect(
          threeSectorGrid
            .sideLengthInSectors,
        ).toBe(
          3n,
        );

        expect(
          threeSectorGrid
            .minCoordinate,
        ).toBe(
          -1,
        );

        expect(
          threeSectorGrid
            .maxCoordinate,
        ).toBe(
          1,
        );
      },
    );

    it(
      'should reject galaxies whose sector grid exceeds the signed Int32 coordinate range',
      () => {
        const oversizedGalaxy =
          galaxyWithDiameter(
            canonicalGalaxy,
            4294967296000,
          );

        expect(
          () =>
            GalaxySectorGridGenerator
              .generate(
                oversizedGalaxy,
              ),
        ).toThrow(
          'Galaxy sector grid exceeds supported coordinate range.',
        );
      },
    );

    it(
      'should reject unsupported generator versions',
      () => {
        const unsupportedGenerationKey =
          {
            universeSeed:
              canonicalUniverseSeed,

            generatorVersion: {
              code:
                999,
            },
          } as unknown as
            UniverseGenerationKey;

        const unsupportedGalaxy =
          new Galaxy(
            unsupportedGenerationKey,
            canonicalGalaxy.index,
            canonicalGalaxy.seed,
            canonicalGalaxy.designation,
            canonicalGalaxy.type,
            canonicalGalaxy
              .physicalProperties,
            canonicalGalaxy.nucleus,
          );

        expect(
          () =>
            GalaxySectorGridGenerator
              .generate(
                unsupportedGalaxy,
              ),
        ).toThrow(
          'Unsupported GeneratorVersion: 999.',
        );
      },
    );
  },
);

function galaxyWithDiameter(
  source:
    Galaxy,

  diameterLightYears:
    number,
): Galaxy {

  const sourceProperties =
    source
      .physicalProperties;

  const physicalProperties =
    new GalaxyPhysicalProperties(
      sourceProperties
        .ageBillionYears,

      diameterLightYears,

      sourceProperties
        .totalMassSolarMasses,

      sourceProperties
        .stellarPopulation,

      sourceProperties
        .metallicitySolarRatio,

      sourceProperties
        .starFormationRateSolarMassesPerYear,

      sourceProperties
        .structure,
    );

  return new Galaxy(
    source.generationKey,
    source.index,
    source.seed,
    source.designation,
    source.type,
    physicalProperties,
    source.nucleus,
  );
}