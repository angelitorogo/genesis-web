import { type MultihostScientificPlanetCatalogV241 } from './multihost-scientific-planet-v241';
import { type MultihostScientificMoonCatalogV242 } from './multihost-scientific-moon-v242';
import { type MultihostScientificMinorBodyCatalogV243 } from './multihost-scientific-minor-bodies-v243';
import { type MultihostHabitabilityCatalogV244 } from './multihost-habitability-v244';

export const MULTIHOST_MODEL_RELEASE_V245 = 'V2.4.5-S-TYPE-A-B-REFERENCE-1';
export type MultihostModelKindV245 = 'PLANET' | 'MOON' | 'ASTEROID' | 'COMET' | 'BELT';
export interface MultihostModelIdentityV245 {
  readonly kind: MultihostModelKindV245;
  readonly sourceId: string;
  readonly publicRef: string;
  readonly hostId: 'A' | 'B';
  readonly parentPublicRef: string | null;
}
/** Versioned *experimental reference manifest*. It is not an observation,
 * confirmed discovery, V1 Planet/BodyLocator or second procedural universe.
 * Physical catalogues regenerate from the original V1 seed; only fingerprints
 * and stable V2 identity bindings are stored in the existing observations table. */
export interface MultihostModelManifestV245 {
  readonly version: 'V2_4_5_MODEL_MANIFEST';
  readonly modelRelease: typeof MULTIHOST_MODEL_RELEASE_V245;
  readonly sourceSystemSeed: string;
  readonly catalogueFingerprint: string;
  readonly identities: readonly MultihostModelIdentityV245[];
  readonly habitableHostCount: number;
}

export function multihostPublicRefV245(kind: MultihostModelKindV245, sourceId: string): string {
  if (!sourceId || sourceId.length > 256) throw new RangeError('Invalid V2 source identity.');
  const label = `GENESIS:V245:${kind}:${sourceId}`;
  return `${hash64(label, 0xcbf29ce484222325n)}${hash64(label, 0x6c62272e07bb0142n)}`;
}

export function buildMultihostModelManifestV245(input: Readonly<{
  planets: MultihostScientificPlanetCatalogV241;
  moons: MultihostScientificMoonCatalogV242;
  minorBodies: MultihostScientificMinorBodyCatalogV243;
  habitability: MultihostHabitabilityCatalogV244;
}>): MultihostModelManifestV245 {
  const seed = input.planets.sourceSystemSeed;
  if (!/^[0-9A-F]{32}$/.test(seed) ||
    input.moons.sourceSystemSeed !== seed || input.minorBodies.sourceSystemSeed !== seed ||
    input.habitability.sourceSystemSeed !== seed ||
    input.planets.version !== 'V2_4_1_PLANET_SCIENCE' ||
    input.moons.version !== 'V2_4_2_MOON_SCIENCE' ||
    input.minorBodies.version !== 'V2_4_3_MINOR_BODY_SCIENCE' ||
    input.habitability.version !== 'V2_4_4_S_TYPE_HABITABILITY') {
    throw new RangeError('Incompatible V2 scientific catalogues or SystemSeed.');
  }
  const identities: MultihostModelIdentityV245[] = [];
  const bySource = new Map<string, MultihostModelIdentityV245>();
  const add = (kind: MultihostModelKindV245, sourceId: string, hostId: 'A' | 'B', parentId: string | null) => {
    if (hostId !== 'A' && hostId !== 'B') throw new RangeError('V2.4.5 accepts S-type A/B only.');
    if (bySource.has(sourceId)) throw new RangeError('Duplicate V2 body identity.');
    const parent = parentId === null ? null : bySource.get(parentId);
    if (parentId !== null && (parent == null || parent.hostId !== hostId || parent.kind !== 'PLANET')) {
      throw new RangeError('V2 moon has an invalid parent identity/host.');
    }
    const value = Object.freeze({
      kind, sourceId, hostId, publicRef: multihostPublicRefV245(kind, sourceId),
      parentPublicRef: parent?.publicRef ?? null,
    });
    bySource.set(sourceId, value);
    identities.push(value);
  };
  for (const planet of input.planets.planets) {
    add('PLANET', planet.id, planet.hostId as 'A' | 'B', null);
  }
  for (const moon of input.moons.moons) add('MOON', moon.id, moon.hostId, moon.hostPlanetId);
  for (const belt of input.minorBodies.belts) add('BELT', belt.id, belt.hostId, null);
  for (const body of input.minorBodies.bodies) {
    add(body.kind, body.id, body.hostId, null);
  }
  const byPlanetId = new Set(input.planets.planets.map(p => p.id));
  if (input.habitability.planets.length !== input.planets.planets.length ||
    input.habitability.planets.some(p => !byPlanetId.has(p.planetId)) ||
    input.habitability.hosts.some(h => h.hostId !== 'A' && h.hostId !== 'B')) {
    throw new RangeError('V2 habitability and planetary identities do not match.');
  }
  const refs = new Set(identities.map(value => value.publicRef));
  if (refs.size !== identities.length) throw new RangeError('V2 public identity collision.');
  const fingerprintSource = JSON.stringify([
    MULTIHOST_MODEL_RELEASE_V245,
    input.planets.planets, input.moons.moons,
    input.minorBodies.hosts, input.minorBodies.belts, input.minorBodies.bodies,
    input.habitability.hosts, input.habitability.planets,
  ]);
  return Object.freeze({
    version: 'V2_4_5_MODEL_MANIFEST' as const,
    modelRelease: MULTIHOST_MODEL_RELEASE_V245,
    sourceSystemSeed: seed,
    catalogueFingerprint: `${hash64(fingerprintSource, 0xcbf29ce484222325n)}${hash64(fingerprintSource, 0x6c62272e07bb0142n)}`,
    identities: Object.freeze(identities),
    habitableHostCount: input.habitability.hosts.length,
  });
}

/** Reject stale/corrupted records. Do not silently migrate a V1 universe or
 * silently refresh a changed scientific model: the user must explicitly opt in. */
export function multihostManifestMatchesV245(
  persisted: MultihostModelManifestV245, current: MultihostModelManifestV245,
): boolean {
  return persisted.version === current.version &&
    persisted.modelRelease === current.modelRelease &&
    persisted.sourceSystemSeed === current.sourceSystemSeed &&
    persisted.catalogueFingerprint === current.catalogueFingerprint &&
    persisted.habitableHostCount === current.habitableHostCount &&
    JSON.stringify(persisted.identities) === JSON.stringify(current.identities);
}

const MASK64 = (1n << 64n) - 1n;
function hash64(value: string, basis: bigint): string {
  let hash = basis;
  for (const byte of new TextEncoder().encode(value)) hash = (hash ^ BigInt(byte)) * 0x100000001b3n & MASK64;
  return hash.toString(16).toUpperCase().padStart(16, '0');
}
