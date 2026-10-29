'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const sourcePath = path.resolve(__dirname, '../src/app/presentation/runtime/vida9-background-materializer.ts');
const source = fs.readFileSync(sourcePath, 'utf8');
const file = ts.createSourceFile(sourcePath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
function nodes(predicate) {
  const matches = [];
  function visit(node) { if (predicate(node)) matches.push(node); ts.forEachChild(node, visit); }
  visit(file);
  return matches;
}
function property(obj, key) {
  return obj.properties.find(p => ts.isPropertyAssignment(p) && p.name.getText(file) === key);
}
test('VIDA.9 carga el bundle del Worker como módulo ES, no como script clásico', () => {
  const workers = nodes(node => ts.isNewExpression(node) && node.expression.getText(file) === 'Worker');
  assert.equal(workers.length, 1);
  const worker = workers[0];
  assert.equal(worker.arguments.length, 2);
  const [url, opts] = worker.arguments;
  assert(ts.isNewExpression(url));
  assert.equal(url.expression.getText(file), 'URL');
  assert.match(url.arguments[0].getText(file), /vida9-background-materializer\.worker/);
  assert(ts.isObjectLiteralExpression(opts));
  const type = property(opts, 'type');
  assert(type);
  assert.equal(type.initializer.text, 'module');
});
test('el error de carga libera las tareas pendientes y permite reiniciar el Worker', () => {
  assert.match(source, /instance\.addEventListener\('error'/);
  assert.match(source, /waiting\.reject\(/);
  assert.match(source, /inFlight\.clear\(\);started\.clear\(\);worker=null;instance\.terminate\(\)/);
  assert.match(source, /\},\(\)=>\{started\.delete\(id\);\}\)/);
});
test('no cambia la generación VIDA.9 ni el índice observado', () => {
  const diagnostics = ts.transpileModule(source, {
    fileName: 'vida9-background-materializer.ts', reportDiagnostics: true,
    compilerOptions: {target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext},
  }).diagnostics || [];
  assert.deepEqual(diagnostics.map(d => ts.flattenDiagnosticMessageText(d.messageText, '\n')), []);
});
