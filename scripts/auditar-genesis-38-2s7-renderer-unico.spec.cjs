'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=process.cwd();
const src=p=>fs.readFileSync(path.join(root,'src/app/presentation/life-species-visual',p),'utf8');
const scene=src('vida38-species-visual-preview-scene.ts');
const renderer=src('vida38-advanced-reptilian-preview-38-2s2.ts');
const wear=src('vida38-advanced-reptilian-visible-wear-38-2s7.ts');
const runtime=src('vida38-advanced-reptilian-runtime-38-2s6.ts');
const gallery=src('vida38-advanced-reptilian-gallery-38-2s.component.ts');
const thumbs=src('vida38-advanced-reptilian-thumbnails-38-2s3.ts');
assert(scene.includes('createVida38AdvancedReptilianPreview38S2(subject, contract,'),'La fábrica no invoca el renderer avanzado');
assert(scene.includes('enforceVida38AdvancedReptilianVisibleRenderer38S6(subject, contract,'),'Falta la postcondición');
assert(renderer.includes('detachLegacyClothing(subject,created)'), 'No se elimina la ropa antigua');
assert(renderer.includes('buildVida38AdvancedReptilianVisibleWear38S7(anatomy,plan)'), 'El renderer no construye vestimenta 3D visible');
assert(renderer.includes("'VIDA38_2OD_REPTILIAN_BODY'"),'El cuerpo orgánico no se reutiliza');
assert(runtime.includes('VIDA38_ADVANCED_REPTILIAN_VISIBLE_WEAR_38S7'),'El control no reconoce la geometría real');
assert(gallery.includes('renderErrors[entry.contract.speciesId]'),'La galería no presenta el error concreto');
assert(thumbs.includes('38.2s7/advanced-reptilian-gallery-visible-wear-cache'),'No se invalidó la caché antigua');
for(const label of ['SILHOUETTE_JACKET_360','TROUSER_LEG_360','PRESSURE_SEAL','ACCESSORY_SPACE_HELMET','ACCESSORY_BREATHING_MODULE',
'ACCESSORY_SCIENCE_INSIGNIA','ACCESSORY_BACKPACK_SUPPORT','SHOULDER_PROTECTOR','PROFESSIONAL_BOOT']){
  assert(wear.includes(label),`No se encuentra pieza visible: ${label}`);
}
console.log('GENESIS_38_2S7_STATIC_AUDIT_OK: fábrica, renderer, geometría visible, caché y diagnóstico enlazados');
