import { InjectionToken } from '@angular/core';
import { type UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { GenesisIndexedDb } from '../../data/local/indexed-db/genesis-indexed-db';
import { GENESIS_INDEXED_DB_SCHEMA_VERSION, GENESIS_STORAGE_FORMAT_VERSION } from '../../data/local/indexed-db/genesis-indexed-db-schema';
import { DexieDiscoveryPointsRepository } from '../../data/local/repository/dexie-discovery-points.repository';
import { codesReceiptKey, sectorBlockSizeForCode, SECTOR_BLOCK_CODES } from './sector-block-codes';

/** 0x2710 = 10 000. Public, local testing code; NOT a secret or a server-side entitlement. */
export const TEST_PD_CODE = 'A0C0-0000-0000-2710';
export const TEST_PD_AMOUNT = 10_000n;
const SIGNED_LONG_MAX = (1n << 63n) - 1n;
const CODE_PATTERN = /^[0-9A-F]{4}(?:-[0-9A-F]{4}){3}$/;

export type CodeRedemptionResult =
  | { readonly kind: 'awarded'; readonly balance: bigint; readonly amount: bigint }
  | { readonly kind: 'unlocked'; readonly size: number }
  | { readonly kind: 'already-redeemed' }
  | { readonly kind: 'invalid-code' }
  | { readonly kind: 'unsupported-version' };

export function normalizeRedemptionCode(value: string): string | null {
  const normalized = value.trim().toUpperCase();
  return CODE_PATTERN.test(normalized) ? normalized : null;
}

/** A redemption receipt and the PD balance are committed in ONE IndexedDB transaction. */
export class DexieCodesRedemptionRuntime {
  private readonly points: DexieDiscoveryPointsRepository;

  constructor(private readonly database: GenesisIndexedDb) {
    this.points = new DexieDiscoveryPointsRepository(database);
  }

  async redeem(generationKey: UniverseGenerationKey, rawCode: string): Promise<CodeRedemptionResult> {
    const code = normalizeRedemptionCode(rawCode);
    const blockSize = code === null ? null : sectorBlockSizeForCode(code);
    if (code === null || (code !== TEST_PD_CODE && blockSize === null)) {
      return { kind: 'invalid-code' };
    }
    // The feature is for V2 testing only; never mutate an existing V1 save.
    if (generationKey.generatorVersionCode !== 2) {
      return { kind: 'unsupported-version' };
    }
    await this.database.openDatabase();
    const seed = generationKey.universeSeed.serialize();
    const receiptKey = codesReceiptKey(seed, generationKey.generatorVersionCode, code);

    return this.database.transaction(
      'rw',
      this.database.universes,
      this.database.progress,
      this.database.metadata,
      async (): Promise<CodeRedemptionResult> => {
        const universe = await this.database.universes.get([seed, generationKey.generatorVersionCode]);
        if (universe === undefined) {
          throw new Error('El universo seleccionado no está guardado.');
        }
        const receipt = await this.database.metadata.get(receiptKey);
        if (receipt !== undefined) {
          return { kind: 'already-redeemed' };
        }
        if (blockSize !== null) {
          await this.database.metadata.add({
            key: receiptKey,
            schemaVersion: GENESIS_INDEXED_DB_SCHEMA_VERSION,
            storageFormatVersion: GENESIS_STORAGE_FORMAT_VERSION,
            updatedAtEpochMs: Date.now(),
          });
          return { kind: 'unlocked', size: blockSize };
        }
        const balance = await this.points.getGlobalDiscoveryPoints(generationKey);
        if (balance > SIGNED_LONG_MAX - TEST_PD_AMOUNT) {
          throw new RangeError('Los PD superarían el límite permitido.');
        }
        const updated = balance + TEST_PD_AMOUNT;
        await this.points.setGlobalDiscoveryPoints(generationKey, updated);
        await this.database.metadata.add({
          key: receiptKey,
          schemaVersion: GENESIS_INDEXED_DB_SCHEMA_VERSION,
          storageFormatVersion: GENESIS_STORAGE_FORMAT_VERSION,
          updatedAtEpochMs: Date.now(),
        });
        return { kind: 'awarded', balance: updated, amount: TEST_PD_AMOUNT };
      },
    );
  }

  /** Read only persisted receipts for this precise (seed, version) universe. */
  async getMaxSectorBlockSize(generationKey: UniverseGenerationKey): Promise<number> {
    if (generationKey.generatorVersionCode !== 2) return 1;
    await this.database.openDatabase();
    const seed = generationKey.universeSeed.serialize();
    if (await this.database.universes.get([seed, generationKey.generatorVersionCode]) === undefined) {
      return 1;
    }
    // One read-only snapshot; never grant an upgrade merely because the code exists in source.
    return this.database.transaction('r', this.database.metadata, async () => {
      let max = 1;
      for (const item of SECTOR_BLOCK_CODES) {
        const key = codesReceiptKey(seed, generationKey.generatorVersionCode, item.code);
        if (await this.database.metadata.get(key) !== undefined) max = item.size;
      }
      return max;
    });
  }
}

export const CODES_REDEMPTION_RUNTIME = new InjectionToken<DexieCodesRedemptionRuntime>(
  'CODES_REDEMPTION_RUNTIME',
  {
    providedIn: 'root',
    factory: () => new DexieCodesRedemptionRuntime(new GenesisIndexedDb()),
  },
);
