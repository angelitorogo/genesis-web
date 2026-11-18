import * as THREE from 'three';
import {
  PLANET_SURFACE_NORMAL_STRENGTH_VISSURF5c,
  calibrateSolidRoughnessForRendererVISSURF5c,
  configureSolidSurfaceNormalDetailVISSURF5c,
  installSolidSurfaceDebugShaderVISSURF5c,
  patchSolidSurfaceDebugFragmentVISSURF5c,
  prepareSolidSurfaceDataTextureVISSURF5c,
  readPlanetSurfaceRenderModeVISSURF5c,
  showPlanetOpticalLayerVISSURF5c,
} from './system-scene-planet-render-pipeline-vissurf5c';

describe('VISSURF.5c — render Three.js de superficies planetarias', () => {
  it('mantiene el modo normal por defecto y habilita diagnóstico explícito, no persistido', () => {
    expect(readPlanetSurfaceRenderModeVISSURF5c('')).toBe('COMPOSITE');
    expect(readPlanetSurfaceRenderModeVISSURF5c('?genesisSurfaceDebug=surface')).toBe('SURFACE');
    expect(readPlanetSurfaceRenderModeVISSURF5c('?genesisSurfaceDebug=clouds')).toBe('CLOUDS');
    expect(readPlanetSurfaceRenderModeVISSURF5c('?genesisSurfaceDebug=atmosphere')).toBe('ATMOSPHERE');
    expect(readPlanetSurfaceRenderModeVISSURF5c('?genesisSurfaceDebug=albedo')).toBe('ALBEDO');
    expect(readPlanetSurfaceRenderModeVISSURF5c('?genesisSurfaceDebug=normals')).toBe('NORMALS');
    expect(readPlanetSurfaceRenderModeVISSURF5c('?genesisSurfaceDebug=roughness')).toBe('ROUGHNESS');
    expect(readPlanetSurfaceRenderModeVISSURF5c('?genesisSurfaceDebug=unknown')).toBe('COMPOSITE');
    expect(showPlanetOpticalLayerVISSURF5c('COMPOSITE', 'CLOUDS')).toBe(true);
    expect(showPlanetOpticalLayerVISSURF5c('COMPOSITE', 'ATMOSPHERE')).toBe(true);
    expect(showPlanetOpticalLayerVISSURF5c('SURFACE', 'CLOUDS')).toBe(false);
    expect(showPlanetOpticalLayerVISSURF5c('CLOUDS', 'ATMOSPHERE')).toBe(false);
    expect(showPlanetOpticalLayerVISSURF5c('ATMOSPHERE', 'CLOUDS')).toBe(false);
  });

  it('controla rugosidad exclusivamente en el agua, sin alterar máscara ni otros materiales', () => {
    const mask = new Uint8Array([1, 1, 3, 5, 2, 4]);
    const before = new Uint8Array([
      111, 111, 111, 255,
      133, 133, 133, 255,
      180, 180, 180, 255,
      170, 170, 170, 255,
      110, 110, 110, 255,
      190, 190, 190, 255,
    ]);
    const pixels = new Uint8Array(before);
    const frozenMask = new Uint8Array(mask);
    calibrateSolidRoughnessForRendererVISSURF5c(pixels, mask);
    expect(mask).toEqual(frozenMask);
    expect(pixels[1]).toBeGreaterThan(before[1]!);
    expect(pixels[5]).toBeGreaterThan(before[5]!);
    expect(pixels.slice(8)).toEqual(before.slice(8));
    expect(() => calibrateSolidRoughnessForRendererVISSURF5c(pixels, new Uint8Array(3)))
      .toThrow(RangeError);
  });

  it('separa datos lineales de color sRGB, sin tocar los materiales de las nubes', () => {
    const albedo = new THREE.DataTexture(new Uint8Array(16), 2, 2);
    const normals = new THREE.DataTexture(new Uint8Array(16), 2, 2);
    prepareSolidSurfaceDataTextureVISSURF5c(albedo, 'COLOR');
    prepareSolidSurfaceDataTextureVISSURF5c(normals, 'NORMAL');
    expect(albedo.colorSpace).toBe(THREE.SRGBColorSpace);
    expect(normals.colorSpace).toBe(THREE.NoColorSpace);
    expect(albedo.anisotropy).toBe(4);
    expect(normals.minFilter).toBe(THREE.LinearMipmapLinearFilter);
    albedo.dispose();
    normals.dispose();
  });

  it('usa normalMap y no una doble perturbación mediante bumpMap', () => {
    const normal = new THREE.DataTexture(new Uint8Array(16), 2, 2);
    const bump = new THREE.DataTexture(new Uint8Array(16), 2, 2);
    const material = new THREE.MeshStandardMaterial();
    configureSolidSurfaceNormalDetailVISSURF5c(material, normal, bump);
    expect(material.normalMap).toBe(normal);
    expect(material.bumpMap).toBeNull();
    expect(material.normalScale.x).toBeCloseTo(PLANET_SURFACE_NORMAL_STRENGTH_VISSURF5c);
    configureSolidSurfaceNormalDetailVISSURF5c(material, null, bump);
    expect(material.normalMap).toBeNull();
    expect(material.bumpMap).toBe(bump);
    material.dispose();
    normal.dispose();
    bump.dispose();
  });

  it('visualiza albedo, normales y rugosidad sin alterar el shader normal', () => {
    const source = 'void main(){\n#include <opaque_fragment>\n}';
    expect(patchSolidSurfaceDebugFragmentVISSURF5c(source, 'COMPOSITE')).toBe(source);
    expect(patchSolidSurfaceDebugFragmentVISSURF5c(source, 'SURFACE')).toBe(source);
    expect(patchSolidSurfaceDebugFragmentVISSURF5c(source, 'ALBEDO'))
      .toContain('outgoingLight = diffuseColor.rgb;');
    expect(patchSolidSurfaceDebugFragmentVISSURF5c(source, 'NORMALS'))
      .toContain('outgoingLight = (normalize(normal) * 0.5 + 0.5);');
    expect(patchSolidSurfaceDebugFragmentVISSURF5c(source, 'ROUGHNESS'))
      .toContain('outgoingLight = vec3(roughnessFactor);');
    const material = new THREE.MeshStandardMaterial();
    const originalKey = material.customProgramCacheKey();
    installSolidSurfaceDebugShaderVISSURF5c(material, 'SURFACE');
    expect(material.customProgramCacheKey()).toBe(originalKey);
    installSolidSurfaceDebugShaderVISSURF5c(material, 'ALBEDO');
    expect(material.customProgramCacheKey()).toContain('GENESIS-VISSURF-5c-ALBEDO');
    material.dispose();
  });
});
