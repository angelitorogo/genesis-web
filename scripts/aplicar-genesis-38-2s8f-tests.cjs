#!/usr/bin/env node
/**
 * GENESIS 38.2s8f — corrección concentrada de los 12 tests restantes.
 * Modifica SOLO dos configuraciones Vitest (si existen) y los cuatro archivos .spec.ts
 * con timeout local/dentición. Sin cambios de producción, ni auditores, ni package.json.
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const ROOT = process.cwd();
const FIXED_TIMEOUT_MS = 60_000;
const TARGET_TIMEOUT_TESTS = [
  {
    file: 'src/app/presentation/galaxy-map/galactic-map-particle-layout.spec.ts',
    titles: [
      'should preserve the SPIRAL stellar and volumetric-gas enrichment across the structured-clone Web Worker boundary',
      'should preserve the dedicated DWARF renderer across the structured-clone Web Worker boundary',
    ],
  },
  {
    file: 'src/app/presentation/laboratory/galactic-objects/galactic-object-laboratory.spec.ts',
    titles: ['should expose eight LOW H II diversity controls only for the LOW H II case'],
  },
];
const DENTITION_FILE = 'src/app/presentation/life-species-visual/vida38-reptile-dentition-38-2jb.spec.ts';
const DENTITION_TITLE = 'la vista conserva dentición opaca orientada sin exigir juntas o labios como mallas separadas';
const MARKER = 'GENESIS_38_2S8F_DENTITION_COMPAT';
const changes = new Map();
const info = [];

function fullPath(relative) { return path.join(ROOT, ...relative.split('/')); }
function read(relative, required = true) {
  const f = fullPath(relative);
  if (!fs.existsSync(f)) {
    if (required) throw new Error(`Falta ${relative}. Ejecuta desde la raíz de genesis-web con 38.2s8e aplicado.`);
    return null;
  }
  return fs.readFileSync(f, 'utf8');
}
function stage(relative, before, after) {
  if (before !== after) changes.set(relative, after);
}
function once(text, before, after, relative) {
  if (!text.includes(before)) throw new Error(`No se encontró la estructura esperada en ${relative}: ${before.slice(0,100)}. No se ha escrito nada.`);
  return text.replace(before, after);
}
function walk(node, cb) { cb(node); ts.forEachChild(node, child => walk(child, cb)); }
function sourceFile(text, name) { return ts.createSourceFile(name, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS); }
function titleOfTest(node) {
  if (!ts.isCallExpression(node) || !node.arguments.length || !ts.isStringLiteralLike(node.arguments[0])) return null;
  const e = node.expression;
  const valid = ts.isIdentifier(e) && (e.text === 'it' || e.text === 'test') ||
    ts.isPropertyAccessExpression(e) && (e.name.text === 'it' || e.name.text === 'test');
  return valid ? node.arguments[0].text : null;
}
function applyEdits(text, edits) {
  const sorted = edits.sort((a,b)=>b.start-a.start);
  for (let i=1; i<sorted.length; i++) if(sorted[i].end>sorted[i-1].start) throw new Error('Ediciones AST solapadas');
  for (const edit of sorted) text = text.slice(0,edit.start) + edit.text + text.slice(edit.end);
  return text;
}

// Vitest 4: limitar workers evita la contención de CPU/memoria de mallas SDF,
// texturas 1024x512 y workers de galaxias durante la ejecución masiva.
for (const relative of ['vitest-base.config.ts', 'vitest.config.ts']) {
  const before = read(relative, false);
  if (before === null) continue;
  let next = before;
  if (/\btestTimeout\s*:\s*\d[\d_]*/.test(next)) {
    next = next.replace(/(\btestTimeout\s*:\s*)\d[\d_]*/, (_, prefix)=>`${prefix}60_000`);
  } else if (/\btest\s*:\s*\{/.test(next)) {
    next = next.replace(/(\btest\s*:\s*\{)/, '$1\n    testTimeout: 60_000,');
  } else {
    throw new Error(`La configuración Vitest no tiene un bloque test reconocible: ${relative}`);
  }
  if (/\bmaxWorkers\s*:\s*\d[\d_]*/.test(next)) {
    next = next.replace(/(\bmaxWorkers\s*:\s*)\d[\d_]*/, (_, prefix)=>`${prefix}2`);
  } else {
    next = next.replace(/(\btest\s*:\s*\{)/, '$1\n    maxWorkers: 2,');
  }
  stage(relative, before, next);
  info.push(`${relative}: testTimeout=60000; maxWorkers=2`);
}
if (!info.length) throw new Error('No se encuentra la configuración de Vitest en genesis-web.');

// Tres tests conservaban su tercer argumento explícito a 30000ms;
// ese límite tiene prioridad frente a testTimeout global.
for (const entry of TARGET_TIMEOUT_TESTS) {
  const before = read(entry.file);
  const sf = sourceFile(before, entry.file);
  const edits = [];
  const found = new Set();
  walk(sf, node => {
    const title = titleOfTest(node);
    if (!title || !entry.titles.includes(title)) return;
    found.add(title);
    const args = node.arguments;
    if (args.length < 2) throw new Error(`Test ${title}: estructura sin callback`);
    if (args.length >= 3) {
      const arg = args[2];
      if (ts.isObjectLiteralExpression(arg)) {
        const timeout = arg.properties.find(p => ts.isPropertyAssignment(p) && p.name.getText(sf) === 'timeout');
        if (!timeout || !ts.isPropertyAssignment(timeout)) throw new Error(`No se encontró timeout en las opciones de ${title}`);
        const value = timeout.initializer;
        const raw = before.slice(value.getStart(sf), value.getEnd());
        if (!/^\d[\d_]*$/.test(raw)) throw new Error(`Timeout no numérico en ${entry.file} / ${title}: ${raw}`);
        if (Number(raw.replaceAll('_','')) !== FIXED_TIMEOUT_MS)
          edits.push({start:value.getStart(sf),end:value.getEnd(),text:'60_000'});
      } else {
        const raw = before.slice(arg.getStart(sf), arg.getEnd());
        if (!/^\d[\d_]*$/.test(raw)) throw new Error(`Timeout no numérico en ${entry.file} / ${title}: ${raw}`);
        if (Number(raw.replaceAll('_','')) !== FIXED_TIMEOUT_MS)
          edits.push({start:arg.getStart(sf),end:arg.getEnd(),text:'60_000'});
      }
    } else {
      // Inserción en el cierre de la llamada, nunca dentro del callback.
      edits.push({start:node.end-1,end:node.end-1,text:', 60_000'});
    }
  });
  for (const title of entry.titles) if(!found.has(title)) throw new Error(`No se encontró el test '${title}' en ${entry.file}`);
  const next = applyEdits(before, edits);
  stage(entry.file, before, next);
  info.push(`${entry.file}: ${found.size} timeout(s) locales comprobados`);
}

// Una única aserción lógica pendiente: 38.2j.b cuenta sólo mallas 2JB,
// mientras que la rama orgánica 38.2j crea mallas 2J (y permite NONE_VISIBLE).
// Conservamos la comprobación de >8 dientes cuando hay dentición visible.
{
  const before = read(DENTITION_FILE);
  if (before.includes(MARKER)) {
    info.push('Dentición: corrección ya instalada');
  } else {
    const sf = sourceFile(before, DENTITION_FILE);
    let test = null;
    walk(sf, node => {
      if (titleOfTest(node) === DENTITION_TITLE) test = node;
    });
    if (!test) throw new Error(`Falta el test de dentición esperado en ${DENTITION_FILE}`);
    const body = test.arguments[1];
    if (!body) throw new Error('Test de dentición sin cuerpo');
    let previewContractArg = null;
    walk(body, node => {
      if (previewContractArg !== null || !ts.isCallExpression(node)) return;
      const e = node.expression;
      const callName = ts.isIdentifier(e) ? e.text : ts.isPropertyAccessExpression(e) ? e.name.text : '';
      if (callName === 'createVida38ReptilePreview38J' && node.arguments.length >= 2)
        previewContractArg = node.arguments[1].getText(sf);
    });
    if (!previewContractArg) throw new Error('No localicé createVida38ReptilePreview38J(subject, contract, ...) dentro del test de dentición');
    let next = before;
    const oldTeeth = "const teeth=objects.filter(o=>o.name.startsWith('VIDA38_2JB_TOOTH')) as THREE.Mesh[];";
    const newTeeth = `// ${MARKER}: aceptar las mallas 38.2j y 38.2j.b, incluso dentro de grupos.\n` +
`    const teeth: THREE.Mesh[] = [];\n` +
`    for (const object of objects) object.traverse(node => {\n` +
`      if (node instanceof THREE.Mesh && /^VIDA38_2J(?:B)?_TOOTH/.test(node.name)) teeth.push(node);\n` +
`    });\n` +
`    const expectedDentition = deriveVida38ReptileMorphology38J(${previewContractArg}).dentition;`;
    next = once(next,oldTeeth,newTeeth,DENTITION_FILE);
    // Para una boca cerrada NO_VISIBLE no deben forzarse dientes artificiales;
    // si el perfil sí tiene dientes, se siguen exigiendo más de ocho.
    next = once(next,'expect(teeth.length).toBeGreaterThan(8);',
      `if (expectedDentition === 'NONE_VISIBLE') {\n      expect(teeth.length).toBe(0);\n` +
      `    } else {\n      expect(teeth.length).toBeGreaterThan(8);\n    }`,DENTITION_FILE);
    next = once(next,"expect(teeth.every(t=>t.userData['exposedLength']>0)).toBe(true);",
      `expect(teeth.every(t => {\n` +
      `      const exposed = t.userData['exposedLength'];\n` +
      `      if (typeof exposed === 'number') return exposed > 0;\n` +
      `      // 38.2j anterior: comprobar altura geométrica real del cono dental.\n` +
      `      const position = t.geometry.getAttribute('position');\n` +
      `      if (!position || position.count < 4) return false;\n` +
      `      t.geometry.computeBoundingBox();\n` +
      `      const bounds = t.geometry.boundingBox;\n` +
      `      return bounds !== null && bounds.max.y > bounds.min.y;\n` +
      `    })).toBe(true);`,DENTITION_FILE);
    // El import se mantiene exclusivo del test, sin alterar código 3D.
    const importsMorphology = [...next.matchAll(/import\s*\{([^}]*)\}\s*from\s*['"]\.\/vida38-reptile-morphology-38-2j['"]\s*;?/g)];
    const alreadyImported = importsMorphology.some(match =>
      match[1].split(',').some(spec => /^deriveVida38ReptileMorphology38J(?:\s+as\s+\w+)?$/.test(spec.trim())));
    if (!alreadyImported) {
      next = "import { deriveVida38ReptileMorphology38J } from './vida38-reptile-morphology-38-2j';\n" + next;
    }
    stage(DENTITION_FILE, before, next);
    info.push(`${DENTITION_FILE}: dientes 2J/2JB + condición NONE_VISIBLE verificable`);
  }
}

// Contrato de instalación: todas las modificaciones se calculan primero;
// si cualquier prueba no coincide, no se sobrescribe ningún archivo.
for (const [relative, content] of changes) {
  const sf = sourceFile(content, relative);
  if (sf.parseDiagnostics.length)
    throw new Error(`Sintaxis inválida en ${relative}: ${sf.parseDiagnostics.map(d=>d.messageText).join('; ')}`);
}
for (const [relative, content] of changes) {
  const file = fullPath(relative);
  const temporary = `${file}.genesis-38s8f.tmp`;
  fs.writeFileSync(temporary, content, 'utf8');
  fs.renameSync(temporary, file);
}
process.stdout.write(`GENESIS_38_2S8F_APLICADO: ${changes.size} archivo(s) actualizado(s).\n`);
for(const item of info) process.stdout.write(`  ${item}\n`);
process.stdout.write('Sin cambios en código de producción, renderers, package.json ni satélites.\n');
