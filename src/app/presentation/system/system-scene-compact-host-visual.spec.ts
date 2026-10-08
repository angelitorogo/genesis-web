import * as THREE from 'three';

import {
  createSystemSceneCompactHostVisual,
  systemSceneCompactHostSampleIndex,
  systemSceneCompactHostVisualExtentRadiusScene,
} from './system-scene-compact-host-visual';

describe('SystemScene specialized compact-host visuals', () => {
  it('selects laboratory A-H diversity deterministically from the persistent host id', () => {
    const a = systemSceneCompactHostSampleIndex('G0/S-34359738368/A');
    const replay = systemSceneCompactHostSampleIndex('G0/S-34359738368/A');
    const b = systemSceneCompactHostSampleIndex('G0/S-34359738368/B');

    expect(a).toBe(replay);
    expect(a).toBeGreaterThanOrEqual(0);
    expect(a).toBeLessThan(8);
    expect(b).toBeGreaterThanOrEqual(0);
    expect(b).toBeLessThan(8);
  });

  it('builds a rotating quarter-scale neutron-star visual from the approved laboratory model', () => {
    const visual = createSystemSceneCompactHostVisual('NEUTRON_STAR', 'fixture-neutron-star');
    const camera = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.2, -0.4, 0.1));

    expect(visual.root.userData['canonicalVisualSource']).toBe('NEUTRON_STAR_LABORATORY');
    expect(visual.visualExtentRadiusScene).toBeLessThan(0.35);

    const billboard = visual.root.children[0] as THREE.Group | undefined;
    const spinRoot = billboard?.children[0] as THREE.Group | undefined;
    expect(spinRoot).toBeDefined();
    expect(spinRoot!.scale.x).toBeLessThan(0.04);

    const before = spinRoot!.rotation.y;
    visual.update(3.5, camera);
    expect(spinRoot!.rotation.y).not.toBe(before);

    visual.dispose();
  });

  it('builds the canonical laboratory black-hole geometry without the old permanent locator sprites', () => {
    const visual = createSystemSceneCompactHostVisual('STELLAR_BLACK_HOLE', 'fixture-black-hole');
    const camera = new THREE.Quaternion();

    expect(visual.root.userData['canonicalVisualSource']).toBe('BLACK_HOLE_LABORATORY');
    expect(systemSceneCompactHostVisualExtentRadiusScene('STELLAR_BLACK_HOLE')).toBeGreaterThan(0.4);

    const names: string[] = [];
    let spriteCount = 0;
    let shaderCount = 0;
    const depthTests: boolean[] = [];
    visual.root.traverse(object => {
      names.push(object.name);
      if (object instanceof THREE.Sprite) spriteCount += 1;
      const material = (object as THREE.Mesh).material;
      if (material instanceof THREE.ShaderMaterial) { shaderCount += 1; depthTests.push(material.depthTest); }
      else if (material instanceof THREE.Material) { depthTests.push(material.depthTest); }
    });

    expect(spriteCount).toBe(0);
    expect(shaderCount).toBeGreaterThan(3);
    expect(names.some(name => name.includes('lensing halo'))).toBe(false);
    expect(names.some(name => name.includes('lensing ring'))).toBe(false);
    expect(depthTests.every(value => value === true)).toBe(true);

    visual.update(4.2, camera);
    visual.dispose();
  });
});
