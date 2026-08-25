import {
  type GalacticObjectLocator,
} from '../generation/procedural-locator';

import {
  type GalaxySectorCoordinates,
} from '../sector/galaxy-sector-coordinates';

/**
 * Frozen galactic-centre addressing contract.
 *
 * Sector coordinates (0, 0) are reserved for the physical galactic centre in
 * every galaxy. GalacticObject index 0 inside that sector is the persistent
 * procedural identity of the nucleus representation.
 *
 * This is deliberately a domain-level address rule so rendering, exploration,
 * archive regeneration and scientific specialization all agree on the same
 * target without introducing renderer-specific exceptions.
 */
export const GALACTIC_CENTER_SECTOR_X =
  0;

export const GALACTIC_CENTER_SECTOR_Y =
  0;

export const GALACTIC_NUCLEUS_OBJECT_INDEX =
  0n;

export function isGalacticCenterCoordinates(
  coordinates:
    Pick<GalaxySectorCoordinates, 'x' | 'y'>,
): boolean {
  return (
    coordinates.x ===
      GALACTIC_CENTER_SECTOR_X &&
    coordinates.y ===
      GALACTIC_CENTER_SECTOR_Y
  );
}

export function isGalacticNucleusLocator(
  locator:
    GalacticObjectLocator,
): boolean {
  return (
    locator.sectorKey ===
      0n &&
    locator.galacticObjectIndex ===
      GALACTIC_NUCLEUS_OBJECT_INDEX
  );
}
