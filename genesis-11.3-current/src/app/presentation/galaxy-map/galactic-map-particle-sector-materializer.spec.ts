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
  createGalacticMapParticleSectorMaterializer,
  particleRetainedForLod,
} from './galactic-map-particle-sector-materializer';

import {
  type GalacticMapParticleLayout,
} from './galactic-map-particle-layout';

import {
  GalacticMapLodLevel,
  type GalacticMapVisibleSectorWindow,
} from './galactic-map-visible-sector-lod';

describe(
  'GalacticMapParticleSectorMaterializer',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    const coverage =
      new GalacticMapExplorationCoverage(
        generationKey,
        0n,
        new GalaxySectorGrid(
          generationKey,
          0n,
          1000,
          1,
        ),
        [],
      );

    const layout:
      GalacticMapParticleLayout =
      Object.freeze({
        positions:
          new Float32Array([
            -0.66, 0, 0,
            0, 0, 0,
            0.66, 0, 0,
            0, 0.66, 0,
            0, -0.66, 0,
          ]),
        colors:
          new Float32Array([
            1, 0, 0,
            0, 1, 0,
            0, 0, 1,
            1, 1, 0,
            1, 0, 1,
          ]),
        sizes:
          new Float32Array([
            1,
            2,
            3,
            4,
            5,
          ]),
        opacities:
          new Float32Array([
            0.1,
            0.2,
            0.3,
            0.4,
            0.5,
          ]),
        count:
          5,
      });

    function window(
      minX:
        number,

      maxX:
        number,

      minY:
        number,

      maxY:
        number,

      lodLevel =
        GalacticMapLodLevel.DETAIL,
    ): GalacticMapVisibleSectorWindow {

      const active =
        Object.freeze({
          minX,
          maxX,
          minY,
          maxY,
        });

      return Object.freeze({
        visible:
          active,
        active,
        visibleSectorCount:
          (
            maxX -
              minX +
            1
          ) *
          (
            maxY -
              minY +
            1
          ),
        activeSectorCount:
          (
            maxX -
              minX +
            1
          ) *
          (
            maxY -
              minY +
            1
          ),
        prefetchMarginSectors:
          0,
        lodLevel,
        particleRetentionRatio:
          lodLevel ===
            GalacticMapLodLevel.DETAIL
            ? 1
            : lodLevel ===
                GalacticMapLodLevel.BALANCED
              ? 0.96
              : 0.88,
        signature:
          `${lodLevel}:${minX}:${maxX}:${minY}:${maxY}`,
      });
    }

    it(
      'should index renderer-only samples by sector and materialize only the requested active window',
      () => {
        const materializer =
          createGalacticMapParticleSectorMaterializer(
            layout,
            coverage,
            1,
          );

        expect(
          materializer.sourceParticleCount,
        ).toBe(
          5,
        );

        expect(
          materializer.indexedSectorCount,
        ).toBe(
          5,
        );

        const centerOnly =
          materializer.materialize(
            window(
              0,
              0,
              0,
              0,
            ),
          );

        expect(
          centerOnly.count,
        ).toBe(
          1,
        );

        expect(
          Array.from(
            centerOnly.sourceIndices,
          ),
        ).toEqual([
          1,
        ]);

        expect(
          Array.from(
            centerOnly.sizes,
          ),
        ).toEqual([
          2,
        ]);
      },
    );

    it(
      'should preserve original source sample identities after compacting visible GPU buffers',
      () => {
        const materializer =
          createGalacticMapParticleSectorMaterializer(
            layout,
            coverage,
            1,
          );

        const right =
          materializer.materialize(
            window(
              1,
              1,
              0,
              0,
            ),
          );

        expect(
          Array.from(
            right.sourceIndices,
          ),
        ).toEqual([
          2,
        ]);

        expect(
          Array.from(
            right.colors,
          ),
        ).toEqual([
          0,
          0,
          1,
        ]);
      },
    );

    it(
      'should use deterministic LOD thinning while DETAIL retains every sample',
      () => {
        for (
          let index =
            0;
          index <
            128;
          index +=
            1
        ) {
          expect(
            particleRetainedForLod(
              index,
              GalacticMapLodLevel.DETAIL,
            ),
          ).toBe(
            true,
          );
        }

        const overviewCount =
          Array.from({
            length:
              1000,
          }, (
            _,
            index,
          ) =>
            particleRetainedForLod(
              index,
              GalacticMapLodLevel.OVERVIEW,
            ))
            .filter(
              Boolean,
            )
            .length;

        const balancedCount =
          Array.from({
            length:
              1000,
          }, (
            _,
            index,
          ) =>
            particleRetainedForLod(
              index,
              GalacticMapLodLevel.BALANCED,
            ))
            .filter(
              Boolean,
            )
            .length;

        expect(
          overviewCount,
        ).toBeLessThan(
          balancedCount,
        );

        expect(
          balancedCount,
        ).toBeLessThan(
          1000,
        );
      },
    );

    it(
      'should cache recently materialized windows without changing deterministic buffers',
      () => {
        const materializer =
          createGalacticMapParticleSectorMaterializer(
            layout,
            coverage,
            1,
          );

        const target =
          window(
            -1,
            1,
            -1,
            1,
          );

        const first =
          materializer.materialize(
            target,
          );

        const second =
          materializer.materialize(
            target,
          );

        expect(
          first.cacheHit,
        ).toBe(
          false,
        );

        expect(
          second.cacheHit,
        ).toBe(
          true,
        );

        expect(
          second.positions,
        ).toBe(
          first.positions,
        );

        expect(
          materializer.cacheEntryCount,
        ).toBe(
          1,
        );

        materializer.clearCache();

        expect(
          materializer.cacheEntryCount,
        ).toBe(
          0,
        );
      },
    );

    it(
      'should reject malformed source layouts and invalid source indices',
      () => {
        expect(
          () =>
            createGalacticMapParticleSectorMaterializer(
              {
                ...layout,
                count:
                  6,
              },
              coverage,
              1,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            particleRetainedForLod(
              -1,
              GalacticMapLodLevel.DETAIL,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
