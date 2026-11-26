// STARCAT.1b — Contrato de traducción pública, sin migrar IndexedDB.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const base=path.resolve(__dirname,'..');
function read(p){return fs.readFileSync(path.join(base,p),'utf8')}
const lang=read('src/app/presentation/galaxy-knowledge-catalog/stellar-catalog-public-labels.ts');
const domain=read('src/app/domain/stellar/stellar-evolution-state.ts');
const gal=read('src/app/presentation/galaxy-knowledge-catalog/galaxy-knowledge-catalog.html');
const page=read('src/app/presentation/galaxy-knowledge-catalog/galaxy-knowledge-catalog.ts');
const stars=read('src/app/presentation/galaxy-knowledge-catalog/galaxy-knowledge-stars-catalog.data-source.ts');
const archive=read('src/app/presentation/genesis-archive/38-bis/genesis-universal-archive-list-layout-38-bis-b1.ts');
const archivePublic=read('src/app/presentation/genesis-archive/38-bis/genesis-universal-archive-public-labels-a6.ts');
const index=read('src/app/presentation/genesis-archive/38-bis/genesis-universal-archive-38-bis.index.ts');
let count=0;
function test(name,check){assert.ok(check,name);count++;}
const labels={BROWN_DWARF:'Enana marrón',MAIN_SEQUENCE:'Secuencia principal',GIANT:'Gigante',
  SUPERGIANT:'Supergigante',WHITE_DWARF:'Enana blanca',NEUTRON_STAR:'Estrella de neutrones',
  STELLAR_BLACK_HOLE:'Remanente de agujero negro estelar'};
for(const [key,visible] of Object.entries(labels)) {
  test('Enum científico '+key,domain.includes(`'${key}'`));
  test('Traducción '+key,lang.includes(`${key}:'${visible}'`));
}
for(const [key,visible] of [
  ['RED_GIANT_BRANCH','Gigante roja (RGB)'],
  ['ASYMPTOTIC_GIANT_BRANCH','Gigante de rama asintótica (AGB)']]) {
  test('Etapa '+key,lang.includes(`${key}:'${visible}'`));
}
test('Traducción solo para categoría estrellas',lang.includes("category!=='stars'"));
test('Enrutamiento del campo evolución',lang.includes("key==='evolution'"));
test('Enrutamiento de etapa gigante',lang.includes("key==='stage'"));
test('Respeto por espectro, valores y unidades',lang.includes('return value;'));
test('Fila galáctica traducida solo en template',gal.includes('publicCellLabel(model.descriptor.category, column.key, row.cells[column.key])'));
test('Función de UI accesible al template',page.includes('readonly publicCellLabel = stellarCatalogPublicCellLabel'));
test('Título del filtro en español',stars.includes('Estrellas · ${filterTitle}'));
test('Indicador del filtro en español',stars.includes("filterLabel:filterTitle??'TODAS'"));
test('Archivo compacto traduce sobre el dato leído',archive.includes('stellarCatalogPublicCellLabel(row.category,key,original)'));
test('Archivo público traduce sobre el dato leído',archivePublic.includes('stellarCatalogPublicCellLabel(row.category,key,row.cells[key])'));
test('Identificador de subtipo persistido sigue siendo el código',index.includes("category==='stars' ? (row.cells['evolution']??'ALL')"));
test('Datos de origen siguen sin traducirse antes de indexar',stars.includes('evolution:record.evolution'));
test('Filtros siguen usando valores científicos',stars.includes('row.evolution===type'));
console.log(`GENESIS STARCAT.1b OK · ${count}/${count} comprobaciones`);
