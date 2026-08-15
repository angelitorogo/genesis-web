import * as THREE from 'three';

import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

import {
  ExplorationResultKind,
  type ExplorationLocatedResultKind,
} from '../../domain/exploration/exploration-sector-result';

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

import {
  INITIAL_GALACTIC_MAP_LAYER_VISIBILITY,
} from './galactic-map-layer-state';

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
      resultKind:
        ExplorationLocatedResultKind,

      x:
        number,

      y:
        number,

      normalizedX:
        number,

      normalizedY:
        number,

      index =
        0n,
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
        resultKind ===
          ExplorationResultKind.SYSTEM
          ? new SystemLocator(
              0n,
              sectorKey,
              index,
            )
          : new GalacticObjectLocator(
              0n,
              sectorKey,
              index,
            ),
        resultKind,
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
              ExplorationResultKind.SYSTEM,
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
              ExplorationResultKind.NEBULA,
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
      'should create one independent Points group for each populated point-10.5 marker family',
      () => {
        const markers =
          new GalacticMapDiscoveryMarkers(
            generationKey,
            0n,
            grid,
            [
              marker(
                ExplorationResultKind.SYSTEM,
                0,
                0,
                0.5,
                0.5,
                0n,
              ),
              marker(
                ExplorationResultKind.NEBULA,
                0,
                0,
                0.3,
                0.4,
                1n,
              ),
              marker(
                ExplorationResultKind.STAR_CLUSTER,
                1,
                0,
                0.4,
                0.6,
                2n,
              ),
              marker(
                ExplorationResultKind.EXTREME_OBJECT,
                -1,
                0,
                0.7,
                0.2,
                3n,
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

        for (
          const name
          of [
            'galactic-map-system-markers',
            'galactic-map-nebula-markers',
            'galactic-map-star-cluster-markers',
            'galactic-map-extreme-object-markers',
          ]
        ) {
          expect(
            overlay
              .object3d
              .getObjectByName(
                name,
              ),
          ).toBeInstanceOf(
            THREE.Points,
          );
        }

        overlay.dispose();
      },
    );

    it(
      'should switch marker-family visibility independently and preserve pixel-ratio updates',
      () => {
        const markers =
          new GalacticMapDiscoveryMarkers(
            generationKey,
            0n,
            grid,
            [
              marker(
                ExplorationResultKind.SYSTEM,
                0,
                0,
                0.5,
                0.5,
                0n,
              ),
              marker(
                ExplorationResultKind.NEBULA,
                0,
                0,
                0.3,
                0.4,
                1n,
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

        overlay.setLayerVisibility({
          ...INITIAL_GALACTIC_MAP_LAYER_VISIBILITY,
          nebulae:
            false,
        });

        expect(
          overlay
            .object3d
            .getObjectByName(
              'galactic-map-system-markers',
            )
            ?.visible,
        ).toBe(
          true,
        );

        expect(
          overlay
            .object3d
            .getObjectByName(
              'galactic-map-nebula-markers',
            )
            ?.visible,
        ).toBe(
          false,
        );

        overlay.setPixelRatio(
          2,
        );

        const systemPoints =
          overlay
            .object3d
            .getObjectByName(
              'galactic-map-system-markers',
            ) as
            THREE.Points<
              THREE.BufferGeometry,
              THREE.ShaderMaterial
            >;

        expect(
          systemPoints
            .material
            .uniforms[
              'uPixelRatio'
            ]
            .value,
        ).toBe(
          2,
        );

        overlay.dispose();
      },
    );

    it(
      'should reject incompatible marker/coverage snapshots and dispose renderer resources',
      () => {
        const markers =
          new GalacticMapDiscoveryMarkers(
            generationKey,
            0n,
            grid,
            [
              marker(
                ExplorationResultKind.SYSTEM,
                0,
                0,
                0.5,
                0.5,
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

        overlay.dispose();

        expect(
          overlay.object3d.children,
        ).toHaveLength(
          0,
        );

        const foreignCoverage =
          new GalacticMapExplorationCoverage(
            generationKey,
            1n,
            new GalaxySectorGrid(
              generationKey,
              1n,
              1000,
              2,
            ),
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
