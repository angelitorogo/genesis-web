import { type SystemSceneHabitableZoneSnapshot, type SystemSceneMotionContributionSnapshot,
  type SystemSceneSnapshot } from './system-scene-snapshot';

export interface GameplayHostLayout {
  readonly label: string;
  readonly topology: 'S' | 'P';
  readonly planetCount: number;
}

/** Public, already-disclosed snapshot only; does not regenerate hidden planets. */
export function systemSceneGameplayHostLayout(snapshot: SystemSceneSnapshot): readonly GameplayHostLayout[] {
  if (snapshot.generatorVersionCode !== 2 ||
      (snapshot.multiplicityName !== 'BINARY' && snapshot.multiplicityName !== 'TRIPLE') ||
      snapshot.stars.length < 2) return Object.freeze([]);
  const hosts: GameplayHostLayout[] = snapshot.stars.map(star => Object.freeze({
    label: star.label, topology: 'S' as const,
    planetCount: snapshot.planets.filter(body => body.id.startsWith(`mh-${star.label.toLowerCase()}-planet-`)).length,
  }));
  hosts.push(Object.freeze({ label: 'A–B', topology: 'P' as const,
    planetCount: snapshot.planets.filter(body => body.id.startsWith('mh-p-planet-')).length }));
  // Detect malformed/foreign IDs rather than silently dropping generated worlds.
  if (hosts.reduce((sum, host) => sum + host.planetCount, 0) !== snapshot.planets.length) {
    throw new Error('The V2 renderer has planets without an assigned S/P host.');
  }
  return Object.freeze(hosts);
}

function sameAnchor(a: readonly SystemSceneMotionContributionSnapshot[],
  b: readonly SystemSceneMotionContributionSnapshot[]): boolean {
  return a.length === b.length && a.every((part, index) =>
    part.motionId === b[index]?.motionId && part.scale === b[index]?.scale);
}

/** Uses physical host motion relationships, not the zone's array ordinal. */
export function systemSceneHabitableZoneHostLabel(
  snapshot: SystemSceneSnapshot, zone: SystemSceneHabitableZoneSnapshot,
): string {
  if (zone.topology === 'CIRCUMBINARY') return 'Baricentro A–B · P';
  const star = snapshot.stars.find(candidate =>
    sameAnchor(candidate.motionContributions, zone.anchorMotionContributions));
  return star ? `Estrella ${star.label} · S` : 'Host estelar no resuelto';
}
