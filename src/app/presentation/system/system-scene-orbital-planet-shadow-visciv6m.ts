import * as THREE from 'three';

/**
 * VISCIV.6m — Deterministic, purely visual planetary eclipses of artificial rings.
 * Directions point FROM the planet TO each star (world space), as in VISCIV.6g.
 * The planet is a sphere at the origin of the ring's parent; no shadow maps,
 * shadow casters, physics state, IndexedDB, or new light sources are required.
 */
export interface OrbitalPlanetShadowSourceVISCIV6m {
  readonly direction: THREE.Vector3;
  readonly weight: number;
}

export interface OrbitalPlanetShadowBatchVISCIV6m {
  readonly mesh: THREE.InstancedMesh;
  /** Static instance centres in the ring's rotationPivot coordinates. */
  readonly centres: readonly THREE.Vector3[];
}

export interface OrbitalPlanetShadowVISCIV6m {
  readonly planetRadiusScene: number;
  readonly batches: readonly OrbitalPlanetShadowBatchVISCIV6m[];
  /** VISCIV.6o: per-ring scratch objects reused every frame, never persisted. */
  readonly scratchVISCIV6o?: Readonly<{
    planetWorld: THREE.Vector3;
    point: THREE.Vector3;
    multiplier: THREE.Color;
    sources: THREE.Vector4[];
  }>;
}

/**
 * Sun-to-object ray against a sphere, with a short, symmetric penumbra.
 * 0 = complete occlusion, 1 = direct starlight. No directional ambiguity:
 * rays are traced from the orbital segment TOWARD the star.
 */
export function planetShadowTransmissionVISCIV6m(
  planetCentredPoint: THREE.Vector3,
  directionToStar: THREE.Vector3,
  planetRadius: number,
): number {
  const lenSq = directionToStar.lengthSq();
  if (!(planetRadius > 0) || !Number.isFinite(planetRadius)
    || !(lenSq > 1e-12) || !Number.isFinite(lenSq)) return 1;
  const invLen = 1 / Math.sqrt(lenSq);
  return transmissionForUnitStarVISCIV6m(
    planetCentredPoint.x, planetCentredPoint.y, planetCentredPoint.z,
    directionToStar.x * invLen, directionToStar.y * invLen, directionToStar.z * invLen,
    planetRadius,
  );
}

function transmissionForUnitStarVISCIV6m(
  x: number, y: number, z: number,
  sx: number, sy: number, sz: number,
  radius: number,
): number {
  const towardStar = x * sx + y * sy + z * sz;
  // A planet cannot eclipse a ring segment on its star-facing side.
  if (towardStar >= 0) return 1;
  const impactSquared = Math.max(0, x * x + y * y + z * z - towardStar * towardStar);
  const impact = Math.sqrt(impactSquared);
  const halfPenumbra = radius * 0.045;
  const t = THREE.MathUtils.clamp((impact - radius + halfPenumbra) / (2 * halfPenumbra), 0, 1);
  // The smoothstep edge hides segmentation without changing the orbital geometry.
  return t * t * (3 - 2 * t);
}

/**
 * Collect STATIC, opaque ring constructions only. Moving VISCIV.6k traffic and
 * VISCIV.6g/6j artificial lights intentionally remain outside this shadow pass.
 * No material is modified: per-instance white multipliers are initially neutral.
 */
