/** Presentation-only units for the persistent-knowledge explorer. Scientific snapshots remain unchanged. */
const EARTH_MEAN_RADIUS_KM = 6_371;
const PARSEC_KM = 3.085677581491367e13;

export function formatCatalogRadiusKm(
  radius: number | null,
  sourceUnit: 'earth-radii' | 'parsecs',
): string | undefined {
  if (radius === null || !Number.isFinite(radius)) return undefined;
  const kilometers = radius * (sourceUnit === 'earth-radii' ? EARTH_MEAN_RADIUS_KM : PARSEC_KM);
  if (!Number.isFinite(kilometers)) return undefined;
  // Cluster and nebula radii in parsecs would otherwise occupy the whole table.
  const label = Math.abs(kilometers) >= 1e9
    ? kilometers.toLocaleString('es-ES', { notation: 'scientific', maximumFractionDigits: 3 })
    : kilometers.toLocaleString('es-ES', { maximumFractionDigits: 2, useGrouping: true });
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
