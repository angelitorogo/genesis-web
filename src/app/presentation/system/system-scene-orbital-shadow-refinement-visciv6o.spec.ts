import * as THREE from 'three';
import {
  buildSystemSceneOrbitalRingPlansV1,
  createSystemSceneOrbitalRingVisualV1,
} from './system-scene-artificial-satellites-visciv2';
import {
  orbitalMonumentalHubHalfWidthVISCIV6o,
  orbitalMonumentalHubSilhouetteVISCIV6o,
  orbitalRingSurfaceShadowOcclusionVISCIV6n,
  patchOrbitalSurfaceShadowShaderVISCIV6n,
} from './system-scene-orbital-surface-shadow-visciv6n';
import {
  planetShadowTransmissionVISCIV6m,
  updateOrbitalPlanetShadowVISCIV6m,
} from './system-scene-orbital-planet-shadow-visciv6m';
import { patchSystemSceneDayNightFragmentShaderV1 } from './system-scene-atmosphere-material';

function shaderFixtureVISCIV6o(): string {
  return patchSystemSceneDayNightFragmentShaderV1([
    '#include <common>', 'vec3 outgoingLight = vec3(1.0);', '#include <opaque_fragment>',
  ].join('\n'), true);
}

describe('VISCIV.6o — refinamiento de sombras orbitales continuas y rendimiento', () => {
  it('mantiene un núcleo continuo sin recuperar rayas en los sectores estructurales', () => {
    const source = patchOrbitalSurfaceShadowShaderVISCIV6n(shaderFixtureVISCIV6o());
    expect(source).toContain('float opacity = 0.80;');
    expect(source).toContain('outgoingLight *= (1.0 - 0.93 * occlusion)');
    expect(source).toContain('float nodeLobe = smoothstep(0.78, 0.985, nodeAlignment);');
    expect(source).toContain('float effectiveHalfWidth');
    expect(source).not.toContain('sin(arc');
    expect(source).not.toContain('cos(arc');
    expect(source).not.toContain('float trusses');
    expect(source).not.toContain('float monumentalSectors');
    expect(source.indexOf('outgoingLight *= (1.0 - 0.93 * occlusion)')).toBeLessThan(
      source.indexOf('outgoingLight += genesisUrbanEmission'),
    );
  });

  it('ensacha suavemente SOLO los dos grandes nodos y respeta la anchura habitual en el resto', () => {
    const axis = new THREE.Vector3(1, 0, 0);
    const industrial = orbitalMonumentalHubHalfWidthVISCIV6o('INDUSTRIAL', 1);
    const habitat = orbitalMonumentalHubHalfWidthVISCIV6o('HABITAT', 1);
    const transport = orbitalMonumentalHubHalfWidthVISCIV6o('TRANSPORT', 1);
    expect(industrial).toBeGreaterThan(habitat);
    expect(habitat).toBeGreaterThan(transport);
    expect(orbitalMonumentalHubHalfWidthVISCIV6o('HABITAT', 0)).toBe(0);
    const front = orbitalMonumentalHubSilhouetteVISCIV6o(new THREE.Vector3(1, 0, 0), axis, industrial);
    const back = orbitalMonumentalHubSilhouetteVISCIV6o(new THREE.Vector3(-1, 0, 0), axis, industrial);
    const midpoint = orbitalMonumentalHubSilhouetteVISCIV6o(new THREE.Vector3(0.9, 0.436, 0), axis, industrial);
    const side = orbitalMonumentalHubSilhouetteVISCIV6o(new THREE.Vector3(0, 0, 1), axis, industrial);
    expect(front).toBeCloseTo(industrial, 8);
    expect(back).toBeCloseTo(front, 8);
    expect(midpoint).toBeGreaterThan(0);
    expect(midpoint).toBeLessThan(front);
    expect(side).toBe(0);
  });

  it('descarta pronto los rayos fuera de las bandas y suaviza la sombra cerca del terminador', () => {
    const shader = patchOrbitalSurfaceShadowShaderVISCIV6n(shaderFixtureVISCIV6o());
    const cutoff = shader.indexOf('float radiusSq = dot(intersectionPoint, intersectionPoint);');
    const exact = shader.indexOf('float radialDistance = sqrt(radiusSq);');
    expect(cutoff).toBeGreaterThan(-1);
    expect(cutoff).toBeLessThan(exact);
    expect(shader).toContain('radiusSq < innerRadius * innerRadius || radiusSq > outerRadius * outerRadius');
    expect(shader).toContain('smoothstep(0.0, 0.09, facing)');
    // 6n.b physical intersection is unchanged; only silhouette and edge behaviour vary.
    const point = new THREE.Vector3(0.8, -0.6, 0);
    const star = new THREE.Vector3(0.95, 0.5, 0);
    expect(orbitalRingSurfaceShadowOcclusionVISCIV6n(point, star, new THREE.Vector3(0, 1, 0), 1.94, 0.15)).toBeGreaterThan(0.99);
    expect(orbitalRingSurfaceShadowOcclusionVISCIV6n(point, star, new THREE.Vector3(0, 1, 0), 3, 0.15)).toBe(0);
  });

  it('mantiene la umbra planetaria multiestrella sobre anillos y reutiliza la memoria de cada anillo', () => {
    const rings = buildSystemSceneOrbitalRingPlansV1(1, 'VERY_ADVANCED');
    expect(rings).toHaveLength(3);
    const visual = createSystemSceneOrbitalRingVisualV1(rings[0]!, 1);
    try {
      const shadow = visual.planetShadowVISCIV6m!;
      expect(shadow.scratchVISCIV6o).toBeDefined();
      const cached = shadow.scratchVISCIV6o!;
      const stars = [
        { direction: new THREE.Vector3(1, 0, 0), weight: 1 },
        { direction: new THREE.Vector3(-1, 0, 0), weight: 2 },
        { direction: new THREE.Vector3(0, 0, 1), weight: 1 },
      ];
      updateOrbitalPlanetShadowVISCIV6m(shadow, visual.group, visual.rotationPivot, stars);
      expect(cached.sources).toHaveLength(3);
      const firstSource = cached.sources[0];
      updateOrbitalPlanetShadowVISCIV6m(shadow, visual.group, visual.rotationPivot, stars);
      expect(shadow.scratchVISCIV6o).toBe(cached);
      expect(cached.sources[0]).toBe(firstSource);
      expect(planetShadowTransmissionVISCIV6m(new THREE.Vector3(-2, 0, 0), stars[0]!.direction, 1)).toBe(0);
      expect(planetShadowTransmissionVISCIV6m(new THREE.Vector3(2, 0, 0), stars[0]!.direction, 1)).toBe(1);
      updateOrbitalPlanetShadowVISCIV6m(shadow, visual.group, visual.rotationPivot, []);
      const band = shadow.batches.find(batch => batch.mesh.name === 'Segmented structural ring')!;
      const color = new THREE.Color();
      band.mesh.getColorAt(48, color);
      expect(color.r).toBeCloseTo(1, 6);
    } finally {
      visual.resources.forEach(resource => resource.dispose());
    }
  });
});
