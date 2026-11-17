import * as THREE from 'three';
import {
  buildSystemSceneOrbitalRingPlansV1,
  createSystemSceneOrbitalRingVisualV1,
  type SystemSceneOrbitalRingPlanV1,
} from './system-scene-artificial-satellites-visciv2';

/** Match the actual Three.js Euler order used by the ring root (x then z properties). */
function normalOfVISCIV6h(plan: SystemSceneOrbitalRingPlanV1): THREE.Vector3 {
  return new THREE.Vector3(0, 1, 0).applyEuler(
    new THREE.Euler(plan.inclinationRadians, 0, plan.ascendingNodeRadians),
  ).normalize();
}

function planeAngleDegVISCIV6h(a: SystemSceneOrbitalRingPlanV1, b: SystemSceneOrbitalRingPlanV1): number {
  return THREE.MathUtils.radToDeg(normalOfVISCIV6h(a).angleTo(normalOfVISCIV6h(b)));
}

/** Bounding all architectural rails, trusses, modules and beacons in disjoint
 * concentric spherical shells is sufficient even if the planes are tilted. */
function radialShellClearanceVISCIV6h(a: SystemSceneOrbitalRingPlanV1, b: SystemSceneOrbitalRingPlanV1): number {
  const shellHalf = (plan: SystemSceneOrbitalRingPlanV1): number =>
    (plan.bandWidthPlanetRadii ?? 0.13) / 2 + 0.12;
  return b.orbitRadiusPlanetRadii - a.orbitRadiusPlanetRadii - shellHalf(a) - shellHalf(b);
}

describe('VISCIV.6h — desalineación orbital determinista de anillos múltiples', () => {
  it('deja el plano original completamente estable para un anillo', () => {
    const first = buildSystemSceneOrbitalRingPlansV1(0, 'VERY_ADVANCED');
    const second = buildSystemSceneOrbitalRingPlansV1(7919, 'VERY_ADVANCED');
    expect(first).toHaveLength(1);
    expect(second).toHaveLength(1);
    expect(first[0]!.inclinationRadians).toBeCloseTo(0.4350150234715746, 12);
    expect(first[0]!.ascendingNodeRadians).toBeCloseTo(1.881757117072377, 12);
    expect(second[0]!.inclinationRadians).toBeCloseTo(0.41744936615717954, 12);
    expect(second[0]!.ascendingNodeRadians).toBeCloseTo(2.320943614392238, 12);
  });

  it('desacopla realmente los planos cuando hay dos o tres anillos sin solapar sus carcasas', () => {
    const distributions = new Set<number>();
    for (let i = 0; i < 2048; i++) {
      const seed = Math.imul(i + 1, 7919) >>> 0;
      const rings = buildSystemSceneOrbitalRingPlansV1(seed, 'VERY_ADVANCED');
      distributions.add(rings.length);
      expect(rings).toEqual(buildSystemSceneOrbitalRingPlansV1(seed, 'VERY_ADVANCED'));
      expect(rings.length).toBeGreaterThanOrEqual(1);
      expect(rings.length).toBeLessThanOrEqual(3);
      for (let j = 0; j < rings.length; j++) {
        const ring = rings[j]!;
        expect(Number.isFinite(ring.inclinationRadians)).toBe(true);
        expect(Number.isFinite(ring.ascendingNodeRadians)).toBe(true);
        expect(ring.inclinationRadians).toBeGreaterThan(0);
        expect(ring.inclinationRadians).toBeLessThan(0.7);
        expect(ring.ascendingNodeRadians).toBeGreaterThanOrEqual(0);
        expect(ring.ascendingNodeRadians).toBeLessThan(2 * Math.PI);
        for (let k = 0; k < j; k++) {
          const other = rings[k]!;
          const angle = planeAngleDegVISCIV6h(other, ring);
          expect(angle).toBeGreaterThan(5);
          expect(angle).toBeLessThan(35);
          expect(ring.inclinationRadians).not.toBe(other.inclinationRadians);
          expect(ring.ascendingNodeRadians).not.toBe(other.ascendingNodeRadians);
        }
        if (j > 0) {
          const inner = rings[j - 1]!;
          expect(radialShellClearanceVISCIV6h(inner, ring)).toBeGreaterThan(0.06);
        }
      }
    }
    expect(distributions).toEqual(new Set([1, 2, 3]));
  });

  it('conserva las inclinaciones y los nodos en las mallas reales, y no modifica sus animaciones', () => {
    const two = buildSystemSceneOrbitalRingPlansV1(145872, 'VERY_ADVANCED');
    const three = buildSystemSceneOrbitalRingPlansV1(1, 'VERY_ADVANCED');
    expect(two).toHaveLength(2);
    expect(three).toHaveLength(3);
    for (const plans of [two, three]) {
      const visuals = plans.map(plan => createSystemSceneOrbitalRingVisualV1(plan, 1));
      try {
        plans.forEach((plan, index) => {
          const visual = visuals[index]!;
          expect(visual.group.rotation.x).toBe(plan.inclinationRadians);
          expect(visual.group.rotation.z).toBe(plan.ascendingNodeRadians);
          expect(visual.rotationPivot.parent).toBe(visual.group);
          expect(visual.nightBeaconsVISCIV6g).toBeDefined();
          expect(visual.rotationPivot.children.filter(child => child instanceof THREE.InstancedMesh)).toHaveLength(2);
        });
      } finally {
        visuals.forEach(visual => visual.resources.forEach(resource => resource.dispose()));
      }
    }
    expect(buildSystemSceneOrbitalRingPlansV1(1, 'ADVANCED')).toHaveLength(0);
  });
});
