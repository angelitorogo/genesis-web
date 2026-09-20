import Dexie from 'dexie';
import { IDBKeyRange, indexedDB } from 'fake-indexeddb';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { GenesisIndexedDb } from '../../data/local/indexed-db/genesis-indexed-db';
import { DexieUniverseRepository } from '../../data/local/repository/dexie-universe.repository';
import { DexieDiscoveryPointsRepository } from '../../data/local/repository/dexie-discovery-points.repository';
import { DexieCodesRedemptionRuntime, normalizeRedemptionCode, TEST_PD_CODE, TEST_PD_AMOUNT } from './codes-redemption.runtime';
import { SECTOR_BLOCK_CODES } from './sector-block-codes';

const dependencies = { indexedDB, IDBKeyRange };
const seed = UniverseSeed.parse('C0DE-0000-0000-0000-0000-0000-0000-0001');
const v1 = new UniverseGenerationKey(seed, GeneratorVersion.V1);
const v2 = new UniverseGenerationKey(seed.copy(), GeneratorVersion.V2);
const otherV2 = new UniverseGenerationKey(
  UniverseSeed.parse('C0DE-0000-0000-0000-0000-0000-0000-0002'), GeneratorVersion.V2,
);

// The receipt and reward must survive new IndexedDB connections and concurrent redemption.
describe('Códigos V2 — canje atómico de PD', () => {
  const name = 'genesis-codes-redemption-test';
  let db: GenesisIndexedDb;
  let points: DexieDiscoveryPointsRepository;
  let runtime: DexieCodesRedemptionRuntime;

  beforeEach(async () => {
    db = new GenesisIndexedDb(name, dependencies);
    points = new DexieDiscoveryPointsRepository(db);
    runtime = new DexieCodesRedemptionRuntime(db);
    const universes = new DexieUniverseRepository(db);
    await universes.createIfAbsent(v1);
    await universes.createIfAbsent(v2);
    await universes.createIfAbsent(otherV2);
    await points.setGlobalDiscoveryPoints(v1, 77n);
    await points.setGlobalDiscoveryPoints(v2, 125n);
  });

  afterEach(async () => {
    db.closeDatabase();
    await new Dexie(name, dependencies).delete();
  });

  it('normaliza el código sin aceptar formatos arbitrarios', () => {
    expect(normalizeRedemptionCode(`  ${TEST_PD_CODE.toLowerCase()}  `)).toBe(TEST_PD_CODE);
    expect(normalizeRedemptionCode('A0C0-not-hex-2710')).toBeNull();
    expect(TEST_PD_AMOUNT).toBe(10_000n);
  });

  it('añade 10000 PD a V2 una vez y conserva el contador de PD ganados', async () => {
    expect(await runtime.redeem(v2, TEST_PD_CODE.toLowerCase())).toEqual({
      kind: 'awarded', amount: 10_000n, balance: 10_125n,
    });
    expect(await points.getGlobalDiscoveryPoints(v2)).toBe(10_125n);
    expect(await points.getLifetimeEarnedGlobalDiscoveryPoints(v2)).toBeGreaterThanOrEqual(10_000n);
    expect(await runtime.redeem(v2, TEST_PD_CODE)).toEqual({ kind: 'already-redeemed' });
    expect(await points.getGlobalDiscoveryPoints(v2)).toBe(10_125n);
    expect(await points.getGlobalDiscoveryPoints(v1)).toBe(77n);
  });

  it('mantiene el canje tras cerrar y reabrir IndexedDB; no altera otro universo V2', async () => {
    await runtime.redeem(v2, TEST_PD_CODE);
    db.closeDatabase();
    const reopened = new GenesisIndexedDb(name, dependencies);
    try {
      const second = new DexieCodesRedemptionRuntime(reopened);
      expect(await second.redeem(v2, TEST_PD_CODE)).toEqual({ kind: 'already-redeemed' });
      expect(await second.redeem(otherV2, TEST_PD_CODE)).toEqual({
        kind: 'awarded', amount: 10_000n, balance: 10_000n,
      });
      expect(await new DexieDiscoveryPointsRepository(reopened).getGlobalDiscoveryPoints(v2)).toBe(10_125n);
    } finally {
      reopened.closeDatabase();
    }
  });

  it('no deja canjear en V1, ni códigos desconocidos, ni universos inexistentes', async () => {
    expect(await runtime.redeem(v1, TEST_PD_CODE)).toEqual({ kind: 'unsupported-version' });
    expect(await runtime.redeem(v2, 'B10C-0000-0000-0001')).toEqual({ kind: 'invalid-code' });
    expect(await runtime.redeem(v2, 'B10C-0000-0000-000B')).toEqual({ kind: 'invalid-code' });
    expect(await runtime.redeem(v2, 'no hexadecimal')).toEqual({ kind: 'invalid-code' });
    const absent = new UniverseGenerationKey(
      UniverseSeed.parse('C0DE-0000-0000-0000-0000-0000-0000-9999'), GeneratorVersion.V2,
    );
    await expect(runtime.redeem(absent, TEST_PD_CODE)).rejects.toThrow('no está guardado');
    expect(await points.getGlobalDiscoveryPoints(v1)).toBe(77n);
    expect(await points.getGlobalDiscoveryPoints(v2)).toBe(125n);
  });


  it('los nueve códigos desbloquean realmente 2×2..10×10 una vez por universo, sin añadir PD', async () => {
    expect(SECTOR_BLOCK_CODES).toHaveLength(9);
    expect(await runtime.getMaxSectorBlockSize(v2)).toBe(1);
    for (const { code, size } of SECTOR_BLOCK_CODES) {
      expect(await runtime.redeem(v2, code.toLowerCase())).toEqual({ kind: 'unlocked', size });
      expect(await runtime.getMaxSectorBlockSize(v2)).toBe(size);
      expect(await runtime.redeem(v2, code)).toEqual({ kind: 'already-redeemed' });
    }
    expect(SECTOR_BLOCK_CODES[8].code).toBe('B10C-0000-0000-000A');
    expect(await points.getGlobalDiscoveryPoints(v2)).toBe(125n);
    expect(await runtime.getMaxSectorBlockSize(v1)).toBe(1);
    expect(await runtime.getMaxSectorBlockSize(otherV2)).toBe(1);
    expect(await runtime.redeem(v1, SECTOR_BLOCK_CODES[0].code)).toEqual({ kind: 'unsupported-version' });
  });

  it('un desbloqueo superior da acceso a tamaños inferiores y persiste tras recargar', async () => {
    expect(await runtime.redeem(v2, SECTOR_BLOCK_CODES[8].code)).toEqual({ kind: 'unlocked', size: 10 });
    expect(await runtime.getMaxSectorBlockSize(v2)).toBe(10);
    db.closeDatabase();
    const reopened = new GenesisIndexedDb(name, dependencies);
    try {
      const next = new DexieCodesRedemptionRuntime(reopened);
      expect(await next.getMaxSectorBlockSize(v2)).toBe(10);
      expect(await next.getMaxSectorBlockSize(otherV2)).toBe(1);
      expect(await next.redeem(v2, SECTOR_BLOCK_CODES[8].code)).toEqual({ kind: 'already-redeemed' });
    } finally { reopened.closeDatabase(); }
  });

  it('canje simultáneo y escritura fallida no duplican ni dejan desbloqueos huérfanos', async () => {
    const code = SECTOR_BLOCK_CODES[0].code;
    const results = await Promise.all([runtime.redeem(v2, code), runtime.redeem(v2, code)]);
    expect(results.filter(result => result.kind === 'unlocked')).toHaveLength(1);
    expect(results.filter(result => result.kind === 'already-redeemed')).toHaveLength(1);
    const next = SECTOR_BLOCK_CODES[1].code;
    const spy = vi.spyOn(db.metadata, 'add').mockRejectedValueOnce(new Error('disk failure'));
    await expect(runtime.redeem(v2, next)).rejects.toThrow('disk failure');
    spy.mockRestore();
    expect(await runtime.getMaxSectorBlockSize(v2)).toBe(2);
    expect(await runtime.redeem(v2, next)).toEqual({ kind: 'unlocked', size: 3 });
  });
  it('dos canjes simultáneos no duplican la recompensa', async () => {
    const results = await Promise.all([
      runtime.redeem(v2, TEST_PD_CODE),
      runtime.redeem(v2, TEST_PD_CODE),
    ]);
    expect(results.filter(result => result.kind === 'awarded')).toHaveLength(1);
    expect(results.filter(result => result.kind === 'already-redeemed')).toHaveLength(1);
    expect(await points.getGlobalDiscoveryPoints(v2)).toBe(10_125n);
  });

  it('un error de escritura deshace tanto el premio como el registro del canje', async () => {
    const spy = vi.spyOn(db.metadata, 'add').mockRejectedValue(new Error('simulated disk failure'));
    await expect(runtime.redeem(v2, TEST_PD_CODE)).rejects.toThrow('simulated disk failure');
    expect(await points.getGlobalDiscoveryPoints(v2)).toBe(125n);
    spy.mockRestore();
    // Follow-up retry succeeds: there is no orphan receipt from the rolled-back transaction.
    expect(await runtime.redeem(v2, TEST_PD_CODE)).toMatchObject({ kind: 'awarded' });
  });
});
