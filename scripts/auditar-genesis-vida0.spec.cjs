'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const manifest = require('./vida0-archivos-a-eliminar.json');

test('VIDA.0: todos los motores, pruebas y auditorías retirados fueron eliminados', () => {
  const remaining = manifest.map(entry => entry.path)
    .filter(rel => fs.existsSync(path.join(root, rel)));
  assert.deepEqual(remaining, [], `Ejecuta: node scripts/aplicar-genesis-vida0-limpieza.cjs --apply`);
});
test('VIDA.0: el catálogo público no programa abiogénesis privada', () => {
  const code = read('src/app/presentation/runtime/galaxy-planet-moon-catalog-snapshot.runtime.ts');
  assert.doesNotMatch(code, /BiosphereV3|schedulePrivateBiology|biologyQueue|biologyPending|privateBiospheres/);
  assert.match(code, /buildGalaxyPlanetMoonCatalogSnapshot/);
});
test('VIDA.0: repositorios de universo y backup no consumen motores 33.F', () => {
  for (const rel of [
    'src/app/presentation/runtime/genesis-local-repositories.ts',
    'src/app/data/local/repository/dexie-universe.repository.ts',
    'src/app/data/local/backup/dexie-genesis-backup.service.ts',
    'src/app/data/local/indexed-db/genesis-indexed-db.ts',
  ]) assert.doesNotMatch(read(rel), /privateBiosphere|DexieNativeBiosphereRepository/);
});
test('VIDA.0: IndexedDB V7 retira ambas tablas biológicas sin tocar universos/descubrimientos', () => {
  const code = read('src/app/data/local/indexed-db/genesis-indexed-db-schema.ts');
  assert.match(code, /GENESIS_INDEXED_DB_SCHEMA_VERSION_V7\s*=\s*7/);
  assert.match(code, /privateBiospheres:\s*null/);
  assert.match(code, /privateBiosphereAudits:\s*null/);
  assert.match(code, /\.\.\.GENESIS_INDEXED_DB_V4_STORES/);
  const migrations = read('src/app/data/local/indexed-db/genesis-indexed-db-migrations.ts');
  assert.match(migrations, /migrateGenesisIndexedDbV6ToV7/);
  assert.match(migrations, /migrateMetadataSchemaVersion/);
});
test('VIDA.0: respaldos futuros son V1 y la importación V2 retira solo biología', () => {
  const service = read('src/app/data/local/backup/dexie-genesis-backup.service.ts');
  assert.match(service, /formatVersion:\s*BackupFormatVersion\.V1\.code/);
  const validation = read('src/app/data/local/backup/genesis-backup-validator.ts');
  assert.match(validation, /formatVersion === BackupFormatVersion\.V2\.code/);
  assert.match(validation, /requireArray\(value\['privateBiospheres'\]/);
  assert.doesNotMatch(read('src/app/domain/backup/genesis-backup.ts'), /PrivateBiosphereBackupEntry/);
});
test('VIDA.0: mantiene intacta la conexión de la física y la estructura de catálogo', () => {
  const catalog = read('src/app/presentation/runtime/galaxy-planet-moon-catalog-snapshot.runtime.ts');
  assert.match(catalog, /CompactHostPlanetarySystemGenerator/);
  assert.match(catalog, /StellarMultihostFormation/);
  assert.match(catalog, /canonicalGalaxyKnownDiscoveries/);
});
