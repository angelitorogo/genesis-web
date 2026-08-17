import {
  type GalacticMapExplorationCoverage,
} from './galactic-map-exploration-coverage';

import {
  type GalacticMapParticleLayout,
} from './galactic-map-particle-layout';

import {
  galacticMapParticleSectorIndexConfig,
} from './galactic-map-particle-sector-index-config';

import {
  type GalacticMapVisibleSectorWindow,
} from './galactic-map-visible-sector-lod';

import {
  particleRetainedForLod,
} from './galactic-map-particle-lod-retention';

export {
  particleRetainedForLod,
} from './galactic-map-particle-lod-retention';

const MAX_CACHED_WINDOWS =
  3;

export interface GalacticMapMaterializedParticleLayout {
  readonly positions:
    Float32Array;

  readonly colors:
    Float32Array;

  readonly sizes:
    Float32Array;

  readonly opacities:
    Float32Array;

  readonly sourceIndices:
    Uint32Array;

  readonly count:
    number;

  readonly sourceCount:
    number;

  readonly sourceSectorCount:
    number;

  readonly cacheHit:
    boolean;
}

export interface GalacticMapParticleSectorMaterializer {
  readonly sourceParticleCount:
    number;

  readonly indexedSectorCount:
    number;

  readonly cacheEntryCount:
    number;

  materialize(
    window:
      GalacticMapVisibleSectorWindow,
  ): GalacticMapMaterializedParticleLayout;

  clearCache():
    void;
}

/**
 * Point-10.8 spatial index for renderer-only particle samples.
 *
 * The approved 10.1 deterministic visual layout is generated once and indexed
 * by the canonical sector grid. Only samples belonging to the current active
 * sector window are copied into WebGL buffers. This deliberately does not
 * enumerate or generate physical sector contents, systems, bodies or Ground
 * Truth. From point 10.9 production rendering performs the equivalent heavy
 * layout/index/materialization work in the procedural Web Worker; this
 * synchronous implementation remains the frozen 10.8 reference contract and
 * deterministic parity oracle for tests.
 */
export function createGalacticMapParticleSectorMaterializer(
  source:
    GalacticMapParticleLayout,

  coverage:
    GalacticMapExplorationCoverage,

  haloOuterRadiusNormalized:
    number,
): GalacticMapParticleSectorMaterializer {

  assertLayout(
    source,
  );

  const indexConfig =
    galacticMapParticleSectorIndexConfig(
      coverage,
      haloOuterRadiusNormalized,
    );

  const cellSize =
    indexConfig.cellSize;

  const minCoordinate =
    indexConfig.minCoordinate;

  const maxCoordinate =
    indexConfig.maxCoordinate;

  const mutableBuckets =
    new Map<string, number[]>();

  for (
    let sourceIndex =
      0;
    sourceIndex <
      source.count;
    sourceIndex +=
      1
  ) {
    const positionOffset =
      sourceIndex *
      3;

    const x =
      source.positions[
        positionOffset
      ];

    const y =
      source.positions[
        positionOffset +
          1
      ];

    const sectorX =
      clampInteger(
        Math.floor(
          x /
            cellSize +
          0.5,
        ),
        minCoordinate,
        maxCoordinate,
      );

    const sectorY =
      clampInteger(
        Math.floor(
          y /
            cellSize +
          0.5,
        ),
        minCoordinate,
        maxCoordinate,
      );

    const key =
      sectorKey(
        sectorX,
        sectorY,
      );

    let bucket =
      mutableBuckets.get(
        key,
      );

    if (
      bucket ===
        undefined
    ) {
      bucket =
        [];

      mutableBuckets.set(
        key,
        bucket,
      );
    }

    bucket.push(
      sourceIndex,
    );
  }

  const buckets =
    new Map<string, Uint32Array>();

  for (
    const [
      key,
      indices,
    ]
    of mutableBuckets
  ) {
    buckets.set(
      key,
      Uint32Array.from(
        indices,
      ),
    );
  }

  mutableBuckets.clear();

  const cache =
    new Map<
      string,
      GalacticMapMaterializedParticleLayout
    >();

  const api:
    GalacticMapParticleSectorMaterializer =
    {
      get sourceParticleCount() {
        return source.count;
      },

      get indexedSectorCount() {
        return buckets.size;
      },

      get cacheEntryCount() {
        return cache.size;
      },

      materialize(
        window,
      ) {
        const cached =
          cache.get(
            window.signature,
          );

        if (
          cached !==
            undefined
        ) {
          cache.delete(
            window.signature,
          );

          cache.set(
            window.signature,
            cached,
          );

          return Object.freeze({
            ...cached,
            cacheHit:
              true,
          });
        }

        const sourceIndices =
          collectSourceIndices(
            buckets,
            window,
          );

        const materialized =
          copyLayout(
            source,
            sourceIndices,
            window,
          );

        cache.set(
          window.signature,
          materialized,
        );

        while (
          cache.size >
            MAX_CACHED_WINDOWS
        ) {
          const oldestKey =
            cache
              .keys()
              .next()
              .value as
              string | undefined;

          if (
            oldestKey ===
              undefined
          ) {
            break;
          }

          cache.delete(
            oldestKey,
          );
        }

        return materialized;
      },

      clearCache() {
        cache.clear();
      },
    };

  return api;
}

