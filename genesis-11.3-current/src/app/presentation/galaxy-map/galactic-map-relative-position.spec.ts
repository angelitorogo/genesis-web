import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

import {
  ExplorationResultKind,
} from '../../domain/exploration/exploration-sector-result';

import {
  SystemLocator,
} from '../../domain/generation/procedural-locator';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  GalaxySectorCoordinates,
} from '../../domain/sector/galaxy-sector-coordinates';

import {
  GalaxySectorGrid,
} from '../../domain/sector/galaxy-sector-grid';

import {
  GalaxySectorKeyCodec,
} from '../../domain/sector/galaxy-sector-key-codec';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  GalacticMapDiscoveryMarker,
} from './galactic-map-discovery-markers';

import {
  GalacticMapRelativeRegion,
  galacticMapRelativeRegionLabel,
  resolveGalacticMapRelativePosition,
} from './galactic-map-relative-position';

describe(
  'GalacticMapRelativePosition',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    const regionRadii =
      Object.freeze({
        centralOuterRadiusNormalized:
          0.15,
        innerOuterRadiusNormalized:
          0.40,
        middleOuterRadiusNormalized:
          0.70,
        nominalOuterRadiusNormalized:
          1.00,
      });

    function marker(
      x:
        number,

      y:
        number,

      normalizedX =
        0.5,

      normalizedY =
        0.5,

      galaxyIndex =
        0n,
    ): GalacticMapDiscoveryMarker {

      const coordinates =
        new GalaxySectorCoordinates(
          x,
          y,
        );

      return new GalacticMapDiscoveryMarker(
        new SystemLocator(
          galaxyIndex,
          GalaxySectorKeyCodec
            .encode(
              coordinates,
            ),
          0n,
        ),
        ExplorationResultKind.SYSTEM,
        DiscoveryState.DETECTED,
        coordinates,
        normalizedX,
        normalizedY,
      );
    }

    it(
      'should place the exact centre of sector 0,0 at the galactic centre',
      () => {
        const grid =
          new GalaxySectorGrid(
            generationKey,
            0n,
            1000,
            86,
          );

        const position =
          resolveGalacticMapRelativePosition(
            marker(
              0,
              0,
            ),
            grid,
            regionRadii,
          );

        expect(
          position.xLightYears,
        ).toBe(
          0,
        );

        expect(
          position.yLightYears,
        ).toBe(
          0,
        );

        expect(
          position.distanceFromCenterLightYears,
        ).toBe(
          0,
        );

        expect(
          position.normalizedRadius,
        ).toBe(
          0,
        );

        expect(
          position.azimuthDegrees,
        ).toBe(
          0,
        );

        expect(
          position.region,
        ).toBe(
          GalacticMapRelativeRegion.CENTRAL,
        );
      },
    );

    it(
      'should include deterministic intra-sector placement in physical offsets, distance, radius and azimuth',
      () => {
        const grid =
          new GalaxySectorGrid(
            generationKey,
            0n,
            1000,
            86,
          );

        const position =
          resolveGalacticMapRelativePosition(
            marker(
              12,
              -8,
              0.84,
              0.89,
            ),
            grid,
            regionRadii,
          );

        expect(
          position.xLightYears,
        ).toBeCloseTo(
          12_340,
          10,
        );

        expect(
          position.yLightYears,
        ).toBeCloseTo(
          -7_610,
          10,
        );

        expect(
          position.distanceFromCenterLightYears,
        ).toBeCloseTo(
          14_497.851564973343,
          10,
        );

        expect(
          position.normalizedRadius,
        ).toBeCloseTo(
          0.16857966936015514,
          12,
        );

        expect(
          position.azimuthDegrees,
        ).toBeCloseTo(
          328.33812762231787,
          10,
        );

        expect(
          position.region,
        ).toBe(
          GalacticMapRelativeRegion.INNER,
        );
      },
    );

    it(
      'should use the frozen point-10.5 radial boundaries without defining a second region profile',
      () => {
        const grid =
          new GalaxySectorGrid(
            generationKey,
            0n,
            1000,
            100,
          );

        const cases = [
          {
            marker:
              marker(
                14,
                0,
              ),
            expected:
              GalacticMapRelativeRegion.CENTRAL,
          },
          {
            marker:
              marker(
                15,
                0,
              ),
            expected:
              GalacticMapRelativeRegion.INNER,
          },
          {
            marker:
              marker(
                40,
                0,
              ),
            expected:
              GalacticMapRelativeRegion.MIDDLE,
          },
          {
            marker:
              marker(
                70,
                0,
              ),
            expected:
              GalacticMapRelativeRegion.OUTER,
          },
          {
            marker:
              marker(
                80,
                80,
              ),
            expected:
              GalacticMapRelativeRegion.OUTSIDE_NOMINAL,
          },
        ];

        for (
          const item
          of cases
        ) {
          expect(
            resolveGalacticMapRelativePosition(
              item.marker,
              grid,
              regionRadii,
            )
              .region,
          ).toBe(
            item.expected,
          );
        }
      },
    );

    it(
      'should preserve the +X zero-degree and counterclockwise +Y azimuth convention',
      () => {
        const grid =
          new GalaxySectorGrid(
            generationKey,
            0n,
            1000,
            10,
          );

        expect(
          resolveGalacticMapRelativePosition(
            marker(
              1,
              0,
            ),
            grid,
            regionRadii,
          )
            .azimuthDegrees,
        ).toBeCloseTo(
          0,
          12,
        );

        expect(
          resolveGalacticMapRelativePosition(
            marker(
              0,
              1,
            ),
            grid,
            regionRadii,
          )
            .azimuthDegrees,
        ).toBeCloseTo(
          90,
          12,
        );

        expect(
          resolveGalacticMapRelativePosition(
            marker(
              -1,
              0,
            ),
            grid,
            regionRadii,
          )
            .azimuthDegrees,
        ).toBeCloseTo(
          180,
          12,
        );

        expect(
          resolveGalacticMapRelativePosition(
            marker(
              0,
              -1,
            ),
            grid,
            regionRadii,
          )
            .azimuthDegrees,
        ).toBeCloseTo(
          270,
          12,
        );
      },
    );

    it(
      'should keep a single-sector galaxy normalized at the centre while preserving physical intra-sector offsets',
      () => {
        const grid =
          new GalaxySectorGrid(
            generationKey,
            0n,
            1000,
            0,
          );

        const position =
          resolveGalacticMapRelativePosition(
            marker(
              0,
              0,
              0.75,
              0.25,
            ),
            grid,
            regionRadii,
          );

        expect(
          position.xLightYears,
        ).toBe(
          250,
        );

        expect(
          position.yLightYears,
        ).toBe(
          -250,
        );

        expect(
          position.normalizedRadius,
        ).toBe(
          0,
        );

        expect(
          position.region,
        ).toBe(
          GalacticMapRelativeRegion.CENTRAL,
        );
      },
    );

    it(
      'should expose stable Spanish region labels and reject incompatible grid identity or invalid boundaries',
      () => {
        expect(
          galacticMapRelativeRegionLabel(
            GalacticMapRelativeRegion.CENTRAL,
          ),
        ).toBe(
          'Región central',
        );

        expect(
          galacticMapRelativeRegionLabel(
            GalacticMapRelativeRegion.INNER,
          ),
        ).toBe(
          'Región interior',
        );

        expect(
          galacticMapRelativeRegionLabel(
            GalacticMapRelativeRegion.MIDDLE,
          ),
        ).toBe(
          'Región media',
        );

        expect(
          galacticMapRelativeRegionLabel(
            GalacticMapRelativeRegion.OUTER,
          ),
        ).toBe(
          'Región exterior',
        );

        expect(
          galacticMapRelativeRegionLabel(
            GalacticMapRelativeRegion.OUTSIDE_NOMINAL,
          ),
        ).toBe(
          'Fuera del límite nominal',
        );

        const foreignGrid =
          new GalaxySectorGrid(
            generationKey,
            1n,
            1000,
            86,
          );

        expect(
          () =>
            resolveGalacticMapRelativePosition(
              marker(
                0,
                0,
              ),
              foreignGrid,
              regionRadii,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            resolveGalacticMapRelativePosition(
              marker(
                0,
                0,
              ),
              new GalaxySectorGrid(
                generationKey,
                0n,
                1000,
                86,
              ),
              {
                centralOuterRadiusNormalized:
                  0.40,
                innerOuterRadiusNormalized:
                  0.15,
                middleOuterRadiusNormalized:
                  0.70,
                nominalOuterRadiusNormalized:
                  1.00,
              },
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
