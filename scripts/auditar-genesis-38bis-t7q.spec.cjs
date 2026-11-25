/** GENESIS 38.bis-T7q — prueba portátil de margen óptico de contacto. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
const root=path.resolve(__dirname,'..');
const rel='src/app/presentation/infrastructure/colvis3-colony-ground-contact-t7o.ts';
const helper=fs.readFileSync(path.join(root,rel),'utf8');
const test=fs.readFileSync(path.join(root,'src/app/presentation/infrastructure/colvis3-colony-ground-contact-t7o.spec.ts'),'utf8');
let checks=0;const check=(f)=>{f();checks++};
for(const source of [helper,test]){
  const d=ts.transpileModule(source,{reportDiagnostics:true,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}});
  check(()=>assert.equal((d.diagnostics||[]).filter(x=>x.category===ts.DiagnosticCategory.Error).length,0));
}
const m={exports:{}};
new Function('require','module','exports',ts.transpileModule(helper,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(
  x=>x==='three'?{}:assert.fail('Import inesperado '+x),m,m.exports);
const gap=m.exports.colvis3ContactClearanceT7q;
for(const f of [.00001,.0002,.003,.2])for(const r of [.3,1,5]){
  const v=gap(f,r);
  check(()=>assert.ok(v>=f*.0025-1e-14,`Contacto insuficiente ${v}`));
  check(()=>assert.ok(v<=f*.01+1e-14,`Contacto excesivo ${v}`));
  check(()=>assert.ok(v>0));
}
for(const [f,r] of [[0,1],[-1,1],[1,0],[1,-1],[Infinity,1],[1,NaN]])
  check(()=>assert.equal(gap(f,r),null));
for(const token of ['const visibleGround=hit.point.dot(up)+contactClearanceT7q;',
  'colvis3SupportCorrectionT7p(support.dot(up),visibleGround,footprintWorld,radius)',
  'colvis3GroundingCorrectionT7o(support.dot(up),visibleGround,footprintWorld)',
  'original.push({mesh:object,matrices})',
  'colony.position.copy(originalSitePosition)'])
  check(()=>assert.ok(helper.includes(token),token));
check(()=>assert.ok(!helper.includes('new THREE.PlaneGeometry')));
check(()=>assert.ok(!helper.includes('depthTest:false')));
console.log(`PASS GENESIS 38.bis-T7q — ${checks} verificaciones portátiles de contacto óptico sin flotación`);
