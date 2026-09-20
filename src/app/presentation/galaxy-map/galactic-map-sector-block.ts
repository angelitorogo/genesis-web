import { GalaxySectorCoordinates } from '../../domain/sector/galaxy-sector-coordinates';
import { type GalaxySectorGrid } from '../../domain/sector/galaxy-sector-grid';
import { type GalacticMapSectorSelection } from './galactic-map-sector-selection';

export interface GalacticMapSectorBlockPlan {
  readonly size: number;
  readonly total: number;
  readonly skipped: number;
  readonly pending: readonly GalaxySectorCoordinates[];
}

/** Address-only, bounded plan: never generates the hidden contents of a sector. */
export function planGalacticMapSectorBlock(
  grid: GalaxySectorGrid,
  anchor: GalacticMapSectorSelection,
  size: number,
  explored: readonly GalaxySectorCoordinates[],
): GalacticMapSectorBlockPlan {
  if (!Number.isInteger(size) || size < 1 || size > 10) {
    throw new RangeError('La exploración por bloques debe estar entre 1×1 y 10×10.');
  }
  if (!grid.contains(anchor.coordinates) ||
    grid.sectorKeyFor(anchor.coordinates) !== anchor.sectorKey) {
    throw new RangeError('El sector seleccionado no pertenece a la cuadrícula activa.');
  }
  if (anchor.coordinates.x + size - 1 > grid.maxCoordinate ||
    anchor.coordinates.y + size - 1 > grid.maxCoordinate) {
    throw new RangeError('El bloque sale de los límites de la galaxia. Selecciona otro sector como esquina inicial.');
  }
  const already = new Set(explored.map(item => `${item.x}:${item.y}`));
  const pending: GalaxySectorCoordinates[] = [];
  let skipped = 0;
  for (let y = anchor.coordinates.y; y < anchor.coordinates.y + size; y++) {
    for (let x = anchor.coordinates.x; x < anchor.coordinates.x + size; x++) {
      const key = `${x}:${y}`;
      if (already.has(key)) {
        skipped++;
      } else {
        pending.push(new GalaxySectorCoordinates(x, y));
      }
    }
  }
  return Object.freeze({ size, total: size * size, skipped, pending: Object.freeze(pending) });
}
