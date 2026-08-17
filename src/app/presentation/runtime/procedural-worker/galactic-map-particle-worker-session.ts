import {
  type GalacticMapLodLevel,
} from '../../galaxy-map/galactic-map-lod-policy';

import {
  particleRetainedForLod,
} from '../../galaxy-map/galactic-map-particle-lod-retention';

import {
  type GalacticMapParticleLayout,
} from '../../galaxy-map/galactic-map-particle-layout';

import {
  type GalacticMapParticleSectorIndexConfig,
} from '../../galaxy-map/galactic-map-particle-sector-index';

const MAX_CACHED_WINDOWS =
  3;

export interface GalacticMapWorkerSectorBounds {
  readonly minX:
    number;

  readonly maxX:
    number;

  readonly minY:
    number;

  readonly maxY:
    number;
}

export interface GalacticMapWorkerParticleWindow {
  readonly active:
    GalacticMapWorkerSectorBounds;

  readonly activeSectorCount:
    number;

  readonly lodLevel:
    GalacticMapLodLevel;

  readonly signature:
    string;
}

export interface GalacticMapWorkerParticleBatch {
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

  readonly indexedSectorCount:
    number;

  readonly cacheEntryCount:
    number;

  readonly cacheHit:
    boolean;
}

export interface GalacticMapWorkerParticleSession {
  readonly sourceParticleCount:
    number;

  readonly indexedSectorCount:
    number;

  readonly cacheEntryCount:
    number;

  materialize(
    window:
      GalacticMapWorkerParticleWindow,
  ): GalacticMapWorkerParticleBatch;

  clearCache():
    void;
}

/**
 * Worker-safe point-10.9 spatial index.
 *
 * The complete deterministic renderer-only particle layout remains inside the
 * worker. The cache stores only source-index selections; materialized typed
 * arrays are recreated for each response so their ArrayBuffers can be
 * transferred to the main thread without detaching worker-owned source data.
 */
export function createGalacticMapWorkerParticleSession(
  source:
    GalacticMapParticleLayout,

  indexConfig:
    GalacticMapParticleSectorIndexConfig,
): GalacticMapWorkerParticleSession {

  assertLayout(
    source,
  );

  assertIndexConfig(
    indexConfig,
  );

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
            indexConfig.cellSize +
          0.5,
        ),
        indexConfig.minCoordinate,
        indexConfig.maxCoordinate,
      );

    const sectorY =
      clampInteger(
        Math.floor(
          y /
            indexConfig.cellSize +
          0.5,
        ),
        indexConfig.minCoordinate,
        indexConfig.maxCoordinate,
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

  const sourceIndexCache =
    new Map<string, Uint32Array>();

  return {
    get sourceParticleCount() {
      return source.count;
    },

    get indexedSectorCount() {
      return buckets.size;
    },

    get cacheEntryCount() {
      return sourceIndexCache.size;
    },

    materialize(
      window,
    ) {
      assertWindow(
        window,
        indexConfig,
      );

      const cached =
        sourceIndexCache.get(
          window.signature,
        );

      let sourceIndices:
        Uint32Array;

      let cacheHit =
        false;

      if (
        cached !==
          undefined
      ) {
        sourceIndexCache.delete(
          window.signature,
        );

        sourceIndexCache.set(
          window.signature,
          cached,
        );

        sourceIndices =
          cached.slice();

        cacheHit =
          true;
      } else {
        const collected =
          collectSourceIndices(
            buckets,
            window,
          );

        sourceIndexCache.set(
          window.signature,
          collected,
        );

        while (
          sourceIndexCache.size >
            MAX_CACHED_WINDOWS
        ) {
          const oldestKey =
            sourceIndexCache
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

          sourceIndexCache.delete(
            oldestKey,
          );
        }

        sourceIndices =
          collected.slice();
      }

      const copied =
        copyLayout(
          source,
          sourceIndices,
        );

      return Object.freeze({
        ...copied,
        sourceSectorCount:
          window.activeSectorCount,
        indexedSectorCount:
          buckets.size,
        cacheEntryCount:
          sourceIndexCache.size,
        cacheHit,
      });
    },

    clearCache() {
      sourceIndexCache.clear();
    },
  };
}

export function materializeGalacticMapWorkerFullLayout(
  source:
    GalacticMapParticleLayout,
): GalacticMapWorkerParticleBatch {

  assertLayout(
    source,
  );

  const sourceIndices =
    new Uint32Array(
      source.count,
    );

  for (
    let index =
      0;
    index <
      sourceIndices.length;
    index +=
      1
  ) {
    sourceIndices[
      index
    ] =
      index;
  }

  return Object.freeze({
    positions:
      source.positions,
    colors:
      source.colors,
    sizes:
      source.sizes,
    opacities:
      source.opacities,
    sourceIndices,
    count:
      source.count,
    sourceCount:
      source.count,
    sourceSectorCount:
      0,
    indexedSectorCount:
      0,
    cacheEntryCount:
      0,
    cacheHit:
      false,
  });
}

export function galacticMapWorkerParticleBatchTransferables(
  batch:
    GalacticMapWorkerParticleBatch,
): Transferable[] {

  return [
    batch.positions.buffer as ArrayBuffer,
    batch.colors.buffer as ArrayBuffer,
    batch.sizes.buffer as ArrayBuffer,
    batch.opacities.buffer as ArrayBuffer,
    batch.sourceIndices.buffer as ArrayBuffer,
  ];
}

function collectSourceIndices(
  buckets:
    ReadonlyMap<string, Uint32Array>,

  window:
    GalacticMapWorkerParticleWindow,
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
    GalacticMapWorkerParticleWindow,

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
): Omit<
  GalacticMapWorkerParticleBatch,
  | 'sourceSectorCount'
  | 'indexedSectorCount'
  | 'cacheEntryCount'
  | 'cacheHit'
> {

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

  const clamped =
    Math.min(
      max,
      Math.max(
        min,
        value,
      ),
    );

  return clamped ===
    0
    ? 0
    : clamped;
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

function assertIndexConfig(
  config:
    GalacticMapParticleSectorIndexConfig,
): void {

  if (
    !Number.isFinite(
      config.cellSize,
    ) ||
    config.cellSize <=
      0 ||
    !Number.isInteger(
      config.minCoordinate,
    ) ||
    !Number.isInteger(
      config.maxCoordinate,
    ) ||
    config.minCoordinate >
      config.maxCoordinate
  ) {
    throw new RangeError(
      'Invalid galactic particle sector index configuration.',
    );
  }
}

function assertWindow(
  window:
    GalacticMapWorkerParticleWindow,

  config:
    GalacticMapParticleSectorIndexConfig,
): void {

  const bounds =
    window.active;

  if (
    !Number.isInteger(
      bounds.minX,
    ) ||
    !Number.isInteger(
      bounds.maxX,
    ) ||
    !Number.isInteger(
      bounds.minY,
    ) ||
    !Number.isInteger(
      bounds.maxY,
    ) ||
    bounds.minX >
      bounds.maxX ||
    bounds.minY >
      bounds.maxY ||
    bounds.minX <
      config.minCoordinate ||
    bounds.maxX >
      config.maxCoordinate ||
    bounds.minY <
      config.minCoordinate ||
    bounds.maxY >
      config.maxCoordinate ||
    !Number.isInteger(
      window.activeSectorCount,
    ) ||
    window.activeSectorCount <=
      0 ||
    window.signature.length ===
      0
  ) {
    throw new RangeError(
      'Invalid galactic worker particle window.',
    );
  }
}
