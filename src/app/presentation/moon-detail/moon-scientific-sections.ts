import { type MoonInternalWaterAssessment } from '../../domain/planetary/moon-internal-water-assessment';
import type { MoonWaterPhaseInventory32F2a } from '../../domain/planetary/moon-water-phase-inventory-32-f-2a';
import type { MoonInteriorStructure32F2b } from '../../domain/planetary/moon-interior-structure-32-f-2b';
import type { MoonOceanReality32F2c } from '../../domain/planetary/moon-ocean-reality-32-f-2c';
import type { MoonRadiationProtection32F3 } from '../../domain/planetary/moon-radiation-protection-32-f-3';
import type { MoonGeochemicalEnergy32F4 } from '../../domain/planetary/moon-geochemical-energy-32-f-4';
import type { MoonEnvironmentalHistory32F5 } from '../../domain/planetary/moon-environmental-history-32-f-5';
import { type MoonAtmosphereAssessment } from '../../domain/planetary/moon-atmosphere-assessment';
import {
  type MoonScientificResolvedTarget,
} from '../../simulation/planetary/moon-scientific-target-resolver';

import {
  WorldEarthComparisonAssembler,
  type WorldEarthComparisonModel,
} from '../scientific/world-earth-comparison';

export type MoonScientificSectionId =
  | 'general'
  | 'orbit'
  | 'tides'
  | 'environment'
  | 'atmosphere'
  | 'radiation'
  | 'geochemistry'
  | 'history'
  | 'habitability'
  | 'comparison';

export interface MoonScientificFieldModel {
  readonly label:
    string;

  readonly value:
    string;

  readonly note:
    string | null;
}

export interface MoonScientificSectionModel {
  readonly id:
    MoonScientificSectionId;

  readonly eyebrow:
    string;

  readonly title:
    string;

  readonly summary:
    string;

  readonly fields:
    readonly MoonScientificFieldModel[];
}

export interface MoonScientificSectionsModel {
  readonly sections:
    readonly MoonScientificSectionModel[];

  readonly comparison:
    WorldEarthComparisonModel;

  readonly badges:
    readonly string[];
}

const DECIMAL_1 =
  new Intl.NumberFormat(
    'es-ES',
    {
      maximumFractionDigits:
        1,
    },
  );

const DECIMAL_2 =
  new Intl.NumberFormat(
    'es-ES',
    {
      maximumFractionDigits:
        2,
    },
  );

const DECIMAL_3 =
  new Intl.NumberFormat(
    'es-ES',
    {
      maximumFractionDigits:
        3,
    },
  );

const INTEGER =
  new Intl.NumberFormat(
    'es-ES',
    {
      maximumFractionDigits:
        0,
    },
  );

const SCIENTIFIC_3 =
  new Intl.NumberFormat(
    'es-ES',
    {
      maximumSignificantDigits:
        3,
      notation:
        'scientific',
    },
  );

/**
 * Point-26.5 presentation-only projection for one detailed moon fiche.
 *
 * All science arrives as safe primitive values from MoonScientificTargetResolver.
 * This layer only labels/formats the frozen phase-21 products for the UI.
 */
export class MoonScientificSectionsAssembler {

  private constructor() {}

  static build(
    target:
      MoonScientificResolvedTarget,
  ): MoonScientificSectionsModel {

    const comparison =
      WorldEarthComparisonAssembler
        .build({
          worldLabel:
            target.identity.designation,
          massEarth:
            target.detail.general.massEarth,
          radiusEarth:
            target.detail.general.radiusEarth,
          densityGramsPerCubicCentimeter:
            target.detail.general.meanDensityGramsPerCubicCentimeter,
          surfaceGravityEarth:
            target.detail.general.surfaceGravityEarth,
        });

    return Object.freeze({
      sections:
        Object.freeze([
          generalSection(
            target,
          ),
          orbitSection(
            target,
          ),
          tidesSection(
            target,
          ),
          environmentSection(
            target,
          ),
          atmosphereSection(
            target,
          ),
          radiationSection(
            target,
          ),
          geochemistrySection(
            target,
          ),
          environmentalHistorySection(
            target,
          ),
          habitabilitySection(
            target,
          ),
          comparisonSection(
            comparison,
          ),
        ]),
      comparison,
      badges:
        Object.freeze(
          badges(
            target,
          ),
        ),
    });
  }
}

export function lunarInternalWaterFields(
  assessment: MoonInternalWaterAssessment | null,
  moonRadiusEarth: number | null = null,
  currentOcean: MoonOceanReality32F2c | null = null,
): readonly MoonScientificFieldModel[] {
  if (!assessment) { return []; }
  const flux = (value: number): string => new Intl.NumberFormat('es-ES', {
    maximumSignificantDigits: 3,
    ...(value > 0 && (value < 0.001 || value >= 10000) ? { notation: 'scientific' as const } : {}),
  }).format(value);
  const shell = lunarConductiveShellPresentation(assessment, moonRadiusEarth);
  const superseded = currentOcean !== null;
  const previousScenarioNote = superseded
    ? 'Balance exploratorio C anterior a 32.F.2c. No determina ni descarta el océano generado CT-0; consultar el estado oceánico 32.F.2c.'
    : '';
  return [
    field(
      'Flujo de calentamiento mareal (escenario)',
      assessment.tidalHeatFluxMinimumWattsPerSquareMeter !== null &&
        assessment.tidalHeatFluxMaximumWattsPerSquareMeter !== null
        ? `${flux(assessment.tidalHeatFluxMinimumWattsPerSquareMeter)}–${flux(assessment.tidalHeatFluxMaximumWattsPerSquareMeter)} W/m²`
        : 'No evaluable',
      'Intervalo supuesto de k₂/Q = 10⁻⁶–10⁻³. No es un flujo medido; ignora resonancias y calor radiogénico.',
    ),
    field(
      superseded ? 'Viabilidad térmica del hielo y océano (escenario C anterior)' : 'Viabilidad térmica del hielo y océano',
      labelIceShellThermalRegime(assessment.iceShellThermalRegime),
      `Modelo conductivo condicional con conductividad 2,5 W/(m·K), fusión entre 240 y 273,15 K y espesor de corteza desconocido. ${previousScenarioNote || 'No confirma océanos.'}`,
    ),
    field(
      superseded ? 'Espesor conductivo de hielo (escenario C anterior)' : 'Espesor conductivo de hielo (escenario)',
      shell.value,
      superseded ? `${shell.note} ${previousScenarioNote}` : shell.note,
    ),
    field(
      'Criovulcanismo',
      assessment.cryovolcanism === 'CONDITIONAL'
        ? 'Posible (escenario)'
        : assessment.cryovolcanism === 'NOT_SUPPORTED_BY_SCENARIO'
          ? 'Sin soporte mareal suficiente en este escenario'
          : 'No evaluable',
      'Requiere volátiles, fracturación, conductos y presión interna; la energía mareal por sí sola no garantiza erupciones.',
    ),
    field(
      superseded ? 'Radionúclidos y propiedades del hielo sin caracterizar (C)' : 'Calor radiogénico y propiedades del hielo',
      'No resueltos',
      superseded
        ? 'La potencia radiogénica de 32.F.2c es una hipótesis constitutiva CT-0; no identifica radionúclidos, salinidad, reología ni historia térmica.'
        : 'Sin radionúclidos, reología, salinidad, presión interior ni espesor conocido no puede confirmarse ni excluirse un océano.',
    ),
  ];
}

/** 32.F.2a: Conditional mass closure only; never described as known oceans. */
export function lunarWaterPhaseFields32F2a(
  inventory: MoonWaterPhaseInventory32F2a | null,
  currentOcean: MoonOceanReality32F2c | null = null,
): readonly MoonScientificFieldModel[] {
  if (inventory === null) return [];
  const scientific = (mass: number): string => new Intl.NumberFormat('es-ES', {
    notation: 'scientific', maximumSignificantDigits: 4,
  }).format(mass);
  const cold = inventory.possibleEndmembers.find(
    candidate => candidate.scenario === 'ALL_H2O_EXPOSED_COLD_EQUILIBRIUM');
  const warm = inventory.possibleEndmembers.find(
    candidate => candidate.scenario === 'ALL_H2O_EXPOSED_WARM_CONFINED_EQUILIBRIUM');
  const surface = cold ?? warm;
  const description = surface === undefined
    ? 'Sin escenario de equilibrio superficial dentro del dominio térmico del modelo.'
    : cold !== undefined
      ? `Si TODO el H₂O del modelo estuviera expuesto y en equilibrio con hielo: hielo ${scientific(surface.surfaceIceMassKilograms)} kg; vapor ${scientific(surface.surfaceVaporMassKilograms)} kg. No describe la superficie real.`
      : `Si TODO el H₂O estuviera expuesto y hubiera confinamiento externo ≥ ${scientific(surface.assumedConfiningPressurePascal!)} Pa: líquido ${scientific(surface.surfaceLiquidMassKilograms)} kg; vapor ${scientific(surface.surfaceVaporMassKilograms)} kg. Sin esa presión, no se conoce la fase superficial.`;
  return [
    field('Inventario H₂O de formación (escenario 32.F.2a)',
      `${scientific(inventory.sourceFormationWaterKilograms)} kg`,
      'Derivado del endmember de composición 32.F.1d; NO es masa de océano, líquido, hielo superficial ni medición.'),
    field('Balance hipotético de fases H₂O (32.F.2a)',
      surface === undefined ? 'No evaluable en equilibrio superficial' : 'Conservación de masa en escenario extremo',
      description),
    field('Alternativa de agua interior (32.F.2a)',
      `${scientific(inventory.sourceFormationWaterKilograms)} kg (límite condicional)`,
      currentOcean === null
        ? 'Extremo matemático: todo el H₂O del modelo podría estar enterrado; no se identifican fases, presión interior, ni geometría. Se estudiará en 32.F.2b.'
        : 'Extremo de masa del modelo 32.F.2a, NO una predicción interior. Consultar 32.F.2c para la distribución de H₂O generada CT-0 y sus límites.'),
    field(currentOcean === null
        ? 'Distribución real hielo / líquido / vapor'
        : 'Distribución de fases del escenario previo 32.F.2a',
      currentOcean === null ? 'No resuelta' : 'No determinada por 32.F.2a',
      currentOcean === null
        ? 'Faltan fracción expuesta, presión superficial, distribución interna e historia. Ningún escenario implica océano ni agua líquida detectada.'
        : '32.F.2a conserva escenarios extremos, no la distribución CT-0. El estado y las masas del océano interior, si se resuelven, figuran en 32.F.2c. La distribución superficial y la historia siguen sin resolverse.'),
  ];
}

/** Model CT-0 is made available in FULLY CONFIRMED systems, along with all
 * relevant moons. A phase assumption never becomes a direct observation. */
