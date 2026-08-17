import * as THREE from 'three';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  GalaxySectorGrid,
} from '../../domain/sector/galaxy-sector-grid';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  GalacticMapExplorationCoverage,
} from './galactic-map-exploration-coverage';

import {
  GalacticMapLodLevel,
  galacticMapLodForCameraDistance,
  galacticMapParticleRetentionRatio,
  resolveGalacticMapVisibleSectorWindow,
  sectorBoundsCount,
  sectorBoundsForLocalBounds,
} from './galactic-map-visible-sector-lod';

describe(
  'GalacticMapVisibleSectorLod',
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
        [],
      );

    it(
      'should freeze the three camera-distance LOD bands and their retention ratios',
      () => {
        expect(
          galacticMapLodForCameraDistance(
            3.5,
          ),
        ).toBe(
          GalacticMapLodLevel.OVERVIEW,
        );

        expect(
          galacticMapLodForCameraDistance(
            2,
          ),
        ).toBe(
          GalacticMapLodLevel.BALANCED,
        );

        expect(
          galacticMapLodForCameraDistance(
            0.8,
          ),
        ).toBe(
          GalacticMapLodLevel.DETAIL,
        );

        expect(
          galacticMapParticleRetentionRatio(
            GalacticMapLodLevel.OVERVIEW,
          ),
        ).toBe(
          0.88,
        );

        expect(
          galacticMapParticleRetentionRatio(
            GalacticMapLodLevel.BALANCED,
          ),
        ).toBe(
          0.96,
        );

        expect(
          galacticMapParticleRetentionRatio(
            GalacticMapLodLevel.DETAIL,
          ),
        ).toBe(
          1,
        );
      },
    );

    it(
      'should convert local viewport bounds into the exact overlapping sector rectangle',
      () => {
        const bounds =
          sectorBoundsForLocalBounds(
            coverage,
            1,
            -0.19,
            0.19,
            -0.19,
            0.19,
          );

        expect(
          bounds,
        ).toEqual({
          minX:
            0,
          maxX:
            0,
          minY:
            0,
          maxY:
            0,
        });

        expect(
          sectorBoundsCount(
            bounds,
          ),
        ).toBe(
          1,
        );
      },
    );

    it(
      'should clamp a local viewport larger than the halo to the canonical grid',
      () => {
        const bounds =
          sectorBoundsForLocalBounds(
            coverage,
            1,
            -10,
            10,
            -10,
            10,
          );

        expect(
          bounds,
        ).toEqual({
          minX:
            -2,
          maxX:
            2,
          minY:
            -2,
          maxY:
            2,
        });

        expect(
          sectorBoundsCount(
            bounds,
          ),
        ).toBe(
          25,
        );
      },
    );

    it(
      'should resolve a camera viewport on the galaxy plane and add a bounded prefetch ring',
      () => {
        const camera =
          new THREE.PerspectiveCamera(
            40,
            1,
            0.1,
            20,
          );

        camera.position.set(
          0,
          -3.18,
          1.42,
        );

        camera.lookAt(
          0,
          0,
          0,
        );

        const group =
          new THREE.Group();

        group.scale.setScalar(
          1.52,
        );

        const window =
          resolveGalacticMapVisibleSectorWindow(
            camera,
            group,
            coverage,
            1,
            3.5,
            1,
          );

        expect(
          window.lodLevel,
        ).toBe(
          GalacticMapLodLevel.OVERVIEW,
        );

        expect(
          window.visibleSectorCount,
        ).toBeGreaterThan(
          0,
        );

        expect(
          window.activeSectorCount,
        ).toBeGreaterThanOrEqual(
          window.visibleSectorCount,
        );

        expect(
          window.active.minX,
        ).toBeGreaterThanOrEqual(
          grid.minCoordinate,
        );

        expect(
          window.active.maxX,
        ).toBeLessThanOrEqual(
          grid.maxCoordinate,
        );
      },
    );

    it(
      'should keep the full visual cloud resident when an oblique viewport crosses the galactic horizon',
      () => {
        const camera =
          new THREE.PerspectiveCamera(
            40,
            1,
            0.1,
            20,
          );

        /*
         * Half vertical FOV is 20 degrees, while this camera looks down at the
         * galaxy plane by less than that. The upper viewport rays therefore do
         * not intersect Z=0. The old resolver incorrectly used only the lower
         * successful rays and removed roughly half of the visual galaxy.
         */
        camera.position.set(
          0,
          -3,
          0.5,
        );

        camera.lookAt(
          0,
          0,
          0,
        );

        const group =
          new THREE.Group();

        group.scale.setScalar(
          1.52,
        );

        const window =
          resolveGalacticMapVisibleSectorWindow(
            camera,
            group,
            coverage,
            1,
            3.1,
            1,
          );

        expect(
          window.visible,
        ).toEqual({
          minX:
            grid.minCoordinate,
          maxX:
            grid.maxCoordinate,
          minY:
            grid.minCoordinate,
          maxY:
            grid.maxCoordinate,
        });

        expect(
          window.active,
        ).toEqual(
          window.visible,
        );

        expect(
          window.visibleSectorCount,
        ).toBe(
          25,
        );

        expect(
          window.activeSectorCount,
        ).toBe(
          25,
        );

        expect(
          window.lodLevel,
        ).toBe(
          GalacticMapLodLevel.OVERVIEW,
        );
      },
    );

    it(
      'should reject invalid camera distance and malformed local bounds',
      () => {
        expect(
          () =>
            galacticMapLodForCameraDistance(
              0,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            sectorBoundsForLocalBounds(
              coverage,
              1,
              1,
              -1,
              0,
              1,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
