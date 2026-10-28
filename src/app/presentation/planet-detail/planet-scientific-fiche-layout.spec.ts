import { PLANET_FICHE_FIELD_LAYOUT, PLANET_FICHE_SECTION_METADATA, unifyPlanetFicheSections } from './planet-scientific-fiche-layout';
import {
  planetRadiusKilometers, planetOrbitAuAndKilometers, planetRotationHoursAndDays,
  planetPressurePaBarEarth, planetTemperatureKelvinCelsius,
  planetTemperatureDifference, planetNormalizedPercent,
} from './planet-scientific-display-units';
import { type PlanetScientificSectionModel } from './planet-scientific-sections';

describe('Planet fiche: unified ordinary and compact scientific presentation', () => {
  const section = (id: PlanetScientificSectionModel['id'], fields: readonly { label:string;value:string;note:string|null }[]): PlanetScientificSectionModel =>
    Object.freeze({id,title:id,eyebrow:'prueba',summary:'prueba',fields:Object.freeze(fields)});
  const field = (label:string,value:string,note:string|null=null) => Object.freeze({label,value,note});

  it('keeps exactly the same field labels/order for conventional and compact origins, including unavailable values', () => {
    const conventional = Object.keys(PLANET_FICHE_FIELD_LAYOUT).map(id => section(id as PlanetScientificSectionModel['id'], [field('Masa','0,6 M⊕')]));
    const compact = Object.keys(PLANET_FICHE_FIELD_LAYOUT).map(id => section(id as PlanetScientificSectionModel['id'], [field('Rotación simulada','48 h · 2 días')]));
    const conventionalOutput = unifyPlanetFicheSections(conventional);
    const compactOutput = unifyPlanetFicheSections(compact);
    expect(conventionalOutput.map(s=>s.fields.map(f=>f.label)))
      .toEqual(compactOutput.map(s=>s.fields.map(f=>f.label)));
    expect(compactOutput[0]?.fields.find(f=>f.label==='Periodo de rotación')?.value)
      .toBe('48 h · 2 días');
    expect(compactOutput[0]?.fields.find(f=>f.label==='Radio')?.value)
      .toBe('No determinado');
    expect(conventionalOutput[3]?.fields.some(f=>f.label==='Masa molar media')).toBe(false);
    expect(conventionalOutput[5]?.fields.some(f=>f.label==='Índice de desgasificación volátil')).toBe(false);
  });

  it('preserves the existing Keplerian period when the compact source uses the accented label', () => {
    const source = section('orbit', [
      field('Semieje mayor', '0,79813 UA · 119.398.242 km'),
      field('Período orbital', '93,239 días · 0,25527 años', 'Dato orbital calculado'),
    ]);
    const projected = unifyPlanetFicheSections([source])[0]!;
    const period = projected.fields.find(item => item.label === 'Periodo orbital');
    expect(period).toEqual(field('Periodo orbital', '93,239 días · 0,25527 años', 'Dato orbital calculado'));
    expect(source.fields[1]?.label).toBe('Período orbital'); // No source mutation.
    expect(Object.isFrozen(projected.fields)).toBe(true);
  });

  it('does not silently lose scientific fields that already exist under compact-host labels', () => {
    const sources: ReadonlyArray<readonly [PlanetScientificSectionModel['id'], string, string, string]> = [
      ['general', 'Rotación simulada', 'Periodo de rotación', '48 h · 2 días'],
      ['general', 'Inclinación axial simulada', 'Inclinación axial', '2 °'],
      ['general', 'Composición interna simulada', 'Composición interna', 'núcleo 30 %'],
      ['orbit', 'Período orbital', 'Periodo orbital', '93,239 días · 0,25527 años'],
      ['orbit', 'Inclinación orbital', 'Inclinación', 'No modelada'],
      ['orbit', 'Forzamiento de marea (proxy)', 'Forzamiento de marea orbital', '0,03 %'],
      ['surface', 'Inventario de agua modelado', 'Índice de inventario de agua', '45 %'],
      ['surface', 'Fracciones hielo / líquido / vapor', 'Distribución hielo / líquido / vapor', 'No cuantificables sin masa del reservorio'],
      ['surface', 'Cobertura potencial de hielo (ilustrativa)', 'Cobertura de hielo', '12 %'],
      ['surface', 'Cobertura potencial de líquido (ilustrativa)', 'Cobertura de agua', '0 %'],
      ['atmosphere', 'Régimen gaseoso potencial', 'Régimen potencial inicial', 'Delgada'],
      ['atmosphere', 'Régimen gaseoso final', 'Régimen gaseoso actual', 'Fase gaseosa no determinada'],
      ['atmosphere', 'Presión gaseosa escenario', 'Presión superficial gaseosa', 'No determinado'],
      ['atmosphere', 'Densidad gaseosa escenario', 'Densidad de referencia', 'No determinado'],
      ['atmosphere', 'Composición gaseosa escenario', 'Composición dominante', 'No determinada'],
      ['atmosphere', 'Efecto invernadero escenario', 'Efecto invernadero', 'No determinado'],
      ['climate', 'Temperatura de equilibrio escenario', 'Temperatura de equilibrio', 'No determinado'],
      ['climate', 'Temperatura superficial escenario', 'Temperatura superficial media', 'No determinado'],
      ['climate', 'Calentamiento invernadero escenario', 'Calentamiento invernadero', 'No determinado'],
      ['climate', 'Amplitud estacional escenario', 'Amplitud estacional', 'No determinado'],
      ['climate', 'Rango térmico diurno escenario', 'Contraste térmico día/noche', 'No determinado'],
      ['climate', 'Extremos escenario', 'Extremos superficiales', 'No determinados'],
      ['climate', 'Redistribución térmica', 'Índice de redistribución de calor', 'No evaluable'],
      ['geology', 'Retención de calor interno', 'Índice de retención de calor interno', '53 %'],
      ['geology', 'Movilidad tectónica', 'Tectónica', '25 %'],
      ['geology', 'Campo magnético simulado', 'Campo magnético', 'Moderado'],
    ];
    for (const [id, sourceLabel, canonicalLabel, sourceValue] of sources) {
      const source = field(sourceLabel, sourceValue, 'Nota conservada');
      const projected = unifyPlanetFicheSections([section(id, [source])])[0]!;
      // Check the intended field, not the first field sharing a fallback
      // value such as 'No determinado' or 'No evaluable'.
      const translated = projected.fields.find(item => item.label === canonicalLabel);
      expect(translated?.value).toBe(sourceValue);
      expect(translated?.note).toBe('Nota conservada');
      expect(source.label).toBe(sourceLabel); // Projection must not mutate the source.
    }
    expect(unifyPlanetFicheSections([section('orbit', [])])[0]!.fields
      .find(item => item.label === 'Periodo orbital')?.value).toBe('No determinado');
  });


  it('VIDA.9b deja exactamente los campos solicitados y oculta los diagnósticos PRE-33 de la ficha compacta', () => {
    const labels = (id: keyof typeof PLANET_FICHE_FIELD_LAYOUT) =>
      unifyPlanetFicheSections([section(id,[
        field('PRE-33.07 — Solvente y nicho físico','no resuelto'),
        field('PRE-33.08 — Dosis ionizante','no resuelta'),
        field('PRE-33.09 — Continuidad ambiental histórica','no certificada'),
      ])])[0]!.fields.map(item=>item.label);
    expect(labels('general')).not.toContain('Duración del día');
    expect(labels('surface')).toEqual([
      'Base superficial', 'Índice de rugosidad', 'Índice de inventario de agua',
      'Agua líquida superficial', 'Distribución hielo / líquido / vapor',
      'Cobertura de hielo', 'Cobertura de agua', 'Radiación superficial',
    ]);
    expect(labels('geology')).toEqual([
      'Régimen geológico', 'Vulcanismo', 'Tectónica',
      'Índice de retención de calor interno', 'Campo magnético', 'Magnetosfera',
    ]);
    expect(labels('climate')).not.toContain('PRE-33.09 — Continuidad ambiental histórica');
  });

  it('keeps the scientific note even when its value matches the missing-field fallback', () => {
    const projected = unifyPlanetFicheSections([section('climate', [
      field('Temperatura superficial escenario', 'No determinado', 'Nota de incertidumbre conservada'),
    ])])[0]!;
    expect(projected.fields.find(item => item.label === 'Temperatura de equilibrio'))
      .toEqual(field('Temperatura de equilibrio', 'No determinado', null));
    expect(projected.fields.find(item => item.label === 'Temperatura superficial media'))
      .toEqual(field('Temperatura superficial media', 'No determinado', 'Nota de incertidumbre conservada'));
  });

  it('preserves lunar and comparison fields while unifying both headings', () => {
    const moons=section('moons',[field('Lunas con caracterización individual','2')]);
    const comparison=section('comparison',[field('Área superficial relativa','1,2 × Tierra')]);
    const projected=unifyPlanetFicheSections([moons,comparison]);
    expect(projected[0]?.fields).toBe(moons.fields);
    expect(projected[1]?.fields).toBe(comparison.fields);
    expect(projected[0]?.eyebrow).toBe('SECCIÓN 08');
    expect(projected[1]?.eyebrow).toBe('SECCIÓN 09');
  });

  it('uses exactly the same eight headings and descriptions for conventional and compact sections', () => {
    const ids = ['general','orbit','surface','atmosphere','climate','geology','moons','comparison'] as const;
    const ordinary = unifyPlanetFicheSections(ids.map(id => section(id, [field('Masa','1 M⊕')])));
    const compact = unifyPlanetFicheSections(ids.map(id => Object.freeze({
      ...section(id, [field('Masa','1 M⊕')]), eyebrow:'SNAPSHOT MODELADO · 31.4h',
      summary:'Nota de escenario compacto',
    })));
    expect(ordinary.map(s=>[s.eyebrow,s.title,s.summary]))
      .toEqual(compact.map(s=>[s.eyebrow,s.title,s.summary]));
    expect(compact.map(s=>s.eyebrow)).toEqual(ids.map(id=>PLANET_FICHE_SECTION_METADATA[id].eyebrow));
    expect(compact[4]?.summary).toBe('Balance térmico global, efecto invernadero, variabilidad y redistribución de calor.');
  });

  it('converts kilometers, periods, pressure and absolute/delta temperatures without changing scientific values',()=>{
    expect(planetRadiusKilometers(1)).toBe('6.371 km');
    expect(planetOrbitAuAndKilometers(1)).toContain('149.597.871 km');
    expect(planetRotationHoursAndDays(48)).toBe('48 h · 2 días');
    expect(planetPressurePaBarEarth(101325)).toContain('1 × presión terrestre');
    expect(planetTemperatureKelvinCelsius(273.15)).toBe('273,15 K · 0 °C');
    expect(planetTemperatureDifference(93.2)).toBe('93,2 °C de variación');
    expect(planetTemperatureDifference(8.73)).toBe('8,73 °C de variación');
    expect(planetTemperatureDifference(65.16)).toBe('65,16 °C de variación');
    expect(planetTemperatureDifference(null)).toBe('No determinado');
    expect(planetTemperatureKelvinCelsius(182.79)).toBe('182,79 K · -90,36 °C');
    expect(planetNormalizedPercent(0.674)).toBe('67,4 %');
    expect(planetNormalizedPercent(null)).toBe('No evaluable');
  });
});
