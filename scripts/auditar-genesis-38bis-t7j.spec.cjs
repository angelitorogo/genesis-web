/** Compatibilidad T7j: tres bandas de detalle, ancladas a la colonia (T7l). */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');
const src=fs.readFileSync(path.join(__dirname,'../src/app/presentation/infrastructure/colvis3-native-terrain-t7i.ts'),'utf8');
for(const part of ['colvisUvMacroT7l','colvisUvFineT7l','colvisUvGrainT7l'])assert.ok(src.includes(part));
require('./auditar-genesis-38bis-t7l.spec.cjs');
console.log('PASS compatibilidad GENESIS 38.bis-T7j: multiescala y visibilidad del relieve.');
