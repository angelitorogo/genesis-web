import type { MoonScientificSectionsModel, MoonScientificSectionModel, MoonScientificFieldModel, MoonScientificSectionId } from './moon-scientific-sections';

/** VIDA.9e: selección de PRESENTACIÓN. No recalcula ni altera los modelos lunares.
 * Los datos desconocidos continúan siendo desconocidos; no sustituye CT-0 por V1. */
interface Selection { readonly source: string; readonly label?: string; readonly keepNote?: boolean; }
interface CompactDefinition {
  readonly id: MoonScientificSectionId;
  readonly title: string;
  readonly summary: string;
  readonly selections: readonly Selection[];
}
const field = (source: string, label?: string, keepNote = false): Selection => ({source, label, keepNote});
const DEFINITIONS: readonly CompactDefinition[] = [
  { id:'general', title:'General', summary:'Características físicas del satélite.', selections:[
    field('Masa'),field('Radio'),field('Densidad media'),field('Gravedad superficial'),field('Composición inferida'),field('Familia orbital'),
  ]},
  { id:'orbit', title:'Órbita', summary:'Movimiento de la luna alrededor de su planeta.', selections:[
    field('Semieje mayor'),field('Excentricidad'),field('Inclinación'),field('Periodo orbital'),
  ]},
  { id:'tides', title:'Mareas y rotación', summary:'Giro y efectos de las mareas.', selections:[
    field('Periodo de rotación',undefined,true),field('Acoplamiento de marea'),field('Calentamiento de marea'),field('Migración orbital'),
  ]},
  { id:'environment', title:'Entorno y agua', summary:'Temperatura, hielo y agua del modelo actual.', selections:[
    field('Insolación media de referencia'),field('Temperatura superficial estimada'),
    field('Agua'),field('Océano CT-0 del universo simulado (32.F.2c)','Océano subsuperficial'),
    field('Geometría oceánica generada (32.F.2c)','Hielo y océano interior'),
  ]},
  { id:'atmosphere', title:'Atmósfera', summary:'Condiciones gaseosas conocidas y no resueltas.', selections:[
    field('Atmósfera'), field('Presión superficial atmosférica (balance físico)','Presión superficial'),
    field('Presión superficial atmosférica (escenario)','Presión superficial (escenario)'),
    field('Composición gaseosa candidata','Composición gaseosa (escenario)'),
  ]},
  { id:'radiation', title:'Radiación', summary:'Exposición y protección radiativa.', selections:[
    field('Exposición ionizante y protección'),
    field('Exposición radiativa real — superficie / océano','Exposición radiativa'),
    field('Cubierta protectora de hielo del océano CT-0 (32.F.3)','Cubierta protectora de hielo'),
    field('Columna atmosférica y protección magnetosférica','Protección atmosférica y magnética'),
  ]},
  { id:'geochemistry', title:'Geología y energía', summary:'Actividad interna y fuentes físicas de energía.', selections:[
    field('Geología'), field('Actividad geológica'),field('Retención de calor interno'),
    field('Contacto agua-roca del modelo','Contacto agua-roca'),
    field('Potencia térmica interior del modelo 32.F.4','Potencia térmica interior'),
    field('Geoquímica y fuentes de energía'),
  ]},
  { id:'habitability', title:'Habitabilidad', summary:'Candidaturas de superficie y subsuelo.', selections:[
    field('Clasificación'),field('Ruta superficial'),field('Ruta subsuperficial'),field('Índice global'),
  ]},
  { id:'comparison', title:'Comparación con la Tierra', summary:'Tamaño y propiedades respecto a la Tierra.', selections:[
    field('Radio relativo'),field('Masa relativa'),field('Área superficial relativa'),
    field('Volumen relativo'),field('Densidad relativa'),field('Gravedad superficial relativa'),
  ]},
];

/** VIDA.9f: traducción de etiquetas históricas a un valor legible por el jugador.
 * SOLO presentación: nunca altera el valor original ni convierte desconocido en cero.
 * La ausencia de información geoquímica/histórica sigue siendo ausencia de información. */
