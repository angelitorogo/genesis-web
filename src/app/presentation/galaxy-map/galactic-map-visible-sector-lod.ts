import * as THREE from 'three';

import {
  GalacticMapLodLevel,
  galacticMapLodForCameraDistance,
  galacticMapParticleRetentionRatio,
} from './galactic-map-lod-policy';

export {
  GalacticMapLodLevel,
  galacticMapLodForCameraDistance,
  galacticMapParticleRetentionRatio,
} from './galactic-map-lod-policy';

import {
  type GalacticMapExplorationCoverage,
} from './galactic-map-exploration-coverage';

import {
  sectorCellSize,
} from './galactic-map-sector-overlay';

export interface GalacticMapSectorBounds {
  readonly minX:
    number;

  readonly maxX:
    number;

  readonly minY:
    number;

  readonly maxY:
    number;
}

export interface GalacticMapVisibleSectorWindow {
  readonly visible:
    GalacticMapSectorBounds;

  readonly active:
    GalacticMapSectorBounds;

  readonly visibleSectorCount:
    number;

  readonly activeSectorCount:
    number;

  readonly prefetchMarginSectors:
    number;

  readonly lodLevel:
    GalacticMapLodLevel;

  readonly particleRetentionRatio:
    number;

  readonly signature:
    string;
}

const DEFAULT_PREFETCH_MARGIN_SECTORS =
  1;

const SCREEN_SAMPLE_NDC:
  readonly (readonly [number, number])[] =
  Object.freeze([
    [-1, -1],
    [0, -1],
    [1, -1],
    [-1, 0],
    [0, 0],
    [1, 0],
    [-1, 1],
    [0, 1],
    [1, 1],
  ] as const);

/**
 * Resolves the conservative part of the canonical sector grid needed by the
 * current camera viewport.
 *
 * When every viewport sample intersects the galaxy local Z=0 plane, the exact
 * planar bounds plus the prefetch ring are used.
 *
 * When even one sample ray does not intersect that plane, the viewport is
 * crossing the galactic horizon. In that configuration a partial planar
 * rectangle is NOT a safe visibility proxy: using only the successful rays can
 * cut away an entire far-side strip of renderer-only particles while those
 * particles are still visible on screen. In that ambiguous case the visual
 * cloud falls back to the complete canonical grid. This is intentionally
 * conservative and affects only GPU render samples; it never materializes
 * physical systems, stars, planets or hidden Ground Truth.
 */
export function resolveGalacticMapVisibleSectorWindow(
  camera:
    THREE.PerspectiveCamera,

  galaxyGroup:
    THREE.Object3D,

  coverage:
    GalacticMapExplorationCoverage,

  haloOuterRadiusNormalized:
    number,

  cameraDistance:
    number,

  prefetchMarginSectors =
    DEFAULT_PREFETCH_MARGIN_SECTORS,
): GalacticMapVisibleSectorWindow {

  assertPositiveFinite(
    haloOuterRadiusNormalized,
    'haloOuterRadiusNormalized',
  );

  assertPositiveFinite(
    cameraDistance,
    'cameraDistance',
  );

  assertNonNegativeInteger(
    prefetchMarginSectors,
    'prefetchMarginSectors',
  );

  camera.updateMatrixWorld(
    true,
  );

  galaxyGroup.updateWorldMatrix(
    true,
    false,
  );

  const originWorld =
    new THREE.Vector3(
      0,
      0,
      0,
    )
      .applyMatrix4(
        galaxyGroup.matrixWorld,
      );

  const normalWorld =
    new THREE.Vector3(
      0,
      0,
      1,
    )
      .transformDirection(
        galaxyGroup.matrixWorld,
      )
      .normalize();

  const plane =
    new THREE.Plane()
      .setFromNormalAndCoplanarPoint(
        normalWorld,
        originWorld,
      );

  const raycaster =
    new THREE.Raycaster();

  const localPoint =
    new THREE.Vector3();

  const intersection =
    new THREE.Vector3();

  let minLocalX =
    Number.POSITIVE_INFINITY;

  let maxLocalX =
    Number.NEGATIVE_INFINITY;

  let minLocalY =
    Number.POSITIVE_INFINITY;

  let maxLocalY =
    Number.NEGATIVE_INFINITY;

  let intersectionCount =
    0;

  for (
    const [
      ndcX,
      ndcY,
    ]
    of SCREEN_SAMPLE_NDC
  ) {
    raycaster.setFromCamera(
      new THREE.Vector2(
        ndcX,
        ndcY,
      ),
      camera,
    );

    const hit =
      raycaster.ray.intersectPlane(
        plane,
        intersection,
      );

    if (
      hit ===
        null
    ) {
      continue;
    }

    localPoint.copy(
      hit,
    );

    galaxyGroup.worldToLocal(
      localPoint,
    );

    minLocalX =
      Math.min(
        minLocalX,
        localPoint.x,
      );

    maxLocalX =
      Math.max(
        maxLocalX,
        localPoint.x,
      );

    minLocalY =
      Math.min(
        minLocalY,
        localPoint.y,
      );

    maxLocalY =
      Math.max(
        maxLocalY,
        localPoint.y,
      );

    intersectionCount +=
      1;
  }

  const grid =
    coverage.grid;

  let visible:
    GalacticMapSectorBounds;

  if (
    intersectionCount !==
      SCREEN_SAMPLE_NDC.length
  ) {
    visible =
      Object.freeze({
        minX:
          grid.minCoordinate,
        maxX:
          grid.maxCoordinate,
        minY:
          grid.minCoordinate,
        maxY:
          grid.maxCoordinate,
      });
  } else {
    visible =
      sectorBoundsForLocalBounds(
        coverage,
        haloOuterRadiusNormalized,
        minLocalX,
        maxLocalX,
        minLocalY,
        maxLocalY,
      );
  }

  const active =
    expandSectorBounds(
      visible,
      grid.minCoordinate,
      grid.maxCoordinate,
      prefetchMarginSectors,
    );

  const lodLevel =
    galacticMapLodForCameraDistance(
      cameraDistance,
    );

  const particleRetentionRatio =
    galacticMapParticleRetentionRatio(
      lodLevel,
    );

  return Object.freeze({
    visible,
    active,
    visibleSectorCount:
      sectorBoundsCount(
        visible,
      ),
    activeSectorCount:
      sectorBoundsCount(
        active,
      ),
    prefetchMarginSectors,
    lodLevel,
    particleRetentionRatio,
    signature:
      [
        lodLevel,
        active.minX,
        active.maxX,
        active.minY,
        active.maxY,
      ].join(
        ':',
      ),
  });
}

