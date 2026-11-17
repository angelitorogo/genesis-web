/** 38.6b · Display-only colony census for Section 08 of a confirmed planet fiche.
 * A missing VIDA.9 record is UNKNOWN, never the scientific claim "no colonies".
 * This module receives only counts, never a private biological payload.
 */
import type { PlanetScientificFieldModel } from './planet-scientific-sections';

export interface PlanetMoonColonizationView386b {
  readonly total: PlanetScientificFieldModel;
  readonly perMoon: ReadonlyMap<number, PlanetScientificFieldModel>;
}

function field(value: string, note: string): PlanetScientificFieldModel {
  return Object.freeze({label: 'Colonización tecnológica', value, note});
}

/** Each verified entry is a colony COUNT; null means the moon has no validated record.
 * A null map means that access is not authorized or the read is still pending.
 * moonIndices include identity-only entries; their absent records stay unknown.
 */
export function planetMoonColonizationView386b(
  moonIndices: readonly number[],
  totalNaturalMoons: number,
  verified: ReadonlyMap<number, number | null> | null,
): PlanetMoonColonizationView386b {
  const unique = [...new Set(moonIndices.filter(x => Number.isSafeInteger(x) && x >= 0))];
  const perMoon = new Map<number, PlanetScientificFieldModel>();
  let inspected = 0;
  let colonized = 0;
  for (const moonIndex of unique) {
    const count = verified?.get(moonIndex);
    if (typeof count === 'number' && Number.isSafeInteger(count) && count >= 0) {
      inspected++;
      if (count > 0) colonized++;
      perMoon.set(moonIndex, field(count === 0 ? 'Sin colonias registradas' :
        `${count} ${count === 1 ? 'colonia' : 'colonias'}`, 'VIDA.8/9 · Registro CT-0 confirmado'));
    } else {
      perMoon.set(moonIndex, field('No evaluable',
        'Sin registro VIDA.9 validado para esta luna; no implica ausencia de colonias.'));
    }
  }
  const complete = verified !== null && inspected === unique.length &&
    Number.isSafeInteger(totalNaturalMoons) && totalNaturalMoons >= 0 &&
    unique.length === totalNaturalMoons;
  const total: PlanetScientificFieldModel = Object.freeze({
    label: 'Lunas con colonias',
    value: complete ? String(colonized) : colonized > 0 ? `${colonized} ${colonized === 1 ? 'verificada' : 'verificadas'}` : 'No evaluable',
    note: complete ? 'Lunas con al menos una colonia VIDA.8; no es el número de colonias.' :
      'Recuento parcial o no disponible: faltan registros lunares VIDA.9 validados.',
  });
  return Object.freeze({total, perMoon});
}
