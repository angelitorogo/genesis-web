import * as THREE from 'three';
import {
  buildSystemSceneArtificialSatellitePlansV1,
  buildSystemSceneOrbitalStationPlansV1,
  createSystemSceneArtificialSatelliteVisualV1,
  createSystemSceneOrbitalStationVisualV1,
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
      expect(meshes.length).toBeGreaterThan(4);
      expect(meshes.every(mesh => mesh.geometry instanceof THREE.BoxGeometry)).toBe(true);
      expect(visual.materials.length).toBeGreaterThan(3);
      expect(visual.materials.every(binding => binding.material.transparent === false)).toBe(true);
      expect(visual.materials.every(binding => binding.material.opacity === 1)).toBe(true);
      expect(visual.resources.length).toBeGreaterThan(6);
      expect(visual.resources.every(resource => typeof resource.dispose === 'function')).toBe(true);
      for (const resource of visual.resources) resource.dispose();
    }
  });


  it('añade estaciones orbitales en civilizaciones muy avanzadas con geometría tecnológica opaca', () => {
    expect(buildSystemSceneOrbitalStationPlansV1(145872, 'ADVANCED', 1)).toHaveLength(0);
    const plans = buildSystemSceneOrbitalStationPlansV1(145872, 'VERY_ADVANCED', 1);
    expect(plans.length).toBeGreaterThan(0);
    const visual = createSystemSceneOrbitalStationVisualV1(plans[0]!, 145872);
    const meshes: THREE.Mesh[] = [];
    visual.group.traverse(object => {
      if (object instanceof THREE.Mesh) meshes.push(object);
    });
    expect(meshes.length).toBeGreaterThanOrEqual(8);
    // VISCIV.5 incorpora cilindros de acoplamiento/habitáculos y detalles
    // instanciados: ya no todas las geometrías deben ser cajas.
    expect(meshes.some(mesh => mesh.geometry instanceof THREE.BoxGeometry)).toBe(true);
    expect(meshes.every(mesh =>
      mesh.geometry instanceof THREE.BufferGeometry &&
      (mesh.geometry.getAttribute('position')?.count ?? 0) > 0,
    )).toBe(true);
    if (plans[0]!.installationKind !== 'PLATFORM') {
      expect(meshes.some(mesh => mesh.geometry instanceof THREE.CylinderGeometry)).toBe(true);
    }
    expect(visual.materials.length).toBeGreaterThanOrEqual(5);
    expect(visual.materials.some(binding =>
      binding.material instanceof THREE.MeshStandardMaterial &&
      binding.material.metalness > 0,
    )).toBe(true);
    expect(visual.materials.every(binding => binding.material.transparent === false)).toBe(true);
    expect(visual.materials.every(binding => binding.material.opacity === 1)).toBe(true);
    expect(visual.resources.every(resource => typeof resource.dispose === 'function')).toBe(true);
    for (const resource of visual.resources) resource.dispose();
  });

  it('no activa satélites en mundos sin civilización o con civilización primitiva', () => {
    expect(supportsSystemSceneArtificialSatellitesV1(null)).toBe(false);
    expect(supportsSystemSceneArtificialSatellitesV1('PRIMITIVE')).toBe(false);
    expect(supportsSystemSceneArtificialSatellitesV1('ADVANCED')).toBe(true);
    expect(supportsSystemSceneArtificialSatellitesV1('VERY_ADVANCED')).toBe(true);
  });
});
