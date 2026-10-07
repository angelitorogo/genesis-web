import {
  type PlanetScientificDetailSource,
  type PlanetScientificResolvedTarget,
  type PlanetScientificHostEvolutionContext,
} from '../../simulation/planetary/planet-scientific-target-resolver';

import {
  WorldEarthComparisonAssembler,
  type WorldEarthComparisonModel,
} from '../scientific/world-earth-comparison';

export type PlanetScientificSectionId =
  | 'general'
  | 'orbit'
  | 'surface'
  | 'atmosphere'
  | 'climate'
  | 'geology'
  | 'moons'
  | 'comparison';

export interface PlanetScientificFieldModel {
  readonly label:
    string;

  readonly value:
    string;

  readonly note:
    string | null;
}

export interface PlanetScientificSectionModel {
  readonly id:
    PlanetScientificSectionId;

  readonly eyebrow:
    string;

  readonly title:
    string;

  readonly summary:
    string;

  readonly fields:
    readonly PlanetScientificFieldModel[];
}

export interface PlanetScientificMoonCardModel {
  readonly designation:
    string;

  readonly moonIndex:
    number;

  readonly ordinalLabel:
    string;

  readonly fields:
    readonly PlanetScientificFieldModel[];

  readonly badges:
    readonly string[];
}

export interface PlanetScientificSectionsModel {
  readonly sections:
    readonly PlanetScientificSectionModel[];

  readonly comparison:
    WorldEarthComparisonModel;

  readonly relevantMoons:
    readonly PlanetScientificMoonCardModel[];

  readonly relevantMoonsEmptyMessage:
    string;
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
 * Point-26.4 presentation-only projection for a detailed planet fiche.
 *
 * This assembler never regenerates or reinterprets physical state. It receives
 * the safe primitive snapshot produced by PlanetScientificTargetResolver and
 * only formats it for the user-facing scientific sections and point-26.9 comparison.
 */
export class PlanetScientificSectionsAssembler {

  private constructor() {}

  static build(
    target:
      PlanetScientificResolvedTarget,
  ): PlanetScientificSectionsModel {

    const detail =
      target.detail;

    const hostEvolution =
      target.hostEvolution ?? null;

    const comparison =
      WorldEarthComparisonAssembler
        .build({
          worldLabel:
            target.identity.designation,
          massEarth:
            detail.general.massEarth,
          radiusEarth:
            detail.general.radiusEarth,
          densityGramsPerCubicCentimeter:
            detail.general.densityGramsPerCubicCentimeter,
          surfaceGravityEarth:
            detail.general.surfaceGravityEarth,
        });

    return Object.freeze({
      sections:
        Object.freeze([
          generalSection(
            detail,
          ),
          orbitSection(
            detail,
            hostEvolution,
          ),
          surfaceSection(
            detail,
            hostEvolution,
          ),
          atmosphereSection(
            detail,
            hostEvolution,
          ),
          climateSection(
            detail,
            hostEvolution,
          ),
          geologySection(
            detail,
            hostEvolution,
          ),
          moonsSection(
            detail,
            hostEvolution,
          ),
          comparisonSection(
            comparison,
          ),
        ]),
      comparison,
      relevantMoons:
        Object.freeze(
          detail
            .moons
            .relevantMoons
            .map(
              moon =>
                Object.freeze({
                  designation:
                    moon.designation,
                  moonIndex:
                    moon.moonIndex,
                  ordinalLabel:
                    `Luna ${moon.moonOrdinal}`,
                  fields:
                    Object.freeze([
                      field('Masa', `${formatAdaptive(moon.massEarth)} M⊕`),
                      field('Radio', `${formatAdaptive(moon.radiusEarth)} R⊕`),
                      field('Densidad media', `${DECIMAL_2.format(moon.meanDensityGramsPerCubicCentimeter)} g/cm³`),
                      field('Gravedad superficial', `${DECIMAL_2.format(moon.surfaceGravityEarth)} g⊕`),
                      field('Órbita', `${DECIMAL_2.format(moon.semiMajorAxisPlanetRadii)} Rplanet · ${DECIMAL_2.format(moon.orbitalPeriodDays)} días`),
                      field('Rotación', `${DECIMAL_2.format(moon.rotationPeriodHours)} h`,
                        moon.isTidallyLocked ? 'Acoplamiento de marea' : 'Rotación no sincronizada'),
                      ...(hostEvolution?.requiresPostStellarEvolutionReassessment &&
                          hostEvolution.conditionalEnvironmentReassessmentApplied !== true
                        ? [
                            field('Entorno post-remanente', 'No resuelto',
                              '29.1E-e no reutiliza la temperatura, atmósfera, agua ni habitabilidad calculadas con la antigua estrella progenitora.'),
                            field('Geología intrínseca', labelMoonGeology(moon.geologyRegime)),
                          ]
                        : [
                            ...conditionalStatusFields(hostEvolution),
                            field('Temperatura estimada', formatTemperature(moon.estimatedSurfaceTemperatureKelvin)),
                            field('Entorno', `${labelMoonAtmosphere(moon.atmosphereRegime)} · ${labelMoonWater(moon.waterRegime)}`),
                            field('Geología', labelMoonGeology(moon.geologyRegime)),
                            field('Habitabilidad potencial', labelMoonHabitability(moon.habitabilityRegime),
                              `Índice ${formatNormalizedIndex(moon.overallHabitabilityIndex01)}`),
                          ]),
                    ]),
                  badges:
                    Object.freeze([
                      ...(moon.hasSubsurfaceOcean
                        ? [
                            'Océano subsuperficial',
                          ]
                        : []),
                      ...(moon.hasSurfaceLiquidWater
                        ? [
                            'Agua líquida superficial',
                          ]
                        : []),
                    ]),
                }),
            ),
        ),
      relevantMoonsEmptyMessage:
        detail.moons.moonCount ===
          0
          ? 'No se han identificado satélites naturales asociados a este planeta.'
          : 'No hay lunas con caracterización individual disponible. La población total de satélites naturales se resume arriba.',
    });
  }
}

function generalSection(
  detail:
    PlanetScientificDetailSource,
): PlanetScientificSectionModel {

  const general =
    detail.general;

  return section(
    'general',
    'SECCIÓN 01',
    'General',
    'Propiedades físicas globales, rotación y composición interna de referencia.',
    [
      field(
        'Tipo planetario',
        labelPlanetType(
          general.planetType,
        ),
      ),
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
        `${DECIMAL_2.format(general.densityGramsPerCubicCentimeter)} g/cm³`,
      ),
      field(
        'Gravedad superficial',
        `${DECIMAL_2.format(general.surfaceGravityEarth)} g⊕ · ${DECIMAL_2.format(general.surfaceGravityMetersPerSecondSquared)} m/s²`,
      ),
      field(
        'Periodo de rotación',
        `${DECIMAL_2.format(general.rotationPeriodHours)} h`,
        general.isRetrogradeRotation
          ? 'Rotación retrógrada'
          : 'Rotación prógrada',
      ),
      field(
        'Duración del día',
        formatNullableHours(
          general.dayLengthHours,
        ),
        general.isTidallySynchronized
          ? 'Rotación sincronizada por marea'
          : null,
      ),
      field(
        'Inclinación axial',
        `${DECIMAL_2.format(general.axialTiltDegrees)}°`,
      ),
      field(
        'Albedo de Bond',
        formatIndex(
          general.referenceBondAlbedo01,
        ),
      ),
      field(
        'Composición interna',
        compositionSummary(
          general,
        ),
      ),
      field(
        'Coherencia física',
        general.isTypePhysicallyCoherent
          ? 'Coherente'
          : 'No coherente',
        'Comprobación de coherencia entre el tipo planetario y sus propiedades físicas.',
      ),
    ],
  );
}

