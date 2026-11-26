/** STARCAT.1c: auditoría de regresión del fixture de ordenación estelar.
 * Ejecutar desde la raíz del repositorio GENESIS Web.
 * Esta auditoría no reemplaza la compilación Angular ni Vitest.
 */
const fs=require('node:fs');
const assert=require('node:assert/strict');
const path=require('node:path');
const rel='src/app/presentation/genesis-archive/38-bis/genesis-universal-archive-starcat1.spec.ts';
const content=fs.readFileSync(path.resolve(process.cwd(),rel),'utf8');
const checks=[
  ['Importa el tipo completo de fila',()=>assert.match(content,/type UniversalArchiveRow38Bis/)],
  ['Declara el fixture con tipado real',()=>assert.match(content,/const row:UniversalArchiveRow38Bis\s*=\s*\{/)],
  ['Mantiene la categoría Estrellas',()=>assert.match(content,/category:'stars'/)],
  ['Incluye identidad compuesta persistida',()=>assert.match(content,/id:JSON\.stringify\(\[scope,'stars'/)],
  ['Incluye ámbito y galaxia',()=>assert.match(content,/scope,category:'stars',galaxyIndex:'0'/)],
  ['Incluye los campos de denominación',()=>assert.match(content,/sortTitle:'paedoria a',title:'Paedoria A',subtitle:''/)],
  ['Incluye acciones',()=>assert.match(content,/actions:\[\]/)],
  ['Conserva valores científicos no redondeados',()=>assert.match(content,/radius:0\.0090123456,temperature:12500\.5/)],
  ['Comprueba radio físico sin redondeo',()=>assert.match(content,/\)\.toBe\(0\.0090123456\)/)],
  ['Comprueba temperatura sin redondeo',()=>assert.match(content,/\)\.toBe\(12500\.5\)/)],
  ['No fuerza conversión insegura de la fila',()=>assert.doesNotMatch(content,/row\s+as\s+(?:Parameters|unknown|UniversalArchiveRow38Bis)/)],
  ['Conserva el test de migración',()=>assert.match(content,/enqueueMissingStarsStarcat1\(\)/)],
  ['Conserva test de confirmación',()=>assert.match(content,/archiveDirtyCategories38BisB6\(kind\)/)],
];
for(const [label,check] of checks){check();process.stdout.write('OK '+label+'\n');}
console.log(`STARCAT.1c: ${checks.length}/${checks.length} comprobaciones superadas`);
