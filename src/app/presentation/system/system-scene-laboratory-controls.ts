import { SystemOrbitalMotionEngine } from '../../simulation/orbital/system-orbital-motion-engine';
import { type SystemSceneSnapshot } from './system-scene-snapshot';

/** Shared read-only stellar telemetry: original orbital AU, never scene units.
 * Knowledge/disclosure checks belong to the caller; this only projects an
 * already-resolved snapshot for the current simulation instant. */
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
        throw new Error(`Unknown stellar motion ${contribution.motionId}.`);
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

/**
 * Production V1 keeps its legacy stellar-only camera focus: its P planets do
 * not belong to an individual star. V2's explicitly composed S hosts instead
 * focus the complete visible subsystem, never the entire A/B/C/P aggregate.
 * All numbers are presentation radii; this never changes physical AU orbits.
 */
export function productionStarFocusRadius(
  snapshot: SystemSceneSnapshot,
  starId: string,
): number {
  const star = snapshot.stars.find(candidate => candidate.id === starId);
  if (!star) throw new RangeError(`Unknown production star: ${starId}.`);
  const optical = Math.max(star.opticalRadiusScene ?? star.radiusScene, star.radiusScene);
  const stellarOnly = Math.max(0.45, optical * 3) + 0.25;
  if (snapshot.generatorVersionCode !== 2 ||
      (snapshot.multiplicityName !== 'BINARY' && snapshot.multiplicityName !== 'TRIPLE')) {
    return stellarOnly;
  }
  // Only real V2 composer IDs are accepted: lab-* never enters production,
  // and mh-p-* circumbinary bodies cannot be attributed to a SINGLE star.
  const match = /^mh-([abc])-star-/.exec(starId);
  if (!match || match[1] !== star.label.toLowerCase()) {
    throw new RangeError(`Invalid V2 stellar host identity: ${starId}.`);
  }
  const prefix = `mh-${match[1]}-`;
  let radius = stellarOnly - 0.25;
  for (const orbit of snapshot.orbits) {
    if (orbit.id.startsWith(prefix) &&
        (orbit.kind === 'planetary' || orbit.kind === 'minor-body')) {
      radius = Math.max(radius, orbit.semiMajorScene + Math.abs(orbit.focusOffsetScene));
    }
  }
  for (const belt of snapshot.asteroidBelts ?? []) {
    if (belt.id.startsWith(prefix)) radius = Math.max(radius, belt.outerRadiusScene);
  }
  for (const body of [...snapshot.planets, ...snapshot.moons, ...snapshot.minorBodies]) {
    if (!body.id.startsWith(prefix)) continue;
    radius = Math.max(radius, Math.hypot(
      body.position.x - star.position.x,
      body.position.y - star.position.y,
      body.position.z - star.position.z,
    ) + body.radiusScene);
  }
  for (const zone of snapshot.habitableZones ?? []) {
    if (zone.topology === 'CIRCUMSTELLAR' &&
        zone.anchorMotionContributions.length === star.motionContributions.length &&
        zone.anchorMotionContributions.every((part, index) =>
          part.motionId === star.motionContributions[index]?.motionId &&
          part.scale === star.motionContributions[index]?.scale)) {
      radius = Math.max(radius, zone.radiativeOuterRadiusScene);
    }
  }
  return radius + 0.25;
}
