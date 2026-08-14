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

describe(
  'GalacticMapExplorationCoverage',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    function grid(
      galaxyIndex =
        0n,
    ): GalaxySectorGrid {

      return new GalaxySectorGrid(
        generationKey,
        galaxyIndex,
        1000,
        2,
      );
    }

    it(
      'should expose a deterministic binary coverage snapshot without materializing sector content',
      () => {
        const coverage =
          new GalacticMapExplorationCoverage(
            generationKey,
            0n,
            grid(),
            [
              new GalaxySectorCoordinates(
                1,
                -1,
              ),
              new GalaxySectorCoordinates(
                0,
                0,
              ),
            ],
          );

        expect(
          coverage.exploredSectors,
        ).toEqual([
          new GalaxySectorCoordinates(
            0,
            0,
          ),
          new GalaxySectorCoordinates(
            1,
            -1,
          ),
        ]);

        expect(
          coverage.exploredSectorCount,
        ).toBe(
          2,
        );

        expect(
          coverage.totalSectorCount,
        ).toBe(
          25n,
        );
      },
    );

    it(
      'should support an entirely unexplored grid while preserving its conceptual sector count',
      () => {
        const coverage =
          new GalacticMapExplorationCoverage(
            generationKey,
            0n,
            grid(),
            [],
          );

        expect(
          coverage.exploredSectorCount,
        ).toBe(
          0,
        );

        expect(
          coverage.totalSectorCount,
        ).toBe(
          25n,
        );
      },
    );

    it(
      'should reject duplicate or out-of-grid explored coordinates',
      () => {
        expect(
          () =>
            new GalacticMapExplorationCoverage(
              generationKey,
              0n,
              grid(),
              [
                new GalaxySectorCoordinates(
                  0,
                  0,
                ),
                new GalaxySectorCoordinates(
                  0,
                  0,
                ),
              ],
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new GalacticMapExplorationCoverage(
              generationKey,
              0n,
              grid(),
              [
                new GalaxySectorCoordinates(
                  3,
                  0,
                ),
              ],
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject a grid from another galaxy or generation key',
      () => {
        expect(
          () =>
            new GalacticMapExplorationCoverage(
              generationKey,
              0n,
              grid(
                1n,
              ),
              [],
            ),
        ).toThrow(
          RangeError,
        );

        const otherGenerationKey =
          new UniverseGenerationKey(
            UniverseSeed.parse(
              '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B2',
            ),
            GeneratorVersion.V1,
          );

        const foreignGrid =
          new GalaxySectorGrid(
            otherGenerationKey,
            0n,
            1000,
            2,
          );

        expect(
          () =>
            new GalacticMapExplorationCoverage(
              generationKey,
              0n,
              foreignGrid,
              [],
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