export function sectorBoundsForLocalBounds(
  coverage:
    GalacticMapExplorationCoverage,

  haloOuterRadiusNormalized:
    number,

  minLocalX:
    number,

  maxLocalX:
    number,

  minLocalY:
    number,

  maxLocalY:
    number,
): GalacticMapSectorBounds {

  assertFiniteBounds(
    minLocalX,
    maxLocalX,
    minLocalY,
    maxLocalY,
  );

  const cellSize =
    sectorCellSize(
      coverage,
      haloOuterRadiusNormalized,
    );

  const grid =
    coverage.grid;

  const minX =
    clampInteger(
      Math.ceil(
        minLocalX /
          cellSize -
        0.5,
      ),
      grid.minCoordinate,
      grid.maxCoordinate,
    );

  const maxX =
    clampInteger(
      Math.floor(
        maxLocalX /
          cellSize +
        0.5,
      ),
      grid.minCoordinate,
      grid.maxCoordinate,
    );

  const minY =
    clampInteger(
      Math.ceil(
        minLocalY /
          cellSize -
        0.5,
      ),
      grid.minCoordinate,
      grid.maxCoordinate,
    );

  const maxY =
    clampInteger(
      Math.floor(
        maxLocalY /
          cellSize +
        0.5,
      ),
      grid.minCoordinate,
      grid.maxCoordinate,
    );

  return Object.freeze({
    minX:
      Math.min(
        minX,
        maxX,
      ),
    maxX:
      Math.max(
        minX,
        maxX,
      ),
    minY:
      Math.min(
        minY,
        maxY,
      ),
    maxY:
      Math.max(
        minY,
        maxY,
      ),
  });
}

export function sectorBoundsCount(
  bounds:
    GalacticMapSectorBounds,
): number {

  return (
    bounds.maxX -
      bounds.minX +
    1
  ) *
    (
      bounds.maxY -
        bounds.minY +
      1
    );
}

function expandSectorBounds(
  bounds:
    GalacticMapSectorBounds,

  minCoordinate:
    number,

  maxCoordinate:
    number,

  margin:
    number,
): GalacticMapSectorBounds {

  return Object.freeze({
    minX:
      Math.max(
        minCoordinate,
        bounds.minX -
          margin,
      ),
    maxX:
      Math.min(
        maxCoordinate,
        bounds.maxX +
          margin,
      ),
    minY:
      Math.max(
        minCoordinate,
        bounds.minY -
          margin,
      ),
    maxY:
      Math.min(
        maxCoordinate,
        bounds.maxY +
          margin,
      ),
  });
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

function assertFiniteBounds(
  minLocalX:
    number,

  maxLocalX:
    number,

  minLocalY:
    number,

  maxLocalY:
    number,
): void {

  for (
    const [
      value,
      name,
    ]
    of [
      [minLocalX, 'minLocalX'],
      [maxLocalX, 'maxLocalX'],
      [minLocalY, 'minLocalY'],
      [maxLocalY, 'maxLocalY'],
    ] as const
  ) {
    if (
      !Number.isFinite(
        value,
      )
    ) {
      throw new RangeError(
        `${name} must be finite.`,
      );
    }
  }

  if (
    minLocalX >
      maxLocalX ||
    minLocalY >
      maxLocalY
  ) {
    throw new RangeError(
      'Local visibility bounds must be ordered.',
    );
  }
}

function assertPositiveFinite(
  value:
    number,

  propertyName:
    string,
): void {

  if (
    !Number.isFinite(
      value,
    ) ||
    value <=
      0
  ) {
    throw new RangeError(
      `${propertyName} must be finite and > 0.`,
    );
  }
}

function assertNonNegativeInteger(
  value:
    number,

  propertyName:
    string,
): void {

  if (
    !Number.isInteger(
      value,
    ) ||
    value <
      0
  ) {
    throw new RangeError(
      `${propertyName} must be a non-negative integer.`,
    );
  }
}
