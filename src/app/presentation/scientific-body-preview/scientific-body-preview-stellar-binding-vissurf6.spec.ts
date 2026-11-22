import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import type { SystemScenePlanetLightBindingV1 } from '../system/system-scene-atmosphere-material';
import { buildPreviewStellarLightSourcesVISSURF6 } from '../scientific/scientific-body-preview';
import { updatePreviewStellarLightBindingVISSURF6 } from './scientific-body-preview-stellar-binding-vissurf6';

function binding(): SystemScenePlanetLightBindingV1 {
  return {
    lightDirectionsView: [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()],
    lightWeightsView: new THREE.Vector3(),
    orbitalHomeDirectionsView: [new THREE.Vector3(), new THREE.Vector3()],
    orbitalHomeFlagsView: new THREE.Vector2(),
  };
}

const stars = [
  {id:'S0', position:{x:2,y:0,z:0}, sourceLuminositySolar:4},
  {id:'S1', position:{x:0,y:3,z:0}, sourceLuminositySolar:9},
  {id:'S2', position:{x:0,y:0,z:4}, sourceLuminositySolar:4},
  {id:'S3', position:{x:5,y:0,z:0}, sourceLuminositySolar:0},
] as const;
const position = {x:0,y:0,z:0};

describe('VISSURF.6 · physical stellar light in scientific previews', () => {
  it('returns luminous stars for single, binary and triple systems, without any VIDA input', () => {
    for (const count of [1, 2, 3]) {
      const sources = buildPreviewStellarLightSourcesVISSURF6(
        stars.slice(0,count), position, new Set(['S0','S1']),
      );
      expect(sources).toHaveLength(count);
      expect(sources.reduce((sum, source) => sum + source.weight01,0))
        .toBeCloseTo(1, 10);
      expect(sources.every(source => Number.isFinite(source.weight01))).toBe(true);
      expect(sources[0]!.isOrbitalHost).toBe(true);
    }
  });

  it('matches SystemScene sqrt(flux) compression and does not include non-luminous stars', () => {
    const sources = buildPreviewStellarLightSourcesVISSURF6(stars,position,new Set(['S0']));
    expect(sources).toHaveLength(3);
    const expected = [1,1,0.5].map(weight => weight / 2.5);
    sources.forEach((source, index) => {
      expect(source.weight01).toBeCloseTo(expected[index]!, 10);
    });
    expect(sources.filter(source => source.isOrbitalHost)).toHaveLength(1);
  });

  it('uses the same world directions as Three lights and transforms them into camera view space', () => {
    const sources = buildPreviewStellarLightSourcesVISSURF6(
      stars.slice(0, 2), position, new Set(['S0', 'S1']),
    );
    const lights = binding();
    const view = new THREE.Matrix4().makeRotationY(0.8);
    updatePreviewStellarLightBindingVISSURF6(lights,sources,view);
    for (let i=0; i<sources.length; i++) {
      const source = sources[i]!;
      const expected = new THREE.Vector3(source.x,source.y,source.z).transformDirection(view);
      expect(lights.lightDirectionsView[i]!.distanceTo(expected)).toBeLessThan(1e-12);
    }
    expect(lights.lightWeightsView.x).toBeCloseTo(sources[0]!.weight01,10);
    expect(lights.orbitalHomeFlagsView?.x).toBe(1);
    expect(lights.orbitalHomeFlagsView?.y).toBe(1);
    // A subsequent planet must not inherit the old second source or its host flag.
    updatePreviewStellarLightBindingVISSURF6(lights,sources.slice(0,1),new THREE.Matrix4());
    expect(lights.lightWeightsView.y).toBe(0);
    expect(lights.orbitalHomeFlagsView?.y).toBe(0);
  });

  it('uses a consistent key-light fallback for older serialized previews', () => {
    const b = binding();
    updatePreviewStellarLightBindingVISSURF6(b,[],new THREE.Matrix4());
    expect(b.lightWeightsView.toArray()).toEqual([1,0,0]);
    expect(b.lightDirectionsView[0]!.distanceTo(
      new THREE.Vector3(4.5,3,5).normalize(),
    )).toBeLessThan(1e-12);
  });
});
