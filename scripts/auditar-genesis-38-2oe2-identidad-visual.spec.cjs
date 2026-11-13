'use strict';
/** Auditoría CT-0 portable. Por defecto examina una población sintética con
 * pigmentación/talla idénticas. --catalog=archivo.json permite el censo real. */
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const assert = require('node:assert/strict');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const base = path.join(root, 'src/app/presentation/life-species-visual');
const loaded = new Map();
function loadTs(file) {
  const filename = path.resolve(file);
  if (loaded.has(filename)) return loaded.get(filename).exports;
  const code = fs.readFileSync(filename, 'utf8');
  const result = ts.transpileModule(code, {
    fileName: filename,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, strict: true },
    reportDiagnostics: true,
  });
  const errors = (result.diagnostics || []).filter(d => d.category === ts.DiagnosticCategory.Error);
  assert.equal(errors.length, 0, `Errores TS en ${path.basename(filename)}: ${errors.map(e => ts.flattenDiagnosticMessageText(e.messageText, ' ')).join('; ')}`);
  const mod = new Module(filename, module);
  mod.filename = filename;
  mod.paths = Module._nodeModulePaths(path.dirname(filename));
  loaded.set(filename, mod);
  const originalRequire = mod.require.bind(mod);
  mod.require = (request) => request.startsWith('./') && fs.existsSync(path.resolve(path.dirname(filename), `${request}.ts`))
    ? loadTs(path.resolve(path.dirname(filename), `${request}.ts`))
    : originalRequire(request);
  mod._compile(result.outputText, filename);
  return mod.exports;
}
const { auditVida38ReptilianIdentity38OE2, auditVida38ReptilianPreparedPlans38OE2, deriveVida38ReptilianVisualPlan38OE2 } = loadTs(path.join(base, 'vida38-civilized-reptilian-identity-38-2oe2.ts'));
const inputArg = process.argv.find(arg => arg.startsWith('--catalog='));
const outputArg = process.argv.find(arg => arg.startsWith('--out='));
const sizeArg = process.argv.find(arg => arg.startsWith('--count='));
const amount = sizeArg ? Number(sizeArg.split('=')[1]) : 10000;
if (!Number.isInteger(amount) || amount < 2 || amount > 100000) throw new Error('--count debe estar entre 2 y 100000');
let source = 'SYNTHETIC_SAME_PIGMENT_AND_BODY_LENGTH';
let inputs;
if (inputArg) {
  const filename = path.resolve(process.cwd(), inputArg.slice('--catalog='.length));
  const content = JSON.parse(fs.readFileSync(filename, 'utf8'));
  if (!Array.isArray(content)) throw new Error('El catálogo debe ser un array JSON de especies');
  inputs = content.map((entry, i) => {
    if (typeof entry.speciesId !== 'string' || !entry.speciesId || typeof entry.appearanceFingerprint !== 'string')
      throw new Error(`Entrada ${i}: falta speciesId o appearanceFingerprint`);
    return entry;
  });
  source = `CATALOG_JSON:${filename}`;
} else {
  inputs = Array.from({length:amount}, (_,i) => ({
    speciesId:`V3/reptilian/civilized/${i}`,appearanceFingerprint:`CT0:appearance:${i}`,
    primaryColorHex:'#719d91',secondaryColorHex:'#9aafb0',bodyLengthMeters:2.2,
  }));
}
const result = auditVida38ReptilianIdentity38OE2(inputs, {maxSamplePairs:20});
const summary = { source, ...result };
const repeat = deriveVida38ReptilianVisualPlan38OE2(inputs[0]);
assert.deepEqual(repeat, deriveVida38ReptilianVisualPlan38OE2(inputs[0]));
const force = auditVida38ReptilianPreparedPlans38OE2([
  {input:inputs[0],plan:repeat},
  {input:{...inputs[0],speciesId:'TEST_FORCED_COLLISION_DIFFERENT_SPECIES'},plan:repeat},
]);
assert.equal(force.exactDuplicatePairs,1,'La auditoría debe detectar una colisión provocada deliberadamente');
if (outputArg) {
  const outfile = path.resolve(process.cwd(), outputArg.slice('--out='.length));
  fs.mkdirSync(path.dirname(outfile), {recursive:true});
  fs.writeFileSync(outfile, JSON.stringify(summary, null, 2)+'\n');
}
console.log(`GENESIS_38_2OE2_AUDIT_${result.exactAuditPassed ? 'OK' : 'FAIL'}: fuente=${source}; individuos=${result.population}; firmas=${result.distinctVisualPlans}; colisiones_exactas=${result.exactDuplicatePairs}; parejas_parecidas=${result.nearDuplicatePairs}; familias=${result.distribution.profiles}; indumentarias=${result.distribution.garmentLines}; culturas=${result.distribution.cultures}`);
if (result.nearDuplicatePairs > 0) console.log(`ADVERTENCIA_SEMEJANZA: ${result.nearDuplicatePairs} parejas bajo distancia paramétrica ${result.nearDistanceThreshold}. Examinar ${outputArg?'JSON de salida':'muestra'}; NO se garantiza distinción perceptual.`);
assert.equal(result.uniqueSourceIds, inputs.length, 'SpeciesId duplicados en el censo');
assert.equal(result.exactDuplicatePairs, 0, `Colisiones visuales exactas: ${result.exactDuplicatePairs}`);
assert.equal(result.exactAuditPassed, true);
if (!inputArg) {
  assert.equal(result.distribution.profiles, 10);
  assert.equal(result.distribution.garmentLines, 6);
  assert.equal(result.distribution.cultures, 6);
}
