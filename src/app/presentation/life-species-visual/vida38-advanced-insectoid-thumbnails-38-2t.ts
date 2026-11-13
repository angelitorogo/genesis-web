/** Caché de imágenes LOW (no geometrías GPU). Válida únicamente durante esta sesión. */
import type { Vida38SpeciesVisualContract } from './vida38-species-visual-contract';
import { VIDA38_ADV_INSECT_RENDERER_REVISION_38T } from './vida38-advanced-insectoid-preview-38-2t';
export type Vida38AdvancedInsectoidView38T='FRONT'|'SIDE'|'BACK';
export type Vida38AdvancedInsectoidThumbnails38T=Readonly<Record<Vida38AdvancedInsectoidView38T,string>>;
export const VIDA38_ADV_INSECT_THUMB_QUALITY_38T='LOW' as const;
const images=new Map<string,Vida38AdvancedInsectoidThumbnails38T>();
const key=(c:Vida38SpeciesVisualContract)=>[
  VIDA38_ADV_INSECT_RENDERER_REVISION_38T,c.speciesId,c.appearanceFingerprint,c.variantSeedUint32,
  c.pigmentation.primaryColorHex,c.pigmentation.secondaryColorHex,c.morphology.appendagePairs,
  c.intelligence?.civilizationTier??''].join('|');
export function getVida38AdvancedInsectoidThumbnails38T(c:Vida38SpeciesVisualContract):Vida38AdvancedInsectoidThumbnails38T|null{
  return images.get(key(c))??null;
}
export function storeVida38AdvancedInsectoidThumbnails38T(
  c:Vida38SpeciesVisualContract, views:Partial<Record<Vida38AdvancedInsectoidView38T,string>>,
):void{
  if(!views.FRONT||!views.SIDE||!views.BACK)return;
  const id=key(c);images.delete(id);
  while(images.size>=48){const oldest=images.keys().next().value;if(oldest===undefined)break;images.delete(oldest);}
  images.set(id,{FRONT:views.FRONT,SIDE:views.SIDE,BACK:views.BACK});
}
