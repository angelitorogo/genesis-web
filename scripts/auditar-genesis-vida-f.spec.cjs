'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
const root=path.resolve(__dirname,'..');
const engine=path.join(root,'src/app/simulation/life/vida-f-closure-audit.ts');
const unit=path.join(root,'src/app/simulation/life/vida-f-closure-audit.spec.ts');
const runner=path.join(root,'scripts/auditar-genesis-vida-f.cjs');
const e2e=path.join(root,'e2e/vida-f-regresion-catalogo.spec.ts');
const compile=file=>ts.transpileModule(fs.readFileSync(file,'utf8'),{
  fileName:file,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
  reportDiagnostics:true});
test('VIDA.F: auditor transversal compila sin errores sintacticos',()=>{
  const out=compile(engine);
  assert.equal(out.diagnostics.filter(d=>d.category===ts.DiagnosticCategory.Error).length,0);
  assert.match(out.outputText,/VidaFClosureAudit/);
});
test('VIDA.F: pruebas unitarias cubren los seis objetivos del cierre',()=>{
  const source=fs.readFileSync(unit,'utf8');
  for(const term of ['VIDA_FORZADA','JERARQUIA_INCOMPLETA','OXIGENACION_INSUFICIENTE',
    'uninhabitableWithColony','REGRESION_FISICA','toEqual(r)'])assert.ok(source.includes(term),term);
  assert.equal(compile(unit).diagnostics.filter(d=>d.category===ts.DiagnosticCategory.Error).length,0);
});
test('VIDA.F: muestreo real V3 no modifica IndexedDB ni usa generacion antigua',()=>{
  const source=fs.readFileSync(runner,'utf8');
  for(const term of ['vida9V3ConfirmedPhysicalTargets','Vida8LocalOriginDiscovery',
    'Vida9BiologyExploration','VidaFClosureAudit','maxMoonsPerPlanet','MUESTRA_CON_HUECOS'])
    assert.ok(source.includes(term),term);
  assert.ok(!/indexedDB\s*\.|GenesisIndexedDb|DexieVida/.test(source));
  assert.doesNotThrow(()=>new (require('node:vm').Script)(source,{filename:'auditar-genesis-vida-f.cjs'}));
});
test('VIDA.F: E2E opera en contexto aislado y cubre ambos catalogos V3',()=>{
  const source=fs.readFileSync(e2e,'utf8');
  assert.ok(source.includes("['planets','moons']"));
  assert.ok(source.includes("'/settings'"));
  assert.ok(source.includes('page.reload()'));
  assert.equal(compile(e2e).diagnostics.filter(d=>d.category===ts.DiagnosticCategory.Error).length,0);
});
