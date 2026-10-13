/** Presentation-only units for every planetary fiche. Never mutate model quantities. */
export const PLANET_EARTH_MEAN_RADIUS_KM = 6371;
export const PLANET_ASTRONOMICAL_UNIT_KM = 149_597_870.7;
export const PLANET_EARTH_REFERENCE_PRESSURE_PA = 101_325;

function es(value: number, maximumFractionDigits = 3): string {
  return value.toLocaleString('es-ES', { maximumFractionDigits, useGrouping: true });
}

export function planetRadiusKilometers(radiusEarth: number | null): string {
  return radiusEarth === null || !Number.isFinite(radiusEarth)
    ? 'No determinado'
    : `${es(radiusEarth * PLANET_EARTH_MEAN_RADIUS_KM, 2)} km`;
}

export function planetOrbitAuAndKilometers(au: number | null): string {
  return au === null || !Number.isFinite(au)
    ? 'No determinado'
    : `${es(au, 5)} UA · ${es(au * PLANET_ASTRONOMICAL_UNIT_KM, 0)} km`;
}

export function planetRotationHoursAndDays(hours: number | null): string {
  return hours === null || !Number.isFinite(hours)
    ? 'No determinado'
    : `${es(hours, 3)} h · ${es(hours / 24, 3)} días`;
}

export function planetPressurePaBarEarth(pa: number | null): string {
  return pa === null || !Number.isFinite(pa)
    ? 'No determinado'
    : `${es(pa, 2)} Pa · ${es(pa / 100_000, 5)} bar · ${es(pa / PLANET_EARTH_REFERENCE_PRESSURE_PA, 5)} × presión terrestre`;
}

export function planetTemperatureKelvinCelsius(k: number | null): string {
  return k === null || !Number.isFinite(k)
    ? 'No determinado'
    : `${es(k, 2)} K · ${es(k - 273.15, 2)} °C`;
}

/** Temperature differences have identical numeric magnitudes in K and °C; display only °C. */
export function planetTemperatureDifference(k: number | null): string {
  return k === null || !Number.isFinite(k)
    ? 'No determinado'
    : `${es(k, 2)} °C de variación`;
}

export function planetNormalizedPercent(value01: number | null): string {
  if (value01 === null || !Number.isFinite(value01)) return 'No evaluable';
  const percent = value01 * 100;
  if (percent > 0 && percent < 0.001) return '<0,001 %';
  return `${es(percent, 3)} %`;
}
