import * as THREE from 'three';

import {
  type SystemSceneAsteroidPresentationV1,
} from './system-scene-asteroid-presentation';

export interface SystemSceneAsteroidRenderableV1 {
  readonly object: THREE.Group;
  readonly resources: readonly { dispose(): void }[];
  readonly lobeCount: number;
}

export interface SystemSceneAsteroidLobeLayoutV1 {
  readonly radiusScale: number;
  readonly offsetXScale: number;
  readonly offsetYScale: number;
  readonly offsetZScale: number;
  readonly seedSalt: number;
}

/**
 * Point-25.7 visual geometry for a relevant asteroid.
 *
 * The source radius remains the renderer's presentation radius. Multiplicity
 * changes only the arrangement of one/two irregular lobes inside a bounded
 * local envelope. Detached mutual orbital phase is intentionally not animated
 * because phase 22.4 freezes separation/mass ratio but no binary orbital epoch.
 */
export function createSystemSceneAsteroidRenderableV1(
  radiusScene: number,
  presentation: SystemSceneAsteroidPresentationV1,
): SystemSceneAsteroidRenderableV1 {
  if (!Number.isFinite(radiusScene) || radiusScene <= 0) {
    throw new RangeError('Asteroid renderer radiusScene must be positive and finite.');
  }
  if (presentation.version !== 1) {
    throw new RangeError(`Unsupported asteroid presentation version: ${presentation.version}.`);
  }

  const object = new THREE.Group();
  object.name = 'GENESIS irregular asteroid 25.7';
  object.rotation.set(
    presentation.presentationOrientationXRadians,
    presentation.presentationOrientationYRadians,
    presentation.presentationOrientationZRadians,
  );

  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: presentation.presentationRoughness01,
    metalness: presentation.presentationMetalness01,
    vertexColors: true,
    // Even fractured/rubble-pile bodies keep a rounded spheroidal silhouette.
    // Surface relief provides irregularity without exposing polygon facets.
    flatShading: false,
  });
  material.name = `GENESIS asteroid material 25.7 ${presentation.compositionRegime}`;

  const resources: Array<{ dispose(): void }> = [material];
  const layout = buildSystemSceneAsteroidLobeLayoutV1(presentation);

  for (const lobe of layout) {
    const geometry = createIrregularAsteroidGeometryV1(
      radiusScene * lobe.radiusScale,
      presentation,
      lobe.seedSalt,
    );
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(
      radiusScene * lobe.offsetXScale,
      radiusScene * lobe.offsetYScale,
      radiusScene * lobe.offsetZScale,
    );
    mesh.rotation.set(
      signedSeedUnit(presentation.shapeSeedUint32, lobe.seedSalt + 31) * 0.45,
      seedUnit(presentation.shapeSeedUint32, lobe.seedSalt + 37) * Math.PI * 2,
      signedSeedUnit(presentation.shapeSeedUint32, lobe.seedSalt + 41) * 0.45,
    );
    object.add(mesh);
    resources.push(geometry);
  }

  return Object.freeze({
    object,
    resources: Object.freeze(resources),
    lobeCount: layout.length,
  });
}

export function buildSystemSceneAsteroidLobeLayoutV1(
  presentation: SystemSceneAsteroidPresentationV1,
): readonly SystemSceneAsteroidLobeLayoutV1[] {
  if (presentation.multiplicityRegime === 'SINGLE') {
    return Object.freeze([
      Object.freeze({
        radiusScale: 0.86,
        offsetXScale: 0,
        offsetYScale: 0,
        offsetZScale: 0,
        seedSalt: 101,
      }),
    ]);
  }

  if (presentation.multiplicityRegime === 'CONTACT_BINARY') {
    const secondary = presentation.presentationContactSecondaryRadiusScale01 ?? 0.68;
    const primaryRadius = 0.58;
    const secondaryRadius = primaryRadius * secondary;
    const separation = (primaryRadius + secondaryRadius) * 0.82;
    const primaryOffset = -separation * secondaryRadius / (primaryRadius + secondaryRadius);
    const secondaryOffset = separation * primaryRadius / (primaryRadius + secondaryRadius);

    return Object.freeze([
      Object.freeze({
        radiusScale: primaryRadius,
        offsetXScale: primaryOffset,
        offsetYScale: 0.035,
        offsetZScale: -0.025,
        seedSalt: 211,
      }),
      Object.freeze({
        radiusScale: secondaryRadius,
        offsetXScale: secondaryOffset,
        offsetYScale: -0.025,
        offsetZScale: 0.035,
        seedSalt: 307,
      }),
    ]);
  }

  const secondary = presentation.presentationDetachedSecondaryRadiusScale01 ?? 0.55;
  const normalizedSeparation = presentation.presentationDetachedSeparation01 ?? 0.76;
  const primaryRadius = 0.34;
  const secondaryRadius = primaryRadius * secondary;
  const separation = 0.48 + normalizedSeparation * 0.34;
  const primaryOffset = -separation * secondary / (1 + secondary);
  const secondaryOffset = separation / (1 + secondary);

  return Object.freeze([
    Object.freeze({
      radiusScale: primaryRadius,
      offsetXScale: primaryOffset,
      offsetYScale: 0.025,
      offsetZScale: 0,
      seedSalt: 401,
    }),
    Object.freeze({
      radiusScale: secondaryRadius,
      offsetXScale: secondaryOffset,
      offsetYScale: -0.025,
      offsetZScale: 0,
      seedSalt: 503,
    }),
  ]);
}

