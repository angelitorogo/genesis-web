import * as THREE from 'three';

import {
  type GalaxySectorCoordinates,
} from '../../domain/sector/galaxy-sector-coordinates';

import {
  type GalacticMapExplorationCoverage,
} from './galactic-map-exploration-coverage';

const GRID_COLOR =
  0x6ad7ff;

const GRID_OPACITY =
  0.075;

const EXPLORED_FILL_OPACITY =
  0.30;

const EXPLORED_FILL_SCALE =
  0.84;

export interface GalacticMapSectorOverlay {
  readonly object3d:
    THREE.Group;

  dispose():
    void;
}

export interface GalacticMapSectorLocalPosition {
  readonly x:
    number;

  readonly y:
    number;
}

/**
 * Builds the point-10.3 cartographic overlay without materializing physical
 * sector content. The full unexplored space is represented by one lightweight
 * line geometry; only persisted explored sectors receive instanced quads.
 */
export function createGalacticMapSectorOverlay(
  coverage:
    GalacticMapExplorationCoverage,

  haloOuterRadiusNormalized:
    number,
): GalacticMapSectorOverlay {

  assertPositiveFinite(
    haloOuterRadiusNormalized,
    'haloOuterRadiusNormalized',
  );

  const group =
    new THREE.Group();

  group.name =
    'galactic-map-sector-coverage';

  const gridLines =
    createGridLines(
      coverage,
      haloOuterRadiusNormalized,
    );

  group.add(
    gridLines,
  );

  const exploredMeshes =
    createExploredMeshes(
      coverage,
      haloOuterRadiusNormalized,
    );

  for (
    const mesh
    of exploredMeshes
  ) {
    group.add(
      mesh,
    );
  }

  return Object.freeze({
    object3d:
      group,

    dispose() {
      group.traverse(
        (
          object,
        ) => {
          if (
            object instanceof
              THREE.LineSegments ||
            object instanceof
              THREE.InstancedMesh
          ) {
            object.geometry.dispose();
            disposeMaterial(
              object.material,
            );
          }
        },
      );

      group.clear();
    },
  });
}

export function sectorCellSize(
  coverage:
    GalacticMapExplorationCoverage,

  haloOuterRadiusNormalized:
    number,
): number {

  assertPositiveFinite(
    haloOuterRadiusNormalized,
    'haloOuterRadiusNormalized',
  );

  const sideLength =
    safeGridSideLength(
      coverage,
    );

  return (
    2 *
    haloOuterRadiusNormalized /
    sideLength
  );
}

export function sectorLocalPosition(
  coverage:
    GalacticMapExplorationCoverage,

  coordinates:
    GalaxySectorCoordinates,

  haloOuterRadiusNormalized:
    number,
): GalacticMapSectorLocalPosition {

  if (
    !coverage
      .grid
      .contains(
        coordinates,
      )
  ) {
    throw new RangeError(
      'Sector coordinates are outside the exploration coverage grid.',
    );
  }

  const cellSize =
    sectorCellSize(
      coverage,
      haloOuterRadiusNormalized,
    );

  return Object.freeze({
    x:
      coordinates.x *
      cellSize,

    y:
      coordinates.y *
      cellSize,
  });
}

function createGridLines(
  coverage:
    GalacticMapExplorationCoverage,

  haloOuterRadiusNormalized:
    number,
): THREE.LineSegments<
  THREE.BufferGeometry,
  THREE.LineBasicMaterial
