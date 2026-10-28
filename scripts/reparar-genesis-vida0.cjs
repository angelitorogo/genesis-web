#!/usr/bin/env node
'use strict';
/** VIDA.0 recovery: overlay V7 files first, then remove obsolete 33.F sources with hash checks. */
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const project = path.resolve(__dirname, '..');
const arg = process.argv.slice(2);
if (arg.length !== 1 || !['--check','--apply'].includes(arg[0])) {
  console.error('Uso: node scripts/reparar-genesis-vida0.cjs --check | --apply');
  process.exit(2);
}
const read = p => fs.readFileSync(path.join(project,p),'utf8');
const srcSchema = 'src/app/data/local/indexed-db/genesis-indexed-db-schema.ts';
const srcMigration = 'src/app/data/local/indexed-db/genesis-indexed-db-migrations.ts';
const projectName = JSON.parse(read('package.json')).name;
if (projectName !== 'genesis-web') throw new Error('Ejecuta VIDA.0 desde la raiz de genesis-web');
const schema = read(srcSchema);
const migrations = read(srcMigration);
const must = [
 [schema,/export const GENESIS_INDEXED_DB_SCHEMA_VERSION_V7\s*=\s*7\s*;/,'version V7'],
 [schema,/export const GENESIS_INDEXED_DB_V7_STORES\s*=\s*Object\.freeze\(/,'stores V7'],
 [schema,/privateBiospheres:\s*null/,'baja privateBiospheres'],
 [schema,/privateBiosphereAudits:\s*null/,'baja privateBiosphereAudits'],
 [migrations,/GENESIS_INDEXED_DB_SCHEMA_VERSION_V7/,'import version V7'],
 [migrations,/GENESIS_INDEXED_DB_V7_STORES/,'import stores V7'],
 [migrations,/migrateGenesisIndexedDbV6ToV7/,'migracion V6 V7'],
];
const absent = must.filter(([txt,re])=>!re.test(txt)).map(([, , label])=>label);
if (absent.length) {
 console.error('VIDA.0: archivos de esquema/migracion desincronizados: '+absent.join(', '));
 console.error('Vuelve a expandir el ZIP de reparacion antes de ejecutar este comando.');
 process.exit(1);
}
// The installer only removes files on its fixed SHA-256 allowlist; rejects modified files.
const installer = path.join(__dirname, 'aplicar-genesis-vida0-limpieza.cjs');
const result = spawnSync(process.execPath,[installer,arg[0]],{cwd:project,encoding:'utf8'});
if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status || 1);
const deletedList = require('./vida0-archivos-a-eliminar.json');
const remnant = deletedList.filter(({path:p})=>fs.existsSync(path.join(project,p)));
const obsoleteImports = [];
const missingImports = [];
const app = path.join(project,'src','app');
function walk(dir) {
 for(const entry of fs.readdirSync(dir,{withFileTypes:true})) {
  const abs=path.join(dir,entry.name);
  if(entry.isDirectory()) walk(abs);
  else if(entry.isFile() && /\.tsx?$/.test(entry.name)) {
   const code = fs.readFileSync(abs,'utf8');
   // Local TypeScript relative imports, not non-code assets.
   const rx=/(?:from\s*|import\s*\(|import\s*)['"](\.{1,2}\/[^'"]+)['"]/g;
   for(const match of code.matchAll(rx)) {
    const spec=match[1];
    if(!spec) continue;
    const target=path.resolve(path.dirname(abs),spec);
    if(![target,target+'.ts',target+'.tsx',path.join(target,'index.ts')].some(p=>fs.existsSync(p))) {
     missingImports.push(path.relative(project,abs).replace(/\\/g,'/')+' => '+spec);
    }
    if(/(?:biology\/|biosphere-v3-|dexie-native-biosphere)/.test(spec)) {
     obsoleteImports.push(path.relative(project,abs).replace(/\\/g,'/')+' => '+spec);
    }
   }
  }
 }
}
walk(app);
console.log('VIDA.0 comprobacion final: archivos obsoletos restantes='+remnant.length+', imports locales rotos='+missingImports.length+', imports de biologia retirada='+obsoleteImports.length);
if (remnant.length || missingImports.length || obsoleteImports.length) {
 [...remnant.map(x=>x.path),...missingImports,...obsoleteImports].slice(0,30).forEach(x=>console.error('  '+x));
 console.error('VIDA.0 no queda validada. No generes nueva partida.');
 process.exit(1);
}
if (arg[0]==='--check') console.log('VIDA.0: comprobacion limpia; no se han modificado archivos.');
else console.log('VIDA.0 reparacion OK: codigo 33.F eliminado, esquema V7 sincronizado; IndexedDB no tocada.');
