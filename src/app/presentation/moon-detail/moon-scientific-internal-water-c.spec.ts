import { type MoonInternalWaterAssessment } from '../../domain/planetary/moon-internal-water-assessment';
import { lunarInternalWaterFields } from './moon-scientific-sections';

function assessment(overrides: Partial<MoonInternalWaterAssessment> = {}): MoonInternalWaterAssessment {
  return {
    basis: 'ECCENTRICITY_TIDES_BOUNDED_SCENARIO',
    tidalHeatFluxMinimumWattsPerSquareMeter: 1e-6,
    tidalHeatFluxMaximumWattsPerSquareMeter: 0.1,
    conductiveShellThicknessMinimumKilometers: 4,
    conductiveShellThicknessMaximumKilometers: 400,
    iceShellThermalRegime: 'CONDITIONAL_ICE_OCEAN',
    cryovolcanism: 'CONDITIONAL',
    radiogenicHeatResolved: false,
    oceanConfirmed: false,
    ...overrides,
  };
}

function findValue(a: MoonInternalWaterAssessment, label: string): string | undefined {
  return lunarInternalWaterFields(a).find(field => field.label === label)?.value;
}

describe('C — presentación termodinámica condicional lunar', () => {
  it('exposes an uncertainty bounded flux and cryovolcanism without claiming a confirmed ocean', () => {
    const model = assessment();
    expect(findValue(model, 'Flujo de calentamiento mareal (escenario)')).toContain('W/m²');
    expect(findValue(model, 'Viabilidad térmica del hielo y océano')).toContain('no confirmado');
    expect(findValue(model, 'Criovulcanismo')).toBe('Posible (escenario)');
    expect(findValue(model, 'Calor radiogénico y propiedades del hielo')).toBe('No resueltos');
    expect(model.oceanConfirmed).toBe(false);
  });

  it('does not show zero heat or crust thickness for an unsynchronized moon with an unresolved flux', () => {
    const model = assessment({
      tidalHeatFluxMinimumWattsPerSquareMeter: null,
      tidalHeatFluxMaximumWattsPerSquareMeter: null,
      conductiveShellThicknessMinimumKilometers: null,
      conductiveShellThicknessMaximumKilometers: null,
      iceShellThermalRegime: 'NOT_EVALUABLE_NON_SYNCHRONOUS',
      cryovolcanism: 'NOT_EVALUABLE',
    });
    expect(findValue(model, 'Flujo de calentamiento mareal (escenario)')).toBe('No evaluable');
    expect(findValue(model, 'Espesor conductivo de hielo (escenario)')).toBe('No determinado');
    expect(findValue(model, 'Criovulcanismo')).toBe('No evaluable');
  });

  it('does not expose optional scientific scenario fields for an old or unavailable source', () => {
    expect(lunarInternalWaterFields(null)).toEqual([]);
  });
});
