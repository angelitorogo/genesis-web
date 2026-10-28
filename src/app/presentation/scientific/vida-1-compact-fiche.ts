/**
 * VIDA.1 — lightweight, read-only projection of existing, frozen fiche fields.
 * The presentation never recomputes water, pressure, climate or biology.
 * Missing values stay unknown. Neither legacy habitat indices nor water
 * candidates are converted into evidence of life.
 */
export interface Vida1SourceField {
  readonly label: string;
  readonly value: string;
}

export interface Vida1SourceSection {
  readonly id: string;
  readonly fields: readonly Vida1SourceField[];
}

export interface Vida1Fact {
  readonly label: string;
  readonly value: string;
}

export interface Vida1Section {
  readonly id: string;
  readonly title: string;
  readonly facts: readonly Vida1Fact[];
}

type Selector = Readonly<{
  label: string;
  section: string;
  aliases: readonly string[];
}>;

const PLANET: readonly Readonly<{ id: string; title: string; selectors: readonly Selector[] }>[] = [
  { id: 'general', title: 'Características', selectors: [
    { label: 'Tipo', section: 'general', aliases: ['Tipo planetario'] },
    { label: 'Masa', section: 'general', aliases: ['Masa'] },
    { label: 'Radio', section: 'general', aliases: ['Radio'] },
    { label: 'Gravedad', section: 'general', aliases: ['Gravedad superficial'] },
    { label: 'Rotación', section: 'general', aliases: ['Periodo de rotación'] },
  ] },
  { id: 'orbit', title: 'Órbita', selectors: [
    { label: 'Distancia orbital', section: 'orbit', aliases: ['Semieje mayor'] },
    { label: 'Periodo orbital', section: 'orbit', aliases: ['Periodo orbital'] },
    { label: 'Zona habitable', section: 'orbit', aliases: ['Zona habitable radiativa'] },
  ] },
  { id: 'environment', title: 'Entorno', selectors: [
    { label: 'Temperatura', section: 'climate', aliases: ['Temperatura superficial media'] },
    { label: 'Agua líquida superficial (modelo)', section: 'surface', aliases: ['Agua líquida superficial'] },
    { label: 'Cobertura de agua', section: 'surface', aliases: ['Cobertura de agua líquida', 'Cobertura de agua'] },
    { label: 'Atmósfera', section: 'atmosphere', aliases: ['Régimen gaseoso actual', 'Estado atmosférico'] },
    { label: 'Presión', section: 'atmosphere', aliases: ['Presión superficial gaseosa'] },
    { label: 'Composición atmosférica', section: 'atmosphere', aliases: ['Composición dominante'] },
    { label: 'Geología', section: 'geology', aliases: ['Régimen geológico'] },
  ] },
  { id: 'moons', title: 'Lunas', selectors: [
    { label: 'Satélites naturales', section: 'moons', aliases: ['Satélites naturales'] },
  ] },
  { id: 'comparison', title: 'Comparación con la Tierra', selectors: [
    { label: 'Radio relativo', section: 'comparison', aliases: ['Radio relativo'] },
    { label: 'Masa relativa', section: 'comparison', aliases: ['Masa relativa'] },
    { label: 'Área superficial relativa', section: 'comparison', aliases: ['Área superficial relativa'] },
    { label: 'Volumen relativo', section: 'comparison', aliases: ['Volumen relativo'] },
    { label: 'Densidad relativa', section: 'comparison', aliases: ['Densidad relativa'] },
    { label: 'Gravedad superficial relativa', section: 'comparison', aliases: ['Gravedad superficial relativa'] },
  ] },
];

const MOON: readonly Readonly<{ id: string; title: string; selectors: readonly Selector[] }>[] = [
  { id: 'general', title: 'Características', selectors: [
    { label: 'Masa', section: 'general', aliases: ['Masa'] },
    { label: 'Radio', section: 'general', aliases: ['Radio'] },
    { label: 'Gravedad', section: 'general', aliases: ['Gravedad superficial'] },
    { label: 'Rotación', section: 'tides', aliases: ['Periodo de rotación'] },
  ] },
  { id: 'orbit', title: 'Órbita', selectors: [
    { label: 'Distancia al planeta', section: 'orbit', aliases: ['Semieje mayor'] },
    { label: 'Periodo orbital', section: 'orbit', aliases: ['Periodo orbital'] },
    { label: 'Calentamiento mareal', section: 'tides', aliases: ['Calentamiento de marea'] },
  ] },
  { id: 'environment', title: 'Entorno', selectors: [
    { label: 'Temperatura estimada', section: 'environment', aliases: ['Temperatura superficial estimada'] },
    { label: 'Agua / océano interior', section: 'environment', aliases: ['Océano CT-0 del universo simulado (32.F.2c)', 'Agua'] },
    { label: 'Atmósfera', section: 'atmosphere', aliases: ['Atmósfera'] },
    { label: 'Geología', section: 'environment', aliases: ['Geología'] },
  ] },
  { id: 'comparison', title: 'Comparación con la Tierra', selectors: [
    { label: 'Radio relativo', section: 'comparison', aliases: ['Radio relativo'] },
    { label: 'Masa relativa', section: 'comparison', aliases: ['Masa relativa'] },
    { label: 'Área superficial relativa', section: 'comparison', aliases: ['Área superficial relativa'] },
    { label: 'Volumen relativo', section: 'comparison', aliases: ['Volumen relativo'] },
    { label: 'Densidad relativa', section: 'comparison', aliases: ['Densidad relativa'] },
    { label: 'Gravedad superficial relativa', section: 'comparison', aliases: ['Gravedad superficial relativa'] },
  ] },
];

function project(source: readonly Vida1SourceSection[], definitions: typeof PLANET): readonly Vida1Section[] {
  const indexed = new Map(source.map(section => [section.id, section.fields] as const));
  return Object.freeze(definitions.map(definition => Object.freeze({
    id: definition.id,
    title: definition.title,
    facts: Object.freeze(definition.selectors.map(selector => {
      const fields = indexed.get(selector.section) ?? [];
      const field = selector.aliases.map(alias => fields.find(item => item.label === alias))
        .find((item): item is Vida1SourceField => item !== undefined);
      const label = selector.label === 'Agua / océano interior'
        ? field?.label === 'Océano CT-0 del universo simulado (32.F.2c)'
          ? 'Océano interior (modelo CT-0)'
          : 'Agua (indicios heredados)'
        : selector.label;
      return Object.freeze({ label, value: field?.value?.trim() || 'No determinado' });
    })),
  })));
}

export class Vida1CompactFiche {
  private constructor() {}

  static planet(source: readonly Vida1SourceSection[]): readonly Vida1Section[] {
    return project(source, PLANET);
  }

  static moon(source: readonly Vida1SourceSection[]): readonly Vida1Section[] {
    return project(source, MOON);
  }
}
