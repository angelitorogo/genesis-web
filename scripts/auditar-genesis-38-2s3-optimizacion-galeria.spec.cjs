'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const prefix = 'src/app/presentation/life-species-visual';
const galleryFile = path.join(root, prefix, 'vida38-advanced-reptilian-gallery-38-2s.component.ts');
const cacheFile = path.join(root, prefix, 'vida38-advanced-reptilian-thumbnails-38-2s3.ts');
const specFile = path.join(root, prefix, 'vida38-advanced-reptilian-38-2s3.spec.ts');
for(const file of [galleryFile, cacheFile, specFile]){
  if(!fs.existsSync(file))throw Error('38.2s3: falta '+path.relative(root,file));
}
const gallery=fs.readFileSync(galleryFile,'utf8');
const cache=fs.readFileSync(cacheFile,'utf8');
const spec=fs.readFileSync(specFile,'utf8');
if(!/THUMB_QUALITY_38S3\s*=\s*'LOW'/.test(cache))throw Error('38.2s3: las miniaturas no usan LOW');
if(!/createVida38SpeciesPreviewModelV1\(entry\.contract,\s*\{\s*humanoidQuality:\s*VIDA38_ADVANCED_REPTILIAN_THUMB_QUALITY_38S3\s*\}\)/.test(gallery))throw Error('38.2s3: la calidad LOW no llega al modelo real');
if(!gallery.includes('getVida38AdvancedReptilianThumbnails38S3(entry.contract)'))throw Error('38.2s3: no se recupera la caché');
if(!gallery.includes('storeVida38AdvancedReptilianThumbnails38S3(entry.contract,images)'))throw Error('38.2s3: no se guardan las tres vistas');
if(!gallery.includes('while(this.index<this.count && this.complete('))throw Error('38.2s3: no se saltan los ejemplares ya preparados');
if(!/images\.FRONT\s*\|\|\s*!images\.SIDE\s*\|\|\s*!images\.BACK/.test(cache))throw Error('38.2s3: no se exige completar tres vistas');
if(!cache.includes('imagesByIdentity.size >= VIDA38_ADVANCED_REPTILIAN_THUMB_CACHE_LIMIT_38S3'))throw Error('38.2s3: caché sin límite');
if(!spec.includes('evita mezclar miniaturas'))throw Error('38.2s3: falta regresión de identidad visual');
if(/Math\.random\s*\(/.test(gallery+cache))throw Error('38.2s3: aleatoriedad no determinista');
console.log('GENESIS_38_2S3_AUDIT_OK: miniaturas LOW, 3 vistas, caché limitada, continuidad CT-0');
