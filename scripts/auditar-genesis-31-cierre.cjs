'use strict';
/**
 * GENESIS 31.F — auditoría estática conservadora de las integraciones reales.
 * Una llamada detectada es evidencia de cableado, NO certifica física ni E2E.
 * No altera la simulación, BD, estado observado ni la hoja de ruta.
 */
const fs = require('node:fs');
const path = require('node:path');

const EXPECTED = [
  'habitability-engine.ts',
  'habitability-environment-resolver-31-2.ts',
  'habitability-resources-resolver-31-3.ts',
  'habitability-radiation-resolver-31-4.ts',
  'habitability-stability-resolver-31-5.ts',
  'habitability-indices-resolver-31-6.ts',
  'habitability-historical-windows-resolver-31-7.ts',
  'habitability-continuity-resolver-31-8.ts',
  'habitability-evolutionary-stability-resolver-31-9.ts',
  'habitability-moon-resolver-31-10.ts',
  'habitability-alternative-routes-resolver-31-11.ts',
  'habitability-knowledge-resolver-31-12.ts',
];
const HISTORY = ['planetary-history-engine.ts', 'planetary-history-interval-engine-32-12.ts'];

function sources(root) {
  const files = [];
  if (!fs.existsSync(root)) return files;
  const queue = [root];
  while (queue.length) {
    const dir = queue.shift();
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist') continue;
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) queue.push(file);
      else if (/\.(ts|html)$/.test(file) && !/\.spec\.ts$/.test(file) &&
          !/habitability-phase-closeout-31-f/.test(file)) files.push(file);
    }
  }
  return files;
}

/**
 * Ignore comments and strings; neither an unused import, a quote nor a test
 * fixture should count as a live call. Preserve whitespace to avoid joining
 * identifiers that were separated by a stripped comment.
 */