function orbitSection(
  detail:
    PlanetScientificDetailSource,

  hostEvolution:
    PlanetScientificHostEvolutionContext | null,
): PlanetScientificSectionModel {

  const orbit =
    detail.orbit;

  if (hostEvolution?.requiresPostStellarEvolutionReassessment) {
    const disposition = hostEvolution.postSupernovaOrbitDisposition ?? 'UNCHANGED';
    const currentOrbitResolved = disposition === 'BOUND_RECONFIGURED';
    const noCurrentHostOrbit = disposition === 'EJECTED' || disposition === 'HOST_DISRUPTED';
    const period = hostEvolution.currentOrbitalPeriodDays === null ||
      hostEvolution.currentOrbitalPeriodYears === null
      ? noCurrentHostOrbit ? 'No existe órbita anfitriona ligada' : 'No resuelto con la masa actual disponible'
      : `${DECIMAL_2.format(hostEvolution.currentOrbitalPeriodDays)} días · ${DECIMAL_3.format(hostEvolution.currentOrbitalPeriodYears)} años`;
    const insolation = hostEvolution.currentMeanInsolationEarth === null
      ? noCurrentHostOrbit ? 'No resoluble tras disrupción del host' : 'No modelada para el host compacto actual'
      : formatScientificInsolationEarth(hostEvolution.currentMeanInsolationEarth);
    const radiative = disposition === 'EJECTED'
      ? 'Sin zona habitable ligada al antiguo host'
      : disposition === 'HOST_DISRUPTED'
        ? 'No resoluble con la arquitectura anfitriona disuelta'
        : hostEvolution.radiativeRegime === 'QUIESCENT_BLACK_HOLE'
          ? 'Sin zona habitable radiativa del agujero negro quiescente'
          : hostEvolution.currentHostLuminositySolar === null
            ? 'No resuelta: luminosidad actual del remanente no modelada'
            : 'Reevaluada con el host actual';
    const geometryLabel = currentOrbitResolved ? 'actual post-supernova' : 'de formación';
    return section(
      'orbit', 'SECCIÓN 02', 'Órbita',
      postSupernovaOrbitSummary(disposition),
      [
        ...conditionalStatusFields(hostEvolution),
        field('Estado dinámico post-supernova', postSupernovaDispositionLabel(disposition),
          disposition === 'UNCHANGED'
            ? 'No existe una supernova histórica resuelta que reconfigure esta órbita.'
            : `Resolución determinista 29.1E-g · régimen ${postSupernovaMassLossLabel(hostEvolution.postSupernovaMassLossRegime)}.`),
        field(`Semieje mayor ${geometryLabel}`, `${DECIMAL_3.format(orbit.semiMajorAxisAu)} UA`),
        field(`Excentricidad ${geometryLabel}`, DECIMAL_3.format(orbit.eccentricity)),
        field('Inclinación de formación', `${DECIMAL_2.format(orbit.inclinationDegrees)}°`,
          currentOrbitResolved && hostEvolution.postSupernovaInclinationChangeDegrees !== null &&
              hostEvolution.postSupernovaInclinationChangeDegrees !== undefined
            ? `El kick introduce un cambio de plano de ${DECIMAL_2.format(hostEvolution.postSupernovaInclinationChangeDegrees)}° respecto al plano pre-evento.`
            : null),
        field(`Periastro ${geometryLabel}`, `${DECIMAL_3.format(orbit.periastronAu)} UA`),
        field(`Apoastro ${geometryLabel}`, `${DECIMAL_3.format(orbit.apoastronAu)} UA`),
        field('Periodo orbital actual', period,
          hostEvolution.currentHostMassSolar === null
            ? noCurrentHostOrbit
              ? 'No se asigna un periodo Kepleriano a un planeta expulsado o con host disuelto.'
              : 'No se reutiliza la masa del progenitor como masa actual.'
            : `Calculado con ${formatAdaptive(hostEvolution.currentHostMassSolar)} M☉ de masa anfitriona actual.`),
        ...(disposition === 'UNCHANGED' ? [] : [
          field('Kick natal efectivo máximo',
            `${DECIMAL_2.format(hostEvolution.postSupernovaMaximumEffectiveKickKmS ?? 0)} km/s`,
            'Impulso efectivo aplicado a esta arquitectura; no es una velocidad inventada del planeta.'),
        ]),
        field('Zona habitable radiativa actual', radiative),
        field('Insolación media actual del host', insolation,
          disposition === 'EJECTED'
            ? 'Tras la expulsión se anula la irradiación ligada al antiguo anfitrión; el balance intrínseco puede seguir reevaluándose.'
            : hostEvolution.radiativeRegime === 'QUIESCENT_BLACK_HOLE'
              ? 'Sin disco de acreción modelado: el agujero negro no aporta irradiación estelar.'
              : 'No se reutiliza la luminosidad del progenitor como luminosidad actual.'),
      ],
    );
  }

  return section(
    'orbit',
    'SECCIÓN 02',
    'Órbita',
    'Geometría orbital, periodo y relación con la zona habitable del sistema.',
    [
      field(
        'Semieje mayor',
        `${DECIMAL_3.format(orbit.semiMajorAxisAu)} UA`,
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
        'Periastro',
        `${DECIMAL_3.format(orbit.periastronAu)} UA`,
      ),
      field(
        'Apoastro',
        `${DECIMAL_3.format(orbit.apoastronAu)} UA`,
      ),
      field(
        'Periodo orbital',
        `${DECIMAL_2.format(orbit.periodDays)} días · ${DECIMAL_3.format(orbit.periodYears)} años`,
      ),
      field(
        'Zona habitable radiativa',
        labelHabitableZoneRelation(
          orbit.radiativeHabitableZoneRelation,
        ),
      ),
      field(
        'Zona habitable dinámica',
        orbit.dynamicallyAvailableHabitableZoneRelation ===
          null
          ? 'No disponible'
          : labelHabitableZoneRelation(
              orbit.dynamicallyAvailableHabitableZoneRelation,
            ),
      ),
      field(
        'Insolación media de referencia',
        formatScientificInsolationEarth(
          orbit.referenceMeanInsolationEarth,
        ),
      ),
      field(
        'Forzamiento de marea orbital',
        formatNullableNormalizedIndex(
          detail.geology.tidalHeatingIndex01,
        ),
        `Índice normalizado 0–1 derivado del proxy orbital bruto ${formatAdaptive(orbit.tidalHeatingProxy)}.`,
      ),
    ],
  );
}

