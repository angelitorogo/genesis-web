/** 38.bis-a4: the lunar fiche and its scientific 3D preview must consume the
 * same immutable, authorized VIDA.9 body record as the global Archive.
 * No new colonial data or scientific coordinates are generated here.
 */
import type {Vida9BiologyRecord} from '../../domain/life/vida9-biology-exploration';
import {vida38InfrastructurePlansFromConfirmed386} from '../infrastructure/vida38-infrastructure-plan-38-6';
import {ScientificBodyPreviewKind,type ScientificBodyPreviewModel} from '../scientific/scientific-body-preview';
import {verifiedMoonColonyCount386b,
  type PlanetMoonColonizationRequest386b} from '../planet-detail/planet-moon-colonization-data-source-38-6b';

export function verifiedMoonDetailRecord38BisA4(
  record:Vida9BiologyRecord|null,
  request:PlanetMoonColonizationRequest386b,
  moonIndex:number,
):Vida9BiologyRecord|null {
  return verifiedMoonColonyCount386b(record,request,moonIndex)===null?null:record;
}

/** Replace only the selected moon's infrastructure plans; keep its shape,
 * orbital definition, spin, geometry, context moons and visual palettes intact.
 * THREE's ngOnChanges rebuild path will pick up the new immutable model.
 */
export function moonPreviewWithVerifiedBiology38BisA4(
  preview:ScientificBodyPreviewModel,
  biology:Vida9BiologyRecord|null,
):ScientificBodyPreviewModel {
  if (preview.kind!==ScientificBodyPreviewKind.MOON || biology===null) return preview;
  const plans=vida38InfrastructurePlansFromConfirmed386(biology);
  const primary=Object.freeze({...preview.primary,infrastructurePlans:plans});
  return Object.freeze({...preview,primary,
    moons:Object.freeze(preview.moons.map(moon=>
      moon===preview.primary?primary:moon))});
}
