import { formatMinorMoonNumber, formatMinorMoonRadius, minorMoonDynamicStateLabel } from './minor-moon-scenario-format-pre33-10a';

describe('PRE-33.10a — formato de escenarios lunares', () => {
  it('presenta una masa minúscula sin redondearla a cero ni volcar decimales', () => {
    expect(formatMinorMoonNumber(0.0000016198858311689724)).toBe('1,620 × 10⁻⁶');
    expect(formatMinorMoonNumber(12.02030371210795)).toBe('12,02');
  });
  it('acompaña el radio terrestre condicional de una equivalencia en km', () => {
    expect(formatMinorMoonRadius(0.013222426811642455)).toContain('84,24 km');
    expect(formatMinorMoonRadius(null)).toBe('No evaluable');
  });
  it('diferencia datos no evaluables de valores nulos y localiza estados internos', () => {
    expect(formatMinorMoonNumber(null)).toBe('No evaluable');
    expect(formatMinorMoonNumber(0)).toBe('0');
    expect(formatMinorMoonNumber(Infinity)).toBe('No evaluable');
    expect(minorMoonDynamicStateLabel('CONDITIONAL_BOUNDS')).not.toContain('CONDITIONAL_BOUNDS');
    expect(minorMoonDynamicStateLabel('OUTSIDE_ORBITAL_DOMAIN')).toContain('dominio');
  });
});
