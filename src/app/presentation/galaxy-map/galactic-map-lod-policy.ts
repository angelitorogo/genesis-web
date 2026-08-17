export const GalacticMapLodLevel =
  Object.freeze({
    OVERVIEW:
      'OVERVIEW',

    BALANCED:
      'BALANCED',

    DETAIL:
      'DETAIL',
  } as const);

export type GalacticMapLodLevel =
  typeof GalacticMapLodLevel[
    keyof typeof GalacticMapLodLevel
  ];

const DETAIL_MAX_CAMERA_DISTANCE =
  1.20;

const BALANCED_MAX_CAMERA_DISTANCE =
  2.60;

const OVERVIEW_PARTICLE_RETENTION_RATIO =
  0.88;

const BALANCED_PARTICLE_RETENTION_RATIO =
  0.96;

const DETAIL_PARTICLE_RETENTION_RATIO =
  1;

/**
 * Pure point-10.8/10.9 LOD policy shared by the main-thread camera resolver and
 * the Web Worker particle materializer. Keeping this module free of Three.js
 * allows the worker to reuse exactly the frozen retention contract.
 */
export function galacticMapLodForCameraDistance(
  cameraDistance:
    number,
): GalacticMapLodLevel {

  assertPositiveFinite(
    cameraDistance,
    'cameraDistance',
  );

  if (
    cameraDistance <=
      DETAIL_MAX_CAMERA_DISTANCE
  ) {
    return GalacticMapLodLevel
      .DETAIL;
  }

  if (
    cameraDistance <=
      BALANCED_MAX_CAMERA_DISTANCE
  ) {
    return GalacticMapLodLevel
      .BALANCED;
  }

  return GalacticMapLodLevel
    .OVERVIEW;
}

export function galacticMapParticleRetentionRatio(
  lodLevel:
    GalacticMapLodLevel,
): number {

  switch (
    lodLevel
  ) {
    case GalacticMapLodLevel.OVERVIEW:
      return OVERVIEW_PARTICLE_RETENTION_RATIO;

    case GalacticMapLodLevel.BALANCED:
      return BALANCED_PARTICLE_RETENTION_RATIO;

    case GalacticMapLodLevel.DETAIL:
      return DETAIL_PARTICLE_RETENTION_RATIO;
  }

  throw new RangeError(
    `Unsupported GalacticMapLodLevel: ${String(lodLevel)}.`,
  );
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
