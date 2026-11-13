/**
 * GENESIS 38.4a5 — prueba de persistencia REAL, aislada, de VIDA.6 y VIDA.9.
 * Usa exactamente GenesisIndexedDb, las tablas V10 y los repositorios productivos.
 * No sustituye IndexedDB por JSON, spies ni un repositorio en memoria.
 * fake-indexeddb es una implementación de IndexedDB utilizada en tests.
 */
import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { GenesisIndexedDb } from '../indexed-db/genesis-indexed-db';
import { DexieVida6EcosystemsSpeciesRepository } from './dexie-vida6-ecosystems-species.repository';
import { DexieVida9BiologyExplorationRepository } from './dexie-vida9-biology-exploration.repository';
import { Vida9BiologyExploration } from '../../../simulation/life/vida9-biology-exploration';
import { vida9TestSources } from '../../../simulation/life/vida9-test-fixture';
import { vida9DigestForRecord } from '../../../domain/life/vida9-biology-exploration';
import type { Vida6Species } from '../../../domain/life/vida6-ecosystems-species';
import {
  vida38SpeciesVisualContractFromConfirmedV1,
} from '../../../presentation/life-species-visual/vida38-species-visual-contract';

const DATABASE_NAME = 'genesis-38-4a5-vida6-vida9-visual-identity-isolated';

type TestDatabase = GenesisIndexedDb;

/**
 * El fixture VIDA.9 existente está preparado para probar persistencia CT-0,
 * pero no garantiza una especie con fenotipo. Para verificar la proyección visual
 * añadimos un ejemplar de ensayo completo; recalculamos el digest VIDA.9 con
 * la función productiva, no inventamos un digest fijo.
 *
 * ATENCIÓN: el ejemplar es sintético. Esta prueba certifica la ruta
 * repositorios Dexie -> registro VIDA.9 -> mapper visual; no certifica que
 * VIDA.6 haya generado el ejemplar ni recalcula su digest científico VIDA.6.
 */
function buildCertifiedSource() {
  const { ecosystem, intelligence, colonization } = vida9TestSources();
  const generated = Vida9BiologyExploration.evaluate(ecosystem, intelligence, colonization);
  const fixtureSpecies: Vida6Species = {
    id: 'vida6:38-4a5-persistence-fixture',
    proceduralName: 'Especie de prueba de persistencia',
    group: 'REPTILES',
    habitat: 'SURFACE_OPEN_TERRAIN',
    nutrition: 'PREDATOR',
    niche: 'SURFACE_OPEN_TERRAIN/PREDATOR',
    adaptations: ['RESISTENCIA_TERMICA'],
    phenotype: {
      bodyPlan: 'TETRAPOD',
      covering: 'SCALES',
      locomotion: 'WALKING',
      bodyLengthMeters: 1.9,
      primaryColorHex: '#597C62',
      secondaryColorHex: '#B5A680',
      pattern: 'BANDS',
      appendagePairs: 2,
      bioluminescent: false,
    },
  };
  // Mantiene la identidad, revisiones, enlaces y digests de origen del fixture
  // oficial; únicamente amplía el inventario de especies para el contrato 38.1.
  const { digest: _oldDigest, ...content } = generated;
  const prepared = {
    ...content,
    ecosystem: {
      ...content.ecosystem,
      species: [...content.ecosystem.species, fixtureSpecies],
    },
  };
  const record = { ...prepared, digest: vida9DigestForRecord(prepared) };
  const visual = vida38SpeciesVisualContractFromConfirmedV1(record, fixtureSpecies.id);
  expect(visual, 'el ejemplar de ensayo debe ser aceptado por el mapper CT-0').not.toBeNull();
  return { record, speciesId: fixtureSpecies.id, visual: visual! };
}