function postSupernovaDispositionLabel(
  disposition: NonNullable<PlanetScientificHostEvolutionContext['postSupernovaOrbitDisposition']>,
): string {
  switch (disposition) {
    case 'BOUND_RECONFIGURED': return 'Ligado · órbita reconfigurada';
    case 'EJECTED': return 'Expulsado del antiguo host';
    case 'HOST_DISRUPTED': return 'Arquitectura anfitriona disuelta';
    case 'UNCHANGED': return 'Sin reconfiguración supernova';
  }
}

function postSupernovaOrbitSummary(
  disposition: NonNullable<PlanetScientificHostEvolutionContext['postSupernovaOrbitDisposition']>,
): string {
  switch (disposition) {
    case 'BOUND_RECONFIGURED':
      return 'Órbita actual derivada de la pérdida de masa y del kick del evento canónico, sin modificar el cuerpo congelado de formación.';
    case 'EJECTED':
      return 'El planeta ya no permanece ligado al antiguo anfitrión. Se conserva debajo la geometría de formación como referencia histórica.';
    case 'HOST_DISRUPTED':
      return 'La arquitectura anfitriona que sustentaba esta órbita quedó disuelta; no se inventa una captura posterior sin resolver.';
    case 'UNCHANGED':
      return 'Geometría orbital actualizada con el host compacto cuando existe masa actual autoritativa.';
  }
}

function postSupernovaMassLossLabel(
  regime: PlanetScientificHostEvolutionContext['postSupernovaMassLossRegime'],
): string {
  switch (regime) {
    case 'IMPULSIVE': return 'impulsivo';
    case 'TRANSITIONAL': return 'transicional';
    case 'ADIABATIC': return 'adiabático';
    default: return 'sin pérdida explosiva resuelta';
  }
}

function surfaceSection(
  detail:
    PlanetScientificDetailSource,

  hostEvolution:
    PlanetScientificHostEvolutionContext | null,
): PlanetScientificSectionModel {

  const surface =
    detail.surface;

  if (hostEvolution?.requiresPostStellarEvolutionReassessment &&
      hostEvolution.conditionalEnvironmentReassessmentApplied !== true) {
    return section(
      'surface', 'SECCIÓN 03', 'Superficie',
      'Propiedades intrínsecas conservadas; el estado térmico, el agua superficial y la exposición radiativa deben reevaluarse tras la evolución del host.',
      [
        field('Base superficial', labelSurfaceRegime(surface.surfaceBaseRegime),
          surface.hasDefinedSolidSurfaceBase ? 'Superficie sólida definida' : 'Sin superficie sólida definida'),
        field('Índice de rugosidad', formatNullableNormalizedIndex(surface.baseSolidSurfaceRoughness01)),
        field('Estado térmico superficial actual', 'No resuelto tras evolución del host compacto'),
        field('Agua superficial actual', 'No reevaluada',
          'No se reutilizan las fases hielo/líquido/vapor calculadas con la irradiación del progenitor.'),
        field('Radiación superficial actual', 'No reevaluada',
          'Requiere un modelo actual de emisión del remanente y del entorno múltiple.'),
      ],
    );
  }

  return section(
    'surface',
    'SECCIÓN 03',
    'Superficie',
    conditionalSectionSummary(hostEvolution, 'Régimen superficial, inventario de agua y exposición radiativa del entorno accesible.'),
    [
      ...conditionalStatusFields(hostEvolution),
      field(
        'Base superficial',
        labelSurfaceRegime(
          surface.surfaceBaseRegime,
        ),
        surface.hasDefinedSolidSurfaceBase
          ? 'Superficie sólida definida'
          : 'Sin superficie sólida definida',
      ),
      field(
        'Índice de rugosidad',
        formatNullableNormalizedIndex(
          surface.baseSolidSurfaceRoughness01,
        ),
      ),
      field(
        'Índice de inventario de agua',
        formatNormalizedIndex(
          surface.waterInventoryIndex01,
        ),
      ),
      field(
        'Fases dominantes del agua',
        labelWaterPhase(
          surface.waterPhaseRegime,
        ),
      ),
      field(
        'Agua líquida superficial',
        surface.hasPersistentSurfaceLiquidWater
          ? labelSurfaceWater(
              surface.surfaceWaterRegime,
            )
          : 'No persistente',
        surface.hasPersistentSurfaceLiquidWater
          ? 'Presencia estable de agua líquida en la superficie'
          : 'No se mantiene agua líquida superficial de forma persistente',
      ),
      field(
        'Distribución hielo / líquido / vapor',
        fractionTriplet(
          surface.waterIceFraction01,
          surface.waterLiquidFraction01,
          surface.waterVaporFraction01,
        ),
      ),
      field(
        'Cobertura de hielo',
        formatNullablePercent(
          surface.surfaceIceCoverageFraction01,
        ),
      ),
      field(
        'Cobertura de agua líquida',
        formatNullablePercent(
          surface.surfaceLiquidWaterCoverageFraction01,
        ),
      ),
      field(
        'Radiación superficial',
        labelRadiation(
          surface.surfaceRadiationRegime,
        ),
      ),
      field(
        'Protección radiativa',
        labelRadiationProtection(
          surface.surfaceRadiationProtectionRegime,
        ),
        surface.hasEffectiveSurfaceRadiationProtection
          ? 'Protección superficial efectiva'
          : 'Protección superficial limitada',
      ),
      field(
        'Índices de exposición / protección',
        `${formatNullableNormalizedIndex(surface.surfaceRadiationExposureIndex01)} / ${formatNullableNormalizedIndex(surface.surfaceRadiationProtectionIndex01)}`,
      ),
    ],
  );
}

