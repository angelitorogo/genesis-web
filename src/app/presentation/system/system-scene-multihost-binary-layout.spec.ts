import { describe, expect, it } from 'vitest';
import {
  buildSystemSceneBinarySubsystemLayoutV224,
} from './system-scene-multihost-binary-layout';
import {
  buildSystemSceneMultihostHierarchicalLayoutV222,
} from './system-scene-multihost-hierarchical-layout';
import {
  binaryPhysicalSeparationTargetSceneV226,
  withMultihostLaboratoryStellarCadenceV221,
} from './system-scene-multihost-star-cadence';
import {
  buildLinearFitSystemScale,
  SystemSceneProjectionSpace,
  systemSceneProjectedRadiusAuInSpace,
} from './system-scene-scale-projection';
import {
  type SystemSceneSnapshot,
} from './system-scene-snapshot';

function fixture(binaryAxisAu: number): SystemSceneSnapshot {
  const motion = Object.freeze({
    id: 'binary-motion', semiMajorAxisAu: binaryAxisAu, eccentricity: 0.13,
    periodDays: 365 * Math.sqrt(binaryAxisAu ** 3 / 1.8),
    rotationDegrees: 0, inclinationDegrees: 3, epochMeanAnomalyDegrees: 10,
  });
  const star = (label: 'A' | 'B', scale: number) => Object.freeze({
    id: `star-${label}`, kind: 'star' as const, label,
    radiusScene: 0.20, opticalRadiusScene: 0.25,
    position: Object.freeze({x: 0, y: 0, z: 0}),
    orbitId: null,
    motionContributions: Object.freeze([Object.freeze({motionId: motion.id, scale})]),
  });
  return Object.freeze({
    multiplicityName: 'BINARY',
    stars: Object.freeze([star('A', 0.8 / 1.8), star('B', -1 / 1.8)]),
    planets: Object.freeze([]), moons: Object.freeze([]),
    minorBodies: Object.freeze([]), asteroidBelts: Object.freeze([]),
    habitableZone: null,
    orbits: Object.freeze([]), motions: Object.freeze([motion]),
    simulation: Object.freeze({epochSimulationDay: 33, playbackDaysPerRealSecond: 2}),
    scale: buildLinearFitSystemScale(1000, 5),
  } as unknown as SystemSceneSnapshot);
}

const bodies = Object.freeze([
  Object.freeze({hostId: 'A' as const, periapsisAu: 0.3, apoapsisAu: 3}),
  Object.freeze({hostId: 'A' as const, periapsisAu: 3.5, apoapsisAu: 7}),
  Object.freeze({hostId: 'B' as const, periapsisAu: 0.4, apoapsisAu: 5}),
  Object.freeze({hostId: 'AB' as const, periapsisAu: 40, apoapsisAu: 200}),
]);

