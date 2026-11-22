import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import {
  installSystemSceneDayNightMaterialV1,
  patchSystemSceneDayNightFragmentShaderV1,
  patchSystemSceneDayNightVertexShaderVISSURF6,
  type SystemScenePlanetLightBindingV1,
} from './system-scene-atmosphere-material';

function binding(): SystemScenePlanetLightBindingV1 {
  return {
    lightDirectionsView: [new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1)],
    lightWeightsView: new THREE.Vector3(0.6, 0.25, 0.15),
    orbitalHomeDirectionsView: [new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, 1, 0)],
    orbitalHomeFlagsView: new THREE.Vector2(1, 1),
  };
}

describe('VISSURF.6 · stable geometric terminator and detailed surface shading', () => {
  it('captures transformed geometric normals before the fragment normal map', () => {
    const vertex = patchSystemSceneDayNightVertexShaderVISSURF6(
      THREE.ShaderLib.standard.vertexShader,
    );
    expect(vertex).toContain('varying vec3 vGenesisGeometricNormalView;');
    expect(vertex).toContain(
      '#include <defaultnormal_vertex>\nvGenesisGeometricNormalView = normalize(transformedNormal);',
    );
    expect(vertex).toContain('#include <normal_vertex>');
    expect(() => patchSystemSceneDayNightVertexShaderVISSURF6('void main() {}'))
      .toThrow(RangeError);
  });

  it('uses unperturbed normals for day/night, home-star urban light and twilight', () => {
    const original = THREE.ShaderLib.standard.fragmentShader;
    const fragment = patchSystemSceneDayNightFragmentShaderV1(original, true);
    expect(fragment).toContain('varying vec3 vGenesisGeometricNormalView;');
    expect(fragment).toContain('vec3 genesisGeometricNormal = normalize(vGenesisGeometricNormalView)');
    expect(fragment).toContain('dot(genesisGeometricNormal, normalize(uGenesisLightDirectionsView[0]))');
    expect(fragment).toContain('dot(genesisGeometricNormal, normalize(uGenesisOrbitalHomeDirectionsView[0]))');
    expect(fragment).not.toContain('dot(normalize(normal),');
    expect(fragment).toContain('#include <normal_fragment_maps>');
    expect(fragment).toContain('#include <lights_fragment_maps>');
    expect(fragment).toContain('genesisUrbanEmission');
    expect(fragment).toContain('genesisTwilightEnergy');
  });

  it('composes with MeshStandardMaterial for vacuum and atmosphere without changing native PBR lights', () => {
    for (const atmospherePresent of [false, true]) {
      const mat = new THREE.MeshStandardMaterial({normalMap: new THREE.Texture()});
      installSystemSceneDayNightMaterialV1(mat, {
        version: 1, terminatorSoftness01: 0.012, nightFloor01: 0.08,
        twilightGlow01: 0.3, atmospherePresent,
        dayTintHex: '#aaccee', nightTintHex: '#101820',
      }, binding());
      const shader = {
        uniforms: {},
        vertexShader: THREE.ShaderLib.standard.vertexShader,
        fragmentShader: THREE.ShaderLib.standard.fragmentShader,
      } as unknown as Parameters<typeof mat.onBeforeCompile>[0];
      mat.onBeforeCompile(shader, {} as THREE.WebGLRenderer);
      expect(shader.vertexShader).toContain('vGenesisGeometricNormalView');
      expect(shader.fragmentShader).toContain('genesisGeometricNormal');
      expect(shader.fragmentShader).toContain('#include <lights_fragment_begin>');
      expect(mat.customProgramCacheKey()).toContain('GEOM-NORMAL-VISSURF6');
      mat.dispose();
    }
  });
});
