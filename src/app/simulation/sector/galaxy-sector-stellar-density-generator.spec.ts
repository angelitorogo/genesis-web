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
  GalaxySectorGrid,
} from '../../domain/sector/galaxy-sector-grid';

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
  GalaxySectorGridGenerator,
} from './galaxy-sector-grid-generator';

import {
  GalaxySectorStellarDensityGenerator,
} from './galaxy-sector-stellar-density-generator';

describe(
  'GalaxySectorStellarDensityGenerator',
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

    const canonicalGrid =
      GalaxySectorGridGenerator
        .generate(
          canonicalGalaxy,
        );

    it(
      'should reproduce the frozen V1 central density vector for Caeloria',
      () => {
        const density =
          GalaxySectorStellarDensityGenerator
            .generate(
              canonicalGalaxy,
              canonicalGrid,
              {
                x:
                  0,

                y:
                  0,
              },
            );

        expect(
          density.region,
        ).toBe(
          GalaxyRegion.CENTRAL,
        );

        expect(
          density.normalizedRadius,
        ).toBe(
          0,
        );

        expect(
          density.relativeDensity,
        ).toBe(
          0.9541515810763022,
        );
      },
    );

    it(
      'should classify the frozen V1 radial boundaries exactly',
      () => {
        const grid =
          new GalaxySectorGrid(
            canonicalGenerationKey,
            0n,
            1000,
            100,
          );

        expect(
          regionAt(
            14,
            canonicalGalaxy,
            grid,
          ),
        ).toBe(
          GalaxyRegion.CENTRAL,
        );

        expect(
          regionAt(
            15,
            canonicalGalaxy,
            grid,
          ),
        ).toBe(
          GalaxyRegion.INNER,
        );

        expect(
          regionAt(
            39,
            canonicalGalaxy,
            grid,
          ),
        ).toBe(
          GalaxyRegion.INNER,
        );

        expect(
          regionAt(
            40,
            canonicalGalaxy,
            grid,
          ),
        ).toBe(
          GalaxyRegion.MIDDLE,
        );

        expect(
          regionAt(
            69,
            canonicalGalaxy,
            grid,
          ),
        ).toBe(
          GalaxyRegion.MIDDLE,
        );

        expect(
          regionAt(
            70,
            canonicalGalaxy,
            grid,
          ),
        ).toBe(
          GalaxyRegion.OUTER,
        );

        expect(
          regionAt(
            100,
            canonicalGalaxy,
            grid,
          ),
        ).toBe(
          GalaxyRegion.OUTER,
        );
      },
    );

    it(
      'should classify a bounding-grid corner outside the nominal galaxy with zero density',
      () => {
        const density =
          GalaxySectorStellarDensityGenerator
            .generate(
              canonicalGalaxy,
              canonicalGrid,
              {
                x:
                  86,

                y:
                  86,
              },
            );

        expect(
          density.region,
        ).toBe(
          GalaxyRegion
            .OUTSIDE_NOMINAL,
        );

        expect(
          density.normalizedRadius,
        ).toBe(
          Math.SQRT2,
        );

        expect(
          density.relativeDensity,
        ).toBe(
          0,
        );
      },
    );

    it(
      'should apply the frozen V1 radial falloff profile for every galaxy type',
      () => {
        const grid =
          new GalaxySectorGrid(
            canonicalGenerationKey,
            0n,
            1000,
            100,
          );

        const coordinate = {
          x:
            50,

          y:
            0,
        };

        const spiral =
          densityForType(
            GalaxyType.SPIRAL,
            canonicalGalaxy,
            grid,
            coordinate,
          );

        const barredSpiral =
          densityForType(
            GalaxyType
              .BARRED_SPIRAL,
            canonicalGalaxy,
            grid,
            coordinate,
          );

        const elliptical =
          densityForType(
            GalaxyType.ELLIPTICAL,
            canonicalGalaxy,
            grid,
            coordinate,
          );

        const dwarf =
          densityForType(
            GalaxyType.DWARF,
            canonicalGalaxy,
            grid,
            coordinate,
          );

        const irregular =
          densityForType(
            GalaxyType.IRREGULAR,
            canonicalGalaxy,
            grid,
            coordinate,
          );

        expect(
          spiral,
        ).toBeLessThan(
          barredSpiral,
        );

        expect(
          barredSpiral,
        ).toBeLessThan(
          elliptical,
        );

        expect(
          elliptical,
        ).toBeLessThan(
          dwarf,
        );

        expect(
          dwarf,
        ).toBeLessThan(
          irregular,
        );
      },
    );

    it(
      'should be exactly deterministic for the same sector',
      () => {
        const coordinates = {
          x:
            20,

          y:
            -10,
        };

        const first =
          GalaxySectorStellarDensityGenerator
            .generate(
              canonicalGalaxy,
              canonicalGrid,
              coordinates,
            );

        const second =
          GalaxySectorStellarDensityGenerator
            .generate(
              canonicalGalaxy,
              canonicalGrid,
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
      },
    );

    it(
      'should reject a grid that belongs to another generation key or galaxy index',
      () => {
        const otherGenerationKey =
          new UniverseGenerationKey(
            UniverseSeed.parse(
              '1234-5678-9ABC-DEF0-1234-5678-9ABC-DEF0',
            ),
            GeneratorVersion.V1,
          );

        const otherKeyGrid =
          new GalaxySectorGrid(
            otherGenerationKey,
            0n,
            1000,
            86,
          );

        expect(
          () =>
            GalaxySectorStellarDensityGenerator
              .generate(
                canonicalGalaxy,
                otherKeyGrid,
                {
                  x:
                    0,

                  y:
                    0,
                },
              ),
        ).toThrow(
          'Galaxy sector grid must belong to the same UniverseGenerationKey as the galaxy.',
        );

        const otherGalaxyGrid =
          new GalaxySectorGrid(
            canonicalGenerationKey,
            1n,
            1000,
            86,
          );

        expect(
          () =>
            GalaxySectorStellarDensityGenerator
              .generate(
                canonicalGalaxy,
                otherGalaxyGrid,
                {
                  x:
                    0,

                  y:
                    0,
                },
              ),
        ).toThrow(
          'Galaxy sector grid must belong to the same galaxy index.',
        );
      },
    );

    it(
      'should reject coordinates outside the supplied grid',
      () => {
        expect(
          () =>
            GalaxySectorStellarDensityGenerator
              .generate(
                canonicalGalaxy,
                canonicalGrid,
                {
                  x:
                    87,

                  y:
                    0,
                },
              ),
        ).toThrow(
          'Sector coordinates are outside this galaxy sector grid.',
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

        const unsupportedGrid =
          new GalaxySectorGrid(
            unsupportedGenerationKey,
            0n,
            1000,
            86,
          );

        expect(
          () =>
            GalaxySectorStellarDensityGenerator
              .generate(
                unsupportedGalaxy,
                unsupportedGrid,
                {
                  x:
                    0,

                  y:
                    0,
                },
              ),
        ).toThrow(
          'Unsupported GeneratorVersion: 999.',
        );
      },
    );
  },
);

function regionAt(
  x:
    number,

  galaxy:
    Galaxy,

  grid:
    GalaxySectorGrid,
): GalaxyRegion {

  return GalaxySectorStellarDensityGenerator
    .generate(
      galaxy,
      grid,
      {
        x,
        y:
          0,
      },
    )
    .region;
}

function densityForType(
  type:
    GalaxyType,

  source:
    Galaxy,

  grid:
    GalaxySectorGrid,

  coordinates: {
    readonly x:
      number;

    readonly y:
      number;
  },
): number {

  const galaxy =
    new Galaxy(
      source.generationKey,
      source.index,
      source.seed,
      source.designation,
      type,
      source.physicalProperties,
      source.nucleus,
    );

  return GalaxySectorStellarDensityGenerator
    .generate(
      galaxy,
      grid,
      coordinates,
    )
    .relativeDensity;
}