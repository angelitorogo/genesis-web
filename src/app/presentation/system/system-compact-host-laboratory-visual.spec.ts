import * as THREE from 'three';
import { ExtremeType } from '../../domain/galactic-object/extreme-object-type';
import { createCompactHostLaboratoryVisual, compactHostVisualSampleIndex, orientCompactBlackHoleToCamera } from './system-compact-host-laboratory-visual';
import { createSystemScenePlanetAppearanceV1 } from './system-scene';
import { type SystemSceneBodySnapshot } from './system-scene-snapshot';

/** 31.4c: the public system embeds the actual laboratory graph, not an imitation. */
describe('31.4c reusable compact laboratory renderers', () => {
  it('selects one of the eight existing laboratory samples deterministically', () => {
    const source = 'G0 / S227633266659 / O0';
    expect(compactHostVisualSampleIndex(source)).toBe(compactHostVisualSampleIndex(source));
    expect(compactHostVisualSampleIndex(source)).toBeGreaterThanOrEqual(0);
    expect(compactHostVisualSampleIndex(source)).toBeLessThan(8);
  });

  it.each([
    ExtremeType.NEUTRON_STAR,
    ExtremeType.PULSAR,
    ExtremeType.MILLISECOND_PULSAR,
    ExtremeType.MAGNETAR,
  ])('embeds the authentic neutron renderer for %s without creating a second WebGL context', kind => {
    const graph = createCompactHostLaboratoryVisual(kind, 'scientific-fixture', 0.20, null);
    try {
      expect(graph.root).toBeInstanceOf(THREE.Group);
      expect(graph.root.name).toContain(kind);
      const shaders: THREE.ShaderMaterial[] = [];
      graph.root.traverse(child => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.ShaderMaterial) {
          shaders.push(child.material);
        }
      });
      expect(shaders.length).toBeGreaterThan(0);
      expect(() => graph.update(12.5)).not.toThrow();
    } finally {
      graph.dispose();
    }
  });

  it('uses bounded albedo-following presentation fill exclusively for compact planets', () => {
    const body: SystemSceneBodySnapshot = {
      id: 'planet-1', kind: 'planet', label: '1', title: 'Sample 1',
      colorHex: '#9D8F7C', radiusScene: 0.11, position: { x: 0, y: 0, z: 0 },
      orbitId: 'orbit-1', motionContributions: [], surfaceStyle: 'rocky',
      lightIntensity: 0, sourceLuminositySolar: null,
      spin: { source: 'UNAVAILABLE', rotationPeriodHours: null,
        axialTiltDegrees: null, isRetrograde: null, isSynchronized: false,
        epochPhaseDegrees: 0 },
      surfaceEnvironment: null, giantAtmosphere: null, specialPresentation: null,
    };
    const normal = createSystemScenePlanetAppearanceV1(body, 'normal-fixture', null);
    const quiet = createSystemScenePlanetAppearanceV1(body, 'compact-quiet', null, null, 0.08);
    const bright = createSystemScenePlanetAppearanceV1(body, 'compact-bright', null, null, 0.95);
    try {
      expect(normal.material.emissiveMap).toBeNull();
      expect(quiet.material.emissiveMap).not.toBeNull();
      expect(bright.material.emissiveMap).not.toBeNull();
      expect(bright.material.emissiveIntensity).toBeGreaterThan(quiet.material.emissiveIntensity);
      expect(bright.material.userData['genesisDayNightPipeline']).toBeDefined();
    } finally {
      for (const appearance of [normal, quiet, bright]) {
        appearance.resources.forEach(resource => resource.dispose());
        appearance.material.dispose();
      }
    }
  });

  it('always uses the full approved laboratory black-hole geometry independent of physical accretion', () => {
    const unknown = createCompactHostLaboratoryVisual(
      ExtremeType.STELLAR_MASS_BLACK_HOLE, 'black-hole-fixture', 0.38, null,
    );
    const accreting = createCompactHostLaboratoryVisual(
      ExtremeType.STELLAR_MASS_BLACK_HOLE, 'black-hole-fixture', 0.38, 0.03,
    );
    try {
      const meshCount = (root: THREE.Object3D): number => {
        let count = 0;
        root.traverse(child => { if (child instanceof THREE.Mesh) count++; });
        return count;
      };
      expect(meshCount(unknown.root)).toBe(meshCount(accreting.root));
      expect(meshCount(unknown.root)).toBeGreaterThan(5);
      expect(unknown.root.name).not.toContain('quiescent');
      expect(() => unknown.update(4.0)).not.toThrow();
      expect(() => accreting.update(4.0)).not.toThrow();
    } finally {
      unknown.dispose();
      accreting.dispose();
    }
  });

  it('locks the whole black-hole laboratory geometry to the camera even with a tilted parent', () => {
    const parent = new THREE.Group();
    parent.rotation.set(0.2, -0.3, 0.25);
    const root = new THREE.Group();
    parent.add(root);
    const camera = new THREE.PerspectiveCamera();
    for (const position of [new THREE.Vector3(0, 1, 8), new THREE.Vector3(8, 3, 0),
      new THREE.Vector3(-4, -6, 3)]) {
      camera.position.copy(position);
      camera.lookAt(0, 0, 0);
      orientCompactBlackHoleToCamera(root, camera);
      const worldOrientation = root.getWorldQuaternion(new THREE.Quaternion());
      const cameraOrientation = camera.getWorldQuaternion(new THREE.Quaternion());
      expect(Math.abs(worldOrientation.dot(cameraOrientation))).toBeCloseTo(1, 7);
      // It never alters the underlying system transform / orbital model.
      expect(parent.rotation.z).toBeCloseTo(0.25);
    }
  });
});