export function createIrregularAsteroidGeometryV1(
  radiusScene: number,
  presentation: SystemSceneAsteroidPresentationV1,
  seedSalt = 0,
): THREE.BufferGeometry {
  // Start from a smooth sphere rather than a low-detail icosahedron. Asteroids
  // remain non-perfect spheroids through deterministic axis scaling and radial
  // relief, but their silhouette must never read as an obvious polyhedron.
  const geometry = new THREE.SphereGeometry(
    radiusScene,
    32,
    20,
  );

  const positions = geometry.getAttribute('position') as THREE.BufferAttribute;
  const colors = new Float32Array(positions.count * 3);
  const baseColor = new THREE.Color(presentation.presentationColorHex);
  const irregularity = presentation.presentationIrregularity01;
  const facetContrast = presentation.presentationFacetContrast01;

  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index);
    const y = positions.getY(index);
    const z = positions.getZ(index);
    const length = Math.max(Math.sqrt(x * x + y * y + z * z), Number.EPSILON);
    const nx = x / length;
    const ny = y / length;
    const nz = z / length;

    const radial = asteroidDirectionalRadiusFactorV1(
      nx,
      ny,
      nz,
      presentation.shapeSeedUint32,
      seedSalt,
      irregularity,
    );

    positions.setXYZ(
      index,
      nx * radiusScene * radial * presentation.presentationAxisScaleX,
      ny * radiusScene * radial * presentation.presentationAxisScaleY,
      nz * radiusScene * radial * presentation.presentationAxisScaleZ,
    );

    const tonalNoise =
      directionalHarmonicNoise(
        nx,
        ny,
        nz,
        presentation.shapeSeedUint32,
        seedSalt + 701,
      );
    const brightness =
      0.86 +
      (tonalNoise * 0.5 + 0.5) * facetContrast * 0.34;
    colors[index * 3] = Math.min(1, baseColor.r * brightness);
    colors[index * 3 + 1] = Math.min(1, baseColor.g * brightness);
    colors[index * 3 + 2] = Math.min(1, baseColor.b * brightness);
  }

  positions.needsUpdate = true;
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  geometry.name = `GENESIS asteroid spheroidal irregular geometry 25.11 ${presentation.structureRegime}`;
  return geometry;
}

export function asteroidDirectionalRadiusFactorV1(
  nx: number,
  ny: number,
  nz: number,
  seed: number,
  salt: number,
  irregularity01: number,
): number {
  const low = directionalHarmonicNoise(nx, ny, nz, seed, salt + 3);
  const medium = directionalHarmonicNoise(nx * 1.9, ny * 1.9, nz * 1.9, seed, salt + 7);
  const high = directionalHarmonicNoise(nx * 3.7, ny * 3.7, nz * 3.7, seed, salt + 13);
  const combined = low * 0.56 + medium * 0.30 + high * 0.14;
  return clamp(
    1 + combined * irregularity01 * 0.22,
    0.84,
    1.16,
  );
}

function directionalHarmonicNoise(
  x: number,
  y: number,
  z: number,
  seed: number,
  salt: number,
): number {
  const phaseA = seedUnit(seed, salt + 1) * Math.PI * 2;
  const phaseB = seedUnit(seed, salt + 2) * Math.PI * 2;
  const phaseC = seedUnit(seed, salt + 3) * Math.PI * 2;
  const a = Math.sin(x * 4.31 + y * 1.77 - z * 2.21 + phaseA);
  const b = Math.sin(-x * 2.67 + y * 5.13 + z * 1.91 + phaseB);
  const c = Math.cos(x * 1.53 - y * 2.87 + z * 5.47 + phaseC);
  return clamp((a + b + c) / 3, -1, 1);
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
