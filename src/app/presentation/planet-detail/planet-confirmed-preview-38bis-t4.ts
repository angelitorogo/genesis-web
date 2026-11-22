/** Planet analogue of 38.bis-a4's verified moon preview parity.
 * Only the selected planet's already-approved visual biological inputs change;
 * no orbit, shape, cloud, texture seed or contextual moon is regenerated.
 */
import type {Vida9BiologyRecord} from '../../domain/life/vida9-biology-exploration';
import {vida38InfrastructurePlansFromConfirmed386} from '../infrastructure/vida38-infrastructure-plan-38-6';
import {ScientificBodyPreviewKind,type ScientificBodyPreviewModel} from '../scientific/scientific-body-preview';
import {resolvePlanetVegetationPreviewProfileV1} from './planet-vegetation-preview-profile-visbio';
import {resolveConfirmedPlanetCivilizationTierV1} from './planet-scientific-card';

export function planetPreviewWithVerifiedBiology38BisT4(
  preview:ScientificBodyPreviewModel,biology:Vida9BiologyRecord|null,
):ScientificBodyPreviewModel{
  if(preview.kind!==ScientificBodyPreviewKind.PLANET || biology===null)return preview;
  const plans=vida38InfrastructurePlansFromConfirmed386(biology);
  return Object.freeze({...preview,primary:Object.freeze({...preview.primary,
    infrastructurePlans:plans,
    vegetationProfile:resolvePlanetVegetationPreviewProfileV1(biology,undefined),
    nightCivilizationTier:resolveConfirmedPlanetCivilizationTierV1(biology),
  })});
}
