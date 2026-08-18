import {
  GalacticObject,
} from './galactic-object';

import {
  type NebulaPhysicalProperties,
} from './nebula-physical-properties';

import {
  NebulaType,
  type NebulaType as NebulaTypeValue,
} from './nebula-type';

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
 * Point-12.2 physical Ground Truth specialization of GalacticObject.
 *
 * The base point-12.1 procedural identity and location remain authoritative.
 * nebulaType and physicalProperties are regenerable Ground Truth and do not
 * imply that observation has already classified the object that precisely.
 */
export class Nebula
  extends GalacticObject {

  constructor(
    generationKey:
      UniverseGenerationKey,

    locator:
      GalacticObjectLocator,

    location:
      GalaxySectorObjectLocation,

    readonly nebulaType:
      NebulaTypeValue,

    readonly physicalProperties:
      NebulaPhysicalProperties,
  ) {
    super(
      generationKey,
      locator,
      location,
    );

    if (
      !Object.values(
        NebulaType,
      ).includes(
        nebulaType,
      )
    ) {
      throw new RangeError(
        `Unknown NebulaType: ${String(nebulaType)}.`,
      );
    }
  }
}
