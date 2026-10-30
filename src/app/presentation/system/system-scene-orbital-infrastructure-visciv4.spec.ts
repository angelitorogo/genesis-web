import * as THREE from 'three';
import {
  buildSystemSceneArtificialSatellitePlansV1,
  buildSystemSceneOrbitalInfrastructureProfileV1,
  buildSystemSceneOrbitalRingPlansV1,
  buildSystemSceneOrbitalStationPlansV1,
  createSystemSceneOrbitalRingVisualV1,
  createSystemSceneOrbitalStationVisualV1,
} from './system-scene-artificial-satellites-visciv2';

describe('VISCIV.4 — Orbital infrastructures procedurales', () => {
  it('usa siempre el mismo perfil para la misma semilla y nivel', () => {
    for (const seed of [1, 2, 17, 145872, 0x9ac3de1a]) {
      const a = buildSystemSceneOrbitalInfrastructureProfileV1(seed, 'VERY_ADVANCED');
      const b = buildSystemSceneOrbitalInfrastructureProfileV1(seed, 'VERY_ADVANCED');
      expect(a).toEqual(b);
      expect(buildSystemSceneOrbitalStationPlansV1(seed, 'VERY_ADVANCED', 1.2)).toEqual(
        buildSystemSceneOrbitalStationPlansV1(seed, 'VERY_ADVANCED', 1.2),
      );
      expect(buildSystemSceneOrbitalRingPlansV1(seed, 'VERY_ADVANCED')).toEqual(
        buildSystemSceneOrbitalRingPlansV1(seed, 'VERY_ADVANCED'),
      );
    }
  });

  it('no impone la misma infraestructura a todas las civilizaciones muy avanzadas', () => {
    const profiles = Array.from({ length: 256 }, (_, seed) =>
      buildSystemSceneOrbitalInfrastructureProfileV1(seed * 7919, 'VERY_ADVANCED'),
    );
    const types = new Set(profiles.map(profile => profile.profileId));
    expect(types.size).toBe(6);
    expect(profiles.some(profile => profile.ringKinds.length === 0)).toBe(true);
    expect(profiles.some(profile => profile.ringKinds.length === 1)).toBe(true);
    expect(profiles.some(profile => profile.ringKinds.length === 2)).toBe(true);
    expect(profiles.some(profile => profile.stationKinds.includes('INDUSTRIAL'))).toBe(true);
    expect(profiles.some(profile => profile.stationKinds.includes('HABITAT'))).toBe(true);
    expect(profiles.some(profile => profile.stationKinds.includes('PLATFORM'))).toBe(true);
  });

  it('reserva anillos y estaciones para VERY_ADVANCED sin alterar ADVANCED', () => {
    const seed = 145872;
    expect(buildSystemSceneOrbitalStationPlansV1(seed, 'ADVANCED', 1)).toHaveLength(0);
    expect(buildSystemSceneOrbitalRingPlansV1(seed, 'ADVANCED')).toHaveLength(0);
    expect(buildSystemSceneArtificialSatellitePlansV1(seed, 'ADVANCED', 1).length).toBeGreaterThanOrEqual(3);
    expect(buildSystemSceneArtificialSatellitePlansV1(seed, 'VERY_ADVANCED', 1).length).toBeGreaterThanOrEqual(9);
  });

  it('crea anillos dobles realmente concéntricos, con módulos opacos', () => {
    const seed = Array.from({ length: 256 }, (_, i) => i * 7919).find(candidate =>
      buildSystemSceneOrbitalRingPlansV1(candidate, 'VERY_ADVANCED').length === 2,
    );
    expect(seed).toBeDefined();
    const rings = buildSystemSceneOrbitalRingPlansV1(seed!, 'VERY_ADVANCED');
    expect(rings).toHaveLength(2);
    expect(rings[1]!.orbitRadiusPlanetRadii).toBeGreaterThan(rings[0]!.orbitRadiusPlanetRadii);
    expect(rings[0]!.inclinationRadians).toBe(rings[1]!.inclinationRadians);
    expect(rings[0]!.ascendingNodeRadians).toBe(rings[1]!.ascendingNodeRadians);
    for (const ring of rings) {
      const visual = createSystemSceneOrbitalRingVisualV1(ring, 1);
      expect(visual.rotationPivot.parent).toBe(visual.group);
      const instanced = visual.rotationPivot.children.filter(object => object instanceof THREE.InstancedMesh) as THREE.InstancedMesh[];
      expect(instanced).toHaveLength(2);
      expect(instanced[0]!.count).toBe(96);
      expect(instanced[1]!.count).toBe(ring.moduleCount);
      expect(visual.materials.every(binding => !binding.material.transparent && binding.material.opacity === 1)).toBe(true);
      for (const resource of visual.resources) resource.dispose();
    }
  });

  it('diferencia geométricamente estaciones industriales, habitacionales y plataformas', () => {
    const requiredKinds = ['INDUSTRIAL', 'HABITAT', 'PLATFORM'] as const;
    for (const installationKind of requiredKinds) {
      const visual = createSystemSceneOrbitalStationVisualV1({
        installationKind,
        orbitRadiusPlanetRadii: 2.4,
        inclinationRadians: 0.15,
        ascendingNodeRadians: 0.25,
        phaseRadians: 1.1,
        angularSpeedRadiansPerDay: 0.12,
        hullColorHex: '#d8e0ea',
        lineColorHex: '#a9cdf7',
        stationScaleScene: 0.14,
        lineOpacity01: 0.27,
      }, 145872);
      const boxes: THREE.Mesh[] = [];
      visual.group.traverse(object => {
        if (object instanceof THREE.Mesh) boxes.push(object);
      });
      expect(boxes.length).toBeGreaterThanOrEqual(8);
      expect(boxes.every(mesh => mesh.geometry instanceof THREE.BoxGeometry || mesh.geometry instanceof THREE.CylinderGeometry)).toBe(true);
      expect(visual.materials.every(binding => binding.material.transparent === false && binding.material.opacity === 1)).toBe(true);
      expect(visual.resources.every(resource => typeof resource.dispose === 'function')).toBe(true);
      for (const resource of visual.resources) resource.dispose();
    }
  });
});
