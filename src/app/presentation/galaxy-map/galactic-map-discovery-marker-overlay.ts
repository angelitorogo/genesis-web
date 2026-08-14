import * as THREE from 'three';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  type GalacticMapDiscoveryMarker,
  type GalacticMapDiscoveryMarkers,
} from './galactic-map-discovery-markers';

import {
  type GalacticMapExplorationCoverage,
} from './galactic-map-exploration-coverage';

import {
  sectorCellSize,
  sectorLocalPosition,
} from './galactic-map-sector-overlay';

const MARKER_Z_OFFSET =
  0.014;

const MARKER_RENDER_ORDER =
  70;

export interface GalacticMapDiscoveryMarkerRenderPosition {
  readonly x:
    number;

  readonly y:
    number;

  readonly z:
    number;
}

export interface GalacticMapDiscoveryMarkerOverlay {
  readonly object3d:
    THREE.Group;

  setPixelRatio(
    pixelRatio:
      number,
  ): void;

  dispose():
    void;
}

/**
 * Converts a persistent discovery marker from sector-local normalized
 * coordinates into the renderer-local plane already used by the 10.3 sector
 * overlay. This projection does not materialize sector content.
 */
export function discoveryMarkerLocalPosition(
  marker:
    GalacticMapDiscoveryMarker,

  coverage:
    GalacticMapExplorationCoverage,

  haloOuterRadiusNormalized:
    number,
): GalacticMapDiscoveryMarkerRenderPosition {

  assertCompatibleMarkerCoverage(
    marker,
    coverage,
  );

  const cellSize =
    sectorCellSize(
      coverage,
      haloOuterRadiusNormalized,
    );

  const sectorCenter =
    sectorLocalPosition(
      coverage,
      marker.sectorCoordinates,
      haloOuterRadiusNormalized,
    );

  return Object.freeze({
    x:
      sectorCenter.x +
      (
        marker.normalizedX -
        0.5
      ) *
      cellSize,

    y:
      sectorCenter.y +
      (
        marker.normalizedY -
        0.5
      ) *
      cellSize,

    z:
      MARKER_Z_OFFSET,
  });
}

/**
 * Builds one lightweight Points layer for all persistent point-10.4 markers.
 * Marker appearance is deliberately generic. Object-family layers and toggles
 * remain point 10.5, while marker navigation remains point 10.6.
 */
export function createGalacticMapDiscoveryMarkerOverlay(
  discoveryMarkers:
    GalacticMapDiscoveryMarkers,

  coverage:
    GalacticMapExplorationCoverage,

  haloOuterRadiusNormalized:
    number,

  pixelRatio:
    number,
): GalacticMapDiscoveryMarkerOverlay {

  assertCompatibleSnapshots(
    discoveryMarkers,
    coverage,
  );

  assertPositiveFinite(
    haloOuterRadiusNormalized,
    'haloOuterRadiusNormalized',
  );

  assertPositiveFinite(
    pixelRatio,
    'pixelRatio',
  );

  const group =
    new THREE.Group();

  group.name =
    'galactic-map-discovery-markers';

  let geometry:
    THREE.BufferGeometry | null =
    null;

  let material:
    THREE.ShaderMaterial | null =
    null;

  if (
    discoveryMarkers.markerCount >
    0
  ) {
    const positions =
      new Float32Array(
        discoveryMarkers.markerCount *
        3,
      );

    for (
      let index =
        0;
      index <
        discoveryMarkers.markerCount;
      index +=
        1
    ) {
      const position =
        discoveryMarkerLocalPosition(
          discoveryMarkers.markers[
            index
          ],
          coverage,
          haloOuterRadiusNormalized,
        );

      const offset =
        index *
        3;

      positions[
        offset
      ] =
        position.x;

      positions[
        offset +
        1
      ] =
        position.y;

      positions[
        offset +
        2
      ] =
        position.z;
    }

    geometry =
      new THREE.BufferGeometry();

    geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(
        positions,
        3,
      ),
    );

    geometry.computeBoundingSphere();

    material =
      createMarkerMaterial(
        pixelRatio,
      );

    const points =
      new THREE.Points(
        geometry,
        material,
      );

    points.name =
      'galactic-map-discovery-marker-points';

    points.renderOrder =
      MARKER_RENDER_ORDER;

    group.add(
      points,
    );
  }

  return {
    object3d:
      group,

    setPixelRatio(
      nextPixelRatio:
        number,
    ): void {
      assertPositiveFinite(
        nextPixelRatio,
        'pixelRatio',
      );

      if (
        material !==
        null
      ) {
        material.uniforms[
          'uPixelRatio'
        ].value =
          nextPixelRatio;
      }
    },

    dispose():
      void {

      group.clear();

      geometry?.dispose();
      material?.dispose();

      geometry =
        null;

      material =
        null;
    },
  };
}

function createMarkerMaterial(
  pixelRatio:
    number,
): THREE.ShaderMaterial {

  return new THREE.ShaderMaterial({
    uniforms: {
      uPixelRatio: {
        value:
          pixelRatio,
      },
    },

    vertexShader: `
      uniform float uPixelRatio;

      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = 9.0 * uPixelRatio;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,

    fragmentShader: `
      void main() {
        vec2 centered = gl_PointCoord - vec2(0.5);
        float radius = length(centered);

        if (radius > 0.5) {
          discard;
        }

        float outer = 1.0 - smoothstep(0.42, 0.50, radius);
        float innerCut = smoothstep(0.20, 0.29, radius);
        float ring = outer * innerCut;
        float core = 1.0 - smoothstep(0.00, 0.10, radius);
        float alpha = max(ring * 0.96, core * 0.88);

        gl_FragColor = vec4(
          vec3(1.0, 0.74, 0.28),
          alpha
        );
      }
    `,

    transparent:
      true,

    depthTest:
      false,

    depthWrite:
      false,

    blending:
      THREE.NormalBlending,

    toneMapped:
      false,
  });
}

function assertCompatibleMarkerCoverage(
  marker:
    GalacticMapDiscoveryMarker,

  coverage:
    GalacticMapExplorationCoverage,
): void {

  if (
    marker.locator.galaxyIndex !==
    coverage.galaxyIndex ||
    !coverage.grid.contains(
      marker.sectorCoordinates,
    )
  ) {
    throw new RangeError(
      'Discovery marker must belong to the supplied exploration coverage.',
    );
  }
}

function assertCompatibleSnapshots(
  discoveryMarkers:
    GalacticMapDiscoveryMarkers,

  coverage:
    GalacticMapExplorationCoverage,
): void {

  if (
    !sameGenerationKey(
      discoveryMarkers.generationKey,
      coverage.generationKey,
    ) ||
    discoveryMarkers.galaxyIndex !==
      coverage.galaxyIndex ||
    discoveryMarkers.grid.minCoordinate !==
      coverage.grid.minCoordinate ||
    discoveryMarkers.grid.maxCoordinate !==
      coverage.grid.maxCoordinate
  ) {
    throw new RangeError(
      'Discovery markers and exploration coverage must describe the same active galaxy grid.',
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

function sameGenerationKey(
  left:
    UniverseGenerationKey,

  right:
    UniverseGenerationKey,
): boolean {

  return (
    left
      .generatorVersion
      .code ===
      right
        .generatorVersion
        .code &&
    left
      .universeSeed
      .serialize() ===
      right
        .universeSeed
        .serialize()
  );
}
