import {
  GalacticObjectLocator,
  SectorLocator,
  SystemLocator,
} from '../../domain/generation/procedural-locator';

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
  GalaxySectorKeyCodec,
} from '../../domain/sector/galaxy-sector-key-codec';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  GalaxySectorObjectLocationResolver,
} from './galaxy-sector-object-location-resolver';

describe(
  'GalaxySectorObjectLocationResolver',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    const canonicalSectorKey =
      123456789n;

    it(
      'should preserve the official Android V1 SystemLocator placement vector',
      () => {
        const locator =
          new SystemLocator(
            0n,
            canonicalSectorKey,
            7n,
          );

        const location =
          GalaxySectorObjectLocationResolver
            .resolve(
              generationKey,
              locator,
            );

        expect(
          location.sectorCoordinates,
        ).toEqual({
          x:
            0,

          y:
            123456789,
        });

        expect(
          location.normalizedX,
        ).toBe(
          0.7908343088347465,
        );

        expect(
          location.normalizedY,
        ).toBe(
          0.1713639555964619,
        );
      },
    );

    it(
      'should preserve the official Android V1 GalacticObjectLocator placement vector',
      () => {
        const locator =
          new GalacticObjectLocator(
            0n,
            canonicalSectorKey,
            7n,
          );

        const location =
          GalaxySectorObjectLocationResolver
            .resolve(
              generationKey,
              locator,
            );

        expect(
          location.sectorCoordinates,
        ).toEqual({
          x:
            0,

          y:
            123456789,
        });

        expect(
          location.normalizedX,
        ).toBe(
          0.300271924585104,
        );

        expect(
            location.normalizedY,
            ).toBe(
            0.19755980977788568,
            );
      },
    );

    it(
      'should always regenerate the same location for the same SystemLocator',
      () => {
        const locator =
          new SystemLocator(
            0n,
            canonicalSectorKey,
            7n,
          );

        const expected =
          GalaxySectorObjectLocationResolver
            .resolve(
              generationKey,
              locator,
            );

        for (
          let index = 0;
          index < 100;
          index += 1
        ) {
          expect(
            GalaxySectorObjectLocationResolver
              .resolve(
                generationKey,
                locator,
              ),
          ).toEqual(
            expected,
          );
        }
      },
    );

    it(
      'should distinguish SystemLocator and GalacticObjectLocator at the same index',
      () => {
        const systemLocation =
          GalaxySectorObjectLocationResolver
            .resolve(
              generationKey,
              new SystemLocator(
                0n,
                canonicalSectorKey,
                7n,
              ),
            );

        const objectLocation =
          GalaxySectorObjectLocationResolver
            .resolve(
              generationKey,
              new GalacticObjectLocator(
                0n,
                canonicalSectorKey,
                7n,
              ),
            );

        expect(
          [
            systemLocation
              .normalizedX,

            systemLocation
              .normalizedY,
          ],
        ).not.toEqual([
          objectLocation
            .normalizedX,

          objectLocation
            .normalizedY,
        ]);
      },
    );

    it(
      'should produce different local positions for different object indices',
      () => {
        const first =
          GalaxySectorObjectLocationResolver
            .resolve(
              generationKey,
              new SystemLocator(
                0n,
                canonicalSectorKey,
                7n,
              ),
            );

        const second =
          GalaxySectorObjectLocationResolver
            .resolve(
              generationKey,
              new SystemLocator(
                0n,
                canonicalSectorKey,
                8n,
              ),
            );

        expect(
          [
            first.normalizedX,
            first.normalizedY,
          ],
        ).not.toEqual([
          second.normalizedX,
          second.normalizedY,
        ]);
      },
    );

    it(
      'should produce different locations for different sectors',
      () => {
        const first =
          GalaxySectorObjectLocationResolver
            .resolve(
              generationKey,
              new SystemLocator(
                0n,
                GalaxySectorKeyCodec
                  .encode({
                    x:
                      12,

                    y:
                      -34,
                  }),
                7n,
              ),
            );

        const second =
          GalaxySectorObjectLocationResolver
            .resolve(
              generationKey,
              new SystemLocator(
                0n,
                GalaxySectorKeyCodec
                  .encode({
                    x:
                      13,

                    y:
                      -34,
                  }),
                7n,
              ),
            );

        expect(
          first.sectorCoordinates,
        ).not.toEqual(
          second.sectorCoordinates,
        );

        expect(
          [
            first.normalizedX,
            first.normalizedY,
          ],
        ).not.toEqual([
          second.normalizedX,
          second.normalizedY,
        ]);
      },
    );

    it(
      'should isolate identical locators across different universes',
      () => {
        const otherGenerationKey =
          new UniverseGenerationKey(
            UniverseSeed.parse(
              '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B2',
            ),
            GeneratorVersion.V1,
          );

        const locator =
          new SystemLocator(
            0n,
            canonicalSectorKey,
            7n,
          );

        const first =
          GalaxySectorObjectLocationResolver
            .resolve(
              generationKey,
              locator,
            );

        const second =
          GalaxySectorObjectLocationResolver
            .resolve(
              otherGenerationKey,
              locator,
            );

        expect(
          first.sectorCoordinates,
        ).toEqual(
          second.sectorCoordinates,
        );

        expect(
          [
            first.normalizedX,
            first.normalizedY,
          ],
        ).not.toEqual([
          second.normalizedX,
          second.normalizedY,
        ]);
      },
    );

    it(
      'should be independent from interleaved resolution order',
      () => {
        const locatorA =
          new SystemLocator(
            0n,
            canonicalSectorKey,
            7n,
          );

        const locatorB =
          new GalacticObjectLocator(
            0n,
            canonicalSectorKey,
            11n,
          );

        const a1 =
          GalaxySectorObjectLocationResolver
            .resolve(
              generationKey,
              locatorA,
            );

        const b1 =
          GalaxySectorObjectLocationResolver
            .resolve(
              generationKey,
              locatorB,
            );

        const b2 =
          GalaxySectorObjectLocationResolver
            .resolve(
              generationKey,
              locatorB,
            );

        const a2 =
          GalaxySectorObjectLocationResolver
            .resolve(
              generationKey,
              locatorA,
            );

        expect(
          a2,
        ).toEqual(
          a1,
        );

        expect(
          b2,
        ).toEqual(
          b1,
        );
      },
    );

    it(
      'should preserve reversible sector navigation around the resolved object',
      () => {
        const grid =
          new GalaxySectorGrid(
            generationKey,
            7n,
            1000,
            100,
          );

        const coordinates =
          {
            x:
              12,

            y:
              -34,
          };

        const sectorLocator =
          grid.locatorFor(
            coordinates,
          );

        const objectLocator =
          new SystemLocator(
            sectorLocator
              .galaxyIndex,

            sectorLocator
              .sectorKey,

            5n,
          );

        const location =
          GalaxySectorObjectLocationResolver
            .resolve(
              generationKey,
              objectLocator,
            );

        expect(
          location.sectorCoordinates,
        ).toEqual(
          coordinates,
        );

        expect(
          grid.coordinatesFor(
            objectLocator
              .sectorKey,
          ),
        ).toEqual(
          location
            .sectorCoordinates,
        );

        const reconstructedSectorLocator =
          grid.locatorFor(
            location
              .sectorCoordinates,
          );

        expect(
          reconstructedSectorLocator
            .galaxyIndex,
        ).toBe(
          objectLocator
            .galaxyIndex,
        );

        expect(
          reconstructedSectorLocator
            .sectorKey,
        ).toBe(
          objectLocator
            .sectorKey,
        );
      },
    );

    it(
      'should preserve signed Long sector keys while resolving their exact coordinates',
      () => {
        const locator =
          new SystemLocator(
            0n,
            -(1n << 63n),
            0n,
          );

        const location =
          GalaxySectorObjectLocationResolver
            .resolve(
              generationKey,
              locator,
            );

        expect(
          location.sectorCoordinates,
        ).toEqual({
          x:
            -2147483648,

          y:
            0,
        });

        expect(
          location.normalizedX,
        ).toBeGreaterThanOrEqual(
          0,
        );

        expect(
          location.normalizedX,
        ).toBeLessThan(
          1,
        );

        expect(
          location.normalizedY,
        ).toBeGreaterThanOrEqual(
          0,
        );

        expect(
          location.normalizedY,
        ).toBeLessThan(
          1,
        );
      },
    );

    it(
      'should reject unsupported runtime locators',
      () => {
        const unsupported =
          new SectorLocator(
            0n,
            canonicalSectorKey,
          ) as unknown as
            SystemLocator;

        expect(
          () =>
            GalaxySectorObjectLocationResolver
              .resolve(
                generationKey,
                unsupported,
              ),
        ).toThrow(
          TypeError,
        );
      },
    );
  },
);