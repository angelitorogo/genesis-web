/** Compatibilidad T7k: atlas determinista y unidades de huella (T7l). */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');
const ts=require('typescript');
const src=fs.readFileSync(path.join(__dirname,'../src/app/presentation/infrastructure/colvis3-colony-terrain-atlas-t7k.ts'),'utf8');
const moduleExports={};new Function('exports',ts.transpileModule(src,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText)(moduleExports);
assert.equal(moduleExports.colvis3ColonyTerrainFootprintAngleT7k(.0002,1),.0002);
assert.deepEqual(moduleExports.colvis3ColonyTerrainAtlasT7k(321,true,64),moduleExports.colvis3ColonyTerrainAtlasT7k(321,true,64));
require('./auditar-genesis-38bis-t7l.spec.cjs');
console.log('PASS compatibilidad GENESIS 38.bis-T7k: atlas y huellas con proyección T7l.');
