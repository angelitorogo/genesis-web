import type { Vida7CivilizationTier } from '../../domain/life/vida7-intelligence-civilizations';
import type { SystemScenePlanetVegetationProfileV1 } from './system-scene-planet-surface-texture';

/** The same planet may be drawn before VIDA.9 finishes loading. The night-light
 * atlas and the GLSL define MUST NOT reuse a non-civilization cache entry. */
export function systemScenePlanetTextureCacheKeyVISCIV1b(
  systemIdentity: string,
  planetId: string,
  textureWidth: number,
  tier: Vida7CivilizationTier | null | undefined,
  vegetationProfile: SystemScenePlanetVegetationProfileV1 | null | undefined = null,
): string {
  // A surface generated before VIDA.9 completes must not keep its sterile
  // cached atlas after the same body's confirmed flora becomes available.
  // The full stable signature avoids collisions between different plant palettes.
  const vegetationKey = vegetationProfile === null || vegetationProfile === undefined
    ? 'NONE' : JSON.stringify([
        vegetationProfile.coverageFraction01,
        vegetationProfile.lushness01,
        vegetationProfile.floraSpeciesCount,
        vegetationProfile.paletteHexes,
        vegetationProfile.paletteEntries ?? null,
      ]);
  return `${systemIdentity}|${planetId}|D4c-25.11|${textureWidth}|VISCIV1b:${tier ?? 'NONE'}|VISBIO1:${vegetationKey}`;
}
