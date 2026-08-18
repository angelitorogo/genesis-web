import {
  GalacticObjectLocator,
} from '../generation/procedural-locator';

import {
  type UniverseGenerationKey,
} from '../generation/universe-generation-key';

import {
  GalaxySectorKeyCodec,
} from '../sector/galaxy-sector-key-codec';

import {
  type GalaxySectorObjectLocation,
} from '../sector/galaxy-sector-object-location';

/**
 * Point-12.1 common domain model for a persistent non-planetary galactic
 * object.
 *
 * The model intentionally contains only properties shared by every future
 * point-12 specialization:
 *
 * - procedural generation identity;
 * - GalacticObjectLocator identity;
 * - exact deterministic location inside its sector.
 *
 * It deliberately does not contain a nebula subtype, cluster subtype,
 * supernova-remnant properties, scientific actions, Discovery Points,
 * discovery state or rendering data. Those belong to later roadmap points.
 *
 * location is regenerable Ground Truth. It must not be persisted merely to
 * reconstruct this model; the locator remains the persistent identity.
 */
export class GalacticObject {

  constructor(
    readonly generationKey:
      UniverseGenerationKey,

    readonly locator:
      GalacticObjectLocator,

    readonly location:
      GalaxySectorObjectLocation,
  ) {
    const expectedCoordinates =
      GalaxySectorKeyCodec
        .decode(
          locator.sectorKey,
        );

    if (
      location
        .sectorCoordinates
        .x !==
        expectedCoordinates.x ||
      location
        .sectorCoordinates
        .y !==
        expectedCoordinates.y
    ) {
      throw new RangeError(
        'GalacticObject location must belong to the locator sector.',
      );
    }
  }

  get galaxyIndex():
    bigint {

    return this
      .locator
      .galaxyIndex;
  }

  get sectorKey():
    bigint {

    return this
      .locator
      .sectorKey;
  }

  get galacticObjectIndex():
    bigint {

    return this
      .locator
      .galacticObjectIndex;
  }
}
