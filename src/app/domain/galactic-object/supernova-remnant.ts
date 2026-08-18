import {
  GalacticObject,
} from './galactic-object';

import {
  type SupernovaRemnantMorphology,
} from './supernova-remnant-morphology';

import {
  type SupernovaRemnantPhysicalProperties,
} from './supernova-remnant-physical-properties';

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
 * Point-12.6 persistent Ground Truth specialization for a supernova remnant.
 *
 * Persistence means that the same GalacticObjectLocator survives discovery and
 * reload through DiscoveryRepository. The physical profile remains regenerable
 * Ground Truth and therefore is deliberately not persisted as duplicated data.
 *
 * This is not the transient supernova event itself. TRANSIENT_EVENT remains a
 * separate point-9.4 ObservationTransientCandidate path without a locator.
 */
export class SupernovaRemnant
  extends GalacticObject {

  constructor(
    generationKey:
      UniverseGenerationKey,

    locator:
      GalacticObjectLocator,

    location:
      GalaxySectorObjectLocation,

    readonly morphology:
      SupernovaRemnantMorphology,

    readonly physicalProperties:
      SupernovaRemnantPhysicalProperties,
  ) {
    super(
      generationKey,
      locator,
      location,
    );
  }
}
