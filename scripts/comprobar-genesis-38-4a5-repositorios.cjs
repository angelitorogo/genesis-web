/** 38.4a5: verifica que las interfaces requeridas existen en el código REAL.
 * No es una prueba de escritura y lectura con esos repositorios.
 */
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const base=process.cwd();
const definitions=[
 ['src/app/data/local/repository/dexie-vida6-ecosystems-species.repository.ts', ['class DexieVida6EcosystemsSpeciesRepository','async ensure(']],
 ['src/app/data/local/repository/dexie-vida9-biology-exploration.repository.ts',['class DexieVida9BiologyExplorationRepository','async ensure(','async get(']],
 ['src/app/presentation/life-species-visual/vida38-species-visual-contract.ts',['function vida38SpeciesVisualContractFromConfirmedV1','variantSeedUint32: hash32(identity)']],
];
let failures=[];
for(const [relative,expected] of definitions){
 const file=path.resolve(base,relative);
 if(!fs.existsSync(file)){failures.push(`${relative}: ausente`);continue;}
 const content=fs.readFileSync(file,'utf8');
 for(const fragment of expected){if(!content.includes(fragment))failures.push(`${relative}: falta ${fragment}`);}
}
const result={revision:'GENESIS/38.4a5/repository-contract-guard/v1',requiredSourceFiles:definitions.map(x=>x[0]),failures,repositoryRoundTrip:'NO_EJECUTADO',indexedDBEngineTest:'EJECUTAR_PLAYWRIGHT',reason:'Las implementaciones completas y esquema no fueron aportados; no se suplantan los repositorios por dobles.'};
fs.mkdirSync(path.resolve(base,'docs/audits/38-4a5'),{recursive:true});
fs.writeFileSync(path.resolve(base,'docs/audits/38-4a5/38-4a5-repository-guard.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
assert.deepEqual(failures,[],`No se puede certificar integración con interfaces ausentes o modificadas`);