function withoutNonExecutableText(text) {
  return text.replace(/\/\*[\s\S]*?\*\/|\/\/[^\r\n]*|`(?:\\[\s\S]|[^`])*`|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g,
    match => ' '.repeat(match.length));
}
function methodCall(text, type, methods) {
  const names = methods.map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  return new RegExp(`\\b${type}\\s*\\.\\s*(?:${names})\\s*\\(`).test(text);
}
function analyze(file, root) {
  return { file: path.relative(root, file).replaceAll(path.sep, '/'),
    code: withoutNonExecutableText(fs.readFileSync(file, 'utf8')) };
}
function auditProject(root) {
  root = path.resolve(root);
  const src = path.join(root, 'src', 'app');
  const present = path.join(src, 'presentation');
  const habit = path.join(src, 'simulation', 'habitability');
  const history = path.join(src, 'simulation', 'planetary-history');
  const missing = EXPECTED.filter(name => !fs.existsSync(path.join(habit, name)))
    .concat(HISTORY.filter(name => !fs.existsSync(path.join(history, name))));

  const runtime = sources(src).map(file => analyze(file, root))
    .filter(({ file }) => !file.startsWith('src/app/domain/') &&
      !file.startsWith('src/app/simulation/habitability/'));
  const presentation = sources(present).map(file => analyze(file, root));
  const historicalProducers = sources(src).map(file => analyze(file, root))
    .filter(({ file }) => !file.startsWith('src/app/domain/') &&
      !file.endsWith('habitability-historical-windows-resolver-31-7.ts'));

  // 31.2–31.5: four actual invocations in a production assembly (not four
  // symbol references in unrelated files). The inspector remains static.
  const physicalStages = [
    ['HabitabilityEnvironmentResolver31_2', ['assessPlanet', 'assessMoon']],
    ['HabitabilityResourcesResolver31_3', ['assessPlanet', 'assessMoon', 'assessPlanetFromSources', 'assessMoonFromSources']],
    ['HabitabilityRadiationResolver31_4', ['assessPlanet', 'assessMoon']],
    ['HabitabilityStabilityResolver31_5', ['assessPlanet', 'assessMoon']],
  ];
  const physical = runtime.filter(({ code }) =>
    physicalStages.every(([type, methods]) => methodCall(code, type, methods)))
    .map(({ file }) => file).sort();

  // A bare import of HistoricalEnvironmentSource31_7 is NOT a real producer.
  // A factory/typed object must provide both functions; runtime integration
  // must still be tested separately against actual dated physical sources.
  const temporal = historicalProducers.filter(({ code }) =>
    /\bHistoricalEnvironmentSource31_7\b/.test(code) &&
    (/\bimplements\s+HistoricalEnvironmentSource31_7\b/.test(code) ||
      /:\s*HistoricalEnvironmentSource31_7\s*=/.test(code) ||
      /\bsatisfies\s+HistoricalEnvironmentSource31_7\b/.test(code)) &&
    /\brevision\s*[:(]/.test(code) && /\breadInterval\s*[:(]/.test(code))
    .map(({ file }) => file).sort();

  const consumers = runtime.filter(({ code }) =>
    methodCall(code, 'HabitabilityHistoricalWindowsResolver31_7', ['reconstruct']))
    .map(({ file }) => file).sort();
  const observed = presentation.filter(({ code }) =>
    methodCall(code, 'HabitabilityKnowledgeResolver31_12', ['projectObserved']))
    .map(({ file }) => file).sort();

  const checks = [
    { id: 'CONTRATOS_31_Y_32_12',
      status: missing.length === 0 ? 'PRESENTE' : 'FALTAN_ARCHIVOS', detail: missing,
      needed: 'Resolver los archivos de contratos antes de auditar integraciones.' },
    { id: 'ENSAMBLAJE_FISICO_EN_USO_REAL',
      status: physical.length ? 'LLAMADAS_DETECTADAS' : 'SIN_REFERENCIAS', detail: physical,
      needed: 'Conectar 31.2→31.3→31.4→31.5 a estados físicos ya generados, sin regeneración ni fuga de Ground Truth.' },
    { id: 'FUENTE_TEMPORAL_REAL_31_7',
      status: temporal.length ? 'PRODUCTOR_DECLARADO' : 'SIN_REFERENCIAS', detail: temporal,
      needed: 'Suministrar trayectorias físicas fechadas y respaldadas, no episodios aislados o condiciones actuales extrapoladas.' },
    { id: 'RECONSTRUCCION_HISTORICA_EN_USO',
      status: consumers.length ? 'LLAMADAS_DETECTADAS' : 'SIN_REFERENCIAS', detail: consumers,
      needed: 'Consumir intervalos de 32.12 con 31.7 y fuente física real; comprobar 31.8/31.9 y lagunas.' },
    { id: 'PROYECCION_OBSERVADA_EN_FICHAS',
      status: observed.length ? 'LLAMADAS_DETECTADAS' : 'SIN_REFERENCIAS', detail: observed,
      needed: 'Usar projectObserved 31.12 en fichas autorizadas, sin publicar evaluaciones internas.' },
  ];
  const pending = checks.filter(c => c.status === 'SIN_REFERENCIAS');
  return {
    version: '31.F-audit-v2', root, checks,
    status: missing.length ? 'CONTRATOS_INCOMPLETOS' : 'REVISION_FUNCIONAL_REQUERIDA',
    functionalClosureCertified: false,
    unresolvedIntegrations: pending.map(c => c.id),
    warning: 'Las llamadas estaticas no certifican exactitud fisica, trayectorias fechadas, ni permisos observacionales. El cierre requiere tests reales/E2E de integracion.',
  };
}
function main(argv) {
  const flags = argv.filter(arg => arg.startsWith('--'));
  const nonFlags = argv.filter(arg => !arg.startsWith('--'));
  const root = path.resolve(nonFlags[0] || process.cwd());
  const result = auditProject(root);
  if (flags.includes('--json')) process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  else {
    console.log(`GENESIS — Auditoria de cierre 31.F (${result.status})`);
    for (const check of result.checks) {
      console.log(`  ${check.id}: ${check.status}`);
      for (const detail of check.detail) console.log(`    - ${detail}`);
      if (check.status === 'SIN_REFERENCIAS') console.log(`    Falta: ${check.needed}`);
    }
    console.log('\n' + result.warning);
  }
  if (result.status === 'CONTRATOS_INCOMPLETOS') process.exitCode = 2;
  else if (flags.includes('--strict') && result.unresolvedIntegrations.length) process.exitCode = 1;
}
if (require.main === module) main(process.argv.slice(2));
module.exports = { auditProject, withoutNonExecutableText };
