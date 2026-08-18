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
  GalaxySectorKeyCodec,
} from '../sector/galaxy-sector-key-codec';

import {
  GalaxySectorObjectLocation,
} from '../sector/galaxy-sector-object-location';

import {
  UniverseSeed,
} from '../universe/universe-seed';

import {
  GalacticObject,
} from './galactic-object';

describe(
  'GalacticObject',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5',
        ),
        GeneratorVersion.V1,
      );

    const coordinates =
      Object.freeze({
        x:
          12,

        y:
          -34,
      });

    const sectorKey =
      GalaxySectorKeyCodec
        .encode(
          coordinates,
        );

    const locator =
      new GalacticObjectLocator(
        3n,
        sectorKey,
        7n,
      );

    const location =
      new GalaxySectorObjectLocation(
        coordinates,
        0.25,
        0.75,
      );

    it(
      'should preserve the common point-12.1 generation identity, locator and exact location',
      () => {
        const object =
          new GalacticObject(
            generationKey,
            locator,
            location,
          );

        expect(
          object.generationKey,
        ).toBe(
          generationKey,
        );

        expect(
          object.locator,
        ).toBe(
          locator,
        );

        expect(
          object.location,
        ).toBe(
          location,
        );
      },
    );

    it(
      'should expose the procedural identity without duplicating persisted addressing state',
      () => {
        const object =
          new GalacticObject(
            generationKey,
            locator,
            location,
          );

        expect(
          object.galaxyIndex,
        ).toBe(
          3n,
        );

        expect(
          object.sectorKey,
        ).toBe(
          sectorKey,
        );

        expect(
          object.galacticObjectIndex,
        ).toBe(
          7n,
        );
      },
    );

    it(
      'should accept a location whose coordinates exactly match the locator sector key',
      () => {
        expect(
          () =>
            new GalacticObject(
              generationKey,
              locator,
              new GalaxySectorObjectLocation(
                GalaxySectorKeyCodec
                  .decode(
                    sectorKey,
                  ),
                0,
                0.999999999,
              ),
            ),
        ).not.toThrow();
      },
    );

    it(
      'should reject a location from another sector',
      () => {
        expect(
          () =>
            new GalacticObject(
              generationKey,
              locator,
              new GalaxySectorObjectLocation(
                {
                  x:
                    13,

                  y:
                    -34,
                },
                0.25,
                0.75,
              ),
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should keep the common model free of premature point-12 subtype or gameplay state fields',
      () => {
        const object =
          new GalacticObject(
            generationKey,
            locator,
            location,
          ) as unknown as
            Record<string, unknown>;

        expect(
          object['family'],
        ).toBeUndefined();

        expect(
          object['kind'],
        ).toBeUndefined();

        expect(
          object['discoveryState'],
        ).toBeUndefined();

        expect(
          object['discoveryPoints'],
        ).toBeUndefined();

        expect(
          object['renderData'],
        ).toBeUndefined();
      },
    );
  },
);
