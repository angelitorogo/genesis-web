import Dexie from 'dexie';
import {
  IDBKeyRange,
  indexedDB,
} from 'fake-indexeddb';
import {
  GeneratorVersion,
} from '../../../domain/generation/generator-version';
import {
  SystemLocator,
} from '../../../domain/generation/procedural-locator';
import {
  UniverseGenerationKey,
} from '../../../domain/generation/universe-generation-key';
import {
  StellarSystemComponentLabel,
} from '../../../domain/stellar/stellar-system-component-label';
import {
  SupernovaCanonicalEvent,
  SupernovaCanonicalEventTemporalStatus,
} from '../../../domain/transient/supernova-canonical-event';
import {
  SupernovaCompactRemnantKind,
  SupernovaEventProfile,
} from '../../../domain/transient/supernova-event-profile';
import {
  SupernovaProgenitorChannel,
  SupernovaProgenitorCompactRemnantHint,
  SupernovaProgenitorProfile,
} from '../../../domain/transient/supernova-progenitor';
import {
  SupernovaStellarLineageStage,
} from '../../../domain/transient/supernova-stellar-lineage';
import {
  SupernovaType,
} from '../../../domain/transient/supernova-type';
import {
  UniverseSeed,
} from '../../../domain/universe/universe-seed';
import {
  GenesisIndexedDb,
} from '../indexed-db/genesis-indexed-db';
import {
  DexieUniverseRepository,
} from './dexie-universe.repository';
import {
  DexieSupernovaCanonicalEventRepository,
  SUPERNOVA_CANONICAL_EVENT_OBSERVATION_KIND_V1,
} from './dexie-supernova-canonical-event.repository';

describe('29.1C — DexieSupernovaCanonicalEventRepository', () => {
  const databaseName = 'genesis-web-supernova-canonical-event-tests';
  const dependencies = Object.freeze({ indexedDB, IDBKeyRange });
  const generationKey = new UniverseGenerationKey(
    UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1'),
    GeneratorVersion.V1,
  );
  const locator = new SystemLocator(3n, -17n, 8n);
  const targetSeed = '96F17ABD83F31EF747FC750C996EB1C2';

  let database: GenesisIndexedDb;
  let repository: DexieSupernovaCanonicalEventRepository;
  let now: number;

  const resolver = {
    resolveTargetSeedNormalized: () => targetSeed,
  };

  beforeEach(async () => {
    now = 1000;
    database = new GenesisIndexedDb(databaseName, dependencies);
    repository = new DexieSupernovaCanonicalEventRepository(
      database,
      resolver,
      () => now++,
    );
    await new DexieUniverseRepository(
      database,
      () => now++,
    ).createIfAbsent(generationKey);
  });

  afterEach(async () => {
    database.closeDatabase();
    await new Dexie(databaseName, dependencies).delete();
  });

  function event(
    componentLabel: typeof StellarSystemComponentLabel.A | typeof StellarSystemComponentLabel.B,
    designation: string,
    initialMassSolar: number,
  ): SupernovaCanonicalEvent {
    const progenitor = new SupernovaProgenitorProfile(
      SupernovaProgenitorChannel.CORE_COLLAPSE,
      initialMassSolar,
      initialMassSolar * 0.65,
      1,
      0.45,
      0.25,
      null,
      SupernovaProgenitorCompactRemnantHint.NEUTRON_STAR,
    );
    // Repository tests own a domain fixture instead of invoking simulation.
    // This preserves the architecture boundary data/local -> domain and keeps
    // physical-profile derivation covered by SupernovaEventEngine's own specs.
    const compactRemnantMassSolar = 1.5;
    const profile = new SupernovaEventProfile(
      SupernovaType.TYPE_II,
      progenitor,
      progenitor.preExplosionMassSolar - compactRemnantMassSolar,
      0.07,
      1e44,
      5_000,
      1e35,
      -17,
      10_000,
      10,
      90,
      150,
      3_000,
      SupernovaCompactRemnantKind.NEUTRON_STAR,
      compactRemnantMassSolar,
    );

    return new SupernovaCanonicalEvent(
      componentLabel,
      designation,
      SupernovaStellarLineageStage.FUTURE_CORE_COLLAPSE,
      SupernovaCanonicalEventTemporalStatus.FUTURE_SCHEDULED,
      0,
      0.02,
      false,
      profile,
    );
  }

  it('round-trips the complete canonical physical event without depending on discovery state', async () => {
    const source = event(StellarSystemComponentLabel.A, 'Testara A', 18);

    await repository.replaceForSystem(generationKey, locator, [source]);
    const [restored] = await repository.loadForSystem(generationKey, locator);

    expect(restored.eventKey).toBe('SUPERNOVA:A');
    expect(restored.stellarDesignation).toBe('Testara A');
    expect(restored.profile.type).toBe(source.profile.type);
    expect(restored.profile.compactRemnantKind).toBe(
      source.profile.compactRemnantKind,
    );
    expect(restored.profile.progenitor.initialMassSolar).toBe(18);
    expect(restored.eventStellarAgeBillionYears).toBe(0.02);
  });

  it('uses one stable system/component id and replaces stale canonical rows atomically', async () => {
    const a = event(StellarSystemComponentLabel.A, 'Testara A', 18);
    const b = event(StellarSystemComponentLabel.B, 'Testara B', 20);

    await repository.replaceForSystem(generationKey, locator, [a, b]);
    expect(await repository.loadForSystem(generationKey, locator)).toHaveLength(2);

    await repository.replaceForSystem(generationKey, locator, [b]);
    const restored = await repository.loadForSystem(generationKey, locator);
    expect(restored.map((entry) => entry.componentLabel)).toEqual([
      StellarSystemComponentLabel.B,
    ]);

    const rows = await database.observations.toArray();
    expect(rows).toHaveLength(1);
    expect(rows[0].observationKind).toBe(
      SUPERNOVA_CANONICAL_EVENT_OBSERVATION_KIND_V1,
    );
    expect(rows[0].id).toContain(targetSeed);
    expect(rows[0].id).toMatch(/:2$/);
  });

  it('rejects duplicate events for the same stellar component', async () => {
    const first = event(StellarSystemComponentLabel.A, 'Testara A', 18);
    const duplicate = event(StellarSystemComponentLabel.A, 'Testara A', 20);

    await expect(
      repository.replaceForSystem(
        generationKey,
        locator,
        [first, duplicate],
      ),
    ).rejects.toThrow(/Duplicate canonical supernova event/);
  });

  it('can persist an empty event set and removes previously stored supernova Ground Truth only', async () => {
    const source = event(StellarSystemComponentLabel.A, 'Testara A', 18);
    await repository.replaceForSystem(generationKey, locator, [source]);

    await repository.replaceForSystem(generationKey, locator, []);

    expect(await repository.loadForSystem(generationKey, locator)).toEqual([]);
  });
});
