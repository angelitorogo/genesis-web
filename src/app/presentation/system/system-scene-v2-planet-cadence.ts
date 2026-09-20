import {
  type SystemSceneSnapshot, type SystemSceneMotionContributionSnapshot,
} from './system-scene-snapshot';

/** V2 presentation only: the innermost planet of each orbital host takes 200 s
 * per visual revolution and the outermost 400 s, with a smooth progression in
 * orbital-radius order. A solitary planet uses the midpoint (300 s).
 * Orbital periods in snapshot.motions, orbital elements and scientific cards
 * remain untouched. The renderer's scale may be greater or less than 1.
 */
export function v2PlanetOrbitSeconds(
  semiMajorAxisAu: number, radialRank: number, hostPlanetCount: number,
): number {
  if (!Number.isFinite(semiMajorAxisAu) || semiMajorAxisAu <= 0 ||
      !Number.isSafeInteger(radialRank) || radialRank < 1 ||
      !Number.isSafeInteger(hostPlanetCount) || hostPlanetCount < 1 ||
      radialRank > hostPlanetCount) {
    throw new RangeError('Planet presentation needs a positive orbit and valid radial rank/count.');
  }
  return hostPlanetCount === 1 ? 300 :
    200 + 200 * (radialRank - 1) / (hostPlanetCount - 1);
}

export function v2PlanetTimeScale(
  physicalPeriodDays: number, playbackDaysPerRealSecond: number,
  semiMajorAxisAu: number, radialRank: number, hostPlanetCount: number,
): number {
  if (!Number.isFinite(physicalPeriodDays) || physicalPeriodDays <= 0 ||
      !Number.isFinite(playbackDaysPerRealSecond) || playbackDaysPerRealSecond <= 0) {
    throw new RangeError('Planet presentation requires valid physical period and playback.');
  }
  return physicalPeriodDays / (playbackDaysPerRealSecond *
    v2PlanetOrbitSeconds(semiMajorAxisAu, radialRank, hostPlanetCount));
}

/** Apply only to the public V2 SINGLE presentation. A is physically V1, but
 * its public scene must use the same visual cadence as B/C/P in multihost.
 * Planetary contributions are inherited by moons and orbit guides: update all
 * consumers together so satellite paths and camera tracking stay coherent.
 */
export function withV2SinglePlanetCadence(snapshot: SystemSceneSnapshot): SystemSceneSnapshot {
  if (snapshot.generatorVersionCode !== 2) return snapshot;
  const planetMotionIds = new Set(snapshot.orbits
    .filter(orbit => orbit.kind === 'planetary' && orbit.motionId !== null)
    .map(orbit => orbit.motionId!));
  const scales = new Map<string, number>();
  const ordered = snapshot.planets.map(planet => {
    const motionId = planet.motionContributions.at(-1)?.motionId;
    const motion = snapshot.motions.find(candidate => candidate.id === motionId);
    if (!motion || !motionId || !planetMotionIds.has(motionId)) {
      throw new Error('V2 SINGLE planet has no authoritative planetary orbital motion.');
    }
    return { motionId, motion };
  }).sort((a, b) => a.motion.semiMajorAxisAu - b.motion.semiMajorAxisAu);
  for (const [index, { motionId, motion }] of ordered.entries()) {
    scales.set(motionId, v2PlanetTimeScale(motion.periodDays,
      snapshot.simulation.playbackDaysPerRealSecond, motion.semiMajorAxisAu,
      index + 1, ordered.length));
  }
  const parts = (contributions: readonly SystemSceneMotionContributionSnapshot[]) =>
    Object.freeze(contributions.map(part => scales.has(part.motionId)
      ? Object.freeze({ ...part, presentationTimeScale: scales.get(part.motionId)! }) : part));
  return Object.freeze({
    ...snapshot,
    planets: Object.freeze(snapshot.planets.map(body => Object.freeze({
      ...body, motionContributions: parts(body.motionContributions),
    }))),
    moons: Object.freeze(snapshot.moons.map(body => Object.freeze({
      ...body, motionContributions: parts(body.motionContributions),
    }))),
    orbits: Object.freeze(snapshot.orbits.map(orbit => Object.freeze({
      ...orbit, anchorMotionContributions: parts(orbit.anchorMotionContributions),
    }))),
  });
}
