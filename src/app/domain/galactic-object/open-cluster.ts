import {
  GalacticObject,
} from './galactic-object';

import {
  type OpenClusterPhysicalProperties,
} from './open-cluster-physical-properties';

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
 * Point-12.4 Ground Truth specialization for an open stellar cluster.
 *
 * The point-12.1 locator and location remain the persistent procedural
 * identity. physicalProperties are regenerated from that identity plus the
 * already-existing sector stellar environment.
 *
 * The model deliberately does not materialize individual member stars,
 * scientific actions, Discovery Points, observation state or rendering data.
 */
export class OpenCluster
  extends GalacticObject {

  constructor(
    generationKey:
      UniverseGenerationKey,

    locator:
      GalacticObjectLocator,

    location:
      GalaxySectorObjectLocation,

    readonly physicalProperties:
      OpenClusterPhysicalProperties,
  ) {
    super(
      generationKey,
      locator,
      location,
    );
  }
}