export function lunarOceanRealityFields32F2c(
  model: MoonOceanReality32F2c | null,
): readonly MoonScientificFieldModel[] {
  if (model === null) return [];
  const format = (n: number) => new Intl.NumberFormat('es-ES', {
    maximumSignificantDigits: 4,
  }).format(n);
  const scientific = (n: number) => new Intl.NumberFormat('es-ES', {
    notation: 'scientific', maximumSignificantDigits: 4,
  }).format(n);
  const state = model.state === 'PRESENT_IN_SIMULATED_MODEL'
    ? 'Océano subsuperficial presente en el universo simulado (modelo físico)'
    : model.state === 'ABSENT_IN_SIMULATED_MODEL'
      ? 'Sin océano subsuperficial en el modelo generado'
      : 'No resuelto por el dominio físico actual';
  const geometry = model.state === 'PRESENT_IN_SIMULATED_MODEL'
    ? `Cubierta de hielo ${format(model.iceCoverThicknessKilometers!)} km; líquido ${format(model.liquidLayerThicknessKilometers!)} km; hielo profundo ${format(model.highPressureIceThicknessKilometers!)} km.`
    : model.state === 'ABSENT_IN_SIMULATED_MODEL'
      ? 'No se obtiene ninguna capa líquida estable bajo los parámetros generados.'
      : 'No se genera un espesor de océano sin un perfil térmico y de fases válido.';
  return [
    field('Océano CT-0 del universo simulado (32.F.2c)', state,
      'Propiedad del universo simulado, visible tras confirmar el sistema. No es una medición. Depende de composición, calor y fases constitutivas supuestas; no implica vida.'),
    field('Geometría oceánica generada (32.F.2c)', geometry,
      'Distribución 1D de H₂O por masa; hielo Ih, líquido y hielo de alta presión aproximado (hasta 2 GPa). No determina su persistencia histórica.'),
    field('Balance hídrico de la estructura 32.F.2c',
      model.simulatedLiquidWaterMassKilograms === null ? 'No resoluble'
        : `${scientific(model.simulatedLiquidWaterMassKilograms)} kg líquidos · ${scientific(model.simulatedSolidWaterMassKilograms!)} kg sólidos`,
      `Inventario inicial del escenario: ${scientific(model.waterInventoryKilograms)} kg; no se ha creado agua adicional.`),
    field('Flujo térmico CT-0 generado (32.F.2c)',
      model.generatedTotalSurfaceHeatFluxWattsPerSquareMeter === null ? 'No resoluble'
        : `${scientific(model.generatedTotalSurfaceHeatFluxWattsPerSquareMeter)} W/m²`,
      'Parámetros mareales y radiogénicos seleccionados determinísticamente entre hipótesis físicamente acotadas, NO flujos medidos ni envejecimiento isotópico.'),
    field('Salinidad del océano CT-0',
      model.state === 'ABSENT_IN_SIMULATED_MODEL'
        ? 'No aplica: océano subsuperficial H₂O ausente'
        : 'No resuelta',
      'La composición del agua todavía no se identifica en 32.F.1d; nunca se asigna salinidad de manera arbitraria.'),
    field('Dominio termodinámico 32.F.2c', labelOceanModelReason32F2c(model.reason),
      'Curva aproximada de fusión de H₂O pura de 0 a 2 GPa; salinidad, convección profunda y evolución histórica no resueltas.'),
  ];
}

/** Human-readable scientific limits; never leak internal enum identifiers into the fiche. */
export function labelOceanModelReason32F2c(
  reason: MoonOceanReality32F2c['reason'],
): string {
  const labels: Readonly<Record<MoonOceanReality32F2c['reason'], string>> = {
    NO_FORMATION_H2O: 'Sin inventario de H₂O en el escenario de formación',
    ICE_STABLE_IN_GENERATED_MODEL: 'Hielo estable; sin océano subsuperficial en el modelo CT-0',
    SUBSURFACE_LIQUID_IN_GENERATED_MODEL: 'Líquido subsuperficial resuelto en el modelo CT-0',
    TEMPERATE_SURFACE_WITH_UNRESOLVED_CONFINEMENT: 'Superficie templada; confinamiento no resuelto',
    MISSING_TIDAL_HEAT: 'Calentamiento mareal sin datos físicos suficientes',
    HIGH_PRESSURE_PHASE_OUTSIDE_DOMAIN: 'Fuera del dominio de fases de alta presión',
    THERMAL_TRANSPORT_OUTSIDE_DOMAIN: 'Transporte térmico fuera del dominio modelado',
    UNRESOLVED_INTERFACE: 'Interfaz entre hielo y líquido no resuelta',
  };
  return labels[reason];
}

/** 32.F.2b: the radial structure and thermal cases are explicitly assumed,
 * not a detected ocean, current distribution or measured interior profile. */
export function lunarInteriorStructureFields32F2b(
  interior: MoonInteriorStructure32F2b | null,
  currentOcean: MoonOceanReality32F2c | null = null,
): readonly MoonScientificFieldModel[] {
  if (interior === null) return [];
  const scientific = (n: number) => new Intl.NumberFormat('es-ES', {
    notation: 'scientific', maximumSignificantDigits: 4,
  }).format(n);
  const compact = (n: number) => new Intl.NumberFormat('es-ES', {
    maximumSignificantDigits: 4,
  }).format(n);
  const core = interior.layers.find(x => x.kind === 'METALLIC_CORE');
  const mantle = interior.layers.find(x => x.kind === 'SILICATE_MANTLE');
  const water = interior.layers.find(x => x.kind === 'H2O_OUTER_SHELL');
  const cases = interior.thermalScenarios;
  const labels: Record<typeof cases[number]['phaseRegime'], string> = {
    NO_FORMATION_WATER: 'Sin H₂O en el escenario de formación',
    NO_RESOLVED_TIDAL_HEAT_INPUT: 'Calor mareal no resuelto',
    NO_STABLE_SURFACE_ICE_IN_ASSUMED_STRATIGRAPHY: 'Sin cubierta superficial estable de hielo en el escenario',
    ICE_ONLY_IN_THIS_CONDITIONAL_MODEL: 'Hielo sin interfaz de fusión en este modelo',
    POTENTIAL_LIQUID_BELOW_ICE_CONDITIONAL: 'Interfaz de fusión admisible bajo hipótesis',
    UNRESOLVED_HIGH_PRESSURE_ICE_PHASES: 'Fases de hielo de alta presión no resueltas',
    UNRESOLVED_CONDUCTION_OUTSIDE_DOMAIN: 'Fuera del dominio conductivo simplificado',
  };
  return [
    field('Estructura diferenciada (escenario 32.F.2b)',
      'Núcleo metálico · manto silicatado · condensables · H₂O',
      `Orden radial hipotético compatible con el inventario 32.F.1d, NO capas observadas. Núcleo ${compact(core?.outerRadiusKilometers ?? 0)} km de radio; manto hasta ${compact(mantle?.outerRadiusKilometers ?? 0)} km.`),
    field('Capa externa H₂O (escenario 32.F.2b)',
      `${compact(water?.thicknessKilometers ?? 0)} km`,
      `Si toda la masa H₂O de formación (${scientific(interior.waterMassKilograms)} kg) está ordenada en una sola capa externa. NO es espesor actual del hielo ni océano.`),
    field('Presión litostática central (escenario 32.F.2b)',
      `${scientific(interior.centralLithostaticPressurePascal)} Pa`,
      'Perfil hidrostático esférico de capas asumidas, respecto a presión superficial cero de referencia; no mide presión atmosférica ni presión real interior.'),
    field('Calentamiento interior (escenarios 32.F.2b)',
      cases.every(item => item.assumedBasalFluxWattsPerSquareMeter !== null)
        ? `${scientific(cases[0].assumedBasalFluxWattsPerSquareMeter!)}–${scientific(cases[1].assumedBasalFluxWattsPerSquareMeter!)} W/m²`
        : 'No evaluable sin flujo mareal',
      'Intervalos condicionales: k₂/Q heredado de C y producción radiogénica supuesta 0–10⁻¹¹ W/kg de roca. Edad, radionúclidos y distribución de calor desconocidos.'),
    field(currentOcean === null ? 'Transiciones hielo-líquido (32.F.2b)' : 'Transiciones hielo-líquido (escenarios previos 32.F.2b)',
      cases.map(item => labels[item.phaseRegime]).join(' / '),
      currentOcean === null
        ? 'Solución conductiva esférica; H₂O pura con punto de fusión linealizado solo hasta 200 MPa. No incorpora salinidad, convección, fases de alta presión ni demuestra océano.'
        : 'Modelo de sensibilidad 32.F.2b anterior, con dominio de 200 MPa. Sus límites no invalidan ni sustituyen el resultado constitutivo CT-0 de 32.F.2c, que utiliza otras hipótesis y un dominio de fases ampliado.'),
    field(currentOcean === null ? 'Espesor y líquido internos (escenarios 32.F.2b)' : 'Espesor y líquido internos (escenarios previos 32.F.2b)',
      cases.some(item => item.modelledIceThicknessKilometers !== null)
        ? cases.map(item => item.modelledIceThicknessKilometers === null
          ? 'No resuelto'
          : `${compact(item.modelledIceThicknessKilometers)} km de hielo / ${scientific(item.conditionalLiquidMassKilograms!)} kg líquido hipotético`).join(' · ')
        : 'No resueltos en los casos evaluados',
      currentOcean === null
        ? 'Solo sensibilidad geométrica de la capa H₂O; masas hielo+líquido conservadas cuando el modelo permite calcularlas. No es una distribución actual ni inferencia observacional.'
        : 'Resultados exploratorios anteriores a 32.F.2c; para la distribución interna generada CT-0 consultar geometría y balance hídrico de 32.F.2c.'),
    field('Océano actual y salinidad', 'Desconocidos',
      'No se deduce presencia de océano, presión de confinamiento real ni compatibilidad biológica desde estos escenarios.'),
  ];
}

/** C.1: Geometrical INTERPRETATION only. The C engine's raw conductive
 * solutions, tidal heat fluxes and inherited scientific indices do not change.
 * Apply exactly the same exploratory shell interval used by C: 0.5 km to 35%
 * of the satellite radius. Mathematical solutions outside it are NOT a crust.
 */
export function lunarConductiveShellPresentation(
  assessment: MoonInternalWaterAssessment,
  moonRadiusEarth: number | null,
): Readonly<{ value: string; note: string }> {
  const lower = assessment.conductiveShellThicknessMinimumKilometers;
  const upper = assessment.conductiveShellThicknessMaximumKilometers;
  const format = (value: number): string => new Intl.NumberFormat('es-ES', {
    maximumSignificantDigits: 3,
    ...(value > 0 && (value < 0.001 || value >= 10000)
      ? { notation: 'scientific' as const } : {}),
  }).format(value);
  if (lower === null || upper === null) {
    return {
      value: 'No determinado',
      note: 'El modelo no resuelve un intervalo de conducción para esta luna.',
    };
  }

  const rawNote = `Solución matemática sin restricción geométrica: ${format(lower)}–${format(upper)} km; no representa un espesor observado ni predicho.`;
  if (moonRadiusEarth === null || !Number.isFinite(moonRadiusEarth) || moonRadiusEarth <= 0) {
    return { value: 'No evaluable sin radio lunar', note: rawNote };
  }

  // Matches the unchanged C thermal model: MIN_SHELL_KM=0.5, maxShellKm=0.35*R.
  const minAdmissibleKm = 0.5;
  const maxAdmissibleKm = 0.35 * moonRadiusEarth * 6371;
  const boundsNote = `Intervalo geométrico exploratorio: ${format(minAdmissibleKm)}–${format(maxAdmissibleKm)} km (máximo 35 % del radio lunar). `;
  const note = boundsNote + rawNote;
  if (assessment.iceShellThermalRegime === 'NO_STABLE_SURFACE_ICE') {
    return { value: 'No aplica: superficie sin hielo estable', note };
  }
  if (assessment.iceShellThermalRegime === 'ICE_INVENTORY_LIMITED') {
    return { value: 'No evaluable: inventario de hielo limitado', note };
  }
  const clippedLower = Math.max(lower, minAdmissibleKm);
  const clippedUpper = Math.min(upper, maxAdmissibleKm);
  if (clippedLower > clippedUpper || maxAdmissibleKm < minAdmissibleKm) {
    return {
      value: 'Sin solución geométricamente admisible',
      note: note + ' El intervalo matemático no intersecta una corteza admisible; no demuestra ausencia de otras fuentes de calor.',
    };
  }
  return {
    value: `${format(clippedLower)}–${format(clippedUpper)} km (intervalo admisible)`,
    note: note + ' El recorte geométrico no demuestra la existencia de un océano ni predice el espesor real.',
  };
}

