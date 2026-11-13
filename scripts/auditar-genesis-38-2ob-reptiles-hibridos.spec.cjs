'use strict';
const fs=require('node:fs'), path=require('node:path'), assert=require('node:assert/strict');
const mod=fs.readFileSync(path.join(__dirname,'..','src/app/presentation/life-species-visual','vida38-civilized-reptilian-preview-38-2o.ts'),'utf8');
assert.match(mod,/ReptilianHybridProfile/);
assert.match(mod,/hybridHumanoidReptilian38OB/);
assert.match(mod,/VIDA38_2OB_REPTILIAN_GARMENT/);
assert.match(mod,/addScales/);
assert.match(mod,/addTeeth/);
console.log('GENESIS_38_2OB_AUDIT_OK: renderer híbrido humanoide-reptiliano detectado');
