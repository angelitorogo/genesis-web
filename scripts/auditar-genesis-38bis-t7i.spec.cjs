/** Compatibilidad T7i: material original, ninguna malla adicional (T7l). */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');
const src=fs.readFileSync(path.join(__dirname,'../src/app/presentation/infrastructure/colvis3-native-terrain-t7i.ts'),'utf8');
assert.match(src,/original\.clone\(\)/);
assert.match(src,/surface\.material=original/);
assert.doesNotMatch(src,/new THREE\.PlaneGeometry\(/);
require('./auditar-genesis-38bis-t7l.spec.cjs');
console.log('PASS compatibilidad GENESIS 38.bis-T7i: restauración del material y geometría intacta.');
