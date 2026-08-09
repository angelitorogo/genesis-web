import {
  BodyLocator,
  CivilizationLocator,
  GalacticObjectLocator,
  GalaxyLocator,
  SectorLocator,
  SystemLocator,
} from '../../domain/generation/procedural-locator';

import {
  GalaxySectorCoordinates,
} from '../../domain/sector/galaxy-sector-coordinates';

import {
  GalaxySectorKeyCodec,
} from '../../domain/sector/galaxy-sector-key-codec';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  Sfc64Random,
} from '../random/sfc64-random';

import {
  SeedDeriver,
} from '../seed/seed-deriver';

import {
  V1_GOLDEN_VECTORS,
} from './v1-golden-vectors';

describe(
  'GENESIS official procedural vectors V1',
  () => {
    const root =
      UniverseSeed.parse(
        V1_GOLDEN_VECTORS
          .universeSeed,
      );

    it(
      'should preserve the official SFC64 stream',
      () => {
        const random =
          new Sfc64Random(
            root,
          );

        const actual =
          V1_GOLDEN_VECTORS
            .prngUint64Hex
            .map(
              () =>
                toUint64Hex(
                  random
                    .nextUint64(),
                ),
            );

        expect(
          actual,
        ).toEqual(
          V1_GOLDEN_VECTORS
            .prngUint64Hex,
        );
      },
    );

    it(
      'should preserve the official hierarchical seed branch',
      () => {
        const vector =
          V1_GOLDEN_VECTORS
            .canonicalBranch;

        const galaxy =
          SeedDeriver.galaxy(
            root,
            vector.galaxyIndex,
          );

        const sector =
          SeedDeriver.sector(
            galaxy,
            vector.sectorKey,
          );

        const galacticObject =
          SeedDeriver
            .galacticObject(
              sector,
              vector
                .galacticObjectIndex,
            );

        const system =
          SeedDeriver.system(
            galacticObject,
          );

        const body =
          SeedDeriver.body(
            system,
            vector.bodyIndex,
          );

        const history =
          SeedDeriver.history(
            body,
          );

        const evolution =
          SeedDeriver.evolution(
            history,
          );

        const civilization =
          SeedDeriver
            .civilization(
              evolution,
              vector
                .civilizationIndex,
            );

        expect({
          galaxy:
            galaxy.normalizedValue,

          sector:
            sector.normalizedValue,

          galacticObject:
            galacticObject
              .normalizedValue,

          system:
            system.normalizedValue,

          body:
            body.normalizedValue,

          history:
            history.normalizedValue,

          evolution:
            evolution
              .normalizedValue,

          civilization:
            civilization
              .normalizedValue,
        }).toEqual({
          galaxy:
            vector.galaxySeed,

          sector:
            vector.sectorSeed,

          galacticObject:
            vector
              .galacticObjectSeed,

          system:
            vector.systemSeed,

          body:
            vector.bodySeed,

          history:
            vector.historySeed,

          evolution:
            vector.evolutionSeed,

          civilization:
            vector
              .civilizationSeed,
        });
      },
    );

    it(
      'should preserve the official sector key codec vectors',
      () => {
        for (
          const vector
          of V1_GOLDEN_VECTORS
            .sectorKeyCodec
        ) {
          const coordinates =
            new GalaxySectorCoordinates(
              vector.x,
              vector.y,
            );

          expect(
            GalaxySectorKeyCodec
              .encode(
                coordinates,
              ),
          ).toBe(
            vector.sectorKey,
          );

          expect(
            GalaxySectorKeyCodec
              .decode(
                vector.sectorKey,
              ),
          ).toEqual(
            coordinates,
          );
        }
      },
    );

    it(
      'should preserve the official locator vectors',
      () => {
        const vectors =
          V1_GOLDEN_VECTORS
            .locators;

        expect(
          new GalaxyLocator(
            vectors
              .galaxy
              .galaxyIndex,
          ),
        ).toEqual(
          vectors.galaxy,
        );

        expect(
          new SectorLocator(
            vectors
              .sector
              .galaxyIndex,

            vectors
              .sector
              .sectorKey,
          ),
        ).toEqual(
          vectors.sector,
        );

        expect(
          new GalacticObjectLocator(
            vectors
              .galacticObject
              .galaxyIndex,

            vectors
              .galacticObject
              .sectorKey,

            vectors
              .galacticObject
              .galacticObjectIndex,
          ),
        ).toEqual(
          vectors
            .galacticObject,
        );

        expect(
          new SystemLocator(
            vectors
              .system
              .galaxyIndex,

            vectors
              .system
              .sectorKey,

            vectors
              .system
              .galacticObjectIndex,
          ),
        ).toEqual(
          vectors.system,
        );

        expect(
          new BodyLocator(
            vectors
              .body
              .galaxyIndex,

            vectors
              .body
              .sectorKey,

            vectors
              .body
              .galacticObjectIndex,

            vectors
              .body
              .bodyIndex,
          ),
        ).toEqual(
          vectors.body,
        );

        expect(
          new CivilizationLocator(
            vectors
              .civilization
              .galaxyIndex,

            vectors
              .civilization
              .sectorKey,

            vectors
              .civilization
              .galacticObjectIndex,

            vectors
              .civilization
              .bodyIndex,

            vectors
              .civilization
              .civilizationIndex,
          ),
        ).toEqual(
          vectors
            .civilization,
        );
      },
    );
  },
);

function toUint64Hex(
  value: bigint,
): string {
  return BigInt
    .asUintN(
      64,
      value,
    )
    .toString(
      16,
    )
    .toUpperCase()
    .padStart(
      16,
      '0',
    );
}