> {

  const sideLength =
    safeGridSideLength(
      coverage,
    );

  const cellSize =
    sectorCellSize(
      coverage,
      haloOuterRadiusNormalized,
    );

  const lineCountPerAxis =
    sideLength +
    1;

  const positions =
    new Float32Array(
      lineCountPerAxis *
      12,
    );

  let offset =
    0;

  for (
    let index =
      0;
    index <=
      sideLength;
    index +=
      1
  ) {
    const coordinate =
      -haloOuterRadiusNormalized +
      index *
        cellSize;

    positions[
      offset++
    ] =
      coordinate;
    positions[
      offset++
    ] =
      -haloOuterRadiusNormalized;
    positions[
      offset++
    ] =
      0;

    positions[
      offset++
    ] =
      coordinate;
    positions[
      offset++
    ] =
      haloOuterRadiusNormalized;
    positions[
      offset++
    ] =
      0;

    positions[
      offset++
    ] =
      -haloOuterRadiusNormalized;
    positions[
      offset++
    ] =
      coordinate;
    positions[
      offset++
    ] =
      0;

    positions[
      offset++
    ] =
      haloOuterRadiusNormalized;
    positions[
      offset++
    ] =
      coordinate;
    positions[
      offset++
    ] =
      0;
  }

  const geometry =
    new THREE.BufferGeometry();

  geometry.setAttribute(
    'position',
    new THREE.BufferAttribute(
      positions,
      3,
    ),
  );

  const material =
    new THREE.LineBasicMaterial({
      color:
        GRID_COLOR,
      transparent:
        true,
      opacity:
        GRID_OPACITY,
      depthTest:
        false,
      depthWrite:
        false,
      toneMapped:
        false,
    });

  const lines =
    new THREE.LineSegments(
      geometry,
      material,
    );

  lines.name =
    'galactic-map-unexplored-grid';

  lines.renderOrder =
    40;

  return lines;
}

function createExploredMeshes(
  coverage:
    GalacticMapExplorationCoverage,

  haloOuterRadiusNormalized:
    number,
): readonly THREE.InstancedMesh<
  THREE.PlaneGeometry,
  THREE.MeshBasicMaterial
>[] {

  if (
    coverage.exploredSectorCount ===
    0
  ) {
    return Object.freeze([]);
  }

  const cellSize =
    sectorCellSize(
      coverage,
      haloOuterRadiusNormalized,
    );

  const fill =
    createExploredInstances(
      coverage,
      haloOuterRadiusNormalized,
      cellSize *
        EXPLORED_FILL_SCALE,
      EXPLORED_FILL_OPACITY,
      41,
      'galactic-map-explored-sector-fill',
    );

  return Object.freeze([
    fill,
  ]);
}

function createExploredInstances(
  coverage:
    GalacticMapExplorationCoverage,

  haloOuterRadiusNormalized:
    number,

  size:
    number,

  opacity:
    number,

  renderOrder:
    number,

  name:
    string,
): THREE.InstancedMesh<
  THREE.PlaneGeometry,
  THREE.MeshBasicMaterial
> {

  const geometry =
    new THREE.PlaneGeometry(
      size,
      size,
    );

  const material =
    new THREE.MeshBasicMaterial({
      color:
        GRID_COLOR,
      transparent:
        true,
      opacity,
      side:
        THREE.DoubleSide,
      depthTest:
        false,
      depthWrite:
        false,
      toneMapped:
        false,
    });

  const mesh =
    new THREE.InstancedMesh(
      geometry,
      material,
      coverage.exploredSectorCount,
    );

  const matrix =
    new THREE.Matrix4();

  for (
    let index =
      0;
    index <
      coverage.exploredSectorCount;
    index +=
      1
  ) {
    const coordinates =
      coverage
        .exploredSectors[
          index
        ];

    const position =
      sectorLocalPosition(
        coverage,
        coordinates,
        haloOuterRadiusNormalized,
      );

    matrix.makeTranslation(
      position.x,
      position.y,
      0.002,
    );

    mesh.setMatrixAt(
      index,
      matrix,
    );
  }

  mesh.instanceMatrix.needsUpdate =
    true;

  mesh.name =
    name;

  mesh.renderOrder =
    renderOrder;

  return mesh;
}

function safeGridSideLength(
  coverage:
    GalacticMapExplorationCoverage,
): number {

  const sideLength =
    coverage
      .grid
      .sideLengthInSectors;

  if (
    sideLength >
    BigInt(
      Number.MAX_SAFE_INTEGER,
    )
  ) {
    throw new RangeError(
      'Galactic map sector grid exceeds the safe renderer range.',
    );
  }

  return Number(
    sideLength,
  );
}

function disposeMaterial(
  material:
    THREE.Material | readonly THREE.Material[],
): void {

  if (
    Array.isArray(
      material,
    )
  ) {
    for (
      const entry
      of material
    ) {
      entry.dispose();
    }

    return;
  }

  (material as THREE.Material)
    .dispose();
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
      `${propertyName} must be finite and greater than 0.`,
    );
  }
}
