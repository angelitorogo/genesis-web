import type { Vida7CivilizationTier } from '../../domain/life/vida7-intelligence-civilizations';

/** The same planet may be drawn before VIDA.9 finishes loading. The night-light
 * atlas and the GLSL define MUST NOT reuse a non-civilization cache entry. */
export function systemScenePlanetTextureCacheKeyVISCIV1b(
  systemIdentity: string,
  planetId: string,
  textureWidth: number,
  tier: Vida7CivilizationTier | null | undefined,
): string {
  return `${systemIdentity}|${planetId}|D4c-25.11|${textureWidth}|VISCIV1b:${tier ?? 'NONE'}`;
}
