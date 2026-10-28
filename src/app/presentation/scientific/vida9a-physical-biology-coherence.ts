/** VIDA.9a — comparación de modelos CT-0 sin alterar los snapshots ni la semilla.
 * El campo 'observado' PRE-VIDA.5 es una proyección publicada del MODELO,
 * no una medida directa. La geoquímica PRE-33.07 describe únicamente su nicho.
 * No registrar estos hallazgos en IndexedDB ni usarlos para resembrar VIDA.
 */
export const VIDA9A_AUDIT_REVISION = 'VIDA.9a/physical-biological-coherence/v1' as const;
export type Vida9aFindingSeverity = 'INFO' | 'LIMITATION' | 'ERROR';
export interface Vida9aFinding {
  readonly id: string;
  readonly severity: Vida9aFindingSeverity;
  readonly title: string;
  readonly explanation: string;
}
export interface Vida9aBiologySummary {
  readonly nativeLife: boolean;
  readonly nativeIntelligence: boolean;
  readonly nativeCivilization: boolean;
  readonly introducedLife: boolean;
  readonly colonialPopulation: boolean;
  readonly speciesIds: readonly string[];
  readonly relationCount: number;
  readonly relationEndpoints?: readonly Readonly<{sourceSpeciesId:string;targetSpeciesId:string}>[];
  readonly intelligenceSpeciesId: string | null;
  readonly civilizationFounderSpeciesId: string | null;
  readonly colonyCount: number;
}
export interface Vida9aPlanetInput {
  readonly kind: 'PLANET';
  readonly baseline: Readonly<{ temperatureKelvin: number | null; pressurePascal: number | null }>;
  readonly effective: Readonly<{ temperatureKelvin: number | null; pressurePascal: number | null }>;
  readonly feedback: Readonly<{
    status: 'APPLIED' | 'NO_PHOTOSYNTHETIC_VEGETATION' | 'UNRESOLVED_PHYSICAL_BUDGET';
    climateDeltaKelvin: number;
    sourcePressurePascal: number | null;
    pressurePascal: number | null;
    oxygenFraction01: number | null;
    oxygenPartialPressurePascal: number | null;
    nativeCivilizationAtmosphereReady: boolean;
  }> | null;
  readonly surface: Readonly<{ hasDefinedSolidSurface: boolean; hasPersistentLiquidWater: boolean; coverage01: number | null }>;
  readonly surfaceDiverseEcosystem: boolean;
  readonly geochemistry: Readonly<{
    niche: string;
    solventState: string;
    liquidWaterKilograms: number | null;
    hasPositiveResolvedPower: boolean;
  }> | null;
  readonly biology: Vida9aBiologySummary;
}
export interface Vida9aMoonInput {
  readonly kind: 'MOON';
  readonly oceanState: 'PRESENT_IN_SIMULATED_MODEL' | 'ABSENT_IN_SIMULATED_MODEL' |
    'UNRESOLVED_IN_SIMULATED_MODEL' | null;
  readonly geochemistry: Readonly<{ niche: string; solventState: string }> | null;
  readonly biology: Vida9aBiologySummary;
}
export interface Vida9aAuditResult {
  readonly revision: typeof VIDA9A_AUDIT_REVISION;
  readonly kind: 'PLANET' | 'MOON';
  readonly status: 'COHERENT' | 'REVIEW_REQUIRED';
  readonly preBiologyTemperatureKelvin: number | null;
  readonly effectiveTemperatureKelvin: number | null;
  readonly preBiologyPressurePascal: number | null;
  readonly effectivePressurePascal: number | null;
  readonly temperatureDifferenceKelvin: number | null;
  readonly pressureDifferencePascal: number | null;
  readonly findings: readonly Vida9aFinding[];
}
const finite = (n: number | null): n is number => n !== null && Number.isFinite(n);
const close = (a: number, b: number, tolerance: number) => Math.abs(a - b) <= tolerance;
const finding = (id: string, severity: Vida9aFindingSeverity, title: string, explanation: string): Vida9aFinding =>
  Object.freeze({ id, severity, title, explanation });

