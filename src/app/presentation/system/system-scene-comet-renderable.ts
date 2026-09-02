import * as THREE from 'three';

import {
  type SystemSceneCometActivityPresentationV1,
  type SystemSceneCometPresentationV1,
} from './system-scene-comet-presentation';

export interface SystemSceneCometActivityBindingV1 {
  readonly comaInner: THREE.Mesh;
  readonly comaOuter: THREE.Mesh;
  readonly dustTail: THREE.Mesh;
  readonly ionTail: THREE.Mesh;
}

export interface SystemSceneCometRenderableV1 {
  readonly object: THREE.Group;
  readonly binding: SystemSceneCometActivityBindingV1;
  readonly resources: readonly { dispose(): void }[];
}

const POSITIVE_X = new THREE.Vector3(1, 0, 0);

/** Point-25.8 nucleus + dynamic coma/tail presentation resources. */
export function createSystemSceneCometRenderableV1(
  radiusScene: number,
  presentation: SystemSceneCometPresentationV1,
): SystemSceneCometRenderableV1 {
  if (!Number.isFinite(radiusScene) || radiusScene <= 0) {
    throw new RangeError('Comet renderer radiusScene must be positive and finite.');
  }
  if (presentation.version !== 1) {
    throw new RangeError(`Unsupported comet presentation version: ${presentation.version}.`);
  }

  const object = new THREE.Group();
  object.name = 'GENESIS comet nucleus + activity 25.8';

  const nucleusGeometry = createIrregularCometNucleusGeometryV1(
    radiusScene,
    presentation,
  );
  const nucleusMaterial = new THREE.MeshStandardMaterial({
    color: presentation.presentationNucleusColorHex,
    roughness: presentation.presentationNucleusRoughness01,
    metalness: 0.005,
    flatShading: true,
  });
  nucleusMaterial.name = 'GENESIS comet nucleus material 25.8';
  const nucleus = new THREE.Mesh(nucleusGeometry, nucleusMaterial);
  nucleus.rotation.set(
    signedSeedUnit(presentation.shapeSeedUint32, 101) * 0.55,
    seedUnit(presentation.shapeSeedUint32, 103) * Math.PI * 2,
    signedSeedUnit(presentation.shapeSeedUint32, 107) * 0.55,
  );
  object.add(nucleus);

  const comaInnerGeometry = new THREE.SphereGeometry(radiusScene, 20, 14);
  const comaOuterGeometry = new THREE.SphereGeometry(radiusScene, 20, 14);
  const comaInnerMaterial = new THREE.MeshBasicMaterial({
    color: presentation.presentationComaColorHex,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  });
  const comaOuterMaterial = new THREE.MeshBasicMaterial({
    color: presentation.presentationComaColorHex,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.BackSide,
    toneMapped: false,
  });
  const comaInner = new THREE.Mesh(comaInnerGeometry, comaInnerMaterial);
  const comaOuter = new THREE.Mesh(comaOuterGeometry, comaOuterMaterial);
  comaInner.name = 'GENESIS comet inner coma 25.8';
  comaOuter.name = 'GENESIS comet outer coma 25.8';
  comaInner.visible = false;
  comaOuter.visible = false;
  object.add(comaInner, comaOuter);

  const dustTailGeometry = createTailGeometryV1(1, 0.07, 0.42, 14);
  const dustTailMaterial = new THREE.MeshBasicMaterial({
    color: presentation.presentationDustTailColorHex,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  const dustTail = new THREE.Mesh(dustTailGeometry, dustTailMaterial);
  dustTail.name = 'GENESIS comet dust tail 25.8';
  dustTail.visible = false;
  object.add(dustTail);

  const ionTailGeometry = createTailGeometryV1(1, 0.035, 0.075, 10);
  const ionTailMaterial = new THREE.MeshBasicMaterial({
    color: presentation.presentationIonTailColorHex,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  const ionTail = new THREE.Mesh(ionTailGeometry, ionTailMaterial);
  ionTail.name = 'GENESIS comet ion tail 25.8';
  ionTail.visible = false;
  object.add(ionTail);

  const binding = Object.freeze({
    comaInner,
    comaOuter,
    dustTail,
    ionTail,
  });

  return Object.freeze({
    object,
    binding,
    resources: Object.freeze([
      nucleusGeometry,
      nucleusMaterial,
      comaInnerGeometry,
      comaOuterGeometry,
      comaInnerMaterial,
      comaOuterMaterial,
      dustTailGeometry,
      dustTailMaterial,
      ionTailGeometry,
      ionTailMaterial,
    ]),
  });
}

export function applySystemSceneCometActivityVisualV1(
  binding: SystemSceneCometActivityBindingV1,
  activity: SystemSceneCometActivityPresentationV1,
  antiStellarDirectionLocal: THREE.Vector3,
): void {
  const direction = antiStellarDirectionLocal.clone();
  if (direction.lengthSq() < 1e-12) {
    direction.set(1, 0, 0);
  } else {
    direction.normalize();
  }

  binding.comaInner.visible = activity.hasComa;
  binding.comaOuter.visible = activity.hasComa;
  binding.comaInner.scale.setScalar(
    Math.max(1, activity.presentationComaRadiusScale * 0.58),
  );
  binding.comaOuter.scale.setScalar(
    Math.max(1, activity.presentationComaRadiusScale),
  );
  (binding.comaInner.material as THREE.MeshBasicMaterial).opacity =
    activity.presentationComaOpacity01;
  (binding.comaOuter.material as THREE.MeshBasicMaterial).opacity =
    activity.presentationComaOpacity01 * 0.42;

  binding.dustTail.visible = activity.hasDustTail;
  binding.dustTail.quaternion.setFromUnitVectors(POSITIVE_X, direction);
  binding.dustTail.scale.set(
    activity.presentationDustTailLengthScene,
    activity.presentationDustTailWidthScene,
    activity.presentationDustTailWidthScene,
  );
  (binding.dustTail.material as THREE.MeshBasicMaterial).opacity =
    activity.presentationDustTailOpacity01;

  binding.ionTail.visible = activity.hasIonTail;
  binding.ionTail.quaternion.setFromUnitVectors(POSITIVE_X, direction);
  binding.ionTail.scale.set(
    activity.presentationIonTailLengthScene,
    activity.presentationIonTailWidthScene,
    activity.presentationIonTailWidthScene,
  );
  (binding.ionTail.material as THREE.MeshBasicMaterial).opacity =
    activity.presentationIonTailOpacity01;
}

export function createIrregularCometNucleusGeometryV1(
  radiusScene: number,
  presentation: SystemSceneCometPresentationV1,
): THREE.BufferGeometry {
  const source = new THREE.IcosahedronGeometry(radiusScene, 2);
  const geometry = source.index === null ? source : source.toNonIndexed();
  if (geometry !== source) {
    source.dispose();
  }

  const positions = geometry.getAttribute('position') as THREE.BufferAttribute;
  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index);
    const y = positions.getY(index);
    const z = positions.getZ(index);
    const length = Math.max(Math.sqrt(x * x + y * y + z * z), Number.EPSILON);
    const nx = x / length;
    const ny = y / length;
    const nz = z / length;
    const radial = cometDirectionalRadiusFactorV1(
      nx,
      ny,
      nz,
      presentation.shapeSeedUint32,
      presentation.presentationNucleusIrregularity01,
    );

    positions.setXYZ(
      index,
      nx * radiusScene * radial * presentation.presentationNucleusAxisScaleX,
      ny * radiusScene * radial * presentation.presentationNucleusAxisScaleY,
      nz * radiusScene * radial * presentation.presentationNucleusAxisScaleZ,
    );
  }

  positions.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  geometry.name = 'GENESIS irregular comet nucleus geometry 25.8';
  return geometry;
}

export function cometDirectionalRadiusFactorV1(
  nx: number,
  ny: number,
  nz: number,
  seed: number,
  irregularity01: number,
): number {
  const low = harmonicNoise(nx, ny, nz, seed, 17);
  const medium = harmonicNoise(nx * 2.1, ny * 2.1, nz * 2.1, seed, 31);
  const high = harmonicNoise(nx * 4.2, ny * 4.2, nz * 4.2, seed, 47);
  return clamp(
    1 + (low * 0.58 + medium * 0.29 + high * 0.13) * irregularity01 * 0.44,
    0.70,
    1.30,
  );
}

function createTailGeometryV1(
  length: number,
  narrowRadius: number,
  broadRadius: number,
  radialSegments: number,
): THREE.BufferGeometry {
  const geometry = new THREE.CylinderGeometry(
    narrowRadius,
    broadRadius,
    length,
    radialSegments,
    1,
    true,
  );
  geometry.rotateZ(Math.PI / 2);
  geometry.translate(length / 2, 0, 0);
  return geometry;
}

function harmonicNoise(
  x: number,
  y: number,
  z: number,
  seed: number,
  salt: number,
): number {
  const phaseA = seedUnit(seed, salt + 1) * Math.PI * 2;
  const phaseB = seedUnit(seed, salt + 2) * Math.PI * 2;
  const phaseC = seedUnit(seed, salt + 3) * Math.PI * 2;
  return clamp(
    (
      Math.sin(x * 4.17 + y * 1.83 - z * 2.29 + phaseA) +
      Math.sin(-x * 2.73 + y * 5.07 + z * 1.97 + phaseB) +
      Math.cos(x * 1.61 - y * 2.79 + z * 5.31 + phaseC)
    ) / 3,
    -1,
    1,
  );
}

function seedUnit(seed: number, salt: number): number {
  let hash = seed ^ Math.imul(salt, 0x9e3779b9);
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x85ebca6b);
  hash ^= hash >>> 13;
  hash = Math.imul(hash, 0xc2b2ae35);
  hash ^= hash >>> 16;
  return (hash >>> 0) / 0xffffffff;
}

function signedSeedUnit(seed: number, salt: number): number {
  return seedUnit(seed, salt) * 2 - 1;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}