function collectSourceIndices(
  buckets:
    ReadonlyMap<string, Uint32Array>,

  window:
    GalacticMapVisibleSectorWindow,
): Uint32Array {

  let count =
    0;

  forEachActiveBucket(
    buckets,
    window,
    (
      bucket,
    ) => {
      for (
        let index =
          0;
        index <
          bucket.length;
        index +=
          1
      ) {
        if (
          particleRetainedForLod(
            bucket[
              index
            ],
            window.lodLevel,
          )
        ) {
          count +=
            1;
        }
      }
    },
  );

  const result =
    new Uint32Array(
      count,
    );

  let cursor =
    0;

  forEachActiveBucket(
    buckets,
    window,
    (
      bucket,
    ) => {
      for (
        let index =
          0;
        index <
          bucket.length;
        index +=
          1
      ) {
        const sourceIndex =
          bucket[
            index
          ];

        if (
          !particleRetainedForLod(
            sourceIndex,
            window.lodLevel,
          )
        ) {
          continue;
        }

        result[
          cursor
        ] =
          sourceIndex;

        cursor +=
          1;
      }
    },
  );

  return result;
}

function forEachActiveBucket(
  buckets:
    ReadonlyMap<string, Uint32Array>,

  window:
    GalacticMapVisibleSectorWindow,

  visitor:
    (
      bucket:
        Uint32Array,
    ) => void,
): void {

  for (
    let x =
      window.active.minX;
    x <=
      window.active.maxX;
    x +=
      1
  ) {
    for (
      let y =
        window.active.minY;
      y <=
        window.active.maxY;
      y +=
        1
    ) {
      const bucket =
        buckets.get(
          sectorKey(
            x,
            y,
          ),
        );

      if (
        bucket !==
          undefined
      ) {
        visitor(
          bucket,
        );
      }
    }
  }
}

function copyLayout(
  source:
    GalacticMapParticleLayout,

  sourceIndices:
    Uint32Array,

  window:
    GalacticMapVisibleSectorWindow,
): GalacticMapMaterializedParticleLayout {

  const count =
    sourceIndices.length;

  const positions =
    new Float32Array(
      count *
      3,
    );

  const colors =
    new Float32Array(
      count *
      3,
    );

  const sizes =
    new Float32Array(
      count,
    );

  const opacities =
    new Float32Array(
      count,
    );

  for (
    let targetIndex =
      0;
    targetIndex <
      count;
    targetIndex +=
      1
  ) {
    const sourceIndex =
      sourceIndices[
        targetIndex
      ];

    const sourceOffset =
      sourceIndex *
      3;

    const targetOffset =
      targetIndex *
      3;

    positions[
      targetOffset
    ] =
      source.positions[
        sourceOffset
      ];

    positions[
      targetOffset +
        1
    ] =
      source.positions[
        sourceOffset +
          1
      ];

    positions[
      targetOffset +
        2
    ] =
      source.positions[
        sourceOffset +
          2
      ];

    colors[
      targetOffset
    ] =
      source.colors[
        sourceOffset
      ];

    colors[
      targetOffset +
        1
    ] =
      source.colors[
        sourceOffset +
          1
      ];

    colors[
      targetOffset +
        2
    ] =
      source.colors[
        sourceOffset +
          2
      ];

    sizes[
      targetIndex
    ] =
      source.sizes[
        sourceIndex
      ];

    opacities[
      targetIndex
    ] =
      source.opacities[
        sourceIndex
      ];
  }

  return Object.freeze({
    positions,
    colors,
    sizes,
    opacities,
    sourceIndices,
    count,
    sourceCount:
      source.count,
    sourceSectorCount:
      window.activeSectorCount,
    cacheHit:
      false,
  });
}

function sectorKey(
  x:
    number,

  y:
    number,
): string {

  return `${x}:${y}`;
}

function clampInteger(
  value:
    number,

  min:
    number,

  max:
    number,
): number {

  return Math.min(
    max,
    Math.max(
      min,
      value,
    ),
  );
}

function assertLayout(
  layout:
    GalacticMapParticleLayout,
): void {

  if (
    !Number.isInteger(
      layout.count,
    ) ||
    layout.count <
      0 ||
    layout.positions.length !==
      layout.count *
        3 ||
    layout.colors.length !==
      layout.count *
        3 ||
    layout.sizes.length !==
      layout.count ||
    layout.opacities.length !==
      layout.count
  ) {
    throw new RangeError(
      'GalacticMapParticleLayout buffers must match count.',
    );
  }
}
