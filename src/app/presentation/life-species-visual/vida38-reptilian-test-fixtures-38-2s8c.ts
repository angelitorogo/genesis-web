/**
 * GENESIS 38.2s8c — SOLO TESTS.
 * Obtiene un ejemplar por identidad estable SIN modificar la selección greedy
 * de las 12/24 miniaturas visibles del laboratorio 38.2o.e9.
 * Los parámetros de identidad, piel y semilla siguen la función candidate()
 * publicada para el laboratorio 38.2o.e5/e9.
 */
import { buildVida38ReptilianGallery38OE5, type Vida38ReptilianGalleryEntry38OE5 } from './vida38-reptilian-gallery-fixtures-38-2oe5';
import { selectVida38ReptilianVariation38OE1 } from './vida38-civilized-reptilian-variation-38-2oe1';
import { deriveVida38ReptilianAccessoryPlan38OE3 } from './vida38-civilized-reptilian-accessories-38-2oe3';
import { deriveVida38CulturalDiversityPlan38OE9 } from './vida38-reptilian-cultural-diversity-38-2oe9';

const SKINS: readonly (readonly [string,string])[] = [
  ['#62837a','#aeb49f'],['#829a8b','#c8bc9c'],['#677688','#9caeb7'],
  ['#a18d76','#c2ae93'],['#555e65','#839ca1'],['#867e69','#b0a187'],
  ['#386e68','#80aca4'],['#756e80','#aba6b5'],['#6c815c','#abc18b'],
  ['#877666','#bca18b'],['#4b7b87','#86acb9'],['#6a857f','#c0b4a2'],
];
function seed32(text:string):number{
  let h=2166136261;
  for(let i=0;i<text.length;i++)h=Math.imul(h^text.charCodeAt(i),16777619)>>>0;
  h^=h>>>16;h=Math.imul(h,0x85ebca6b)>>>0;h^=h>>>13;
  return h>>>0;
}
const selected=buildVida38ReptilianGallery38OE5(24);
export function resolveVida38ReptilianTestEntry38S8C(ordinal:number):Vida38ReptilianGalleryEntry38OE5{
  if(!Number.isInteger(ordinal)||ordinal<1||ordinal>360)throw new Error(`38.2s8c: ordinal fuera de catálogo: ${ordinal}`);
  const existing=selected.find(item=>item.ordinal===ordinal);
  if(existing)return existing;
  const speciesId=`LAB-38OE5-REPTILIAN-${String(ordinal).padStart(5,'0')}`;
  const appearanceFingerprint=`lab38oe5:v1:${speciesId}`;
  const variation=selectVida38ReptilianVariation38OE1(speciesId,appearanceFingerprint);
  const accessory=deriveVida38ReptilianAccessoryPlan38OE3({speciesId,appearanceFingerprint,
    profile:variation.profile,garmentLine:variation.garmentLine,culture:variation.culture});
  const skin=SKINS[seed32(`skin:${speciesId}`)%SKINS.length]!;
  const contract={...selected[0]!.contract,speciesId,speciesName:`Reptiliano de laboratorio ${ordinal}`,
    appearanceFingerprint,variantSeedUint32:seed32(`seed:${speciesId}`),
    bodyLengthMeters:1.65+(seed32(`size:${speciesId}`)%151)/100,
    pigmentation:{...selected[0]!.contract.pigmentation,primaryColorHex:skin[0],secondaryColorHex:skin[1]}};
  return {ordinal,contract,profile:variation.profile,garmentLine:variation.garmentLine,culture:variation.culture,
    eyewear:accessory.eyewear,handheld:accessory.handheld,
    diversityPlan38OE9:deriveVida38CulturalDiversityPlan38OE9(contract)};
}
export function findVida38ReptilianTestEntry38S8C(
  predicate:(entry:Vida38ReptilianGalleryEntry38OE5)=>boolean,
  reason:string,
):Vida38ReptilianGalleryEntry38OE5{
  for(let ordinal=1;ordinal<=360;ordinal++){
    const entry=resolveVida38ReptilianTestEntry38S8C(ordinal);
    if(predicate(entry))return entry;
  }
  throw new Error(`38.2s8c: no se encontró ejemplar para ${reason} en las 360 identidades deterministas`);
}
