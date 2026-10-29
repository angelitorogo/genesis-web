/** Fase 37.B: escucha regional anónima, sin identidades ni descubrimientos nuevos.
 * 10×10 es una regla de alcance de GENESIS, no una ley de propagación de radio.
 */
import { GalaxySectorCoordinates } from '../../domain/sector/galaxy-sector-coordinates';
import type { GalaxySectorGrid } from '../../domain/sector/galaxy-sector-grid';

export const REGIONAL_SIGNAL_SIDE_37B = 10;
export type RegionalSignalStatus37b = 'DETECTED' | 'NO_SIGNAL' | 'INCOMPLETE';

/** La galaxia se divide en bloques estables 10×10 (misma zona = mismo
 * resultado). El borde desplaza el último bloque sin salir de la malla.
 * Se evita así reexaminar los mismos mundos al pulsar sectores vecinos. */
export function regionalSectorWindow37b(
  grid: GalaxySectorGrid,
  center: GalaxySectorCoordinates,
): readonly GalaxySectorCoordinates[] {
  if (!grid.contains(center)) throw new RangeError('Sector central fuera de la galaxia');
  const width = Math.min(REGIONAL_SIGNAL_SIDE_37B, 2 * grid.halfExtentInSectors + 1);
  const startX = Math.max(grid.minCoordinate,
    Math.min(Math.floor(center.x / REGIONAL_SIGNAL_SIDE_37B) * REGIONAL_SIGNAL_SIDE_37B, grid.maxCoordinate - width + 1));
  const startY = Math.max(grid.minCoordinate,
    Math.min(Math.floor(center.y / REGIONAL_SIGNAL_SIDE_37B) * REGIONAL_SIGNAL_SIDE_37B, grid.maxCoordinate - width + 1));
  const cells: GalaxySectorCoordinates[] = [];
  for (let x = startX; x < startX + width; x++) {
    for (let y = startY; y < startY + width; y++) {
      cells.push(new GalaxySectorCoordinates(x, y));
    }
  }
  return Object.freeze(cells);
}

/** El único resultado permitido cruza el límite Worker/UI sin identificar
 * planeta, sistema, especie, coordenadas de origen ni número de civilizaciones. */
export function regionalSignalStatus37b(
  veryAdvancedFound: boolean,
  errorCount: number,
): RegionalSignalStatus37b {
  if (veryAdvancedFound) return 'DETECTED';
  return errorCount > 0 ? 'INCOMPLETE' : 'NO_SIGNAL';
}

export interface RegionalSignalRequest37b {
  readonly seed: string;
  readonly version: number;
  readonly galaxyIndex: string;
  readonly centerX: number;
  readonly centerY: number;
}

export type RegionalSignalWorkerReply37b =
  | Readonly<{ kind: 'complete'; status: RegionalSignalStatus37b }>
  | Readonly<{ kind: 'error'; message: string }>;
