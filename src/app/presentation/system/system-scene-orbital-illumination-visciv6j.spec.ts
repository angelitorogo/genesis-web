import * as THREE from 'three';
import {
  buildSystemSceneOrbitalRingPlansV1,
  createSystemSceneOrbitalRingVisualV1,
  updateOrbitalRingNightLightsVISCIV6g,
  type SystemSceneOrbitalRingKindV1,
  type SystemSceneOrbitalRingPlanV1,
} from './system-scene-artificial-satellites-visciv2';
import type { OrbitalLightRoleVISCIV6j } from './system-scene-orbital-illumination-visciv6j';

const kinds: readonly SystemSceneOrbitalRingKindV1[] = ['HABITAT', 'INDUSTRIAL', 'TRANSPORT'];

function exampleRingVISCIV6j(kind: SystemSceneOrbitalRingKindV1): SystemSceneOrbitalRingPlanV1 {
  for (let seed = 0; seed < 512; seed++) {
    const plan = buildSystemSceneOrbitalRingPlansV1(Math.imul(seed + 1, 7919) >>> 0, 'VERY_ADVANCED')
      .find(candidate => candidate.ringKind === kind);
    if (plan) return plan;
  }
  throw Error('VISCIV.6j: no se ha encontrado un anillo ' + kind);
}

function layerByRoleVISCIV6j(
  visual: ReturnType<typeof createSystemSceneOrbitalRingVisualV1>, role: OrbitalLightRoleVISCIV6j,
) {
  const layer = visual.architecturalLightsVISCIV6j?.find(candidate => candidate.role === role);
  if (!layer) throw Error('VISCIV.6j: falta capa ' + role);
  return layer;
}

