import { MoonPhysicalProperties } from '../../domain/planetary/moon-physical-properties';
import { MoonSeed } from '../../domain/seed/hierarchical-seeds';
import { PlanetType } from '../../domain/planetary/planet-type';
import { MoonFormationInventoryEngine32F1d } from '../../simulation/planetary/moon-formation-inventory-engine-32-f-1d';
import { MoonWaterPhaseBalanceEngine32F2a } from '../../simulation/planetary/moon-water-phase-balance-32-f-2a';
import { MoonInteriorStructureEngine32F2b } from '../../simulation/planetary/moon-interior-structure-engine-32-f-2b';
import { lunarInteriorStructureFields32F2b } from './moon-scientific-sections';

describe('32.F.2b — proyección lunar de estructura SIN océanos inventados', () => {
  it('no divulga campos de estructura cuando el productor no existe', () => {
    expect(lunarInteriorStructureFields32F2b(null)).toEqual([]);
  });
  it('presenta presiones litostáticas y fases hipotéticas, nunca océano actual', () => {
    const physical = new MoonPhysicalProperties(8, 3, .001, .14, 1.85, .05);
    const formation = MoonFormationInventoryEngine32F1d.fromMaterialized(physical,
      new MoonSeed('00000000000000000000000000000019'), PlanetType.GAS_GIANT);
    const water = MoonWaterPhaseBalanceEngine32F2a.fromMaterialized(physical, formation, 235.7);
    const interior = MoonInteriorStructureEngine32F2b.fromMaterialized(
      physical, formation, water, {
        basis: 'ECCENTRICITY_TIDES_BOUNDED_SCENARIO',
        tidalHeatFluxMinimumWattsPerSquareMeter: .00001,
        tidalHeatFluxMaximumWattsPerSquareMeter: .001,
        conductiveShellThicknessMinimumKilometers: null,
        conductiveShellThicknessMaximumKilometers: null,
        iceShellThermalRegime: 'CONDITIONAL_ICE_OCEAN',
        cryovolcanism: 'NOT_EVALUABLE', radiogenicHeatResolved: false, oceanConfirmed: false,
      }, 235.7);
    const fields = lunarInteriorStructureFields32F2b(interior);
    expect(fields.find(f => f.label === 'Estructura diferenciada (escenario 32.F.2b)')?.note)
      .toContain('NO capas observadas');
    expect(fields.find(f => f.label === 'Presión litostática central (escenario 32.F.2b)')?.note)
      .toContain('presión atmosférica');
    expect(fields.find(f => f.label === 'Océano actual y salinidad')?.value)
      .toBe('Desconocidos');
    expect(fields.find(f => f.label === 'Espesor y líquido internos (escenarios 32.F.2b)')?.note)
      .toContain('No es una distribución actual');
  });
});
