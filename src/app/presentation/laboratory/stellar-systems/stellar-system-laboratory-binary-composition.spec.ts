import { DiscoveryState } from '../../../domain/discovery/discovery-state';
import {
  laboratoryCircumstellarCriticalFraction,
  laboratoryOrbitalSpacingProfile,
  laboratoryProtectedSingleExtentAu,
} from './stellar-system-laboratory-orbital-spacing';
import { SystemSceneSnapshotBuilder, type SystemSceneSnapshot } from '../../system/system-scene-snapshot';
import { assertSystemSceneProjectionSnapshot } from '../../system/system-scene-projection-contract';
import { projectSystemSceneMotionContributions } from '../../system/system-scene-motion-projection';
import {
  composeLaboratoryBinaryScene,
  LAB_BINARY_ORBIT_SECONDS_PER_REVOLUTION,
  LAB_MOON_MIN_ORBIT_SECONDS,
  LAB_PLANET_MIN_ORBIT_SECONDS,
  LAB_MINOR_BODY_MIN_ORBIT_SECONDS,
} from './stellar-system-laboratory-binary-composition';
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
  const frame = StellarSystemLaboratoryFixtures.frame(StellarSystemLaboratoryCaseId.BINARY, familyId);
  const pair = frame.sourceSystems!;
  const a = snapshot(pair[0]);
  const b = snapshot(pair[1]);
  const masses = pair.map(source => source.stages[2]!.card.render.components[0]!.massSolar!) as [number, number];
  return { frame, pair, a, b, masses, binary: composeLaboratoryBinaryScene(a, b, frame.family, masses) };
}

