import { type UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { scientificRouteUniverseRef } from '../scientific/scientific-route-identity';

/** Only the opaque public universe reference is persisted here, never the seed. */
export const ACTIVE_UNIVERSE_SELECTION_STORAGE_KEY = 'genesis.active-universe.ref.v1';

export function activeUniverseRef(key: UniverseGenerationKey): string {
  return scientificRouteUniverseRef(key.universeSeed.serialize(), key.generatorVersionCode);
}

/** A stored reference is never allowed to create a universe or choose another save. */
export function resolveSavedUniverse(
  universes: readonly UniverseGenerationKey[],
  inMemory: UniverseGenerationKey,
  explicitInMemory: boolean,
  storedRef: string | null,
): UniverseGenerationKey | null {
  const matching = (key: UniverseGenerationKey) =>
    universes.find(candidate => candidate.equals(key)) ?? null;

  if (explicitInMemory) {
    return matching(inMemory) ?? (universes.length === 1 ? universes[0] : null);
  }
  if (storedRef !== null) {
    const restored = universes.find(candidate => activeUniverseRef(candidate) === storedRef);
    // An obsolete/corrupt reference cannot redirect to the default V1 save.
    return restored ?? (universes.length === 1 ? universes[0] : null);
  }
  return matching(inMemory) ?? (universes.length === 1 ? universes[0] : null);
}

/** Storage may be blocked; game data must still be accessible via explicit selection. */
export function readSavedUniverseRef(): string | null {
  try {
    return globalThis.localStorage?.getItem(ACTIVE_UNIVERSE_SELECTION_STORAGE_KEY) ?? null;
  } catch {
    return null;
  }
}

export function saveUniverseRef(key: UniverseGenerationKey): void {
  try {
    globalThis.localStorage?.setItem(ACTIVE_UNIVERSE_SELECTION_STORAGE_KEY, activeUniverseRef(key));
  } catch {
    // The active key remains valid for the current session, never falsify persistence.
  }
}