function atmosphereSection(
  detail:
    PlanetScientificDetailSource,

  hostEvolution:
    PlanetScientificHostEvolutionContext | null,
): PlanetScientificSectionModel {

  const atmosphere =
    detail.atmosphere;

  if (hostEvolution?.requiresPostStellarEvolutionReassessment &&
      hostEvolution.conditionalEnvironmentReassessmentApplied !== true) {
    return section(
      'atmosphere', 'SECCIÓN 04', 'Atmósfera',
      'La atmósfera actual no se deriva de la antigua irradiación del progenitor.',
      [
        field('Estado atmosférico post-remanente', 'No resuelto'),
        field('Retención y composición actuales', 'Pendientes de reevaluación',
          'Escape, condensación y química deben recalcularse con el entorno radiativo actual y con la historia post-SN.'),
        field('Modelo heredado del progenitor', 'No mostrado como estado actual',
          '29.1E-e evita presentar presión, composición o efecto invernadero calculados con una estrella que ya no existe.'),
      ],
    );
  }

  return section(
    'atmosphere',
    'SECCIÓN 04',
    'Atmósfera',
    conditionalSectionSummary(hostEvolution, 'Presión gaseosa, composición, retención de volátiles y efecto invernadero.'),
    [
      ...conditionalStatusFields(hostEvolution),
      field(
        'Régimen potencial inicial',
        labelPressureRegime(
          atmosphere.pressureRegime,
        ),
        'Clasificación de la atmósfera potencial antes de escape y condensación.',
      ),
      field(
        'Régimen gaseoso actual',
        labelPressureRegime(
          atmosphere.retainedPressureRegime,
        ),
        'Clasificación de la presión gaseosa final tras retención y equilibrio de condensación.',
      ),
      field(
        'Presión superficial gaseosa',
        formatPressure(
          atmosphere.retainedSurfacePressurePascal,
        ),
        'Estado final tras escape atmosférico y equilibrio de condensación multiespecie.',
      ),
      field(
        'Retención de volátiles',
        labelRetention(
          atmosphere.retentionRegime,
        ),
        retainedVolatileInventoryNote(
          atmosphere.atmosphericInventoryRetentionFraction01,
        ),
      ),
      field(
        conditionalEnvironmentApplied(hostEvolution) &&
          atmosphere.currentDensityKilogramsPerCubicMeter !== undefined &&
          atmosphere.currentDensityKilogramsPerCubicMeter !== null
          ? 'Densidad gaseosa actual'
          : 'Densidad de referencia',
        `${DECIMAL_3.format(
          conditionalEnvironmentApplied(hostEvolution) &&
            atmosphere.currentDensityKilogramsPerCubicMeter !== undefined &&
            atmosphere.currentDensityKilogramsPerCubicMeter !== null
            ? atmosphere.currentDensityKilogramsPerCubicMeter
            : atmosphere.retainedReferenceDensityKilogramsPerCubicMeter,
        )} kg/m³`,
        conditionalEnvironmentApplied(hostEvolution) &&
          atmosphere.currentDensityKilogramsPerCubicMeter !== undefined &&
          atmosphere.currentDensityKilogramsPerCubicMeter !== null
          ? 'Calculada con la presión gaseosa, composición y temperatura finales de la reevaluación criogénica.'
          : null,
      ),
      field(
        'Masa molar media',
        atmosphere.retainedMeanMolarMassGramsPerMole ===
          null
          ? 'No definida'
          : `${DECIMAL_2.format(atmosphere.retainedMeanMolarMassGramsPerMole)} g/mol`,
      ),
      field(
        'Composición dominante',
        gasCompositionSummary(
          atmosphere.retainedGasComposition,
        ),
      ),
      field(
        'Efecto invernadero',
        labelGreenhouse(
          atmosphere.greenhouseRegime,
        ),
        `Captura de onda larga ${formatPercent(atmosphere.longwaveTrappingFraction01)}`,
      ),
      field(
        'Estado atmosférico',
        atmosphere.isVacuum
          ? 'Vacío'
          : atmosphere.isDeepEnvelope
            ? 'Envolvente profunda'
            : 'Atmósfera retenida',
      ),
    ],
  );
}

