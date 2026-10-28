/** Presentation-only units for the persistent-knowledge explorer. Scientific snapshots remain unchanged. */
const EARTH_MEAN_RADIUS_KM = 6_371;
const PARSEC_KM = 3.085677581491367e13;

export function formatCatalogRadiusKm(
  radius: number | null,
  sourceUnit: 'earth-radii' | 'parsecs',
  maximumFractionDigits = 2,
): string | undefined {
  if (radius === null || !Number.isFinite(radius)) return undefined;
  const kilometers = radius * (sourceUnit === 'earth-radii' ? EARTH_MEAN_RADIUS_KM : PARSEC_KM);
  if (!Number.isFinite(kilometers)) return undefined;
  // Cluster and nebula radii in parsecs would otherwise occupy the whole table.
  const label = Math.abs(kilometers) >= 1e9
    ? kilometers.toLocaleString('es-ES', { notation: 'scientific', maximumFractionDigits: 3 })
    : kilometers.toLocaleString('es-ES', { maximumFractionDigits, useGrouping: true });
  return `${label} km`;
}

export function formatCatalogTemperatureCelsius(
  kelvin: number | null,
  maximumFractionDigits = 2,
): string | undefined {
  if (kelvin === null || !Number.isFinite(kelvin)) return undefined;
  // Neutralize binary floating-point noise before formatting Celsius to hundredths.
  const celsius = Number((kelvin - 273.15).toFixed(6));
  // Avoid displaying negative zero when a value rounds to 0 °C.
  const present = Math.abs(celsius) < 0.5 * 10 ** (-maximumFractionDigits) ? 0 : celsius;
  return `${present.toLocaleString('es-ES', { maximumFractionDigits, useGrouping: true })} °C`;
}

/**
 * Duración orbital compacta para los catálogos de planetas y lunas.
 * Año convencional = 365 días; 12 meses medios de 365/12 días.
 * Es una presentación aproximada, sin calendario ni fecha de referencia.
 * La ordenación y los filtros siguen utilizando los días reales, sin redondear.
 */
export function formatCatalogOrbitalPeriodDays(days: number | null): string | undefined {
  if (days === null || !Number.isFinite(days) || days < 0) return undefined;
  if (days > 0 && days < 0.5) return '< 1 día';

  const totalDays = Math.round(days);
  if (totalDays === 0) return '0 días';

  const years = Math.floor(totalDays / 365);
  const remainderOfYear = totalDays % 365;

  // Distribuimos los 365 días entre 12 meses medios con límites enteros.
  // No se producen 12 meses en un año ni días negativos en los cambios de mes.
  let months = 0;
  while (months < 11 && remainderOfYear >= Math.round((months + 1) * 365 / 12)) {
    months += 1;
  }
  const remainingDays = remainderOfYear - Math.round(months * 365 / 12);
  const pieces: string[] = [];
  if (years > 0) {
    pieces.push(`${years.toLocaleString('es-ES')} ${years === 1 ? 'año' : 'años'}`);
  }
  if (months > 0) {
    pieces.push(`${months} ${months === 1 ? 'mes' : 'meses'}`);
  }
  if (remainingDays > 0) {
    pieces.push(`${remainingDays} ${remainingDays === 1 ? 'día' : 'días'}`);
  }
  if (pieces.length === 0) return '0 días';
  return pieces.length === 1
    ? pieces[0]
    : `${pieces.slice(0, -1).join(', ')} y ${pieces[pieces.length - 1]}`;
}
