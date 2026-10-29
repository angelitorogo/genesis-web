import * as THREE from 'three';
import {
  SCIENTIFIC_BODY_TEXTURE_VIS3D2E,
  attachScientificMinorBodyAtlasVis3d2e,
  buildScientificMinorBodyAtlasVis3d2e,
} from './scientific-minor-body-texture-vis3d2e';

// No browser canvas or WebGL context is required: deterministic atlas + CPU materials.
describe('VIS3D.2e — fichas 3D de cuerpos menores', () => {
  it.each(['ASTEROID', 'COMET', 'TNO', 'CAPTURED'] as const)('genera un atlas RGBA 1024×512 para %s', (kind) => {
    const atlas = buildScientificMinorBodyAtlasVis3d2e(kind, 0x1234abcd);
    expect(atlas.width).toBe(1024);
    expect(atlas.height).toBe(512);
    expect(atlas.rgba.length).toBe(1024 * 512 * 4);
    const pixel = (x: number, y: number) =>
      atlas.rgba.slice((y * atlas.width + x) * 4, (y * atlas.width + x + 1) * 4);
    for (const y of [0, 1, 97, 255, 383, 511]) {
      expect(pixel(0, y)).toEqual(pixel(1023, y));
    }
    expect(pixel(120, 180)).not.toEqual(pixel(427, 335));
  });

  it('es estable por semilla, diferente entre cuerpos y sin uso de Math.random', () => {
    const a = buildScientificMinorBodyAtlasVis3d2e('ASTEROID', 19);
    const b = buildScientificMinorBodyAtlasVis3d2e('ASTEROID', 19);
    const c = buildScientificMinorBodyAtlasVis3d2e('ASTEROID', 20);
    expect(a.rgba).toEqual(b.rgba);
    expect(a.rgba.slice(26000, 27000)).not.toEqual(c.rgba.slice(26000, 27000));
    expect(() => buildScientificMinorBodyAtlasVis3d2e('COMET', -1)).toThrow(RangeError);
  });

  it('adjunta mapa únicamente a las superficies indicadas y conserva materiales de coma/cola', () => {
    const surfaceMaterial = new THREE.MeshStandardMaterial({ vertexColors: true });
    const comaMaterial = new THREE.MeshBasicMaterial({ transparent: true });
    const surface = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 6), surfaceMaterial);
    const coma = new THREE.Mesh(new THREE.SphereGeometry(1.5, 8, 6), comaMaterial);
    const texture = attachScientificMinorBodyAtlasVis3d2e([surface], 'COMET', 0x1234abcd);
    try {
      expect(surfaceMaterial.vertexColors).toBe(true);
      expect(surfaceMaterial.map).toBe(texture);
      expect(comaMaterial.map).toBeNull();
      expect(texture.image.width).toBe(SCIENTIFIC_BODY_TEXTURE_VIS3D2E.width);
      expect(texture.image.height).toBe(SCIENTIFIC_BODY_TEXTURE_VIS3D2E.height);
      expect(texture.generateMipmaps).toBe(true);
      expect(texture.wrapS).toBe(THREE.RepeatWrapping);
      expect(texture.colorSpace).toBe(THREE.SRGBColorSpace);
    } finally {
      texture.dispose();
      surface.geometry.dispose();
      surfaceMaterial.dispose();
      coma.geometry.dispose();
      comaMaterial.dispose();
    }
  });
});
