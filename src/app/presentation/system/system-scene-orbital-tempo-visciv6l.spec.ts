import * as THREE from 'three';
import {
  buildSystemSceneArtificialSatellitePlansV1,
  buildSystemSceneOrbitalRingPlansV1,
  buildSystemSceneOrbitalStationPlansV1,
} from './system-scene-artificial-satellites-visciv2';
import {
  buildOrbitalTrafficPlansVISCIV6k,
  createOrbitalTrafficVisualVISCIV6k,
  updateOrbitalTrafficVISCIV6k,
} from './system-scene-orbital-traffic-visciv6k';
import {
  ORBITAL_VISUAL_TEMPO_VISCIV6l,
  slowOrbitalVisualSpeedVISCIV6l,
} from './system-scene-orbital-tempo-visciv6l';

const EPSILON = 1e-9;

function expectedBaseRangeVISCIV6l(role: 'CONVOY' | 'SHUTTLE' | 'TERMINAL'): readonly [number, number] {
  switch (role) {
    case 'CONVOY': return [0.035, 0.051];
    case 'SHUTTLE': return [0.052, 0.074];
    case 'TERMINAL': return [0.12, 0.168];
  }
}

describe('VISCIV.6l — velocidades orbitales visuales más pausadas', () => {
  it('reduce la velocidad sin detener vehículos ni invertir sus sentidos', () => {
    const allRoles = ['SATELLITE', 'STATION', 'CONVOY', 'SHUTTLE', 'TERMINAL'] as const;
    for (const role of allRoles) {
      const factor = ORBITAL_VISUAL_TEMPO_VISCIV6l[role];
      expect(factor).toBeGreaterThan(0);
      expect(factor).toBeLessThan(0.5);
      expect(slowOrbitalVisualSpeedVISCIV6l(1, role)).toBe(factor);
      expect(slowOrbitalVisualSpeedVISCIV6l(-2, role)).toBeCloseTo(-2 * factor, 12);
      expect(slowOrbitalVisualSpeedVISCIV6l(0, role)).toBe(0);
    }
  });

  it('conserva semilla, órbitas, fases y diferencia de niveles al ralentizar satélites y estaciones', () => {
    for (let index = 0; index < 512; index += 1) {
      const seed = Math.imul(index + 1, 7919) >>> 0;
      for (const tier of ['ADVANCED', 'VERY_ADVANCED'] as const) {
        const first = buildSystemSceneArtificialSatellitePlansV1(seed, tier, 0.8);
        const second = buildSystemSceneArtificialSatellitePlansV1(seed, tier, 0.8);
        expect(first).toEqual(second);
        for (const satellite of first) {
          const oldScale = Math.abs(satellite.angularSpeedRadiansPerDay)
            / ORBITAL_VISUAL_TEMPO_VISCIV6l.SATELLITE
            * Math.max(1.1, satellite.orbitRadiusPlanetRadii ** 2);
          expect(oldScale).toBeGreaterThanOrEqual(0.7 - EPSILON);
          expect(oldScale).toBeLessThanOrEqual(1.8 + EPSILON);
          expect(Math.abs(satellite.angularSpeedRadiansPerDay)).toBeGreaterThan(0);
          expect(satellite.orbitRadiusPlanetRadii).toBeGreaterThan(1.3);
          expect(satellite.phaseRadians).toBeGreaterThanOrEqual(0);
        }
        const stations = buildSystemSceneOrbitalStationPlansV1(seed, tier, 0.8);
        if (tier === 'ADVANCED') {
          expect(stations).toHaveLength(0);
        } else {
          expect(stations.length).toBeGreaterThanOrEqual(1);
        }
        for (const station of stations) {
          const oldScale = Math.abs(station.angularSpeedRadiansPerDay)
            / ORBITAL_VISUAL_TEMPO_VISCIV6l.STATION
            * Math.max(1.4, station.orbitRadiusPlanetRadii ** 2);
          expect(oldScale).toBeGreaterThanOrEqual(0.24 - EPSILON);
          expect(oldScale).toBeLessThanOrEqual(0.66 + EPSILON);
          expect(Math.abs(station.angularSpeedRadiansPerDay)).toBeGreaterThan(0);
          expect(station.orbitRadiusPlanetRadii).toBeGreaterThan(2);
        }
      }
    }
  });

  it('reduce los tres tráficos orbitales sin alterar sus trayectorias ni el determinismo', () => {
    const kinds = new Set<string>();
    for (let index = 0; index < 1024; index += 1) {
      const seed = Math.imul(index + 1, 7919) >>> 0;
      for (const ring of buildSystemSceneOrbitalRingPlansV1(seed, 'VERY_ADVANCED')) {
        kinds.add(ring.ringKind);
        const first = buildOrbitalTrafficPlansVISCIV6k(ring);
        expect(first).toEqual(buildOrbitalTrafficPlansVISCIV6k(ring));
        for (const vehicle of first) {
          const [baseMin, baseMax] = expectedBaseRangeVISCIV6l(vehicle.role);
          const oldSpeed = vehicle.speedCyclesPerDay / ORBITAL_VISUAL_TEMPO_VISCIV6l[vehicle.role];
          expect(oldSpeed).toBeGreaterThanOrEqual(baseMin - EPSILON);
          expect(oldSpeed).toBeLessThanOrEqual(baseMax + EPSILON);
          expect(vehicle.speedCyclesPerDay).toBeGreaterThan(0);
          expect(vehicle.phase01).toBeGreaterThanOrEqual(0);
          expect(vehicle.phase01).toBeLessThan(1);
          expect(Math.abs(vehicle.laneRadiusPlanetRadii - ring.orbitRadiusPlanetRadii))
            .toBeLessThan(ring.bandWidthPlanetRadii!);
        }
      }
    }
    expect(kinds).toEqual(new Set(['TRANSPORT', 'HABITAT', 'INDUSTRIAL']));
  });

  it('mantiene movimiento visible, sin deriva tras rebobinar el tiempo y sin reconstruir mallas', () => {
    const ring = buildSystemSceneOrbitalRingPlansV1(1, 'VERY_ADVANCED')[0]!;
    const visual = createOrbitalTrafficVisualVISCIV6k(ring, 1);
    try {
      const resources = visual.resources;
      const matrix = new THREE.Matrix4();
      const positions = (): number[][] => visual.batches.map(batch => {
        batch.mesh.getMatrixAt(0, matrix);
        return matrix.toArray();
      });
      updateOrbitalTrafficVISCIV6k(visual, 0);
      const start = positions();
      updateOrbitalTrafficVISCIV6k(visual, 1);
      const next = positions();
      expect(next).not.toEqual(start);
      for (let roleIndex = 0; roleIndex < next.length; roleIndex += 1) {
        expect(next[roleIndex]).not.toEqual(start[roleIndex]);
      }
      updateOrbitalTrafficVISCIV6k(visual, 0);
      expect(positions()).toEqual(start);
      expect(visual.resources).toBe(resources);
      expect(visual.batches.every(batch => batch.mesh instanceof THREE.InstancedMesh)).toBe(true);
    } finally {
      visual.resources.forEach(resource => resource.dispose());
    }
  });
});
