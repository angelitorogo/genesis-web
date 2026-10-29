import * as THREE from 'three';

import {
  type SystemSceneMoonPresentationV1,
} from './system-scene-moon-presentation';

import {
  buildSystemSceneMoonTextureV1,
  type SystemSceneMoonTextureDimensionsV1,
} from './system-scene-moon-texture';

import {
  SystemSceneBoundedResourceCacheV1,
  type SystemSceneResourceLeaseV1,
} from './system-scene-resource-cache';

export interface SystemSceneMoonRenderableV1 {
  readonly root: THREE.Group;
  readonly resources: readonly { dispose(): void }[];
  readonly surfaceMaterial: THREE.MeshStandardMaterial;
  readonly surfaceMesh: THREE.Mesh;
  readonly surfaceUsesSharedUnitGeometry: boolean;
}

export interface SystemSceneMoonTextureResourceV1 {
  readonly textureData: ReturnType<typeof buildSystemSceneMoonTextureV1>;
  readonly albedo: THREE.DataTexture;
  readonly relief: THREE.DataTexture;
  readonly emissive: THREE.DataTexture | null;
  readonly clouds: THREE.DataTexture | null;
  dispose(): void;
}

/** Materializes the immutable point-25.10 moon presentation into Three.js. */
export function createSystemSceneMoonRenderableV1(
  moon: SystemSceneMoonPresentationV1,
  textureCache: SystemSceneBoundedResourceCacheV1<SystemSceneMoonTextureResourceV1> | null = null,
  sharedUnitSphereGeometry: THREE.SphereGeometry | null = null,
  textureDimensions: SystemSceneMoonTextureDimensionsV1 | null = null,
): SystemSceneMoonRenderableV1 {
  if (moon.version !== 1) {
    throw new RangeError(`Unsupported moon presentation version: ${moon.version}.`);
  }

  const textureLease = moonTextureLease(moon, textureCache, textureDimensions);
  const textureResource = textureLease.resource;
  const textureData = textureResource.textureData;
  const albedo = textureResource.albedo;
  const resources: { dispose(): void }[] = [textureLease];

  const surfaceUsesSharedUnitGeometry =
    sharedUnitSphereGeometry !== null &&
    moon.shapeClass !== 'MINOR_IRREGULAR';
  const geometry =
    surfaceUsesSharedUnitGeometry
      ? sharedUnitSphereGeometry
      : moonGeometry(moon);

  if (!surfaceUsesSharedUnitGeometry) {
    resources.push(geometry);
  }

  // D.3f — a bare moon must not acquire an artificial limb from the physical
  // material's Fresnel/clearcoat response. Resolved atmospheres keep D.3e's
  // separate enclosing shell and icy/wet surfaces keep their specular relief.
  const bareSurface = !moon.presentationAtmospherePresent &&
    moon.presentationLiquidCoverage01 < 0.01;
  const materialOptions: THREE.MeshPhysicalMaterialParameters = {
    color: 0xffffff,
    map: albedo,
    bumpMap: textureResource.relief,
    roughnessMap: textureResource.relief,
    bumpScale: moon.presentationRadiusScene * (
      moon.shapeClass === 'MINOR_IRREGULAR'
        ? 0.056
        : moon.surfaceStyle === 'ICY'
          ? 0.041
          : moon.surfaceStyle === 'MIXED'
            ? 0.038
            : 0.033
    ),
    roughness: bareSurface ? 0.94 : moon.surfaceStyle === 'OCEANIC'
      ? 0.28
      : moon.surfaceStyle === 'ICY'
        ? 0.64
        : moon.surfaceStyle === 'VOLCANIC'
          ? 0.88
          : moon.surfaceStyle === 'MIXED'
            ? 0.76
            : 0.86,
    metalness: bareSurface ? 0 : moon.surfaceStyle === 'OCEANIC' ? 0.03 : 0.005,
    specularIntensity: bareSurface ? 0.16 : 1,
    clearcoat: bareSurface ? 0 : moon.surfaceStyle === 'OCEANIC'
      ? 0.34
      : moon.presentationLiquidCoverage01 > 0.06 || moon.surfaceStyle === 'ICY'
        ? 0.14
        : 0.04,
    clearcoatRoughness: moon.surfaceStyle === 'OCEANIC'
      ? 0.18
      : moon.surfaceStyle === 'ICY'
        ? 0.42
        : 0.58,
    ior: moon.surfaceStyle === 'OCEANIC' ? 1.38 : 1.24,
  };

  if (textureData.emissiveRgba !== null) {
    const emissive = textureResource.emissive;
    if (emissive !== null) {
      materialOptions.emissive = 0xffffff;
      materialOptions.emissiveIntensity =
        0.34 + 0.92 * moon.presentationVolcanicCoverage01;
      materialOptions.emissiveMap = emissive;
    }
  }

  const surfaceMaterial = new THREE.MeshPhysicalMaterial(materialOptions);
  resources.push(surfaceMaterial);

  const root = new THREE.Group();
  root.name = 'GENESIS moon visual 25.10';
  const surface = new THREE.Mesh(geometry, surfaceMaterial);
  if (surfaceUsesSharedUnitGeometry) {
    surface.scale.setScalar(moon.presentationRadiusScene);
  }
  surface.name = 'GENESIS moon surface 25.10';
  root.add(surface);

  if (textureData.cloudRgba !== null) {
    const cloudTexture = textureResource.clouds!;
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
    resources.push(cloudGeometry, cloudMaterial);
  }

  if (moon.presentationAtmospherePresent) {
    // One graded shell for both limb scattering and in-disc haze. The earlier
    // front + back concentric shells produced a conspicuous double outline.
    const atmosphereGeometry = new THREE.SphereGeometry(
      moon.presentationRadiusScene * moon.presentationAtmosphereShellScale,
      48,
      32,
    );
    const atmosphereMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uGenesisMoonAtmosphereColor: {
          value: new THREE.Color(moon.presentationAtmosphereColorHex),
        },
        uGenesisMoonAtmosphereStrength: {
          value: moon.presentationAtmosphereStrength01,
        },
        uGenesisMoonAtmosphereHaze: {
          value: moon.presentationAtmosphereHaze01 ?? 0,
        },
      },
      vertexShader: MOON_ATMOSPHERE_VERTEX_SHADER_V1,
      fragmentShader: MOON_ATMOSPHERE_FRAGMENT_SHADER_V1,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      side: THREE.FrontSide,
      blending: THREE.NormalBlending,
      toneMapped: false,
    });
    atmosphereMaterial.name = 'GENESIS moon atmosphere graded D3d';
    const atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    atmosphereMesh.name = 'GENESIS moon atmosphere shell D3d';
    atmosphereMesh.renderOrder = 3;
    root.add(atmosphereMesh);
    resources.push(atmosphereGeometry, atmosphereMaterial);
  }

  return Object.freeze({
    root,
    resources: Object.freeze(resources),
    surfaceMaterial,
    surfaceMesh: surface,
    surfaceUsesSharedUnitGeometry,
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
uniform float uGenesisMoonAtmosphereHaze;

varying vec3 vGenesisMoonNormalView;
varying vec3 vGenesisMoonViewDirection;

void main() {
  vec3 genesisNormal = normalize(vGenesisMoonNormalView);
  vec3 genesisView = normalize(vGenesisMoonViewDirection);
  float facing = clamp(dot(genesisNormal, genesisView), 0.0, 1.0);

  // D.3e — the atmosphere must visibly wrap around the moon rather than read
  // as a thin artificial ring. We combine a broad horizon halo, a soft mid-
  // shell shoulder and a light frontal veil so the body stays readable.
  float horizon = 1.0 - facing;
  float discGate = smoothstep(0.02, 0.42, facing);
  float interior = pow(facing, 0.56);
  float wideHalo = pow(horizon, 1.10);
  float tightHalo = pow(horizon, 2.45);
  float hazeMix = clamp(0.20 + 0.80 * uGenesisMoonAtmosphereHaze, 0.0, 1.0);
  float wrapHalo = mix(wideHalo, tightHalo, 0.18 + 0.24 * hazeMix);
  float midShell = smoothstep(0.16, 0.88, horizon) * (1.0 - smoothstep(0.78, 1.0, horizon));
  float edgeBoost = smoothstep(0.38, 1.0, horizon);
  float halo = (0.18 + 0.74 * uGenesisMoonAtmosphereStrength) *
    wrapHalo * (0.88 + 0.54 * uGenesisMoonAtmosphereHaze);
  float shoulder = (0.04 + 0.24 * uGenesisMoonAtmosphereStrength +
    0.20 * uGenesisMoonAtmosphereHaze) * midShell;
  float veil = (0.016 + 0.072 * uGenesisMoonAtmosphereStrength +
    0.082 * uGenesisMoonAtmosphereHaze) * (0.30 + 0.70 * interior);
  // D.3f: trace-pressure gas must not inherit a bright D.3e limb from the
  // base shader constants; scattering fades with available column strength.
  float columnFade = smoothstep(0.0, 0.58, uGenesisMoonAtmosphereStrength);
  float genesisAlpha = clamp((
    halo * (0.70 + 0.30 * edgeBoost) +
    shoulder +
    veil * discGate
  ) * columnFade, 0.0, 0.84);
  gl_FragColor = vec4(uGenesisMoonAtmosphereColor, genesisAlpha);
}
`;
function moonTextureLease(
  moon: SystemSceneMoonPresentationV1,
  cache: SystemSceneBoundedResourceCacheV1<SystemSceneMoonTextureResourceV1> | null,
  dimensions: SystemSceneMoonTextureDimensionsV1 | null,
): SystemSceneResourceLeaseV1<SystemSceneMoonTextureResourceV1> {
  const key = [moon.sourceMoonIdentity, moon.presentationSeedUint32, 'D3f',
    dimensions === null ? 'SYSTEM_SCENE' : `${dimensions.width}x${dimensions.height}`, 
    moon.shapeClass, moon.surfaceStyle, moon.presentationBaseColorHex, moon.presentationAccentColorHex,
    moon.presentationIceCoverage01, moon.presentationLiquidCoverage01,
    moon.presentationVolcanicCoverage01, moon.presentationCloudCoverage01,
    moon.sourceInferredIceRichnessIndex01, moon.sourceGeologicalActivityIndex01,
    moon.sourceTidalHeatingIndex01, moon.sourceRadiusEarth,
    moon.sourceSurfaceGravityEarth, moon.sourceIceShellThermalRegime,
    moon.sourceCryovolcanismScenario].join('|');
  if (cache !== null) {
    return cache.acquire(
      key,
      (dimensions?.width ?? (moon.shapeClass === 'MAJOR_PLANETARY' ? 192 : 128)) *
        (dimensions?.height ?? (moon.shapeClass === 'MAJOR_PLANETARY' ? 96 : 64)) * 4 * 4,
      () => createMoonTextureResource(moon, dimensions),
    );
  }

  const resource = createMoonTextureResource(moon, dimensions);
  let released = false;
  return Object.freeze({
    resource,
    cached: false,
    dispose: () => {
      if (released) {
        return;
      }
      released = true;
      resource.dispose();
    },
  });
}

function createMoonTextureResource(
  moon: SystemSceneMoonPresentationV1,
  dimensions: SystemSceneMoonTextureDimensionsV1 | null,
): SystemSceneMoonTextureResourceV1 {
  const textureData = buildSystemSceneMoonTextureV1(moon, dimensions);
  const albedo = dataTexture(
    textureData.width,
    textureData.height,
    textureData.albedoRgba,
    'GENESIS cached moon albedo 25.11',
  );
  const relief = dataTexture(
    textureData.width,
    textureData.height,
    textureData.reliefRgba,
    'GENESIS cached moon relief D',
    false,
  );
  const emissive = textureData.emissiveRgba === null
    ? null
    : dataTexture(
        textureData.width,
        textureData.height,
        textureData.emissiveRgba,
        'GENESIS cached moon volcanism 25.11',
      );
  const clouds = textureData.cloudRgba === null
    ? null
    : dataTexture(
        textureData.width,
        textureData.height,
        textureData.cloudRgba,
        'GENESIS cached moon clouds 25.11',
      );

  let disposed = false;
  return Object.freeze({
    textureData,
    albedo,
    relief,
    emissive,
    clouds,
    dispose: () => {
      if (disposed) {
        return;
      }
      disposed = true;
      albedo.dispose();
      relief.dispose();
      emissive?.dispose();
      clouds?.dispose();
    },
  });
}

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
  srgb = true,
): THREE.DataTexture {
  const texture = new THREE.DataTexture(
    rgba,
    width,
    height,
    THREE.RGBAFormat,
    THREE.UnsignedByteType,
  );
  texture.name = name;
  texture.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
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