/**
 * Read-only V1 index annotation. Relative structural potential must not be
 * mistaken for evidence of water or for the outcome of the independent C model.
 * The same bands apply to every lunar system and seed.
 */
export function lunarSubsurfacePotentialNoteV1(
  potentialIndex01: number,
  hasSubsurfaceOcean: boolean,
  assessment: MoonInternalWaterAssessment | null,
): string | null {
  if (hasSubsurfaceOcean) {
    return `Candidatura oceánica condicionada por el balance térmico y los índices; no confirma un océano actual. ${assessment ? lunarThermalCaveat(assessment) : 'Balance térmico no resuelto.'}`;
  }
  if (!Number.isFinite(potentialIndex01) || potentialIndex01 <= 0) {
    return null;
  }
  const strength = potentialIndex01 >= 0.75
    ? 'alto'
    : potentialIndex01 >= 0.5
      ? 'moderado'
      : potentialIndex01 >= 0.25
        ? 'limitado'
        : 'bajo';
  return `Índice estructural V1 ${strength}; no demuestra un océano actual. ${assessment ? lunarThermalCaveat(assessment) : 'Balance térmico no resuelto.'}`;
}

function lunarThermalCaveat(assessment: MoonInternalWaterAssessment): string {
  switch (assessment.iceShellThermalRegime) {
    case 'TIDAL_HEAT_INSUFFICIENT_IN_SCENARIO':
      return 'Balance C: las mareas modeladas no sostienen una corteza conductiva en el intervalo supuesto; faltan calor radiogénico y otros procesos. No confirma ni excluye un océano.';
    case 'NO_STABLE_SURFACE_ICE':
      return 'Balance C: sin corteza global de hielo de agua estable a la temperatura estimada.';
    case 'ICE_INVENTORY_LIMITED':
      return 'Balance C: inventario de hielo insuficiente en este escenario.';
    case 'CONDITIONAL_ICE_OCEAN':
      return 'Balance C: océano bajo hielo solo condicional, nunca confirmado.';
    case 'HIGH_TIDAL_FLUX_SCENARIO':
      return 'Balance C: calentamiento mareal elevado; estabilidad de la corteza no demostrada.';
    default:
      return 'Balance C: viabilidad térmica no evaluable con los supuestos disponibles.';
  }
}

function unsupportedLegacyOcean(assessment: MoonInternalWaterAssessment): boolean {
  return assessment.iceShellThermalRegime === 'TIDAL_HEAT_INSUFFICIENT_IN_SCENARIO' ||
    assessment.iceShellThermalRegime === 'ICE_INVENTORY_LIMITED' ||
    assessment.iceShellThermalRegime === 'NO_STABLE_SURFACE_ICE';
}

function labelIceShellThermalRegime(regime: MoonInternalWaterAssessment['iceShellThermalRegime']): string {
  switch (regime) {
    case 'NOT_EVALUABLE_HIGH_ECCENTRICITY': return 'No evaluable: excentricidad fuera del régimen de marea lineal';
    case 'NOT_EVALUABLE_NON_SYNCHRONOUS': return 'No evaluable: rotación no sincronizada';
    case 'NO_STABLE_SURFACE_ICE': return 'Sin corteza global de hielo estable a la temperatura estimada';
    case 'ICE_INVENTORY_LIMITED': return 'Inventario de hielo insuficiente en el escenario';
    case 'TIDAL_HEAT_INSUFFICIENT_IN_SCENARIO': return 'Calor mareal insuficiente en el intervalo supuesto';
    case 'HIGH_TIDAL_FLUX_SCENARIO': return 'Posible disrupción térmica por mareas intensas';
    case 'CONDITIONAL_ICE_OCEAN': return 'Océano bajo hielo termodinámicamente posible, no confirmado';
  }
}

/**
 * 32.F.6 — Read-only, cross-model scientific synthesis. One CT-0 truth is
 * projected consistently, while V1 scenarios and conditional dated histories
 * remain separate. This function never mutates a scientific result, grants
 * discovery access, or infers biological compatibility.
 */
export function lunarScientificSynthesisFields32F6(
  target: MoonScientificResolvedTarget,
): readonly MoonScientificFieldModel[] {
  const environment = target.detail.environment;
  const ocean = environment.oceanReality32F2c ?? null;
  const atmosphere = environment.atmosphereAssessment ?? null;
  const radiative = environment.radiationProtection32F3 ?? null;
  const geochemical = environment.geochemicalEnergy32F4 ?? null;
  const history = environment.environmentalHistory32F5 ?? null;

  const oceanLabel = ocean === null
    ? 'Modelo oceánico CT-0 no disponible'
    : ocean.state === 'PRESENT_IN_SIMULATED_MODEL'
      ? 'Océano subsuperficial H₂O presente en CT-0'
      : ocean.state === 'ABSENT_IN_SIMULATED_MODEL'
        ? 'Océano subsuperficial H₂O ausente en CT-0'
        : 'Estado oceánico H₂O no resuelto en CT-0';

  const balance = atmosphere?.physicalBalance32F1 ?? null;
  const gasLabel = balance === null
    ? 'Columna gaseosa física no resuelta'
    : balance.regime === 'UNRESOLVED_PHOTOCHEMISTRY'
      ? 'Fotoproductos atmosféricos no resueltos'
      : 'Balance físico de gas acotado a su intervalo';

  const heat = geochemical?.generatedHeatFluxWattsPerSquareMeter;
  const heatLabel = heat !== undefined && heat !== null && Number.isFinite(heat) && heat >= 0
    ? `${SCIENTIFIC_3.format(heat)} W/m² de flujo térmico CT-0`
    : 'Flujo térmico CT-0 no cuantificado';
  const dated = history?.intervals.filter(item =>
    item.irradianceWattsPerSquareMeter !== null).length ?? 0;
  const historyLabel = dated > 0
    ? `${INTEGER.format(dated)} intervalos condicionales de irradiación fechados`
    : 'Irradiación histórica sin tramos fechados disponibles';

  return Object.freeze([
    field('Síntesis 32.F.6 — reservorio H₂O', oceanLabel,
      'Solo el modelo constitutivo 32.F.2c determina presencia o ausencia oceánica CT-0. Los indicadores V1 y los escenarios 32.F.2a/2b/C no sustituyen este resultado.'),
    field('Síntesis 32.F.6 — atmósfera y radiación',
      `${gasLabel} · dosis ionizante real no resuelta`,
      `La columna atmosférica del escenario B no es un balance físico. ${radiative === null ? 'Modelo 32.F.3 no disponible.' : 'La atenuación gamma de referencia 32.F.3 no proporciona una dosis, espectro incidente ni protección magnetosférica.'}`),
    field('Síntesis 32.F.6 — energía e historia',
      `${heatLabel} · ${historyLabel}`,
      'Flujo térmico no equivale a potencia química. La irradiancia histórica condicional no demuestra continuidad de océanos, calentamiento mareal, estabilidad ambiental ni habitabilidad.'),
  ]);
}

function generalSection(
  target:
    MoonScientificResolvedTarget,
): MoonScientificSectionModel {

  const general =
    target.detail.general;

  return section(
    'general',
    'SECCIÓN 01',
    'General',
    'Propiedades físicas globales y clasificación científica del satélite.',
    [
      field(
        'Masa',
        `${formatAdaptive(general.massEarth)} M⊕`,
      ),
      field(
        'Radio',
        `${formatAdaptive(general.radiusEarth)} R⊕`,
      ),
      field(
        'Densidad media',
        `${DECIMAL_2.format(general.meanDensityGramsPerCubicCentimeter)} g/cm³`,
      ),
      field(
        'Gravedad superficial',
        `${DECIMAL_3.format(general.surfaceGravityEarth)} g⊕`,
      ),
      ...(general.giantHostSpecialization
        ? [
            field(
              'Familia orbital',
              labelGiantMoonOrbitalFamily(
                general.giantMoonOrbitalFamily,
              ),
            ),
            field(
              'Composición inferida',
              labelGiantMoonComposition(
                general.giantMoonCompositionRegime,
              ),
              'Clasificación macroscópica basada en la riqueza relativa de hielo.',
            ),
            field(
              'Clase de tamaño',
              general.isLargeGiantMoon
                ? 'Luna grande del sistema gigante'
                : 'Luna regular',
            ),
          ]
        : []),
      ...lunarScientificSynthesisFields32F6(target),
    ],
  );
}

function orbitSection(
  target:
    MoonScientificResolvedTarget,
): MoonScientificSectionModel {

  const orbit =
    target.detail.orbit;

  return section(
    'orbit',
    'SECCIÓN 02',
    'Órbita',
    'Geometría y periodo de la órbita planetocéntrica estable.',
    [
      field(
        'Semieje mayor',
        `${DECIMAL_3.format(orbit.semiMajorAxisPlanetRadii)} Rplanet · ${INTEGER.format(orbit.semiMajorAxisKilometers)} km`,
      ),
      field(
        'Excentricidad',
        DECIMAL_3.format(
          orbit.eccentricity,
        ),
      ),
      field(
        'Inclinación',
        `${DECIMAL_2.format(orbit.inclinationDegrees)}°`,
      ),
      field(
        'Periodo orbital',
        `${DECIMAL_3.format(orbit.orbitalPeriodDays)} días`,
      ),
      field(
        'Límite de Roche',
        `${DECIMAL_3.format(orbit.rocheLimitPlanetRadii)} Rplanet`,
        'La órbita modelada permanece fuera del límite de disrupción de marea.',
      ),
      field(
        'Radio de esfera de Hill',
        `${DECIMAL_2.format(orbit.hillSphereRadiusPlanetRadii)} Rplanet`,
        'Referencia dinámica del dominio gravitatorio del planeta anfitrión.',
      ),
    ],
  );
}