export function createOrbitalPlanetShadowVISCIV6m(
  ringRoot: THREE.Group,
  rotationPivot: THREE.Group,
  planetRadiusScene: number,
  movingTrafficGroup: THREE.Group,
): OrbitalPlanetShadowVISCIV6m {
  ringRoot.updateWorldMatrix(true, true);
  const pivotInverse = rotationPivot.matrixWorld.clone().invert();
  const instanceMatrix = new THREE.Matrix4();
  const centre = new THREE.Vector3();
  const white = new THREE.Color(1, 1, 1);
  const batches: OrbitalPlanetShadowBatchVISCIV6m[] = [];

  rotationPivot.traverse(object => {
    if (!(object instanceof THREE.InstancedMesh)
      || !(object.material instanceof THREE.MeshStandardMaterial)) return;
    // Exclusion by ancestry rather than a name or material colour.
    let ancestor: THREE.Object3D | null = object;
    while (ancestor) {
      if (ancestor === movingTrafficGroup) return;
      ancestor = ancestor.parent;
    }
    const centres: THREE.Vector3[] = [];
    for (let i = 0; i < object.count; i++) {
      object.getMatrixAt(i, instanceMatrix);
      centre.setFromMatrixPosition(instanceMatrix)
        .applyMatrix4(object.matrixWorld)
        .applyMatrix4(pivotInverse);
      centres.push(centre.clone());
      object.setColorAt(i, white);
    }
    if (object.instanceColor) {
      object.instanceColor.setUsage(THREE.DynamicDrawUsage);
      object.instanceColor.needsUpdate = true;
    }
    batches.push(Object.freeze({ mesh: object, centres: Object.freeze(centres) }));
  });
  return Object.freeze({
    planetRadiusScene, batches: Object.freeze(batches),
    scratchVISCIV6o: {
      planetWorld: new THREE.Vector3(), point: new THREE.Vector3(),
      multiplier: new THREE.Color(), sources: [],
    },
  });
}

/**
 * Update opaque ring elements in place, after the existing material colour pass.
 * One matrix transform and up to three short ray/sphere checks per instance.
 * Weighted multistar transmission means the other suns can still light a segment.
 * No GPU resources, geometries, textures or light objects allocated per frame.
 */
export function updateOrbitalPlanetShadowVISCIV6m(
  shadow: OrbitalPlanetShadowVISCIV6m,
  ringRoot: THREE.Group,
  rotationPivot: THREE.Group,
  stellarSources: readonly OrbitalPlanetShadowSourceVISCIV6m[],
): void {
  ringRoot.updateWorldMatrix(true, false);
  rotationPivot.updateWorldMatrix(true, false);
  // Reuse per-ring scratch buffers: no transient arrays/colours/vectors each frame.
  // The optional fallback permits existing manually-constructed test bindings.
  const scratch = shadow.scratchVISCIV6o ?? {
    planetWorld: new THREE.Vector3(), point: new THREE.Vector3(),
    multiplier: new THREE.Color(), sources: [] as THREE.Vector4[],
  };
  const sources = scratch.sources;
  let sourceCount = 0;
  let totalWeight = 0;
  for (const star of stellarSources) {
    const lenSq = star.direction.lengthSq();
    if (!(star.weight > 0) || !Number.isFinite(star.weight)
      || !(lenSq > 1e-12) || !Number.isFinite(lenSq)) continue;
    const invLength = 1 / Math.sqrt(lenSq);
    if (!sources[sourceCount]) sources[sourceCount] = new THREE.Vector4();
    sources[sourceCount]!.set(
      star.direction.x * invLength,
      star.direction.y * invLength,
      star.direction.z * invLength,
      star.weight,
    );
    sourceCount += 1;
    totalWeight += star.weight;
  }
  const planetWorld = ringRoot.getWorldPosition(scratch.planetWorld);
  const point = scratch.point;
  const multiplier = scratch.multiplier;
  const radius = shadow.planetRadiusScene;
  for (const batch of shadow.batches) {
    for (let i = 0; i < batch.centres.length; i++) {
      point.copy(batch.centres[i]!).applyMatrix4(rotationPivot.matrixWorld).sub(planetWorld);
      let transmission = totalWeight > 0 ? 0 : 1;
      if (totalWeight > 0) {
        for (let sourceIndex = 0; sourceIndex < sourceCount; sourceIndex++) {
          const source = sources[sourceIndex]!;
          transmission += source.w * transmissionForUnitStarVISCIV6m(
            point.x, point.y, point.z, source.x, source.y, source.z, radius,
          );
        }
        transmission /= totalWeight;
      }
      // Small diffuse fill keeps the metal silhouette legible inside umbra;
      // emissive windows and architectural lights are never darkened here.
      const light = 0.09 + 0.91 * transmission;
      batch.mesh.setColorAt(i, multiplier.setRGB(light, light, light));
    }
    if (batch.mesh.instanceColor) batch.mesh.instanceColor.needsUpdate = true;
  }
}
