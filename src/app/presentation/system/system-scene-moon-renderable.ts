import * as THREE from 'three';

import {
  type SystemSceneMoonPresentationV1,
} from './system-scene-moon-presentation';

import {
  buildSystemSceneMoonTextureV1,
} from './system-scene-moon-texture';

export interface SystemSceneMoonRenderableV1 {
  readonly root: THREE.Group;
  readonly resources: readonly { dispose(): void }[];
  readonly surfaceMaterial: THREE.MeshStandardMaterial;
}

/** Materializes the immutable point-25.10 moon presentation into Three.js. */
export function createSystemSceneMoonRenderableV1(
  moon: SystemSceneMoonPresentationV1,
): SystemSceneMoonRenderableV1 {
  if (moon.version !== 1) {
    throw new RangeError(`Unsupported moon presentation version: ${moon.version}.`);
  }

  const textureData = buildSystemSceneMoonTextureV1(moon);
  const albedo = dataTexture(
    textureData.width,
    textureData.height,
    textureData.albedoRgba,
    'GENESIS moon albedo 25.10',
  );
  const resources: { dispose(): void }[] = [albedo];

  const geometry = moonGeometry(moon);
  resources.push(geometry);

  const materialOptions: THREE.MeshStandardMaterialParameters = {
    color: 0xffffff,
    map: albedo,
    roughness: moon.surfaceStyle === 'OCEANIC' ? 0.62 : moon.surfaceStyle === 'ICY' ? 0.72 : 0.91,
    metalness: 0.005,
  };

  if (textureData.emissiveRgba !== null) {
    const emissive = dataTexture(
      textureData.width,
      textureData.height,
      textureData.emissiveRgba,
      'GENESIS moon volcanism 25.10',
    );
    materialOptions.emissive = 0xffffff;
    materialOptions.emissiveIntensity =
      0.34 + 0.92 * moon.presentationVolcanicCoverage01;
    materialOptions.emissiveMap = emissive;
    resources.push(emissive);
  }

  const surfaceMaterial = new THREE.MeshStandardMaterial(materialOptions);
  resources.push(surfaceMaterial);

  const root = new THREE.Group();
  root.name = 'GENESIS moon visual 25.10';
  const surface = new THREE.Mesh(geometry, surfaceMaterial);
  surface.name = 'GENESIS moon surface 25.10';
  root.add(surface);

  if (textureData.cloudRgba !== null) {
    const cloudTexture = dataTexture(
      textureData.width,
      textureData.height,
      textureData.cloudRgba,
      'GENESIS moon clouds 25.10',
    );
    const cloudGeometry = new THREE.SphereGeometry(
      moon.presentationRadiusScene * 1.018,
      32,
      22,
    );
    const cloudMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: cloudTexture,
      transparent: true,
      opacity: 0.90,
      alphaTest: 0.018,
      depthWrite: false,
      roughness: 0.96,
      metalness: 0,
    });
    const cloudMesh = new THREE.Mesh(cloudGeometry, cloudMaterial);
    cloudMesh.name = 'GENESIS moon clouds 25.10';
    cloudMesh.rotation.y = uint32Unit(mixUint32(moon.presentationSeedUint32 ^ 0x44b1f3a5)) * Math.PI * 2;
    root.add(cloudMesh);
    resources.push(cloudTexture, cloudGeometry, cloudMaterial);
  }

  if (moon.presentationAtmospherePresent) {
    const atmosphereGeometry = new THREE.SphereGeometry(
      moon.presentationRadiusScene * moon.presentationAtmosphereShellScale,
      32,
      22,
    );
    const atmosphereMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uGenesisMoonAtmosphereColor: {
          value: new THREE.Color(moon.presentationAtmosphereColorHex),
        },
        uGenesisMoonAtmosphereStrength: {
          value: moon.presentationAtmosphereStrength01,
        },
      },
      vertexShader: MOON_ATMOSPHERE_VERTEX_SHADER_V1,
      fragmentShader: MOON_ATMOSPHERE_FRAGMENT_SHADER_V1,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });
    atmosphereMaterial.name = 'GENESIS moon atmosphere 25.10';
    const atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    atmosphereMesh.name = 'GENESIS moon atmosphere shell 25.10';
    atmosphereMesh.renderOrder = 4;
    root.add(atmosphereMesh);
    resources.push(atmosphereGeometry, atmosphereMaterial);
  }

  return Object.freeze({
    root,
    resources: Object.freeze(resources),
    surfaceMaterial,
  });
}

