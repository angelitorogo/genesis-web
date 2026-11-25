'use strict';
/** GENESIS VISCATM.1a — regresión del discriminante de cuerpos, sin WebGL. */
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const assert = require('node:assert/strict');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const scene = fs.readFileSync(path.join(root,'src/app/presentation/system/system-scene.ts'),'utf8');
const audit = fs.readFileSync(path.join(root,'scripts/auditar-genesis-viscatm1.spec.cjs'),'utf8');
const knownGuard = "candidateBody?.kind === 'planet' && candidateBody.giantAtmosphere !== null";
let checks = 0;
const check=(description, fn)=>{fn();checks++;};
check('acceso solo tras discriminante de planeta',()=>assert(scene.includes(knownGuard)));
check('acceso anterior a propiedad inexistente eliminado',()=>assert(!scene.includes('candidateBody?.giantAtmosphere')));
check('mantiene la función de histéresis',()=>assert(scene.includes('giantAtmosphereFocusWidthVISCATM1(candidate!.projectedDiameter')));
check('mantiene el presupuesto de planetas sólidos',()=>assert(scene.includes('PLANET_TEXTURE_DETAIL_SIZES_V1.closeSystem.width')));
check('mantiene la comprobación previa a instalar',()=>assert(scene.includes("body?.kind !== 'planet'")));
check('auditor anterior actualizado al nuevo discriminante',()=>assert(audit.includes(knownGuard)));
check('tipo estricto en la rama de selección',()=>{
  const src = `
    type LocalSceneBodyViscatm1a = {kind:'planet'|'star';giantAtmosphere:{regime:string}|null}
      | {kind:'moon';moonId:number}
      | {kind:'asteroid';asteroidId:number};
    declare const candidateBody: LocalSceneBodyViscatm1a | null | undefined;
    const width = ${knownGuard} ? 1024 : 512;
    const result: number = width;
    void result;
  `;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(),'genesis-viscatm1a-'));
  try {
    const file = path.join(dir,'narrowing.ts');
    fs.writeFileSync(file,src);
    const program=ts.createProgram([file],{strict:true,noEmit:true,target:ts.ScriptTarget.ES2022,skipLibCheck:true});
    const errors=ts.getPreEmitDiagnostics(program).filter(d=>d.category===ts.DiagnosticCategory.Error);
    assert.deepEqual(errors.map(d=>ts.flattenDiagnosticMessageText(d.messageText,'\n')),[]);
  } finally {fs.rmSync(dir,{recursive:true,force:true});}
});
console.log(`PASS GENESIS VISCATM.1a — ${checks} comprobaciones portátiles`);
