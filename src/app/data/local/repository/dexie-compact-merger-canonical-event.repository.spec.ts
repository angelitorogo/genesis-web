import Dexie from 'dexie';
import { IDBKeyRange, indexedDB } from 'fake-indexeddb';
import { GeneratorVersion } from '../../../domain/generation/generator-version';
import { SystemLocator } from '../../../domain/generation/procedural-locator';
import { UniverseGenerationKey } from '../../../domain/generation/universe-generation-key';
import { StellarSystemComponentLabel } from '../../../domain/stellar/stellar-system-component-label';
import { CompactMergerCanonicalEvent } from '../../../domain/transient/compact-merger-canonical-event';
import { CompactMergerCounterpartKind, CompactMergerEventProfile, CompactMergerMassBudgetResolution, CompactMergerRemnantKind } from '../../../domain/transient/compact-merger-event-profile';
import { CompactMergerProgenitorProfile } from '../../../domain/transient/compact-merger-progenitor';
import { CompactMergerStellarLineageStage } from '../../../domain/transient/compact-merger-stellar-lineage';
import { CompactMergerType } from '../../../domain/transient/compact-merger-type';
import { UniverseSeed } from '../../../domain/universe/universe-seed';
import { GenesisIndexedDb } from '../indexed-db/genesis-indexed-db';
import { DexieUniverseRepository } from './dexie-universe.repository';
import { COMPACT_MERGER_CANONICAL_EVENT_OBSERVATION_KIND_V1, DexieCompactMergerCanonicalEventRepository } from './dexie-compact-merger-canonical-event.repository';

describe('29.4 DexieCompactMergerCanonicalEventRepository', () => {
  const databaseName = 'genesis-web-compact-merger-tests';
  const generationKey = new UniverseGenerationKey(
    UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1'), GeneratorVersion.V2,
  );
  const locator = new SystemLocator(3n, -17n, 8n);
  let database: GenesisIndexedDb;

  beforeEach(async () => {
    database = new GenesisIndexedDb(databaseName, { indexedDB, IDBKeyRange });
    await new DexieUniverseRepository(database).createIfAbsent(generationKey);
  });
  afterEach(async () => { database.closeDatabase(); await new Dexie(databaseName, { indexedDB, IDBKeyRange }).delete(); });

  it('round-trips a BH-BH event without manufacturing unresolved spin-dependent values', async () => {
    const repository = new DexieCompactMergerCanonicalEventRepository(database, { resolveTargetSeedNormalized: () => '96F17ABD83F31EF747FC750C996EB1C2' });
    await repository.replaceForSystem(generationKey, locator, [event()]);
    const [restored] = await repository.loadForSystem(generationKey, locator);
    expect(restored.eventKey).toBe('COMPACT_MERGER:A-B');
    expect(restored.profile.type).toBe(CompactMergerType.BLACK_HOLE_BLACK_HOLE);
    expect(restored.profile.remnantMassSolar).toBeNull();
    expect(restored.profile.resolvedMatterEjectaMassSolar).toBeNull();
    const rows = await database.observations.toArray();
    expect(rows[0]?.observationKind).toBe(COMPACT_MERGER_CANONICAL_EVENT_OBSERVATION_KIND_V1);
  });

  it('removes stale merger data when the system is no longer eligible', async () => {
    const repository = new DexieCompactMergerCanonicalEventRepository(database, { resolveTargetSeedNormalized: () => '96F17ABD83F31EF747FC750C996EB1C2' });
    await repository.replaceForSystem(generationKey, locator, [event()]);
    await repository.replaceForSystem(generationKey, locator, []);
    expect(await repository.loadForSystem(generationKey, locator)).toEqual([]);
  });
});

function event(): CompactMergerCanonicalEvent {
  const progenitor = new CompactMergerProgenitorProfile(
    CompactMergerType.BLACK_HOLE_BLACK_HOLE, 32, 27, null, 0.003, 0.03, 8e8,
  );
  const profile = new CompactMergerEventProfile(
    CompactMergerType.BLACK_HOLE_BLACK_HOLE,
    progenitor,
    progenitor.totalMassSolar,
    progenitor.chirpMassSolar,
    progenitor.massRatio,
    progenitor.symmetricMassRatio,
    CompactMergerCounterpartKind.NO_PROMPT_ELECTROMAGNETIC_COUNTERPART_EXPECTED,
    CompactMergerMassBudgetResolution.BH_SPIN_UNRESOLVED,
    CompactMergerRemnantKind.STELLAR_BLACK_HOLE,
    null,
    null,
    null,
  );
  return new CompactMergerCanonicalEvent(
    StellarSystemComponentLabel.A, StellarSystemComponentLabel.B,
    'Fixture A', 'Fixture B', CompactMergerStellarLineageStage.FUTURE_BH_BH_MERGER,
    5, 8e8, 5.8, profile,
  );
}
