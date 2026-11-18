import * as THREE from 'three';
import {
  installSystemSceneDayNightMaterialV1,
  patchSystemSceneDayNightFragmentShaderV1,
} from './system-scene-atmosphere-material';
import {
  buildSystemSceneOrbitalRingPlansV1,
} from './system-scene-artificial-satellites-visciv2';
import {
  installOrbitalSurfaceShadowVISCIV6n,
  orbitalRingSurfaceShadowOcclusionVISCIV6n,
  patchOrbitalSurfaceShadowShaderVISCIV6n,
  type OrbitalSurfaceShadowRingVISCIV6n,
} from './system-scene-orbital-surface-shadow-visciv6n';

function shadowSample() {
  return {
    point: new THREE.Vector3(0.8, -0.6, 0),
    star: new THREE.Vector3(0.95, 0.5, 0),
    normal: new THREE.Vector3(0, 1, 0),
  };
}

function mockDayNightShader() {
  return patchSystemSceneDayNightFragmentShaderV1([
    '#include <common>',
    'vec3 outgoingLight = vec3(0.9);',
    '#include <opaque_fragment>',
  ].join('\n'), true);
}

describe('VISCIV.6n — sombras de los anillos artificiales sobre la superficie planetaria', () => {
  it('proyecta sobre la cara diurna solo si el rayo hacia la estrella atraviesa el anillo', () => {
    const { point, star, normal } = shadowSample();
    const centreShadow = orbitalRingSurfaceShadowOcclusionVISCIV6n(
      point, star, normal, 1.94, 0.15,
    );
    expect(centreShadow).toBeGreaterThan(0.99);
    expect(orbitalRingSurfaceShadowOcclusionVISCIV6n(point, star, normal, 2.7, 0.15)).toBe(0);
    expect(orbitalRingSurfaceShadowOcclusionVISCIV6n(point, star.clone().negate(), normal, 1.94, 0.15)).toBe(0);
    expect(orbitalRingSurfaceShadowOcclusionVISCIV6n(point, new THREE.Vector3(1, 0, 0), normal, 1.94, 0.15)).toBe(0);
    expect(orbitalRingSurfaceShadowOcclusionVISCIV6n(point, star, normal, 1.94, 0)).toBe(0);
  });

  it('suaviza los bordes y responde a la inclinación orbital', () => {
    const { point, star, normal } = shadowSample();
    const full = orbitalRingSurfaceShadowOcclusionVISCIV6n(point, star, normal, 1.94, 0.15);
    const edge = orbitalRingSurfaceShadowOcclusionVISCIV6n(point, star, normal, 1.77, 0.15);
    const outside = orbitalRingSurfaceShadowOcclusionVISCIV6n(point, star, normal, 1.65, 0.15);
    expect(full).toBeGreaterThan(edge);
    expect(edge).toBeGreaterThan(0);
    expect(outside).toBe(0);
    const tilted = new THREE.Vector3(0.3, 1, -0.2).normalize();
    expect(orbitalRingSurfaceShadowOcclusionVISCIV6n(point, star, tilted, 1.94, 0.15)).not.toBe(full);
  });


  it('refuerza visualmente la banda con una anchura mínima aparente y una umbra más presente', () => {
    const { point, star, normal } = shadowSample();
    const thinButVisible = orbitalRingSurfaceShadowOcclusionVISCIV6n(point, star, normal, 1.94, 0.02);
    const regular = orbitalRingSurfaceShadowOcclusionVISCIV6n(point, star, normal, 1.94, 0.15);
    expect(thinButVisible).toBeGreaterThan(0.95);
    expect(regular).toBeGreaterThan(0.99);
    const patched = patchOrbitalSurfaceShadowShaderVISCIV6n(mockDayNightShader());
    expect(patched).toContain('angleThicknessBoost');
    expect(patched).toContain('float opacity = 0.80;');
    expect(patched).not.toContain('float trusses =');
    expect(patched).not.toContain('float nodes =');
    expect(patched).not.toContain('monumentalSectors');
    expect(patched).toContain('effectiveHalfWidth');
  });

  it('mantiene umbra y anchura de 6n.a, pero elimina las rayas y la variación angular', () => {
    const patched = patchOrbitalSurfaceShadowShaderVISCIV6n(mockDayNightShader());
    const start = patched.indexOf('float genesisRingShadowForStarVISCIV6n(');
    const end = patched.indexOf('return clamp(1.0 - transmitted, 0.0, 1.0);', start);
    const projection = patched.slice(start, end);
    expect(projection).toContain('float opacity = 0.80;');
    expect(projection).not.toContain('float trusses');
    expect(projection).not.toContain('float nodes');
    expect(projection).not.toContain('monumentalSectors');
    expect(projection).not.toContain('sin(arc');
    expect(projection).not.toContain('cos(arc');
    expect(projection).toContain('float angleThicknessBoost = 0.030');
    expect(projection).toContain('float effectiveFade = max(0.001, band.z * 0.72)');
    expect(patched).toContain('outgoingLight *= (1.0 - 0.93 * occlusion)');
  });

  it('combina la sombra con el shader de 25.6 antes de sumar la iluminación urbana', () => {
    const patched = patchOrbitalSurfaceShadowShaderVISCIV6n(mockDayNightShader());
    expect(patched).toContain('uGenesisRingShadowCountVISCIV6n');
    expect(patched).toContain('uGenesisRingNormalsViewVISCIV6n[3]');
    expect(patched).toContain('shadowW0');
    expect(patched).toContain('shadowW1');
    expect(patched).toContain('shadowW2');
    expect(patched).toContain('uGenesisRingAxesViewVISCIV6n');
    expect(patched.indexOf('outgoingLight *= (1.0 - 0.93 * occlusion)')).toBeLessThan(
      patched.indexOf('outgoingLight += genesisUrbanEmission'),
    );
    expect(() => patchOrbitalSurfaceShadowShaderVISCIV6n('#include <common>')).toThrow();
  });

  it('actualiza hasta tres planos reales al rotar la cámara/anillos y se desactiva al ocultar estructuras', () => {
    const planet = new THREE.Group();
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), new THREE.MeshStandardMaterial());
    sphere.scale.setScalar(0.8);
    planet.add(sphere);
    const plans = buildSystemSceneOrbitalRingPlansV1(1, 'VERY_ADVANCED');
    expect(plans).toHaveLength(3);
    const rings: OrbitalSurfaceShadowRingVISCIV6n[] = plans.map(plan => {
      const root = new THREE.Group();
      root.rotation.x = plan.inclinationRadians;
      root.rotation.z = plan.ascendingNodeRadians;
      const rotor = new THREE.Group();
      rotor.rotation.y = plan.phaseRadians;
      root.add(rotor);
      planet.add(root);
      return { root, rotor, plan };
    });
    const material = sphere.material;
    installSystemSceneDayNightMaterialV1(material, {
      version: 1, terminatorSoftness01: 0.08, nightFloor01: 0.03,
      twilightGlow01: 0.1, atmospherePresent: false,
      dayTintHex: '#ffffff', nightTintHex: '#233c5b',
    }, {
      lightDirectionsView: [new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(-1, 0, 0)],
      lightWeightsView: new THREE.Vector3(0.5, 0.3, 0.2),
    });
    const shaderBinding = installOrbitalSurfaceShadowVISCIV6n(material, sphere, rings, 0.8);
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.set(0, 1, 6);
    camera.lookAt(0, 0, 0);
    shaderBinding.update(camera, true);
    const shader = { uniforms: {}, fragmentShader: [
      '#include <common>', 'vec3 normal = vec3(0,0,1);',
      'vec3 outgoingLight = vec3(1);', '#include <opaque_fragment>',
    ].join('\n') } as unknown as Parameters<typeof material.onBeforeCompile>[0];
    material.onBeforeCompile(shader, {} as THREE.WebGLRenderer);
    const count = shader.uniforms['uGenesisRingShadowCountVISCIV6n']!;
    const normals = shader.uniforms['uGenesisRingNormalsViewVISCIV6n']!;
    const bands = shader.uniforms['uGenesisRingBandsVISCIV6n']!;
    expect(count.value).toBe(3);
    expect(bands.value[0].x).toBeCloseTo(plans[0]!.orbitRadiusPlanetRadii * 0.8);
    const initial = (normals.value[0] as THREE.Vector3).clone();
    planet.rotation.y = 0.4;
    shaderBinding.update(camera, true);
    expect((normals.value[0] as THREE.Vector3).distanceTo(initial)).toBeGreaterThan(0.01);
    shaderBinding.update(camera, false);
    expect(count.value).toBe(0);
    shaderBinding.update(camera, true);
    expect(count.value).toBe(3);
    expect(material.customProgramCacheKey()).toContain('VISCIV-6n-RING-SHADOW');
    sphere.geometry.dispose();
    material.dispose();
  });

  it('no genera ninguna banda artificial en civilizaciones ADVANCED y conserva geometrías deterministas', () => {
    expect(buildSystemSceneOrbitalRingPlansV1(1, 'ADVANCED')).toHaveLength(0);
    for (const seed of [0, 1, 145872, 7919, 0xfffffff0]) {
      const a = buildSystemSceneOrbitalRingPlansV1(seed, 'VERY_ADVANCED');
      const b = buildSystemSceneOrbitalRingPlansV1(seed, 'VERY_ADVANCED');
      expect(a).toEqual(b);
      expect(a.length).toBeGreaterThanOrEqual(1);
      expect(a.length).toBeLessThanOrEqual(3);
      for (const plan of a) {
        expect(plan.bandWidthPlanetRadii).toBeGreaterThan(0.05);
      }
    }
  });
});
