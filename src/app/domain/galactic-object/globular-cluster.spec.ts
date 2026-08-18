import {
  GlobularClusterPhysicalProperties,
} from './globular-cluster-physical-properties';

import {
  GlobularCluster,
} from './globular-cluster';

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
  GalaxySectorObjectLocation,
} from '../sector/galaxy-sector-object-location';

import {
  UniverseSeed,
} from '../universe/universe-seed';

describe(
  'GlobularCluster',
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
        7n,
      );

    const properties =
      new GlobularClusterPhysicalProperties(
        250_000,
        110_000,
        11.8,
        0.18,
        0.7,
        3.4,
        58,
        0.78,
        0.24,
      );

    it(
      'should extend the common point-12.1 GalacticObject identity',
      () => {
        const cluster =
          new GlobularCluster(
            generationKey,
            locator,
            new GalaxySectorObjectLocation(
              {
                x:
                  0,
                y:
                  0,
              },
              0.25,
              0.75,
            ),
            properties,
          );

        expect(
          cluster.locator,
        ).toBe(
          locator,
        );

        expect(
          cluster.physicalProperties,
        ).toBe(
          properties,
        );
      },
    );

    it(
      'should preserve the common galaxy, sector and object indices',
      () => {
        const cluster =
          new GlobularCluster(
            generationKey,
            locator,
            new GalaxySectorObjectLocation(
              {
                x:
                  0,
                y:
                  0,
              },
              0.25,
              0.75,
            ),
            properties,
          );

        expect(
          cluster.galaxyIndex,
        ).toBe(
          0n,
        );

        expect(
          cluster.sectorKey,
        ).toBe(
          0n,
        );

        expect(
          cluster.galacticObjectIndex,
        ).toBe(
          7n,
        );
      },
    );

    it(
      'should retain the point-12.1 sector/location consistency guard',
      () => {
        expect(
          () =>
            new GlobularCluster(
              generationKey,
              new GalacticObjectLocator(
                0n,
                0n,
                7n,
              ),
              new GalaxySectorObjectLocation(
                {
                  x:
                    1,
                  y:
                    0,
                },
                0.25,
                0.75,
              ),
              properties,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should not expose observation, reward or rendering state in the domain model',
      () => {
        const cluster =
          new GlobularCluster(
            generationKey,
            locator,
            new GalaxySectorObjectLocation(
              {
                x:
                  0,
                y:
                  0,
              },
              0.25,
              0.75,
            ),
            properties,
          );

        expect(
          'discoveryPoints' in cluster,
        ).toBe(
          false,
        );

        expect(
          'observationState' in cluster,
        ).toBe(
          false,
        );

        expect(
          'renderData' in cluster,
        ).toBe(
          false,
        );
      },
    );
  },
);
