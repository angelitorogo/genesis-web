import * as THREE from 'three';

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
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  GalacticMapExplorationCoverage,
} from './galactic-map-exploration-coverage';

import {
  createGalacticMapSectorOverlay,
  sectorCellSize,
  sectorLocalPosition,
} from './galactic-map-sector-overlay';

describe(
  'GalacticMapSectorOverlay',
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
          new GalaxySectorCoordinates(
            2,
            -2,
          ),
        ],
      );

    it(
      'should map the conceptual grid exactly across the renderer halo diameter',
      () => {
        expect(
          sectorCellSize(
            coverage,
            1,
          ),
        ).toBeCloseTo(
          0.4,
          12,
        );

        expect(
          sectorLocalPosition(
            coverage,
            new GalaxySectorCoordinates(
              0,
              0,
            ),
            1,
          ),
        ).toEqual({
          x:
            0,
          y:
            0,
        });

        expect(
          sectorLocalPosition(
            coverage,
            new GalaxySectorCoordinates(
              2,
              -2,
            ),
            1,
          ),
        ).toEqual({
          x:
            0.8,
          y:
            -0.8,
        });
      },
    );

    it(
      'should build one lightweight unexplored grid and one instanced explored-sector fill mesh',
      () => {
        const overlay =
          createGalacticMapSectorOverlay(
            coverage,
            1,
          );

        expect(
          overlay
            .object3d
            .getObjectByName(
              'galactic-map-unexplored-grid',
            ),
        ).toBeTruthy();

        const fill =
          overlay
            .object3d
            .getObjectByName(
              'galactic-map-explored-sector-fill',
            );

        expect(
          fill,
        ).toBeInstanceOf(
          THREE.InstancedMesh,
        );

        expect(
          (
            fill as
              THREE.InstancedMesh
          ).count,
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
      'should omit explored instancing for a completely unexplored grid',
      () => {
        const emptyCoverage =
          new GalacticMapExplorationCoverage(
            generationKey,
            0n,
            grid,
            [],
          );

        const overlay =
          createGalacticMapSectorOverlay(
            emptyCoverage,
            1,
          );

        expect(
          overlay
            .object3d
            .getObjectByName(
              'galactic-map-explored-sector-fill',
            ),
        ).toBeUndefined();

        overlay.dispose();
      },
    );

    it(
      'should reject invalid renderer radius or out-of-grid coordinate mapping',
      () => {
        expect(
          () =>
            sectorCellSize(
              coverage,
              0,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            sectorLocalPosition(
              coverage,
              new GalaxySectorCoordinates(
                3,
                0,
              ),
              1,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
