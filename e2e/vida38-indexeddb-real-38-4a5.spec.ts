/**
 * GENESIS 38.4a5 — Test de persistencia real del contrato visual en IndexedDB.
 * Usa un origen de navegador aislado y Dexie instalado en el proyecto.
 * IMPORTANTE: esta primera prueba NO pasa por los repositorios productivos VIDA.6/9:
 * la certificación de esos repositorios exige conocer su esquema y registros válidos.
 */
import { test, expect } from '@playwright/test';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { VIDA6_REVISION } from '../src/app/domain/life/vida6-ecosystems-species';
import { VIDA7_REVISION } from '../src/app/domain/life/vida7-intelligence-civilizations';
import { VIDA9_REVISION } from '../src/app/domain/life/vida9-biology-exploration';
import {
  vida38SpeciesVisualContractFromConfirmedV1,
  type Vida38ConfirmedBiologySource,
} from '../src/app/presentation/life-species-visual/vida38-species-visual-contract';

const TEST_ORIGIN = 'https://genesis-vida38-4a5.test';
const DEXIE_SCRIPT = resolve(process.cwd(), 'node_modules/dexie/dist/dexie.js');

function confirmedRecord(): Vida38ConfirmedBiologySource {
  return {
    revision: VIDA9_REVISION, epoch: 'CT-0', bodyStorageKey: 'CT0-38-4A5-BODY',
    ecosystem: {
      revision: VIDA6_REVISION, bodyStorageKey: 'CT0-38-4A5-BODY',
      digest: 'CT0-38-4A5-ECO',
      species: [{
        id: 'vida6:ct0-38-4a5', proceduralName: 'Especie certificación',
        group: 'REPTILES', habitat: 'SURFACE_OPEN_TERRAIN', nutrition: 'PREDATOR',
        niche: 'SURFACE_OPEN_TERRAIN/PREDATOR', adaptations: ['THERMAL_TOLERANCE'],
        phenotype: {
          bodyPlan: 'TETRAPOD', covering: 'SCALES', locomotion: 'WALKING',
          bodyLengthMeters: 1.9, primaryColorHex: '#597C62', secondaryColorHex: '#B5A680',
          pattern: 'BANDS', appendagePairs: 2, bioluminescent: false,
        },
      }],
    },
    intelligence: {
      revision: VIDA7_REVISION, ecosystemDigest: 'CT0-38-4A5-ECO',
      intelligentSpecies: null, civilization: null,
    },
  } as unknown as Vida38ConfirmedBiologySource;
}

function contract(record: Vida38ConfirmedBiologySource) {
  const value = vida38SpeciesVisualContractFromConfirmedV1(record, record.ecosystem.species[0]!.id);
  expect(value, 'El mapper real debe aceptar el registro VIDA CT-0').not.toBeNull();
  return value!;
}

test('38.4a5 — Dexie/IndexedDB real: guardar, recargar origen y restaurar contrato visual', async ({ page }) => {
  expect(existsSync(DEXIE_SCRIPT), 'Dexie instalado; se necesita node_modules/dexie/dist/dexie.js').toBe(true);
  await page.route(`${TEST_ORIGIN}/**`, async route => route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>38.4a5 isolated IndexedDB</title>' }));
  await page.goto(`${TEST_ORIGIN}/isolated`);
  await page.addScriptTag({ path: DEXIE_SCRIPT });
  const before = confirmedRecord();
  const beforeVisual = contract(before);
  const name = `GENESIS_38_4A5_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  try {
    await page.evaluate(async ({ dbName, payload }) => {
      const Dexie = (window as any).Dexie;
      if (!Dexie) throw new Error('No se pudo cargar Dexie en el navegador');
      const db = new Dexie(dbName);
      db.version(1).stores({ vida9: 'bodyStorageKey' });
      await db.open();
      await db.table('vida9').put(payload);
      await db.close();
    }, { dbName: name, payload: before });
    // La recarga elimina los objetos JS: la lectura proviene de IndexedDB persistido.
    await page.reload();
    await page.addScriptTag({ path: DEXIE_SCRIPT });
    const recovered = await page.evaluate(async dbName => {
      const Dexie = (window as any).Dexie;
      const db = new Dexie(dbName);
      db.version(1).stores({ vida9: 'bodyStorageKey' });
      await db.open();
      const value = await db.table('vida9').get('CT0-38-4A5-BODY');
      await db.close();
      return value;
    }, name) as Vida38ConfirmedBiologySource | undefined;
    expect(recovered, 'Debe recuperar un registro existente desde IndexedDB').toBeDefined();
    expect(recovered!.ecosystem.species[0]!.id).toBe(before.ecosystem.species[0]!.id);
    const afterVisual = contract(recovered!);
    expect(afterVisual.speciesId).toBe(beforeVisual.speciesId);
    expect(afterVisual.variantSeedUint32).toBe(beforeVisual.variantSeedUint32);
    expect(afterVisual.appearanceFingerprint).toBe(beforeVisual.appearanceFingerprint);
    expect(afterVisual).toEqual(beforeVisual);
  } finally {
    await page.evaluate(async dbName => {
      const Dexie = (window as any).Dexie;
      if (Dexie) await Dexie.delete(dbName);
    }, name);
  }
});
