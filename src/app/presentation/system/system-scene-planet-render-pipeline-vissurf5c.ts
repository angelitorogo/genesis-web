import * as THREE from 'three';

/**
 * VISSURF.5c — presentación WebGL de los atlas sólidos ya generados.
 *
 * No interviene en el generador, la máscara de clases, las nubes, la
 * atmósfera ni el conocimiento persistido. Los modos de diagnóstico son
 * explícitos y quedan desactivados por defecto.
 */
export type PlanetSurfaceRenderModeVISSURF5c =
  | 'COMPOSITE'
  | 'SURFACE'
  | 'CLOUDS'
  | 'ATMOSPHERE'
  | 'ALBEDO'
  | 'NORMALS'
  | 'ROUGHNESS';

export const PLANET_SURFACE_NORMAL_STRENGTH_VISSURF5c = 0.98;
export const PLANET_SURFACE_ANISOTROPY_VISSURF5c = 4;

/** Un modo de diagnóstico no modifica ninguna preferencia persistente. */
export function readPlanetSurfaceRenderModeVISSURF5c(search?: string): PlanetSurfaceRenderModeVISSURF5c {
  const query = search ?? (typeof window !== 'undefined' ? window.location.search : '');
  const value = new URLSearchParams(query).get('genesisSurfaceDebug')?.toLowerCase();
  switch (value) {
    case 'surface': return 'SURFACE';
    case 'clouds': return 'CLOUDS';
    case 'atmosphere': return 'ATMOSPHERE';
    case 'albedo': return 'ALBEDO';
    case 'normals': return 'NORMALS';
    case 'roughness': return 'ROUGHNESS';
    default: return 'COMPOSITE';
  }
}

/** Decide qué capas ópticas se dibujan; en producción ambas son visibles. */
export function showPlanetOpticalLayerVISSURF5c(
  mode: PlanetSurfaceRenderModeVISSURF5c,
  layer: 'CLOUDS' | 'ATMOSPHERE',
): boolean {
  return mode === 'COMPOSITE' || mode === layer;
}

/**
 * Corrección exclusivamente de renderizado: Three.js usa el canal VERDE del
 * roughnessMap. Subir ligeramente el mínimo perceptual del océano evita un
 * highlight blanco excesivamente concentrado sin tocar el color, las costas
 * ni la clasificación científica. Solo se usa sobre una copia visual HD.
 */
export function calibrateSolidRoughnessForRendererVISSURF5c(
  roughnessRgba: Uint8Array | null,
  classMask: Uint8Array,
): void {
  if (!roughnessRgba) return;
  if (roughnessRgba.length !== classMask.length * 4) {
    throw new RangeError('VISSURF.5c: roughness and class mask resolutions differ.');
  }
  for (let i = 0; i < classMask.length; i++) {
    if (classMask[i] !== 1) continue; // water only; all land materials untouched
    const o = i * 4;
    const old = roughnessRgba[o + 1]!;
    // Preserve original shelf/deep-water variation; raise mean ocean roughness
    // from ~0.46 to ~0.63, still leaving a broad but readable glint.
    const revised = Math.min(205, Math.max(old, Math.round(73 + old * 0.77)));
    roughnessRgba[o] = revised;
    roughnessRgba[o + 1] = revised;
    roughnessRgba[o + 2] = revised;
  }
}

/** Apply identical sampler settings to each visual surface atlas, never clouds. */
export function prepareSolidSurfaceDataTextureVISSURF5c(
  texture: THREE.DataTexture | null,
  role: 'COLOR' | 'NORMAL' | 'ROUGHNESS' | 'RELIEF',
): void {
  if (!texture) return;
  texture.colorSpace = role === 'COLOR' ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  texture.anisotropy = PLANET_SURFACE_ANISOTROPY_VISSURF5c;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
}

/**
 * Three.js chooses normalMap over bumpMap when both exist. Enforce that
 * choice explicitly and consistently across first render and focus LOD.
 */
export function configureSolidSurfaceNormalDetailVISSURF5c(
  material: THREE.MeshStandardMaterial,
  normal: THREE.Texture | null,
  bump: THREE.Texture | null,
): void {
  if (normal) {
    material.normalMap = normal;
    material.normalScale.set(
      PLANET_SURFACE_NORMAL_STRENGTH_VISSURF5c,
      PLANET_SURFACE_NORMAL_STRENGTH_VISSURF5c,
    );
    material.bumpMap = null;
  } else {
    material.normalMap = null;
    material.bumpMap = bump;
  }
}

/**
 * Diagnóstico de la composición, opcional por query string. Se instala al
 * final de la cadena GLSL y conserva los shaders normales en modo COMPOSITE.
 * La visualización se produce ANTES de tone mapping/color-space del renderer.
 */
export function installSolidSurfaceDebugShaderVISSURF5c(
  material: THREE.MeshStandardMaterial,
  mode: PlanetSurfaceRenderModeVISSURF5c,
): void {
  if (mode === 'COMPOSITE' || mode === 'SURFACE' || mode === 'CLOUDS' || mode === 'ATMOSPHERE') return;
  const upstream = material.onBeforeCompile;
  const key = material.customProgramCacheKey();
  material.onBeforeCompile = (shader, renderer) => {
    upstream.call(material, shader, renderer);
    shader.fragmentShader = patchSolidSurfaceDebugFragmentVISSURF5c(shader.fragmentShader, mode);
  };
  material.customProgramCacheKey = () => `${key}|GENESIS-VISSURF-5c-${mode}`;
  material.userData['genesisSurfaceDebugVISSURF5c'] = mode;
  material.needsUpdate = true;
}

export function patchSolidSurfaceDebugFragmentVISSURF5c(
  fragment: string,
  mode: PlanetSurfaceRenderModeVISSURF5c,
): string {
  if (mode === 'COMPOSITE' || mode === 'SURFACE' || mode === 'CLOUDS' || mode === 'ATMOSPHERE') return fragment;
  const marker = '#include <opaque_fragment>';
  if (!fragment.includes(marker)) throw new RangeError('VISSURF.5c requires Three.js opaque_fragment.');
  const source = mode === 'ALBEDO'
    ? 'diffuseColor.rgb'
    : mode === 'NORMALS'
      ? '(normalize(normal) * 0.5 + 0.5)'
      : 'vec3(roughnessFactor)';
  return fragment.replace(marker, `outgoingLight = ${source};\n${marker}`);
}
