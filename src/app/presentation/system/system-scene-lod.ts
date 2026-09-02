export type SystemSceneBodyLodKindV1 =
  | 'star'
  | 'planet'
  | 'moon';

export type SystemSceneBodyLodLevelV1 =
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH';

export interface SystemSceneBodyLodSegmentsV1 {
  readonly widthSegments: number;
  readonly heightSegments: number;
}

export function systemSceneProjectedDiameterPixelsV1(
  radiusScene: number,
  cameraDistanceScene: number,
  verticalFovDegrees: number,
  viewportHeightPixels: number,
): number {
  if (
    !Number.isFinite(radiusScene) || radiusScene <= 0 ||
    !Number.isFinite(cameraDistanceScene) || cameraDistanceScene <= 0 ||
    !Number.isFinite(verticalFovDegrees) || verticalFovDegrees <= 0 || verticalFovDegrees >= 179 ||
    !Number.isFinite(viewportHeightPixels) || viewportHeightPixels <= 0
  ) {
    throw new RangeError('LOD projection inputs must be finite and positive.');
  }

  const focalPixels =
    viewportHeightPixels /
    (2 * Math.tan(verticalFovDegrees * Math.PI / 360));
  return 2 * radiusScene * focalPixels / cameraDistanceScene;
}

/**
 * Point-25.11 projected-size LOD with a small hysteresis band so orbit/camera
 * motion near a threshold does not continually rebuild geometry bindings.
 */
export function systemSceneBodyLodLevelV1(
  projectedDiameterPixels: number,
  previous: SystemSceneBodyLodLevelV1 | null = null,
): SystemSceneBodyLodLevelV1 {
  if (!Number.isFinite(projectedDiameterPixels) || projectedDiameterPixels < 0) {
    throw new RangeError(`projectedDiameterPixels must be finite and non-negative: ${projectedDiameterPixels}.`);
  }

  const lowToMedium = previous === 'LOW' ? 24 : 20;
  const mediumToLow = previous === 'MEDIUM' ? 16 : 20;
  const mediumToHigh = previous === 'MEDIUM' ? 88 : 76;
  const highToMedium = previous === 'HIGH' ? 64 : 76;

  if (previous === 'LOW') {
    return projectedDiameterPixels >= lowToMedium ? 'MEDIUM' : 'LOW';
  }
  if (previous === 'HIGH') {
    return projectedDiameterPixels < highToMedium ? 'MEDIUM' : 'HIGH';
  }
  if (previous === 'MEDIUM') {
    if (projectedDiameterPixels < mediumToLow) {
      return 'LOW';
    }
    if (projectedDiameterPixels >= mediumToHigh) {
      return 'HIGH';
    }
    return 'MEDIUM';
  }

  if (projectedDiameterPixels < 20) {
    return 'LOW';
  }
  if (projectedDiameterPixels < 76) {
    return 'MEDIUM';
  }
  return 'HIGH';
}

export function systemSceneBodyLodSegmentsV1(
  kind: SystemSceneBodyLodKindV1,
  level: SystemSceneBodyLodLevelV1,
): SystemSceneBodyLodSegmentsV1 {
  const table: Record<SystemSceneBodyLodKindV1, Record<SystemSceneBodyLodLevelV1, SystemSceneBodyLodSegmentsV1>> = {
    star: {
      LOW: { widthSegments: 20, heightSegments: 14 },
      MEDIUM: { widthSegments: 32, heightSegments: 22 },
      HIGH: { widthSegments: 48, heightSegments: 32 },
    },
    planet: {
      LOW: { widthSegments: 16, heightSegments: 12 },
      MEDIUM: { widthSegments: 28, heightSegments: 20 },
      HIGH: { widthSegments: 40, heightSegments: 28 },
    },
    moon: {
      LOW: { widthSegments: 12, heightSegments: 8 },
      MEDIUM: { widthSegments: 20, heightSegments: 14 },
      HIGH: { widthSegments: 28, heightSegments: 20 },
    },
  };

  return Object.freeze(table[kind][level]);
}
