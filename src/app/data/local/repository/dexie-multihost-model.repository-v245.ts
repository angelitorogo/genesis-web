import { DiscoveryState } from '../../../domain/discovery/discovery-state';
import { DiscoveryTargetType } from '../../../domain/discovery/discovery-target-type';
import { type SystemLocator } from '../../../domain/generation/procedural-locator';
import { type UniverseGenerationKey } from '../../../domain/generation/universe-generation-key';
import {
  MULTIHOST_MODEL_RELEASE_V245,
  multihostPublicRefV245,
  type MultihostModelIdentityV245,
  type MultihostModelManifestV245,
} from '../../../domain/planetary/multihost-model-manifest-v245';
import { type MultihostModelRepositoryV245 } from '../../../domain/repository/multihost-model-repository-v245';
import { type GenesisIndexedDb } from '../indexed-db/genesis-indexed-db';
import { type ProceduralTargetSeedResolver } from './dexie-discovery.repository';
import {
  CorruptLocalDataError, ensureUniverseExists, generationKeyStorageParts, normalizeTargetSeed,
} from './local-repository-support';

export const MULTIHOST_MODEL_OBSERVATION_KIND_V245 = 'MULTIHOST_REFERENCE_MODEL_SELECTION_V245';
export const MULTIHOST_MODEL_PAYLOAD_VERSION_V245 = 1;

/** Deliberately stores ONLY the opt-in scientific-model manifest, never V1
 * observations, DiscoveryState, procedural generator versions or Ground Truth.
 * Existing observation store backs up/deletes this record with its universe. */
export class DexieMultihostModelRepositoryV245 implements MultihostModelRepositoryV245 {
  constructor(
    private readonly database: GenesisIndexedDb,
    private readonly resolver: ProceduralTargetSeedResolver,
    private readonly clock: () => number = Date.now,
  ) {}

  async load(key: UniverseGenerationKey, locator: SystemLocator): Promise<MultihostModelManifestV245 | null> {
    await ensureUniverseExists(this.database, key);
    const identity = this.identity(key, locator);
    if (!await this.confirmed(identity)) return null;
    const stored = await this.database.observations.get(identity.id);
    if (stored === undefined) return null;
    this.assertStoredIdentity(stored, identity);
    if (stored.payloadVersion !== MULTIHOST_MODEL_PAYLOAD_VERSION_V245) {
      throw new CorruptLocalDataError('Unsupported V2.4.5 model manifest version.');
    }
    let json: unknown;
    try { json = JSON.parse(stored.payloadJson); } catch {
      throw new CorruptLocalDataError('Invalid V2.4.5 model manifest JSON.');
    }
    return validateManifest(json, identity.targetSeed);
  }

  async save(
    key: UniverseGenerationKey, locator: SystemLocator, manifest: MultihostModelManifestV245,
  ): Promise<void> {
    await ensureUniverseExists(this.database, key);
    const identity = this.identity(key, locator);
    const validated = validateManifest(manifest, identity.targetSeed);
    await this.database.transaction(
      'rw', this.database.universes, this.database.discoveries, this.database.observations,
      async () => {
        const current = await this.database.universes.get([
          identity.universeSeed, identity.generatorVersionCode,
        ]);
        if (current === undefined || !await this.confirmed(identity)) {
          throw new RangeError('V2.4.5 can only be enabled in an existing CONFIRMED system.');
        }
        await this.database.observations.put({
          id: identity.id,
          universeSeed: identity.universeSeed,
          generatorVersionCode: identity.generatorVersionCode,
          targetTypeCode: DiscoveryTargetType.SYSTEM.code,
          targetSeed: identity.targetSeed,
          observationKind: MULTIHOST_MODEL_OBSERVATION_KIND_V245,
          payloadVersion: MULTIHOST_MODEL_PAYLOAD_VERSION_V245,
          payloadJson: JSON.stringify(validated),
          observedAtEpochMs: this.clock(),
        });
      },
    );
  }

  async clear(key: UniverseGenerationKey, locator: SystemLocator): Promise<void> {
    await ensureUniverseExists(this.database, key);
    const identity = this.identity(key, locator);
    await this.database.observations.delete(identity.id);
  }

  private async confirmed(identity: ReturnType<DexieMultihostModelRepositoryV245['identity']>): Promise<boolean> {
    const discovery = await this.database.discoveries.get([
      identity.universeSeed, identity.generatorVersionCode, DiscoveryTargetType.SYSTEM.code, identity.targetSeed,
    ]);
    return discovery !== undefined && discovery.discoveryStateCode >= DiscoveryState.CONFIRMED.code;
  }

