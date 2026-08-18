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
  HiiRegionPhysicalProperties,
} from './hii-region-physical-properties';

import {
  HiiRegion,
} from './hii-region';

import {
  NebulaPhysicalProperties,
} from './nebula-physical-properties';

import {
  NebulaType,
} from './nebula-type';

import {
  Nebula,
} from './nebula';

import {
  StarFormationActivity,
} from './star-formation-activity';

import {
  StarFormationProfile,
} from './star-formation-profile';

describe(
  'HiiRegion',
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
            -4,

          y:
            7,
        });

    const locator =
      new GalacticObjectLocator(
        1n,
        sectorKey,
        2n,
      );

    const location =
      new GalaxySectorObjectLocation(
        {
          x:
            -4,

          y:
            7,
        },
        0.35,
        0.62,
      );

    const nebulaProperties =
      new NebulaPhysicalProperties(
        20,
        3500,
        9000,
        300,
        0.88,
        0.012,
      );

    const hiiProperties =
      new HiiRegionPhysicalProperties(
        8,
        9500,
        420,
      );

    const starFormation =
      new StarFormationProfile(
        StarFormationActivity.MODERATE,
        2500,
        2.1,
        18,
        8e49,
      );

    it(
      'should specialize Nebula while preserving the common procedural identity',
      () => {
        const region =
          new HiiRegion(
            generationKey,
            locator,
            location,
            nebulaProperties,
            hiiProperties,
            starFormation,
          );

        expect(
          region,
        ).toBeInstanceOf(
          Nebula,
        );

        expect(
          region.locator,
        ).toBe(
          locator,
        );

        expect(
          region.location,
        ).toBe(
          location,
        );
      },
    );

    it(
      'should always identify an H II region as an emission nebula',
      () => {
        const region =
          new HiiRegion(
            generationKey,
            locator,
            location,
            nebulaProperties,
            hiiProperties,
            starFormation,
          );

        expect(
          region.nebulaType,
        ).toBe(
          NebulaType.EMISSION,
        );
      },
    );

    it(
      'should preserve the H II physical state and star-formation profile',
      () => {
        const region =
          new HiiRegion(
            generationKey,
            locator,
            location,
            nebulaProperties,
            hiiProperties,
            starFormation,
          );

        expect(
          region.hiiPhysicalProperties,
        ).toBe(
          hiiProperties,
        );

        expect(
          region.starFormationProfile,
        ).toBe(
          starFormation,
        );
      },
    );

    it(
      'should reject an ionized region larger than its parent emission nebula',
      () => {
        expect(
          () =>
            new HiiRegion(
              generationKey,
              locator,
              location,
              nebulaProperties,
              new HiiRegionPhysicalProperties(
                20.0001,
                9500,
                420,
              ),
              starFormation,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should not embed discovery, PD, scientific-action, cluster or render state',
      () => {
        const region =
          new HiiRegion(
            generationKey,
            locator,
            location,
            nebulaProperties,
            hiiProperties,
            starFormation,
          ) as unknown as
            Record<string, unknown>;

        expect(
          region['discoveryState'],
        ).toBeUndefined();

        expect(
          region['discoveryPoints'],
        ).toBeUndefined();

        expect(
          region['scientificActions'],
        ).toBeUndefined();

        expect(
          region['starCluster'],
        ).toBeUndefined();

        expect(
          region['renderData'],
        ).toBeUndefined();
      },
    );
  },
);
