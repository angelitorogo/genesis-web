import {
  GeneratorVersion,
} from '../generation/generator-version';

import {
  GalacticObjectLocator,
  SectorLocator,
  SystemLocator,
} from '../generation/procedural-locator';

import {
  UniverseGenerationKey,
} from '../generation/universe-generation-key';

import {
  SectorSeed,
} from '../seed/hierarchical-seeds';

import {
  UniverseSeed,
} from '../universe/universe-seed';

import {
  GalaxyRegion,
} from './galaxy-region';

import {
  GalaxySectorContent,
} from './galaxy-sector-content';

import {
  GalaxySectorStellarDensity,
} from './galaxy-sector-stellar-density';

describe(
  'GalaxySectorContent',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    const coordinates = {
      x:
        0,

      y:
        0,
    };

    const locator =
      new SectorLocator(
        0n,
        0n,
      );

    const sectorSeed =
      new SectorSeed(
        '5DD1335F6B5BE1533C30799ADCB91286',
      );

    function createDensity():
      GalaxySectorStellarDensity {

      return new GalaxySectorStellarDensity(
        GalaxyRegion.CENTRAL,
        0,
        0.9541515810763022,
      );
    }

    it(
      'should preserve all valid sector content values',
      () => {
        const stellarDensity =
          createDensity();

        const systemLocators = [
          new SystemLocator(
            0n,
            0n,
            0n,
          ),

          new SystemLocator(
            0n,
            0n,
            1n,
          ),
        ];

        const galacticObjectLocators = [
          new GalacticObjectLocator(
            0n,
            0n,
            0n,
          ),

          new GalacticObjectLocator(
            0n,
            0n,
            1n,
          ),
        ];

        const content =
          new GalaxySectorContent(
            generationKey,
            locator,
            coordinates,
            sectorSeed,
            stellarDensity,
            systemLocators,
            galacticObjectLocators,
          );

        expect(
          content.generationKey,
        ).toBe(
          generationKey,
        );

        expect(
          content.locator,
        ).toBe(
          locator,
        );

        expect(
          content.coordinates,
        ).toBe(
          coordinates,
        );

        expect(
          content.seed,
        ).toBe(
          sectorSeed,
        );

        expect(
          content.stellarDensity,
        ).toBe(
          stellarDensity,
        );

        expect(
          content.systemLocators,
        ).toEqual(
          systemLocators,
        );

        expect(
          content
            .galacticObjectLocators,
        ).toEqual(
          galacticObjectLocators,
        );
      },
    );

    it(
      'should accept an empty sector',
      () => {
        const content =
          new GalaxySectorContent(
            generationKey,
            locator,
            coordinates,
            sectorSeed,
            createDensity(),
            [],
            [],
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
      'should preserve stellar density independently of child content',
      () => {
        const stellarDensity =
          new GalaxySectorStellarDensity(
            GalaxyRegion.OUTER,
            0.8,
            0.2,
          );

        const content =
          new GalaxySectorContent(
            generationKey,
            locator,
            coordinates,
            sectorSeed,
            stellarDensity,
            [],
            [],
          );

        expect(
          content.stellarDensity,
        ).toBe(
          stellarDensity,
        );

        expect(
          content
            .stellarDensity
            .region,
        ).toBe(
          GalaxyRegion.OUTER,
        );

        expect(
          content
            .stellarDensity
            .normalizedRadius,
        ).toBe(
          0.8,
        );

        expect(
          content
            .stellarDensity
            .relativeDensity,
        ).toBe(
          0.2,
        );
      },
    );

    it(
      'should reject a locator key that does not match the coordinates',
      () => {
        expect(
          () =>
            new GalaxySectorContent(
              generationKey,

              new SectorLocator(
                0n,
                1n,
              ),

              coordinates,

              sectorSeed,

              createDensity(),

              [],

              [],
            ),
        ).toThrow(
          'Sector locator key must match sector coordinates.',
        );
      },
    );

    it(
      'should reject system locators that belong to another sector',
      () => {
        expect(
          () =>
            new GalaxySectorContent(
              generationKey,

              locator,

              coordinates,

              sectorSeed,

              createDensity(),

              [
                new SystemLocator(
                  0n,
                  1n,
                  0n,
                ),
              ],

              [],
            ),
        ).toThrow(
          'All system locators must belong to this sector.',
        );
      },
    );

    it(
      'should reject galactic object locators that belong to another sector',
      () => {
        expect(
          () =>
            new GalaxySectorContent(
              generationKey,

              locator,

              coordinates,

              sectorSeed,

              createDensity(),

              [],

              [
                new GalacticObjectLocator(
                  1n,
                  0n,
                  0n,
                ),
              ],
            ),
        ).toThrow(
          'All galactic object locators must belong to this sector.',
        );
      },
    );

    it(
      'should reject duplicate system keys',
      () => {
        expect(
          () =>
            new GalaxySectorContent(
              generationKey,

              locator,

              coordinates,

              sectorSeed,

              createDensity(),

              [
                new SystemLocator(
                  0n,
                  0n,
                  0n,
                ),

                new SystemLocator(
                  0n,
                  0n,
                  0n,
                ),
              ],

              [],
            ),
        ).toThrow(
          'GalaxySectorContent cannot contain duplicate system keys.',
        );
      },
    );

    it(
      'should reject duplicate galactic object keys',
      () => {
        expect(
          () =>
            new GalaxySectorContent(
              generationKey,

              locator,

              coordinates,

              sectorSeed,

              createDensity(),

              [],

              [
                new GalacticObjectLocator(
                  0n,
                  0n,
                  0n,
                ),

                new GalacticObjectLocator(
                  0n,
                  0n,
                  0n,
                ),
              ],
            ),
        ).toThrow(
          'GalaxySectorContent cannot contain duplicate galactic object keys.',
        );
      },
    );
  },
);