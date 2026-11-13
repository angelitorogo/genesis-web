'use strict';
const fs=require('node:fs');
const path=require('node:path');
const root=process.cwd();
const scene='src/app/presentation/life-species-visual/vida38-species-visual-preview-scene.ts';
const base=fs.readFileSync(path.join(root,scene),'utf8');
const {patchScene,REPLACE_MARKER}=require('./integrar-genesis-38-2s5-rama-reptiliana-avanzada.cjs');
if (!base.includes(REPLACE_MARKER))throw new Error('38.2s5: falta integrar el selector en la escena; ejecuta el integrador');
if (patchScene(base)!==base)throw new Error('38.2s5: el selector de escena todavía no es idempotente');
if (!base.includes('if (isVida38AdvancedReptilian38S(contract)) {\n    createVida38AdvancedReptilianPreview38S2'))
  throw new Error('38.2s5: el renderer avanzado no tiene prioridad de selección');
if (!base.includes("case 'BIPED_BODY'") || !base.includes("case 'QUADRUPED_BODY'"))
  throw new Error('38.2s5: se modificó accidentalmente el árbol de renderers heredados');
const cache=fs.readFileSync(path.join(root,'src/app/presentation/life-species-visual/vida38-advanced-reptilian-thumbnails-38-2s3.ts'),'utf8');
if (!cache.includes('VIDA.38.2s5/advanced-reptilian-gallery-wardrobe-cache/v2'))
  throw new Error('38.2s5: las miniaturas pueden mostrar una versión obsoleta del vestuario');
console.log('GENESIS_38_2S5_AUDIT_OK: renderer ADVANCED en la escena real, VERY_ADVANCED protegido, miniaturas invalidadas');