function tidesSection(
  target:
    MoonScientificResolvedTarget,
): MoonScientificSectionModel {

  const tides =
    target.detail.tides;

  return section(
    'tides',
    'SECCIÓN 03',
    'Mareas y rotación',
    'Acoplamiento rotacional, calentamiento de marea y evolución orbital secular.',
    [
      field(
        'Periodo de rotación',
        `${DECIMAL_2.format(tides.rotationPeriodHours)} h`,
        tides.isTidallyLocked
          ? 'Rotación sincronizada 1:1 con la órbita'
          : 'Rotación no sincronizada',
      ),
      field(
        'Acoplamiento de marea',
        labelTidalLocking(
          tides.tidalLockingRegime,
        ),
        `Índice ${formatIndex(tides.tidalLockingIndex01)}`,
      ),
      field(
        'Calentamiento de marea',
        labelTidalRegime(
          tides.tidalRegime,
        ),
        `Índice ${formatIndex(tides.tidalHeatingIndex01)}`,
      ),
      field(
        'Forzamiento de marea',
        formatIndex(
          tides.tidalForcingIndex01,
        ),
      ),
      field(
        'Migración orbital',
        labelMigration(
          tides.migrationRegime,
        ),
      ),
      field(
        'Órbita síncrona del planeta',
        `${DECIMAL_3.format(tides.synchronousOrbitPlanetRadii)} Rplanet`,
      ),
    ],
  );
}

function environmentSection(
  target:
    MoonScientificResolvedTarget,
): MoonScientificSectionModel {

  const environment =
    target.detail.environment;

  return section(
    'environment',
    'SECCIÓN 04',
    'Entorno',
    'Balance térmico, agua y actividad geológica estimada.',
    [
      field(
        'Insolación media de referencia',
        formatScientificInsolationEarth(
          environment.referenceMeanInsolationEarth,
        ),
      ),
      field(
        'Albedo de Bond inferido',
        DECIMAL_3.format(
          environment.inferredBondAlbedo01,
        ),
      ),
      field(
        'Temperatura de equilibrio',
        formatTemperature(
          environment.equilibriumTemperatureKelvin,
        ),
      ),
      field(
        'Temperatura superficial estimada',
        formatTemperature(
          environment.estimatedSurfaceTemperatureKelvin,
        ),
      ),
      ...lunarWaterPhaseFields32F2a(
        environment.waterPhaseInventory32F2a ?? null,
        environment.oceanReality32F2c ?? null,
      ),
      // When 32.F.2c exists, its simulated-world ocean replaces the older
      // 32.F.2b "unknown ocean" placeholder, preventing contradictory cards.
      ...lunarInteriorStructureFields32F2b(
        environment.interiorStructure32F2b ?? null,
        environment.oceanReality32F2c ?? null,
      ).filter(
        item => !environment.oceanReality32F2c || item.label !== 'Océano actual y salinidad',
      ),
      ...lunarOceanRealityFields32F2c(environment.oceanReality32F2c ?? null),
      ...lunarInternalWaterFields(
        environment.internalWaterAssessment ?? null,
        target.detail.general.radiusEarth,
        environment.oceanReality32F2c ?? null,
      ),
      field(
        'Agua',
        labelWaterCT0OrLegacy(
          environment.oceanReality32F2c ?? null,
          labelWater(
            environment.waterRegime,
            environment.waterInventoryIndex01,
            environment.estimatedSurfaceTemperatureKelvin,
            environment.internalWaterAssessment ?? null,
          ),
        ),
        environment.oceanReality32F2c
          ? environment.oceanReality32F2c.state === 'UNRESOLVED_IN_SIMULATED_MODEL'
            ? `Clasificación ambiental e índice de inventario heredados V1 (${formatIndex(environment.waterInventoryIndex01)}); el modelo oceánico 32.F.2c no ha resuelto la fase CT-0. No implica presencia ni ausencia.`
            : `Índice heredado de inventario ${formatIndex(environment.waterInventoryIndex01)}. La presencia/ausencia del océano H₂O corresponde al modelo CT-0 de 32.F.2c, no al indicador V1.`
          : `Inventario ${formatIndex(environment.waterInventoryIndex01)}`,
      ),
      field(
        'Riqueza de hielo inferida',
        formatIndex(
          environment.inferredIceRichnessIndex01,
        ),
      ),
      field(
        'Potencial de océano subsuperficial',
        formatIndex(
          environment.subsurfaceOceanPotentialIndex01,
        ),
        environment.oceanReality32F2c
          ? `Índice V1 histórico, no define presencia oceánica. Consultar el estado físico CT-0 de 32.F.2c (${labelOceanModelReason32F2c(environment.oceanReality32F2c.reason)}).`
          : lunarSubsurfacePotentialNoteV1(
              environment.subsurfaceOceanPotentialIndex01,
              environment.hasSubsurfaceOcean,
              environment.internalWaterAssessment ?? null,
            ),
      ),
      field(
        'Potencial de agua líquida superficial',
        formatIndex(
          environment.surfaceLiquidWaterPotentialIndex01,
        ),
        environment.hasSurfaceLiquidWater
          ? 'Potencial V1 no confirmado: la presión atmosférica estimada en B es un escenario, no una condición líquida validada'
          : 'Sin evidencia suficiente de líquido superficial estable',
      ),
      field(
        'Geología',
        labelGeology(
          environment.geologyRegime,
        ),
        environment.isGeologicallyActive
          ? 'Actividad geológica apreciable'
          : 'Actividad geológica limitada',
      ),
      field(
        'Retención de calor interno',
        formatIndex(
          environment.internalHeatRetentionIndex01,
        ),
      ),
      field(
        'Actividad geológica',
        formatIndex(
          environment.geologicalActivityIndex01,
        ),
      ),
    ],
  );
}

/** Presentation-only section split: the environment physics is unchanged. */
function atmosphereSection(
  target: MoonScientificResolvedTarget,
): MoonScientificSectionModel {
  const environment = target.detail.environment;
  return section(
    'atmosphere',
    'SECCIÓN 05',
    'Atmósfera',
    'Inventario gaseoso, restricciones físicas, modelos condicionales y procesos aún no resueltos.',
    [
      field(
        'Atmósfera',
        labelLunarAtmosphere(
          environment.atmosphereRegime,
          environment.atmosphereAssessment ?? null,
        ),
        `Soporte de columna heredado ${formatIndex(environment.atmosphereRetentionIndex01)} · indicador de escape y reposición, no es presión ni clasificación atmosférica confirmada`,
      ),
      ...lunarAtmosphereFields(environment.atmosphereAssessment ?? null, {
        radiusEarth: target.detail.general.radiusEarth,
        surfaceGravityEarth: target.detail.general.surfaceGravityEarth,
      }),
    ],
  );
}

/** 32.F.3: gamma reference transmission does NOT imply a known incident flux/dose. */
export function lunarRadiationFields32F3(
  model: MoonRadiationProtection32F3 | null,
): readonly MoonScientificFieldModel[] {
  if (model === null) return [];
  const finite = (x: number | null): x is number => x !== null && Number.isFinite(x) && x >= 0;
  const scientific = (n: number): string => new Intl.NumberFormat('es-ES', {
    maximumSignificantDigits: 4, notation: 'scientific',
  }).format(n);
  const att = model.referenceOneMeVGammaIceOpticalDepth;
  const ice = model.iceCoverThicknessMeters;
  const column = model.iceCoverMassColumnKilogramsPerSquareMeter;
  const iceEvaluated = model.waterCoveringState === 'ICE_COVER_OVER_MODELLED_OCEAN' &&
    finite(att) && finite(ice) && finite(column);
  return [
    field('Irradiancia estelar total de referencia (32.F.3)',
      finite(model.referenceBolometricWattsPerSquareMeter)
        ? `${scientific(model.referenceBolometricWattsPerSquareMeter)} W/m²` : 'No resuelta',
      'Flujo bolométrico V2 de referencia, no EUV, rayos X, gamma, partículas ni dosis ionizante. No presupone un espectro estelar de alta energía.'),
    field('Fuente ionizante incidente (32.F.3)', 'No cuantificada',
      'No existe una distribución espectral de fotones EUV/X/gamma ni flujo energético de partículas autorizado. El flujo bolométrico no los sustituye.'),
    field('Columna atmosférica y protección magnetosférica', 'No resueltas',
      'Sin presión y composición atmosféricas físicas ni geometría y espectro de partículas, no se asigna una transmisión protectora.'),
    field('Cubierta protectora de hielo del océano CT-0 (32.F.3)',
      iceEvaluated ? `${scientific(ice)} m · ${scientific(column)} kg/m²` : 'No determinada',
      iceEvaluated
        ? 'Columna derivada de masa y geometría del hielo CT-0. No representa automáticamente atenuación de todas las radiaciones.'
        : 'Solo se identifica una cubierta de hielo cuando el modelo oceánico CT-0 resuelve explícitamente su fase y geometría.'),
    field('Atenuación fotónica de referencia, γ 1 MeV (32.F.3)',
      iceEvaluated
        ? `τ = ${scientific(att)} · transmisión directa ${att > 690 ? '< 10⁻³⁰⁰' : scientific(Math.exp(-att))}`
        : 'No evaluable sin cubierta de hielo validada',
      'Coeficiente NIST de agua líquida utilizado como aproximación composicional del hielo. Solo haz primario monoenergético a 1 MeV: no incluye dispersión secundaria, acumulación de fotones ni espectro incidente. No es dosis ni seguridad biológica.'),
    field('Exposición radiativa real — superficie / océano', 'Desconocida / Desconocida',
      'No existen flujos ionizantes y de partículas independientes suficientes para expresar dosis en Gy/año. Una transmisión de referencia no confirma protección radiativa ni habitabilidad.'),
    field('Blindaje por roca, agua y atmósfera', 'Capacidad física condicionada',
      'El motor admite columnas de masa por material y una fuente fotónica de 1 MeV cuantificada; la roca usa hormigón de referencia y el hielo agua como aproximaciones declaradas. No se inventan columnas ni fuentes reales.'),
  ];
}

function radiationSection(target: MoonScientificResolvedTarget): MoonScientificSectionModel {
  return section(
    'radiation', 'SECCIÓN 06', 'Radiación',
    'Fuentes radiativas, geometría de protección y límites de las estimaciones de exposición.',
    lunarRadiationFields32F3(target.detail.environment.radiationProtection32F3 ?? null).length > 0
      ? lunarRadiationFields32F3(target.detail.environment.radiationProtection32F3 ?? null)
      : [field('Exposición ionizante y protección', 'No resueltas',
          'El modelo V2 no aporta una fuente espectral ionizante y de partículas ni una columna protectora validada.')],
  );
}

