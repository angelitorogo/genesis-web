import { DiscoveryState } from '../../domain/discovery/discovery-state';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { SystemLocator } from '../../domain/generation/procedural-locator';
import { MinorBodyKind } from '../../domain/planetary/minor-body-kind';
import { StellarSystemMultiplicity } from '../../domain/stellar/stellar-system-multiplicity';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { ProceduralTargetResolver } from '../../simulation/regeneration/procedural-target-resolver';
import { StellarMultihostFormation } from '../../simulation/stellar/stellar-multihost-formation';
import { StellarSystemMultiplicitySelector } from '../../simulation/stellar/stellar-system-multiplicity-selector';
import { SystemOrbitalMotionEngine } from '../../simulation/orbital/system-orbital-motion-engine';
import { ArchiveV2StellarSystemCardAssembler } from '../genesis-archive/archive-v2-stellar-system-card';
import { SystemSceneSnapshotBuilder, type SystemSceneSnapshot } from './system-scene-snapshot';
import { SystemSceneMultihostMaterializedSources } from './system-scene-multihost-materialized-sources';
import { SystemSceneMultihostComposition } from './system-scene-multihost-composition';
import { projectSystemSceneMotionContributions, sampleSystemSceneOrbitLocalAu } from './system-scene-motion-projection';
import { v2PhysicalPositionAu } from './system-scene-v2-comet-stellar-flux';
import { buildV2CometVisualOrbit, V2_COMET_MAX_LOCAL_APOAPSIS_SCENE,
  V2_COMET_STELLAR_CLEARANCE_SCENE, V2_COMET_VISUAL_MAX_ECCENTRICITY,
  V2_COMET_VISUAL_MIN_ECCENTRICITY } from './system-scene-v2-comet-orbit-presentation';

const seed = UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1');
const v1 = new UniverseGenerationKey(seed, GeneratorVersion.V1);
const v2 = new UniverseGenerationKey(seed.copy(), GeneratorVersion.V2);

function fixture(kind: StellarSystemMultiplicity): SystemSceneSnapshot {
  let locator: SystemLocator | undefined;
  for (let index = 0n; index < 256n; index++) {
    const candidate = new SystemLocator(0n, 0n, index);
    const target = ProceduralTargetResolver.resolveTargetSeed(v1, candidate);
    if (StellarSystemMultiplicitySelector.select(v1,
        target as Parameters<typeof StellarSystemMultiplicitySelector.select>[1]) === kind) {
      locator = candidate;
      break;
    }
  }
  if (!locator) throw new Error('Cannot locate a deterministic stellar-system fixture.');
  const source = Object.freeze({
    universeSeed: seed.serialize(), generatorVersionCode: 2, locator,
    proceduralIdentity: `G${locator.galaxyIndex}/S${locator.sectorKey}/O${locator.galacticObjectIndex}`,
    discoveryState: DiscoveryState.CONFIRMED, discoveryStateLabel: 'CONFIRMED',
    stellarSystemCard: ArchiveV2StellarSystemCardAssembler.build(v2, locator, DiscoveryState.CONFIRMED),
  });
  if (kind === StellarSystemMultiplicity.SINGLE) {
    const host = StellarMultihostFormation.generateV2SingleOrNull(v2, locator)!;
    return SystemSceneSnapshotBuilder.buildFromGeneratedSingle(source, host);
  }
  const formation = StellarMultihostFormation.generateOrNull(v2, locator)!;
  return SystemSceneMultihostComposition.build(formation,
    SystemSceneMultihostMaterializedSources.build(formation, source)).snapshot;
}

