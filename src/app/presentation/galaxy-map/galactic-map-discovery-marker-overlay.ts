import * as THREE from 'three';

import {
  ExplorationResultKind,
  type ExplorationLocatedResultKind,
} from '../../domain/exploration/exploration-sector-result';

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
  type GalacticMapLayerVisibility,
} from './galactic-map-layer-state';

import {
  sectorCellSize,
  sectorLocalPosition,
} from './galactic-map-sector-overlay';

const MARKER_Z_OFFSET =
  0.014;

const MARKER_RENDER_ORDER =
  70;

interface MarkerFamilyStyle {
  readonly resultKind:
    ExplorationLocatedResultKind;

  readonly objectName:
    string;

  readonly color:
    THREE.ColorRepresentation;

  readonly pointSize:
    number;
}

const MARKER_FAMILY_STYLES:
  readonly MarkerFamilyStyle[] =
  Object.freeze([
    Object.freeze({
      resultKind:
        ExplorationResultKind.SYSTEM,
      objectName:
        'galactic-map-system-markers',
      color:
        0xffc15c,
      pointSize:
        9.0,
    }),
    Object.freeze({
      resultKind:
        ExplorationResultKind.NEBULA,
      objectName:
        'galactic-map-nebula-markers',
      color:
        0xbc8cff,
      pointSize:
        10.0,
    }),
    Object.freeze({
      resultKind:
        ExplorationResultKind.STAR_CLUSTER,
      objectName:
        'galactic-map-star-cluster-markers',
      color:
        0x6ad7ff,
      pointSize:
        9.5,
    }),
    Object.freeze({
      resultKind:
        ExplorationResultKind.EXTREME_OBJECT,
      objectName:
        'galactic-map-extreme-object-markers',
      color:
        0xff6b7a,
      pointSize:
        10.5,
    }),
  ]);

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

  setLayerVisibility(
    visibility:
      GalacticMapLayerVisibility,
  ): void;

  dispose():
    void;
}

interface MarkerRenderFamily {
  readonly resultKind:
    ExplorationLocatedResultKind;

  readonly points:
    THREE.Points<
      THREE.BufferGeometry,
      THREE.ShaderMaterial
    >;
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
 * Point-10.5 persistent marker renderer.
 *
 * The point-10.4 marker identities and deterministic positions stay intact;
 * only the already-known point-9.4 operational result family determines the
 * visual sub-layer. These groups remain read-only and are not selectable
 * physical entities. Marker navigation belongs to point 10.6.
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

  const families:
    MarkerRenderFamily[] =
    [];

  for (
    const style
    of MARKER_FAMILY_STYLES
  ) {
    const matchingMarkers =
      discoveryMarkers
        .markers
        .filter(
          (
            marker,
          ) =>
            marker.resultKind ===
            style.resultKind,
        );

    if (
      matchingMarkers.length ===
      0
    ) {
      continue;
    }

    const points =
      createMarkerFamilyPoints(
        matchingMarkers,
        coverage,
        haloOuterRadiusNormalized,
        pixelRatio,
        style,
      );

    families.push({
      resultKind:
        style.resultKind,
      points,
    });

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

      for (
        const family
        of families
      ) {
        family
          .points
          .material
          .uniforms[
            'uPixelRatio'
          ]
          .value =
          nextPixelRatio;
      }
    },

    setLayerVisibility(
      visibility:
        GalacticMapLayerVisibility,
    ): void {
      for (
        const family
        of families
      ) {
        family.points.visible =
          markerFamilyVisible(
            family.resultKind,
            visibility,
          );
      }
    },

    dispose():
      void {

      group.clear();

      for (
        const family
        of families
      ) {
        family
          .points
          .geometry
          .dispose();

        family
          .points
          .material
          .dispose();
      }

      families.splice(
        0,
        families.length,
      );
    },
  };
}

function createMarkerFamilyPoints(
  markers:
    readonly GalacticMapDiscoveryMarker[],

  coverage:
    GalacticMapExplorationCoverage,

  haloOuterRadiusNormalized:
    number,

  pixelRatio:
    number,

  style:
    MarkerFamilyStyle,
): THREE.Points<
  THREE.BufferGeometry,
  THREE.ShaderMaterial
> {

  const positions =
    new Float32Array(
      markers.length *
      3,
    );

  for (
    let index =
      0;
    index <
      markers.length;
    index +=
      1
  ) {
    const position =
      discoveryMarkerLocalPosition(
        markers[
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

  const geometry =
    new THREE.BufferGeometry();

  geometry.setAttribute(
    'position',
    new THREE.BufferAttribute(
      positions,
      3,
    ),
  );

  geometry.computeBoundingSphere();

  const material =
    createMarkerMaterial(
      pixelRatio,
      style.color,
      style.pointSize,
    );

  const points =
    new THREE.Points(
      geometry,
      material,
    );

  points.name =
    style.objectName;

  points.renderOrder =
    MARKER_RENDER_ORDER;

  return points;
}

function createMarkerMaterial(
  pixelRatio:
    number,

  color:
    THREE.ColorRepresentation,

  pointSize:
    number,
): THREE.ShaderMaterial {

  const markerColor =
    new THREE.Color(
      color,
    );

  return new THREE.ShaderMaterial({
    uniforms: {
      uPixelRatio: {
        value:
          pixelRatio,
      },
      uPointSize: {
        value:
          pointSize,
      },
      uColor: {
        value:
          markerColor,
      },
    },

    vertexShader: `
      uniform float uPixelRatio;
      uniform float uPointSize;

      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = uPointSize * uPixelRatio;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,

    fragmentShader: `
      uniform vec3 uColor;

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
          uColor,
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

function markerFamilyVisible(
  resultKind:
    ExplorationLocatedResultKind,

  visibility:
    GalacticMapLayerVisibility,
): boolean {

  switch (
    resultKind
  ) {
    case ExplorationResultKind.SYSTEM:
      return visibility.systems;

    case ExplorationResultKind.NEBULA:
      return visibility.nebulae;

    case ExplorationResultKind.STAR_CLUSTER:
      return visibility.starClusters;

    case ExplorationResultKind.EXTREME_OBJECT:
      return visibility.extremeObjects;
  }

  throw new RangeError(
    `Unsupported persistent marker result kind: ${String(resultKind)}.`,
  );
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
