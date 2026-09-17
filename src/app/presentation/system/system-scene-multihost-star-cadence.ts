import {
  type SystemSceneMotionContributionSnapshot,
  type SystemSceneSnapshot,
} from './system-scene-snapshot';
import { projectSystemSceneMotionContributions } from './system-scene-motion-projection';
import {
  MULTIHOST_V221_SECONDS_PER_ORBIT,
  multihostPresentationTimeScaleV221,
} from './system-scene-multihost-laboratory-cadence';
import { SystemSceneProjectionSpace, systemSceneProjectedRadiusAuInSpace } from './system-scene-scale-projection';
import { multihostStellarPostProjectionScaleV222 } from './system-scene-multihost-hierarchical-layout';

/**
 * Slow the entire stellar host hierarchy for the opt-in LAB snapshot only.
 * Rebase EVERY V1 dependent body/guide/HZ/belt with the SAME motion clock:
 * slowing only star meshes would leave planets and overlays behind.
 */
export function withMultihostLaboratoryStellarCadenceV221(
  snapshot: SystemSceneSnapshot,
): SystemSceneSnapshot {
  if (snapshot.stars.length < 2) return snapshot;
  const motionsById = new Map(snapshot.motions.map(motion => [motion.id, motion]));
  const stellarIds = new Set(snapshot.stars.flatMap(star =>
    star.motionContributions.map(contribution => contribution.motionId)));
  if (stellarIds.size === 0) return snapshot;
  const clock = snapshot.simulation.playbackDaysPerRealSecond;
  const binarySpread = binaryReadableHostSpreadV224(snapshot, motionsById);
  // In some legacy TRIPLE snapshots the outer motion carries GLOBAL rather
  // than TRIPLE_OUTER on C; classify by the shared motion id as well.
  const outerStellarIds = new Set(
    snapshot.multiplicityName === 'TRIPLE'
      ? snapshot.stars.filter(star => star.label === 'C')
          .flatMap(star => star.motionContributions.map(part => part.motionId))
      : [],
  );
  const replace = (entries: readonly SystemSceneMotionContributionSnapshot[]) =>
    Object.freeze(entries.map(contribution => {
      const motion = motionsById.get(contribution.motionId);
      if (!stellarIds.has(contribution.motionId) || motion === undefined) return contribution;
      const seconds = (contribution.projectionSpace === SystemSceneProjectionSpace.TRIPLE_OUTER ||
        outerStellarIds.has(contribution.motionId))
        ? MULTIHOST_V221_SECONDS_PER_ORBIT.STELLAR_OUTER
        : MULTIHOST_V221_SECONDS_PER_ORBIT.STELLAR_INNER;
      return Object.freeze({
        ...contribution,
        presentationTimeScale: multihostPresentationTimeScaleV221(
          motion.periodDays, clock, seconds),
        postProjectionScale: finitePositiveMaximum(
          contribution.postProjectionScale,
          binarySpread ?? multihostStellarPostProjectionScaleV222(snapshot.multiplicityName, contribution),
        ),
      });
    }));
  const rebase = <T extends { readonly motionContributions: readonly SystemSceneMotionContributionSnapshot[];
    readonly position: {readonly x: number; readonly y: number; readonly z: number} }>(body: T): T => {
    if (!body.motionContributions.some(c => stellarIds.has(c.motionId))) return body;
    const motionContributions = replace(body.motionContributions);
    const position = projectSystemSceneMotionContributions(
      motionContributions, id => motionsById.get(id),
      snapshot.simulation.epochSimulationDay, snapshot.scale);
    return Object.freeze({...body, motionContributions, position}) as T;
  };
  return Object.freeze({
    ...snapshot,
    stars: Object.freeze(snapshot.stars.map(rebase)),
    planets: Object.freeze(snapshot.planets.map(rebase)),
    moons: Object.freeze(snapshot.moons.map(rebase)),
    minorBodies: Object.freeze(snapshot.minorBodies.map(rebase)),
    orbits: Object.freeze(snapshot.orbits.map(orbit => {
      const anchorMotionContributions = replace(orbit.anchorMotionContributions);
      const stellarMotionScale = orbit.motionId !== null && stellarIds.has(orbit.motionId)
        ? finitePositiveMaximum(
            orbit.postProjectionScale,
            binarySpread ?? multihostStellarPostProjectionScaleV222(snapshot.multiplicityName, {
              motionId: orbit.motionId,
              scale: orbit.motionScale,
              ...(orbit.projectionSpace === undefined ? {} : { projectionSpace: orbit.projectionSpace }),
            }),
          )
        : orbit.postProjectionScale;
      return Object.freeze({
        ...orbit,
        anchorMotionContributions,
        ...(stellarMotionScale === undefined ? {} : { postProjectionScale: stellarMotionScale }),
      });
    })),
    asteroidBelts: snapshot.asteroidBelts === undefined ? undefined :
      Object.freeze(snapshot.asteroidBelts.map(belt => Object.freeze({
        ...belt, anchorMotionContributions: replace(belt.anchorMotionContributions),
      }))),
    habitableZone: snapshot.habitableZone === null ? null : Object.freeze({
      ...snapshot.habitableZone,
      anchorMotionContributions: replace(snapshot.habitableZone.anchorMotionContributions),
    }),
  });
}

