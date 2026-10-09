import Dexie from 'dexie';
import { IDBKeyRange, indexedDB } from 'fake-indexeddb';
import { GeneratorVersion } from '../../../domain/generation/generator-version';
import { SystemLocator } from '../../../domain/generation/procedural-locator';
import { UniverseGenerationKey } from '../../../domain/generation/universe-generation-key';
import { StellarSystemComponentLabel } from '../../../domain/stellar/stellar-system-component-label';
import { KilonovaCanonicalEvent } from '../../../domain/transient/kilonova-canonical-event';
import { KilonovaEventProfile, KilonovaRemnantKind } from '../../../domain/transient/kilonova-event-profile';
import { KilonovaProgenitorProfile } from '../../../domain/transient/kilonova-progenitor';
import { KilonovaStellarLineageStage } from '../../../domain/transient/kilonova-stellar-lineage';
import { KilonovaType } from '../../../domain/transient/kilonova-type';
import { UniverseSeed } from '../../../domain/universe/universe-seed';
import { GenesisIndexedDb } from '../indexed-db/genesis-indexed-db';
import { DexieUniverseRepository } from './dexie-universe.repository';
import { DexieKilonovaCanonicalEventRepository, KILONOVA_CANONICAL_EVENT_OBSERVATION_KIND_V1 } from './dexie-kilonova-canonical-event.repository';

describe('29.3 DexieKilonovaCanonicalEventRepository', () => {
  const databaseName = 'genesis-web-kilonova-tests';
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

  it('round-trips one canonical A-B merger in the existing observation table', async () => {
    const repository = new DexieKilonovaCanonicalEventRepository(database, { resolveTargetSeedNormalized: () => '96F17ABD83F31EF747FC750C996EB1C2' });
    const source = event();
    await repository.replaceForSystem(generationKey, locator, [source]);
    const [restored] = await repository.loadForSystem(generationKey, locator);
    expect(restored.eventKey).toBe('KILONOVA:A-B');
    expect(restored.profile.type).toBe(KilonovaType.BINARY_NEUTRON_STAR);
    expect(restored.profile.rProcessMassSolar).toBeGreaterThan(0);
    const rows = await database.observations.toArray();
    expect(rows[0]?.observationKind).toBe(KILONOVA_CANONICAL_EVENT_OBSERVATION_KIND_V1);
  });

  it('removes stale merger data when the system is no longer eligible', async () => {
    const repository = new DexieKilonovaCanonicalEventRepository(database, { resolveTargetSeedNormalized: () => '96F17ABD83F31EF747FC750C996EB1C2' });
    await repository.replaceForSystem(generationKey, locator, [event()]);
    await repository.replaceForSystem(generationKey, locator, []);
    expect(await repository.loadForSystem(generationKey, locator)).toEqual([]);
  });
});

function event(): KilonovaCanonicalEvent {
  const progenitor = new KilonovaProgenitorProfile(
    KilonovaType.BINARY_NEUTRON_STAR, 1.38, 1.27, 12.1, 0.0018, 0.08, 2e8, null, null,
  );
  const totalMassSolar = progenitor.primaryMassSolar + progenitor.secondaryMassSolar;
  const totalEjectaMassSolar = 0.045;
  const gravitationalRadiationMassFraction = 0.035;
  const remnantMassSolar =
    totalMassSolar * (1 - gravitationalRadiationMassFraction) - totalEjectaMassSolar;

  const profile = new KilonovaEventProfile(
    KilonovaType.BINARY_NEUTRON_STAR, progenitor,
    totalEjectaMassSolar, 0.015, 0.030, 0.036,
    0.24, 0.12, 8.4e44, 0.8, 4.2,
    5.5e34, 1.7e34, KilonovaRemnantKind.HYPERMASSIVE_NEUTRON_STAR, remnantMassSolar,
  );
  return new KilonovaCanonicalEvent(StellarSystemComponentLabel.A, StellarSystemComponentLabel.B,
    'Fixture A', 'Fixture B', KilonovaStellarLineageStage.FUTURE_NS_NS_MERGER, 5, 2e8, 5.2, profile);
}