function biologicalChecks(b: Vida9aBiologySummary, findings: Vida9aFinding[]): void {
  const ids = new Set(b.speciesIds);
  if (!b.nativeLife && (ids.size > 0 || b.nativeIntelligence || b.nativeCivilization)) {
    findings.push(finding('BIOLOGY_WITHOUT_NATIVE_LIFE', 'ERROR', 'Jerarquía biológica incoherente',
      'Se informa vida compleja, inteligencia o civilización nativa sin vida nativa.'));
  }
  if (b.nativeCivilization && !b.nativeIntelligence) {
    findings.push(finding('CIVILIZATION_WITHOUT_INTELLIGENCE', 'ERROR', 'Civilización sin inteligencia nativa',
      'La civilización nativa debe derivar de una especie inteligente existente.'));
  }
  if (b.nativeIntelligence && (!b.intelligenceSpeciesId || !ids.has(b.intelligenceSpeciesId))) {
    findings.push(finding('INTELLIGENT_SPECIES_MISSING', 'ERROR', 'Especie inteligente sin identidad VIDA.6',
      'La especie inteligente debe pertenecer al ecosistema nativo del mismo cuerpo.'));
  }
  if (b.nativeCivilization && (!b.civilizationFounderSpeciesId ||
      !ids.has(b.civilizationFounderSpeciesId) || b.civilizationFounderSpeciesId !== b.intelligenceSpeciesId)) {
    findings.push(finding('FOUNDER_SPECIES_MISMATCH', 'ERROR', 'Fundador civilizatorio incoherente',
      'La especie fundadora debe ser la especie inteligente existente en VIDA.6.'));
  }
  if (b.colonialPopulation !== (b.colonyCount > 0)) {
    findings.push(finding('COLONIAL_POPULATION_MISMATCH', 'ERROR', 'Población colonial y colonias no coinciden',
      'La población colonial se deriva exclusivamente de los asentamientos coloniales VIDA.8.'));
  }
  if (b.relationEndpoints?.some(r => !ids.has(r.sourceSpeciesId) || !ids.has(r.targetSpeciesId))) {
    findings.push(finding('DANGLING_ECOLOGICAL_RELATION','ERROR','Relación ecológica con especie inexistente',
      'Todas las relaciones VIDA.6 deben referenciar dos especies nativas pertenecientes a la misma biosfera.'));
  }
  if (b.relationCount > 0 && ids.size === 0) {
    findings.push(finding('RELATIONS_WITHOUT_SPECIES', 'ERROR', 'Relaciones sin especies',
      'No pueden existir relaciones ecológicas sin especies nativas identificadas.'));
  }
}
function finish(kind: 'PLANET'|'MOON', findings: Vida9aFinding[], baseline?: Vida9aPlanetInput['baseline'],
  effective?: Vida9aPlanetInput['effective']): Vida9aAuditResult {
  const difference = (a: number | null, b: number | null) => finite(a) && finite(b) ? b - a : null;
  return Object.freeze({
    revision: VIDA9A_AUDIT_REVISION, kind,
    status: findings.some(f => f.severity === 'ERROR') ? 'REVIEW_REQUIRED' : 'COHERENT',
    preBiologyTemperatureKelvin: baseline?.temperatureKelvin ?? null,
    effectiveTemperatureKelvin: effective?.temperatureKelvin ?? null,
    preBiologyPressurePascal: baseline?.pressurePascal ?? null,
    effectivePressurePascal: effective?.pressurePascal ?? null,
    temperatureDifferenceKelvin: difference(baseline?.temperatureKelvin ?? null,effective?.temperatureKelvin ?? null),
    pressureDifferencePascal: difference(baseline?.pressurePascal ?? null,effective?.pressurePascal ?? null),
    findings: Object.freeze(findings),
  });
}
export class Vida9aPhysicalBiologyCoherence {
  private constructor() {}
  static planet(input: Vida9aPlanetInput): Vida9aAuditResult {
    const f: Vida9aFinding[] = [];
    const {baseline: b, effective: e, feedback: v} = input;
    if (v?.status === 'APPLIED') {
      if (finite(b.temperatureKelvin) && finite(e.temperatureKelvin)) {
        if (!close(e.temperatureKelvin, b.temperatureKelvin + v.climateDeltaKelvin, 0.025)) {
          f.push(finding('CLIMATE_DELTA_MISMATCH','ERROR','Temperatura no reconciliada',
            'El estado atmosférico VIDA.5 no explica la temperatura efectiva CT-0.'));
        } else if (!close(e.temperatureKelvin, b.temperatureKelvin, 0.025)) {
          f.push(finding('BIOGENIC_TEMPERATURE_STAGE','INFO','Temperatura anterior y posterior a VIDA.5',
            'Fase 31.12 presenta el modelo físico anterior; Clima presenta el estado efectivo tras la corrección biológica. No son dos mediciones distintas.'));
        }
      }
      if (finite(b.pressurePascal) && finite(v.sourcePressurePascal) &&
        !close(b.pressurePascal,v.sourcePressurePascal,Math.max(1,Math.abs(b.pressurePascal)*1e-6))) {
        f.push(finding('FEEDBACK_SOURCE_PRESSURE_MISMATCH','ERROR','Origen de presión incoherente',
          'La presión de partida de VIDA.5 no coincide con el escenario físico PRE-33.'));
      }
      if (finite(e.pressurePascal) && finite(v.pressurePascal) &&
        !close(e.pressurePascal,v.pressurePascal,Math.max(1,Math.abs(e.pressurePascal)*1e-6))) {
        f.push(finding('FEEDBACK_EFFECTIVE_PRESSURE_MISMATCH','ERROR','Presión efectiva no reconciliada',
          'El estado atmosférico mostrado no coincide con la presión calculada por VIDA.5.'));
      } else if (finite(b.pressurePascal) && finite(e.pressurePascal) &&
        !close(b.pressurePascal,e.pressurePascal,1)) {
        f.push(finding('BIOGENIC_PRESSURE_STAGE','INFO','Presión anterior y posterior a VIDA.5',
          'El reequilibrio biogeoquímico de la columna modifica la presión efectiva, sin alterar el snapshot PRE-33.'));
      }
    } else if (finite(b.temperatureKelvin) && finite(e.temperatureKelvin) &&
      !close(b.temperatureKelvin,e.temperatureKelvin,0.025) ||
      finite(b.pressurePascal) && finite(e.pressurePascal) &&
      !close(b.pressurePascal,e.pressurePascal,1)) {
      f.push(finding('UNEXPLAINED_PHYSICAL_STAGE','ERROR','Variación física sin VIDA.5 aplicado',
        'El estado efectivo difiere del original sin un ajuste biogeoquímico autorizado.'));
    }
    if (input.surface.hasPersistentLiquidWater && (input.surface.coverage01 ?? 0) > 0 &&
        input.geochemistry && input.geochemistry.solventState !== 'MODELLED_LIQUID_CT0') {
      f.push(finding('GEOCHEMISTRY_NICHE_SCOPE','LIMITATION','Agua superficial y solvente geoquímico: dominios diferentes',
        `Existe agua superficial en el estado planetario, pero PRE-33.07 no resuelve el solvente líquido en el nicho ${input.geochemistry.niche}. `+
        'El inventario de esa ruta no es el inventario oceánico del planeta: ausencia de ruta resuelta no equivale a ausencia de vida.'));
    }
    if (input.surfaceDiverseEcosystem) {
      if (!input.surface.hasDefinedSolidSurface) {
        f.push(finding('DIVERSE_LIFE_WITHOUT_SURFACE','ERROR','Ecosistema superficial sin base física',
          'VIDA.6 declara un ecosistema superficial diverso sobre un mundo sin superficie sólida definida.'));
      }
      if (!finite(e.temperatureKelvin)) {
        f.push(finding('DIVERSE_LIFE_TEMPERATURE_UNRESOLVED','LIMITATION','Temperatura del hábitat no resuelta',
          'El estado térmico global no basta para verificar el nicho complejo.'));
      } else if (e.temperatureKelvin < 260 || e.temperatureKelvin > 335) {
        f.push(finding('DIVERSE_LIFE_TEMPERATURE_OUTSIDE_VIDA5','ERROR','Clima global incompatible con el cierre VIDA.5',
          'El estado térmico efectivo está fuera del dominio de aceptación de VIDA.5 para vegetación superficial estable.'));
      }
      if (!finite(e.pressurePascal) || e.pressurePascal <= 0) {
        f.push(finding('DIVERSE_LIFE_PRESSURE_UNRESOLVED','ERROR','Ecosistema superficial sin presión admisible',
          'No se ha calculado una columna atmosférica efectiva para esta biosfera de superficie.'));
      }
      if (!input.surface.hasPersistentLiquidWater) {
        f.push(finding('DIVERSE_LIFE_WATER_LIMIT','LIMITATION','Agua superficial no confirmada en el modelo',
          'Comprobar si los organismos usan un refugio protegido; no se inventa un océano.'));
      }
    }
    if (input.biology.nativeCivilization && v?.status === 'APPLIED' &&
      (!v.nativeCivilizationAtmosphereReady || (v.oxygenFraction01 ?? 0) < 0.16 ||
        (v.oxygenPartialPressurePascal ?? 0) < 16000)) {
      f.push(finding('CIVILIZATION_OXYGEN_CONTRACT','ERROR','Atmósfera insuficiente para la civilización aerobia',
        'VIDA.5 exige cierre atmosférico y oxígeno parcial mínimo en este contrato de civilización nativa.'));
    }
    if (input.biology.nativeLife && input.surface.hasPersistentLiquidWater &&
      input.geochemistry && !input.geochemistry.hasPositiveResolvedPower) {
      f.push(finding('CHEMICAL_POWER_UNRESOLVED','LIMITATION','Potencia química no resuelta',
        'PRE-33.07 no certifica rutas metabólicas concretas. VIDA se genera por plausibilidad procedural y no por bioquímica exhaustiva.'));
    }
    biologicalChecks(input.biology, f);
    return finish('PLANET',f,b,e);
  }
  static moon(input: Vida9aMoonInput): Vida9aAuditResult {
    const f: Vida9aFinding[] = [];
    if (input.oceanState === 'PRESENT_IN_SIMULATED_MODEL' && !input.biology.nativeLife) {
      f.push(finding('OCEAN_WITHOUT_LIFE','INFO','Océano subsuperficial sin vida nativa',
        'El océano CT-0 demuestra la existencia de agua en el modelo, pero no garantiza bioenergía ni aparición de vida.'));
    }
    if (input.geochemistry && input.geochemistry.solventState !== 'MODELLED_LIQUID_CT0' &&
        input.oceanState === 'PRESENT_IN_SIMULATED_MODEL') {
      f.push(finding('LUNAR_GEOCHEMISTRY_SCOPE','LIMITATION','Solvente geoquímico no resuelto',
        'La fase geoquímica evalúa un nicho energético; no invalida el océano constitutivo de 32.F.2c.'));
    }
    if (input.biology.nativeCivilization || input.biology.nativeIntelligence) {
      f.push(finding('NATIVE_LUNAR_CIVILIZATION','ERROR','Inteligencia nativa lunar no autorizada',
        'VIDA.7 solo autoriza civilizaciones nativas en planetas; las lunas pueden contener colonias introducidas.'));
    }
    biologicalChecks(input.biology,f);
    return finish('MOON',f);
  }
}