const distance = (a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

describe('Binary laboratory: two FULLY generated SINGLE systems with identical scene and fiche sources', () => {
  it('screens BOTH source systems against the family-specific orbital clearance without changing their planets', () => {
    for (const family of STELLAR_SYSTEM_LABORATORY_FAMILY_IDS) {
      const { a, b, masses, binary } = sample(family);
      const relative = binary.motions.find(motion => motion.id === 'lab-binary-relative')!;
      const [massA, massB] = masses;
      const boundA = relative.semiMajorAxisAu * laboratoryCircumstellarCriticalFraction(
        massB / (massA + massB), relative.eccentricity,
      );
      const boundB = relative.semiMajorAxisAu * laboratoryCircumstellarCriticalFraction(
        massA / (massA + massB), relative.eccentricity,
      );
      expect(boundA).toBeGreaterThanOrEqual(
        laboratoryProtectedSingleExtentAu(a) * laboratoryOrbitalSpacingProfile(family).safetyFactor - 1e-7,
      );
      expect(boundB).toBeGreaterThanOrEqual(
        laboratoryProtectedSingleExtentAu(b) * laboratoryOrbitalSpacingProfile(family).safetyFactor - 1e-7,
      );
      expect(binary.planets).toHaveLength(a.planets.length + b.planets.length);
    }
  }, 120_000);

  it('preserves all source bodies, identity, colors, orbit periods and host-specific HZ across A-H', () => {
    for (const family of STELLAR_SYSTEM_LABORATORY_FAMILY_IDS) {
      const { frame, a, b, binary } = sample(family);
      const replay = composeLaboratoryBinaryScene(a, b, frame.family,
        frame.sourceSystems!.map(source => source.stages[2]!.card.render.components[0]!.massSolar!) as [number, number]);
      expect(binary).toEqual(replay);
      expect(binary.multiplicityName).toBe('BINARY');
      expect(binary.stars.map(star => star.label)).toEqual(['A', 'B']);
      expect(binary.stars.map(star => star.colorHex)).toEqual([a.stars[0]!.colorHex, b.stars[0]!.colorHex]);
      expect(frame.stages[2]!.card.components.map(component => component.colorHex))
        .toEqual(binary.stars.map(star => star.colorHex));
      for (const kind of ['planets', 'moons', 'minorBodies'] as const) {
        expect(binary[kind].map(body => body.id)).toEqual([
          ...a[kind].map(body => `lab-a-${body.id}`),
          ...b[kind].map(body => `lab-b-${body.id}`),
        ]);
      }
      expect(binary.asteroidBelts?.map(belt => belt.id)).toEqual([
        ...(a.asteroidBelts ?? []).map(belt => `lab-a-${belt.id}`),
        ...(b.asteroidBelts ?? []).map(belt => `lab-b-${belt.id}`),
      ]);
      const expectedZones = [a.habitableZone, b.habitableZone].filter(zone => zone !== null);
      expect(binary.habitableZones).toHaveLength(expectedZones.length);
      binary.habitableZones?.forEach((zone, index) => {
        expect(zone.topology).toBe('CIRCUMSTELLAR');
        expect(zone.radiativeInnerEdgeAu).toBe(expectedZones[index]!.radiativeInnerEdgeAu);
        expect(zone.radiativeOuterEdgeAu).toBe(expectedZones[index]!.radiativeOuterEdgeAu);
        expect(zone.anchorMotionContributions[0]?.motionId).toBe('lab-binary-relative');
        expect(zone.anchorMotionContributions[0]?.scale).toBe(index === 0 && a.habitableZone !== null
          ? binary.stars[0]!.motionContributions[0]!.scale
          : binary.stars[1]!.motionContributions[0]!.scale);
      });
      for (const moon of binary.moons) {
        expect(binary.planets.some(planet => planet.id === moon.hostPlanetId)).toBe(true);
        expect(binary.orbits.some(orbit => orbit.id === moon.orbitId)).toBe(true);
      }
      expect(() => assertSystemSceneProjectionSnapshot(binary)).not.toThrow();
    }
  }, 120_000);

  it('leaves sparse inputs sparse and never manufactures planets or a central P-type HZ', () => {
    const { frame, a, b, masses } = sample(StellarSystemLaboratoryFamilyId.A);
    const empty: SystemSceneSnapshot = Object.freeze({
      ...b,
      planets: Object.freeze([]),
      moons: Object.freeze([]),
      minorBodies: Object.freeze([]),
      asteroidBelts: Object.freeze([]),
      orbitalRiskTargets: Object.freeze([]),
      orbits: Object.freeze([]),
      motions: Object.freeze([]),
      habitableZone: null,
    });
    const binary = composeLaboratoryBinaryScene(a, empty, frame.family, masses);
    expect(binary.planets.map(planet => planet.id)).toEqual(a.planets.map(planet => `lab-a-${planet.id}`));
    expect(binary.moons.map(moon => moon.id)).toEqual(a.moons.map(moon => `lab-a-${moon.id}`));
    expect(binary.habitableZones).toHaveLength(Number(a.habitableZone !== null));
    expect(binary.habitableZones?.every(zone => zone.topology === 'CIRCUMSTELLAR')).toBe(true);
    expect(() => assertSystemSceneProjectionSnapshot(binary)).not.toThrow();
  }, 90_000);

  it('makes the two stars follow a shared mass-weighted orbit at a majestic cadence, with host-locked planets', () => {
    const { binary, a, b, masses } = sample(StellarSystemLaboratoryFamilyId.A);
    const playback = binary.simulation.playbackDaysPerRealSecond;
    const motion = binary.motions.find(m => m.id === 'lab-binary-relative')!;
    const [massA, massB] = masses;
    expect(binary.stars[0]!.motionContributions[0]!.scale).toBeCloseTo(-massB / (massA + massB), 12);
    expect(binary.stars[1]!.motionContributions[0]!.scale).toBeCloseTo(massA / (massA + massB), 12);
    expect(motion.periodDays).toBeCloseTo(365.25 * Math.sqrt(motion.semiMajorAxisAu ** 3 / (massA + massB)), 8);
    expect(motion.periodDays / (playback * binary.stars[0]!.motionContributions[0]!.presentationTimeScale!))
      .toBeCloseTo(LAB_BINARY_ORBIT_SECONDS_PER_REVOLUTION, 8);
    const resolve = (id: string) => binary.motions.find(candidate => candidate.id === id);
    const projected = (body: typeof binary.planets[number] | typeof binary.stars[number], day: number) =>
      projectSystemSceneMotionContributions(body.motionContributions, resolve, day, binary.scale);
    const laterDay = playback * 18;
    for (const [index, star] of binary.stars.entries()) {
      const after = projected(star, laterDay);
      expect(distance(star.position, after)).toBeGreaterThan(0.01);
      const source = index === 0 ? a : b;
      for (const planet of binary.planets.filter(body => body.label.startsWith(`${star.label} · `))) {
        expect(planet.motionContributions[0]).toEqual(star.motionContributions[0]);
        expect(distance(projected(planet, laterDay), after)).toBeLessThan(2.6);
        expect(binary.orbits.find(orbit => orbit.id === planet.orbitId)?.anchorMotionContributions)
          .toEqual(star.motionContributions);
      }
      expect(binary.planets.filter(planet => planet.label.startsWith(`${star.label} · `))).toHaveLength(source.planets.length);
    }
    for (const { bodies, min } of [
      { bodies: binary.planets, min: LAB_PLANET_MIN_ORBIT_SECONDS },
      { bodies: binary.moons, min: LAB_MOON_MIN_ORBIT_SECONDS },
      { bodies: binary.minorBodies, min: LAB_MINOR_BODY_MIN_ORBIT_SECONDS },
    ]) {
      for (const body of bodies) {
        const contribution = body.motionContributions[body.motionContributions.length - 1]!;
        const localMotion = resolve(contribution.motionId)!;
        expect(localMotion.periodDays / (playback * contribution.presentationTimeScale!)).toBeGreaterThanOrEqual(min - 1e-8);
      }
    }
    expect(() => assertSystemSceneProjectionSnapshot(binary)).not.toThrow();
  }, 90_000);
});
