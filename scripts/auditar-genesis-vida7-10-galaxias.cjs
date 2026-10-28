#!/usr/bin/env node
'use strict';
/** GENESIS VIDA.7 — censo procedural, read-only, por defecto G1–G10. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const ts = require('typescript');
if (!require.extensions['.ts']) require.extensions['.ts'] = (module, filename) => {
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    fileName: filename,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      experimentalDecorators: true,
      useDefineForClassFields: false,
    },
  });
  module._compile(compiled.outputText, filename);
};
const root = path.resolve(__dirname, '..', 'src', 'app');
const scriptRevision = 'VIDA.7/auditoria-multigalaxia/v1';
const modules = [
  'domain/universe/universe-seed.ts',
  'domain/generation/universe-generation-key.ts',
  'domain/generation/generator-version.ts',
  'simulation/universe/galaxy-generator.ts',
  'simulation/sector/galaxy-sector-grid-generator.ts',
  'simulation/sector/galaxy-sector-content-generator.ts',
  'domain/sector/galaxy-sector-coordinates.ts',
  'domain/generation/procedural-locator.ts',
  'presentation/runtime/vida9-v3-confirmed-physical-targets.ts',
  'simulation/life/life-plausibility-physical-adapter-vida2.ts',
  'simulation/life/procedural-microbial-life-vida3.ts',
  'simulation/life/procedural-ecology-vida4.ts',
  'simulation/life/vida5a-ecology-atmosphere.ts',
  'simulation/life/vida5b-ecological-maturation.ts',
  'simulation/life/vida5c-advanced-biospheres.ts',
  'simulation/life/vida6-ecosystems-species.ts',
  'simulation/life/vida7-intelligence-civilizations.ts',
];
const load = name => require(path.join(root, name));
const { UniverseSeed } = load('domain/universe/universe-seed.ts');
const { UniverseGenerationKey } = load('domain/generation/universe-generation-key.ts');
const { GeneratorVersion } = load('domain/generation/generator-version.ts');
const { GalaxyGenerator } = load('simulation/universe/galaxy-generator.ts');
const { GalaxySectorGridGenerator } = load('simulation/sector/galaxy-sector-grid-generator.ts');
const { GalaxySectorContentGenerator } = load('simulation/sector/galaxy-sector-content-generator.ts');
const { GalaxySectorCoordinates } = load('domain/sector/galaxy-sector-coordinates.ts');
const { BodyLocator } = load('domain/generation/procedural-locator.ts');
const { vida9V3ConfirmedPhysicalTargets } = load('presentation/runtime/vida9-v3-confirmed-physical-targets.ts');
const { Vida2PhysicalInput } = load('simulation/life/life-plausibility-physical-adapter-vida2.ts');
const { ProceduralMicrobialLifeVIDA3 } = load('simulation/life/procedural-microbial-life-vida3.ts');
const { ProceduralEcologyVIDA4 } = load('simulation/life/procedural-ecology-vida4.ts');
const { Vida5aEcologyAtmosphere } = load('simulation/life/vida5a-ecology-atmosphere.ts');
const { Vida5bEcologicalMaturation } = load('simulation/life/vida5b-ecological-maturation.ts');
const { Vida5cAdvancedBiospheres } = load('simulation/life/vida5c-advanced-biospheres.ts');
const { Vida6EcosystemsSpecies } = load('simulation/life/vida6-ecosystems-species.ts');
const { Vida7IntelligenceCivilizations } = load('simulation/life/vida7-intelligence-civilizations.ts');

const SEED = '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5';
const options = {
  start: 1,
  count: 10,
  limitSystems: Infinity,
  outDir: path.resolve('auditoria-vida7-10-galaxias'),
  seed: SEED,
  resume: true,
};
for (const arg of process.argv.slice(2)) {
  if (arg === '--no-resume') options.resume = false;
  else if (arg === '--help') {
    console.log('Uso: node scripts/auditar-genesis-vida7-10-galaxias.cjs [--start=1] [--count=10] [--limit-systems=N] [--out-dir=CARPETA] [--seed=SEMILLA] [--no-resume]');
    process.exit(0);
  } else if (arg.startsWith('--start=')) options.start = Number(arg.slice(8));
  else if (arg.startsWith('--count=')) options.count = Number(arg.slice(8));
  else if (arg.startsWith('--limit-systems=')) options.limitSystems = Number(arg.slice(16));
  else if (arg.startsWith('--out-dir=')) options.outDir = path.resolve(arg.slice(10));
  else if (arg.startsWith('--seed=')) options.seed = arg.slice(7);
  else throw Error(`Argumento desconocido: ${arg}`);
}
if (!Number.isSafeInteger(options.start) || options.start < 0 ||
    !Number.isSafeInteger(options.count) || options.count < 1 || options.count > 100 ||
    !Number.isSafeInteger(options.start + options.count) ||
    (options.limitSystems !== Infinity && (!Number.isSafeInteger(options.limitSystems) || options.limitSystems < 1))) {
  throw Error('Rango inválido: --start >= 0, --count entre 1 y 100, --limit-systems entero positivo');
}
const key = new UniverseGenerationKey(UniverseSeed.parse(options.seed), GeneratorVersion.V3);
const fingerprint = crypto.createHash('sha256');
fingerprint.update(scriptRevision + '\0' + options.seed + '\0');
fingerprint.update(fs.readFileSync(__filename));
for (const mod of modules) {
  fingerprint.update(mod + '\0');
  fingerprint.update(fs.readFileSync(path.join(root, mod)));
}
const sourceFingerprint = fingerprint.digest('hex');

const identityOf = locator => ({
  universeSeed: options.seed, generatorVersionCode: 3, kind: 'PLANET',
  galaxyIndex: String(locator.galaxyIndex), sectorKey: String(locator.sectorKey),
  galacticObjectIndex: String(locator.galacticObjectIndex),
  bodyIndex: String(locator.bodyIndex), moonIndex: null,
});
const hostKey = loc => `${loc.galaxyIndex}/${loc.sectorKey}/${loc.galacticObjectIndex}`;
const writeAtomic = (filepath, data) => {
  fs.mkdirSync(path.dirname(filepath), { recursive: true });
  const tmp = `${filepath}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, data, 'utf8');
  fs.renameSync(tmp, filepath);
};
const csv = value => {
  const s = value === null || value === undefined ? '' : String(value);
  return '"' + s.replaceAll('"', '""') + '"';
};

function auditOneGalaxy(index) {
  const galaxy = GalaxyGenerator.generate(key, BigInt(index));
  const grid = GalaxySectorGridGenerator.generate(galaxy);
  const half = grid.halfExtentInSectors;
  const expectedSectors = (half * 2 + 1) ** 2;
  const result = {
    revision: scriptRevision, sourceFingerprint, seed: options.seed,
    galaxyIndex: index, galaxyName: galaxy.designation.name, generatorVersion: 3,
    coverageMode: options.limitSystems === Infinity ? 'COMPLETO' : 'MUESTRA',
    sectorsExpected: expectedSectors, sectorsAnalyzed: 0, sectorsWithError: 0,
    systemsFound: 0, systemsWithoutPhysicalSource: 0, systemsWithError: 0,
    planetsProjected: 0, planetsNotEvaluable: 0, eligiblePlanets: 0,
    nativeIntelligences: 0, nativeCivilizations: 0,
    levels: { PRIMITIVE: 0, ADVANCED: 0, VERY_ADVANCED: 0 },
    civilizations: [], errorExamples: [],
  };
  const seen = new Set();
  const recordError = (body, error) => {
    result.planetsNotEvaluable++;
    if (result.errorExamples.length < 80)
      result.errorExamples.push({ body, error: String(error?.message ?? error) });
  };
  console.log(`\n[G${index}] ${result.galaxyName}. Sectores: ${expectedSectors}.`);
  outer: for (let x = -half; x <= half; x++) for (let y = -half; y <= half; y++) {
    result.sectorsAnalyzed++;
    let sector;
    try { sector = GalaxySectorContentGenerator.generate(galaxy, new GalaxySectorCoordinates(x, y)); }
    catch (e) {
      result.sectorsWithError++;
      if (result.errorExamples.length < 80)
        result.errorExamples.push({ sector: `${x}/${y}`, error: String(e?.message ?? e) });
      continue;
    }
    for (const loc of sector.systemLocators) {
      if (result.systemsFound >= options.limitSystems) break outer;
      const sid = hostKey(loc);
      if (seen.has(sid)) throw Error(`Sistema repetido en G${index}: ${sid}`);
      seen.add(sid);
      result.systemsFound++;
      try {
        const source = vida9V3ConfirmedPhysicalTargets(key, loc);
        if (!source) {
          result.systemsWithoutPhysicalSource++;
          continue;
        }
        for (let i = 0; i < source.planetCount; i++) {
          const body = new BodyLocator(loc.galaxyIndex, loc.sectorKey, loc.galacticObjectIndex, BigInt(i));
          const bid = `${sid}/${i}`;
          let target;
          try { target = source.resolvePlanet(body); }
          catch (e) { recordError(bid, e); continue; }
          if (!target) { recordError(bid, 'Sin modelo físico individual'); continue; }
          result.planetsProjected++;
          try {
            const id = identityOf(body);
            const microbial = ProceduralMicrobialLifeVIDA3.evaluate(id, Vida2PhysicalInput.planet(target));
            const ecology = ProceduralEcologyVIDA4.evaluate(microbial);
            const atmosphere = Vida5aEcologyAtmosphere.evaluate(ecology, target);
            const maturation = Vida5bEcologicalMaturation.evaluate(atmosphere);
            const advancedBiosphere = Vida5cAdvancedBiospheres.evaluate(microbial, ecology, maturation, target);
            const species = Vida6EcosystemsSpecies.evaluate(microbial, ecology, advancedBiosphere);
            const intelligence = Vida7IntelligenceCivilizations.evaluate(species, advancedBiosphere);
            if (intelligence.eligibility === 'ELIGIBLE') result.eligiblePlanets++;
            if (intelligence.intelligencePresent) result.nativeIntelligences++;
            if (!intelligence.civilizationPresent) continue;
            const c = intelligence.civilization;
            assert(c, `Civilización ausente en ${bid}`);
            if (!Object.hasOwn(result.levels, c.tier)) throw Error(`Nivel no reconocido: ${c.tier}`);
            const founder = species.species.find(s => s.id === c.founderSpeciesId);
            if (!founder) throw Error(`Especie fundadora inexistente en ${bid}`);
            const entry = {
              galaxyIndex: index, galaxyName: result.galaxyName,
              planet: target.identity.designation,
              system: target.identity.hostSystemDesignation,
              level: c.tier,
              founderSpecies: founder.proceduralName,
              lineage: c.lineage,
              locator: {
                galaxyIndex: id.galaxyIndex, sectorKey: id.sectorKey,
                galacticObjectIndex: id.galacticObjectIndex, bodyIndex: id.bodyIndex,
              },
              digestVIDA7: intelligence.digest,
            };
            result.nativeCivilizations++;
            result.levels[c.tier]++;
            result.civilizations.push(entry);
          } catch (e) { recordError(bid, e); }
        }
      } catch (e) {
        result.systemsWithError++;
        if (result.errorExamples.length < 80)
          result.errorExamples.push({ system: sid, error: String(e?.message ?? e) });
      }
      if (result.systemsFound % 250 === 0)
        console.log(`[G${index}] ${result.systemsFound} sistemas · ${result.planetsProjected} planetas · ${result.nativeCivilizations} civilizaciones · ${result.levels.VERY_ADVANCED} muy avanzadas`);
    }
  }
  result.civilizations.sort((a, b) => a.planet.localeCompare(b.planet, 'es'));
  assert.equal(result.nativeCivilizations, Object.values(result.levels).reduce((a, b) => a + b, 0), 'Recuento tecnológico incoherente');
  result.completeSectorCoverage = options.limitSystems === Infinity && result.sectorsAnalyzed === expectedSectors;
  result.verdict = !result.completeSectorCoverage ? 'MUESTRA_INCOMPLETA' :
    result.planetsNotEvaluable || result.systemsWithError || result.systemsWithoutPhysicalSource || result.sectorsWithError ? 'CENSO_CON_HUECOS' : 'CENSO_COMPLETO_SIN_ERRORES';
  return result;
}

function aggregate(done) {
  const totals = { systems: 0, planets: 0, notEvaluable: 0, systemsWithError: 0, sectorsWithError: 0, withoutPhysicalSource: 0,
    eligiblePlanets: 0, intelligences: 0, civilizations: 0,
    levels: { PRIMITIVE: 0, ADVANCED: 0, VERY_ADVANCED: 0 } };
  for (const g of done) {
    totals.systems += g.systemsFound;
    totals.planets += g.planetsProjected;
    totals.notEvaluable += g.planetsNotEvaluable;
    totals.systemsWithError += g.systemsWithError;
    totals.sectorsWithError += g.sectorsWithError;
    totals.withoutPhysicalSource += g.systemsWithoutPhysicalSource;
    totals.eligiblePlanets += g.eligiblePlanets;
    totals.intelligences += g.nativeIntelligences;
    totals.civilizations += g.nativeCivilizations;
    for (const tier of Object.keys(totals.levels)) totals.levels[tier] += g.levels[tier];
  }
  const veryAdvanced = done.flatMap(g => g.civilizations.filter(c => c.level === 'VERY_ADVANCED'));
  const combined = {
    revision: scriptRevision, seed: options.seed, sourceFingerprint,
    requestedGalaxies: Array.from({ length: options.count }, (_, i) => options.start + i),
    completedGalaxies: done.length, complete: done.length === options.count && done.every(g => g.completeSectorCoverage),
    totals, galaxies: done.map(g => ({ galaxyIndex: g.galaxyIndex, name: g.galaxyName,
      systems: g.systemsFound, planets: g.planetsProjected, civilizations: g.nativeCivilizations,
      levels: g.levels, verdict: g.verdict, nonEvaluable: g.planetsNotEvaluable,
      withoutPhysicalSource: g.systemsWithoutPhysicalSource, systemsWithError: g.systemsWithError, sectorsWithError: g.sectorsWithError })),
    veryAdvancedPlanets: veryAdvanced,
  };
  writeAtomic(path.join(options.outDir, 'resumen.json'), JSON.stringify(combined, null, 2) + '\n');
  const header = ['Galaxia','Nombre de galaxia','Planeta','Sistema','Nivel','Especie fundadora','Linaje','Sector','Objeto','Índice planetario','Digest VIDA.7'];
  const rows = done.flatMap(g => g.civilizations.map(c => [c.galaxyIndex,c.galaxyName,c.planet,c.system,c.level,c.founderSpecies,c.lineage,c.locator.sectorKey,c.locator.galacticObjectIndex,c.locator.bodyIndex,c.digestVIDA7]));
  writeAtomic(path.join(options.outDir, 'civilizaciones.csv'), '\uFEFF' + [header, ...rows].map(row => row.map(csv).join(',')).join('\n') + '\n');
  return combined;
}

fs.mkdirSync(options.outDir, { recursive: true });
console.log(`Auditoría multigaláctica VIDA.7 — galaxias G${options.start}–G${options.start + options.count - 1}.`);
console.log(`Semilla: ${options.seed}. Fuente V3. Sin escritura a IndexedDB.`);
console.log('Resultados parciales por galaxia; reanudación segura cuando coinciden semilla y huella de los módulos clave.');
const results = [];
for (let index = options.start; index < options.start + options.count; index++) {
  const filepath = path.join(options.outDir, `galaxia-G${index}.json`);
  let result = null;
  if (options.resume && fs.existsSync(filepath)) {
    const old = JSON.parse(fs.readFileSync(filepath, 'utf8'));
    if (old.revision === scriptRevision && old.seed === options.seed &&
        old.sourceFingerprint === sourceFingerprint && old.galaxyIndex === index &&
        old.coverageMode === (options.limitSystems === Infinity ? 'COMPLETO' : 'MUESTRA')) {
      result = old;
      console.log(`[G${index}] Resultado previo válido reutilizado: ${old.galaxyName}.`);
    } else {
      console.log(`[G${index}] La huella, semilla o modo cambió: se repite el censo.`);
    }
  }
  if (!result) {
    result = auditOneGalaxy(index);
    writeAtomic(filepath, JSON.stringify(result, null, 2) + '\n');
    console.log(`[G${index}] Censo guardado: ${result.nativeCivilizations} civilizaciones (${result.levels.PRIMITIVE}/${result.levels.ADVANCED}/${result.levels.VERY_ADVANCED}) · ${result.verdict}.`);
  }
  results.push(result);
  aggregate(results);
}
const final = aggregate(results);
console.log('\n=== RESULTADOS DE LAS GALAXIAS ADICIONALES ===');
for (const g of final.galaxies) {
  console.log(`G${g.galaxyIndex} ${g.name}: ${g.civilizations} civilizaciones; primitivas ${g.levels.PRIMITIVE}, avanzadas ${g.levels.ADVANCED}, muy avanzadas ${g.levels.VERY_ADVANCED}. [${g.verdict}]`);
}
console.log('\n=== PLANETAS CON CIVILIZACIONES MUY AVANZADAS ===');
if (!final.veryAdvancedPlanets.length) console.log('No se encontraron entre los cuerpos evaluados.');
for (const [i, c] of final.veryAdvancedPlanets.entries()) {
  console.log(`${i + 1}. G${c.galaxyIndex} ${c.galaxyName} · ${c.planet} · sistema ${c.system} · ${c.lineage} · ${c.founderSpecies}`);
}
console.log(`\nTOTAL ${final.completedGalaxies}/${options.count} galaxias: ${final.totals.civilizations} civilizaciones, ${final.totals.levels.VERY_ADVANCED} muy avanzadas, ${final.totals.planets} planetas proyectados.`);
console.log(`JSON: ${path.join(options.outDir, 'resumen.json')}\nCSV: ${path.join(options.outDir, 'civilizaciones.csv')}`);
if (!final.complete || final.galaxies.some(g => g.verdict !== 'CENSO_COMPLETO_SIN_ERRORES')) {
  console.log('ATENCIÓN: alguna galaxia tiene cobertura incompleta o huecos físicos; consultar los JSON individuales.');
}
