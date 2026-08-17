import * as THREE from 'three';

import {
  GalacticHabitabilityBand,
} from '../../domain/habitability/galactic-habitability-profile';

import {
  type GalacticMapEnvironmentalLayers,
} from './galactic-map-environmental-layers';

const REGION_COLOR =
  0x8ea7c9;

const REGION_OPACITY =
  0.34;

const REGION_SEGMENTS =
  192;

const REGION_Z_OFFSET =
  0.006;

const REGION_RENDER_ORDER =
  44;

const HABITABLE_FAVORED_COLOR =
  0x77e6a2;

const HABITABLE_HIGH_COLOR =
  0xa8f4c2;

const HABITABLE_FAVORED_OPACITY =
  0.075;

const HABITABLE_HIGH_OPACITY =
  0.12;

const HABITABLE_Z_OFFSET =
  0.008;

const HABITABLE_RENDER_ORDER =
  45;

export interface GalacticMapEnvironmentalOverlay {
  readonly object3d:
    THREE.Group;

  setRegionsVisible(
    visible:
      boolean,
  ): void;

  setHabitabilityVisible(
    visible:
      boolean,
  ): void;

  dispose():
    void;
}

/**
 * Renderer-only point-10.5 environmental overlay.
 *
 * Region boundaries come directly from the already-generated
 * GalaxyVisualStructure radii carried by GalacticMapEnvironmentalLayers.
 * The habitable-zone meshes are a visualization of the existing
 * SPECULATIVE_SIMPLIFIED V1 model; they do not assert the presence of life,
 * habitable planets or discovered systems.
 */
export function createGalacticMapEnvironmentalOverlay(
  environmentalLayers:
    GalacticMapEnvironmentalLayers,
): GalacticMapEnvironmentalOverlay {

  const root =
    new THREE.Group();

  root.name =
    'galactic-map-environmental-layers';

  const regionsGroup =
    createRegionsGroup(
      environmentalLayers,
    );

  const habitabilityGroup =
    createHabitabilityGroup(
      environmentalLayers,
    );

  root.add(
    regionsGroup,
    habitabilityGroup,
  );

  return {
    object3d:
      root,

    setRegionsVisible(
      visible:
        boolean,
    ): void {
      regionsGroup.visible =
        visible;
    },

    setHabitabilityVisible(
      visible:
        boolean,
    ): void {
      habitabilityGroup.visible =
        visible;
    },

    dispose():
      void {

      root.traverse(
        (
          object,
        ) => {
          if (
            object instanceof
              THREE.LineLoop ||
            object instanceof
              THREE.Mesh
          ) {
            object.geometry.dispose();
            disposeMaterial(
              object.material,
            );
          }
        },
      );

      root.clear();
    },
  };
}

function createRegionsGroup(
  environmentalLayers:
    GalacticMapEnvironmentalLayers,
): THREE.Group {

  const group =
    new THREE.Group();

  group.name =
    'galactic-map-regions-layer';

  const radii = [
    environmentalLayers
      .regionRadii
      .centralOuterRadiusNormalized,
    environmentalLayers
      .regionRadii
      .innerOuterRadiusNormalized,
    environmentalLayers
      .regionRadii
      .middleOuterRadiusNormalized,
    environmentalLayers
      .regionRadii
      .nominalOuterRadiusNormalized,
  ] as const;

  const names = [
    'central',
    'inner',
    'middle',
    'outer',
  ] as const;

  for (
    let index =
      0;
    index <
      radii.length;
    index +=
      1
  ) {
    const radius =
      radii[
        index
      ];

    const geometry =
      new THREE.BufferGeometry();

    const positions =
      new Float32Array(
        REGION_SEGMENTS *
        3,
      );

    for (
      let segment =
        0;
      segment <
        REGION_SEGMENTS;
      segment +=
        1
    ) {
      const angle =
        segment /
        REGION_SEGMENTS *
        Math.PI *
        2;

      const offset =
        segment *
        3;

      positions[
        offset
      ] =
        Math.cos(
          angle,
        ) *
        radius;

      positions[
        offset +
        1
      ] =
        Math.sin(
          angle,
        ) *
        radius;

      positions[
        offset +
        2
      ] =
        REGION_Z_OFFSET;
    }

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
          REGION_COLOR,
        transparent:
          true,
        opacity:
          REGION_OPACITY,
        depthTest:
          false,
        depthWrite:
          false,
        toneMapped:
          false,
      });

    const ring =
      new THREE.LineLoop(
        geometry,
        material,
      );

    ring.name =
      `galactic-map-region-${names[index]}`;

    ring.renderOrder =
      REGION_RENDER_ORDER;

    group.add(
      ring,
    );
  }

  return group;
}

function createHabitabilityGroup(
  environmentalLayers:
    GalacticMapEnvironmentalLayers,
): THREE.Group {

  const group =
    new THREE.Group();

  group.name =
    'galactic-map-habitable-zone-layer';

  for (
    let index =
      0;
    index <
      environmentalLayers
        .habitabilityRings
        .length;
    index +=
      1
  ) {
    const ring =
      environmentalLayers
        .habitabilityRings[
          index
        ];

    const geometry =
      new THREE.RingGeometry(
        ring.innerRadiusNormalized,
        ring.outerRadiusNormalized,
        REGION_SEGMENTS,
        1,
      );

    const isHighPotential =
      ring.band ===
      GalacticHabitabilityBand
        .HIGH_POTENTIAL;

    const material =
      new THREE.MeshBasicMaterial({
        color:
          isHighPotential
            ? HABITABLE_HIGH_COLOR
            : HABITABLE_FAVORED_COLOR,
        transparent:
          true,
        opacity:
          isHighPotential
            ? HABITABLE_HIGH_OPACITY
            : HABITABLE_FAVORED_OPACITY,
        side:
          THREE.DoubleSide,
        depthTest:
          false,
        depthWrite:
          false,
        blending:
          THREE.NormalBlending,
        toneMapped:
          false,
      });

    const mesh =
      new THREE.Mesh(
        geometry,
        material,
      );

    mesh.position.z =
      HABITABLE_Z_OFFSET;

    mesh.name =
      `galactic-map-habitable-zone-ring-${index}`;

    mesh.renderOrder =
      HABITABLE_RENDER_ORDER;

    group.add(
      mesh,
    );
  }

  return group;
}

function disposeMaterial(
  material:
    THREE.Material |
    readonly THREE.Material[],
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

  (
    material as
      THREE.Material
  ).dispose();
}
