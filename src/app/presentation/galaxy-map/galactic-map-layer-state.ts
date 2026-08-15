export const GalacticMapLayerId =
  Object.freeze({
    SYSTEMS:
      'systems',

    NEBULAE:
      'nebulae',

    STAR_CLUSTERS:
      'starClusters',

    EXTREME_OBJECTS:
      'extremeObjects',

    REGIONS:
      'regions',

    HABITABLE_ZONE:
      'habitableZone',
  } as const);

export type GalacticMapLayerId =
  typeof GalacticMapLayerId[
    keyof typeof GalacticMapLayerId
  ];

export interface GalacticMapLayerVisibility {
  readonly systems:
    boolean;

  readonly nebulae:
    boolean;

  readonly starClusters:
    boolean;

  readonly extremeObjects:
    boolean;

  readonly regions:
    boolean;

  readonly habitableZone:
    boolean;
}

/**
 * Point-10.5 default thematic-layer state.
 *
 * All six roadmap layers start visible so the feature is immediately
 * inspectable. The sector-coverage grid from 10.3 and the renderer particle
 * cloud from 10.1 are deliberately outside this state and remain independent.
 */
export const INITIAL_GALACTIC_MAP_LAYER_VISIBILITY:
  GalacticMapLayerVisibility =
  Object.freeze({
    systems:
      true,

    nebulae:
      true,

    starClusters:
      true,

    extremeObjects:
      true,

    regions:
      true,

    habitableZone:
      true,
  });

export function withGalacticMapLayerVisibility(
  current:
    GalacticMapLayerVisibility,

  layerId:
    GalacticMapLayerId,

  visible:
    boolean,
): GalacticMapLayerVisibility {

  if (
    !Object.values(
      GalacticMapLayerId,
    ).includes(
      layerId,
    )
  ) {
    throw new RangeError(
      `Unknown GalacticMapLayerId: ${String(layerId)}.`,
    );
  }

  return Object.freeze({
    ...current,
    [layerId]:
      visible,
  });
}