/** 32.F.4: no chemical flux, usable redox energy or habitability without reagents. */
export function lunarGeochemistryFields32F4(
  model: MoonGeochemicalEnergy32F4 | null,
): readonly MoonScientificFieldModel[] {
  if (model === null) return [];
  const fmt = (x: number): string => new Intl.NumberFormat('es-ES', {
    maximumSignificantDigits: 4, notation: 'scientific',
  }).format(x);
  const contact: Readonly<Record<MoonGeochemicalEnergy32F4['modeledWaterRockContact'], string>> = {
    DIRECT_LIQUID_SILICATE_INTERFACE_IN_MODEL: 'Contacto líquido-silicatos directo en el modelo',
    LIQUID_ISOLATED_BY_HIGH_PRESSURE_ICE: 'Líquido separado de roca por hielo de alta presión',
    LIQUID_SEPARATED_FROM_SILICATES_BY_UNIDENTIFIED_CONDENSABLES:
      'Líquido separado de silicatos por condensables sin identificar',
    NO_MODELLED_LIQUID_WATER: 'Sin agua líquida modelada CT-0',
    UNRESOLVED: 'No determinado',
  };
  const source = model.solventState === 'MODELLED_LIQUID_H2O_CT0'
    ? `Agua líquida H₂O modelada CT-0 · ${fmt(model.modeledLiquidH2OMassKilograms!)} kg · ${fmt(model.modeledLiquidLayerThicknessKilometers!)} km`
    : model.solventState === 'H2O_SOLID_IN_CT0_MODEL'
      ? 'H₂O sin fase líquida en el escenario CT-0'
      : model.solventState === 'NO_FORMATION_H2O'
        ? 'Sin H₂O de formación en el escenario CT-0'
        : 'Fase de H₂O no resuelta';
  const available = model.reactions.filter(x => x.applicability ===
    'POTENTIAL_IF_SPECIES_AND_CONTACT_EXIST').length;
  const pair = model.modeledOceanTopTemperatureKelvin !== null &&
    model.modeledOceanBottomTemperatureKelvin !== null &&
    model.modeledOceanTopPressurePascal !== null && model.modeledOceanBottomPressurePascal !== null;
  return [
    field('Solvente H₂O — realidad simulada 32.F.4', source,
      'El estado líquido proviene exclusivamente de 32.F.2c. No presupone que la vida requiera agua ni descarta otros solventes.'),
    field('Otros posibles solventes', 'Composición no identificada',
      'Los condensables de formación 32.F.1d no identifican NH₃, hidrocarburos u otros solventes; no se asignan fases ni bioquímica.'),
    field('Contacto agua-roca del modelo', contact[model.modeledWaterRockContact],
      model.directSilicateWaterInterfaceAreaSquareMeters !== null
        ? `Área geométrica de interfaz: ${fmt(model.directSilicateWaterInterfaceAreaSquareMeters)} m². No equivale a superficie mineral reactiva ni permeabilidad.`
        : 'La presencia de H₂O y de roca en el inventario no demuestra contacto, permeabilidad ni alteración hidrotermal.'),
    field('Condiciones de la columna oceánica CT-0', pair
      ? `T ${fmt(model.modeledOceanTopTemperatureKelvin!)}–${fmt(model.modeledOceanBottomTemperatureKelvin!)} K · P ${fmt(model.modeledOceanTopPressurePascal!)}–${fmt(model.modeledOceanBottomPressurePascal!)} Pa`
      : 'No resueltas',
      'Valores radiales del modelo de fases de H₂O; no miden salinidad, concentración de solutos ni gradientes químicos.'),
    field('Potencia térmica interior del modelo 32.F.4',
      model.generatedHeatFluxWattsPerSquareMeter === null || model.generatedGlobalHeatPowerWatts === null
        ? 'No resuelta'
        : `${fmt(model.generatedHeatFluxWattsPerSquareMeter)} W/m² · ${fmt(model.generatedGlobalHeatPowerWatts)} W globales`,
      'Flujo CT-0 procedente de 32.F.2c y área superficial V2. Calor disponible como transporte, NO potencia química ni energía biológica aprovechable.'),
    field('Gradiente térmico conductivo del hielo CT-0',
      model.iceConductiveGradientKelvinPerKilometer === null
        ? 'No determinado'
        : `${fmt(model.iceConductiveGradientKelvinPerKilometer)} K/km`,
      'q/k con conductividad hipotética del hielo 2,5 W/(m·K). No modela circulación convectiva oceánica.'),
    field('Límite ideal de trabajo térmico en el océano',
      model.idealThermalWorkUpperBoundWatts === null ? 'No calculable'
        : `${fmt(model.idealThermalWorkUpperBoundWatts)} W (cota ideal)`,
      'Cota reversible de Carnot basada en extremos térmicos modelados; NO es potencia química extraíble ni producción biológica real.'),
    field('Rutas químicas candidatas (sin tasas)',
      `${available} rutas de contacto/solvente admisibles por hipótesis; ${model.reactions.length} rutas catalogadas`,
      'Alteración agua-silicatos, química H₂/oxidantes, azufre, carbono y fotoquímica; ninguna reacción está confirmada por concentraciones, especies o cinética.'),
    ...model.reactions.map(reaction => field(
      `Ruta de reacción — ${({
        WATER_SILICATE_ALTERATION_H2_CANDIDATE: 'alteración de silicatos',
        H2_OXIDANT_REDox_CANDIDATE: 'H₂ y oxidantes',
        SULFUR_REDox_CANDIDATE: 'especies de azufre',
        CARBON_REDox_CANDIDATE: 'especies de carbono',
        PHOTOCHEMICAL_REDox_CANDIDATE: 'fotoquímica',
      } as const)[reaction.pathway]}`,
      reaction.applicability === 'POTENTIAL_IF_SPECIES_AND_CONTACT_EXIST'
        ? 'Ruta potencial bajo condiciones no identificadas'
        : 'Ruta no establecida con datos disponibles',
      `${reaction.referenceStoichiometry}. Requiere: ${reaction.missingInputs.join('; ')}. No se han calculado ΔG real, tasa ni potencia química.`,
    )),
    field('Desequilibrio redox y energía química utilizable', 'No cuantificados',
      'Faltan actividades y especies oxidantes/reductoras, ΔG de reacción a T/P y tasas. El calor disponible no permite inferir H₂, CH₄, metabolismos ni potencia química.'),
    field('Salinidad, pH y composición disuelta', 'No identificados',
      'No se asignan bioquímicas terrestres ni se inventan solutos a partir de la densidad o de la masa de roca.'),
  ];
}

function geochemistrySection(target: MoonScientificResolvedTarget): MoonScientificSectionModel {
  const model = target.detail.environment.geochemicalEnergy32F4 ?? null;
  return section(
    'geochemistry', 'SECCIÓN 07', 'Geoquímica y energía',
    'Solventes, contacto agua-roca, transporte térmico y rutas de desequilibrio sin atribuir reactivos no identificados.',
    model ? lunarGeochemistryFields32F4(model)
      : [field('Geoquímica y fuentes de energía', 'No resueltas',
          'La ficha heredada no dispone del contrato físico 32.F.4.')],
  );
}

/** Date labels are model-years since formation, not lookback years or calendar dates. */
const fmtYear32F5 = (value: number): string => INTEGER.format(value);
export function lunarEnvironmentalHistoryFields32F5(
  model: MoonEnvironmentalHistory32F5 | null,
): readonly MoonScientificFieldModel[] {
  if (!model) return [field('Cronología física lunar (32.F.5)', 'No disponible',
    'No se ha materializado una fuente histórica para esta ficha. CT-0 no permite inventar el pasado.')];
  const ranges = model.intervals;
  const irradiance = ranges.filter(i => i.irradianceWattsPerSquareMeter !== null);
  const thermal = ranges.filter(i => i.heatFluxWattsPerSquareMeter !== null);
  const ocean = ranges.filter(i => i.oceanState !== 'UNKNOWN');
  const unresolved = ranges.filter(i => i.irradianceWattsPerSquareMeter === null);
  const scientific = (n: number): string => SCIENTIFIC_3.format(n);
  const time = (a: number, b: number): string =>
    `${fmtYear32F5(a)}–${fmtYear32F5(b)} años desde la formación`;
  const represent = (a: {min:number;max:number}): string =>
    `${scientific(a.min)}–${scientific(a.max)} W/m²`;
  const records = irradiance.slice(0, 4).map(i =>
    `${time(i.startYear, i.endYear)}: ${represent(i.irradianceWattsPerSquareMeter!)}`);
  const reason: Record<string,string> = {
    PRE_MAIN_SEQUENCE_OR_FORMATION:'Formación o pre-secuencia principal',
    NOT_MODELLED_STELLAR_ORBITAL_EVOLUTION:'Evolución estelar u orbital no modelada',
    UNRESOLVED_EVENT:'Evento con efectos no resueltos',
    UNRESOLVED_ORBIT_GEOMETRY:'Geometría orbital no resuelta',
  };
  const effectUnits: Record<string,string> = {
    HEAT_FLUX_CHANGE:'W/m²', WATER_MASS_CHANGE:'kg',
    SURFACE_PRESSURE_CHANGE:'Pa', IRRADIANCE_CHANGE:'W/m²',
  };
  const eventNames: Record<string,string> = {
    REALIZED_IMPACT:'Impacto físico', RESOLVED_TRANSIENT_EFFECT:'Efecto transitorio',
    STELLAR_ENVIRONMENT_CHANGE:'Cambio estelar', VOLCANIC_EPISODE:'Episodio volcánico',
    WATER_RESERVOIR_TRANSITION:'Transición de reservorio hídrico',
    GLACIATION_TRANSITION:'Transición glacial',
    CLIMATE_GEOCHEMISTRY_TRANSITION:'Cambio climático o geoquímico',
    ATMOSPHERE_TRANSITION:'Transición atmosférica',
  };
  const disruptions = model.events.map(e =>
    `${time(e.startYear, e.endYear)} · ${eventNames[e.kind] ?? e.kind} · ${
      e.effectDelta !== null && e.effectKind !== null ?
        `cambio cuantificado ${scientific(e.effectDelta.min)}–${scientific(e.effectDelta.max)} ${effectUnits[e.effectKind]} (no estado completo)` :
        'efecto ambiental sin cuantificar'}`);
  return [
    field('Edad común CT-0 de la cronología', model.ageYearsCT0 === null ? 'No determinada'
      : `${fmtYear32F5(model.ageYearsCT0)} años`,
      'El eje temporal es años desde la formación del mismo sistema. No se usa el reloj del navegador.'),
    field('Cobertura física fechada del modelo estelar (32.F.5a)',
      ({ MODELLED_MS_CONDITIONAL: 'Secuencia principal: irradiancia condicional modelada',
         UNSUPPORTED_ORBIT_GEOMETRY: 'Geometría orbital no resuelta',
         HOST_NOT_MAIN_SEQUENCE: 'Anfitrión fuera de secuencia principal',
         HOST_OUTSIDE_MS_LUMINOSITY_DOMAIN: 'Fuera del dominio estelar admitido',
         TOO_YOUNG_OR_FORMING: 'Formación o pre-secuencia principal aún sin cobertura',
         EVENT_INVALIDATED_ORBITAL_MODEL: 'Evolución invalidada por evento fechado',
         SOURCE_NOT_MATERIALIZED: 'Fuente física histórica no materializada',
       } as Record<string,string>)[model.conditionalIrradianceStatus32F5a ?? 'SOURCE_NOT_MATERIALIZED'],
      'Los modelos fechados reutilizan luminosidad inicial, edad y órbitas congeladas V2. Para anfitriones de baja masa se usa una envolvente de sensibilidad amplia, no una trayectoria estelar calibrada. Los tramos no sustentados permanecen desconocidos.'),
    field('Irradiancia estelar histórica (fuente V2 31.F.i.3)',
      irradiance.length ? `${irradiance.length} tramos de cálculo condicional` : 'No resuelta',
      irradiance.length ? `Ejemplos fechados: ${records.join(' | ')}. Solo irradiancia de estrellas y órbitas modeladas; no temperaturas superficiales reales, presión atmosférica ni radiación ionizante. La temperatura radiativa ideal se informa aparte (32.F.5a).`
        : 'Sin intervalos físicamente fechados; no se extrapola la irradiancia CT-0.'),
    field('Equilibrio radiativo ideal histórico (32.F.5a)',
      irradiance.some(i => i.idealRadiativeEquilibriumKelvin32F5a !== null &&
        i.idealRadiativeEquilibriumKelvin32F5a !== undefined)
        ? `${irradiance.filter(i => i.idealRadiativeEquilibriumKelvin32F5a != null).length} tramos calculados`
        : 'No resuelto',
      irradiance.filter(i => i.idealRadiativeEquilibriumKelvin32F5a != null).slice(0,3)
        .map(i => `${time(i.startYear,i.endYear)}: ${scientific(i.idealRadiativeEquilibriumKelvin32F5a!.min)}–${scientific(i.idealRadiativeEquilibriumKelvin32F5a!.max)} K`)
        .join(' | ') + (irradiance.some(i => i.idealRadiativeEquilibriumKelvin32F5a != null)
          ? '. Temperatura de cuerpo negro ideal con albedo cero y redistribución global; NO es temperatura superficial, clima, habitabilidad ni una condición histórica observada.'
          : 'Sin equilibrio radiativo ideal fechado no se calcula una temperatura de referencia.'),
    ),
    field('Intervalos sin irradiancia fechada',
      unresolved.length ? `${unresolved.length} tramo(s) no resuelto(s)` :
        model.ageYearsCT0 === null ? 'Edad desconocida' : 'Sin huecos identificados en esta fuente',
      unresolved.length ? unresolved.slice(0, 4).map(x => time(x.startYear, x.endYear)).join(' | ')
        : 'La ausencia de huecos en irradiancia no significa historia ambiental completa.'),
    field('Evolución de calor mareal y radiogénico', thermal.length
      ? `${thermal.length} intervalos físicos fechados` : 'No resuelta',
      'El flujo térmico CT-0 no se propaga al pasado. Sin historia orbital/disipativa fechada no se certifica estabilidad mareal.'),
    field('Evolución de océanos y congelación', ocean.length
      ? `${ocean.length} intervalos con fase H₂O resuelta; ${model.datedOceanTransitionCount} transición(es) fechada(s)`
      : 'No resuelta históricamente',
      `Estado del océano CT-0: ${model.currentOceanStateCT0 === 'PRESENT' ? 'presente' :
        model.currentOceanStateCT0 === 'ABSENT' ? 'ausente' : 'no resuelto'}. El estado actual no establece cuándo nació o desapareció un océano.`),
    field('Eventos y consecuencias ambientales fechadas', model.events.length
      ? `${model.events.length} registro(s)` : 'Sin eventos aportados por una fuente fechada',
      disruptions.length ? disruptions.slice(0, 4).join(' | ')
        : 'Una lista vacía no significa que no ocurrieran impactos, llamaradas o catástrofes.'),
    field('Interrupciones de los modelos físicos fechados',
      model.datedModelInterruptions.length
        ? `${model.datedModelInterruptions.length} intervalo(s) identificado(s)` : 'No identificadas en esta fuente',
      model.datedModelInterruptions.length ? model.datedModelInterruptions.slice(0,4)
        .map(x=> `${time(x.startYear,x.endYear)} · ${reason[x.reason] ?? x.reason}`).join(' | ')
        : 'No equivale a continuidad histórica de todos los procesos.'),
    field('Presión, radiación ionizante y química históricas',
      'No certificadas con los datos actuales',
      'La irradiancia total no es una dosis. Las propiedades químicas CT-0 y la presión atmosférica actual tampoco se extrapolan retrospectivamente.'),
    field('Estabilidad ambiental y habitabilidad histórica', 'No certificadas',
      '32.F.5 preserva intervalos desconocidos y consecuencias sin cuantificar. El estado CT-0 no prueba continuidad temporal, vida ni condiciones biológicas universales.'),
  ];
}
function environmentalHistorySection(target: MoonScientificResolvedTarget): MoonScientificSectionModel {
  return section('history', 'SECCIÓN 08', 'Historia ambiental',
    'Cronología física fechada del sistema, cambios cuantificados y huecos de conocimiento, sin extrapolar CT-0.',
    lunarEnvironmentalHistoryFields32F5(target.detail.environment.environmentalHistory32F5 ?? null));
}

