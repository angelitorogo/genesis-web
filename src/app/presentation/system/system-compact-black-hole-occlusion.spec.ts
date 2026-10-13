import * as THREE from 'three';
import { ExtremeType } from '../../domain/galactic-object/extreme-object-type';
import { createCompactHostLaboratoryVisual, orientCompactBlackHoleToCamera } from './system-compact-host-laboratory-visual';
import { prepareCompactBlackHolePlanetOcclusion, updateCompactBlackHolePlanetOcclusion } from './system-compact-black-hole-occlusion';

/** 31.4i — The real laboratory shader deliberately does NOT depth-test its
 * front disk. Planet compositing therefore belongs to the host scene, not
 * the canonical lab renderer. */
describe('31.4i compact black-hole planet/disk occlusion', () => {
  function fixture() {
    const world = new THREE.Scene();
    const host = new THREE.Group();
    host.name = 'black hole host';
    world.add(host);
    const planet = new THREE.Group();
    planet.name = 'orbiting planet';
    const surfaceMaterial = new THREE.MeshStandardMaterial({ color: 0x867450 });
    const surface = new THREE.Mesh(new THREE.SphereGeometry(0.12), surfaceMaterial);
    const atmosphereMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.18, depthWrite: false });
    const atmosphere = new THREE.Mesh(new THREE.SphereGeometry(0.125), atmosphereMaterial);
    atmosphere.renderOrder = 4;
    planet.add(surface, atmosphere);
    world.add(planet);
    const camera = new THREE.PerspectiveCamera();
    camera.position.set(0, 0, 10);
    camera.lookAt(0, 0, 0);
    const binding = prepareCompactBlackHolePlanetOcclusion(planet);
    const sync = () => {
      world.updateMatrixWorld(true);
      camera.updateMatrixWorld(true);
      updateCompactBlackHolePlanetOcclusion(binding, host, camera);
    };
    return { world, host, planet, camera, surface, surfaceMaterial, atmosphere, atmosphereMaterial, binding, sync };
  }

  it('promotes only the BH planet into the transparent render queue, preserving depth testing and shaders', () => {
    const f = fixture();
    expect(f.binding.drawables.length).toBe(2);
    expect(f.surfaceMaterial.transparent).toBe(true);
    expect(f.surfaceMaterial.opacity).toBe(1);
    expect(f.surfaceMaterial.depthTest).toBe(true);
    expect(f.surfaceMaterial.depthWrite).toBe(true);
    expect(f.atmosphereMaterial.depthWrite).toBe(false);
    expect(f.surfaceMaterial).toBeInstanceOf(THREE.MeshStandardMaterial);
    f.surface.geometry.dispose();
    f.atmosphere.geometry.dispose();
    f.surfaceMaterial.dispose();
    f.atmosphereMaterial.dispose();
  });

  it('draws the planet AFTER all BH layers when it is in front; restores BEFORE when behind', () => {
    const f = fixture();
    f.planet.position.z = 1.5;
    f.sync();
    expect(f.surface.renderOrder).toBe(21);
    expect(f.atmosphere.renderOrder).toBeGreaterThan(f.surface.renderOrder);
    expect(f.atmosphere.renderOrder).toBeLessThan(22);

    f.planet.position.z = -1.5;
    f.sync();
    expect(f.surface.renderOrder).toBe(0);
    expect(f.atmosphere.renderOrder).toBeGreaterThan(0);
    expect(f.atmosphere.renderOrder).toBeLessThan(1);

    f.planet.position.z = 1.5;
    f.sync();
    expect(f.surface.renderOrder).toBe(21);
  });

  it('re-sorts on camera movement and uses transformed world coordinates', () => {
    const f = fixture();
    f.world.rotation.y = 0.17;
    f.planet.position.set(2, 0, 0);
    f.camera.position.set(10, 0, 0);
    f.camera.lookAt(0, 0, 0);
    f.sync();
    expect(f.surface.renderOrder).toBe(21);
    f.camera.position.set(-10, 0, 0);
    f.camera.lookAt(0, 0, 0);
    f.sync();
    expect(f.surface.renderOrder).toBe(0);
    // It must never move the planet physically or alter the camera's transform.
    expect(f.planet.position.x).toBe(2);
    expect(f.camera.position.x).toBe(-10);
  });

  it('does not touch canonical BH geometry, orientation, disk shaders, or their render orders', () => {
    const graph = createCompactHostLaboratoryVisual(
      ExtremeType.STELLAR_MASS_BLACK_HOLE,
      'G0 / S227633266659 / O0',
      0.38,
      null,
    );
    try {
      const originalOrders: number[] = [];
      graph.root.traverse(object => {
        if (object instanceof THREE.Mesh) originalOrders.push(object.renderOrder);
      });
      expect(Math.max(...originalOrders)).toBe(20);
      expect(originalOrders).toContain(5);
      expect(originalOrders).toContain(4);
      const f = fixture();
      f.host.add(graph.root);
      f.planet.position.z = 1;
      orientCompactBlackHoleToCamera(graph.root, f.camera);
      f.sync();
      f.planet.position.z = -1;
      f.sync();
      const afterOrders: number[] = [];
      graph.root.traverse(object => {
        if (object instanceof THREE.Mesh) afterOrders.push(object.renderOrder);
      });
      expect(afterOrders).toEqual(originalOrders);
    } finally {
      graph.dispose();
    }
  });

  it('does not mutate scene materials when a planet is not opted into BH compositing', () => {
    const planet = new THREE.Group();
    const material = new THREE.MeshStandardMaterial();
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(), material);
    planet.add(mesh);
    expect(mesh.renderOrder).toBe(0);
    expect(material.transparent).toBe(false);
    mesh.geometry.dispose();
    material.dispose();
  });
});
