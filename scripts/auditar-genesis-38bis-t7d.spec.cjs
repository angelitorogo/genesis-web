/** 38.bis-T7d — auditoría portable de pulido visual/modal. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
const root=path.resolve(__dirname,'..');
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8');
const previewTs='src/app/presentation/scientific-body-preview/scientific-body-preview.ts';
const previewHtml='src/app/presentation/scientific-body-preview/scientific-body-preview.html';
const previewScss='src/app/presentation/scientific-body-preview/scientific-body-preview.scss';
const helperTs='src/app/presentation/infrastructure/colvis3-colony-visibility-t7c.ts';
const renderTs='src/app/presentation/infrastructure/vida38-infrastructure-render-38-6.ts';
const body=read(previewTs), html=read(previewHtml), scss=read(previewScss), helper=read(helperTs), renderer=read(renderTs);
let checks=0; const check=(fn)=>{fn();checks++;};
for(const source of [body,helper,renderer]){
  const result=ts.transpileModule(source,{reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}});
  check(()=>assert.equal(result.diagnostics?.filter(d=>d.category===ts.DiagnosticCategory.Error).length??0,0));
}
check(()=>assert.ok(!html.includes('>Colonia confirmada<')));
check(()=>assert.ok(html.includes('Vista general')));
check(()=>assert.ok(!html.includes('Procedencia')));
check(()=>assert.ok(!html.includes('Nombre público')));
check(()=>assert.ok(!html.includes('(estimación VIDA.8)')));
check(()=>assert.ok(html.includes('colonyHostBodyLabelT7d()')));
for(const s of ['lockBackgroundScrollT7d','unlockBackgroundScrollT7d','colonyHostBodyLabelT7d'])
  check(()=>assert.ok(body.includes(s),s));
check(()=>assert.ok(helper.includes("populationLabel:valid?`${grouped(range[0])}–${grouped(range[1])} habitantes`:'No evaluable'")));
check(()=>assert.ok(helper.includes('0xff4fd8')));
check(()=>assert.ok(helper.includes('0xff8a24')));
check(()=>assert.ok(!renderer.includes('addColonySurfacePatchT7d')));
check(()=>assert.ok(body.includes('attachColonySurfaceContextT7e')));
check(()=>assert.ok(body.includes('colvis3ColonyFramingT7e')));
check(()=>assert.ok(scss.includes('.scientific-preview__viewport--colony-modal')));
console.log(`PASS GENESIS 38.bis-T7d: ${checks} comprobaciones portátiles; marcador, modal, limpieza y scroll.`);
