import {
  GalacticObject,
} from './galactic-object';

import {
  SupernovaRemnantMorphology,
} from './supernova-remnant-morphology';

import {
  SupernovaRemnantPhysicalProperties,
} from './supernova-remnant-physical-properties';

import {
  SupernovaRemnant,
} from './supernova-remnant';

import {
  GeneratorVersion,
} from '../generation/generator-version';

import {
  GalacticObjectLocator,
} from '../generation/procedural-locator';

import {
  UniverseGenerationKey,
} from '../generation/universe-generation-key';

import {
  GalaxySectorCoordinates,
} from '../sector/galaxy-sector-coordinates';

import {
  GalaxySectorObjectLocation,
} from '../sector/galaxy-sector-object-location';

import {
  UniverseSeed,
} from '../universe/universe-seed';

describe(
  'SupernovaRemnant',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    const locator =
      new GalacticObjectLocator(
        0n,
        0n,
        0n,
      );

    const properties =
      new SupernovaRemnantPhysicalProperties(
        12_000,
        18,
        590,
        4_700_000,
        1e51,
        0.8,
        6.5,
        676,
      );

    function create():
      SupernovaRemnant {

      return new SupernovaRemnant(
        generationKey,
        locator,
        new GalaxySectorObjectLocation(
          new GalaxySectorCoordinates(
            0,
            0,
          ),
          0.25,
          0.75,
        ),
        SupernovaRemnantMorphology.SHELL,
        properties,
      );
    }

    it(
      'should remain a GalacticObject with the same persistent locator identity',
      () => {
        const remnant =
          create();

        expect(
          remnant,
        ).toBeInstanceOf(
          GalacticObject,
        );

        expect(
          remnant.locator,
        ).toBe(
          locator,
        );
      },
    );

    it(
      'should expose morphology and intrinsic Ground Truth',
      () => {
        const remnant =
          create();

        expect(
          remnant.morphology,
        ).toBe(
          SupernovaRemnantMorphology.SHELL,
        );

        expect(
          remnant.physicalProperties,
        ).toBe(
          properties,
        );
      },
    );

    it(
      'should preserve the common galactic-object lineage getters',
      () => {
        const remnant =
          create();

        expect(
          remnant.galaxyIndex,
        ).toBe(0n);

        expect(
          remnant.sectorKey,
        ).toBe(0n);

        expect(
          remnant.galacticObjectIndex,
        ).toBe(0n);
      },
    );

    it(
      'should reject a location outside the persistent locator sector',
      () => {
        expect(
          () =>
            new SupernovaRemnant(
              generationKey,
              locator,
              new GalaxySectorObjectLocation(
                new GalaxySectorCoordinates(
                  1,
                  0,
                ),
                0.25,
                0.75,
              ),
              SupernovaRemnantMorphology.SHELL,
              properties,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
