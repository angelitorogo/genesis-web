import * as THREE from 'three';

import {
  type SystemSceneAsteroidPresentationV1,
} from './system-scene-asteroid-presentation';
import { asteroidMineralNoiseV1, buildAsteroidTerrainV1, sampleAsteroidTerrainV1 } from './system-scene-asteroid-terrain';

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
  object.name = 'GENESIS asteroid A.1-A.6 procedural terrain';
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
  material.name = `GENESIS asteroid A.4 regolith material ${presentation.compositionRegime}`;

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

    // A.5: aggregate boulders belong only to an explicitly generated rubble
    // pile. Do not invent companions or change the stored SINGLE/BINARY state.
    if (presentation.structureRegime === 'RUBBLE_PILE') {
      const count = presentation.sourceDiameterKilometers < 50 ? 9 : 6;
      const baseBoulder = new THREE.Color(presentation.presentationColorHex);
      for (let i = 0; i < count; i++) {
        const salt = lobe.seedSalt + 1100 + i * 11;
        const z = signedSeedUnit(presentation.shapeSeedUint32, salt);
        const angle = seedUnit(presentation.shapeSeedUint32, salt + 1) * Math.PI * 2;
        const xy = Math.sqrt(Math.max(0, 1 - z * z));
        const dx = xy * Math.cos(angle);
        const dy = xy * Math.sin(angle);
        const scale = 0.065 + 0.065 * seedUnit(presentation.shapeSeedUint32, salt + 3);
        const fragment = new THREE.IcosahedronGeometry(radiusScene * lobe.radiusScale * scale, 1);
        const vertexCount = fragment.getAttribute('position').count;
        const color = baseBoulder.clone().multiplyScalar(
          0.68 + seedUnit(presentation.shapeSeedUint32, salt + 5) * 0.45,
        );
        const rgb = new Float32Array(vertexCount * 3);
        for (let vertex = 0; vertex < vertexCount; vertex++) {
          rgb[vertex * 3] = color.r;
          rgb[vertex * 3 + 1] = color.g;
          rgb[vertex * 3 + 2] = color.b;
        }
        fragment.setAttribute('color', new THREE.BufferAttribute(rgb, 3));
        const boulder = new THREE.Mesh(fragment, material);
        boulder.position.set(
          radiusScene * lobe.offsetXScale + dx * radiusScene * lobe.radiusScale * 0.91,
          radiusScene * lobe.offsetYScale + dy * radiusScene * lobe.radiusScale * 0.91,
          radiusScene * lobe.offsetZScale + z * radiusScene * lobe.radiusScale * 0.91,
        );
        boulder.rotation.set(angle, z, angle * 0.55);
        object.add(boulder);
        resources.push(fragment);
      }
    }
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
  // Same procedural terrain in SystemScene and scientific fiches; mesh
  // resolution alone is reduced for tiny on-screen SystemScene bodies.
  // No physical size or seeded feature is altered by this display-only LOD.
  const closeInspection = radiusScene >= 0.06;
  const geometry = new THREE.SphereGeometry(
    radiusScene, closeInspection ? 80 : 48, closeInspection ? 56 : 32,
  );
  const positions = geometry.getAttribute('position') as THREE.BufferAttribute;
  const colors = new Float32Array(positions.count * 3);
  const base = new THREE.Color(presentation.presentationColorHex);
  const terrain = buildAsteroidTerrainV1(presentation, seedSalt);
  const roundness = terrain.sizeRoundness01;
  const isRubble = presentation.structureRegime === 'RUBBLE_PILE';
  const metallic = presentation.compositionRegime === 'METALLIC';
  const carbonaceous = presentation.compositionRegime === 'CARBONACEOUS';
  const rocky = presentation.compositionRegime === 'SILICACEOUS';
  const weathered = new THREE.Color(
    metallic ? '#645a52' : carbonaceous ? '#77706a' : rocky ? '#9c7960' : '#7f8586',
  );
  const paleMineral = new THREE.Color(
    metallic ? '#b5aea0' : carbonaceous ? '#a5a19a' : rocky ? '#c2ac8e' : '#bbc0bf',
  );
  const pixelColor = new THREE.Color();
  const axisCompression = 0.45 + 0.55 * (1 - roundness);
  const reliefStrength = 0.92 - roundness * 0.20;

  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index);
    const y = positions.getY(index);
    const z = positions.getZ(index);
    const length = Math.max(Math.hypot(x, y, z), Number.EPSILON);
    const nx = x / length;
    const ny = y / length;
    const nz = z / length;
    const low = asteroidMineralNoiseV1(nx * 0.52, ny * 0.52, nz * 0.52, presentation.shapeSeedUint32, seedSalt + 21);
    const medium = asteroidMineralNoiseV1(nx * 1.7, ny * 1.7, nz * 1.7, presentation.shapeSeedUint32, seedSalt + 41);
    const fine = asteroidMineralNoiseV1(nx * 4.1, ny * 4.1, nz * 4.1, presentation.shapeSeedUint32, seedSalt + 61);
    const terrainSample = sampleAsteroidTerrainV1(nx, ny, nz, terrain);
    const shape = asteroidDirectionalRadiusFactorV1(nx, ny, nz,
      presentation.shapeSeedUint32, seedSalt, presentation.presentationIrregularity01);
    const coarse = (shape - 1) * (0.56 + (1 - roundness) * 1.15);
    const granular = (medium * 0.006 + fine * 0.004) * (isRubble ? 1.65 : 0.85);
    const radial = clamp(1 + coarse + granular + terrainSample.radialOffset * reliefStrength,
      roundness > 0.8 ? 0.86 : 0.75, roundness > 0.8 ? 1.11 : 1.22);
    const axisX = 1 + (presentation.presentationAxisScaleX - 1) * axisCompression;
    const axisY = 1 + (presentation.presentationAxisScaleY - 1) * axisCompression;
    const axisZ = 1 + (presentation.presentationAxisScaleZ - 1) * axisCompression;
    positions.setXYZ(index, nx * radiusScene * radial * axisX,
      ny * radiusScene * radial * axisY, nz * radiusScene * radial * axisZ);

    // Muted mineral provinces, impact ejecta and shadowed crater floors.
    // The compositional ice percentage is NOT interpreted as exposed ice.
    const province = clamp(0.5 + low * 0.75 + medium * 0.30, 0, 1);
    pixelColor.copy(base).lerp(weathered, clamp(0.15 + (1 - province) * 0.37, 0, 0.58));
    pixelColor.lerp(paleMineral, clamp((province - 0.56) * 0.48, 0, 0.24));
    const mineralGrain = 0.84 + 0.26 * (0.5 + 0.5 * fine);
    const craterFloor = 1 - terrainSample.craterFloor01 * 0.35;
    const fractureShadow = 1 - terrainSample.fracture01 * 0.31;
    const impactApron = 1 + terrainSample.impactEjecta01 * (metallic ? 0.08 : 0.20);
    const faceted = isRubble ? 1 + Math.round(medium * 6) * 0.019 : 1;
    pixelColor.multiplyScalar(clamp(mineralGrain * craterFloor * fractureShadow * impactApron * faceted, 0.52, 1.32));
    colors[index * 3] = Math.min(1, pixelColor.r);
    colors[index * 3 + 1] = Math.min(1, pixelColor.g);
    colors[index * 3 + 2] = Math.min(1, pixelColor.b);
  }

  positions.needsUpdate = true;
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  geometry.name = `GENESIS asteroid A.1-A.4 cratered terrain ${presentation.structureRegime}`;
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