function habitabilitySection(
  target:
    MoonScientificResolvedTarget,
): MoonScientificSectionModel {

  const habitability =
    target.detail.habitability;
  // Older resolved targets may carry a V1 candidate flag even when the
  // independent C assessment does not support a stable ice-covered ocean.
  // Keep legacy scores visible without presenting the flag as a current claim.
  const thermal = target.detail.environment.internalWaterAssessment ?? null;
  const unsupportedLegacySubsurface = habitability.subsurfaceCandidate &&
    thermal !== null && thermal.iceShellThermalRegime !== 'CONDITIONAL_ICE_OCEAN';
  const ocean = target.detail.environment.oceanReality32F2c ?? null;
  const oceanPresent = ocean?.state === 'PRESENT_IN_SIMULATED_MODEL';
  const oceanAbsent = ocean?.state === 'ABSENT_IN_SIMULATED_MODEL';
  const oceanHabitabilityNote = 'La realidad simulada CT-0 resuelve el océano de H₂O, pero no demuestra viabilidad química, disponibilidad de energía utilizable, protección radiativa, continuidad histórica ni vida.';

  return section(
    'habitability',
    'SECCIÓN 09',
    'Habitabilidad',
    'Evaluación comparativa de condiciones potenciales de superficie y subsuelo.',
    [
      field(
        'Clasificación',
        oceanPresent
          ? habitability.subsurfaceCandidate
            ? 'Candidatura de habitabilidad subsuperficial V1 (océano CT-0 modelado)'
            : 'Océano CT-0 presente; habitabilidad no determinada por el índice V1'
          : oceanAbsent
            ? habitability.surfaceCandidate ? 'Candidatura superficial V1 (sin océano H₂O CT-0)' : 'Sin candidatura acuosa subsuperficial CT-0'
            : unsupportedLegacySubsurface
              ? habitability.surfaceCandidate ? 'Candidata superficial (subsuelo no corroborado)' : 'Sin candidatura potencial'
              : `${labelHabitability(habitability.habitabilityRegime)}${thermal && habitability.subsurfaceCandidate ? ' (escenario térmico condicionado)' : ''}`,
        oceanPresent
          ? `Océano subsuperficial presente en el modelo físico CT-0. ${oceanHabitabilityNote} Los índices de habitabilidad V1 no han cambiado.`
          : oceanAbsent
            ? `El mundo simulado CT-0 no contiene océano subsuperficial H₂O. El potencial V1 no prevalece sobre ese estado; esto no descarta otros solventes ni permite inferir vida. Los índices V1 se conservan.`
            : unsupportedLegacySubsurface
              ? `Candidatura subsuperficial V1 heredada no corroborada por el balance térmico C. ${lunarThermalCaveat(thermal)} No implica vida ni biosignaturas.`
              : thermal && habitability.subsurfaceCandidate
                ? `Candidatura termodinámicamente admisible en el escenario C, pero no observada ni confirmada. ${lunarThermalCaveat(thermal)} No implica vida ni biosignaturas.`
                : 'Una candidatura de habitabilidad no implica presencia de vida ni biosignaturas.',
      ),
      field(
        'Índice global',
        formatIndex(
          habitability.overallHabitabilityIndex01,
        ),
        oceanPresent || oceanAbsent
          ? 'Índice comparativo V1 sin recalcular. No certifica habitabilidad, aunque el estado oceánico H₂O esté resuelto en el modelo físico CT-0.'
          : target.detail.environment.internalWaterAssessment && habitability.subsurfaceCandidate
            ? 'Índice comparativo V1: no equivale a una probabilidad ni confirma la existencia de agua líquida interior.'
            : null,
      ),
      field(
        'Ruta superficial',
        habitability.surfaceCandidate
          ? 'Candidata'
          : 'No candidata',
        `Índice ${formatIndex(habitability.surfaceHabitabilityIndex01)}`,
      ),
      field(
        'Ruta subsuperficial',
        oceanPresent
          ? habitability.subsurfaceCandidate
            ? 'Potencial V1 de habitabilidad (océano H₂O presente CT-0)'
            : 'Océano H₂O presente CT-0; habitabilidad aún no evaluada'
          : oceanAbsent
            ? 'Sin candidatura subsuperficial acuosa CT-0'
            : unsupportedLegacySubsurface
              ? 'No candidata (índice heredado no corroborado)'
              : habitability.subsurfaceCandidate
                ? thermal
                  ? 'Candidata condicional (océano no confirmado)'
                  : 'Candidata'
                : 'No candidata',
        `Índice V1 ${formatIndex(habitability.subsurfaceHabitabilityIndex01)}${oceanPresent || oceanAbsent
          ? ` · ${oceanHabitabilityNote}`
          : target.detail.environment.internalWaterAssessment
            ? ` · ${lunarThermalCaveat(target.detail.environment.internalWaterAssessment)}`
            : ''}`,
      ),
      field('Interpretación de índices de soporte',
        'Indicadores comparativos heredados V1 (0–1)',
        'Los índices siguientes no son flujos, concentraciones, dosis, presiones ni probabilidades de vida; no prevalecen sobre los modelos físicos CT-0.'),
      field(
        'Soporte térmico superficial',
        formatIndex(
          habitability.surfaceTemperatureSupportIndex01,
        ),
      ),
      field(
        'Soporte atmosférico',
        formatIndex(
          habitability.surfaceAtmosphereSupportIndex01,
        ),
      ),
      field(
        'Soporte gravitatorio',
        formatIndex(
          habitability.surfaceGravitySupportIndex01,
        ),
      ),
      field(
        'Moderación de mareas',
        formatIndex(
          habitability.tidalModerationIndex01,
        ),
      ),
      field(
        'Energía subsuperficial',
        formatIndex(
          habitability.subsurfaceEnergySupportIndex01,
        ),
        'Índice energético V1 heredado; no equivale al flujo térmico físico de 32.F.2c/32.F.4, a la cota de Carnot ni a potencia geoquímica disponible.',
      ),
    ],
  );
}


function comparisonSection(
  comparison:
    WorldEarthComparisonModel,
): MoonScientificSectionModel {

  return section(
    'comparison',
    'SECCIÓN 10',
    'Comparación con la Tierra',
    'Comparación adimensional con la Tierra y escala lineal de tamaño basada en el radio físico del satélite.',
    [
      field(
        'Radio relativo',
        `${formatRelative(comparison.radiusEarth)} × el radio terrestre`,
      ),
      field(
        'Masa relativa',
        `${formatRelative(comparison.massEarth)} × la masa terrestre`,
      ),
      field(
        'Área superficial relativa',
        `${formatRelative(comparison.surfaceAreaEarth)} × la superficie terrestre`,
        'Derivada del cuadrado del radio relativo.',
      ),
      field(
        'Volumen relativo',
        `${formatRelative(comparison.volumeEarth)} × el volumen terrestre`,
        'Derivado del cubo del radio relativo.',
      ),
      field(
        'Densidad relativa',
        `${formatRelative(comparison.densityEarth)} × la densidad media terrestre`,
      ),
      field(
        'Gravedad superficial relativa',
        `${formatRelative(comparison.surfaceGravityEarth)} × la gravedad terrestre`,
      ),
    ],
  );
}