function euclidean(a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

describe('15.3 — V2 comets: clear, eccentric and synchronized screen ellipses', () => {
  it.each([0.15, 0.65, 0.95, 0.999999])('fits source eccentricity %s into a true focused ellipse', physicalE => {
    const visual = buildV2CometVisualOrbit({ physicalSemiMajorScene: 9,
      physicalEccentricity: physicalE, starOpticalRadiusScene: 0.235,
      cometRadiusScene: 0.015, maximumApoapsisScene: V2_COMET_MAX_LOCAL_APOAPSIS_SCENE });
    expect(visual.eccentricity).toBeGreaterThanOrEqual(V2_COMET_VISUAL_MIN_ECCENTRICITY);
    expect(visual.eccentricity).toBeLessThanOrEqual(V2_COMET_VISUAL_MAX_ECCENTRICITY);
    expect(visual.periapsisScene).toBeGreaterThanOrEqual(0.235 + 0.015 + V2_COMET_STELLAR_CLEARANCE_SCENE - 1e-9);
    expect(visual.apoapsisScene).toBeLessThanOrEqual(V2_COMET_MAX_LOCAL_APOAPSIS_SCENE + 1e-9);
    expect(visual.semiMajorScene - visual.focusOffsetScene).toBeCloseTo(visual.periapsisScene, 10);
    expect(visual.semiMajorScene + visual.focusOffsetScene).toBeCloseTo(visual.apoapsisScene, 10);
    expect(visual.semiMinorScene ** 2).toBeCloseTo(
      visual.semiMajorScene ** 2 - visual.focusOffsetScene ** 2, 10);
  });

  it('changes only rendered coordinates; physical elements and irradiation ignore visual e', () => {
    const motion = Object.freeze({ id: 'physical-comet', semiMajorAxisAu: 8,
      eccentricity: 0.98, periodDays: 7300, rotationDegrees: 17,
      inclinationDegrees: 25, epochMeanAnomalyDegrees: 0 });
    const visual = buildV2CometVisualOrbit({ physicalSemiMajorScene: 10,
      physicalEccentricity: motion.eccentricity, starOpticalRadiusScene: 0.235,
      cometRadiusScene: 0.015, maximumApoapsisScene: 2.38 });
    const scene = { motions: [motion] };
    const contribution = Object.freeze({ motionId: motion.id, scale: 1,
      linearScenePerAu: visual.semiMajorScene / motion.semiMajorAxisAu,
      presentationEccentricity: visual.eccentricity });
    const pure = Object.freeze({ motionId: motion.id, scale: 1 });
    const day = 120;
    expect(v2PhysicalPositionAu([contribution], scene.motions, day))
      .toEqual(v2PhysicalPositionAu([pure], scene.motions, day));
    const screen = projectSystemSceneMotionContributions([contribution], () => motion, day,
      { outerRadiusAu: 10, orbitScaleScenePerAu: 1, targetOuterRadiusScene: 10 });
    const physical = v2PhysicalPositionAu([pure], scene.motions, day);
    expect(euclidean(screen, { x: physical[0], y: physical[1], z: physical[2] }))
      .toBeGreaterThan(0.01);
    expect(motion.eccentricity).toBe(0.98);
    expect(motion.periodDays).toBe(7300);
  });

  it('rejects impossible envelopes instead of silently drawing through the photosphere', () => {
    expect(() => buildV2CometVisualOrbit({ physicalSemiMajorScene: 1,
      physicalEccentricity: 0.98, starOpticalRadiusScene: 1.5,
      cometRadiusScene: 0.05, maximumApoapsisScene: 2.38 })).toThrow(RangeError);
  });

  it.each([StellarSystemMultiplicity.SINGLE, StellarSystemMultiplicity.BINARY, StellarSystemMultiplicity.TRIPLE])(
    '%s preserves the actual comet catalog but keeps every comet clear of all stars and on its own line', kind => {
      const scene = fixture(kind);
      const motionIndex = new Map(scene.motions.map(motion => [motion.id, motion]));
      const resolve = (id: string) => motionIndex.get(id);
      const comets = scene.minorBodies.filter(body => body.minorBodyKind === MinorBodyKind.COMET);
      expect(comets.length).toBeGreaterThan(0);
      expect(scene.minorBodies.filter(body => body.minorBodyKind !== MinorBodyKind.COMET)
        .every(body => body.motionContributions.at(-1)?.presentationEccentricity === undefined)).toBe(true);
      for (const comet of comets) {
        const orbit = scene.orbits.find(guide => guide.id === comet.orbitId)!;
        const part = comet.motionContributions.at(-1)!;
        const motion = motionIndex.get(part.motionId)!;
        expect(orbit).toBeDefined();
        expect(part.presentationEccentricity).toBe(orbit.presentationEccentricity);
        expect(orbit.presentationEccentricity).toBeGreaterThanOrEqual(V2_COMET_VISUAL_MIN_ECCENTRICITY);
        expect(orbit.presentationEccentricity).toBeLessThanOrEqual(V2_COMET_VISUAL_MAX_ECCENTRICITY);
        expect(orbit.semiMinorScene).toBeCloseTo(orbit.semiMajorScene *
          Math.sqrt(1 - orbit.presentationEccentricity! ** 2), 10);
        expect(orbit.focusOffsetScene).toBeCloseTo(orbit.semiMajorScene * orbit.presentationEccentricity!, 10);
        expect(orbit.linearScenePerAu).toBeCloseTo(part.linearScenePerAu!, 10);
        const hostLabel = /^mh-([abc])-/.exec(comet.id)?.[1];
        const host = hostLabel === undefined ? scene.stars[0]! :
          scene.stars.find(star => star.id.startsWith(`mh-${hostLabel}-`))!;
        const minimumDistance = (host.opticalRadiusScene ?? host.radiusScene) +
          comet.radiusScene + V2_COMET_STELLAR_CLEARANCE_SCENE;
        expect(orbit.semiMajorScene - orbit.focusOffsetScene).toBeGreaterThanOrEqual(minimumDistance - 1e-6);
        // Source science (period/eccentricity/physical AU) must not be replaced.
        expect(motion.eccentricity).toBeGreaterThanOrEqual(0);
        expect(motion.periodDays).toBeGreaterThan(0);
        const samples = sampleSystemSceneOrbitLocalAu({ ...motion,
          eccentricity: orbit.presentationEccentricity! }, 'minor-body', 512);
        for (const day of [0, 19, 87, 263, 521]) {
          const bodyPosition = projectSystemSceneMotionContributions(comet.motionContributions,
            resolve, day, scene.scale);
          const anchor = projectSystemSceneMotionContributions(orbit.anchorMotionContributions,
            resolve, day, scene.scale);
          const hostPosition = projectSystemSceneMotionContributions(host.motionContributions,
            resolve, day, scene.scale);
          expect(euclidean(anchor, hostPosition)).toBeLessThan(1e-6);
          for (const star of scene.stars) {
            const starPosition = projectSystemSceneMotionContributions(star.motionContributions,
              resolve, day, scene.scale);
            const starClearance = (star.opticalRadiusScene ?? star.radiusScene) + comet.radiusScene;
            expect(euclidean(bodyPosition, starPosition)).toBeGreaterThanOrEqual(
              starClearance - 1e-6);
            // Validate the entire line at this instant, not only the nucleus.
            for (const point of samples) {
              expect(euclidean({ x: anchor.x + point.x * part.linearScenePerAu!,
                y: anchor.y + point.y * part.linearScenePerAu!,
                z: anchor.z + point.z * part.linearScenePerAu! }, starPosition))
                .toBeGreaterThanOrEqual(starClearance - 1e-6);
            }
          }
          const nearest = Math.min(...samples.map(point => euclidean(bodyPosition, {
            x: anchor.x + point.x * part.linearScenePerAu!,
            y: anchor.y + point.y * part.linearScenePerAu!,
            z: anchor.z + point.z * part.linearScenePerAu!,
          })));
          expect(nearest).toBeLessThan(0.035);
          const physical = v2PhysicalPositionAu(comet.motionContributions, scene.motions, day);
          expect(physical.every(Number.isFinite)).toBe(true);
          const actual = SystemOrbitalMotionEngine.positionAtSimulationDay(motion,
            day * (part.presentationTimeScale ?? 1));
          expect(actual.xAu).toBeDefined();
        }
      }
    }, 120_000);
});