  private identity(key: UniverseGenerationKey, locator: SystemLocator) {
    const {universeSeed, generatorVersionCode} = generationKeyStorageParts(key);
    const targetSeed = normalizeTargetSeed(this.resolver.resolveTargetSeedNormalized(key, locator));
    return {
      universeSeed, generatorVersionCode, targetSeed,
      id: `multihost-reference-v245:${universeSeed}:${generatorVersionCode}:${DiscoveryTargetType.SYSTEM.code}:${targetSeed}`,
    };
  }

  private assertStoredIdentity(stored: Readonly<{
    id: string; universeSeed: string; generatorVersionCode: number; targetTypeCode: number;
    targetSeed: string; observationKind: string;
  }>, identity: ReturnType<DexieMultihostModelRepositoryV245['identity']>): void {
    if (stored.id !== identity.id || stored.universeSeed !== identity.universeSeed ||
      stored.generatorVersionCode !== identity.generatorVersionCode ||
      stored.targetTypeCode !== DiscoveryTargetType.SYSTEM.code ||
      stored.targetSeed !== identity.targetSeed ||
      stored.observationKind !== MULTIHOST_MODEL_OBSERVATION_KIND_V245) {
      throw new CorruptLocalDataError('V2.4.5 model manifest identity mismatch.');
    }
  }
}

function validateManifest(value: unknown, expectedSeed: string): MultihostModelManifestV245 {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new CorruptLocalDataError('Invalid V2.4.5 model manifest.');
  }
  const raw = value as Partial<MultihostModelManifestV245>;
  if (raw.version !== 'V2_4_5_MODEL_MANIFEST' ||
    raw.modelRelease !== MULTIHOST_MODEL_RELEASE_V245 || raw.sourceSystemSeed !== expectedSeed ||
    typeof raw.catalogueFingerprint !== 'string' || !/^[0-9A-F]{32}$/.test(raw.catalogueFingerprint) ||
    !Number.isSafeInteger(raw.habitableHostCount) || raw.habitableHostCount! < 0 || raw.habitableHostCount! > 2 ||
    !Array.isArray(raw.identities) || raw.identities.length > 4096) {
    throw new CorruptLocalDataError('Invalid/stale V2.4.5 model manifest header.');
  }
  const used = new Set<string>();
  const usedPublic = new Set<string>();
  const planets = new Map<string, MultihostModelIdentityV245>();
  const identities: MultihostModelIdentityV245[] = [];
  for (const entry of raw.identities) {
    if (entry === null || typeof entry !== 'object' ||
      !['PLANET','MOON','ASTEROID','COMET','BELT'].includes(entry.kind) ||
      typeof entry.sourceId !== 'string' || entry.sourceId.length === 0 || entry.sourceId.length > 256 ||
      (entry.hostId !== 'A' && entry.hostId !== 'B') ||
      typeof entry.publicRef !== 'string' || entry.publicRef !== multihostPublicRefV245(entry.kind, entry.sourceId) ||
      (entry.parentPublicRef !== null && typeof entry.parentPublicRef !== 'string') ||
      used.has(entry.sourceId) || usedPublic.has(entry.publicRef)) {
      throw new CorruptLocalDataError('Invalid/duplicate V2.4.5 model body identity.');
    }
    if (entry.kind === 'MOON') {
      const parent = planets.get(entry.parentPublicRef ?? '');
      if (parent === undefined || parent.hostId !== entry.hostId) {
        throw new CorruptLocalDataError('V2.4.5 moon parent identity mismatch.');
      }
    } else if (entry.parentPublicRef !== null) {
      throw new CorruptLocalDataError('Non-moon V2.4.5 body cannot have a parent.');
    }
    const item = Object.freeze({
      kind: entry.kind, sourceId: entry.sourceId, publicRef: entry.publicRef,
      hostId: entry.hostId, parentPublicRef: entry.parentPublicRef,
    }) as MultihostModelIdentityV245;
    if (item.kind === 'PLANET') planets.set(item.publicRef, item);
    identities.push(item);
    used.add(item.sourceId);
    usedPublic.add(item.publicRef);
  }
  return Object.freeze({
    version: raw.version, modelRelease: raw.modelRelease,
    sourceSystemSeed: raw.sourceSystemSeed,
    catalogueFingerprint: raw.catalogueFingerprint,
    habitableHostCount: raw.habitableHostCount!,
    identities: Object.freeze(identities),
  });
}
