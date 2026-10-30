import * as THREE from 'three';
import {
  buildSystemSceneArtificialSatellitePlansV1,
  createSystemSceneArtificialSatelliteVisualV1,
  supportsSystemSceneArtificialSatellitesV1,
  type SystemSceneArtificialSatelliteMaterialBindingV1,
} from './system-scene-artificial-satellites-visciv2';

describe('VISCIV.2c — visuales artificiales rectangulares y opacos', () => {
  it('exporta el constructor y el contrato del material de los satélites', () => {
    const binding: SystemSceneArtificialSatelliteMaterialBindingV1 = {
      material: new THREE.MeshBasicMaterial(),
      baseColor: new THREE.Color('#aabbcc'),
      role: 'body',
    };
    expect(binding.role).toBe('body');
    binding.material.dispose();
    expect(typeof createSystemSceneArtificialSatelliteVisualV1).toBe('function');
  });

  it('crea cuerpo, paneles y mástil rectilíneos sin transparencia', () => {
    for (const tier of ['ADVANCED', 'VERY_ADVANCED'] as const) {
      const [plan] = buildSystemSceneArtificialSatellitePlansV1(145872, tier, 1);
      expect(plan).toBeDefined();
      const visual = createSystemSceneArtificialSatelliteVisualV1(plan!, 145872);
      const meshes: THREE.Mesh[] = [];
      visual.group.traverse(object => {
        if (object instanceof THREE.Mesh) meshes.push(object);
      });
      expect(meshes).toHaveLength(4);
      expect(meshes.every(mesh => mesh.geometry instanceof THREE.BoxGeometry)).toBe(true);
      expect(visual.materials).toHaveLength(3);
      expect(visual.materials.every(binding => binding.material.transparent === false)).toBe(true);
      expect(visual.materials.every(binding => binding.material.opacity === 1)).toBe(true);
      expect(visual.resources).toHaveLength(6);
      expect(visual.resources.every(resource => typeof resource.dispose === 'function')).toBe(true);
      for (const resource of visual.resources) resource.dispose();
    }
  });

  it('no activa satélites en mundos sin civilización o con civilización primitiva', () => {
    expect(supportsSystemSceneArtificialSatellitesV1(null)).toBe(false);
    expect(supportsSystemSceneArtificialSatellitesV1('PRIMITIVE')).toBe(false);
    expect(supportsSystemSceneArtificialSatellitesV1('ADVANCED')).toBe(true);
    expect(supportsSystemSceneArtificialSatellitesV1('VERY_ADVANCED')).toBe(true);
  });
});
