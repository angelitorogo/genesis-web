import type {Vida38SpeciesVisualContract} from './vida38-species-visual-contract';
import {VIDA38_PRIMITIVE_HUMANOID_RENDERER_REVISION_38X} from './vida38-primitive-humanoid-preview-38-2x';
export type Vida38PrimitiveHumanoidView38X='FRONT'|'SIDE'|'BACK';
export type Vida38PrimitiveHumanoidThumbs38X=Readonly<Record<Vida38PrimitiveHumanoidView38X,string>>;
const images=new Map<string,Vida38PrimitiveHumanoidThumbs38X>();
const key=(c:Vida38SpeciesVisualContract)=>[VIDA38_PRIMITIVE_HUMANOID_RENDERER_REVISION_38X,c.speciesId,c.appearanceFingerprint,c.variantSeedUint32].join('|');
export function getVida38PrimitiveHumanoidThumbnails38X(c:Vida38SpeciesVisualContract):Vida38PrimitiveHumanoidThumbs38X|null{return images.get(key(c))??null;}
export function storeVida38PrimitiveHumanoidThumbnails38X(c:Vida38SpeciesVisualContract,views:Partial<Record<Vida38PrimitiveHumanoidView38X,string>>):void{
 if(!views.FRONT||!views.SIDE||!views.BACK)return;const id=key(c);images.delete(id);
 while(images.size>=48){const k=images.keys().next().value;if(!k)break;images.delete(k);}
 images.set(id,{FRONT:views.FRONT,SIDE:views.SIDE,BACK:views.BACK});
}
