const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const test=require('node:test');
const ts=require('typescript');
const root=path.join(__dirname,'..');
const ui=fs.readFileSync(path.join(root,'src/app/presentation/moon-detail/moon-detail.html'),'utf8');
const ctrl=fs.readFileSync(path.join(root,'src/app/presentation/moon-detail/moon-detail.ts'),'utf8');
const helper=fs.readFileSync(path.join(root,'src/app/presentation/moon-detail/moon-scientific-compact-vida9e.ts'),'utf8');
const spec=fs.readFileSync(path.join(root,'src/app/presentation/moon-detail/moon-scientific-compact-vida9e.spec.ts'),'utf8');
for(const [name,source] of [['controlador',ctrl],['proyección',helper],['tests',spec]]) {
 const out=ts.transpileModule(source,{fileName:name+'.ts',compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS},reportDiagnostics:true});
 if(out.diagnostics?.length)throw new Error(name+': '+out.diagnostics.map(d=>ts.flattenDiagnosticMessageText(d.messageText,' ')).join('; '));
}
const js=ts.transpileModule(helper,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
const m={exports:{}};
new Function('require','module','exports',js)(require,m,m.exports);
const compact=m.exports.compactMoonSectionsVIDA9e;
const src={sections:['general','orbit','tides','environment','atmosphere','radiation','geochemistry','history','habitability','comparison'].map(id=>({id,fields:[{label:'Masa',value:'1 M⊕',note:null},{label:'Atmósfera',value:'No resuelta',note:null},{label:'Geología',value:'Activa por mareas',note:null},{label:'Océano CT-0 del universo simulado (32.F.2c)',value:'Presente',note:null}]}))};
test('sólo hay secciones lunares relevantes y comparación en la sección 10',()=>{
 const result=compact(src);assert.equal(result.length,9);assert(!result.some(s=>s.id==='history'));
 assert.equal(result.at(-1).eyebrow,'SECCIÓN 10');
});
test('el estado CT-0 no se borra ni modifica',()=>{
 const before=JSON.stringify(src);const result=compact(src);
 assert.equal(JSON.stringify(src),before);assert.equal(result.find(s=>s.id==='environment').fields.find(x=>x.label==='Océano subsuperficial').value,'Presente');
});
test('sección Vida insertada entre Habitabilidad y Comparación',()=>{
 const between=ui.indexOf('id="moon-section-vida"');const comp=ui.indexOf("[id]=\"'moon-section-' + section.id\"");
 assert(between>0 && comp>between);assert(ui.includes("section.id === 'comparison'"));
 assert(ui.includes('app-vida9-full-system-biology-panel'));
});
test('sin bloques observados, auditoría o identificadores internos',()=>{
 for(const keyword of ['card.locatorLabel','card.accessLabel','observedHabitability','coherenceAuditVIDA9a','SystemPage 3D'])assert(!ui.includes(keyword),keyword);
});
test('plantilla y encabezado lunar maquetados en rejilla adaptativa',()=>{
 const css=fs.readFileSync(path.join(root,'src/app/presentation/moon-detail/moon-detail.scss'),'utf8');
 assert(css.includes('grid-template-columns:minmax(0,1.45fr)'));
 assert(css.includes('@media (max-width:48rem)'));
 assert(ui.includes('moon-detail__facts'));
});
