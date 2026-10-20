import { MoonPhysicalProperties } from '../../domain/planetary/moon-physical-properties';
import { MoonSeed } from '../../domain/seed/hierarchical-seeds';
import { PlanetType } from '../../domain/planetary/planet-type';
import { MoonFormationInventoryEngine32F1d } from '../../simulation/planetary/moon-formation-inventory-engine-32-f-1d';
import { MoonWaterPhaseBalanceEngine32F2a } from '../../simulation/planetary/moon-water-phase-balance-32-f-2a';
import { lunarWaterPhaseFields32F2a } from './moon-scientific-sections';

describe('32.F.2a — presentación lunar sin promoción de escenarios a evidencia', () => {
  const fields = (temperature: number) => {
    const moon = new MoonPhysicalProperties(2, 1, .001, .14, 1.65, .05);
    const inventory = MoonFormationInventoryEngine32F1d.fromMaterialized(
      moon, new MoonSeed('00000000000000000000000000000041'), PlanetType.GAS_GIANT);
    const balance = MoonWaterPhaseBalanceEngine32F2a.fromMaterialized(moon, inventory, temperature);
    return lunarWaterPhaseFields32F2a(balance);
  };
  it('no publica datos de formación en fichas sin escenario disponible', () => {
    expect(lunarWaterPhaseFields32F2a(null)).toEqual([]);
  });
  it('presenta hielo-vapor y advierte que no demuestra hielo superficial real', () => {
    const cold = fields(235.7);
    expect(cold.find(f => f.label === 'Balance hipotético de fases H₂O (32.F.2a)')?.note)
      .toContain('hielo');
    expect(cold.find(f => f.label === 'Distribución real hielo / líquido / vapor')?.value)
      .toBe('No resuelta');
    expect(cold.find(f => f.label === 'Inventario H₂O de formación (escenario 32.F.2a)')?.note)
      .toContain('NO es masa de océano');
  });
  it('presenta líquido-vapor como equilibrio CON confinamiento supuesto, no agua confirmada', () => {
    const warm = fields(301.7);
    expect(warm.find(f => f.label === 'Balance hipotético de fases H₂O (32.F.2a)')?.note)
      .toContain('confinamiento externo');
    expect(warm.find(f => f.label === 'Distribución real hielo / líquido / vapor')?.value)
      .toBe('No resuelta');
  });
});