export function moonScientificDisplayTextVIDA9f(source: string): string {
  if (!source) return source;
  const exact: Readonly<Record<string, string>> = {
    'Océano subsuperficial presente (universo simulado CT-0)': 'Océano subsuperficial presente',
    'Océano subsuperficial H₂O presente en CT-0': 'Océano subsuperficial presente',
    'Océano subsuperficial H₂O ausente en CT-0': 'Sin océano subsuperficial de agua',
    'Estado oceánico H₂O no resuelto en CT-0': 'Estado del océano no determinado',
    'Océano presente en el modelo CT-0': 'Océano subsuperficial presente',
    'Océano subsuperficial presente en el universo simulado (modelo físico)': 'Océano subsuperficial presente',
    'Océano subsuperficial presente en el universo simulado (modelo constitutivo)': 'Océano subsuperficial presente',
    'Sin océano subsuperficial H₂O en el modelo CT-0': 'Sin océano subsuperficial de agua',
    'Hielo y océano subsuperficial (realidad simulada CT-0)': 'Hielo y océano subsuperficial',
    'Potencial V1 de habitabilidad (océano H₂O presente CT-0)': 'Potencial de habitabilidad con océano subsuperficial',
    'Potencial de habitabilidad V1 (océano CT-0 modelado; otros criterios pendientes)': 'Potencial de habitabilidad (otros criterios pendientes)',
    'Potencial de habitabilidad V1 no corroborado (sin océano H₂O CT-0)': 'Potencial de habitabilidad no corroborado (sin océano subsuperficial de agua)',
    'Candidatura de habitabilidad subsuperficial V1 (océano CT-0 modelado)': 'Candidatura de habitabilidad subsuperficial (océano presente)',
    'Océano CT-0 presente; habitabilidad no determinada por el índice V1': 'Océano presente; habitabilidad no determinada',
    'Océano H₂O presente CT-0; habitabilidad aún no evaluada': 'Océano presente; habitabilidad por determinar',
    'Candidatura superficial V1 (sin océano H₂O CT-0)': 'Candidatura superficial (sin océano subsuperficial de agua)',
    'Sin candidatura acuosa subsuperficial CT-0': 'Sin candidatura subsuperficial acuosa',
    'Potencial de océano subsuperficial (índice V1)': 'Potencial de océano subsuperficial',
    'Potencial oceánico heredado (sin soporte térmico C)': 'Posibilidad de océano no confirmada por las condiciones térmicas',
    'Potencial oceánico heredado (balance no resuelto)': 'Posibilidad de océano no determinada',
    'No resuelto en el dominio del modelo': 'No determinado',
    'Líquido subsuperficial resuelto en el modelo CT-0': 'Océano subsuperficial presente',
    'V1 (océano CT-0 modelado; otros criterios pendientes)': 'Océano subsuperficial presente; otros criterios pendientes',
    'V1 (océano CT-0 modelado)': 'Océano subsuperficial presente',
  };
  const original = source.trim();
  const candidate = exact[original] ?? original;
  // Los índices normalizados (0–1) son porcentajes de escala, NO probabilidades.
  const withPercentages = candidate.replace(/(?<![\d.,])(?:0|1)[.,]\d{1,8}\s*\/\s*1(?![\d.,])|(?<![\d.,])(?:0|1)\s*\/\s*1(?![\d.,])/g, match => {
    const part = Number(match.split('/')[0].trim().replace(',', '.'));
    if (!Number.isFinite(part) || part < 0 || part > 1) return match;
    return `${new Intl.NumberFormat('es-ES', {maximumFractionDigits: 1}).format(part * 100)} %`;
  });
  // Residuo técnico que puede formar parte de las insignias o títulos históricos.
  return withPercentages
    .replace(/\s*\((?:universo simulado|realidad simulada)\s+CT-0\)/gi, '')
    .replace(/\s*\((?:modelo|océano)\s+CT-0\s+modelado(?:;\s*otros criterios pendientes)?\)/gi, '')
    .replace(/\b(?:V1|V2|V3)\s*\((?=océano)/gi, '(')
    .replace(/\b(potencial|candidatura)\s+V1\s+de\b/gi, '$1 de')
    .replace(/\b(índice|potencial)\s+V1\b/gi, '$1')
    .replace(/\bV1\s+(?=\()/g, '')
    .replace(/\bCT-0\b/g, '')
    .replace(/\b(?:modelo físico|modelo constitutivo|universo simulado)\b/gi, '')
    .replace(/\s+([,.])/g, '$1')
    .replace(/\(\s*\)/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function compactMoonSectionsVIDA9e(source: MoonScientificSectionsModel): readonly MoonScientificSectionModel[] {
  const sections = new Map(source.sections.map(section => [section.id, section] as const));
  return Object.freeze(DEFINITIONS.map((definition,index) => {
    const original = sections.get(definition.id);
    if (!original) return null;
    const values = new Map(original.fields.map(item => [item.label, item] as const));
    // Solo se toman los valores físicos que ya existen en el modelo de la ficha.
    const chosen: MoonScientificFieldModel[] = [];
    for (const select of definition.selections) {
      // Algunos datos geológicos residen en Entorno; no se duplican en la tarjeta de agua.
      const value = values.get(select.source) ?? (definition.id === 'geochemistry'
        ? sections.get('environment')?.fields.find(item => item.label === select.source)
        : undefined);
      if (!value) continue;
      chosen.push(Object.freeze({
        label:moonScientificDisplayTextVIDA9f(select.label ?? value.label),
        value:moonScientificDisplayTextVIDA9f(value.value),
        note:select.keepNote && value.note ? moonScientificDisplayTextVIDA9f(value.note) : null,
      }));
    }
    return Object.freeze({
      id:original.id,
      eyebrow:`SECCIÓN ${String(index+1+(definition.id === 'comparison' ? 1 : 0)).padStart(2,'0')}`,
      title:definition.title, summary:definition.summary,
      fields:Object.freeze(chosen),
    } as MoonScientificSectionModel);
  }).filter((section):section is MoonScientificSectionModel => section !== null));
}
