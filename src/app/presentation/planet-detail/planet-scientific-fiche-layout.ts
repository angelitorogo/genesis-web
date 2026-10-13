import {
  type PlanetScientificFieldModel,
  type PlanetScientificSectionModel,
} from './planet-scientific-sections';

/**
 * Single presentation contract for ordinary and compact-host planets.
 * Fields that have no scientific counterpart are explicit, not silently hidden
 * and not inferred from unrelated radiation/escape/magnetism proxies.
 */
export const PLANET_FICHE_FIELD_LAYOUT = Object.freeze({
  general: [
    'Tipo planetario', 'Masa', 'Radio', 'Densidad media', 'Gravedad superficial',
    'Periodo de rotación', 'Duración del día', 'Inclinación axial', 'Composición interna',
  ],
  orbit: [
    'Semieje mayor', 'Excentricidad', 'Inclinación', 'Periastro', 'Apoastro',
    'Periodo orbital', 'Zona habitable radiativa', 'Zona habitable dinámica',
    'Insolación media de referencia', 'Forzamiento de marea orbital',
  ],
  surface: [
    'Base superficial', 'Índice de rugosidad', 'Índice de inventario de agua',
    'Agua líquida superficial', 'Distribución hielo / líquido / vapor',
    'Cobertura de hielo', 'Cobertura de agua', 'Radiación superficial', 'Protección radiativa',
  ],
  atmosphere: [
    'Régimen potencial inicial', 'Régimen gaseoso actual', 'Presión superficial gaseosa',
    'Densidad de referencia', 'Composición dominante', 'Efecto invernadero', 'Estado atmosférico',
  ],
  climate: [
    'Temperatura de equilibrio', 'Temperatura superficial media', 'Calentamiento invernadero',
    'Amplitud estacional', 'Contraste térmico día/noche', 'Extremos superficiales',
    'Índice de redistribución de calor',
  ],
  geology: [
    'Régimen geológico', 'Vulcanismo', 'Tectónica', 'Índice de retención de calor interno',
    'Campo magnético', 'Magnetosfera',
  ],
} as const);

/** One canonical heading/eyebrow/description for every host type. */
export const PLANET_FICHE_SECTION_METADATA = Object.freeze({
  general: Object.freeze({eyebrow:'SECCIÓN 01',title:'General',
    summary:'Propiedades físicas globales, rotación y composición interna de referencia.'}),
  orbit: Object.freeze({eyebrow:'SECCIÓN 02',title:'Órbita',
    summary:'Geometría orbital, periodo y relación con la zona habitable del sistema.'}),
  surface: Object.freeze({eyebrow:'SECCIÓN 03',title:'Superficie',
    summary:'Régimen superficial, inventario de agua y exposición radiativa del entorno accesible.'}),
  atmosphere: Object.freeze({eyebrow:'SECCIÓN 04',title:'Atmósfera',
    summary:'Presión gaseosa, composición, retención de volátiles y efecto invernadero.'}),
  climate: Object.freeze({eyebrow:'SECCIÓN 05',title:'Clima',
    summary:'Balance térmico global, efecto invernadero, variabilidad y redistribución de calor.'}),
  geology: Object.freeze({eyebrow:'SECCIÓN 06',title:'Geología',
    summary:'Actividad interna, vulcanismo, tectónica y protección magnetosférica.'}),
  moons: Object.freeze({eyebrow:'SECCIÓN 07',title:'Lunas',
    summary:'Población de satélites naturales asociados al planeta y caracterización de los cuerpos más relevantes.'}),
  comparison: Object.freeze({eyebrow:'SECCIÓN 08',title:'Comparación con la Tierra',
    summary:'Comparación adimensional con la Tierra y escala lineal de tamaño basada en el radio físico ya determinado.'}),
} as const);

type EditableSectionId = keyof typeof PLANET_FICHE_FIELD_LAYOUT;

const FIELD_ALIASES: Readonly<Record<string, readonly string[]>> = Object.freeze({
  // The compact model publishes 'Período orbital'; the conventional model
  // publishes 'Periodo orbital'. Never hide the actual Keplerian result.
  'Periodo orbital': ['Período orbital'],
  'Periodo de rotación': ['Rotación simulada'],
  'Duración del día': ['Duración del día aparente simulada'],
  'Inclinación axial': ['Inclinación axial simulada'],
  'Composición interna': ['Composición interna simulada'],
  'Inclinación': ['Inclinación orbital'],
  'Forzamiento de marea orbital': ['Forzamiento de marea (proxy)'],
  'Índice de inventario de agua': ['Inventario de agua modelado'],
  'Distribución hielo / líquido / vapor': ['Fracciones hielo / líquido / vapor'],
  'Cobertura de hielo': ['Cobertura potencial de hielo (ilustrativa)'],
  'Cobertura de agua': ['Cobertura de agua líquida', 'Cobertura potencial de líquido (ilustrativa)'],
  'Régimen potencial inicial': ['Régimen gaseoso potencial'],
  'Régimen gaseoso actual': ['Régimen gaseoso final'],
  'Presión superficial gaseosa': ['Presión gaseosa escenario'],
  'Densidad de referencia': ['Densidad gaseosa escenario'],
  'Composición dominante': ['Composición gaseosa escenario'],
  'Efecto invernadero': ['Efecto invernadero escenario'],
  'Temperatura de equilibrio': ['Temperatura de equilibrio escenario'],
  'Temperatura superficial media': ['Temperatura superficial escenario'],
  'Calentamiento invernadero': ['Calentamiento invernadero escenario'],
  'Amplitud estacional': ['Amplitud estacional escenario'],
  'Contraste térmico día/noche': ['Rango térmico diurno', 'Rango térmico diurno escenario'],
  'Extremos superficiales': ['Extremos escenario'],
  'Índice de redistribución de calor': ['Redistribución térmica'],
  'Índice de retención de calor interno': ['Retención de calor interno'],
  'Tectónica': ['Movilidad tectónica'],
  'Campo magnético': ['Campo magnético simulado'],
});

function isEditableSection(id: string): id is EditableSectionId {
  return Object.prototype.hasOwnProperty.call(PLANET_FICHE_FIELD_LAYOUT, id);
}

function findField(
  fields: readonly PlanetScientificFieldModel[], label: string,
): PlanetScientificFieldModel | undefined {
  const names = [label, ...(FIELD_ALIASES[label] ?? [])];
  return fields.find(field => names.includes(field.label));
}

export function unifyPlanetFicheSections(
  sections: readonly PlanetScientificSectionModel[],
): readonly PlanetScientificSectionModel[] {
  return Object.freeze(sections.map(section => {
    const meta = PLANET_FICHE_SECTION_METADATA[section.id];
    // Preserve the complete lunar and Earth-comparison *content*, but give
    // their headings the same numbering/wording as other planet fiches.
    if (!isEditableSection(section.id)) {
      return Object.freeze({ ...section, ...meta });
    }
    const fields = PLANET_FICHE_FIELD_LAYOUT[section.id].map(label => {
      const source = findField(section.fields, label);
      return Object.freeze({
        label,
        value: source?.value ?? 'No determinado',
        note: source?.note ?? null,
      });
    });
    return Object.freeze({ ...section, ...meta, fields: Object.freeze(fields) });
  }));
}