function finitePositiveMaximum(
  left: number | undefined,
  right: number,
): number {
  const safeLeft = left !== undefined && Number.isFinite(left) && left > 0 ? left : 1;
  return Math.max(safeLeft, right);
}

/**
 * A binary with extremely tight AU can project into less than a photosphere.
 * Enlarge ONLY the relative stellar motion after AU projection, keeping the
 * whole stellar orbit guide and dependent anchors on that identical scale.
 * No change to the common SystemSceneScaleSnapshot (V2.2.4 crash regression).
 */
function binaryReadableHostSpreadV224(
  snapshot: SystemSceneSnapshot,
  motions: ReadonlyMap<string, SystemSceneSnapshot['motions'][number]>,
): number | null {
  if (snapshot.multiplicityName !== 'BINARY') return null;
  const a = snapshot.stars.find(star => star.label === 'A');
  const b = snapshot.stars.find(star => star.label === 'B');
  if (a === undefined || b === undefined) return null;
  const ca = a.motionContributions.find(part => b.motionContributions.some(other =>
    other.motionId === part.motionId));
  if (ca === undefined) return null;
  const cb = b.motionContributions.find(part => part.motionId === ca.motionId);
  const motion = motions.get(ca.motionId);
  if (cb === undefined || motion === undefined) return null;
  const projectedPeri = systemSceneProjectedRadiusAuInSpace(
    motion.semiMajorAxisAu * (1 - motion.eccentricity), snapshot.scale,
    SystemSceneProjectionSpace.GLOBAL,
  ) * Math.abs(ca.scale - cb.scale);
  if (!(Number.isFinite(projectedPeri) && projectedPeri > 1e-9)) return null;
  const opticalRadius = Math.max(...[a, b].map(star =>
    Math.max(star.radiusScene, star.opticalRadiusScene ?? star.radiusScene)));
  // A fixed 4.4-scene target erased the visual difference between, e.g.,
  // a ~3 AU pair and a ~93 AU pair. Reserve optical clearance, then increase
  // the stellar gap monotonically with the PHYSICAL periapsis (compressed
  // logarithmically so extremely wide binaries remain navigable). This is
  // still a presentation-only scale: neither AU nor periods are modified.
  const physicalPeriapsisAu = motion.semiMajorAxisAu * (1 - motion.eccentricity);
  const desiredMinimumSeparation = binaryPhysicalSeparationTargetSceneV226(
    physicalPeriapsisAu, opticalRadius,
  );
  // Never shrink the source trajectory. Apply exactly the SAME multiplier to
  // both stellar contributions, their guide and all anchored descendants.
  return Math.min(10_000_000_000, Math.max(1, desiredMinimumSeparation / projectedPeri));
}

/**
 * Binary LAB, non-linear AU -> scene *relative* spacing with two full disks.
 * The 3 AU reference defines the compact-pair baseline for TWO complete disks.
 * Unlike a flat floor, 90+ AU systems have distinctly wider gaps compared
 * with their host-local disks. This is not a universal linear scale or an
 * instantaneous physical-distance measurement (the HUD provides that).
 */
export function binaryPhysicalSeparationTargetSceneV226(
  periapsisAu: number,
  opticalRadiusScene: number,
): number {
  // V2.3.4: both complete SINGLE/V3 4.8-scene disks must fit even at
  // stellar periastron. Never shrink local disks to fit the old 4.4 gap.
  // The additional physical-AU-dependent gap preserves close/wide contrast.
  const localSingleDiskRadius = 4.8;
  const clearanceFloor = Math.max(
    2 * localSingleDiskRadius + 0.65,
    2 * (opticalRadiusScene + localSingleDiskRadius + 0.30),
  );
  if (!Number.isFinite(periapsisAu) || periapsisAu <= 0) {
    return clearanceFloor;
  }
  const logExpansion = 7.2 * Math.log10(Math.max(1, periapsisAu / 3));
  return clearanceFloor + Math.min(14.4, logExpansion);
}
