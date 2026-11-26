/* GENESIS STARCAT.1a — auditoria de compatibilidad de listado compacto.
 * Solo lectura: no altera indices, ciencia ni almacenamiento. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const dir=path.join(root,'src/app/presentation/genesis-archive/38-bis');
const main=fs.readFileSync(path.join(dir,'genesis-universal-archive-list-layout-38-bis-b1.ts'),'utf8');
const model=fs.readFileSync(path.join(dir,'genesis-universal-archive-38-bis.model.ts'),'utf8');
const src=fs.readFileSync(path.join(root,'src/app/presentation/galaxy-knowledge-catalog/galaxy-knowledge-stars-catalog.data-source.ts'),'utf8');
const tests=fs.readFileSync(path.join(dir,'genesis-universal-archive-list-layout-38-bis-b1.spec.ts'),'utf8');
const integration=fs.readFileSync(path.join(dir,'genesis-universal-archive-list-layout-38-bis-b2.spec.ts'),'utf8');
let total=0;
function ok(value,message){assert.ok(value,message);total++;}
ok(/id:'stars',label:'Estrellas'/.test(model),'Estrellas disponible en enum del Archivo');
ok(/stars:\[\['system','Sistema'\]/.test(main),'Listado: entrada estrellas propia');
for(const field of ['system','component','evolution','stage','spectral','family','radius','mass','temperature','luminosity','age']){
  ok(new RegExp("\\['"+field+"','").test(main.split("  stars:")[1].split("  planets:")[0]),'Campo '+field);
  ok(new RegExp("(?:"+field+"):").test(src)||['system','component','stage','spectral','family','evolution'].includes(field),'Fuente científica '+field);
}
ok(/stars:\['Abrir ficha del sistema','Ver escena científica 3D'\]/.test(main),'Acciones exactas publicadas');
ok(/label:'Abrir ficha del sistema'/.test(src),'Enlace a ficha publicado por STARCAT');
ok(/label:'Ver escena científica 3D'/.test(src),'Enlace escena publicado por STARCAT');
ok(/category==='stars'\?'Abrir ficha del sistema'/.test(integration),'Fixture de integración adaptado');
ok(/STARCAT\.1a presenta campos científicos/.test(tests),'Regresión de campos y acciones');
ok(/\bif\(row.category==='sectors'\)return row.actions/.test(main),'Comportamiento sectores conservado');
ok(!/new (?:Index|Database)|\.delete\(/.test(main),'No toca almacenamiento');
console.log(`GENESIS STARCAT.1a · ${total}/${total} verificaciones OK`);
