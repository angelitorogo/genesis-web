import Dexie from 'dexie';
import { IDBKeyRange, indexedDB } from 'fake-indexeddb';
import { GeneratorVersion } from '../../../domain/generation/generator-version';
import { SystemLocator } from '../../../domain/generation/procedural-locator';
import { UniverseGenerationKey } from '../../../domain/generation/universe-generation-key';
import { StellarSystemComponentLabel } from '../../../domain/stellar/stellar-system-component-label';
import { NovaCanonicalEvent } from '../../../domain/transient/nova-canonical-event';
import { NovaEventProfile } from '../../../domain/transient/nova-event-profile';
import { NovaProgenitorProfile, NovaWhiteDwarfComposition } from '../../../domain/transient/nova-progenitor';
import { NovaStellarLineageStage } from '../../../domain/transient/nova-stellar-lineage';
import { NovaType } from '../../../domain/transient/nova-type';
import { UniverseSeed } from '../../../domain/universe/universe-seed';
import { GenesisIndexedDb } from '../indexed-db/genesis-indexed-db';
import { DexieUniverseRepository } from './dexie-universe.repository';
import {
  DexieNovaCanonicalEventRepository,
  NOVA_CANONICAL_EVENT_OBSERVATION_KIND_V1,
} from './dexie-nova-canonical-event.repository';

describe('29.2 — DexieNovaCanonicalEventRepository', () => {
  const databaseName = 'genesis-web-nova-canonical-event-tests';
  const dependencies = Object.freeze({ indexedDB, IDBKeyRange });
  const generationKey = new UniverseGenerationKey(
    UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1'),
    GeneratorVersion.V2,
  );
  const locator = new SystemLocator(3n, -17n, 8n);
  const targetSeed = '96F17ABD83F31EF747FC750C996EB1C2';
  let database: GenesisIndexedDb;
  let repository: DexieNovaCanonicalEventRepository;
  let now = 1000;

  beforeEach(async () => {
    database = new GenesisIndexedDb(databaseName, { indexedDB, IDBKeyRange });
    repository = new DexieNovaCanonicalEventRepository(
      database,
      { resolveTargetSeedNormalized: () => targetSeed },
      () => now++,
    );
    await new DexieUniverseRepository(database, () => now++).createIfAbsent(generationKey);
  });

  afterEach(async () => {
    database.closeDatabase();
    await new Dexie(databaseName, dependencies).delete();
  });

  it('round-trips the complete nova cycle without mutating discovery state', async () => {
    const source = event(StellarSystemComponentLabel.A, StellarSystemComponentLabel.B, 'Novara A');
    await repository.replaceForSystem(generationKey, locator, [source]);
    const [restored] = await repository.loadForSystem(generationKey, locator);

    expect(restored.eventKey).toBe('NOVA:A');
    expect(restored.donorComponentLabel).toBe(StellarSystemComponentLabel.B);
    expect(restored.profile.type).toBe(NovaType.CLASSICAL);
    expect(restored.profile.progenitor.whiteDwarfMassSolar).toBe(0.9);
    expect(restored.profile.retainedEnvelopeMassSolar).toBeGreaterThan(0);
  });

  it('replaces stale component rows atomically and preserves nova-specific observation kind', async () => {
    const a = event(StellarSystemComponentLabel.A, StellarSystemComponentLabel.B, 'Novara A');
    const b = event(StellarSystemComponentLabel.B, StellarSystemComponentLabel.A, 'Novara B');
    await repository.replaceForSystem(generationKey, locator, [a, b]);
    expect(await repository.loadForSystem(generationKey, locator)).toHaveLength(2);

    await repository.replaceForSystem(generationKey, locator, [b]);
    const restored = await repository.loadForSystem(generationKey, locator);
    expect(restored.map(item => item.componentLabel)).toEqual([StellarSystemComponentLabel.B]);
    const rows = await database.observations.toArray();
    expect(rows).toHaveLength(1);
    expect(rows[0].observationKind).toBe(NOVA_CANONICAL_EVENT_OBSERVATION_KIND_V1);
    expect(rows[0].id).toContain(targetSeed);
  });

  it('rejects duplicate nova cycles for the same accreting component', async () => {
    const a = event(StellarSystemComponentLabel.A, StellarSystemComponentLabel.B, 'Novara A');
    await expect(repository.replaceForSystem(generationKey, locator, [a, a]))
      .rejects.toThrow(/Duplicate canonical nova component/);
  });
});

function event(
  component: typeof StellarSystemComponentLabel.A | typeof StellarSystemComponentLabel.B,
  donor: typeof StellarSystemComponentLabel.A | typeof StellarSystemComponentLabel.B,
  designation: string,
): NovaCanonicalEvent {
  const progenitor = new NovaProgenitorProfile(
    0.9, 0.8, 1, 0.4, 2e-9, 5e-5, NovaWhiteDwarfComposition.CARBON_OXYGEN,
  );
  const profile = new NovaEventProfile(
    NovaType.CLASSICAL,
    progenitor,
    4e-5,
    1e-5,
    1e38,
    1_500,
    5e31,
    -8,
    10_000,
    2,
    25,
    80,
    400,
    25_000,
  );
  return new NovaCanonicalEvent(
    component,
    donor,
    designation,
    NovaStellarLineageStage.CLASSICAL_NOVA_CHANNEL,
    2,
    25_000,
    1.99999,
    2.000015,
    profile,
  );
}
