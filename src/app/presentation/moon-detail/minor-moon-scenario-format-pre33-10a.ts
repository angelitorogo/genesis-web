/** PRE-33.10a: display of conditional minor-moon scenarios. No physical calculation. */
const SUPERSCRIPT_DIGITS: Readonly<Record<string,string>> = Object.freeze({
  '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
  '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
});
export function formatMinorMoonNumber(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return 'No evaluable';
  if (value !== 0 && Math.abs(value) < 0.0001) {
    const [mantissa, exponent] = value.toExponential(3).split('e');
    const superscript = String(Number(exponent)).replace(/[-\d]/g, digit =>
      SUPERSCRIPT_DIGITS[digit] ?? digit);
    return `${mantissa.replace('.', ',')} × 10${superscript}`;
  }
  return new Intl.NumberFormat('es-ES', { maximumSignificantDigits: 4 }).format(value);
}

export function formatMinorMoonRadius(valueEarthRadii: number | null): string {
  if (valueEarthRadii === null || !Number.isFinite(valueEarthRadii)) return 'No evaluable';
  const kilometers = valueEarthRadii * 6371;
  return `${formatMinorMoonNumber(valueEarthRadii)} R⊕ (≈ ${formatMinorMoonNumber(kilometers)} km)`;
}

export function minorMoonDynamicStateLabel(status: 'CONDITIONAL_BOUNDS' | 'OUTSIDE_ORBITAL_DOMAIN'): string {
  return status === 'CONDITIONAL_BOUNDS'
    ? 'Escenario dinámico condicional (no confirmado)'
    : 'Fuera del dominio orbital del escenario';
}
