import * as THREE from 'three';
import {
  buildSystemSceneArtificialSatellitePlansV1,
  buildSystemSceneOrbitalInfrastructureProfileV1,
  buildSystemSceneOrbitalRingPlansV1,
  buildSystemSceneOrbitalStationPlansV1,
  createSystemSceneOrbitalRingVisualV1,
  updateOrbitalRingNightLightsVISCIV6g,
} from './system-scene-artificial-satellites-visciv2';

describe('VISCIV.6g — megastructuras orbitales diferenciadas y luces del hemisferio nocturno', () => {
  it('mantiene al menos un aro y una estación en VERY_ADVANCED, sin alterar ADVANCED', () => {
    const distributions = new Set<number>();
    const kinds = new Set<string>();
    for (let index = 0; index < 1024; index++) {
      const seed = Math.imul(index + 1, 7919) >>> 0;
      const rings = buildSystemSceneOrbitalRingPlansV1(seed, 'VERY_ADVANCED');
      distributions.add(rings.length);
      rings.forEach(ring => kinds.add(ring.ringKind));
      expect(rings.length).toBeGreaterThanOrEqual(1);
      expect(rings.length).toBeLessThanOrEqual(3);
      expect(buildSystemSceneArtificialSatellitePlansV1(seed, 'VERY_ADVANCED', 1).length).toBeGreaterThanOrEqual(9);
      expect(buildSystemSceneOrbitalStationPlansV1(seed, 'VERY_ADVANCED', 1).length).toBeGreaterThanOrEqual(1);
      expect(buildSystemSceneOrbitalRingPlansV1(seed, 'ADVANCED')).toHaveLength(0);
      expect(buildSystemSceneOrbitalStationPlansV1(seed, 'ADVANCED', 1)).toHaveLength(0);
      expect(buildSystemSceneOrbitalInfrastructureProfileV1(seed, 'VERY_ADVANCED')).toEqual(
        buildSystemSceneOrbitalInfrastructureProfileV1(seed, 'VERY_ADVANCED'),
      );
    }
    expect(distributions).toEqual(new Set([1, 2, 3]));
    expect(kinds).toEqual(new Set(['HABITAT', 'TRANSPORT', 'INDUSTRIAL']));
  });

  it('varía el grosor y la banda radial manteniendo separación entre bordes para 1/2/3 anillos', () => {
    const thicknesses = new Set<string>();
    for (let index = 0; index < 1024; index++) {
      const plans = buildSystemSceneOrbitalRingPlansV1(index * 3571, 'VERY_ADVANCED');
      expect(plans).toEqual(buildSystemSceneOrbitalRingPlansV1(index * 3571, 'VERY_ADVANCED'));
      plans.forEach(plan => {
        expect(plan.structuralThicknessFactor).toBeGreaterThan(0.5);
        expect(plan.bandWidthPlanetRadii).toBeGreaterThan(0.07);
        thicknesses.add(plan.structuralThicknessFactor!.toFixed(2));
      });
      for (let ring = 1; ring < plans.length; ring++) {
        const inner = plans[ring - 1]!;
        const outer = plans[ring]!;
        const free = outer.orbitRadiusPlanetRadii - inner.orbitRadiusPlanetRadii
          - (outer.bandWidthPlanetRadii! + inner.bandWidthPlanetRadii!) * 0.5;
        expect(free).toBeGreaterThan(0.30);
        expect(inner.inclinationRadians).not.toBe(outer.inclinationRadians);
        expect(inner.ascendingNodeRadians).not.toBe(outer.ascendingNodeRadians);
      }
    }
    expect(thicknesses.size).toBeGreaterThan(10);
  });

  it('usa siluetas y luces distintas sin crear una malla por cada segmento', () => {
    const variants = new Map<string, ReturnType<typeof createSystemSceneOrbitalRingVisualV1>>();
    for (let seed = 0; seed < 2048 && variants.size < 3; seed++) {
      for (const plan of buildSystemSceneOrbitalRingPlansV1(seed * 7919, 'VERY_ADVANCED')) {
        if (!variants.has(plan.ringKind)) {
          variants.set(plan.ringKind, createSystemSceneOrbitalRingVisualV1(plan, 1));
        }
      }
    }
    try {
      expect([...variants.keys()].sort()).toEqual(['HABITAT', 'INDUSTRIAL', 'TRANSPORT']);
      const totals = new Map<string, number>();
      for (const [kind, visual] of variants) {
        const architecture = visual.rotationPivot.getObjectByName('VISCIV6g orbital ring architectural band');
        expect(architecture).toBeInstanceOf(THREE.Group);
        expect(architecture!.children.every(child => child instanceof THREE.InstancedMesh)).toBe(true);
        expect(architecture!.children.length).toBeLessThanOrEqual(3);
        expect(visual.nightBeaconsVISCIV6g).toBeInstanceOf(THREE.InstancedMesh);
        expect(visual.nightBeaconsVISCIV6g!.instanceColor).not.toBeNull();
        expect(visual.materials.every(binding => binding.material instanceof THREE.MeshStandardMaterial)).toBe(true);
        totals.set(kind, architecture!.children.length);
      }
      expect(totals.get('TRANSPORT')).toBe(1);
      expect(totals.get('INDUSTRIAL')).toBe(3);
      expect(totals.get('HABITAT')).toBe(3);
    } finally {
      for (const visual of variants.values()) for (const resource of visual.resources) resource.dispose();
    }
  });

  it('ilumina solamente las balizas opuestas a la estrella y se adapta cuando cambia el foco', () => {
    const plan = buildSystemSceneOrbitalRingPlansV1(7919, 'VERY_ADVANCED')[0]!;
    const visual = createSystemSceneOrbitalRingVisualV1(plan, 1);
    try {
      visual.group.rotation.set(0, 0, 0);
      visual.rotationPivot.rotation.set(0, 0, 0);
      const beacons = visual.nightBeaconsVISCIV6g!;
      const daytime = new THREE.Color();
      const nighttime = new THREE.Color();
      updateOrbitalRingNightLightsVISCIV6g(visual, [{ direction: new THREE.Vector3(1, 0, 0), weight: 1 }]);
      beacons.getColorAt(0, daytime);
      beacons.getColorAt(beacons.count / 2, nighttime);
      expect(nighttime.r).toBeGreaterThan(daytime.r * 8);
      const opposite = new THREE.Color();
      updateOrbitalRingNightLightsVISCIV6g(visual, [{ direction: new THREE.Vector3(-1, 0, 0), weight: 1 }]);
      beacons.getColorAt(0, opposite);
      expect(opposite.r).toBeGreaterThan(daytime.r * 8);
      const doubleLit = new THREE.Color();
      updateOrbitalRingNightLightsVISCIV6g(visual, [
        { direction: new THREE.Vector3(1, 0, 0), weight: 1 },
        { direction: new THREE.Vector3(-1, 0, 0), weight: 1 },
      ]);
      beacons.getColorAt(0, doubleLit);
      expect(doubleLit.r).toBeLessThan(opposite.r);
      expect(doubleLit.r).toBeGreaterThan(daytime.r);
    } finally {
      visual.resources.forEach(resource => resource.dispose());
    }
  });
});
