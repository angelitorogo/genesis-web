import * as THREE from 'three';
import {
  MOON_ATMOSPHERE_FRAGMENT_SHADER_V1,
} from './system-scene-moon-renderable';
import {
  createV2BodyLightBinding,
  installV2BodyLightingOnSurfaces,
  installV2MoonAtmosphereLighting,
  systemSceneLightingTargets,
  v2SmallBodyDayNightProfile,
} from './system-scene-v2-body-lighting';

describe('15.3 — V2 common stellar lighting for every reflected body', () => {
  it('preserves V1 planet-only targets and includes each planet, moon and minor body in V2', () => {
    const planets = [{ id: 'planet-A' }, { id: 'planet-AB' }];
    const moons = [{ id: 'moon-A' }, { id: 'moon-AB' }];
    const minorBodies = [
      { id: 'asteroid-A' }, { id: 'comet-B' }, { id: 'tno-C' }, { id: 'captured-AB' },
    ];
    const input = { planets, moons, minorBodies };
    expect(systemSceneLightingTargets({ ...input, generatorVersionCode: 1 }))
      .toEqual(planets);
    expect(systemSceneLightingTargets({ ...input, generatorVersionCode: 2 }).map(body => body.id))
      .toEqual(['planet-A', 'planet-AB', 'moon-A', 'moon-AB',
        'asteroid-A', 'comet-B', 'tno-C', 'captured-AB']);
  });

  it('gives each body independent directions and weights for up to THREE stars', () => {
    const moon = createV2BodyLightBinding();
    const planet = createV2BodyLightBinding();
    moon.lightWeightsView.set(0.55, 0.32, 0.13);
    moon.lightDirectionsView[0].set(1, 0, 0);
    moon.lightDirectionsView[1].set(0, 1, 0);
    moon.lightDirectionsView[2].set(0, 0, 1);
    expect(moon.lightWeightsView.toArray()).toEqual([0.55, 0.32, 0.13]);
    expect(moon.lightDirectionsView.map(vector => vector.toArray()))
      .toEqual([[1, 0, 0], [0, 1, 0], [0, 0, 1]]);
    expect(planet.lightWeightsView.toArray()).toEqual([1, 0, 0]);
    expect(planet.lightDirectionsView[1].toArray()).toEqual([1, 0, 0]);
  });

  it('applies the same planetary day/night shader to moon surface, clouds, asteroid, comet nucleus, TNO and captured surfaces', () => {
    const binding = createV2BodyLightBinding();
    const root = new THREE.Group();
    const surface = new THREE.Mesh(
      new THREE.SphereGeometry(1), new THREE.MeshStandardMaterial(),
    );
    const clouds = new THREE.Mesh(
      new THREE.SphereGeometry(1.02), new THREE.MeshStandardMaterial({ transparent: true }),
    );
    const cometTail = new THREE.Mesh(
      new THREE.ConeGeometry(0.1, 2), new THREE.MeshBasicMaterial({ transparent: true }),
    );
    root.add(surface, clouds, cometTail);
    expect(installV2BodyLightingOnSurfaces(root, binding)).toBe(2);
    expect(surface.material.userData['genesisDayNightPipeline']).toBeTruthy();
    expect(clouds.material.userData['genesisDayNightPipeline']).toBeTruthy();
    expect(cometTail.material.userData['genesisDayNightPipeline']).toBeUndefined();
    const shader = {
      uniforms: {},
      fragmentShader: '#include <common>\nvec3 normal = vec3(0.0);\nvec3 outgoingLight = vec3(1.0);\n#include <opaque_fragment>',
    } as unknown as Parameters<typeof surface.material.onBeforeCompile>[0];
    surface.material.onBeforeCompile(shader, {} as THREE.WebGLRenderer);
    expect(shader.uniforms['uGenesisLightDirectionsView'].value).toBe(binding.lightDirectionsView);
    expect(shader.uniforms['uGenesisLightWeights'].value).toBe(binding.lightWeightsView);
    expect(shader.fragmentShader).toContain('genesisDayFactor2');
    expect(shader.fragmentShader).toContain('genesisNightVisibility');
    expect(cometTail.material.onBeforeCompile).not.toBe(surface.material.onBeforeCompile);
    [surface, clouds, cometTail].forEach(mesh => {
      mesh.geometry.dispose();
      mesh.material.dispose();
    });
  });

  it('darkens a moon atmosphere on its night side with those SAME moving stellar uniforms', () => {
    const binding = createV2BodyLightBinding();
    const root = new THREE.Group();
    const shell = new THREE.ShaderMaterial({
      vertexShader: 'void main() { gl_Position = vec4(0.0); }',
      fragmentShader: MOON_ATMOSPHERE_FRAGMENT_SHADER_V1,
    });
    shell.name = 'GENESIS moon atmosphere 25.10';
    const geometry = new THREE.SphereGeometry(1);
    root.add(new THREE.Mesh(geometry, shell));
    expect(installV2MoonAtmosphereLighting(root, binding)).toBe(1);
    expect(shell.uniforms['uGenesisLightDirectionsView'].value).toBe(binding.lightDirectionsView);
    expect(shell.uniforms['uGenesisLightWeights'].value).toBe(binding.lightWeightsView);
    expect(shell.fragmentShader).toContain('genesisMoonDay');
    expect(shell.fragmentShader).toContain('genesisAlpha *= mix(0.08, 1.0, genesisMoonDay)');
    expect(shell.userData['genesisV2MultistellarMoonAtmosphere']).toBe(true);
    geometry.dispose();
    shell.dispose();
  });

  it('uses low night floors for airless objects and leaves intrinsic emission materials alone', () => {
    const vacuum = v2SmallBodyDayNightProfile();
    const atmosphere = v2SmallBodyDayNightProfile(true, '#b2c5d8');
    expect(vacuum.atmospherePresent).toBe(false);
    expect(vacuum.twilightGlow01).toBe(0);
    expect(vacuum.nightFloor01).toBeLessThan(atmosphere.nightFloor01);
    expect(atmosphere.dayTintHex).toBe('#b2c5d8');
  });
});
