import {
  GalacticObject,
} from './galactic-object';

import {
  OpenClusterPhysicalProperties,
} from './open-cluster-physical-properties';

import {
  OpenCluster,
} from './open-cluster';

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

describe(
  'OpenCluster',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    const sectorKey =
      GalaxySectorKeyCodec.encode({
        x:
          0,
        y:
          0,
      });

    const locator =
      new GalacticObjectLocator(
        0n,
        sectorKey,
        2n,
      );

    const location =
      new GalaxySectorObjectLocation(
        {
          x:
            0,
          y:
            0,
        },
        0.25,
        0.75,
      );

    const physicalProperties =
      new OpenClusterPhysicalProperties(
        540,
        220,
        750,
        1.1,
        2.4,
        12,
        0.42,
        0.73,
      );

    it(
      'should remain a GalacticObject with the same procedural identity',
      () => {
        const cluster =
          new OpenCluster(
            generationKey,
            locator,
            location,
            physicalProperties,
          );

        expect(
          cluster,
        ).toBeInstanceOf(
          GalacticObject,
        );

        expect(
          cluster.locator,
        ).toBe(
          locator,
        );
      },
    );

    it(
      'should expose aggregate physical Ground Truth without individual stars',
      () => {
        const cluster =
          new OpenCluster(
            generationKey,
            locator,
            location,
            physicalProperties,
          );

        expect(
          cluster.physicalProperties,
        ).toBe(
          physicalProperties,
        );

        expect(
          'stars' in cluster,
        ).toBe(
          false,
        );
      },
    );

    it(
      'should preserve the inherited galaxy, sector and object indices',
      () => {
        const cluster =
          new OpenCluster(
            generationKey,
            locator,
            location,
            physicalProperties,
          );

        expect(
          cluster.galaxyIndex,
        ).toBe(
          0n,
        );

        expect(
          cluster.sectorKey,
        ).toBe(
          sectorKey,
        );

        expect(
          cluster.galacticObjectIndex,
        ).toBe(
          2n,
        );
      },
    );

    it(
      'should preserve the point-12.1 sector-location invariant',
      () => {
        const wrongLocation =
          new GalaxySectorObjectLocation(
            {
              x:
                1,
              y:
                0,
            },
            0.25,
            0.75,
          );

        expect(
          () =>
            new OpenCluster(
              generationKey,
              locator,
              wrongLocation,
              physicalProperties,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
