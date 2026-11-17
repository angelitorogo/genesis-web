import { DiscoveryState, type DiscoveryStateValue } from '../discovery/discovery-state';
import { type KnownDiscovery } from '../discovery/known-discovery';
import {
  BodyLocator, CivilizationLocator, GalaxyLocator, GalacticObjectLocator,
  SectorLocator, SystemLocator,
} from '../generation/procedural-locator';

/** 38.bis-b7: knowledge for exploration is NOT automatically published science.
 * A confirmed SYSTEM is the sole exception: it authorizes its public body inventory.
 * Pure read-only policy; never upgrades an existing discovery or inspects hidden CT-0.
 */
export function confirmedScientificSystemKeys38BisB7(
  discoveries: readonly Pick<KnownDiscovery, 'locator' | 'state'>[],
): ReadonlySet<string> {
  return new Set(discoveries
    .filter(d => d.locator instanceof SystemLocator && d.state.code === DiscoveryState.CONFIRMED.code)
    .map(d => scientificSystemKey38BisB7(d.locator as SystemLocator)));
}

export function scientificSystemKey38BisB7(
  locator: Pick<SystemLocator, 'galaxyIndex' | 'sectorKey' | 'galacticObjectIndex'>,
): string {
  return `${locator.galaxyIndex}/${locator.sectorKey}/${locator.galacticObjectIndex}`;
}

export function confirmedScientificDiscoveries38BisB7(
  discoveries: readonly KnownDiscovery[],
): readonly KnownDiscovery[] {
  const authorizedSystems = confirmedScientificSystemKeys38BisB7(discoveries);
  return Object.freeze(discoveries.filter(d => {
    if (d.locator instanceof SectorLocator) return false; // Coverage, not scientific objects.
    if (d.locator instanceof GalaxyLocator || d.locator instanceof GalacticObjectLocator ||
        d.locator instanceof SystemLocator) {
      return d.state.code === DiscoveryState.CONFIRMED.code;
    }
    if (d.locator instanceof BodyLocator || d.locator instanceof CivilizationLocator) {
      return d.state.code === DiscoveryState.CONFIRMED.code ||
        authorizedSystems.has(scientificSystemKey38BisB7(d.locator));
    }
    return false;
  }));
}

export function isConfirmedScientificGalaxy38BisB7(
  state: DiscoveryStateValue,
): state is typeof DiscoveryState.CONFIRMED {
  return state.code === DiscoveryState.CONFIRMED.code;
}