function climateSection(
  detail:
    PlanetScientificDetailSource,

  hostEvolution:
    PlanetScientificHostEvolutionContext | null,
): PlanetScientificSectionModel {

  const climate =
    detail.climate;

  if (hostEvolution?.requiresPostStellarEvolutionReassessment &&
      hostEvolution.conditionalEnvironmentReassessmentApplied !== true) {
    const currentFlux = hostEvolution.currentMeanInsolationEarth === null
      ? 'No modelada'
      : formatScientificInsolationEarth(hostEvolution.currentMeanInsolationEarth);
    return section(
      'climate', 'SECCIÓN 05', 'Clima',
      'El clima actual requiere una nueva evolución térmica y atmosférica posterior a la formación del remanente.',
      [
        field('Irradiación actual del host', currentFlux,
          hostEvolution.radiativeRegime === 'QUIESCENT_BLACK_HOLE'
            ? 'Agujero negro quiescente sin acreción modelada.'
            : 'La luminosidad actual del remanente no está modelada.'),
        field('Temperatura de equilibrio actual', 'No resuelta'),
        field('Temperatura superficial actual', 'No resuelta'),
        field('Efecto invernadero actual', 'No reevaluado'),
        field('Estado climático', 'Pendiente de evolución post-remanente'),
      ],
    );
  }

  return section(
    'climate',
    'SECCIÓN 05',
    'Clima',
    conditionalSectionSummary(hostEvolution, 'Balance térmico global, efecto invernadero, variabilidad y redistribución de calor.'),
    [
      ...conditionalStatusFields(hostEvolution),
      ...(conditionalEnvironmentApplied(hostEvolution)
        ? [
            field(
              'Flujo geotérmico condicionado',
              `${formatAdaptive(hostEvolution?.conditionalGeothermalHeatFluxWattsPerSquareMeter ?? 0)} W/m²`,
              'Aporte radiogénico/secular aproximado derivado de la masa, radio y retención interna ya generados.',
            ),
            field(
              'Flujo térmico de marea condicionado',
              `${formatAdaptive(hostEvolution?.conditionalTidalHeatFluxWattsPerSquareMeter ?? 0)} W/m²`,
              'Aporte térmico ligado al índice de marea ya existente; no es irradiación estelar.',
            ),
          ]
        : []),
      field(
        conditionalEnvironmentApplied(hostEvolution)
          ? 'Temperatura efectiva de equilibrio'
          : 'Temperatura de equilibrio',
        formatTemperature(
          climate.equilibriumTemperatureKelvin,
        ),
      ),
      field(
        'Temperatura superficial media',
        formatNullableTemperature(
          climate.meanSurfaceTemperatureKelvin,
        ),
      ),
      field(
        'Calentamiento invernadero',
        climate.greenhouseSurfaceWarmingKelvin ===
          null
          ? 'No definido'
          : `+${DECIMAL_1.format(climate.greenhouseSurfaceWarmingKelvin)} K`,
      ),
      field(
        'Estabilidad climática',
        labelClimateStability(
          climate.climateStabilityRegime,
        ),
        `Índice ${formatNullableNormalizedIndex(climate.climateStabilityIndex01)}`,
      ),
      field(
        'Amplitud estacional',
        formatNullableKelvinDelta(
          climate.seasonalTemperatureAmplitudeKelvin,
        ),
      ),
      field(
        detail.general.isTidallySynchronized
          ? 'Contraste térmico día/noche'
          : 'Rango térmico diurno',
        formatNullableKelvinDelta(
          climate.diurnalTemperatureRangeKelvin,
        ),
      ),
      field(
        'Extremos superficiales',
        `${formatNullableTemperature(climate.minimumSurfaceTemperatureKelvin)} → ${formatNullableTemperature(climate.maximumSurfaceTemperatureKelvin)}`,
      ),
      field(
        'Índice de redistribución de calor',
        formatNormalizedIndex(
          climate.heatRedistributionEfficiency01,
        ),
      ),
    ],
  );
}

function geologySection(
  detail:
    PlanetScientificDetailSource,

  hostEvolution:
    PlanetScientificHostEvolutionContext | null,
): PlanetScientificSectionModel {

  const geology =
    detail.geology;

  if (hostEvolution?.requiresPostStellarEvolutionReassessment &&
      hostEvolution.conditionalEnvironmentReassessmentApplied !== true) {
    return section(
      'geology', 'SECCIÓN 06', 'Geología',
      'La actividad interna permanece como caracterización intrínseca; el entorno magnetosférico externo debe reevaluarse para el host compacto actual.',
      [
        field('Régimen geológico', labelGeology(geology.geologyRegime)),
        field('Vulcanismo', labelVolcanism(geology.volcanismRegime),
          `Índice ${formatNullableNormalizedIndex(geology.volcanismIndex01)}`),
        field('Tectónica', labelTectonics(geology.tectonicRegime),
          `Movilidad ${formatNullableNormalizedIndex(geology.tectonicMobilityIndex01)}`),
        field('Índice de retención de calor interno', formatNullableNormalizedIndex(geology.internalHeatRetentionIndex01)),
        field('Índice de actividad geológica', formatNullableNormalizedIndex(geology.geologicalActivityIndex01)),
        field('Campo magnético intrínseco', labelMagneticField(geology.magneticFieldRegime)),
        field('Magnetosfera actual', 'No resuelta para el host compacto actual',
          'No se reutiliza la compresión/protección calculada con el viento y la radiación del progenitor.'),
      ],
    );
  }

  return section(
    'geology',
    'SECCIÓN 06',
    'Geología',
    conditionalSectionSummary(hostEvolution, 'Actividad interna, vulcanismo, tectónica y protección magnetosférica.'),
    [
      ...conditionalStatusFields(hostEvolution),
      field(
        'Régimen geológico',
        labelGeology(
          geology.geologyRegime,
        ),
        geology.isGeologicallyActive
          ? (
              geology.geologicalActivityIndex01 !== null &&
              geology.geologicalActivityIndex01 < 0.35
                ? 'Actividad geológica moderada; no necesariamente dominante'
                : 'Mundo geológicamente activo'
            )
          : 'Actividad geológica no dominante',
      ),
      field(
        'Vulcanismo',
        labelVolcanism(
          geology.volcanismRegime,
        ),
        `Índice ${formatNullableNormalizedIndex(geology.volcanismIndex01)}`,
      ),
      field(
        'Tectónica',
        labelTectonics(
          geology.tectonicRegime,
        ),
        `Movilidad ${formatNullableNormalizedIndex(geology.tectonicMobilityIndex01)}`,
      ),
      field(
        'Índice de retención de calor interno',
        formatNullableNormalizedIndex(
          geology.internalHeatRetentionIndex01,
        ),
      ),
      field(
        'Contribución térmica de marea',
        formatNullableNormalizedIndex(
          geology.tidalHeatingIndex01,
        ),
      ),
      field(
        'Índice de actividad geológica',
        formatNullableNormalizedIndex(
          geology.geologicalActivityIndex01,
        ),
      ),
      field(
        'Índice de desgasificación volátil',
        formatNullableNormalizedIndex(
          geology.volatileOutgassingPotential01,
        ),
      ),
      field(
        'Índice de renovación superficial',
        formatNullableNormalizedIndex(
          geology.surfaceRenewalPotential01,
        ),
      ),
      field(
        'Campo magnético',
        labelMagneticField(
          geology.magneticFieldRegime,
        ),
        magneticFieldContextNote(
          geology.magneticFieldRegime,
          geology.hasSustainedDynamo,
          geology.magnetosphereRegime,
        ),
      ),
      field(
        'Magnetosfera',
        labelMagnetosphere(
          geology.magnetosphereRegime,
        ),
      ),
      field(
        'Índice de potencial de dínamo',
        formatNormalizedIndex(
          geology.dynamoPotentialIndex01,
        ),
      ),
      field(
        'Índices de campo / protección magnetosférica',
        `${formatNormalizedIndex(geology.intrinsicMagneticFieldIndex01)} / ${formatNormalizedIndex(geology.magnetosphericProtectionIndex01)}`,
      ),
    ],
  );
}

