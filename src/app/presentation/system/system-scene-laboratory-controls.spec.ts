import { DiscoveryState } from '../../domain/discovery/discovery-state';
import { SystemOrbitalMotionEngine } from '../../simulation/orbital/system-orbital-motion-engine';
import { composeLaboratoryBinaryScene } from '../laboratory/stellar-systems/stellar-system-laboratory-binary-composition';
import { composeLaboratoryTripleScene } from '../laboratory/stellar-systems/stellar-system-laboratory-triple-composition';
import {
  StellarSystemLaboratoryCaseId,
  StellarSystemLaboratoryFamilyId,
  StellarSystemLaboratoryFixtures,
  type StellarSystemLaboratoryFrame,
} from '../laboratory/stellar-systems/stellar-system-laboratory-fixtures';
import { SystemSceneSnapshotBuilder, type SystemSceneSnapshot } from './system-scene-snapshot';
import { laboratoryStarDistances, laboratorySubsystemRadius, productionStarFocusRadius } from './system-scene-laboratory-controls';

function single(frame: StellarSystemLaboratoryFrame): SystemSceneSnapshot {
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

function multiple(caseId: typeof StellarSystemLaboratoryCaseId.BINARY | typeof StellarSystemLaboratoryCaseId.TRIPLE) {
  const frame = StellarSystemLaboratoryFixtures.frame(caseId, StellarSystemLaboratoryFamilyId.A);
  const sources = frame.sourceSystems!;
  const singles = sources.map(source => single(source));
  const masses = sources.map(source => source.stages[2]!.card.render.components[0]!.massSolar!);
  if (caseId === StellarSystemLaboratoryCaseId.BINARY) {
    return composeLaboratoryBinaryScene(singles[0]!, singles[1]!, frame.family, [masses[0]!, masses[1]!]);
  }
  return composeLaboratoryTripleScene(singles[0]!, singles[1]!, singles[2]!, frame.family,
    [masses[0]!, masses[1]!, masses[2]!]);
}

describe('Lab-only real-time distances and complete subsystem focus', () => {
  it('computes the real binary A–B separation in AU from the existing Kepler orbit at the same visual instant', () => {
    const snapshot = multiple(StellarSystemLaboratoryCaseId.BINARY);
    const orbit = snapshot.motions.find(motion => motion.id === 'lab-binary-relative')!;
    for (const simulationDay of [0, 20 * snapshot.simulation.playbackDaysPerRealSecond,
      150 * snapshot.simulation.playbackDaysPerRealSecond]) {
      const distances = laboratoryStarDistances(snapshot, simulationDay);
      const scale = snapshot.stars[0]!.motionContributions[0]!.presentationTimeScale!;
      const relative = SystemOrbitalMotionEngine.positionAtSimulationDay(orbit, simulationDay * scale);
      expect(distances.map(item => item.pair)).toEqual(['A–B']);
      expect(distances[0]!.au).toBeCloseTo(Math.hypot(relative.xAu, relative.yAu, relative.zAu), 8);
      expect(distances[0]!.au).toBeGreaterThanOrEqual(orbit.semiMajorAxisAu * (1 - orbit.eccentricity) - 1e-6);
      expect(distances[0]!.au).toBeLessThanOrEqual(orbit.semiMajorAxisAu * (1 + orbit.eccentricity) + 1e-6);
    }
    expect(laboratoryStarDistances(snapshot, Number.NaN)).toEqual([]);
    for (const star of snapshot.stars) {
      expect(laboratorySubsystemRadius(snapshot, star.id))
        .toBeGreaterThan(star.opticalRadiusScene ?? star.radiusScene);
      expect(productionStarFocusRadius(snapshot, star.id))
        .toBeGreaterThan(star.opticalRadiusScene ?? star.radiusScene);
    }
    expect(() => productionStarFocusRadius(snapshot, 'nonexistent')).toThrow(RangeError);
  }, 90_000);

  it('reports three distinct stellar pairs in a hierarchical triple, with an unchanged inner A–B separation', () => {
    const triple = multiple(StellarSystemLaboratoryCaseId.TRIPLE);
    const inner = triple.motions.find(motion => motion.id === 'lab-binary-relative')!;
    const day = triple.simulation.playbackDaysPerRealSecond * 40;
    const rows = laboratoryStarDistances(triple, day);
    expect(rows.map(row => row.pair)).toEqual(['A–B', 'A–C', 'B–C']);
    const innerRelative = SystemOrbitalMotionEngine.positionAtSimulationDay(inner,
      day * triple.stars[0]!.motionContributions[1]!.presentationTimeScale!);
    expect(rows[0]!.au).toBeCloseTo(Math.hypot(innerRelative.xAu, innerRelative.yAu, innerRelative.zAu), 8);
    expect(rows[1]!.au).toBeGreaterThan(rows[0]!.au);
    expect(rows[2]!.au).toBeGreaterThan(rows[0]!.au);
    expect(rows.every(row => Number.isFinite(row.au) && row.au > 0)).toBe(true);
    expect(() => laboratorySubsystemRadius(triple, 'nonexistent')).toThrow(RangeError);
    for (const star of triple.stars) {
      expect(laboratorySubsystemRadius(triple, star.id)).toBeGreaterThan(0.3);
    }
  }, 90_000);
});