describe('38.4a5 — persistencia real de VIDA.6/9 y visual CT-0', () => {
  let db: TestDatabase;
  const handles: TestDatabase[] = [];

  beforeEach(() => {
    db = new GenesisIndexedDb(DATABASE_NAME, { indexedDB, IDBKeyRange });
    handles.push(db);
  });

  afterEach(async () => {
    for (const handle of handles.splice(0)) handle.closeDatabase();
    // La eliminación afecta exclusivamente al nombre temporal de esta batería.
    await db.delete();
  });

  it('guarda por ambos repositorios, cierra, reabre y conserva identidad, semilla, fingerprint y contrato', async () => {
    const { record, speciesId, visual: before } = buildCertifiedSource();
    const repository6 = new DexieVida6EcosystemsSpeciesRepository(db);
    const repository9 = new DexieVida9BiologyExplorationRepository(db);

    expect(await repository6.ensure(record.ecosystem)).toEqual(record.ecosystem);
    expect(await repository9.ensure(record)).toEqual(record);
    expect(await db.privateBiologicalRecordsVIDA9.count()).toBe(1);

    const key6: [string, number, string] = [
      record.identity.universeSeed,
      record.identity.generatorVersionCode,
      `${record.ecosystem.revision}|${record.bodyStorageKey}`,
    ];
    expect(await db.privateEcologicalBiospheres.get(key6)).toBeDefined();
    expect(await db.privateBiologicalRecordsVIDA9.count()).toBe(1);

    db.closeDatabase();
    const reopened = new GenesisIndexedDb(DATABASE_NAME, { indexedDB, IDBKeyRange });
    handles.push(reopened);
    const recovered9 = new DexieVida9BiologyExplorationRepository(reopened);
    const restored = await recovered9.get(
      record.identity.universeSeed,
      record.identity.generatorVersionCode,
      record.bodyStorageKey,
    );
    expect(restored).toEqual(record);
    expect(restored?.ecosystem.species.map((species) => species.id))
      .toEqual(record.ecosystem.species.map((species) => species.id));

    // VIDA.6 carece de get(): ensure() recupera el previo sin reemplazarlo.
    const recovered6 = new DexieVida6EcosystemsSpeciesRepository(reopened);
    const ecosystemAfter = await recovered6.ensure(record.ecosystem);
    expect(ecosystemAfter).toEqual(record.ecosystem);
    expect(JSON.parse((await reopened.privateEcologicalBiospheres.get(key6))!.snapshotJson))
      .toEqual(record.ecosystem);

    const after = vida38SpeciesVisualContractFromConfirmedV1(restored, speciesId);
    expect(after).not.toBeNull();
    expect(after!.speciesId).toBe(speciesId);
    expect(after!.variantSeedUint32).toBe(before.variantSeedUint32);
    expect(after!.appearanceFingerprint).toBe(before.appearanceFingerprint);
    expect(after).toEqual(before);
  }, 30_000);

  it('conserva el CT-0 previo ante un segundo candidato de contenido diferente', async () => {
    const { record, speciesId, visual: initial } = buildCertifiedSource();
    const repository9 = new DexieVida9BiologyExplorationRepository(db);
    await repository9.ensure(record);

    const { digest: _originalDigest, ...content } = record;
    const modified = { ...content, nativeLifePresent: !record.nativeLifePresent };
    const alternate = { ...modified, digest: vida9DigestForRecord(modified) };
    expect(alternate.digest).not.toBe(record.digest);
    expect(await repository9.getOrInsertPreservingExisting(alternate)).toEqual(record);
    const persisted = await repository9.get(
      record.identity.universeSeed,
      record.identity.generatorVersionCode,
      record.bodyStorageKey,
    );
    expect(vida38SpeciesVisualContractFromConfirmedV1(persisted, speciesId)).toEqual(initial);
    expect(await db.privateBiologicalRecordsVIDA9.count()).toBe(1);
  }, 30_000);

  it('un payload almacenado alterado provoca error: no se reconstruye otra apariencia', async () => {
    const { record, speciesId } = buildCertifiedSource();
    const repository9 = new DexieVida9BiologyExplorationRepository(db);
    await repository9.ensure(record);
    const key: [string, number, string] = [
      record.identity.universeSeed,
      record.identity.generatorVersionCode,
      record.bodyStorageKey,
    ];
    const row = await db.privateBiologicalRecordsVIDA9.get(key);
    expect(row).toBeDefined();
    const corrupted = { ...record, nativeLifePresent: !record.nativeLifePresent };
    await db.privateBiologicalRecordsVIDA9.put({
      ...row!,
      payloadJson: JSON.stringify(corrupted),
    });
    await expect(repository9.get(...key)).rejects.toThrow('stored biological digest mismatch');
    expect(vida38SpeciesVisualContractFromConfirmedV1(record, speciesId)).not.toBeNull();
    // La lectura fallida no repara ni sobrescribe silenciosamente la fila dañada.
    expect((await db.privateBiologicalRecordsVIDA9.get(key))?.payloadJson)
      .toBe(JSON.stringify(corrupted));
  }, 30_000);
});
