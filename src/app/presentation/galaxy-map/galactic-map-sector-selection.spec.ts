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
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  GalaxySectorGridGenerator,
} from '../../simulation/sector/galaxy-sector-grid-generator';

import {
  GalaxyGenerator,
} from '../../simulation/universe/galaxy-generator';

import {
  GalacticMapExplorationCoverage,
} from './galactic-map-exploration-coverage';

import {
  sectorCellSize,
} from './galactic-map-sector-overlay';

import {
  resolveGalacticMapSectorSelection,
} from './galactic-map-sector-selection';

describe(
  'resolveGalacticMapSectorSelection',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    const galaxy =
      GalaxyGenerator.generate(
        generationKey,
        0n,
      );

    const grid =
      GalaxySectorGridGenerator
        .generate(
          galaxy,
        );

    const coverage =
      new GalacticMapExplorationCoverage(
        generationKey,
        galaxy.index,
        grid,
        [
          new GalaxySectorCoordinates(
            0,
            0,
          ),
          new GalaxySectorCoordinates(
            3,
            -2,
          ),
        ],
      );

    const halo =
      1.25;

    it(
      'should resolve the cartographic origin to the canonical explored central sector',
      () => {
        const selection =
          resolveGalacticMapSectorSelection(
            coverage,
            halo,
            0,
            0,
          );

        expect(
          selection,
        ).not.toBeNull();

        expect(
          selection
            ?.coordinates,
        ).toEqual(
          new GalaxySectorCoordinates(
            0,
            0,
          ),
        );

        expect(
          selection
            ?.sectorKey,
        ).toBe(
          grid.sectorKeyFor(
            new GalaxySectorCoordinates(
              0,
              0,
            ),
          ),
        );

        expect(
          selection
            ?.explored,
        ).toBe(
          true,
        );
      },
    );

    it(
      'should resolve an unexplored local cell without materializing sector content',
      () => {
        const cell =
          sectorCellSize(
            coverage,
            halo,
          );

        const selection =
          resolveGalacticMapSectorSelection(
            coverage,
            halo,
            5 *
              cell,
            -4 *
              cell,
          );

        expect(
          selection
            ?.coordinates,
        ).toEqual(
          new GalaxySectorCoordinates(
            5,
            -4,
          ),
        );

        expect(
          selection
            ?.explored,
        ).toBe(
          false,
        );
      },
    );

    it(
      'should preserve persisted explored coverage for non-central sectors',
      () => {
        const cell =
          sectorCellSize(
            coverage,
            halo,
          );

        expect(
          resolveGalacticMapSectorSelection(
            coverage,
            halo,
            3 *
              cell,
            -2 *
              cell,
          )
            ?.explored,
        ).toBe(
          true,
        );
      },
    );

    it(
      'should reject local points outside the active sector grid projection',
      () => {
        expect(
          resolveGalacticMapSectorSelection(
            coverage,
            halo,
            halo +
              0.01,
            0,
          ),
        ).toBeNull();

        expect(
          resolveGalacticMapSectorSelection(
            coverage,
            halo,
            0,
            -halo -
              0.01,
          ),
        ).toBeNull();
      },
    );

    it(
      'should normalize negative zero sector coordinates',
      () => {
        const selection =
          resolveGalacticMapSectorSelection(
            coverage,
            halo,
            -Number.EPSILON,
            -Number.EPSILON,
          );

        expect(
          Object.is(
            selection
              ?.coordinates
              .x,
            -0,
          ),
        ).toBe(
          false,
        );

        expect(
          Object.is(
            selection
              ?.coordinates
              .y,
            -0,
          ),
        ).toBe(
          false,
        );
      },
    );
  },
);
