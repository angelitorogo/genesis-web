import {
  GeneratorVersion,
} from '../generation/generator-version';

import {
  SectorLocator,
} from '../generation/procedural-locator';

import {
  UniverseGenerationKey,
} from '../generation/universe-generation-key';

import {
  UniverseSeed,
} from '../universe/universe-seed';

import {
  type GalaxySectorCoordinates,
} from './galaxy-sector-coordinates';

import {
  GalaxySectorKeyCodec,
} from './galaxy-sector-key-codec';

import {
  GalaxySectorGrid,
} from './galaxy-sector-grid';

describe(
  'GalaxySectorGrid',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    it(
      'should preserve identity, geometry and symmetric coordinate bounds',
      () => {
        const grid =
          new GalaxySectorGrid(
            generationKey,
            7n,
            1000,
            86,
          );

        expect(
          grid.generationKey,
        ).toBe(
          generationKey,
        );

        expect(
          grid.galaxyIndex,
        ).toBe(
          7n,
        );

        expect(
          grid
            .sectorSizeLightYears,
        ).toBe(
          1000,
        );

        expect(
          grid
            .halfExtentInSectors,
        ).toBe(
          86,
        );

        expect(
          grid.minCoordinate,
        ).toBe(
          -86,
        );

        expect(
          grid.maxCoordinate,
        ).toBe(
          86,
        );

        expect(
          grid
            .sideLengthInSectors,
        ).toBe(
          173n,
        );
      },
    );

    it(
      'should include the center and boundaries while rejecting coordinates outside the grid',
      () => {
        const grid =
          new GalaxySectorGrid(
            generationKey,
            0n,
            1000,
            86,
          );

        expect(
          grid.contains({
            x:
              0,

            y:
              0,
          }),
        ).toBe(
          true,
        );

        expect(
          grid.contains({
            x:
              -86,

            y:
              -86,
          }),
        ).toBe(
          true,
        );

        expect(
          grid.contains({
            x:
              86,

            y:
              86,
          }),
        ).toBe(
          true,
        );

        expect(
          grid.contains({
            x:
              87,

            y:
              0,
          }),
        ).toBe(
          false,
        );

        expect(
          grid.contains({
            x:
              0,

            y:
              -87,
          }),
        ).toBe(
          false,
        );
      },
    );

    it(
      'should convert coordinates to the canonical sector key and SectorLocator',
      () => {
        const grid =
          new GalaxySectorGrid(
            generationKey,
            7n,
            1000,
            100,
          );

        const coordinates:
          GalaxySectorCoordinates = {
            x:
              12,

            y:
              -34,
          };

        const expectedSectorKey =
          GalaxySectorKeyCodec
            .encode(
              coordinates,
            );

        expect(
          grid.sectorKeyFor(
            coordinates,
          ),
        ).toBe(
          expectedSectorKey,
        );

        expect(
          expectedSectorKey,
        ).toBe(
          55834574814n,
        );

        expect(
          grid.locatorFor(
            coordinates,
          ),
        ).toEqual(
          new SectorLocator(
            7n,
            expectedSectorKey,
          ),
        );
      },
    );

    it(
      'should convert sector keys back to their exact coordinates and reject keys outside the grid',
      () => {
        const grid =
          new GalaxySectorGrid(
            generationKey,
            0n,
            1000,
            100,
          );

        const coordinates:
          GalaxySectorCoordinates = {
            x:
              12,

            y:
              -34,
          };

        const sectorKey =
          GalaxySectorKeyCodec
            .encode(
              coordinates,
            );

        expect(
          grid.coordinatesFor(
            sectorKey,
          ),
        ).toEqual(
          coordinates,
        );

        const outsideSectorKey =
          GalaxySectorKeyCodec
            .encode({
              x:
                101,

              y:
                0,
            });

        expect(
          () =>
            grid.coordinatesFor(
              outsideSectorKey,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            grid.sectorKeyFor({
              x:
                101,

              y:
                0,
            }),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject invalid grid geometry and indices',
      () => {
        expect(
          () =>
            new GalaxySectorGrid(
              generationKey,
              -1n,
              1000,
              1,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new GalaxySectorGrid(
              generationKey,
              9223372036854775808n,
              1000,
              1,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new GalaxySectorGrid(
              generationKey,
              0n,
              0,
              1,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new GalaxySectorGrid(
              generationKey,
              0n,
              Number.NaN,
              1,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new GalaxySectorGrid(
              generationKey,
              0n,
              1000,
              -1,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new GalaxySectorGrid(
              generationKey,
              0n,
              1000,
              1.5,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new GalaxySectorGrid(
              generationKey,
              0n,
              1000,
              2147483648,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);