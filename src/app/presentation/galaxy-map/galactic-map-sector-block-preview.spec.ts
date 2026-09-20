import { GeneratorVersion } from '../../domain/generation/generator-version';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { GalaxySectorCoordinates } from '../../domain/sector/galaxy-sector-coordinates';
import { GalaxySectorGrid } from '../../domain/sector/galaxy-sector-grid';
import { GalacticMapExplorationCoverage } from './galactic-map-exploration-coverage';
import { previewGalacticMapSectorBlock } from './galactic-map-sector-block-preview';

const key = new UniverseGenerationKey(
  UniverseSeed.parse('B10C-0000-0000-0000-0000-0000-0000-0003'), GeneratorVersion.V2,
);
const grid = new GalaxySectorGrid(key, 0n, 1, 20);
const explored = [new GalaxySectorCoordinates(0, 0), new GalaxySectorCoordinates(1, 0)];
const coverage = new GalacticMapExplorationCoverage(key, 0n, grid, explored);
function anchor(x: number, y: number) {
  const coordinates = new GalaxySectorCoordinates(x, y);
  return { coordinates, sectorKey: grid.sectorKeyFor(coordinates), explored: false };
}

describe('Vista previa cartográfica de exploración por bloques', () => {
  it('marca exactamente la celda 1×1 bajo el cursor, sin alterar cobertura ni persistencia', () => {
    const before = coverage.exploredSectorCount;
    const result = previewGalacticMapSectorBlock(coverage, anchor(0, 0), 1);
    expect(result).toMatchObject({ size: 1, total: 1, valid: true, skipped: 1, pending: 0 });
    expect(result.cells).toEqual([{ coordinates: new GalaxySectorCoordinates(0, 0), explored: true }]);
    expect(coverage.exploredSectorCount).toBe(before);
  });

  it('para cada tamaño 2..10 coincide con la planificación real, incluida su esquina inicial', () => {
    for (let size = 2; size <= 10; size++) {
      const result = previewGalacticMapSectorBlock(coverage, anchor(0, 0), size);
      expect(result.total).toBe(size * size);
      expect(result.cells).toHaveLength(size * size);
      expect(result.skipped).toBe(2);
      expect(result.pending).toBe(size * size - 2);
      expect(result.cells[0].coordinates).toEqual(new GalaxySectorCoordinates(0, 0));
      expect(result.cells.at(-1)?.coordinates).toEqual(new GalaxySectorCoordinates(size - 1, size - 1));
    }
  });

  it('recorta la vista al borde e informa que NO se puede confirmar un bloque parcial', () => {
    const result = previewGalacticMapSectorBlock(coverage, anchor(20, 20), 4);
    expect(result).toMatchObject({ valid: false, size: 4, total: 16, pending: 0 });
    expect(result.cells).toHaveLength(1);
  });

  it('rechaza un ancla con identidad manipulada y tamaños falsos', () => {
    expect(() => previewGalacticMapSectorBlock(coverage,
      { ...anchor(0, 0), sectorKey: 999n }, 2)).toThrow();
    for (const size of [0, 11, 1.5, NaN]) {
      expect(() => previewGalacticMapSectorBlock(coverage, anchor(0, 0), size)).toThrow();
    }
  });
});