export const MOON_ATMOSPHERE_VERTEX_SHADER_V1 = `
varying vec3 vGenesisMoonNormalView;
varying vec3 vGenesisMoonViewDirection;

void main() {
  vec4 genesisViewPosition = modelViewMatrix * vec4(position, 1.0);
  vGenesisMoonNormalView = normalize(normalMatrix * normal);
  vGenesisMoonViewDirection = normalize(-genesisViewPosition.xyz);
  gl_Position = projectionMatrix * genesisViewPosition;
}
`;

export const MOON_ATMOSPHERE_FRAGMENT_SHADER_V1 = `
uniform vec3 uGenesisMoonAtmosphereColor;
uniform float uGenesisMoonAtmosphereStrength;

varying vec3 vGenesisMoonNormalView;
varying vec3 vGenesisMoonViewDirection;

void main() {
  vec3 genesisNormal = normalize(vGenesisMoonNormalView);
  vec3 genesisView = normalize(vGenesisMoonViewDirection);
  float genesisFresnel = pow(clamp(1.0 - abs(dot(genesisNormal, genesisView)), 0.0, 1.0), 2.25);
  float genesisAlpha = clamp(genesisFresnel * (0.10 + 0.48 * uGenesisMoonAtmosphereStrength), 0.0, 0.58);
  gl_FragColor = vec4(uGenesisMoonAtmosphereColor, genesisAlpha);
}
`;

function moonGeometry(moon: SystemSceneMoonPresentationV1): THREE.BufferGeometry {
  const widthSegments =
    moon.shapeClass === 'MAJOR_PLANETARY'
      ? 36
      : moon.shapeClass === 'REGULAR_SMALL'
        ? 30
        : 24;
  const heightSegments =
    moon.shapeClass === 'MAJOR_PLANETARY'
      ? 24
      : moon.shapeClass === 'REGULAR_SMALL'
        ? 20
        : 16;

  const geometry = new THREE.SphereGeometry(
    moon.presentationRadiusScene,
    widthSegments,
    heightSegments,
  );

  if (moon.shapeClass !== 'MINOR_IRREGULAR') {
    return geometry;
  }

  const position = geometry.getAttribute('position') as THREE.BufferAttribute;
  const vector = new THREE.Vector3();
  const normalized = new THREE.Vector3();
  const axisScale = minorMoonAxisScale(moon.presentationSeedUint32, moon.presentationIrregularity01);

  for (let index = 0; index < position.count; index += 1) {
    vector.fromBufferAttribute(position, index);
    normalized
      .set(
        vector.x / moon.presentationRadiusScene,
        vector.y / moon.presentationRadiusScene,
        vector.z / moon.presentationRadiusScene,
      )
      .normalize();

    const primary = hashUnit(index, moon.presentationSeedUint32) * 2 - 1;
    const secondary =
      hashUnit(index * 7 + 13, moon.presentationSeedUint32 ^ 0xa341316c) * 2 - 1;
    const relief = 1 + moon.presentationIrregularity01 * (0.042 * primary + 0.020 * secondary);

    const x = normalized.x * axisScale.x * relief;
    const y = normalized.y * axisScale.y * relief;
    const z = normalized.z * axisScale.z * relief;
    const length = Math.hypot(x, y, z) || 1;
    const radius = moon.presentationRadiusScene * length;

    normalized.multiplyScalar(radius);
    position.setXYZ(index, normalized.x, normalized.y, normalized.z);
  }

  position.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

function minorMoonAxisScale(
  seed: number,
  irregularity01: number,
): { readonly x: number; readonly y: number; readonly z: number } {
  const strength = 0.045 + 0.080 * irregularity01;
  return Object.freeze({
    x: 1 + strength * (hashUnit(1003, seed) * 2 - 1),
    y: 1 + strength * (hashUnit(2003, seed ^ 0x517cc1b7) * 2 - 1),
    z: 1 + strength * (hashUnit(3003, seed ^ 0x9e3779b9) * 2 - 1),
  });
}

function dataTexture(
  width: number,
  height: number,
  rgba: Uint8Array,
  name: string,
): THREE.DataTexture {
  const texture = new THREE.DataTexture(
    rgba,
    width,
    height,
    THREE.RGBAFormat,
    THREE.UnsignedByteType,
  );
  texture.name = name;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.flipY = true;
  texture.needsUpdate = true;
  return texture;
}

function hashUnit(index: number, seed: number): number {
  return uint32Unit(mixUint32(seed ^ Math.imul(index + 1, 0x85ebca6b)));
}

function mixUint32(value: number): number {
  let x = value >>> 0;
  x ^= x >>> 16;
  x = Math.imul(x, 0x7feb352d);
  x ^= x >>> 15;
  x = Math.imul(x, 0x846ca68b);
  x ^= x >>> 16;
  return x >>> 0;
}

function uint32Unit(value: number): number {
  return (value >>> 0) / 0xffffffff;
}
