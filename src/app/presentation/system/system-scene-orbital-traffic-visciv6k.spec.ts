import * as THREE from 'three';
import {
  buildSystemSceneOrbitalRingPlansV1,
  createSystemSceneOrbitalRingVisualV1,
  updateOrbitalRingTrafficVISCIV6k,
  type SystemSceneOrbitalRingKindV1,
  type SystemSceneOrbitalRingPlanV1,
} from './system-scene-artificial-satellites-visciv2';
import {
  buildOrbitalTrafficPlansVISCIV6k,
  createOrbitalTrafficVisualVISCIV6k,
  updateOrbitalTrafficVISCIV6k,
} from './system-scene-orbital-traffic-visciv6k';

function findRingVISCIV6k(kind: SystemSceneOrbitalRingKindV1): SystemSceneOrbitalRingPlanV1 {
  for (let seed = 0; seed < 2000; seed++) {
    const rings = buildSystemSceneOrbitalRingPlansV1(seed * 7919, 'VERY_ADVANCED');
    const result = rings.find(ring => ring.ringKind === kind);
    if (result) return result;
  }
  throw new Error(`VISCIV.6k: no se ha encontrado anillo ${kind}`);
}

function matricesVISCIV6k(mesh: THREE.InstancedMesh): number[][] {
  const matrix = new THREE.Matrix4();
  return Array.from({ length: mesh.count }, (_, index) => {
    mesh.getMatrixAt(index, matrix);
    return matrix.toArray();
  });
}

