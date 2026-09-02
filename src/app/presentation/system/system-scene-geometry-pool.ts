import * as THREE from 'three';

import {
  systemSceneBodyLodSegmentsV1,
  type SystemSceneBodyLodKindV1,
  type SystemSceneBodyLodLevelV1,
} from './system-scene-lod';

/** Shared unit-sphere geometry pool for point 25.11 dynamic LOD. */
export class SystemSceneSphereGeometryPoolV1 {
  private readonly geometries = new Map<string, THREE.SphereGeometry>();
  private disposed = false;

  get(
    kind: SystemSceneBodyLodKindV1,
    level: SystemSceneBodyLodLevelV1,
  ): THREE.SphereGeometry {
    if (this.disposed) {
      throw new Error('SystemSceneSphereGeometryPoolV1 has been disposed.');
    }

    const key = `${kind}:${level}`;
    const existing = this.geometries.get(key);
    if (existing !== undefined) {
      return existing;
    }

    const segments = systemSceneBodyLodSegmentsV1(kind, level);
    const geometry = new THREE.SphereGeometry(
      1,
      segments.widthSegments,
      segments.heightSegments,
    );
    geometry.name = `GENESIS 25.11 shared ${kind} sphere ${level}`;
    this.geometries.set(key, geometry);
    return geometry;
  }

  size(): number {
    return this.geometries.size;
  }

  dispose(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    for (const geometry of this.geometries.values()) {
      geometry.dispose();
    }
    this.geometries.clear();
  }
}
