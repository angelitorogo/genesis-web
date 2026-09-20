import { GeneratorVersion } from '../../domain/generation/generator-version';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { GalaxySectorCoordinates } from '../../domain/sector/galaxy-sector-coordinates';
import { GalaxySectorGrid } from '../../domain/sector/galaxy-sector-grid';
import { planGalacticMapSectorBlock } from './galactic-map-sector-block';

const key = new UniverseGenerationKey(
  UniverseSeed.parse('B10C-0000-0000-0000-0000-0000-0000-0001'), GeneratorVersion.V2,
);
const grid = new GalaxySectorGrid(key, 0n, 1, 20);
function anchor(x: number, y: number, explored = false) {
  const coordinates = new GalaxySectorCoordinates(x, y);
  return { coordinates, sectorKey: grid.sectorKeyFor(coordinates), explored };
}

describe('bloques cartográficos: planificación exclusivamente por direcciones', () => {
  it('genera exactamente N×N sectores para cada mejora 2..10, sin duplicados', () => {
    for (let n = 2; n <= 10; n++) {
      const plan = planGalacticMapSectorBlock(grid, anchor(-10, -10), n, []);
      expect(plan.total).toBe(n * n);
      expect(plan.pending).toHaveLength(n * n);
      expect(new Set(plan.pending.map(item => `${item.x}:${item.y}`)).size).toBe(n * n);
      expect(plan.pending[0]).toEqual(new GalaxySectorCoordinates(-10, -10));
      expect(plan.pending.at(-1)).toEqual(new GalaxySectorCoordinates(-11 + n, -11 + n));
    }
  });

  it('omite sectores conocidos, incluido el ancla, sin inventar contenido ni PD', () => {
    const explored = [new GalaxySectorCoordinates(0, 0), new GalaxySectorCoordinates(1, 1)];
    const plan = planGalacticMapSectorBlock(grid, anchor(0, 0, true), 2, explored);
    expect(plan.skipped).toBe(2);
    expect(plan.pending).toEqual([new GalaxySectorCoordinates(1, 0), new GalaxySectorCoordinates(0, 1)]);
    expect(planGalacticMapSectorBlock(grid, anchor(0, 0, true), 2,
      [...explored, ...plan.pending]).pending).toHaveLength(0);
  });

  it('rechaza tamaño falso, identidad falsa y bloques que salen de la galaxia', () => {
    for (const size of [0, 1.5, 11, Infinity, NaN]) {
      expect(() => planGalacticMapSectorBlock(grid, anchor(0, 0), size, [])).toThrow();
    }
    expect(() => planGalacticMapSectorBlock(grid,
      { ...anchor(0, 0), sectorKey: 99999n }, 2, [])).toThrow('seleccionado');
    expect(() => planGalacticMapSectorBlock(grid, anchor(20, 20), 2, [])).toThrow('límites');
  });
});
