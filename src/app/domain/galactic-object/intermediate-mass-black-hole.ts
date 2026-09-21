import { GalacticObject } from './galactic-object';
import { IntermediateMassBlackHolePhysicalProperties } from './intermediate-mass-black-hole-physical-properties';
import { type GalacticObjectLocator } from '../generation/procedural-locator';
import { type UniverseGenerationKey } from '../generation/universe-generation-key';
import { type GalaxySectorObjectLocation } from '../sector/galaxy-sector-object-location';
import { isGalacticNucleusLocator } from '../universe/galactic-center';

/**
 * 27.2 — optional Ground Truth specialization of an ALREADY EXISTING galactic
 * object locator. It must never replace the reserved central nucleus (27.3).
 * No accretion, spin, formation channel, detection or observations are inferred.
 */
export class IntermediateMassBlackHole extends GalacticObject {
  constructor(
    generationKey: UniverseGenerationKey,
    locator: GalacticObjectLocator,
    location: GalaxySectorObjectLocation,
    readonly physicalProperties: IntermediateMassBlackHolePhysicalProperties,
  ) {
    super(generationKey, locator, location);
    if (isGalacticNucleusLocator(locator)) {
      throw new RangeError('The reserved galactic nucleus cannot be an intermediate-mass black hole.');
    }
    if (!(physicalProperties instanceof IntermediateMassBlackHolePhysicalProperties)) {
      throw new TypeError('An intermediate-mass black hole requires validated physical properties.');
    }
    Object.freeze(this);
  }
}
