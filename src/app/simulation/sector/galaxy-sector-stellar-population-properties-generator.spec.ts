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
  GalaxySectorStellarDensity,
} from '../../domain/sector/galaxy-sector-stellar-density';

import {
  Galaxy,
} from '../../domain/universe/galaxy';

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

import {
  GalaxySectorStellarPopulationPropertiesGenerator,
} from './galaxy-sector-stellar-population-properties-generator';

describe(
  'GalaxySectorStellarPopulationPropertiesGenerator',
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
      'should reproduce the frozen V1 central metallicity and age vector for Caeloria',
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

        const properties =
          GalaxySectorStellarPopulationPropertiesGenerator
            .generate(
              canonicalGalaxy,
              density,
            );

        expect(
          density.normalizedRadius,
        ).toBe(
          0,
        );

        expect(
          properties
            .characteristicMetallicitySolarRatio,
        ).toBe(
          1.5250202653290195,
        );

        expect(
          properties
            .characteristicStellarAgeBillionYears,
        ).toBe(
          9.298532891895936,
        );
      },
    );

    it(
      'should reproduce the frozen V1 middle metallicity and age vector for Caeloria',
      () => {
        const density =
          GalaxySectorStellarDensityGenerator
            .generate(
              canonicalGalaxy,
              canonicalGrid,
              {
                x:
                  43,

                y:
                  0,
              },
            );

        const properties =
          GalaxySectorStellarPopulationPropertiesGenerator
            .generate(
              canonicalGalaxy,
              density,
            );

        expect(
          density.normalizedRadius,
        ).toBe(
          0.5,
        );

        expect(
          properties
            .characteristicMetallicitySolarRatio,
        ).toBe(
          1.3183795653344745,
        );

        expect(
          properties
            .characteristicStellarAgeBillionYears,
        ).toBe(
          8.793177843423331,
        );
      },
    );

    it(
      'should reproduce the frozen V1 outer metallicity and age vector for Caeloria',
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
                  0,
              },
            );

        const properties =
          GalaxySectorStellarPopulationPropertiesGenerator
            .generate(
              canonicalGalaxy,
              density,
            );

        expect(
          density.normalizedRadius,
        ).toBe(
          1,
        );

        expect(
          properties
            .characteristicMetallicitySolarRatio,
        ).toBe(
          1.0608836628375788,
        );

        expect(
          properties
            .characteristicStellarAgeBillionYears,
        ).toBe(
          8.287822794950726,
        );
      },
    );

    it(
      'should decrease characteristic metallicity and age from center to outer galaxy',
      () => {
        const central =
          generateAt(
            0,
          );

        const middle =
          generateAt(
            43,
          );

        const outer =
          generateAt(
            86,
          );

        expect(
          central
            .characteristicMetallicitySolarRatio,
        ).toBeGreaterThan(
          middle
            .characteristicMetallicitySolarRatio,
        );

        expect(
          middle
            .characteristicMetallicitySolarRatio,
        ).toBeGreaterThan(
          outer
            .characteristicMetallicitySolarRatio,
        );

        expect(
          central
            .characteristicStellarAgeBillionYears,
        ).toBeGreaterThan(
          middle
            .characteristicStellarAgeBillionYears,
        );

        expect(
          middle
            .characteristicStellarAgeBillionYears,
        ).toBeGreaterThan(
          outer
            .characteristicStellarAgeBillionYears,
        );
      },
    );

    it(
      'should clamp sectors outside the nominal galaxy to the outer gradient values',
      () => {
        const outsideDensity =
          new GalaxySectorStellarDensity(
            GalaxyRegion
              .OUTSIDE_NOMINAL,
            Math.SQRT2,
            0,
          );

        const properties =
          GalaxySectorStellarPopulationPropertiesGenerator
            .generate(
              canonicalGalaxy,
              outsideDensity,
            );

        expect(
          properties
            .characteristicMetallicitySolarRatio,
        ).toBe(
          1.0608836628375788,
        );

        expect(
          properties
            .characteristicStellarAgeBillionYears,
        ).toBe(
          8.287822794950726,
        );
      },
    );

    it(
      'should depend on normalized radius rather than relative stellar density',
      () => {
        const firstDensity =
          new GalaxySectorStellarDensity(
            GalaxyRegion.MIDDLE,
            0.5,
            0.1,
          );

        const secondDensity =
          new GalaxySectorStellarDensity(
            GalaxyRegion.MIDDLE,
            0.5,
            0.9,
          );

        const first =
          GalaxySectorStellarPopulationPropertiesGenerator
            .generate(
              canonicalGalaxy,
              firstDensity,
            );

        const second =
          GalaxySectorStellarPopulationPropertiesGenerator
            .generate(
              canonicalGalaxy,
              secondDensity,
            );

        expect(
          second,
        ).toEqual(
          first,
        );
      },
    );

    it(
      'should be exactly deterministic for the same galaxy and radial position',
      () => {
        const density =
          GalaxySectorStellarDensityGenerator
            .generate(
              canonicalGalaxy,
              canonicalGrid,
              {
                x:
                  20,

                y:
                  -10,
              },
            );

        const first =
          GalaxySectorStellarPopulationPropertiesGenerator
            .generate(
              canonicalGalaxy,
              density,
            );

        const second =
          GalaxySectorStellarPopulationPropertiesGenerator
            .generate(
              canonicalGalaxy,
              density,
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
      'should produce continuous gradients around the frozen middle anchor',
      () => {
        const before =
          GalaxySectorStellarPopulationPropertiesGenerator
            .generate(
              canonicalGalaxy,

              new GalaxySectorStellarDensity(
                GalaxyRegion.MIDDLE,
                0.499999,
                0.5,
              ),
            );

        const middle =
          GalaxySectorStellarPopulationPropertiesGenerator
            .generate(
              canonicalGalaxy,

              new GalaxySectorStellarDensity(
                GalaxyRegion.MIDDLE,
                0.5,
                0.5,
              ),
            );

        const after =
          GalaxySectorStellarPopulationPropertiesGenerator
            .generate(
              canonicalGalaxy,

              new GalaxySectorStellarDensity(
                GalaxyRegion.MIDDLE,
                0.500001,
                0.5,
              ),
            );

        expect(
          before
            .characteristicMetallicitySolarRatio,
        ).toBeGreaterThan(
          middle
            .characteristicMetallicitySolarRatio,
        );

        expect(
          middle
            .characteristicMetallicitySolarRatio,
        ).toBeGreaterThan(
          after
            .characteristicMetallicitySolarRatio,
        );

        expect(
          Math.abs(
            before
              .characteristicMetallicitySolarRatio -
            after
              .characteristicMetallicitySolarRatio,
          ),
        ).toBeLessThan(
          0.00001,
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

        const density =
          new GalaxySectorStellarDensity(
            GalaxyRegion.CENTRAL,
            0,
            1,
          );

        expect(
          () =>
            GalaxySectorStellarPopulationPropertiesGenerator
              .generate(
                unsupportedGalaxy,
                density,
              ),
        ).toThrow(
          'Unsupported GeneratorVersion: 999.',
        );
      },
    );

    function generateAt(
      x:
        number,
    ) {
      const density =
        GalaxySectorStellarDensityGenerator
          .generate(
            canonicalGalaxy,
            canonicalGrid,
            {
              x,
              y:
                0,
            },
          );

      return GalaxySectorStellarPopulationPropertiesGenerator
        .generate(
          canonicalGalaxy,
          density,
        );
    }
  },
);