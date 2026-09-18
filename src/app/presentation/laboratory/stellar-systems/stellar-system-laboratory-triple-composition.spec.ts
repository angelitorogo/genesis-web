import { DiscoveryState } from '../../../domain/discovery/discovery-state';
import { SystemSceneSnapshotBuilder, type SystemSceneSnapshot } from '../../system/system-scene-snapshot';
import { assertSystemSceneProjectionSnapshot } from '../../system/system-scene-projection-contract';
import { projectSystemSceneMotionContributions } from '../../system/system-scene-motion-projection';
import {
  composeLaboratoryTripleScene,
  LAB_TRIPLE_OUTER_ORBIT_SECONDS_PER_REVOLUTION,
} from './stellar-system-laboratory-triple-composition';
import {
  STELLAR_SYSTEM_LABORATORY_FAMILY_IDS,
  StellarSystemLaboratoryCaseId,
  StellarSystemLaboratoryFamilyId,
  StellarSystemLaboratoryFixtures,
  type StellarSystemLaboratoryFrame,
} from './stellar-system-laboratory-fixtures';

function snapshot(frame: StellarSystemLaboratoryFrame): SystemSceneSnapshot {
  const stage = frame.stages.find(entry => entry.discoveryState.code === DiscoveryState.CATALOGUED.code)!;
  const key = StellarSystemLaboratoryFixtures.generationKey();
  return SystemSceneSnapshotBuilder.buildFromSource({
    universeSeed: key.universeSeed.serialize(),
    generatorVersionCode: key.generatorVersionCode,
    locator: frame.family.locator,
    proceduralIdentity: `Laboratory/SINGLE/${frame.family.id}`,
    discoveryState: stage.discoveryState,
    discoveryStateLabel: stage.label,
    stellarSystemCard: stage.card,
    revealMinorBodyGroundTruth: true,
  });
}

function sample(familyId: StellarSystemLaboratoryFamilyId) {
  const frame = StellarSystemLaboratoryFixtures.frame(StellarSystemLaboratoryCaseId.TRIPLE, familyId);
  const sources = frame.sourceSystems!;
  if (sources.length !== 3) {
    throw new Error('TRIPLE laboratory fixture must expose exactly three SINGLE sources.');
  }
  const [fa, fb, fc] = sources;
  const [a, b, c] = [snapshot(fa), snapshot(fb), snapshot(fc)];
  const masses = sources.map(source =>
    source.stages[2]!.card.render.components[0]!.massSolar!) as [number, number, number];
  return {
    frame,
    sources,
    a,
    b,
    c,
    masses,
    triple: composeLaboratoryTripleScene(a, b, c, frame.family, masses),
  };
}

const distance = (
  a: { readonly x: number; readonly y: number; readonly z: number },
  b: { readonly x: number; readonly y: number; readonly z: number },
) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

