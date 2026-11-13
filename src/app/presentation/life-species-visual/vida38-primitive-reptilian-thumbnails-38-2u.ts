import type { Vida38SpeciesVisualContract } from './vida38-species-visual-contract';
import { VIDA38_PRIMITIVE_REPTILIAN_RENDERER_REVISION_38U } from './vida38-primitive-reptilian-preview-38-2u';
export type Vida38PrimitiveReptilianView38U='FRONT'|'SIDE'|'BACK';
export type Vida38PrimitiveReptilianThumbnails38U=Readonly<Record<Vida38PrimitiveReptilianView38U,string>>;
export const VIDA38_PRIMITIVE_REPTILIAN_THUMB_QUALITY_38U='LOW' as const;
const images=new Map<string,Vida38PrimitiveReptilianThumbnails38U>();
const key=(c:Vida38SpeciesVisualContract)=>[
  VIDA38_PRIMITIVE_REPTILIAN_RENDERER_REVISION_38U,c.speciesId,c.appearanceFingerprint,c.variantSeedUint32,
  c.pigmentation.primaryColorHex,c.pigmentation.secondaryColorHex,c.morphology.appendagePairs,
  c.intelligence?.civilizationTier??''
].join('|');
export function getVida38PrimitiveReptilianThumbnails38U(c:Vida38SpeciesVisualContract):Vida38PrimitiveReptilianThumbnails38U|null{return images.get(key(c))??null;}
export function storeVida38PrimitiveReptilianThumbnails38U(
  c:Vida38SpeciesVisualContract,views:Partial<Record<Vida38PrimitiveReptilianView38U,string>>,
):void{
  if(!views.FRONT||!views.SIDE||!views.BACK)return;
  const id=key(c);images.delete(id);
  while(images.size>=48){const oldest=images.keys().next().value;if(oldest===undefined)break;images.delete(oldest);}
  images.set(id,{FRONT:views.FRONT,SIDE:views.SIDE,BACK:views.BACK});
}