function moonsSection(
  detail:
    PlanetScientificDetailSource,

  hostEvolution:
    PlanetScientificHostEvolutionContext | null,
): PlanetScientificSectionModel {

  const moons =
    detail.moons;

  if (hostEvolution?.requiresPostStellarEvolutionReassessment &&
      hostEvolution.conditionalEnvironmentReassessmentApplied !== true) {
    return section(
      'moons', 'SECCIÓN 07', 'Lunas',
      'Población orbital conservada; su entorno térmico y su habitabilidad deben reevaluarse tras la evolución del host.',
      [
        field('Satélites naturales', String(moons.moonCount)),
        field('Lunas con caracterización individual', String(moons.relevantMoonCount)),
        field('Lunas menores', String(moons.unmaterializedMinorMoonCount)),
        field('Habitabilidad post-remanente', 'No reevaluada'),
      ],
    );
  }

  return section(
    'moons',
    'SECCIÓN 07',
    'Lunas',
    conditionalSectionSummary(hostEvolution, 'Población de satélites naturales asociados al planeta y caracterización de los cuerpos más relevantes.'),
    [
      ...conditionalStatusFields(hostEvolution),
      field(
        'Satélites naturales',
        String(
          moons.moonCount,
        ),
      ),
      field(
        'Lunas con caracterización individual',
        String(
          moons.relevantMoonCount,
        ),
      ),
      field(
        'Lunas menores',
        String(
          moons.unmaterializedMinorMoonCount,
        ),
      ),
      field(
        'Candidatas potencialmente habitables',
        String(
          moons.potentiallyHabitableMoonCount,
        ),
      ),
      field(
        'Candidatas de superficie',
        String(
          moons.surfaceHabitabilityCandidateCount,
        ),
      ),
      field(
        'Candidatas subsuperficiales',
        String(
          moons.subsurfaceHabitabilityCandidateCount,
        ),
      ),
    ],
  );
}


function conditionalEnvironmentApplied(
  hostEvolution: PlanetScientificHostEvolutionContext | null,
): boolean {
  return hostEvolution?.requiresPostStellarEvolutionReassessment === true &&
    hostEvolution.conditionalEnvironmentReassessmentApplied === true;
}

function conditionalStatusFields(
  hostEvolution: PlanetScientificHostEvolutionContext | null,
): readonly PlanetScientificFieldModel[] {
  if (!conditionalEnvironmentApplied(hostEvolution)) return Object.freeze([]);
  const intrinsicHeatFlux =
    hostEvolution?.conditionalTotalIntrinsicHeatFluxWattsPerSquareMeter ?? 0;
  const floorNote = hostEvolution?.conditionalEnvironmentUsesMinimumRadiativeFloor === true
    ? 'El host y el calor intrínseco resuelto son prácticamente nulos; el solver conserva únicamente el suelo numérico de fondo 29.1E-e.2. No representa acreción ni luminosidad del agujero negro.'
    : intrinsicHeatFlux > 0
      ? `Recalculado con la irradiación actual del host y ${formatAdaptive(intrinsicHeatFlux)} W/m² de calor intrínseco planetario. Ese calor no se contabiliza como luminosidad estelar ni acreción.`
      : 'Recalculado con la irradiación actual modelada del host, sin reutilizar la luminosidad del progenitor.';
  return Object.freeze([
    field(
      'Estado científico',
      'Estado actual condicionado a supervivencia orbital',
      floorNote,
    ),
  ]);
}

function conditionalSectionSummary(
  hostEvolution: PlanetScientificHostEvolutionContext | null,
  ordinarySummary: string,
): string {
  return conditionalEnvironmentApplied(hostEvolution)
    ? `${ordinarySummary} Reevaluación 29.1E-e.2 con cierre térmico/criogénico, condicionada a que el planeta conserve provisionalmente su órbita tras la evolución del host.`
    : ordinarySummary;
}