describe('TRIPLE laboratory: (complete SINGLE A + complete SINGLE B) + complete SINGLE C', () => {
  it('preserves all three source systems, their own planets/moons/minors/belts and circumstellar HZ across A-H', () => {
    for (const family of STELLAR_SYSTEM_LABORATORY_FAMILY_IDS) {
      const { frame, a, b, c, masses, triple } = sample(family);
      expect(triple).toEqual(composeLaboratoryTripleScene(a, b, c, frame.family, masses));
      expect(triple.multiplicityName).toBe('TRIPLE');
      expect(triple.stars.map(star => star.label)).toEqual(['A', 'B', 'C']);
      expect(triple.stars.map(star => star.colorHex)).toEqual([
        a.stars[0]!.colorHex,
        b.stars[0]!.colorHex,
        c.stars[0]!.colorHex,
      ]);
      expect(frame.stages[2]!.card.components.map(component => component.colorHex))
        .toEqual(triple.stars.map(star => star.colorHex));
      for (const kind of ['planets', 'moons', 'minorBodies'] as const) {
        expect(triple[kind].map(body => body.id)).toEqual([
          ...a[kind].map(body => `lab-a-${body.id}`),
          ...b[kind].map(body => `lab-b-${body.id}`),
          ...c[kind].map(body => `lab-c-${body.id}`),
        ]);
      }
      expect(triple.asteroidBelts?.map(belt => belt.id)).toEqual([
        ...(a.asteroidBelts ?? []).map(belt => `lab-a-${belt.id}`),
        ...(b.asteroidBelts ?? []).map(belt => `lab-b-${belt.id}`),
        ...(c.asteroidBelts ?? []).map(belt => `lab-c-${belt.id}`),
      ]);
      const expectedZoneCount = [a, b, c].filter(source => source.habitableZone !== null).length;
      expect(triple.habitableZones).toHaveLength(expectedZoneCount);
      expect(triple.habitableZones?.every(zone => zone.topology === 'CIRCUMSTELLAR')).toBe(true);
      expect(triple.habitableZones?.some(zone =>
        zone.anchorMotionContributions.some(part => part.motionId === 'lab-triple-outer-relative'))).toBe(true);
      for (const moon of triple.moons) {
        expect(triple.planets.some(planet => planet.id === moon.hostPlanetId)).toBe(true);
        expect(triple.orbits.some(orbit => orbit.id === moon.orbitId)).toBe(true);
      }
      expect(() => assertSystemSceneProjectionSnapshot(triple)).not.toThrow();
    }
  }, 120_000);

  it('uses a true hierarchy: A-B keep their inner binary while the whole A-B subsystem and C execute a slower outer binary', () => {
    const { triple, masses } = sample(StellarSystemLaboratoryFamilyId.A);
    const [massA, massB, massC] = masses;
    const massAB = massA + massB;
    const inner = triple.motions.find(motion => motion.id === 'lab-binary-relative')!;
    const outer = triple.motions.find(motion => motion.id === 'lab-triple-outer-relative')!;
    expect(inner).toBeDefined();
    expect(outer).toBeDefined();
    expect(outer.semiMajorAxisAu * (1 - outer.eccentricity))
      .toBeGreaterThan(inner.semiMajorAxisAu * (1 + inner.eccentricity));

    const a = triple.stars.find(star => star.label === 'A')!;
    const b = triple.stars.find(star => star.label === 'B')!;
    const c = triple.stars.find(star => star.label === 'C')!;
    for (const star of [a, b]) {
      expect(star.motionContributions.map(part => part.motionId))
        .toEqual(['lab-triple-outer-relative', 'lab-binary-relative']);
      expect(star.motionContributions[0]!.scale).toBeCloseTo(-massC / (massAB + massC), 12);
    }
    expect(c.motionContributions.map(part => part.motionId)).toEqual(['lab-triple-outer-relative']);
    expect(c.motionContributions[0]!.scale).toBeCloseTo(massAB / (massAB + massC), 12);

    const playback = triple.simulation.playbackDaysPerRealSecond;
    expect(outer.periodDays /
      (playback * c.motionContributions[0]!.presentationTimeScale!))
      .toBeCloseTo(LAB_TRIPLE_OUTER_ORBIT_SECONDS_PER_REVOLUTION, 8);

    const resolve = (id: string) => triple.motions.find(motion => motion.id === id);
    const at = (body: typeof triple.stars[number], day: number) =>
      projectSystemSceneMotionContributions(body.motionContributions, resolve, day, triple.scale);
    const laterDay = playback * 20;
    const aNow = at(a, 0);
    const bNow = at(b, 0);
    const cNow = at(c, 0);
    const aLater = at(a, laterDay);
    const bLater = at(b, laterDay);
    const cLater = at(c, laterDay);
    expect(distance(aNow, aLater)).toBeGreaterThan(0.01);
    expect(distance(cNow, cLater)).toBeGreaterThan(0.01);
    // A-B remains a compact subsystem compared with the outer separation to C.
    expect(distance(aLater, bLater)).toBeLessThan(distance(aLater, cLater));
    expect(() => assertSystemSceneProjectionSnapshot(triple)).not.toThrow();
  }, 90_000);
});
