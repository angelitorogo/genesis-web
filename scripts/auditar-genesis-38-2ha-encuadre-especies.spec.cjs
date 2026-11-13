#!/usr/bin/env node
'use strict';
/** Auditoría sin dependencias GPU. Ejecutar desde la raíz de GENESIS Web. */
const fs = require('node:fs');
const assert = require('node:assert/strict');
const ts = require('typescript');
const files = [
  'src/app/presentation/life-species-visual/vida38-species-camera-framing-38-2ha.ts',
  'src/app/presentation/life-species-visual/life-species-visual-preview.ts',
  'src/app/presentation/life-species-visual/vida38-species-camera-framing-38-2ha.spec.ts',
];
for(const f of files) {
  assert.ok(fs.existsSync(f),`Archivo no encontrado: ${f}`);
  const compiled = ts.transpileModule(fs.readFileSync(f,'utf8'),{
    fileName:f,
    reportDiagnostics:true,
    compilerOptions:{strict:true,target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,
      experimentalDecorators:true},
  });
  const errors=(compiled.diagnostics??[]).filter(d=>d.category===ts.DiagnosticCategory.Error);
  assert.equal(errors.length,0,`${f}: ${errors.map(d=>ts.flattenDiagnosticMessageText(d.messageText,'\n')).join('\n')}`);
}
const helper=fs.readFileSync(files[0],'utf8');
const view=fs.readFileSync(files[1],'utf8');
assert.ok(helper.includes('bounds.getCenter('),'El encuadre no utiliza el centro de la especie');
assert.ok(view.includes('setFromObject(this.model.subject)'),'El encuadre incluye el decorado');
assert.ok(view.includes('this.resetView();'),'No se aplica el encuadre a la carga de la especie');
assert.ok(view.includes('this.recalculateFraming(false);'),'Restablecer vista no recalcula el encuadre');
assert.ok(view.includes('this.recalculateFraming(true);'),'El redimensionado no conserva el zoom');
console.log('GENESIS_38_2HA_AUDIT_OK — integración cámara y sintaxis TypeScript');
