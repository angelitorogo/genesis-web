import { type MoonInternalWaterAssessment } from '../../domain/planetary/moon-internal-water-assessment';
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
): readonly MoonScientificFieldModel[] {
  if (!assessment) { return []; }
  const flux = (value: number): string => new Intl.NumberFormat('es-ES', {
    maximumSignificantDigits: 3,
    ...(value > 0 && (value < 0.001 || value >= 10000) ? { notation: 'scientific' as const } : {}),
  }).format(value);
  const shell = lunarConductiveShellPresentation(assessment, moonRadiusEarth);
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
      'Viabilidad térmica del hielo y océano',
      labelIceShellThermalRegime(assessment.iceShellThermalRegime),
      'Modelo conductivo condicional con conductividad 2,5 W/(m·K), fusión entre 240 y 273,15 K y espesor de corteza desconocido; no confirma océanos.',
    ),
    field(
      'Espesor conductivo de hielo (escenario)',
      shell.value,
      shell.note,
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
      'Calor radiogénico y propiedades del hielo',
      'No resueltos',
      'Sin radionúclidos, reología, salinidad, presión interior ni espesor conocido no puede confirmarse ni excluirse un océano.',
    ),
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
    'Balance térmico, atmósfera, agua y actividad geológica estimada.',
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
      field(
        'Atmósfera',
        labelLunarAtmosphere(
          environment.atmosphereRegime,
          environment.atmosphereAssessment ?? null,
        ),
        `Soporte de columna heredado ${formatIndex(environment.atmosphereRetentionIndex01)} · indicador de escape y reposición, no es presión ni clasificación atmosférica confirmada`,
      ),
      ...lunarAtmosphereFields(environment.atmosphereAssessment ?? null),
      ...lunarInternalWaterFields(
        environment.internalWaterAssessment ?? null,
        target.detail.general.radiusEarth,
      ),
      field(
        'Agua',
        labelWater(
          environment.waterRegime,
          environment.waterInventoryIndex01,
          environment.estimatedSurfaceTemperatureKelvin,
          environment.internalWaterAssessment ?? null,
        ),
        `Inventario ${formatIndex(environment.waterInventoryIndex01)}`,
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
        lunarSubsurfacePotentialNoteV1(
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

  return section(
    'habitability',
    'SECCIÓN 05',
    'Habitabilidad',
    'Evaluación comparativa de condiciones potenciales de superficie y subsuelo.',
    [
      field(
        'Clasificación',
        unsupportedLegacySubsurface
          ? habitability.surfaceCandidate ? 'Candidata superficial (subsuelo no corroborado)' : 'Sin candidatura potencial'
          : `${labelHabitability(habitability.habitabilityRegime)}${thermal && habitability.subsurfaceCandidate ? ' (escenario térmico condicionado)' : ''}`,
        unsupportedLegacySubsurface
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
        target.detail.environment.internalWaterAssessment && habitability.subsurfaceCandidate
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
        unsupportedLegacySubsurface
          ? 'No candidata (índice heredado no corroborado)'
          : habitability.subsurfaceCandidate
            ? thermal
              ? 'Candidata condicional (océano no confirmado)'
              : 'Candidata'
            : 'No candidata',
        `Índice ${formatIndex(habitability.subsurfaceHabitabilityIndex01)}${target.detail.environment.internalWaterAssessment ? ` · ${lunarThermalCaveat(target.detail.environment.internalWaterAssessment)}` : ''}`,
      ),
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
        target.detail.environment.internalWaterAssessment
          ? 'Índice energético V1 heredado, no equivalente al flujo físico en W/m² del balance C.'
          : null,
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
    'SECCIÓN 06',
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

  if (
    target.detail.environment.hasSubsurfaceOcean
  ) {
    const thermal = target.detail.environment.internalWaterAssessment;
    result.push(
      !thermal
        ? 'Océano subsuperficial'
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

  if (
    target.detail.habitability.isPotentiallyHabitable
  ) {
    const thermal = target.detail.environment.internalWaterAssessment;
    result.push(
      target.detail.habitability.subsurfaceCandidate && thermal &&
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
    assessment.pressureBasis === 'CONDITIONAL_SCENARIO' &&
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
  if (!resolvedLunarGasColumn(assessment)) return 'Columna atmosférica no resuelta';
  const pressure = assessment.estimatedSurfacePressurePascal;
  if (pressure < 100) return 'Trazas atmosféricas (escenario)';
  if (pressure < 10_000) return 'Atmósfera tenue (escenario)';
  return 'Atmósfera sustancial (escenario)';
}

/** B atmospheric scenario is informational only; V1 habitability stays unchanged. */
export function lunarAtmosphereFields(
  assessment: MoonAtmosphereAssessment | null,
): readonly MoonScientificFieldModel[] {
  if (assessment === null) return [];
  const resolved = resolvedLunarGasColumn(assessment);
  const pressure = resolved ? assessment.estimatedSurfacePressurePascal : null;
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
  return [
    field('Inventario volátil atmosférico (inferido)', formatIndex(assessment.volatileInventoryIndex01),
      'Disponibilidad relativa inferida de la composición global, no un inventario gaseoso medido'),
    field('Presión superficial atmosférica (escenario)', pressure === null
      ? 'No determinada'
      : `${formatAdaptive(pressure)} Pa · ${formatAdaptive(pressure / 100_000)} bar`,
      'Estimación condicional de primer orden; faltan fotólisis, EUV, erosión por partículas y evolución atmosférica'),
    field('Composición gaseosa candidata', atmosphereComposition,
      'Fracciones molares estimadas tras escape térmico y condensación; no equivalen a detecciones espectroscópicas'),
    field('Retención frente a escape térmico', formatIndex(assessment.thermalEscapeSupportIndex01)),
    field('Condensación de gases candidatos', condensation,
      resolved
        ? 'Fracción aproximada removida de la columna candidata por equilibrio de saturación'
        : 'Sin columna gaseosa hidrostática resuelta no puede interpretarse un índice de remoción como condensación de una atmósfera estable'),
    field('Reposición por volátiles y mareas', formatIndex(assessment.replenishmentSupportIndex01)),
    field('Entorno radiativo y magnetosférico', 'Partículas y blindaje: no evaluables',
      `Insolación de referencia: ${formatScientificInsolationEarth(assessment.irradiationReferenceEarth)}. No hay flujo EUV/partículas ni geometría magnetosférica resueltos; orbitar un gigante no implica protección`),
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
