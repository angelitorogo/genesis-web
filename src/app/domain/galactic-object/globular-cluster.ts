import {
  GalacticObject,
} from './galactic-object';

import {
  type GlobularClusterPhysicalProperties,
} from './globular-cluster-physical-properties';

import {
  type GalacticObjectLocator,
} from '../generation/procedural-locator';

import {
  type UniverseGenerationKey,
} from '../generation/universe-generation-key';

import {
  type GalaxySectorObjectLocation,
} from '../sector/galaxy-sector-object-location';

/**
 * Point-12.5 Ground Truth specialization for a globular stellar cluster.
 *
 * The point-12.1 locator and location remain the persistent procedural
 * identity. physicalProperties are regenerated from that identity and the
 * already-existing host-galaxy/sector stellar environment.
 *
 * The model deliberately does not materialize individual member stars,
 * scientific actions, Discovery Points, observation state or rendering data.
 */
export class GlobularCluster
  extends GalacticObject {

  constructor(
    generationKey:
      UniverseGenerationKey,

    locator:
      GalacticObjectLocator,

    location:
      GalaxySectorObjectLocation,

    readonly physicalProperties:
      GlobularClusterPhysicalProperties,
  ) {
    super(
      generationKey,
      locator,
      location,
    );
  }
}
