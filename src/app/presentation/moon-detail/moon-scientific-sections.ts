import {
  type MoonScientificResolvedTarget,
} from '../../simulation/planetary/moon-scientific-target-resolver';

export type MoonScientificSectionId =
  | 'general'
  | 'orbit'
  | 'tides'
  | 'environment'
  | 'habitability';

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
        ]),
      badges:
        Object.freeze(
          badges(
            target,
          ),
        ),
    });
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
        `${DECIMAL_3.format(environment.referenceMeanInsolationEarth)} S⊕`,
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
        labelAtmosphere(
          environment.atmosphereRegime,
        ),
        `Retención ${formatIndex(environment.atmosphereRetentionIndex01)}`,
      ),
      field(
        'Agua',
        labelWater(
          environment.waterRegime,
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
        environment.hasSubsurfaceOcean
          ? 'Candidato a océano subsuperficial'
          : null,
      ),
      field(
        'Potencial de agua líquida superficial',
        formatIndex(
          environment.surfaceLiquidWaterPotentialIndex01,
        ),
        environment.hasSurfaceLiquidWater
          ? 'Agua líquida superficial potencial'
          : null,
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

  return section(
    'habitability',
    'SECCIÓN 05',
    'Habitabilidad',
    'Evaluación comparativa de condiciones potenciales de superficie y subsuelo.',
    [
      field(
        'Clasificación',
        labelHabitability(
          habitability.habitabilityRegime,
        ),
        'Una candidatura de habitabilidad no implica presencia de vida ni biosignaturas.',
      ),
      field(
        'Índice global',
        formatIndex(
          habitability.overallHabitabilityIndex01,
        ),
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
        habitability.subsurfaceCandidate
          ? 'Candidata'
          : 'No candidata',
        `Índice ${formatIndex(habitability.subsurfaceHabitabilityIndex01)}`,
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
    result.push(
      'Océano subsuperficial',
    );
  }

  if (
    target.detail.environment.hasSurfaceLiquidWater
  ) {
    result.push(
      'Agua líquida superficial',
    );
  }

  if (
    target.detail.habitability.isPotentiallyHabitable
  ) {
    result.push(
      'Candidata potencialmente habitable',
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
): string {

  switch (regime) {
    case 'NONE':
      return 'Sin inventario de agua relevante';
    case 'SURFACE_ICE':
      return 'Hielo superficial';
    case 'SUBSURFACE_OCEAN':
      return 'Océano subsuperficial';
    case 'ICE_AND_SUBSURFACE_OCEAN':
      return 'Hielo y océano subsuperficial';
    case 'SURFACE_LIQUID':
      return 'Agua líquida superficial';
    case 'MIXED':
      return 'Estado mixto';
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
