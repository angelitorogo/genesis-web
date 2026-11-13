#!/usr/bin/env node
/**
 * GENESIS Web 38.2s8g: corrige exclusivamente TS2300 en el test de dentición.
 * Preserva el import combinado de vida38-reptile-morphology-38-2j, sin tocar
 * código de producción ni sus aserciones. Repetible y sin efectos secundarios.
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const file = path.resolve(process.cwd(), 'src/app/presentation/life-species-visual/vida38-reptile-dentition-38-2jb.spec.ts');
if (!fs.existsSync(file)) {
  process.stderr.write(`GENESIS_38_2S8G_ERROR: no existe ${file}. Ejecuta desde la raíz del proyecto.\n`);
  process.exitCode = 1;
} else {
  const before = fs.readFileSync(file, 'utf8');
  const modulePath = './vida38-reptile-morphology-38-2j';
  const importPattern = /^import[ \t]*\{([^}]*)\}[ \t]*from[ \t]*['"]\.\/vida38-reptile-morphology-38-2j['"][ \t]*;[ \t]*(?:\r?\n|$)/gm;
  const matches = [...before.matchAll(importPattern)];
  const countNamed = matches.filter(m => m[1].split(',').some(token => token.trim() === 'deriveVida38ReptileMorphology38J')).length;
  if (countNamed <= 1) {
    process.stdout.write(`GENESIS_38_2S8G_OK: sin imports duplicados (${countNamed} importación).\n`);
  } else {
    const isolated = matches.filter(m => m[1].trim() === 'deriveVida38ReptileMorphology38J');
    const combined = matches.filter(m => m[1].split(',').some(token => token.trim() === 'deriveVida38ReptileMorphology38J') && m[1].trim() !== 'deriveVida38ReptileMorphology38J');
    if (combined.length === 0 || isolated.length !== countNamed - 1) {
      process.stderr.write('GENESIS_38_2S8G_ERROR: imports inesperados. No se modifica el archivo.\n');
      process.exitCode = 1;
    } else {
      let after = before;
      for (const m of isolated) after = after.replace(m[0], '');
      const remaining = [...after.matchAll(importPattern)].filter(m => m[1].split(',').some(token => token.trim() === 'deriveVida38ReptileMorphology38J'));
      if (remaining.length !== 1) {
        process.stderr.write('GENESIS_38_2S8G_ERROR: la verificación posterior no pasa. No se modifica el archivo.\n');
        process.exitCode = 1;
      } else {
        const tmp = `${file}.38s8g.tmp`;
        fs.writeFileSync(tmp, after, 'utf8');
        fs.renameSync(tmp, file);
        process.stdout.write(`GENESIS_38_2S8G_OK: eliminadas ${isolated.length} importaciones redundantes; se mantiene la importación combinada.\n`);
      }
    }
  }
}
