import * as THREE from 'three';
import {
  prepareCompactBlackHoleBodyOcclusion,
  updateCompactBlackHoleBodyOcclusion,
} from './system-compact-black-hole-occlusion';

/** 31.4i.1: the BH laboratory disk is composed in a transparent queue (1–20).
 * Every SOLID orbiting body, not just planets, must be sorted against it. */
describe('31.4i.1 BH moon and minor-body occlusion', () => {
  function fixture() {
    const world = new THREE.Scene();
    const blackHole = new THREE.Group();
    world.add(blackHole);
    const camera = new THREE.PerspectiveCamera();
    camera.position.set(0, 0, 10);
    camera.lookAt(0, 0, 0);
    const sync = (body: THREE.Group) => {
      world.updateMatrixWorld(true);
      camera.updateMatrixWorld(true);
      const binding = prepareCompactBlackHoleBodyOcclusion(body);
      updateCompactBlackHoleBodyOcclusion(binding, blackHole, camera);
      return binding;
    };
    return { world, blackHole, camera, sync };
  }

  for (const kind of [
    'moon', 'asteroid', 'comet nucleus', 'trans-neptunian object', 'captured object',
  ]) {
    it(`draws a ${kind} after the BH when foreground and before when background`, () => {
      const f = fixture();
      const body = new THREE.Group();
      const surfaceMaterial = new THREE.MeshStandardMaterial({ color: 0x999999 });
      const surface = new THREE.Mesh(new THREE.IcosahedronGeometry(0.07, 1), surfaceMaterial);
      body.add(surface);
      f.world.add(body);
      body.position.set(0, 0, 2);
      const binding = f.sync(body);
      expect(binding.drawables).toHaveLength(1);
      expect(surface.renderOrder).toBe(21);
      expect(surfaceMaterial.transparent).toBe(true);
      expect(surfaceMaterial.opacity).toBe(1);
      expect(surfaceMaterial.depthTest).toBe(true);
      expect(surfaceMaterial.depthWrite).toBe(true);
      body.position.z = -2;
      f.world.updateMatrixWorld(true);
      updateCompactBlackHoleBodyOcclusion(binding, f.blackHole, f.camera);
      expect(surface.renderOrder).toBe(0);
      body.position.z = 2;
      f.world.updateMatrixWorld(true);
      updateCompactBlackHoleBodyOcclusion(binding, f.blackHole, f.camera);
      expect(surface.renderOrder).toBe(21);
      expect(body.position.z).toBe(2);
      surface.geometry.dispose();
      surfaceMaterial.dispose();
    });
  }

  it('keeps a moon surface, clouds and atmospheric shell in their internal order', () => {
    const f = fixture();
    const moon = new THREE.Group();
    const axial = new THREE.Group();
    const spin = new THREE.Group();
    const surface = new THREE.Mesh(new THREE.SphereGeometry(0.06), new THREE.MeshStandardMaterial());
    const clouds = new THREE.Mesh(new THREE.SphereGeometry(0.062), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.2, depthWrite: false }));
    const atmosphere = new THREE.Mesh(new THREE.SphereGeometry(0.067), new THREE.ShaderMaterial({ transparent: true, depthWrite: false }));
    atmosphere.renderOrder = 4;
    spin.add(surface, clouds, atmosphere);
    axial.add(spin);
    moon.add(axial);
    f.world.add(moon);
    moon.position.z = 3;
    const binding = f.sync(moon);
    expect(binding.drawables).toHaveLength(3);
    expect(surface.renderOrder).toBe(21);
    expect(atmosphere.renderOrder).toBe(21.04);
    expect((atmosphere.material as THREE.Material).depthWrite).toBe(false);
    moon.position.z = -3;
    f.world.updateMatrixWorld(true);
    updateCompactBlackHoleBodyOcclusion(binding, f.blackHole, f.camera);
    expect(surface.renderOrder).toBe(0);
    expect(atmosphere.renderOrder).toBe(0.04);
    for (const mesh of [surface, clouds, atmosphere]) {
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    }
  });

  it('binds a moon only after deferred geometry exists (hidden layer revealed)', () => {
    const f = fixture();
    const moon = new THREE.Group();
    const axial = new THREE.Group();
    const spin = new THREE.Group();
    axial.add(spin);
    moon.add(axial);
    f.world.add(moon);
    // The hidden moon starts with no meshes: do not register this binding.
    const unmaterialized = f.sync(moon);
    expect(unmaterialized.drawables).toHaveLength(0);
    const surface = new THREE.Mesh(new THREE.SphereGeometry(0.04), new THREE.MeshStandardMaterial());
    spin.add(surface);
    // Same hierarchy retained when setLayerVisibility materializes the moon.
    expect(spin.parent?.parent).toBe(moon);
    moon.position.z = 1;
    const binding = f.sync(moon);
    expect(binding.drawables).toHaveLength(1);
    expect(surface.renderOrder).toBe(21);
    moon.position.z = -1;
    f.world.updateMatrixWorld(true);
    updateCompactBlackHoleBodyOcclusion(binding, f.blackHole, f.camera);
    expect(surface.renderOrder).toBe(0);
    surface.geometry.dispose();
    (surface.material as THREE.Material).dispose();
  });

  it('includes comet coma and dust/ion tails without changing additive materials', () => {
    const f = fixture();
    const comet = new THREE.Group();
    const nucleus = new THREE.Mesh(new THREE.IcosahedronGeometry(0.05), new THREE.MeshStandardMaterial());
    const effects = ['coma inner', 'coma outer', 'dust tail', 'ion tail'].map(name => {
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.08), new THREE.MeshBasicMaterial({
        transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false,
      }));
      mesh.name = name;
      return mesh;
    });
    comet.add(nucleus, ...effects);
    f.world.add(comet);
    comet.position.z = 2;
    const binding = f.sync(comet);
    expect(binding.drawables).toHaveLength(5);
    expect(binding.drawables.every(({ mesh }) => mesh.renderOrder >= 21)).toBe(true);
    for (const mesh of effects) {
      expect((mesh.material as THREE.MeshBasicMaterial).blending).toBe(THREE.AdditiveBlending);
      expect((mesh.material as THREE.MeshBasicMaterial).depthWrite).toBe(false);
    }
    comet.position.z = -2;
    f.world.updateMatrixWorld(true);
    updateCompactBlackHoleBodyOcclusion(binding, f.blackHole, f.camera);
    expect(binding.drawables.every(({ mesh }) => mesh.renderOrder < 1)).toBe(true);
    for (const mesh of [nucleus, ...effects]) {
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    }
  });

  it('recomputes foreground/background from camera rotation, without moving orbital bodies', () => {
    const f = fixture();
    const captured = new THREE.Group();
    captured.position.x = 2;
    const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(0.08), new THREE.MeshStandardMaterial());
    captured.add(mesh);
    f.world.add(captured);
    f.camera.position.set(10, 0, 0);
    f.camera.lookAt(0, 0, 0);
    const binding = f.sync(captured);
    expect(mesh.renderOrder).toBe(21);
    f.camera.position.set(-10, 0, 0);
    f.camera.lookAt(0, 0, 0);
    f.camera.updateMatrixWorld(true);
    updateCompactBlackHoleBodyOcclusion(binding, f.blackHole, f.camera);
    expect(mesh.renderOrder).toBe(0);
    expect(captured.position.x).toBe(2);
    mesh.geometry.dispose();
    (mesh.material as THREE.Material).dispose();
  });
});
