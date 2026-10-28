import { describe, expect, it } from 'vitest';
import { Vida1CompactFiche, type Vida1SourceSection } from './vida-1-compact-fiche';

const section = (id: string, pairs: readonly (readonly [string, string])[]): Vida1SourceSection => ({
  id,
  fields: pairs.map(([label, value]) => ({ label, value })),
});

describe('VIDA.1 — proyección mínima sin modificar física', () => {
  it('conserva los datos planetarios, incluida composición para revisar O₂ en VIDA.5', () => {
    const input = [
      section('general', [['Tipo planetario','Oceánico'], ['Masa','1,39 M⊕']]),
      section('orbit', [['Semieje mayor','0,27 UA']]),
      section('climate', [['Temperatura superficial media','311,3 K']]),
      section('surface', [['Agua líquida superficial','Océano global']]),
      section('atmosphere', [['Presión superficial gaseosa','12,69 bar'], ['Composición dominante','N₂ 77,5 % · O₂ 2,4 %']]),
      section('moons', [['Satélites naturales','0']]),
    ];
    const result = Vida1CompactFiche.planet(input);
    expect(result.map(item => item.id)).toEqual(['general','orbit','environment','moons','comparison']);
    expect(result.flatMap(item => item.facts).find(f => f.label === 'Agua líquida superficial (modelo)')?.value).toBe('Océano global');
    expect(result.flatMap(item => item.facts).find(f => f.label === 'Composición atmosférica')?.value).toContain('O₂ 2,4 %');
    expect(JSON.stringify(input)).not.toContain('VIDA.');
  });

  it('no convierte un océano interior lunar en océano superficial ni crea vida', () => {
    const result = Vida1CompactFiche.moon([
      section('environment', [
        ['Agua','Posible océano subsuperficial'],
        ['Océano CT-0 del universo simulado (32.F.2c)', 'No resuelto por el dominio físico actual'],
      ]),
      section('habitability', [['Índice global','1']]),
    ]);
    expect(result.flatMap(item => item.facts).find(f => f.label === 'Océano interior (modelo CT-0)')?.value)
      .toBe('No resuelto por el dominio físico actual');
    expect(JSON.stringify(result)).not.toContain('Índice global');
    expect(JSON.stringify(result)).not.toContain('vida presente');
  });

  it('mantiene desconocidos los campos ausentes, nunca los rellena con cero ni datos inventados', () => {
    const result = Vida1CompactFiche.planet([]);
    expect(result.flatMap(item => item.facts).every(item => item.value === 'No determinado')).toBe(true);
  });


  it('restituye las seis magnitudes relativas originales para planetas y lunas, sin recalcular física', () => {
    const original = [
      section('comparison', [
        ['Radio relativo', '0,183 × el radio terrestre'],
        ['Masa relativa', '0,003 × la masa terrestre'],
        ['Área superficial relativa', '0,033 × la superficie terrestre'],
        ['Volumen relativo', '0,006 × el volumen terrestre'],
        ['Densidad relativa', '0,49 × la densidad media terrestre'],
        ['Gravedad superficial relativa', '0,096 × la gravedad terrestre'],
      ]),
    ];
    for (const projection of [Vida1CompactFiche.planet(original), Vida1CompactFiche.moon(original)]) {
      const comparison = projection.find(s => s.id === 'comparison');
      expect(comparison?.title).toBe('Comparación con la Tierra');
      expect(comparison?.facts.map(f => f.label)).toEqual([
        'Radio relativo', 'Masa relativa', 'Área superficial relativa',
        'Volumen relativo', 'Densidad relativa', 'Gravedad superficial relativa',
      ]);
      expect(comparison?.facts[0]?.value).toBe('0,183 × el radio terrestre');
      expect(comparison?.facts[3]?.value).toBe('0,006 × el volumen terrestre');
    }
    expect(Vida1CompactFiche.moon([]).find(s => s.id === 'comparison')?.facts[0]?.value)
      .toBe('No determinado');
  });

  it('separa planetas y lunas, sin arrastrar radiación, geoquímica o historia', () => {
    const source = [section('radiation', [['Dosis ionizante','100']]), section('geochemistry', [['Potencia química','1']])];
    expect(JSON.stringify(Vida1CompactFiche.planet(source))).not.toContain('Dosis ionizante');
    expect(JSON.stringify(Vida1CompactFiche.moon(source))).not.toContain('Potencia química');
    expect(Vida1CompactFiche.moon(source).map(s => s.id)).toEqual(['general','orbit','environment','comparison']);
  });
});
