import { SystemOrbitalMotionEngine } from '../../simulation/orbital/system-orbital-motion-engine';
import { type SystemSceneSnapshot } from './system-scene-snapshot';

/** Laboratory-only telemetry uses the original AU elements, never scene-space
 * distances (which are deliberately rescaled differently per hierarchy). */
export interface LaboratoryStarDistance {
  readonly pair: string;
  readonly au: number;
}

export function laboratoryStarDistances(
  snapshot: SystemSceneSnapshot,
  simulationDay: number,
): readonly LaboratoryStarDistance[] {
  if (!Number.isFinite(simulationDay) || snapshot.stars.length < 2) {
    return [];
  }
  const motionById = new Map(snapshot.motions.map(motion => [motion.id, motion]));
  const stars = snapshot.stars.map(star => {
    let x = 0;
    let y = 0;
    let z = 0;
    for (const contribution of star.motionContributions) {
      const motion = motionById.get(contribution.motionId);
      if (!motion) {
        throw new Error(`Unknown laboratory stellar motion ${contribution.motionId}.`);
      }
      const position = SystemOrbitalMotionEngine.positionAtSimulationDay(
        motion,
        simulationDay * (contribution.presentationTimeScale ?? 1),
      );
      x += position.xAu * contribution.scale;
      y += position.yAu * contribution.scale;
      z += position.zAu * contribution.scale;
    }
    return { label: star.label, x, y, z };
  });
  const result: LaboratoryStarDistance[] = [];
  for (let a = 0; a < stars.length; a++) {
    for (let b = a + 1; b < stars.length; b++) {
      const first = stars[a]!;
      const second = stars[b]!;
      result.push(Object.freeze({
        pair: `${first.label}–${second.label}`,
        au: Math.hypot(first.x - second.x, first.y - second.y, first.z - second.z),
      }));
    }
  }
  return Object.freeze(result);
}

/** Envelope for centring an entire SINGLE host rather than zooming to its photosphere.
 * The host prefix is assigned by the existing binary/triple composition. */
export function laboratorySubsystemRadius(
  snapshot: SystemSceneSnapshot,
  starId: string,
): number {
  const star = snapshot.stars.find(candidate => candidate.id === starId);
  if (!star) {
    throw new RangeError(`Unknown laboratory host star: ${starId}.`);
  }
  const prefix = star.id.slice(0, star.id.lastIndexOf('-star-') + 1);
  if (!/^lab-[abc]-$/.test(prefix)) {
    throw new RangeError(`Not a composed laboratory host: ${starId}.`);
  }
  let radius = Math.max(star.opticalRadiusScene ?? star.radiusScene, 0.20);
  for (const orbit of snapshot.orbits) {
    if (orbit.id.startsWith(prefix) && orbit.kind !== 'stellar') {
      // Local planetary guides are already measured from the host, while moon
      // guides alone do not determine the global extent of the planetary system.
      if (orbit.kind === 'planetary' || orbit.kind === 'minor-body') {
        radius = Math.max(radius, orbit.semiMajorScene + Math.abs(orbit.focusOffsetScene));
      }
    }
  }
  for (const belt of snapshot.asteroidBelts ?? []) {
    if (belt.id.startsWith(prefix)) {
      radius = Math.max(radius, belt.outerRadiusScene);
    }
  }
  for (const body of [...snapshot.planets, ...snapshot.moons, ...snapshot.minorBodies]) {
    if (body.id.startsWith(prefix)) {
      radius = Math.max(radius,
        Math.hypot(body.position.x - star.position.x,
          body.position.y - star.position.y,
          body.position.z - star.position.z) + body.radiusScene);
    }
  }
  const hostAnchor = star.motionContributions[star.motionContributions.length - 1];
  for (const zone of snapshot.habitableZones ?? []) {
    const zoneAnchor = zone.anchorMotionContributions[zone.anchorMotionContributions.length - 1];
    if (hostAnchor && zoneAnchor && hostAnchor.motionId === zoneAnchor.motionId &&
        hostAnchor.scale === zoneAnchor.scale) {
      radius = Math.max(radius, zone.radiativeOuterRadiusScene);
    }
  }
  return radius + 0.25;
}
