import {
  GalacticMapLodLevel,
} from '../../galaxy-map/galactic-map-lod-policy';

import {
  type GalacticMapParticleLayout,
} from '../../galaxy-map/galactic-map-particle-layout';

import {
  createGalacticMapWorkerParticleSession,
  galacticMapWorkerParticleBatchTransferables,
  materializeGalacticMapWorkerFullLayout,
  type GalacticMapWorkerParticleWindow,
} from './galactic-map-particle-worker-session';

describe(
  'GalacticMapParticleWorkerSession',
  () => {
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
    ): GalacticMapWorkerParticleWindow {

      return Object.freeze({
        active:
          Object.freeze({
            minX,
            maxX,
            minY,
            maxY,
          }),
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
        lodLevel:
          GalacticMapLodLevel.DETAIL,
        signature:
          `DETAIL:${minX}:${maxX}:${minY}:${maxY}`,
      });
    }

    it(
      'should keep the complete source layout in the worker and materialize only one active sector',
      () => {
        const session =
          createGalacticMapWorkerParticleSession(
            layout,
            {
              cellSize:
                2 / 3,
              minCoordinate:
                -1,
              maxCoordinate:
                1,
            },
          );

        expect(
          session.sourceParticleCount,
        ).toBe(
          5,
        );

        expect(
          session.indexedSectorCount,
        ).toBe(
          5,
        );

        const batch =
          session.materialize(
            window(
              0,
              0,
              0,
              0,
            ),
          );

        expect(
          batch.count,
        ).toBe(
          1,
        );

        expect(
          Array.from(
            batch.sourceIndices,
          ),
        ).toEqual([
          1,
        ]);

        expect(
          Array.from(
            batch.sizes,
          ),
        ).toEqual([
          2,
        ]);
      },
    );

    it(
      'should cache source-index selections without reusing transferable result buffers',
      () => {
        const session =
          createGalacticMapWorkerParticleSession(
            layout,
            {
              cellSize:
                2 / 3,
              minCoordinate:
                -1,
              maxCoordinate:
                1,
            },
          );

        const target =
          window(
            -1,
            1,
            -1,
            1,
          );

        const first =
          session.materialize(
            target,
          );

        const second =
          session.materialize(
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
          second.sourceIndices,
        ).not.toBe(
          first.sourceIndices,
        );

        expect(
          Array.from(
            second.sourceIndices,
          ),
        ).toEqual(
          Array.from(
            first.sourceIndices,
          ),
        );
      },
    );

    it(
      'should expose exactly the five transferable ArrayBuffers used by one GPU batch',
      () => {
        const batch =
          materializeGalacticMapWorkerFullLayout(
            layout,
          );

        const transferables =
          galacticMapWorkerParticleBatchTransferables(
            batch,
          );

        expect(
          transferables,
        ).toHaveLength(
          5,
        );

        expect(
          transferables,
        ).toEqual([
          batch.positions.buffer,
          batch.colors.buffer,
          batch.sizes.buffer,
          batch.opacities.buffer,
          batch.sourceIndices.buffer,
        ]);
      },
    );

    it(
      'should preserve a complete renderer-only layout when no sector grid is available',
      () => {
        const batch =
          materializeGalacticMapWorkerFullLayout(
            layout,
          );

        expect(
          batch.count,
        ).toBe(
          5,
        );

        expect(
          Array.from(
            batch.sourceIndices,
          ),
        ).toEqual([
          0,
          1,
          2,
          3,
          4,
        ]);
      },
    );
  },
);
