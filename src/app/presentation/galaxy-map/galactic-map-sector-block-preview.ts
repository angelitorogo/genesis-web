import { GalaxySectorCoordinates } from '../../domain/sector/galaxy-sector-coordinates';
import { type GalacticMapExplorationCoverage } from './galactic-map-exploration-coverage';
import { planGalacticMapSectorBlock } from './galactic-map-sector-block';
import { type GalacticMapSectorSelection } from './galactic-map-sector-selection';

export interface GalacticMapSectorBlockPreviewCell {
  readonly coordinates: GalaxySectorCoordinates;
  readonly explored: boolean;
}

export interface GalacticMapSectorBlockPreview {
  readonly anchor: GalacticMapSectorSelection;
  readonly size: number;
  readonly total: number;
  readonly valid: boolean;
  readonly skipped: number;
  readonly pending: number;
  readonly cells: readonly GalacticMapSectorBlockPreviewCell[];
}

/** Pure cartographic address preview; neither procedural generation nor persistence. */
export function previewGalacticMapSectorBlock(
  coverage: GalacticMapExplorationCoverage,
  anchor: GalacticMapSectorSelection,
  size: number,
): GalacticMapSectorBlockPreview {
  const grid = coverage.grid;
  if (!Number.isInteger(size) || size < 1 || size > 10) {
    throw new RangeError('El tamaño de vista previa debe estar entre 1 y 10.');
  }
  if (!grid.contains(anchor.coordinates) ||
    grid.sectorKeyFor(anchor.coordinates) !== anchor.sectorKey) {
    throw new RangeError('El sector del cursor no pertenece a la cuadrícula activa.');
  }

  const valid = anchor.coordinates.x + size - 1 <= grid.maxCoordinate &&
    anchor.coordinates.y + size - 1 <= grid.maxCoordinate;
  const exploredKeys = new Set(
    coverage.exploredSectors.map(sector => `${sector.x}:${sector.y}`),
  );
  const cells: GalacticMapSectorBlockPreviewCell[] = [];
  for (let y = anchor.coordinates.y; y < anchor.coordinates.y + size; y++) {
    for (let x = anchor.coordinates.x; x < anchor.coordinates.x + size; x++) {
      // Show only real cells at the edge: imaginary out-of-grid sectors are never projected.
      if (x > grid.maxCoordinate || y > grid.maxCoordinate) continue;
      const coordinates = new GalaxySectorCoordinates(x, y);
      cells.push(Object.freeze({
        coordinates,
        explored: exploredKeys.has(`${x}:${y}`),
      }));
    }
  }
  // Reuse the authoritative batch planner for all valid previews.
  const plan = valid
    ? planGalacticMapSectorBlock(grid, anchor, size, coverage.exploredSectors)
    : null;
  const skipped = plan?.skipped ?? 0;
  return Object.freeze({
    anchor, size, total: size * size, valid, skipped,
    pending: plan?.pending.length ?? 0,
    cells: Object.freeze(cells),
  });
}
