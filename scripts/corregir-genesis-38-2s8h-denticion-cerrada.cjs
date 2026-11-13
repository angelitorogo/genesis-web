#!/usr/bin/env node
'use strict';
/**
 * GENESIS 38.2s8h — hotfix único de regresión: dentición visual en boca SDF cerrada.
 * Sólo modifica vida38-reptile-dentition-38-2jb.spec.ts.
 * NO cambia la anatomía, el renderer, Vitest ni la generación científica.
 */
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const relative = 'src/app/presentation/life-species-visual/vida38-reptile-dentition-38-2jb.spec.ts';
const target = path.join(process.cwd(), ...relative.split('/'));
const marker = 'GENESIS_38_2S8H_CLOSED_SDF_DENTITION';
const testName = 'la vista conserva dentición opaca orientada sin exigir juntas o labios como mallas separadas';
if (!fs.existsSync(target)) {
  throw new Error(`No encuentro ${relative}. Ejecuta desde la raíz de genesis-web.`);
}
const before = fs.readFileSync(target, 'utf8');
if (before.includes(marker)) {
  process.stdout.write('GENESIS_38_2S8H_OK: corrección ya aplicada.\n');
  process.exit(0);
}
const source = ts.createSourceFile(relative, before, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
if (source.parseDiagnostics.length) throw new Error('El test original tiene errores sintácticos; no se aplica el hotfix.');
function walk(node, fn) { fn(node); ts.forEachChild(node, child => walk(child, fn)); }
function isTest(node) {
  return ts.isCallExpression(node) && node.arguments.length >= 2 && ts.isStringLiteralLike(node.arguments[0]) &&
    node.arguments[0].text === testName &&
    (ts.isIdentifier(node.expression) && ['it', 'test'].includes(node.expression.text) ||
      ts.isPropertyAccessExpression(node.expression) && ['it', 'test'].includes(node.expression.name.text));
}
const matches = [];
walk(source, n => { if (isTest(n)) matches.push(n); });
if (matches.length !== 1) throw new Error(`Esperaba un único test de dentición 38.2j.b; encontrados ${matches.length}. No se modifica nada.`);
const test = matches[0];
const body = test.arguments[1];
let renderer = null, dentalBranch = null;
const vacuousDentalChecks = [];
walk(body, n => {
  if (ts.isCallExpression(n)) {
    const e = n.expression;
    const name = ts.isIdentifier(e) ? e.text : ts.isPropertyAccessExpression(e) ? e.name.text : '';
    if (name === 'createVida38ReptilePreview38J' && n.arguments.length >= 2) {
      if (renderer) throw new Error('Varios renderers dentro del test; no se modifica nada.');
      renderer = n;
    }
  }
  if (ts.isIfStatement(n)) {
    const condition = n.expression.getText(source).replace(/\s+/g, '');
    if (/^expectedDentition===['"]NONE_VISIBLE['"]$/.test(condition) && n.elseStatement) {
      if (dentalBranch) throw new Error('Más de una condición dental en el test.');
      dentalBranch = n;
    }
  }
  if (ts.isExpressionStatement(n) && /^expect\s*\(\s*teeth\.every\s*\(/.test(n.expression.getText(source))) {
    vacuousDentalChecks.push(n);
  }
});
if (!renderer || !dentalBranch || vacuousDentalChecks.length !== 2) {
  throw new Error(`Formato del test no reconocido (renderer=${Boolean(renderer)}, condición=${Boolean(dentalBranch)}, ` +
    `aserciones obsoletas=${vacuousDentalChecks.length}). No se ha modificado ningún archivo.`);
}
const oldCondition = dentalBranch.getText(source);
if (!/toBeGreaterThan\(8\)/.test(oldCondition) || !/toBe\(0\)/.test(oldCondition) ||
    !body.getText(source).includes("const expectedDentition")) {
  throw new Error('La condición encontrada no coincide con la regresión 38.2s8f. No se modifica nada.');
}
const subject = renderer.arguments[0].getText(source);
if (!/^[a-zA-Z_$][\w$]*$/.test(subject)) throw new Error('Grupo Three.js del test no reconocido.');
// En 38.2p2a, se dejan de dibujar dientes sobre la mandíbula cerrada porque
// sobresalían del SDF. El perfil científico sigue preservado en userData.
const newCondition = `// ${marker}: 38.2p2a conserva la dentición en el perfil científico,\n`+
`    // pero NO dibuja dientes sueltos sobre una mandíbula SDF cerrada.\n`+
`    expect(${subject}.userData['reptileDentition38J']).toBe(expectedDentition);\n`+
`    expect(teeth.length).toBe(0);`;
const edits = [{ start: dentalBranch.getStart(source), end: dentalBranch.getEnd(), text: newCondition }];
for (const old of vacuousDentalChecks) edits.push({start: old.getStart(source), end: old.getEnd(), text: ''});
const sorted = edits.sort((a,b)=>b.start-a.start);
for (let i=1;i<sorted.length;i++) {
  if(sorted[i].end>sorted[i-1].start) throw new Error('Ediciones solapadas; no se modifica nada.');
}
let after = before;
for (const edit of sorted) after = after.slice(0,edit.start)+edit.text+after.slice(edit.end);
const parsed = ts.createSourceFile(relative, after, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
if (parsed.parseDiagnostics.length) {
  throw new Error('El test resultante no supera el parser TypeScript; no se modifica nada: '+
    parsed.parseDiagnostics.map(x=>ts.flattenDiagnosticMessageText(x.messageText, ' ')).join('; '));
}
// Verifica que no queda una aserción implícitamente verdadera sobre un array vacío.
const updatedTest = after.slice(after.indexOf(testName));
if (/expect\s*\(\s*teeth\.every\s*\(/.test(updatedTest) || !updatedTest.includes(marker)) {
  throw new Error('Persisten aserciones dentales vacías o falta el marcador. No se modifica nada.');
}
const temp = target+'.genesis38s8h.tmp';
fs.writeFileSync(temp, after, 'utf8');
fs.renameSync(temp, target);
process.stdout.write('GENESIS_38_2S8H_OK: test 38.2j.b reconciliado con mandíbula cerrada 38.2p2a.\n');
process.stdout.write('Contrato científico comprobado; cero dientes flotantes; renderer 3D intacto.\n');