function comparisonSection(
  comparison:
    WorldEarthComparisonModel,
): PlanetScientificSectionModel {

  return section(
    'comparison',
    'SECCIÓN 08',
    'Comparación con la Tierra',
    'Comparación adimensional con la Tierra y escala lineal de tamaño basada en el radio físico ya determinado.',
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

function section(
  id:
    PlanetScientificSectionId,
  eyebrow:
    string,
  title:
    string,
  summary:
    string,
  fields:
    readonly PlanetScientificFieldModel[],
): PlanetScientificSectionModel {

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
): PlanetScientificFieldModel {

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

export function retainedVolatileInventoryNote(
  fraction01:
    number,
): string {
  return `Inventario volátil conservado tras escape ${formatPercent(fraction01)} · puede incluir especies que después condensan y no permanecen en fase gaseosa`;
}

export function magneticFieldContextNote(
  fieldRegime:
    string,

  hasSustainedDynamo:
    boolean,

  magnetosphereRegime:
    string,
): string {
  if (hasSustainedDynamo) {
    return 'Dínamo sostenida';
  }

  if (fieldRegime !== 'NONE') {
    return magnetosphereRegime === 'INDUCED'
      ? 'Campo no sostenido; interacción inducida, no una magnetosfera de dínamo global'
      : 'Campo intrínseco/residual no sostenido; no implica magnetosfera global';
  }

  return 'Sin dínamo sostenida';
}

function formatAdaptive(
  value:
    number,
): string {

  const absolute =
    Math.abs(
      value,
    );

  if (
    absolute !==
      0 &&
    absolute <
      0.001
  ) {
    return SCIENTIFIC_3.format(
      value,
    );
  }

  return DECIMAL_3.format(
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

  return DECIMAL_3.format(
    value,
  );
}

function formatNormalizedIndex(
  value:
    number,
): string {

  return `${formatIndex(value)} / 1`;
}

function formatNullableNormalizedIndex(
  value:
    number | null,
): string {

  return value ===
    null
    ? 'No definido'
    : formatNormalizedIndex(
        value,
      );
}

function formatPercent(
  value:
    number,
): string {

  return `${DECIMAL_1.format(value * 100)} %`;
}

function formatNullablePercent(
  value:
    number | null,
): string {

  return value ===
    null
    ? 'No definida'
    : formatPercent(
        value,
      );
}

function formatTemperature(
  kelvin:
    number,
): string {

  return `${DECIMAL_1.format(kelvin)} K · ${DECIMAL_1.format(kelvin - 273.15)} °C`;
}

function formatNullableTemperature(
  kelvin:
    number | null,
): string {

  return kelvin ===
    null
    ? 'No definida'
    : formatTemperature(
        kelvin,
      );
}

function formatNullableKelvinDelta(
  kelvin:
    number | null,
): string {

  return kelvin ===
    null
    ? 'No definida'
    : `${DECIMAL_1.format(kelvin)} K`;
}

function formatNullableHours(
  hours:
    number | null,
): string {

  return hours ===
    null
    ? 'No definida'
    : `${DECIMAL_2.format(hours)} h`;
}

function formatPressure(
  pascal:
    number | null,
): string {

  if (
    pascal ===
      null
  ) {
    return 'No definida';
  }

  const bar =
    pascal /
    100_000;

  return `${DECIMAL_1.format(pascal)} Pa · ${DECIMAL_3.format(bar)} bar`;
}

function fractionTriplet(
  ice:
    number | null,
  liquid:
    number | null,
  vapor:
    number | null,
): string {

  if (
    ice ===
      null ||
    liquid ===
      null ||
    vapor ===
      null
  ) {
    return 'No definida';
  }

  return `${formatPercent(ice)} hielo · ${formatPercent(liquid)} líquido · ${formatPercent(vapor)} vapor`;
}

function compositionSummary(
  general:
    PlanetScientificDetailSource['general'],
): string {

  return [
    `núcleo ${formatPercent(general.metallicCoreMassFraction01)}`,
    `silicatos ${formatPercent(general.silicateInteriorMassFraction01)}`,
    `hielos ${formatPercent(general.condensedIceMassFraction01)}`,
    `volátiles ${formatPercent(general.volatileRichInteriorMassFraction01)}`,
    `envolvente ${formatPercent(general.gaseousEnvelopeMassFraction01)}`,
  ].join(
    ' · ',
  );
}

function gasCompositionSummary(
  composition:
    PlanetScientificDetailSource['atmosphere']['retainedGasComposition'],
): string {

  if (
    composition.length ===
      0
  ) {
    return 'Sin gases retenidos relevantes';
  }

  return composition
    .slice(
      0,
      6,
    )
    .map(
      component =>
        `${labelGas(component.gas)} ${formatPercent(component.moleFraction01)}`,
    )
    .join(
      ' · ',
    );
}

function labelPlanetType(
  value:
    string,
): string {

  return labelFromMap(
    value,
    {
      ROCKY:
        'Rocoso',
      SUPER_EARTH:
        'Supertierra',
      DESERT:
        'Desértico',
      OCEAN:
        'Oceánico',
      ICE:
        'Helado',
      VOLCANIC:
        'Volcánico',
      MINI_NEPTUNE:
        'Minineptuno',
      GAS_GIANT:
        'Gigante gaseoso',
      ICE_GIANT:
        'Gigante helado',
    },
  );
}

function labelSurfaceRegime(
  value:
    string,
): string {

  return labelFromMap(
    value,
    {
      MINERAL_REGOLITH:
        'Regolito mineral',
      MASSIVE_MINERAL_REGOLITH:
        'Regolito mineral masivo',
      ARID_MINERAL:
        'Mineral árido',
      VOLATILE_RICH_SOLID:
        'Sólido rico en volátiles',
      FROZEN_VOLATILE:
        'Volátiles congelados',
      THERMALLY_REWORKED_MINERAL:
        'Mineral retrabajado térmicamente',
      DEEP_ENVELOPE:
        'Envolvente profunda',
      ICE_RICH_DEEP_ENVELOPE:
        'Envolvente profunda rica en hielo',
    },
  );
}

function labelHabitableZoneRelation(
  value:
    string,
): string {

  return labelFromMap(
    value,
    {
      WHOLLY_INTERIOR_TO_ZONE:
        'Completamente interior a la zona',
      CROSSES_INNER_EDGE:
        'Cruza el borde interior',
      WHOLLY_WITHIN_ZONE:
        'Completamente dentro de la zona',
      CROSSES_OUTER_EDGE:
        'Cruza el borde exterior',
      SPANS_BOTH_EDGES:
        'Atraviesa ambos bordes',
      WHOLLY_EXTERIOR_TO_ZONE:
        'Completamente exterior a la zona',
    },
  );
}

function labelPressureRegime(
  value:
    string,
): string {

  return labelFromMap(
    value,
    {
      VACUUM:
        'Vacío',
      TRACE:
        'Trazas',
      THIN:
        'Delgada',
      MODERATE:
        'Moderada',
      DENSE:
        'Densa',
      EXTREME:
        'Extrema',
      DEEP_ENVELOPE:
        'Envolvente profunda',
    },
  );
}

function labelRetention(
  value:
    string,
): string {

  return labelFromMap(
    value,
    {
      VACUUM:
        'Vacío',
      SEVERELY_DEPLETED:
        'Fuertemente agotada',
      PARTIALLY_RETAINED:
        'Parcialmente retenida',
      WELL_RETAINED:
        'Bien retenida',
      DEEP_ENVELOPE:
        'Envolvente profunda',
    },
  );
}

function labelGreenhouse(
  value:
    string,
): string {

  return labelFromMap(
    value,
    {
      NONE:
        'Nulo',
      NEGLIGIBLE:
        'Despreciable',
      WEAK:
        'Débil',
      MODERATE:
        'Moderado',
      STRONG:
        'Fuerte',
      EXTREME:
        'Extremo',
      DEEP_ENVELOPE:
        'Envolvente profunda',
    },
  );
}

function labelClimateStability(
  value:
    string,
): string {

  return labelFromMap(
    value,
    {
      STABLE:
        'Estable',
      MODERATELY_VARIABLE:
        'Moderadamente variable',
      STRONGLY_VARIABLE:
        'Fuertemente variable',
      EXTREME:
        'Extrema',
      DEEP_ENVELOPE:
        'Envolvente profunda',
    },
  );
}

function labelWaterPhase(
  value:
    string,
): string {

  return labelFromMap(
    value,
    {
      NONE:
        'Sin agua',
      ICE:
        'Hielo',
      LIQUID:
        'Líquida',
      VAPOR:
        'Vapor',
      ICE_AND_LIQUID:
        'Hielo + líquida',
      LIQUID_AND_VAPOR:
        'Líquida + vapor',
      ICE_AND_VAPOR:
        'Hielo + vapor',
      MIXED:
        'Mixta',
      DEEP_ENVELOPE:
        'Envolvente profunda',
    },
  );
}

function labelSurfaceWater(
  value:
    string,
): string {

  return labelFromMap(
    value,
    {
      NONE:
        'No persistente',
      LOCAL_LIQUID:
        'Líquido local',
      SEAS:
        'Mares',
      OCEANS:
        'Océanos',
      GLOBAL_OCEAN:
        'Océano global',
      DEEP_ENVELOPE:
        'Envolvente profunda',
    },
  );
}

function labelRadiation(
  value:
    string,
): string {

  return labelFromMap(
    value,
    {
      MINIMAL:
        'Mínima',
      LOW:
        'Baja',
      MODERATE:
        'Moderada',
      HIGH:
        'Alta',
      EXTREME:
        'Extrema',
      DEEP_ENVELOPE:
        'Envolvente profunda',
    },
  );
}

function labelRadiationProtection(
  value:
    string,
): string {

  return labelFromMap(
    value,
    {
      NONE:
        'Nula',
      WEAK:
        'Débil',
      MODERATE:
        'Moderada',
      STRONG:
        'Fuerte',
      VERY_STRONG:
        'Muy fuerte',
      DEEP_ENVELOPE:
        'Envolvente profunda',
    },
  );
}

function labelGeology(
  value:
    string,
): string {

  return labelFromMap(
    value,
    {
      DEEP_ENVELOPE:
        'Envolvente profunda',
      INERT:
        'Inerte',
      LOW_ACTIVITY:
        'Actividad baja',
      ACTIVE:
        'Activa',
      HIGH_ACTIVITY:
        'Actividad alta',
      EXTREME_ACTIVITY:
        'Actividad extrema',
    },
  );
}

function labelVolcanism(
  value:
    string,
): string {

  return labelFromMap(
    value,
    {
      DEEP_ENVELOPE:
        'Envolvente profunda',
      NONE:
        'Nulo',
      LOW:
        'Bajo',
      MODERATE:
        'Moderado',
      HIGH:
        'Alto',
      EXTREME:
        'Extremo',
    },
  );
}

function labelTectonics(
  value:
    string,
): string {

  return labelFromMap(
    value,
    {
      DEEP_ENVELOPE:
        'Envolvente profunda',
      STAGNANT_LID:
        'Tapa estancada',
      EPISODIC_MOBILITY:
        'Movilidad episódica',
      MOBILE_LID:
        'Tapa móvil',
      PLATE_TECTONICS:
        'Tectónica de placas',
    },
  );
}

function labelMagneticField(
  value:
    string,
): string {

  return labelFromMap(
    value,
    {
      NONE:
        'Nulo',
      WEAK:
        'Débil',
      MODERATE:
        'Moderado',
      STRONG:
        'Fuerte',
      VERY_STRONG:
        'Muy fuerte',
    },
  );
}

function labelMagnetosphere(
  value:
    string,
): string {

  return labelFromMap(
    value,
    {
      NONE:
        'Nula',
      INDUCED:
        'Inducida',
      COMPRESSED:
        'Comprimida',
      GLOBAL:
        'Global',
      EXTENDED:
        'Extendida',
    },
  );
}

function labelGas(
  value:
    string,
): string {

  return labelFromMap(
    value,
    {
      HYDROGEN:
        'H₂',
      HELIUM:
        'He',
      NITROGEN:
        'N₂',
      OXYGEN:
        'O₂',
      CARBON_DIOXIDE:
        'CO₂',
      WATER_VAPOR:
        'H₂O',
      METHANE:
        'CH₄',
      ARGON:
        'Ar',
      SULFUR_DIOXIDE:
        'SO₂',
      CARBON_MONOXIDE:
        'CO',
      AMMONIA:
        'NH₃',
    },
  );
}

function labelMoonAtmosphere(
  value:
    string,
): string {

  return labelFromMap(
    value,
    {
      NONE:
        'Sin atmósfera',
      EXOSPHERE:
        'Exosfera',
      TRACE:
        'Trazas',
      THIN:
        'Atmósfera delgada',
      SUBSTANTIAL:
        'Atmósfera sustancial',
    },
  );
}

function labelMoonWater(
  value:
    string,
): string {

  return labelFromMap(
    value,
    {
      NONE:
        'Sin agua relevante',
      SURFACE_ICE:
        'Hielo superficial',
      SUBSURFACE_OCEAN:
        'Océano subsuperficial',
      ICE_AND_SUBSURFACE_OCEAN:
        'Hielo + océano subsuperficial',
      SURFACE_LIQUID:
        'Líquido superficial',
      MIXED:
        'Régimen mixto',
    },
  );
}

function labelMoonGeology(
  value:
    string,
): string {

  return labelFromMap(
    value,
    {
      INERT:
        'Inerte',
      LOW_ACTIVITY:
        'Actividad baja',
      ACTIVE:
        'Activa',
      TIDALLY_ACTIVE:
        'Activa por mareas',
      EXTREME:
        'Extrema',
    },
  );
}

function labelMoonHabitability(
  value:
    string,
): string {

  return labelFromMap(
    value,
    {
      NONE:
        'Sin candidatura',
      SUBSURFACE_CANDIDATE:
        'Candidata subsuperficial',
      SURFACE_CANDIDATE:
        'Candidata superficial',
      SURFACE_AND_SUBSURFACE_CANDIDATE:
        'Candidata superficial y subsuperficial',
    },
  );
}

function labelFromMap(
  value:
    string,
  labels:
    Readonly<Record<string, string>>,
): string {

  return labels[value] ??
    humanizeCode(
      value,
    );
}

function humanizeCode(
  value:
    string,
): string {

  const normalized =
    value
      .toLowerCase()
      .replaceAll(
        '_',
        ' ',
      );

  return normalized.length ===
    0
    ? 'No definido'
    : `${normalized[0]!.toUpperCase()}${normalized.slice(1)}`;
}
