'use strict';
const assert=require('node:assert/strict');
const test=require('node:test');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const cp=require('node:child_process');
const SOURCE=fs.readFileSync(path.join(__dirname,'auditar-genesis-38-4-38-6.cjs'),'utf8');
function runFixture(files){
 const base=fs.mkdtempSync(path.join(os.tmpdir(),'genesis-38-456-'));
 try{
 for(const [rel,body] of Object.entries(files)){const dst=path.join(base,'src/app',rel);fs.mkdirSync(path.dirname(dst),{recursive:true});fs.writeFileSync(dst,body);}
 const script=path.join(base,'audit.cjs');fs.writeFileSync(script,SOURCE);
 const ret=cp.spawnSync(process.execPath,[script],{cwd:base,encoding:'utf8'});
 const reportPath=path.join(base,'docs/audits/38-4-6/38-4-6-auditoria-evidencia.json');
 assert.equal(ret.status,0,ret.stderr);
 return JSON.parse(fs.readFileSync(reportPath,'utf8'));
 }finally{fs.rmSync(base,{recursive:true,force:true});}
}
test('sin fuentes reales no inventa certificaciones',()=>{
 const report=runFixture({'presentation/ficha-species.ts':'export const empty=42;'});
 assert.equal(report.conclusion,'CIERRE_NO_CERTIFICADO');
 assert.equal(report.checks.find(x=>x.id==='38.6.luces').state,'SIN_EVIDENCIA');
 assert.equal(report.checks.find(x=>x.id==='38.5.origen').state,'SIN_EVIDENCIA');
});
test('encontrar términos no los convierte automáticamente en aprobación',()=>{
 const report=runFixture({'presentation/life-species-visual/vida38-species-visual-preview.ts':'const x=hash32(speciesId + appearanceFingerprint + variantSeedUint32);',
 'presentation/ficha-species.ts':'const x="Origen Ecosistema Relaciones Cultura Tecnología";',
 'presentation/system/system-scene.ts':'const x="nightLights settlement orbital station colonization";'});
 assert.equal(report.checks.find(x=>x.id==='38.5.origen').state,'REVISAR');
 assert.equal(report.checks.find(x=>x.id==='38.6.luces').state,'REVISAR');
 assert.equal(report.conclusion,'CIERRE_NO_CERTIFICADO');
});
