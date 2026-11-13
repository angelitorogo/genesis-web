import type {Vida38SpeciesVisualContract} from './vida38-species-visual-contract';
import {VIDA38_ADV_HUMANOID_RENDERER_REVISION_38W} from './vida38-advanced-humanoid-preview-38-2w';
export type Vida38AdvancedHumanoidView38W='FRONT'|'SIDE'|'BACK';
export type Vida38AdvancedHumanoidThumbs38W=Readonly<Record<Vida38AdvancedHumanoidView38W,string>>;
const images=new Map<string,Vida38AdvancedHumanoidThumbs38W>();
const key=(c:Vida38SpeciesVisualContract)=>[VIDA38_ADV_HUMANOID_RENDERER_REVISION_38W,c.speciesId,c.appearanceFingerprint,c.variantSeedUint32].join('|');
export function getVida38AdvancedHumanoidThumbnails38W(c:Vida38SpeciesVisualContract):Vida38AdvancedHumanoidThumbs38W|null{return images.get(key(c))??null;}
export function storeVida38AdvancedHumanoidThumbnails38W(c:Vida38SpeciesVisualContract,views:Partial<Record<Vida38AdvancedHumanoidView38W,string>>):void{
 if(!views.FRONT||!views.SIDE||!views.BACK)return;const id=key(c);images.delete(id);
 while(images.size>=48){const k=images.keys().next().value;if(!k)break;images.delete(k);}
 images.set(id,{FRONT:views.FRONT,SIDE:views.SIDE,BACK:views.BACK});
}
