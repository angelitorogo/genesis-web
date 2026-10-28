import { formatCatalogOrbitalPeriodDays, formatCatalogRadiusKm, formatCatalogTemperatureCelsius } from './galaxy-knowledge-catalog-units';

describe('Persistent knowledge explorer — presentation units', () => {
  it('converts planetary and lunar radii from Earth radii to kilometers', () => {
    expect(formatCatalogRadiusKm(1, 'earth-radii')).toBe('6.371 km');
    expect(formatCatalogRadiusKm(1.02, 'earth-radii')).toBe('6.498,42 km');
    expect(formatCatalogRadiusKm(0.27, 'earth-radii')).toBe('1.720,17 km');
  });

  it('formats planetary and lunar radii without decimals when requested', () => {
    expect(formatCatalogRadiusKm(1.02, 'earth-radii', 0)).toBe('6.498 km');
    expect(formatCatalogRadiusKm(0.27, 'earth-radii', 0)).toBe('1.720 km');
  });

  it('formats orbital periods as whole days, preserving sub-day orbits', () => {
    expect(formatCatalogOrbitalPeriodDays(5.52)).toBe('6 días');
    expect(formatCatalogOrbitalPeriodDays(2.79)).toBe('3 días');
    expect(formatCatalogOrbitalPeriodDays(0.25)).toBe('< 1 día');
    expect(formatCatalogOrbitalPeriodDays(1)).toBe('1 día');
    expect(formatCatalogOrbitalPeriodDays(0)).toBe('0 días');
    expect(formatCatalogOrbitalPeriodDays(null)).toBeUndefined();
  });

  it('converts orbital periods to years, months and days with Spanish singular/plural', () => {
    expect(formatCatalogOrbitalPeriodDays(29)).toBe('29 días');
    expect(formatCatalogOrbitalPeriodDays(30)).toBe('1 mes');
    expect(formatCatalogOrbitalPeriodDays(31)).toBe('1 mes y 1 día');
    expect(formatCatalogOrbitalPeriodDays(60)).toBe('1 mes y 30 días');
    expect(formatCatalogOrbitalPeriodDays(61)).toBe('2 meses');
    expect(formatCatalogOrbitalPeriodDays(91)).toBe('3 meses');
    expect(formatCatalogOrbitalPeriodDays(364)).toBe('11 meses y 29 días');
    expect(formatCatalogOrbitalPeriodDays(365)).toBe('1 año');
    expect(formatCatalogOrbitalPeriodDays(366)).toBe('1 año y 1 día');
    expect(formatCatalogOrbitalPeriodDays(395)).toBe('1 año y 1 mes');
    expect(formatCatalogOrbitalPeriodDays(480)).toBe('1 año, 3 meses y 24 días');
    expect(formatCatalogOrbitalPeriodDays(760)).toBe('2 años y 1 mes');
  });

  it('rounds the total duration once and never changes its source value', () => {
    const originalDays = 480.49;
    expect(formatCatalogOrbitalPeriodDays(originalDays)).toBe('1 año, 3 meses y 24 días');
    expect(originalDays).toBe(480.49);
    expect(formatCatalogOrbitalPeriodDays(364.51)).toBe('1 año');
    expect(formatCatalogOrbitalPeriodDays(89_620_014)).toBe('245.534 años, 3 meses y 13 días');
    expect(formatCatalogOrbitalPeriodDays(Number.NaN)).toBeUndefined();
    expect(formatCatalogOrbitalPeriodDays(Number.POSITIVE_INFINITY)).toBeUndefined();
    expect(formatCatalogOrbitalPeriodDays(-1)).toBeUndefined();
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
    expect(formatCatalogTemperatureCelsius(289, 0)).toBe('16 °C');
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
