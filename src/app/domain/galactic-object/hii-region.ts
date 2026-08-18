import {
  type GalacticObjectLocator,
} from '../generation/procedural-locator';

import {
  type UniverseGenerationKey,
} from '../generation/universe-generation-key';

import {
  type GalaxySectorObjectLocation,
} from '../sector/galaxy-sector-object-location';

import {
  type HiiRegionPhysicalProperties,
} from './hii-region-physical-properties';

import {
  type NebulaPhysicalProperties,
} from './nebula-physical-properties';

import {
  NebulaType,
} from './nebula-type';

import {
  Nebula,
} from './nebula';

import {
  type StarFormationProfile,
} from './star-formation-profile';

/**
 * Point-12.3 Ground Truth specialization representing an H II region.
 *
 * An H II region reuses the same GalacticObjectLocator as its parent emission
 * nebula; point 12.3 does not invent a second persistent identity or a nested
 * sector locator. This keeps the frozen point-5/9 addressing contract intact.
 *
 * H II regions are always emission nebulae, but not every emission nebula is
 * required to be an H II region. The generator owns that deterministic V1
 * decision.
 */
export class HiiRegion
  extends Nebula {

  constructor(
    generationKey:
      UniverseGenerationKey,

    locator:
      GalacticObjectLocator,

    location:
      GalaxySectorObjectLocation,

    physicalProperties:
      NebulaPhysicalProperties,

    readonly hiiPhysicalProperties:
      HiiRegionPhysicalProperties,

    readonly starFormationProfile:
      StarFormationProfile,
  ) {
    super(
      generationKey,
      locator,
      location,
      NebulaType.EMISSION,
      physicalProperties,
    );

    if (
      hiiPhysicalProperties
        .radiusParsecs >
      physicalProperties
        .radiusParsecs
    ) {
      throw new RangeError(
        'H II region radius cannot exceed its emission-nebula radius.',
      );
    }
  }
}
