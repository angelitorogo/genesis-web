import { formatCatalogRadiusKm, formatCatalogTemperatureCelsius } from './galaxy-knowledge-catalog-units';

describe('Persistent knowledge explorer — presentation units', () => {
  it('converts planetary and lunar radii from Earth radii to kilometers', () => {
    expect(formatCatalogRadiusKm(1, 'earth-radii')).toBe('6.371 km');
    expect(formatCatalogRadiusKm(1.02, 'earth-radii')).toBe('6.498,42 km');
    expect(formatCatalogRadiusKm(0.27, 'earth-radii')).toBe('1.720,17 km');
  });

  it('expresses cluster and nebula radii in km using compact scientific notation', () => {
    const expected = (3.085677581491367e13).toLocaleString('es-ES', {
      notation: 'scientific', maximumFractionDigits: 3,
    });
    expect(formatCatalogRadiusKm(1, 'parsecs')).toBe(`${expected} km`);
    expect(formatCatalogRadiusKm(0, 'parsecs')).toBe('0 km');
  });

  it('converts Kelvin to Celsius without modifying the scientific source', () => {
    expect(formatCatalogTemperatureCelsius(289)).toBe('15,85 °C');
    expect(formatCatalogTemperatureCelsius(273.15)).toBe('0 °C');
    expect(formatCatalogTemperatureCelsius(40.435)).toBe('-232,72 °C');
    expect(formatCatalogTemperatureCelsius(10_000, 0)).toBe('9.727 °C');
  });

  it('preserves unresolved values instead of fabricating a numerical measurement', () => {
    expect(formatCatalogRadiusKm(null, 'earth-radii')).toBeUndefined();
    expect(formatCatalogRadiusKm(Number.NaN, 'parsecs')).toBeUndefined();
    expect(formatCatalogTemperatureCelsius(null)).toBeUndefined();
    expect(formatCatalogTemperatureCelsius(Number.POSITIVE_INFINITY)).toBeUndefined();
  });
});
