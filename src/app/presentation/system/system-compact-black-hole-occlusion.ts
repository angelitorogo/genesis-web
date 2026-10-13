import * as THREE from 'three';

/**
 * 31.4i.1 — The laboratory BH uses deliberately depth-independent transparent
 * layers (renderOrder 1..20) to preserve its canonical sphere/disk silhouette.
 * In SystemScene, all orbiting solid bodies (planets, moons and minor bodies)
 * need camera-depth-dependent compositing. Never change the laboratory shaders
 * or physical orbits.
 */
export interface CompactBlackHoleBodyOcclusionBinding {
  readonly body: THREE.Group;
  readonly drawables: readonly {
    readonly mesh: THREE.Mesh;
    readonly originalRenderOrder: number;
  }[];
  /** Scratch allocated once, never once per animation frame. */
  readonly scratch: {
    readonly bodyWorld: THREE.Vector3;
    readonly blackHoleWorld: THREE.Vector3;
    readonly cameraForward: THREE.Vector3;
  };
}

/** Prepare once, AFTER actual meshes exist. Opaque body surfaces would
 * otherwise draw in Three.js's opaque queue BEFORE all transparent BH layers,
 * regardless of renderOrder. Full-opacity transparent materials preserve the
 * original shaders, lighting, depth test and depth write. */
export function prepareCompactBlackHoleBodyOcclusion(
  body: THREE.Group,
): CompactBlackHoleBodyOcclusionBinding {
  const drawables: Array<{
    readonly mesh: THREE.Mesh;
    readonly originalRenderOrder: number;
  }> = [];

  body.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    drawables.push({ mesh: object, originalRenderOrder: object.renderOrder });
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      if (!material.transparent) {
        material.transparent = true;
        material.needsUpdate = true;
      }
      // Do not disable depthTest/depthWrite: the planet and its overlays
      // retain their internal occlusion, shadows and original shaders.
    }
  });

  return {
    body,
    drawables,
    scratch: {
      bodyWorld: new THREE.Vector3(),
      blackHoleWorld: new THREE.Vector3(),
      cameraForward: new THREE.Vector3(),
    },
  };
}

/** Update whenever the camera moves OR a body orbits. The BH disk faces
 * the camera, so camera-space depth relative to the BH center is the correct
 * ordering criterion for the deliberately layered laboratory illustration.
 * Body in front => draw after all BH layers (max order 20).
 * Body behind => draw before all BH layers (min order 1).
 * The per-pixel depth buffer still resolves the body's own surface/layers.
 */
export function updateCompactBlackHoleBodyOcclusion(
  binding: CompactBlackHoleBodyOcclusionBinding,
  blackHole: THREE.Object3D,
  camera: THREE.Camera,
): void {
  const bodyWorld = binding.body.getWorldPosition(binding.scratch.bodyWorld);
  const blackHoleWorld = blackHole.getWorldPosition(binding.scratch.blackHoleWorld);
  const cameraForward = camera.getWorldDirection(binding.scratch.cameraForward);
  const isInFront = bodyWorld.sub(blackHoleWorld).dot(cameraForward) < 0;
  const renderBase = isInFront ? 21 : 0;

  for (const { mesh, originalRenderOrder } of binding.drawables) {
    // Respect the ordering between surface, clouds and atmospheric shell.
    // The original order (e.g. atmosphere=4) is only remapped for BH bodies.
    mesh.renderOrder = renderBase + Math.min(Math.max(originalRenderOrder, 0), 9) * 0.01;
  }
}

/** 31.4i backwards-compatible planet API for existing oriented regression tests. */
export type CompactBlackHolePlanetOcclusionBinding = CompactBlackHoleBodyOcclusionBinding;
export const prepareCompactBlackHolePlanetOcclusion = prepareCompactBlackHoleBodyOcclusion;
export const updateCompactBlackHolePlanetOcclusion = updateCompactBlackHoleBodyOcclusion;