describe('VISCIV.6j — iluminación arquitectónica avanzada en infraestructura VERY_ADVANCED', () => {
  it('diferencia viviendas, astilleros y transporte, todos con nodos monumentales iluminables', () => {
    const expected: Record<SystemSceneOrbitalRingKindV1, readonly OrbitalLightRoleVISCIV6j[]> = {
      HABITAT: ['MAJOR_NODES', 'URBAN_WINDOWS', 'URBAN_BOULEVARDS'],
      INDUSTRIAL: ['MAJOR_NODES', 'SHIPYARD_ACTIVITY', 'GANTRY_SIGNALS'],
      TRANSPORT: ['MAJOR_NODES', 'TRANSPORT_LANES', 'TRANSPORT_TERMINALS'],
    };
    for (const kind of kinds) {
      const visual = createSystemSceneOrbitalRingVisualV1(exampleRingVISCIV6j(kind), 1);
      try {
        const layers = visual.architecturalLightsVISCIV6j!;
        expect(layers.map(layer => layer.role)).toEqual(expected[kind]);
        expect(visual.rotationPivot.getObjectByName('VISCIV6j architectural night lighting')).toBeInstanceOf(THREE.Group);
        for (const layer of layers) {
          expect(layer.mesh).toBeInstanceOf(THREE.InstancedMesh);
          expect(layer.mesh.count).toBeGreaterThan(0);
          expect(layer.mesh.count).toBeLessThanOrEqual(224);
          expect(layer.mesh.material).toBeInstanceOf(THREE.MeshBasicMaterial);
          expect(layer.radialDirections).toHaveLength(layer.mesh.count);
          expect(layer.colors).toHaveLength(layer.mesh.count);
          expect(layer.brightness).toHaveLength(layer.mesh.count);
          expect(layer.mesh.instanceColor).not.toBeNull();
        }
        expect(visual.rotationPivot.children.filter(child => child instanceof THREE.InstancedMesh)).toHaveLength(2);
        expect(visual.materials.every(binding => binding.material instanceof THREE.MeshStandardMaterial)).toBe(true);
        expect(visual.resources.every(resource => typeof resource.dispose === 'function')).toBe(true);
      } finally {
        visual.resources.forEach(resource => resource.dispose());
      }
    }
  });

  it('atenúa las ventanas urbanas en el lado diurno y las enciende al invertir la estrella', () => {
    const visual = createSystemSceneOrbitalRingVisualV1(exampleRingVISCIV6j('HABITAT'), 1);
    try {
      visual.group.rotation.set(0, 0, 0);
      visual.rotationPivot.rotation.set(0, 0, 0);
      const windows = layerByRoleVISCIV6j(visual, 'URBAN_WINDOWS');
      const day = new THREE.Color();
      const night = new THREE.Color();
      const twoStars = new THREE.Color();
      updateOrbitalRingNightLightsVISCIV6g(visual, [
        { direction: new THREE.Vector3(1, 0, 0), weight: 1 },
      ]);
      windows.mesh.getColorAt(0, day);
      updateOrbitalRingNightLightsVISCIV6g(visual, [
        { direction: new THREE.Vector3(-1, 0, 0), weight: 1 },
      ]);
      windows.mesh.getColorAt(0, night);
      expect(night.r).toBeGreaterThan(day.r * 40);
      updateOrbitalRingNightLightsVISCIV6g(visual, [
        { direction: new THREE.Vector3(1, 0, 0), weight: 1 },
        { direction: new THREE.Vector3(-1, 0, 0), weight: 1 },
      ]);
      windows.mesh.getColorAt(0, twoStars);
      expect(twoStars.r).toBeGreaterThan(day.r);
      expect(twoStars.r).toBeLessThan(night.r);
    } finally {
      visual.resources.forEach(resource => resource.dispose());
    }
  });

  it('conserva variación de ventanas habitadas y apagadas, sin generar luces físicas', () => {
    const visual = createSystemSceneOrbitalRingVisualV1(exampleRingVISCIV6j('HABITAT'), 1);
    try {
      const windows = layerByRoleVISCIV6j(visual, 'URBAN_WINDOWS');
      const levels = new Set(windows.brightness.map(value => value.toFixed(2)));
      expect(levels.size).toBeGreaterThan(12);
      expect(windows.brightness.some(value => value < 0.1)).toBe(true);
      expect(windows.brightness.some(value => value > 0.8)).toBe(true);
      let lights = 0;
      visual.group.traverse(object => { if (object instanceof THREE.Light) lights++; });
      expect(lights).toBe(0);
    } finally {
      visual.resources.forEach(resource => resource.dispose());
    }
  });

  it('es determinista y mantiene las matrices de las instancias al actualizar iluminación', () => {
    for (const kind of kinds) {
      const plan = exampleRingVISCIV6j(kind);
      const a = createSystemSceneOrbitalRingVisualV1(plan, 1);
      const b = createSystemSceneOrbitalRingVisualV1(plan, 1);
      try {
        const lightsA = a.architecturalLightsVISCIV6j!;
        const lightsB = b.architecturalLightsVISCIV6j!;
        const matrix = new THREE.Matrix4();
        const before: number[][] = [];
        lightsA.forEach(layer => {
          layer.mesh.getMatrixAt(0, matrix);
          before.push(matrix.toArray());
        });
        updateOrbitalRingNightLightsVISCIV6g(a, [
          { direction: new THREE.Vector3(-1, 0, 0), weight: 1 },
        ]);
        updateOrbitalRingNightLightsVISCIV6g(b, [
          { direction: new THREE.Vector3(-1, 0, 0), weight: 1 },
        ]);
        lightsA.forEach((layer, i) => {
          const other = lightsB[i]!;
          layer.mesh.getMatrixAt(0, matrix);
          expect(matrix.toArray()).toEqual(before[i]);
          const first = new THREE.Color();
          const second = new THREE.Color();
          layer.mesh.getColorAt(0, first);
          other.mesh.getColorAt(0, second);
          expect(first.toArray()).toEqual(second.toArray());
        });
      } finally {
        a.resources.forEach(resource => resource.dispose());
        b.resources.forEach(resource => resource.dispose());
      }
    }
  });

  it('no crea anillos artificiales para ADVANCED y conserva 1 a 3 para VERY_ADVANCED', () => {
    for (let seed = 0; seed < 512; seed++) {
      expect(buildSystemSceneOrbitalRingPlansV1(seed, 'ADVANCED')).toHaveLength(0);
      const veryAdvanced = buildSystemSceneOrbitalRingPlansV1(seed, 'VERY_ADVANCED');
      expect(veryAdvanced.length).toBeGreaterThanOrEqual(1);
      expect(veryAdvanced.length).toBeLessThanOrEqual(3);
    }
  });
});
