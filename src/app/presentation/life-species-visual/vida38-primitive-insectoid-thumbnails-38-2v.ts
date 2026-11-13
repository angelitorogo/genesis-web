/** Caché de imágenes LOW (no geometrías GPU). Válida únicamente durante esta sesión. */
import type { Vida38SpeciesVisualContract } from './vida38-species-visual-contract';
import { VIDA38_PRIMITIVE_INSECT_RENDERER_REVISION_38V } from './vida38-primitive-insectoid-preview-38-2v';
export type Vida38PrimitiveInsectoidView38V='FRONT'|'SIDE'|'BACK';
export type Vida38PrimitiveInsectoidThumbnails38V=Readonly<Record<Vida38PrimitiveInsectoidView38V,string>>;
export const VIDA38_PRIMITIVE_INSECT_THUMB_QUALITY_38V='LOW' as const;
const images=new Map<string,Vida38PrimitiveInsectoidThumbnails38V>();
const key=(c:Vida38SpeciesVisualContract)=>[
  VIDA38_PRIMITIVE_INSECT_RENDERER_REVISION_38V,c.speciesId,c.appearanceFingerprint,c.variantSeedUint32,
  c.pigmentation.primaryColorHex,c.pigmentation.secondaryColorHex,c.morphology.appendagePairs,
  c.intelligence?.civilizationTier??''].join('|');
export function getVida38PrimitiveInsectoidThumbnails38V(c:Vida38SpeciesVisualContract):Vida38PrimitiveInsectoidThumbnails38V|null{
  return images.get(key(c))??null;
}
export function storeVida38PrimitiveInsectoidThumbnails38V(
  c:Vida38SpeciesVisualContract, views:Partial<Record<Vida38PrimitiveInsectoidView38V,string>>,
):void{
  if(!views.FRONT||!views.SIDE||!views.BACK)return;
  const id=key(c);images.delete(id);
  while(images.size>=48){const oldest=images.keys().next().value;if(oldest===undefined)break;images.delete(oldest);}
  images.set(id,{FRONT:views.FRONT,SIDE:views.SIDE,BACK:views.BACK});
}
