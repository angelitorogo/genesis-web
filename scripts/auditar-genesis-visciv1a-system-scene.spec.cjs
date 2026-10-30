const fs = require('fs');
const path = require('path');

const root = process.cwd();
function mustContain(file, parts) {
  const absolute = path.join(root, file);
  if (!fs.existsSync(absolute)) throw new Error(`Falta ${file}`);
  const text = fs.readFileSync(absolute, 'utf8');
  for (const part of parts) {
    if (!text.includes(part)) throw new Error(`No se encontró "${part}" en ${file}`);
  }
}

mustContain('src/app/presentation/system/system.ts', [
  'SystemSceneCivilizationVisualsDataSource',
  'decorateSystemSceneSnapshotWithCivilizationTiers',
  'refreshSystemSceneCivilizationVisuals',
]);

mustContain('src/app/presentation/system/system-scene-civilization-visuals.data-source.ts', [
  'extractConfirmedCivilization',
  'ensureVida9PlanetsInBackground',
  'bodyIndex: record.identity.bodyIndex.toString()',
]);

mustContain('src/app/presentation/system/system-scene-civilization-visuals.ts', [
  'decorateSystemSceneSnapshotWithCivilizationTiers',
  'bodyIndexForPlanet',
  'scientificPlanetBindings',
]);

mustContain('src/app/presentation/system/system-scene-snapshot.ts', [
  'visualCivilizationTier?: Vida7CivilizationTier | null;',
]);

mustContain('src/app/presentation/system/system-scene-civilization-visuals.spec.ts', [
  'VISCIV.1a system-scene civilization visuals',
  'VERY_ADVANCED',
]);

console.log('VISCIV.1a system-scene audit passed');