function badges(
  target:
    MoonScientificResolvedTarget,
): readonly string[] {

  const result:
    string[] = [];

  if (
    target.detail.tides.isTidallyLocked
  ) {
    result.push(
      'Rotación sincronizada',
    );
  }

  const modeledOcean = target.detail.environment.oceanReality32F2c;
  if (modeledOcean?.state === 'PRESENT_IN_SIMULATED_MODEL') {
    result.push('Océano subsuperficial presente (universo simulado CT-0)');
  } else if (modeledOcean?.state === 'ABSENT_IN_SIMULATED_MODEL') {
    result.push('Sin océano subsuperficial H₂O en el modelo CT-0');
  } else if (target.detail.environment.hasSubsurfaceOcean) {
    const thermal = target.detail.environment.internalWaterAssessment;
    result.push(
      !thermal
        ? 'Potencial de océano subsuperficial (índice V1)'
        : unsupportedLegacyOcean(thermal)
          ? 'Potencial oceánico heredado (sin soporte térmico C)'
          : thermal.iceShellThermalRegime === 'CONDITIONAL_ICE_OCEAN'
            ? 'Posible océano subsuperficial (no confirmado)'
            : 'Potencial oceánico heredado (balance no resuelto)',
    );
  }

  if (
    target.detail.environment.hasSurfaceLiquidWater
  ) {
    // The legacy V1 flag marks a surface-water candidate, not confirmed
    // stable liquid: atmospheric pressure and phase stability are unresolved.
    result.push(
      'Potencial de agua líquida superficial (no confirmado)',
    );
  }

  if (target.detail.habitability.isPotentiallyHabitable) {
    const thermal = target.detail.environment.internalWaterAssessment;
    result.push(
      modeledOcean?.state === 'PRESENT_IN_SIMULATED_MODEL' &&
        target.detail.habitability.subsurfaceCandidate
        ? 'Potencial de habitabilidad V1 (océano CT-0 modelado; otros criterios pendientes)'
        : modeledOcean?.state === 'ABSENT_IN_SIMULATED_MODEL' &&
            target.detail.habitability.subsurfaceCandidate
          ? 'Potencial de habitabilidad V1 no corroborado (sin océano H₂O CT-0)'
          : target.detail.habitability.subsurfaceCandidate && thermal &&
              thermal.iceShellThermalRegime !== 'CONDITIONAL_ICE_OCEAN'
            ? 'Candidatura subsuperficial heredada (no corroborada)'
            : thermal && target.detail.habitability.subsurfaceCandidate
              ? 'Candidatura subsuperficial condicional (sin confirmar)'
              : 'Candidata potencialmente habitable',
    );
  }

  return result;
}

function section(
  id:
    MoonScientificSectionId,
  eyebrow:
    string,
  title:
    string,
  summary:
    string,
  fields:
    readonly MoonScientificFieldModel[],
): MoonScientificSectionModel {

  return Object.freeze({
    id,
    eyebrow,
    title,
    summary,
    fields:
      Object.freeze([
        ...fields,
      ]),
  });
}

function field(
  label:
    string,
  value:
    string,
  note:
    string | null =
      null,
): MoonScientificFieldModel {

  return Object.freeze({
    label,
    value,
    note,
  });
}

export function formatScientificInsolationEarth(
  value:
    number,
): string {
  if (
    !Number.isFinite(value) ||
    value < 0
  ) {
    throw new RangeError(
      'referenceMeanInsolationEarth must be finite and non-negative.',
    );
  }

  return `${formatAdaptive(value)} S⊕`;
}

function formatAdaptive(
  value:
    number,
): string {

  const absolute =
    Math.abs(
      value,
    );

  return absolute !==
      0 &&
    absolute <
      0.001
    ? SCIENTIFIC_3.format(
        value,
      )
    : DECIMAL_3.format(
        value,
      );
}

function formatRelative(
  value:
    number,
): string {

  return formatAdaptive(
    value,
  );
}

function formatIndex(
  value:
    number,
): string {

  return `${DECIMAL_3.format(value)} / 1`;
}

function formatTemperature(
  kelvin:
    number,
): string {

  return `${DECIMAL_1.format(kelvin)} K · ${DECIMAL_1.format(kelvin - 273.15)} °C`;
}

/**
 * B.1 — Presentation-only pressure/chemistry semantics.
 * An unresolved hydrostatic column is not proof of a vacuum or of an exosphere.
 * The phase-21 support index remains intact, but it cannot override B's
 * explicit pressure/composition status.
 */
function resolvedLunarGasColumn(
  assessment: MoonAtmosphereAssessment | null,
): assessment is MoonAtmosphereAssessment & { readonly estimatedSurfacePressurePascal: number } {
  return assessment !== null &&
    (assessment.pressureBasis === 'CONDITIONAL_SCENARIO' || assessment.pressureBasis === 'PHYSICAL_BALANCE') &&
    assessment.estimatedSurfacePressurePascal !== null &&
    Number.isFinite(assessment.estimatedSurfacePressurePascal) &&
    assessment.estimatedSurfacePressurePascal > 0 &&
    assessment.species.some(species =>
      Number.isFinite(species.moleFraction01) && species.moleFraction01 > 0,
    );
}

/**
 * Qualitative bins are explicitly scenario-only (not observational classes).
 * The 10–100 Pa bin describes traces, 100–10 000 Pa a tenuous atmosphere,
 * and larger pressures a substantial candidate column. Do not relabel an
 * uncharacterized column using the legacy retention proxy.
 */
export function labelLunarAtmosphere(
  legacyRegime: string,
  assessment: MoonAtmosphereAssessment | null,
): string {
  if (assessment === null) return labelAtmosphere(legacyRegime);
  if (assessment.physicalBalance32F1?.regime === 'ABSENT_IN_EVALUATED_MODEL') return 'Sin atmósfera en intervalo modelado';
  if (assessment.physicalBalance32F1?.regime === 'UNRESOLVED_PHOTOCHEMISTRY') return 'Fotoproductos no resueltos';
  if (assessment.physicalBalance32F1?.regime === 'EXOSPHERE') return 'Exosfera (balance físico)';
  if (assessment.physicalBalance32F1?.regime === 'TRANSIENT') return 'Atmósfera transitoria (balance físico)';
  if (assessment.physicalBalance32F1?.regime === 'STABLE_OVER_EVALUATED_INTERVAL') return 'Atmósfera estable en intervalo modelado';
  if (!resolvedLunarGasColumn(assessment)) return 'Columna atmosférica no resuelta';
  const pressure = assessment.estimatedSurfacePressurePascal;
  if (pressure < 100) return 'Trazas atmosféricas (escenario)';
  if (pressure < 10_000) return 'Atmósfera tenue (escenario)';
  return 'Atmósfera sustancial (escenario)';
}

