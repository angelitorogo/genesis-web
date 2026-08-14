import * as THREE from 'three';

import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

import {
  GalacticObjectLocator,
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
  createGalacticMapDiscoveryMarkerOverlay,
  discoveryMarkerLocalPosition,
} from './galactic-map-discovery-marker-overlay';

import {
  GalacticMapDiscoveryMarker,
  GalacticMapDiscoveryMarkers,
} from './galactic-map-discovery-markers';

import {
  GalacticMapExplorationCoverage,
} from './galactic-map-exploration-coverage';

describe(
  'GalacticMapDiscoveryMarkerOverlay',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    const grid =
      new GalaxySectorGrid(
        generationKey,
        0n,
        1000,
        2,
      );

    const coverage =
      new GalacticMapExplorationCoverage(
        generationKey,
        0n,
        grid,
        [
          new GalaxySectorCoordinates(
            0,
            0,
          ),
        ],
      );

    function marker(
      kind:
        'system' |
        'object',

      x:
        number,

      y:
        number,

      normalizedX:
        number,

      normalizedY:
        number,
    ): GalacticMapDiscoveryMarker {

      const coordinates =
        new GalaxySectorCoordinates(
          x,
          y,
        );

      const sectorKey =
        GalaxySectorKeyCodec
          .encode(
            coordinates,
          );

      return new GalacticMapDiscoveryMarker(
        kind ===
          'system'
          ? new SystemLocator(
              0n,
              sectorKey,
              0n,
            )
          : new GalacticObjectLocator(
              0n,
              sectorKey,
              1n,
            ),
        DiscoveryState.DETECTED,
        coordinates,
        normalizedX,
        normalizedY,
      );
    }

    it(
      'should map normalized object placement inside the exact 10.3 sector cell',
      () => {
        const center =
          discoveryMarkerLocalPosition(
            marker(
              'system',
              0,
              0,
              0.5,
              0.5,
            ),
            coverage,
            1,
          );

        expect(
          center.x,
        ).toBeCloseTo(
          0,
          12,
        );

        expect(
          center.y,
        ).toBeCloseTo(
          0,
          12,
        );

        const offset =
          discoveryMarkerLocalPosition(
            marker(
              'object',
              1,
              -1,
              1 -
                Number.EPSILON,
              0,
            ),
            coverage,
            1,
          );

        expect(
          offset.x,
        ).toBeGreaterThan(
          0.4,
        );

        expect(
          offset.y,
        ).toBeLessThan(
          -0.4,
        );
      },
    );

    it(
      'should build one lightweight generic THREE.Points marker layer for all persistent objects',
      () => {
        const markers =
          new GalacticMapDiscoveryMarkers(
            generationKey,
            0n,
            grid,
            [
              marker(
                'system',
                0,
                0,
                0.2,
                0.8,
              ),
              marker(
                'object',
                1,
                0,
                0.7,
                0.3,
              ),
            ],
          );

        const overlay =
          createGalacticMapDiscoveryMarkerOverlay(
            markers,
            coverage,
            1,
            1,
          );

        expect(
          overlay.object3d.name,
        ).toBe(
          'galactic-map-discovery-markers',
        );

        const points =
          overlay
            .object3d
            .getObjectByName(
              'galactic-map-discovery-marker-points',
            );

        expect(
          points,
        ).toBeInstanceOf(
          THREE.Points,
        );

        expect(
          (
            points as
              THREE.Points
          )
            .geometry
            .getAttribute(
              'position',
            )
            .count,
        ).toBe(
          2,
        );

        overlay.dispose();

        expect(
          overlay.object3d.children,
        ).toHaveLength(
          0,
        );
      },
    );

    it(
      'should keep an empty marker snapshot allocation-light and accept renderer pixel-ratio changes',
      () => {
        const markers =
          new GalacticMapDiscoveryMarkers(
            generationKey,
            0n,
            grid,
            [],
          );

        const overlay =
          createGalacticMapDiscoveryMarkerOverlay(
            markers,
            coverage,
            1,
            1,
          );

        expect(
          overlay
            .object3d
            .getObjectByName(
              'galactic-map-discovery-marker-points',
            ),
        ).toBeUndefined();

        expect(
          () =>
            overlay.setPixelRatio(
              2,
            ),
        ).not.toThrow();

        overlay.dispose();
      },
    );

    it(
      'should reject invalid renderer scale or snapshots from incompatible galaxy grids',
      () => {
        const markers =
          new GalacticMapDiscoveryMarkers(
            generationKey,
            0n,
            grid,
            [],
          );

        expect(
          () =>
            createGalacticMapDiscoveryMarkerOverlay(
              markers,
              coverage,
              0,
              1,
            ),
        ).toThrow(
          RangeError,
        );

        const foreignGrid =
          new GalaxySectorGrid(
            generationKey,
            1n,
            1000,
            2,
          );

        const foreignCoverage =
          new GalacticMapExplorationCoverage(
            generationKey,
            1n,
            foreignGrid,
            [],
          );

        expect(
          () =>
            createGalacticMapDiscoveryMarkerOverlay(
              markers,
              foreignCoverage,
              1,
              1,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
