#!/usr/bin/env node
'use strict';
/** VIDA.0 - deterministic, check-before-delete pruning of retired biology. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const manifest = require('./vida0-archivos-a-eliminar.json');
const action = process.argv[2];
if (!['--check', '--apply'].includes(action) || process.argv.length !== 3) {
  console.error('Uso: node scripts/aplicar-genesis-vida0-limpieza.cjs --check | --apply');
  process.exit(2);
}
const packageData = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
if (packageData.name !== 'genesis-web') {
  throw new Error('VIDA.0: ejecuta el script desde un proyecto genesis-web.');
}
let present = 0;
let alreadyAbsent = 0;
const mismatches = [];
const paths = [];
for (const {path: rel, sha256} of manifest) {
  if (typeof rel !== 'string' || !/^(src\/app\/|scripts\/|docs\/)/.test(rel) ||
      rel.includes('..') || rel.includes('\\') || !/^[0-9a-f]{64}$/.test(sha256)) {
    throw new Error(`VIDA.0: entrada no segura: ${JSON.stringify(rel)}`);
  }
  const absolute = path.resolve(root, rel);
  if (absolute === root || !absolute.startsWith(root + path.sep)) throw new Error('Ruta exterior al proyecto');
  if (!fs.existsSync(absolute)) { alreadyAbsent++; continue; }
  const entry = fs.lstatSync(absolute);
  if (!entry.isFile()) { mismatches.push(`${rel}: no es un archivo normal`); continue; }
  const actual = crypto.createHash('sha256').update(fs.readFileSync(absolute)).digest('hex');
  if (actual !== sha256) { mismatches.push(`${rel}: hash distinto; podría haber cambios posteriores`); continue; }
  present++;
  paths.push(absolute);
}
if (mismatches.length) {
  console.error('VIDA.0: no se eliminó nada. Archivos que requieren revisión:');
  mismatches.forEach(x => console.error('  ' + x));
  process.exit(1);
}
if (action === '--apply') {
  for (const filename of paths) fs.unlinkSync(filename);
  // Remove only newly empty directories, without crossing the application roots.
  const bounds = [path.join(root, 'src', 'app'),path.join(root,'scripts'),path.join(root,'docs')];
  for (const filename of paths) {
    let dir = path.dirname(filename);
    while (bounds.some(bound => dir.startsWith(bound + path.sep))) {
      if (!fs.existsSync(dir) || fs.readdirSync(dir).length) break;
      fs.rmdirSync(dir);
      dir = path.dirname(dir);
    }
  }
}
console.log(`VIDA.0 ${action}: archivos previstos ${manifest.length}, ` +
  `coincidentes ${present}, ausentes ${alreadyAbsent}, eliminados ${action === '--apply' ? present : 0}.`);
console.log(action === '--check' ? 'Solo verificación: no se ha eliminado nada.' : 'Limpieza aplicada. No genera ni modifica ninguna partida.');
