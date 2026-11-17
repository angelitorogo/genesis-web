/**
 * VISCIV.6l — cinematic playback tempo for purely decorative orbital assets.
 *
 * All factors are positive: nothing is stopped. We scale the already seeded
 * visual angular velocities, not the universe clock, scientific ephemerides,
 * station identities, orbit radii, starting phases or CT-0/VIDA data.
 *
 * This module is shared by SystemScene and the planet's 3D scientific card
 * through their common orbital plan builders. Adjust here if slower/faster
 * playback is desired in a later visual-only revision.
 */
export const ORBITAL_VISUAL_TEMPO_VISCIV6l = Object.freeze({
  SATELLITE: 0.22,
  STATION: 0.30,
  CONVOY: 0.35,
  SHUTTLE: 0.30,
  TERMINAL: 0.30,
});

export type OrbitalVisualTempoRoleVISCIV6l = keyof typeof ORBITAL_VISUAL_TEMPO_VISCIV6l;

export function slowOrbitalVisualSpeedVISCIV6l(
  baseSpeed: number,
  role: OrbitalVisualTempoRoleVISCIV6l,
): number {
  return baseSpeed * ORBITAL_VISUAL_TEMPO_VISCIV6l[role];
}
