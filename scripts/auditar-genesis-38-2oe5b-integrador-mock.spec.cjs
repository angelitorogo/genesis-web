'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { integrate } = require('./integrar-genesis-38-2oe5b-laboratorio.cjs');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'genesis-oe5b-'));
const route = path.join(temp,'src/app/app.routes.ts');
const home = path.join(temp,'src/app/presentation/laboratory/laboratory-home.component.ts');
const source = path.join(temp,'src/app/presentation/life-species-visual');
try {
  fs.mkdirSync(path.dirname(route),{recursive:true});
  fs.mkdirSync(path.dirname(home),{recursive:true});
  fs.mkdirSync(source,{recursive:true});
  fs.writeFileSync(route,"import { Routes } from '@angular/router';\nexport const routes: Routes = [{path:'laboratorio',component:Lab}, {path:'**',redirectTo:''}];");
  fs.writeFileSync(home,"@Component({template: `<div class='grid'><a>Galaxias</a><a>Objetos galácticos</a></div><p>Los laboratorios muestran únicamente sistemas ya implementados.</p>`}) class Lab {};");
  for (const f of ['vida38-reptilian-gallery-laboratory-38-2oe5b.component.ts','vida38-reptilian-gallery-38-2oe5.component.ts','life-species-visual-preview.ts']) {
    fs.writeFileSync(path.join(source,f),'mock');
  }
  const first=integrate(temp);
  assert.equal(first.unchanged,false);
  assert.match(fs.readFileSync(route,'utf8'), /path: 'laboratorio\/reptilianos-civilizados'/);
  assert.match(fs.readFileSync(home,'utf8'), /vida38-oe5b-laboratory-entry/);
  const second=integrate(temp);
  assert.equal(second.unchanged,true);
  const backups = path.join(temp,'docs/audits/38-2oe5b/backups');
  assert.equal(fs.readdirSync(backups).length,2);
  console.log('GENESIS_38_2OE5B_INSTALLER_MOCK_OK: ruta y sexta entrada; idempotencia y backups');
} finally { fs.rmSync(temp,{recursive:true,force:true}); }
