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

import {
  NebulaPhysicalProperties,
} from './nebula-physical-properties';

import {
  NebulaType,
} from './nebula-type';

import {
  Nebula,
} from './nebula';

describe(
  'Nebula',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5',
        ),
        GeneratorVersion.V1,
      );

    const sectorKey =
      GalaxySectorKeyCodec
        .encode({
          x:
            -9,

          y:
            14,
        });

    const locator =
      new GalacticObjectLocator(
        2n,
        sectorKey,
        4n,
      );

    const location =
      new GalaxySectorObjectLocation(
        {
          x:
            -9,

          y:
            14,
        },
        0.2,
        0.8,
      );

    const properties =
      new NebulaPhysicalProperties(
        8,
        1500,
        9500,
        250,
        0.9,
        0.012,
      );

    it(
      'should specialize the common GalacticObject without duplicating procedural identity',
      () => {
        const nebula =
          new Nebula(
            generationKey,
            locator,
            location,
            NebulaType.EMISSION,
            properties,
          );

        expect(
          nebula,
        ).toBeInstanceOf(
          GalacticObject,
        );

        expect(
          nebula.generationKey,
        ).toBe(
          generationKey,
        );

        expect(
          nebula.locator,
        ).toBe(
          locator,
        );

        expect(
          nebula.location,
        ).toBe(
          location,
        );
      },
    );

    it(
      'should preserve the physical nebula subtype and Ground Truth profile',
      () => {
        const nebula =
          new Nebula(
            generationKey,
            locator,
            location,
            NebulaType.DARK,
            properties,
          );

        expect(
          nebula.nebulaType,
        ).toBe(
          NebulaType.DARK,
        );

        expect(
          nebula.physicalProperties,
        ).toBe(
          properties,
        );
      },
    );

    it(
      'should inherit the point-12.1 sector coherence validation',
      () => {
        expect(
          () =>
            new Nebula(
              generationKey,
              locator,
              new GalaxySectorObjectLocation(
                {
                  x:
                    -8,

                  y:
                    14,
                },
                0.2,
                0.8,
              ),
              NebulaType.REFLECTION,
              properties,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject an unknown runtime nebula subtype',
      () => {
        expect(
          () =>
            new Nebula(
              generationKey,
              locator,
              location,
              'UNKNOWN' as never,
              properties,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should not embed discovery, PD, scientific-action or render state in the Ground Truth model',
      () => {
        const nebula =
          new Nebula(
            generationKey,
            locator,
            location,
            NebulaType.PLANETARY,
            properties,
          ) as unknown as
            Record<string, unknown>;

        expect(
          nebula['discoveryState'],
        ).toBeUndefined();

        expect(
          nebula['discoveryPoints'],
        ).toBeUndefined();

        expect(
          nebula['scientificActions'],
        ).toBeUndefined();

        expect(
          nebula['renderData'],
        ).toBeUndefined();
      },
    );
  },
);