/** B atmospheric scenario is informational only; V1 habitability stays unchanged. */
export function lunarAtmosphereFields(
  assessment: MoonAtmosphereAssessment | null,
  geometry: Readonly<{ radiusEarth: number; surfaceGravityEarth: number }> | null = null,
): readonly MoonScientificFieldModel[] {
  if (assessment === null) return [];
  const resolved = resolvedLunarGasColumn(assessment);
  const pressure = resolved ? assessment.estimatedSurfacePressurePascal
    : assessment.pressureBasis === 'PHYSICAL_BALANCE' && assessment.estimatedSurfacePressurePascal === 0
      ? 0 : null;
  const atmosphereComposition = resolved
    ? assessment.species.filter(species => species.moleFraction01 > 0)
      .slice(0, 5).map(component =>
        `${labelLunarGas(component.gas)} ${DECIMAL_1.format(component.moleFraction01 * 100)} %`,
      ).join(' · ')
    : 'No resuelta';
  const condensation = !resolved
    ? 'Condensación no evaluable'
    : assessment.condensationRemovalIndex01 <= 0.0005
      ? 'Sin condensación apreciable'
      : formatIndex(assessment.condensationRemovalIndex01);
  const physical = assessment.physicalBalance32F1;
  const automatic = assessment.automaticConstraints32F1c;
  const formationEvolution = assessment.formationEvolution32F1e;
  // The existing B pressure is conditional. This mass is only its exact
  // hydrostatic *equivalent*, not an independently sourced gas inventory.
  const conditionalEquivalentMass = assessment.pressureBasis === 'CONDITIONAL_SCENARIO' &&
    pressure !== null && geometry !== null &&
    Number.isFinite(geometry.radiusEarth) && geometry.radiusEarth > 0 &&
    Number.isFinite(geometry.surfaceGravityEarth) && geometry.surfaceGravityEarth > 0
    ? pressure * (4 * Math.PI * (geometry.radiusEarth * 6_371_000) ** 2) /
        (geometry.surfaceGravityEarth * 9.80665) : null;
  const physicalFields: MoonScientificFieldModel[] = [
    ...(automatic === null || automatic === undefined ? [] : [
      field('Velocidad de escape lunar (32.F.1c)',
        formatAdaptive(automatic.escapeVelocityMetersPerSecond) + ' m/s',
        'Calculada de radio y gravedad V2; no es una tasa de escape de gas ni una prueba de retención estable'),
      field('Masa hidrostática equivalente por pascal (32.F.1c)',
        formatAdaptive(automatic.kilogramsOfGasPerPascal) + ' kg/Pa',
        'Factor físico de conversión P·área/g; NO determina la masa de gas presente sin inventario independiente'),
      ...(automatic.waterVaporSaturationPascalIfEquilibrated === null ? [] : [
        field('Saturación de vapor de H₂O (escenario 32.F.1c)',
          formatAdaptive(automatic.waterVaporSaturationPascalIfEquilibrated) + ' Pa',
          'Solo presión parcial de equilibrio si hay agua y fases en equilibrio; no es presión atmosférica medida, ni demuestra vapor u océano'),
      ]),
      field('Datos atmosféricos independientes pendientes (32.F.1c)',
        'Masa gaseosa, EUV, partículas, fotólisis y tasas de reposición',
        'Las magnitudes V2 anteriores no justifican sustituir las tasas desconocidas por ceros ni certificar atmósfera, exosfera o ausencia'),
    ]),
    ...(conditionalEquivalentMass === null ? [] : [
      field('Masa equivalente del escenario atmosférico',
        formatAdaptive(conditionalEquivalentMass) + ' kg',
        'Equivalencia P·área/g del escenario B, no inventario atmosférico físico independiente ni medición'),
    ]),
    ...(formationEvolution === null || formationEvolution === undefined ? [] : [
      field('Vapor H₂O inicial saturado (escenario 32.F.1e)',
        formationEvolution.conditionalInitialWaterVaporPressurePascal === null
          ? 'No evaluable'
          : formatAdaptive(formationEvolution.conditionalInitialWaterVaporPressurePascal) + ' Pa',
        'Solo si parte del hielo de formación se encuentra expuesta y en equilibrio. No representa presión atmosférica real.'),
      field('Evolución del vapor H₂O (escenario 32.F.1e)',
        formationEvolution.conditionalFinalWaterVaporPressurePascal === null
          ? 'No determinada: faltan condiciones de exobase y reposición'
          : formatAdaptive(formationEvolution.conditionalFinalWaterVaporPressurePascal) + ' Pa al final del intervalo hipotético',
        'No se proyecta presión tras una órbita: la superficie no define una exobase y faltan pérdidas y reposición cuantificadas. La columna inicial es solo condicional.'),
      field('Masa gaseosa H₂O inicial del escenario 32.F.1e',
        formationEvolution.conditionalInitialWaterVaporMassKilograms === null
          ? 'No evaluable'
          : formatAdaptive(formationEvolution.conditionalInitialWaterVaporMassKilograms) + ' kg',
        'Máximo de columna H₂O condicional por equilibrio e inventario de formación; nunca masa atmosférica inicial conocida.'),
      field('Escape térmico Jeans (escenario 32.F.1e)',
        formationEvolution.conditionalThermalJeansEscapeKilogramsPerSecond === null
          ? 'No calculable: exobase sin caracterizar'
          : formatAdaptive(formationEvolution.conditionalThermalJeansEscapeKilogramsPerSecond) + ' kg/s',
        'El flujo Jeans requiere temperatura, densidad y altitud de exobase, además de comprobar el régimen cinético. No se usa la temperatura superficial como sustituto.'),
    ]),
    field('Balance físico lunar 32.F.1', physical === null || physical === undefined
      ? 'No evaluable: faltan masa inicial y tasas físicas independientes'
      : labelLunarPhysicalRegime32F1(physical.regime),
      'Sin series cuantitativas de EUV, partículas, fotólisis y reposición no puede certificarse estabilidad'),
    ...(physical === null || physical === undefined ? [] : [
      field('Masa atmosférica final (balance 32.F.1)', formatAdaptive(physical.remainingGasMassKilograms) + ' kg',
        'Masa obtenida del balance cuantitativo; no es una medida directa'),
      field('Escapes térmico y por partículas (32.F.1)',
        formatAdaptive(physical.thermalEscapedMassKilograms) + ' kg · ' + formatAdaptive(physical.particleEscapedMassKilograms) + ' kg',
        'Pérdidas integradas solo para el intervalo y las tasas suministradas'),
      field('Fotólisis y condensación (32.F.1)',
        formatAdaptive(physical.photolysisEscapedMassKilograms) + ' kg escapados · ' +
        formatAdaptive(physical.condensedMassKilograms) + ' kg condensados',
        'La fotodisociación no equivale automáticamente a pérdida de masa; productos no identificados mantienen presión desconocida'),
    ]),
  ];
  return [
    ...physicalFields,
    field('Inventario volátil atmosférico (inferido)', formatIndex(assessment.volatileInventoryIndex01),
      'Disponibilidad relativa inferida de la composición global, no un inventario gaseoso medido'),
    field(assessment.pressureBasis === 'PHYSICAL_BALANCE'
      ? 'Presión superficial atmosférica (balance físico)'
      : 'Presión superficial atmosférica (escenario)', pressure === null
      ? 'No determinada'
      : `${formatAdaptive(pressure)} Pa · ${formatAdaptive(pressure / 100_000)} bar`,
      assessment.pressureBasis === 'PHYSICAL_BALANCE'
        ? 'Resultado modelado de masa, gravedad y flujos cuantificados en el intervalo; no es presión observada ni historia certificada'
        : 'Estimación condicional de primer orden; faltan fotólisis, EUV, erosión por partículas y evolución atmosférica'),
    field('Composición gaseosa candidata', atmosphereComposition,
      'Fracciones molares estimadas tras escape térmico y condensación; no equivalen a detecciones espectroscópicas'),
    field('Retención frente a escape térmico', formatIndex(assessment.thermalEscapeSupportIndex01),
      'Indicador V1, no una tasa física ni la retención calculada en 32.F.1'),
    field('Condensación de gases candidatos', condensation,
      resolved
        ? 'Fracción aproximada removida de la columna candidata por equilibrio de saturación'
        : 'Sin columna gaseosa hidrostática resuelta no puede interpretarse un índice de remoción como condensación de una atmósfera estable'),
    field('Reposición por volátiles y mareas', formatIndex(assessment.replenishmentSupportIndex01),
      'Indicador V1; no equivale a kg/s cuantificados'),
    field('Entorno radiativo y magnetosférico', 'Protección frente a partículas y blindaje magnetosférico: no evaluables',
      `Insolación de referencia: ${formatScientificInsolationEarth(assessment.irradiationReferenceEarth)}. No hay flujo EUV/partículas ni geometría magnetosférica resueltos; orbitar un gigante no implica protección. La atenuación fotónica por materiales se calcula separadamente en Radiación (32.F.3), cuando hay columnas físicas justificadas; no equivale a dosis.`),
  ];
}

function labelLunarGas(gas: string): string {
  switch (gas) {
    case 'NITROGEN': return 'N₂';
    case 'METHANE': return 'CH₄';
    case 'CARBON_DIOXIDE': return 'CO₂';
    case 'ARGON': return 'Ar';
    case 'AMMONIA': return 'NH₃';
    case 'WATER_VAPOR': return 'H₂O';
    case 'SULFUR_DIOXIDE': return 'SO₂';
    default: return gas;
  }
}

function labelAtmosphere(
  regime:
    string,
): string {

  switch (regime) {
    case 'NONE':
      return 'Sin atmósfera retenida';
    case 'EXOSPHERE':
      return 'Exosfera';
    case 'TRACE':
      return 'Trazas atmosféricas';
    case 'THIN':
      return 'Atmósfera tenue';
    case 'SUBSTANTIAL':
      return 'Atmósfera sustancial';
    default:
      return regime;
  }
}

function labelWaterCT0OrLegacy(
  ocean: MoonOceanReality32F2c | null,
  legacy: string,
): string {
  if (ocean === null || ocean.state === 'UNRESOLVED_IN_SIMULATED_MODEL') return legacy;
  return ocean.state === 'PRESENT_IN_SIMULATED_MODEL'
    ? 'Hielo y océano subsuperficial (realidad simulada CT-0)'
    : 'Sin océano subsuperficial H₂O en el modelo CT-0';
}

function labelWater(
  regime:
    string,

  waterInventoryIndex01:
    number,

  estimatedSurfaceTemperatureKelvin:
    number,

  internalWaterAssessment: MoonInternalWaterAssessment | null = null,
): string {

  if (internalWaterAssessment &&
      (regime === 'SUBSURFACE_OCEAN' || regime === 'ICE_AND_SUBSURFACE_OCEAN' || regime === 'MIXED')) {
    if (internalWaterAssessment.iceShellThermalRegime === 'NO_STABLE_SURFACE_ICE') {
      return 'Agua interior potencial; sin corteza global de hielo estable';
    }
    if (unsupportedLegacyOcean(internalWaterAssessment)) {
      return 'Hielo con potencial oceánico heredado; sin soporte térmico en C';
    }
    if (internalWaterAssessment.iceShellThermalRegime !== 'CONDITIONAL_ICE_OCEAN') {
      return 'Hielo con potencial oceánico heredado (balance no evaluable)';
    }
    return regime === 'SUBSURFACE_OCEAN'
      ? 'Posible océano subsuperficial (sin confirmar)'
      : 'Hielo y posible océano subsuperficial (sin confirmar)';
  }

  switch (regime) {
    case 'NONE':
      return waterInventoryIndex01 >= 0.08 && estimatedSurfaceTemperatureKelvin > 273.16
        ? 'Sin agua superficial estable'
        : 'Sin inventario de agua relevante';
    case 'SURFACE_ICE':
      return 'Hielo superficial';
    case 'SUBSURFACE_OCEAN':
      return 'Océano subsuperficial';
    case 'ICE_AND_SUBSURFACE_OCEAN':
      return 'Hielo y océano subsuperficial';
    case 'SURFACE_LIQUID':
      return 'Potencial de agua líquida superficial';
    case 'MIXED':
      return 'Estado mixto potencial';
    default:
      return regime;
  }
}

function labelGeology(
  regime:
    string,
): string {

  switch (regime) {
    case 'INERT':
      return 'Inerte';
    case 'LOW_ACTIVITY':
      return 'Actividad baja';
    case 'ACTIVE':
      return 'Activa';
    case 'TIDALLY_ACTIVE':
      return 'Activa por mareas';
    case 'EXTREME':
      return 'Actividad extrema';
    default:
      return regime;
  }
}

function labelHabitability(
  regime:
    string,
): string {

  switch (regime) {
    case 'NONE':
      return 'Sin candidatura potencial';
    case 'SUBSURFACE_CANDIDATE':
      return 'Candidata subsuperficial';
    case 'SURFACE_CANDIDATE':
      return 'Candidata superficial';
    case 'SURFACE_AND_SUBSURFACE_CANDIDATE':
      return 'Candidata superficial y subsuperficial';
    default:
      return regime;
  }
}

function labelTidalRegime(
  regime:
    string,
): string {

  switch (regime) {
    case 'NEGLIGIBLE':
      return 'Despreciable';
    case 'WEAK':
      return 'Débil';
    case 'MODERATE':
      return 'Moderado';
    case 'STRONG':
      return 'Fuerte';
    case 'EXTREME':
      return 'Extremo';
    default:
      return regime;
  }
}

function labelTidalLocking(
  regime:
    string,
): string {

  switch (regime) {
    case 'UNLOCKED':
      return 'No sincronizado';
    case 'EVOLVING':
      return 'En evolución hacia sincronización';
    case 'SYNCHRONIZED':
      return 'Sincronizado';
    default:
      return regime;
  }
}

function labelMigration(
  regime:
    string,
): string {

  switch (regime) {
    case 'INWARD':
      return 'Hacia el interior';
    case 'NEAR_SYNCHRONOUS':
      return 'Cercana a órbita síncrona';
    case 'OUTWARD':
      return 'Hacia el exterior';
    default:
      return regime;
  }
}

function labelGiantMoonOrbitalFamily(
  family:
    string,
): string {

  switch (family) {
    case 'INNER_REGULAR':
      return 'Regular interior';
    case 'MAJOR_REGULAR':
      return 'Regular principal';
    case 'OUTER_REGULAR':
      return 'Regular exterior';
    default:
      return family;
  }
}

function labelGiantMoonComposition(
  regime:
    string,
): string {

  switch (regime) {
    case 'ROCK_RICH':
      return 'Rica en roca';
    case 'MIXED_ROCK_ICE':
      return 'Mezcla roca-hielo';
    case 'ICE_RICH':
      return 'Rica en hielo';
    default:
      return regime;
  }
}

function labelLunarPhysicalRegime32F1(regime: string): string {
  switch (regime) {
    case 'STABLE_OVER_EVALUATED_INTERVAL': return 'Estable durante intervalo evaluado (no estabilidad histórica global)';
    case 'TRANSIENT': return 'Transitoria durante intervalo evaluado';
    case 'EXOSPHERE': return 'Exosfera (régimen no colisional superficial)';
    case 'ABSENT_IN_EVALUATED_MODEL': return 'Sin gas retenido en el modelo del intervalo';
    default: return 'No resuelto: productos fotoquímicos sin composición';
  }
}