describe('V2.2.4 BINARY: host-local layout without scale mutation', () => {
  it.each([0.3, 12, 80, 220])('separates BOTH local disks throughout stellar motion at binary axis %i AU', axisAu => {
    const source = fixture(axisAu);
    const snapshot = withMultihostLaboratoryStellarCadenceV221(source);
    const stars = new Map(snapshot.stars.map(star => [star.label, star]));
    const fallback = buildSystemSceneMultihostHierarchicalLayoutV222(bodies, snapshot, stars);
    const result = buildSystemSceneBinarySubsystemLayoutV224(bodies, snapshot, stars, fallback);
    expect(result.layout.version).toBe('V2_2_4_BINARY_LAYOUT_V1');
    const byHost = new Map(result.layout.hostEnvelopes.map(item => [item.hostId, item]));
    expect(result.layout.hostEnvelopes.map(item => item.hostId)).toEqual(['A', 'B', 'AB']);
    const stellar = snapshot.motions[0]!;
    const post = snapshot.stars[0]!.motionContributions[0]!.postProjectionScale!;
    const minimumSeparation = systemSceneProjectedRadiusAuInSpace(
      stellar.semiMajorAxisAu * (1 - stellar.eccentricity),
      snapshot.scale, SystemSceneProjectionSpace.GLOBAL,
    ) * post;
    const a = byHost.get('A')!;
    const b = byHost.get('B')!;
    const ab = byHost.get('AB')!;
    // The scene must NOT normalize 0.3, 12, 80 and 220 AU to the same gap.
    // Both stellar guides and star positions use the same constant multiplier.
    expect(minimumSeparation).toBeCloseTo(
      binaryPhysicalSeparationTargetSceneV226(axisAu * (1 - stellar.eccentricity), 0.25),
      7,
    );
    expect(minimumSeparation).toBeGreaterThan(a.outerEnvelopeScene + b.outerEnvelopeScene + 0.4);
    expect(a.outerEnvelopeScene).toBeGreaterThan(0.85);
    expect(b.outerEnvelopeScene).toBeGreaterThan(0.85);
    expect(a.firstOrbitScene).toBeGreaterThan(snapshot.stars[0]!.opticalRadiusScene!);
    expect(b.firstOrbitScene).toBeGreaterThan(snapshot.stars[1]!.opticalRadiusScene!);
    expect(ab.centerScene).toEqual({x: 0, y: 0, z: 0});
    expect(ab.firstOrbitScene).toBeGreaterThan(a.outerEnvelopeScene);
    expect(ab.firstOrbitScene).toBeGreaterThan(b.outerEnvelopeScene);
    expect(result.radialProjections.get('A')!.firstPeriapsisAu).toBe(0.3);
    expect(result.radialProjections.get('AB')!.lastApoapsisAu).toBe(200);
    expect(snapshot.scale).toBe(source.scale); // never reproject V1 ground truth
  });


  it('retains a legible separation contrast between 3 AU and 93 AU', () => {
    const scene = (axisAu: number) => {
      const base = fixture(axisAu);
      const snapshot = withMultihostLaboratoryStellarCadenceV221(base);
      const motion = snapshot.motions[0]!;
      const contribution = snapshot.stars[0]!.motionContributions[0]!;
      const gap = systemSceneProjectedRadiusAuInSpace(
        axisAu * (1 - motion.eccentricity), snapshot.scale,
        SystemSceneProjectionSpace.GLOBAL,
      ) * contribution.postProjectionScale!;
      const stars = new Map(snapshot.stars.map(star => [star.label, star]));
      const generic = buildSystemSceneMultihostHierarchicalLayoutV222(bodies, snapshot, stars);
      const layout = buildSystemSceneBinarySubsystemLayoutV224(
        bodies, snapshot, stars, generic);
      const disk = layout.layout.hostEnvelopes.find(item => item.hostId === 'A')!;
      return {base, snapshot, gap, disk, layout};
    };
    const close = scene(3);
    const wide = scene(93);
    expect(wide.gap).toBeGreaterThan(close.gap * 1.9);
    expect(wide.gap / wide.disk.outerEnvelopeScene)
      .toBeGreaterThan(close.gap / close.disk.outerEnvelopeScene * 1.4);
    expect(close.disk.outerEnvelopeScene).toBeCloseTo(4.8, 12);
    expect(wide.disk.outerEnvelopeScene).toBeCloseTo(4.8, 12);
    expect(close.layout.radialProjections.get('A')!.orbitLadderV233).toBeUndefined();
    expect(wide.layout.radialProjections.get('A')!.orbitLadderV233).toBeUndefined();
    expect(close.layout.radialProjections.get('A')?.singleSystemScaleV233?.projectionMode)
      .toBe('SINGLE_PRESENTATION_V3');
    expect(close.snapshot.scale).toBe(close.base.scale);
    expect(wide.snapshot.scale).toBe(wide.base.scale);
    expect(close.layout.radialProjections.get('A')!.firstPeriapsisAu)
      .toBe(wide.layout.radialProjections.get('A')!.firstPeriapsisAu);
    expect(close.snapshot.motions[0]).toBe(close.base.motions[0]);
    expect(wide.snapshot.motions[0]).toBe(wide.base.motions[0]);
  });

  it('rebases stellar guides and dependent bodies with the same distance-aware multiplier', () => {
    const original = fixture(93);
    const guide = Object.freeze({
      id: 'binary-guide', kind: 'stellar' as const, motionId: 'binary-motion',
      motionScale: 1, anchorMotionContributions: Object.freeze([]),
    });
    const dependent = Object.freeze({
      ...original.stars[0]!, id: 'dependent-planet', kind: 'planet' as const,
    });
    const source = Object.freeze({
      ...original,
      orbits: Object.freeze([guide]),
      planets: Object.freeze([dependent]),
    }) as unknown as SystemSceneSnapshot;
    const updated = withMultihostLaboratoryStellarCadenceV221(source);
    const stellarScale = updated.stars[0]!.motionContributions[0]!.postProjectionScale;
    expect(stellarScale).toBeGreaterThan(1);
    expect(updated.stars[1]!.motionContributions[0]!.postProjectionScale).toBe(stellarScale);
    expect(updated.planets[0]!.motionContributions[0]!.postProjectionScale).toBe(stellarScale);
    expect(updated.orbits[0]!.postProjectionScale).toBe(stellarScale);
    expect(original.stars[0]!.motionContributions[0]!.postProjectionScale).toBeUndefined();
    expect(updated.scale).toBe(source.scale);
    expect(updated.motions).toEqual(source.motions);
  });

  it('does not activate the binary layout for TRIPLE/SINGLE', () => {
    const snapshot = fixture(12);
    const stars = new Map(snapshot.stars.map(star => [star.label, star]));
    const fallback = buildSystemSceneMultihostHierarchicalLayoutV222(bodies, snapshot, stars);
    const triple = Object.freeze({...snapshot, multiplicityName: 'TRIPLE'});
    const single = Object.freeze({...snapshot, multiplicityName: 'SINGLE'});
    expect(buildSystemSceneBinarySubsystemLayoutV224(bodies, triple, stars, fallback)).toBe(fallback);
    expect(buildSystemSceneBinarySubsystemLayoutV224(bodies, single, stars, fallback)).toBe(fallback);
  });
});
