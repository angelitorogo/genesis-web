import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  SectorLocator,
} from '../../domain/generation/procedural-locator';

import {
  UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  GalaxySectorGrid,
} from '../../domain/sector/galaxy-sector-grid';

import {
  SectorSeed,
} from '../../domain/seed/hierarchical-seeds';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  ProceduralTargetResolver,
} from '../regeneration/procedural-target-resolver';

import {
  SectorSeedResolver,
} from './sector-seed-resolver';

describe(
  'SectorSeedResolver',
  () => {
    const seedA =
      UniverseSeed.parse(
        '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
      );

    const keyA =
      new UniverseGenerationKey(
        seedA,
        GeneratorVersion.V1,
      );

    const seedB =
      UniverseSeed.parse(
        '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B2',
      );

    const keyB =
      new UniverseGenerationKey(
        seedB,
        GeneratorVersion.V1,
      );

    it(
      'should preserve the canonical Android V1 SectorSeed vector',
      () => {
        const locator =
          new SectorLocator(
            0n,
            123456789n,
          );

        const sectorSeed =
          SectorSeedResolver
            .resolve(
              keyA,
              locator,
            );

        expect(
          sectorSeed,
        ).toBeInstanceOf(
          SectorSeed,
        );

        expect(
          sectorSeed
            .normalizedValue,
        ).toBe(
          '02DF63D582A1F3E9BFB71AA643FDBB92',
        );
      },
    );

    it(
      'should resolve grid coordinates to the same seed as their canonical locator',
      () => {
        const grid =
          new GalaxySectorGrid(
            keyA,
            0n,
            1000,
            100,
          );

        const coordinates = {
          x:
            12,

          y:
            -34,
        };

        const locator =
          grid.locatorFor(
            coordinates,
          );

        const seedFromGrid =
          SectorSeedResolver
            .resolveFromGrid(
              grid,
              coordinates,
            );

        const seedFromLocator =
          SectorSeedResolver
            .resolve(
              keyA,
              locator,
            );

        expect(
          seedFromGrid,
        ).toEqual(
          seedFromLocator,
        );

        expect(
          seedFromGrid
            .normalizedValue,
        ).toBe(
          seedFromLocator
            .normalizedValue,
        );
      },
    );

    it(
      'should always reproduce the same seed for the same sector identity',
      () => {
        const locator =
          new SectorLocator(
            0n,
            123456789n,
          );

        const first =
          SectorSeedResolver
            .resolve(
              keyA,
              locator,
            );

        const second =
          SectorSeedResolver
            .resolve(
              keyA,
              locator,
            );

        const third =
          SectorSeedResolver
            .resolve(
              keyA,
              locator,
            );

        expect(
          second,
        ).toEqual(
          first,
        );

        expect(
          third,
        ).toEqual(
          first,
        );

        expect(
          third.normalizedValue,
        ).toBe(
          '02DF63D582A1F3E9BFB71AA643FDBB92',
        );
      },
    );

    it(
      'should remain independent of interleaved sector resolution order',
      () => {
        const locatorA =
          new SectorLocator(
            0n,
            100n,
          );

        const locatorB =
          new SectorLocator(
            0n,
            200n,
          );

        const a1 =
          SectorSeedResolver
            .resolve(
              keyA,
              locatorA,
            );

        const b1 =
          SectorSeedResolver
            .resolve(
              keyA,
              locatorB,
            );

        const b2 =
          SectorSeedResolver
            .resolve(
              keyA,
              locatorB,
            );

        const a2 =
          SectorSeedResolver
            .resolve(
              keyA,
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
      'should produce different SectorSeeds for different coordinates',
      () => {
        const grid =
          new GalaxySectorGrid(
            keyA,
            0n,
            1000,
            100,
          );

        const first =
          SectorSeedResolver
            .resolveFromGrid(
              grid,
              {
                x:
                  12,

                y:
                  -34,
              },
            );

        const second =
          SectorSeedResolver
            .resolveFromGrid(
              grid,
              {
                x:
                  12,

                y:
                  -33,
              },
            );

        expect(
          second
            .normalizedValue,
        ).not.toBe(
          first
            .normalizedValue,
        );
      },
    );

    it(
      'should produce different SectorSeeds for the same sector key in different galaxies',
      () => {
        const first =
          SectorSeedResolver
            .resolve(
              keyA,
              new SectorLocator(
                0n,
                123456789n,
              ),
            );

        const second =
          SectorSeedResolver
            .resolve(
              keyA,
              new SectorLocator(
                1n,
                123456789n,
              ),
            );

        expect(
          second
            .normalizedValue,
        ).not.toBe(
          first
            .normalizedValue,
        );
      },
    );

    it(
      'should produce different SectorSeeds for the same locator in different universes',
      () => {
        const locator =
          new SectorLocator(
            0n,
            123456789n,
          );

        const first =
          SectorSeedResolver
            .resolve(
              keyA,
              locator,
            );

        const second =
          SectorSeedResolver
            .resolve(
              keyB,
              locator,
            );

        expect(
          second
            .normalizedValue,
        ).not.toBe(
          first
            .normalizedValue,
        );
      },
    );

    it(
      'should reject grid coordinates outside the galaxy sector grid',
      () => {
        const grid =
          new GalaxySectorGrid(
            keyA,
            0n,
            1000,
            100,
          );

        expect(
          () =>
            SectorSeedResolver
              .resolveFromGrid(
                grid,
                {
                  x:
                    101,

                  y:
                    0,
                },
              ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should resolve exactly the same SectorSeed value as ProceduralTargetResolver',
      () => {
        const locator =
          new SectorLocator(
            0n,
            123456789n,
          );

        const sectorSeed =
          SectorSeedResolver
            .resolve(
              keyA,
              locator,
            );

        const proceduralSeed =
          ProceduralTargetResolver
            .resolveTargetSeed(
              keyA,
              locator,
            );

        expect(
          sectorSeed,
        ).toEqual(
          proceduralSeed,
        );

        expect(
          sectorSeed
            .normalizedValue,
        ).toBe(
          proceduralSeed
            .normalizedValue,
        );

        expect(
          sectorSeed
            .normalizedValue,
        ).toBe(
          '02DF63D582A1F3E9BFB71AA643FDBB92',
        );
      },
    );
  },
);