describe('VISCIV.6k — convoyes, lanzaderas y tráfico entre terminales', () => {
  it('genera tres familias de tráfico diferentes, deterministas y acotadas en todos los anillos', () => {
    for (const kind of ['HABITAT', 'INDUSTRIAL', 'TRANSPORT'] as const) {
      const ring = findRingVISCIV6k(kind);
      const first = buildOrbitalTrafficPlansVISCIV6k(ring);
      const second = buildOrbitalTrafficPlansVISCIV6k(ring);
      expect(first).toEqual(second);
      expect(first.length).toBeGreaterThanOrEqual(20);
      expect(first.length).toBeLessThanOrEqual(40);
      expect(new Set(first.map(vehicle => vehicle.role))).toEqual(new Set(['CONVOY', 'SHUTTLE', 'TERMINAL']));
      expect(first.every(vehicle => vehicle.speedCyclesPerDay > 0 && vehicle.nodeCount >= 6)).toBe(true);
      const width = ring.bandWidthPlanetRadii ?? 0.13;
      expect(first.every(vehicle => Math.abs(vehicle.laneRadiusPlanetRadii - ring.orbitRadiusPlanetRadii)
        < width * 0.8)).toBe(true);
    }
  });

  it('anima instancias reutilizables sin reconstruir recursos GPU ni cambiar la jerarquía', () => {
    const plan = findRingVISCIV6k('TRANSPORT');
    const visual = createOrbitalTrafficVisualVISCIV6k(plan, 1);
    try {
      expect(visual.group.children).toHaveLength(3);
      expect(visual.batches).toHaveLength(3);
      expect(visual.resources).toHaveLength(6);
      expect(visual.group.children.every(child => child instanceof THREE.InstancedMesh)).toBe(true);
      expect(visual.batches.every(batch => !batch.mesh.frustumCulled)).toBe(true);
      expect(visual.batches.find(batch => batch.role === 'SHUTTLE')!.mesh.geometry)
        .toBeInstanceOf(THREE.ConeGeometry);
      const resources = [...visual.resources];
      updateOrbitalTrafficVISCIV6k(visual, 25);
      expect(visual.resources).toEqual(resources);
      expect(visual.batches.every(batch => batch.mesh.instanceMatrix.version > 0)).toBe(true);
    } finally {
      visual.resources.forEach(resource => resource.dispose());
    }
  });

  it('la posición depende del tiempo absoluto: rebobinar y repetir no genera deriva', () => {
    const ring = findRingVISCIV6k('HABITAT');
    const visual = createOrbitalTrafficVisualVISCIV6k(ring, 1);
    try {
      updateOrbitalTrafficVISCIV6k(visual, 12.5);
      const first = visual.batches.map(batch => matricesVISCIV6k(batch.mesh));
      updateOrbitalTrafficVISCIV6k(visual, 43.25);
      const moved = visual.batches.map(batch => matricesVISCIV6k(batch.mesh));
      expect(moved).not.toEqual(first);
      updateOrbitalTrafficVISCIV6k(visual, 12.5);
      expect(visual.batches.map(batch => matricesVISCIV6k(batch.mesh))).toEqual(first);
      updateOrbitalTrafficVISCIV6k(visual, -100.2);
      for (const batch of visual.batches) {
        const current = matricesVISCIV6k(batch.mesh);
        expect(current.every(matrix => matrix.every(value => Number.isFinite(value)))).toBe(true);
      }
    } finally {
      visual.resources.forEach(resource => resource.dispose());
    }
  });

  it('el tráfico entre terminales sale del nodo y regresa, sin saltos entre vueltas', () => {
    const ring = findRingVISCIV6k('INDUSTRIAL');
    const visual = createOrbitalTrafficVisualVISCIV6k(ring, 1);
    try {
      const terminal = visual.batches.find(batch => batch.role === 'TERMINAL')!;
      const first = terminal.vehicles[0]!;
      const startDay = -first.phase01 / (first.speedCyclesPerDay * first.direction);
      const endDay = startDay + 1 / first.speedCyclesPerDay;
      const matrix = new THREE.Matrix4();
      updateOrbitalTrafficVISCIV6k(visual, startDay);
      terminal.mesh.getMatrixAt(0, matrix);
      const start = new THREE.Vector3().setFromMatrixPosition(matrix);
      updateOrbitalTrafficVISCIV6k(visual, startDay + 0.5 / first.speedCyclesPerDay);
      terminal.mesh.getMatrixAt(0, matrix);
      const middle = new THREE.Vector3().setFromMatrixPosition(matrix);
      updateOrbitalTrafficVISCIV6k(visual, endDay);
      terminal.mesh.getMatrixAt(0, matrix);
      const end = new THREE.Vector3().setFromMatrixPosition(matrix);
      expect(middle.distanceTo(start)).toBeGreaterThan(0.08);
      expect(end.distanceTo(start)).toBeLessThan(1e-5);
    } finally {
      visual.resources.forEach(resource => resource.dispose());
    }
  });

  it('se acopla al render real sin alterar planos, arquitectura monumental ni luces nocturnas', () => {
    const ring = findRingVISCIV6k('HABITAT');
    const visual = createSystemSceneOrbitalRingVisualV1(ring, 1);
    try {
      expect(visual.orbitalTrafficVISCIV6k).toBeDefined();
      expect(visual.orbitalTrafficVISCIV6k!.group.parent).toBe(visual.rotationPivot);
      expect(visual.rotationPivot.children.filter(child => child instanceof THREE.InstancedMesh)).toHaveLength(2);
      expect(visual.rotationPivot.getObjectByName('VISCIV6i monumental orbital superstructure')).toBeTruthy();
      expect(visual.architecturalLightsVISCIV6j!.length).toBeGreaterThanOrEqual(2);
      expect(visual.nightBeaconsVISCIV6g).toBeDefined();
      expect(visual.group.rotation.x).toBeCloseTo(ring.inclinationRadians);
      expect(visual.group.rotation.z).toBeCloseTo(ring.ascendingNodeRadians);
      updateOrbitalRingTrafficVISCIV6k(visual, 5);
      updateOrbitalRingTrafficVISCIV6k(visual, 120);
    } finally {
      visual.resources.forEach(resource => resource.dispose());
    }
  });
});
