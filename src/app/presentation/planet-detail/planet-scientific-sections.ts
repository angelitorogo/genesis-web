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
                              'No se reutilizan temperatura, atmósfera ni agua del progenitor. En H2 el equilibrio de las lunas permanece abierto: sus albedos y calentamiento mareal requieren evaluación individual.'),
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
                    hostEvolution?.requiresPostStellarEvolutionReassessment &&
                      hostEvolution.conditionalEnvironmentReassessmentApplied !== true
                      ? Object.freeze([])
                      : Object.freeze([
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
      ? noCurrentHostOrbit ? 'No existe órbita anfitriona ligada' :
        hostEvolution.evolutionStateNames.includes('WHITE_DWARF') ? 'No determinado · órbita post-AGB no reconstruida' :
        'No resuelto con la masa actual disponible'
      : `${DECIMAL_2.format(hostEvolution.currentOrbitalPeriodDays)} días · ${DECIMAL_3.format(hostEvolution.currentOrbitalPeriodYears)} años`;
    const insolation = hostEvolution.currentMeanInsolationEarth === null
      ? noCurrentHostOrbit ? 'No resoluble tras disrupción del host' :
        hostEvolution.evolutionStateNames.includes('WHITE_DWARF') ? 'No determinada · órbita post-AGB sin validar' :
        'No modelada para el host compacto actual'
      : formatScientificInsolationEarth(hostEvolution.currentMeanInsolationEarth);
    const radiative = disposition === 'EJECTED'
      ? 'Sin zona habitable ligada al antiguo host'
      : disposition === 'HOST_DISRUPTED'
        ? 'No resoluble con la arquitectura anfitriona disuelta'
        : hostEvolution.radiativeRegime === 'QUIESCENT_BLACK_HOLE'
          ? 'Sin zona habitable radiativa del agujero negro quiescente'
          : hostEvolution.currentHostLuminositySolar === null
            ? 'No resuelta: luminosidad actual del remanente no modelada'
            : hostEvolution.radiativeRegime === 'WHITE_DWARF_COOLING_ESTIMATE'
              ? 'Intervalo radiativo de referencia · espectro y estabilidad sin resolver'
              : 'Reevaluada con el host actual';
    const whiteDwarfHost = hostEvolution.evolutionStateNames.includes('WHITE_DWARF');
    const geometryLabel = currentOrbitResolved ? 'actual post-evento' : 'de formación';
    return section(
      'orbit', 'SECCIÓN 02', 'Órbita',
      whiteDwarfHost && disposition === 'UNCHANGED'
        ? 'Órbita canónica de formación intacta. H3 muestra por separado una hipótesis de expansión adiabática: no demuestra supervivencia, estabilidad ni órbita actual.'
        : postSupernovaOrbitSummary(disposition),
      [
        ...conditionalStatusFields(hostEvolution),
        field(whiteDwarfHost && disposition === 'UNCHANGED'
          ? 'Reconfiguración explosiva' : 'Estado dinámico post-supernova',
          disposition === 'UNCHANGED' && whiteDwarfHost ? 'No aplica: formación no explosiva de enana blanca' : postSupernovaDispositionLabel(disposition),
          disposition === 'UNCHANGED'
            ? (whiteDwarfHost ? 'No existe supernova canónica; H3 calcula solo una proyección adiabática hipotética cuando hay masa inicial y final, sin reconstruir la jerarquía.' : 'No existe una supernova histórica resuelta que reconfigure esta órbita.')
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
        field(whiteDwarfHost && disposition === 'UNCHANGED' ? 'Periodo orbital actual · no validado' : 'Periodo orbital actual', period,
          hostEvolution.currentHostMassSolar === null
            ? noCurrentHostOrbit
              ? 'No se asigna un periodo Kepleriano a un planeta expulsado o con host disuelto.'
              : 'No se reutiliza la masa del progenitor como masa actual.'
            : whiteDwarfHost && disposition === 'UNCHANGED'
              ? 'La masa actual es conocida, pero el semieje post-AGB no está validado: no existe periodo actual confirmado.'
              : `Calculado con ${formatAdaptive(hostEvolution.currentHostMassSolar)} M☉ de masa anfitriona actual.`),
        ...(hostEvolution.whiteDwarfPostAgbOrbitalHypothesisApplied === true ? [
          field('Semieje mayor hipotético post-AGB',
            `${formatAdaptive(hostEvolution.whiteDwarfPostAgbSemiMajorAxisAu ?? 0)} UA`,
            hostEvolution.whiteDwarfPostAgbPTypeHypothesisApplied === true
              ? 'Proyección baricéntrica AB de pérdida adiabática de masa total. Aproximación circumbinaria de campo lejano; estabilidad dinámica NO validada.'
              : 'Proyección adiabática aislada a = a_formación × M_inicial/M_remanente. NO es una órbita actual comprobada ni garantiza estabilidad.'),
          field('Periodo hipotético post-AGB',
            `${formatAdaptive(hostEvolution.whiteDwarfPostAgbPeriodYears ?? 0)} años`,
            'Derivado del semieje hipotético y masa actual del remanente, no del semieje de formación.'),
          field(hostEvolution.whiteDwarfPostAgbPTypeHypothesisApplied === true
            ? 'Insolación hipotética WD · componente AB' : 'Insolación hipotética de la enana blanca',
            hostEvolution.whiteDwarfPostAgbHostInsolationEarth === null ||
            hostEvolution.whiteDwarfPostAgbHostInsolationEarth === undefined
              ? 'No resuelta' : formatScientificInsolationEarth(hostEvolution.whiteDwarfPostAgbHostInsolationEarth),
            hostEvolution.whiteDwarfPostAgbPTypeHypothesisApplied === true
              ? 'Contribución WD aislada del sistema AB. H5 suma por separado la compañera y, si procede, C con separación baricéntrica hipotética.'
              : 'Solo componente WD y órbita adiabática HIPOTÉTICA. No incluye irradiación actual verificada de acompañantes.'),
          field('Estabilidad orbital post-AGB', 'No resuelta',
            hostEvolution.whiteDwarfPostAgbPTypeHypothesisApplied === true
              ? 'Aplicabilidad circumbinaria de campo lejano comprobada, pero estabilidad N-body, mareas y supervivencia NO demostradas.'
              : 'La masa perdida modifica potencialmente toda la jerarquía. No se afirma supervivencia ni estabilidad S-type.'),
          ...(hostEvolution.whiteDwarfPostAgbSurvivalAssessment ? (() => {
            const survival = hostEvolution.whiteDwarfPostAgbSurvivalAssessment!;
            const verdict = survival.directEnvelopeIntersection === 'IN_ALL_ASSUMED_GIANT_TEMPERATURE_CASES'
              ? 'Cruce directo en todos los escenarios gigantes supuestos'
              : survival.directEnvelopeIntersection === 'POSSIBLE_WITH_ASSUMED_GIANT_PARAMETERS'
                ? 'Cruce directo posible en los escenarios supuestos'
                : 'Sin cruce directo en los escenarios supuestos';
            return [
              field('Radio de envoltura gigante · hipótesis H4c',
                `${formatAdaptive(survival.envelopeRadiusHypothesisAu[0])}–${formatAdaptive(survival.envelopeRadiusHypothesisAu[1])} UA`,
                hostEvolution.whiteDwarfPostAgbPTypeHypothesisApplied === true
                  ? 'Estimación de la gigante WD progenitora con luminosidades hipotéticas. Comparación radial AB simplificada; no reconstruye desplazamiento de A/B ni la evolución de C.'
                  : 'Estimación Stefan–Boltzmann a partir de L gigantes HIPOTÉTICAS de H4b y rangos de temperaturas efectivos RGB/AGB supuestos; NO es radio máximo estelar medido.'),
              field('Intersección con envoltura · escenario H4c', verdict,
                `Comparación simplificada con periastro de formación ${formatAdaptive(survival.formationPeriastronAu)} UA. ` +
                'No reconstruye la expansión simultánea de la órbita, mareas, viento, radio máximo real ni estabilidad del sistema múltiple.'),
              field('Presencia del planeta en Ground Truth', 'Presente · objeto canónico generado',
                'Su existencia en GENESIS no depende de reconstruir retrospectivamente las fases RGB/AGB.'),
              field('Reconstrucción de supervivencia RGB/AGB', 'No determinada',
                'El modelo H4c evalúa hipótesis de intersección, NO niega la existencia del planeta ni demuestra su trayectoria histórica.'),
            ];
          })() : []),
        ] : []),
        ...(disposition === 'UNCHANGED' ? [] : [
          field('Kick natal efectivo máximo',
            `${DECIMAL_2.format(hostEvolution.postSupernovaMaximumEffectiveKickKmS ?? 0)} km/s`,
            'Impulso efectivo aplicado a esta arquitectura; no es una velocidad inventada del planeta.'),
        ]),
        ...(hostEvolution.radiativeRegime === 'WHITE_DWARF_COOLING_ESTIMATE' ? [
          field('Luminosidad bolométrica actual de referencia',
            hostEvolution.currentHostLuminositySolar === null ? 'No resuelta' :
              `${formatAdaptive(hostEvolution.currentHostLuminositySolar)} L☉`,
            '29.1E-H1: enfriamiento tipo Mestel acotado, ESTIMACIÓN; no es luminosidad medida.'),
          ...(hostEvolution.whiteDwarfCoolingAgeBillionYears === null ||
              hostEvolution.whiteDwarfCoolingAgeBillionYears === undefined ? [] : [
            field('Edad de enfriamiento de la enana blanca',
              `${formatAdaptive(hostEvolution.whiteDwarfCoolingAgeBillionYears)} mil millones de años`,
              'Edad estelar menos edad terminal del progenitor; no es edad desde una supernova.'),
          ]),
          ...(hostEvolution.currentRadiativeReferenceZoneInnerAu === null ||
              hostEvolution.currentRadiativeReferenceZoneInnerAu === undefined ||
              hostEvolution.currentRadiativeReferenceZoneOuterAu === null ||
              hostEvolution.currentRadiativeReferenceZoneOuterAu === undefined ? [] : [
            field('Intervalo radiativo de referencia actual',
              `${formatAdaptive(hostEvolution.currentRadiativeReferenceZoneInnerAu)}–${formatAdaptive(hostEvolution.currentRadiativeReferenceZoneOuterAu)} UA`,
              'Usa umbrales de flujo de referencia solar; NO es habitabilidad de enana blanca confirmada, ni incluye estabilidad S/P-type.'),
          ]),
        ] : []),
        field('Zona habitable radiativa actual', radiative),
        field('Insolación media actual del host', insolation,
          disposition === 'EJECTED'
            ? 'Tras la expulsión se anula la irradiación ligada al antiguo anfitrión; el balance intrínseco puede seguir reevaluándose.'
            : hostEvolution.radiativeRegime === 'QUIESCENT_BLACK_HOLE'
              ? 'Sin disco de acreción modelado: el agujero negro no aporta irradiación estelar.'
              : hostEvolution.radiativeRegime === 'WHITE_DWARF_COOLING_ESTIMATE'
                ? 'Sin órbita post-AGB validada no hay insolación actual autoritativa; la hipótesis aislada H3 se informa por separado.'
                : 'No se reutiliza la luminosidad del progenitor como luminosidad actual.'),
        ...(hostEvolution.whiteDwarfPostAgbEvolvedEnvironment ? [
          field('Insolación total SIMULADA · H5',
            hostEvolution.whiteDwarfPostAgbEvolvedEnvironment.modeledCompanionIrradiationEarth === null &&
              hostEvolution.whiteDwarfPostAgbPTypeHypothesisApplied !== true && hostEvolution.hostLabel === 'A'
              ? formatScientificInsolationEarth(hostEvolution.whiteDwarfPostAgbHostInsolationEarth ?? 0)
              : hostEvolution.whiteDwarfPostAgbEvolvedEnvironment.modeledCompanionIrradiationEarth === null
                ? 'No calculable (acompañantes sin geometría proyectable)'
              : formatScientificInsolationEarth(
                  (hostEvolution.whiteDwarfPostAgbHostInsolationEarth ?? 0) +
                    hostEvolution.whiteDwarfPostAgbEvolvedEnvironment.modeledCompanionIrradiationEarth),
            hostEvolution.whiteDwarfPostAgbPTypeHypothesisApplied === true
              ? 'H5-B: WD y compañera AB (más posible C) en promedios orbitales baricéntricos, sin órbita N-body validada.'
              : hostEvolution.hostLabel === 'A' && hostEvolution.whiteDwarfPostAgbEvolvedEnvironment.modeledCompanionIrradiationEarth === null
                ? 'V2 SINGLE: irradiación WD bajo órbita adiabática simulada; no es una insolación observada.'
                : 'Suma bolométrica WD y compañeras en jerarquía ADIABÁTICA supuesta. No sustituye la insolación observada ni garantiza estabilidad.'),
        ] : []),
        ...(hostEvolution.whiteDwarfThermalEnvelopeApplied === true ? [
          field(hostEvolution.whiteDwarfPostAgbOrbitalHypothesisApplied === true
            ? 'Irradiación bolométrica · mínimo condicionado post-AGB'
            : 'Irradiación bolométrica total · intervalo condicionado',
            wdConditionalFluxRange(hostEvolution),
            'H3: límite INFERIOR bajo hipótesis adiabática de WD. Geometría post-AGB de acompañantes sin validar: límite superior no resuelto.'),
        ] : []),
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
        ...(hostEvolution.intrinsicOnlyThermalProjectionApplied === true ? [
          field('Flujo térmico interno condicionado',
            `${formatAdaptive(hostEvolution.conditionalTotalIntrinsicHeatFluxWattsPerSquareMeter ?? 0)} W/m²`,
            'Estimación geotérmica y mareal intrínseca; no es irradiación del remanente ni temperatura superficial actual.'),
        ] : []),
        ...(hostEvolution.whiteDwarfThermalEnvelopeApplied === true ? [
          field('Equilibrio radiativo condicionado (sin atmósfera)',
            wdConditionalTemperatureRange(hostEvolution),
            'Límite térmico condicionado a expansión adiabática H3, luminosidad WD y ALBEDO DE REFERENCIA. No predice temperatura superficial real ni aporte de compañeros sin geometría post-AGB.'),
        ] : []),
        ...(hostEvolution.whiteDwarfPostAgbAtmosphereScenario !== null &&
            hostEvolution.whiteDwarfPostAgbAtmosphereScenario !== undefined ? [
          field('Criocondensación · escenario H4',
            hostEvolution.whiteDwarfPostAgbAtmosphereScenario.volatileGasesWithCryogenicCondensation.length > 0
              ? hostEvolution.whiteDwarfPostAgbAtmosphereScenario.volatileGasesWithCryogenicCondensation
                  .map(labelGas).join(' · ')
              : 'Sin gas criocondensable dominante según el modelo',
            'Proyección WD-only sin reposición a temperatura radiativa de referencia. No demuestra pérdida histórica ni fase superficial actual.'),
        ] : []),
        field('Estado térmico superficial actual',
          hostEvolution.whiteDwarfPostAgbEvolvedEnvironment
            ? `${formatTemperature(hostEvolution.whiteDwarfPostAgbEvolvedEnvironment.reference.climateTemperatureKelvin)} · simulado H5 (${hostEvolution.whiteDwarfPostAgbEvolvedEnvironment.modeledCompanionIrradiationEarth === null ? 'solo WD' : 'WD + acompañantes modeladas'})`
            : 'No resuelto tras evolución del host compacto',
          hostEvolution.whiteDwarfPostAgbEvolvedEnvironment
            ? 'Proyección térmica del modelo evolutivo seleccionado, NO temperatura observada. La jerarquía y estabilidad post-AGB siguen supuestas.' : null),
        field('Agua superficial actual',
          hostEvolution.whiteDwarfPostAgbEvolvedEnvironment
            ? hostEvolution.whiteDwarfPostAgbEvolvedEnvironment.waterPhaseInReference === 'ICE_IF_WATER_INVENTORY_SURVIVED'
              ? 'Hielo posible · simulación condicionada a volátiles sobrevivientes'
              : hostEvolution.whiteDwarfPostAgbEvolvedEnvironment.waterPhaseInReference === 'POSSIBLE_VAPOR'
                ? 'Vapor posible · escenario H5'
                : 'Inventario de agua sin caracterización suficiente'
            : 'No reevaluada',
          'H5 no inventa un inventario de agua original ni garantiza su supervivencia durante RGB/AGB.'),
        field('Radiación superficial actual', 'No reevaluada',
          hostEvolution.whiteDwarfThermalEnvelopeApplied === true
            ? 'H2 estima la irradiación bolométrica. La exposición superficial necesita espectro, atenuación y atmósfera actuales.'
            : 'Requiere un modelo actual de emisión del remanente y del entorno múltiple.'),
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
    const h4 = hostEvolution.whiteDwarfPostAgbAtmosphereScenario;
    if (h4 !== null && h4 !== undefined) {
      return section(
        'atmosphere', 'SECCIÓN 04', 'Atmósfera',
        hostEvolution.whiteDwarfPostAgbEvolvedEnvironment
          ? 'H5: atmósfera presente SIMULADA bajo un cierre evolutivo declarado, separada del conocimiento observado y de la incertidumbre multihost.'
          : 'H4/H4b/H4c: escenarios de condensación, historia energética y diagnósticos de supervivencia/escape. La atmósfera actual no está determinada.',
        [
          ...(hostEvolution.whiteDwarfPostAgbEvolvedEnvironment ? (() => {
            const evolved = hostEvolution.whiteDwarfPostAgbEvolvedEnvironment!;
            const state = evolved.reference;
            const gases = state.gases.filter(g => g.gasMoleFraction01 > 0)
              .sort((a, b) => b.gasMoleFraction01 - a.gasMoleFraction01);
            return [
              field('Estado atmosférico actual SIMULADO · H5',
                evolved.status === 'SIMULATED_REFERENCE_SCENARIO_NOT_OBSERVED'
                  ? 'Modelo evolutivo seleccionado · NO observado' : 'Sin modelo',
                'H5 produce una única trayectoria de referencia RGB → AGB → WD. No es una medición ni sustituye Ground Truth.'),
              field('Presión actual simulada · H5',
                `${formatAdaptive(state.pressurePascal)} Pa`,
                'Modelo físico RGB/AGB/WD con hipótesis explícitas de XUV/escape y dinámica adiabática. No es una presión observada.'),
              field('Composición actual simulada · H5',
                gases.length ? gases.slice(0, 6)
                  .map(g => `${labelGas(g.gas)} ${formatPercent(g.gasMoleFraction01)}`)
                  .join(' · ') : 'Sin gas retenido en el escenario seleccionado',
                'Fracciones molares derivadas de presupuestos por especie después de escape, reposición modelada y condensación.'),
              field('Sensibilidad de presión · hipótesis H5',
                `${formatAdaptive(evolved.sensitivityPressureRangePascal[0])}–` +
                `${formatAdaptive(evolved.sensitivityPressureRangePascal[1])} Pa`,
                'Tres cierres físicos ensayados: escape bajo, referencia y escape alto. NO es un intervalo estadístico ni un límite universal.'),
              field('Irradiación de acompañantes SIMULADA · H5',
                evolved.modeledCompanionIrradiationEarth === null &&
                  hostEvolution.hostLabel === 'A' && hostEvolution.whiteDwarfPostAgbPTypeHypothesisApplied !== true
                  ? 'No aplica · sistema SINGLE'
                  : evolved.modeledCompanionIrradiationEarth === null
                    ? 'No calculable con jerarquía/luminosidades disponibles'
                  : `${formatAdaptive(evolved.modeledCompanionIrradiationEarth)} S⊕`,
                hostEvolution.whiteDwarfPostAgbPTypeHypothesisApplied === true
                  ? 'H5-B: flujo de la compañera AB y posible C con promedios orbitales baricéntricos. No se usan fases orbitales ni estabilidad N-body.'
                  : hostEvolution.hostLabel === 'A' && evolved.modeledCompanionIrradiationEarth === null
                    ? 'SINGLE WD: no existen estrellas acompañantes; irradiación única de la enana blanca.'
                    : 'Cierre de separación adiabática A/B/C, sin fases orbitales ni estabilidad N-body. No constituye una irradiación multihost medida.'),
              field('Historia gaseosa de referencia · H5',
                `RGB ${formatAdaptive(state.afterRgbInventoryPressureEquivalentPascal)} Pa · ` +
                `AGB ${formatAdaptive(state.afterAgbInventoryPressureEquivalentPascal)} Pa · ` +
                `WD ${formatAdaptive(state.afterWdEscapeInventoryPressureEquivalentPascal)} Pa`,
                'Inventario atmosférico antes de la criocondensación final; las presiones equivalentes permiten auditar pérdida y reposición.'),
              field('Destino de inventarios · H5',
                `Escape ${formatAdaptive(state.totalEscapedPressureEquivalentPascal)} Pa · ` +
                `condensación ${formatAdaptive(state.totalCondensedPressureEquivalentPascal)} Pa · ` +
                `aporte secundario ${formatAdaptive(state.totalSecondarySuppliedPressureEquivalentPascal)} Pa`,
                'Presiones equivalentes de masa. Aporte desde un reservorio secundario LIMITADO y supuesto; no es una tasa volcánica inferida.'),
              field('Alcance del modelo H5',
                evolved.modeledCompanionIrradiationEarth === null && hostEvolution.hostLabel === 'A' &&
                  hostEvolution.whiteDwarfPostAgbPTypeHypothesisApplied !== true
                  ? 'Simulado · anfitrión único WD'
                  : evolved.modeledCompanionIrradiationEarth === null
                    ? 'Simulado · solo host WD; compañeras sin resolver'
                  : 'Simulado · irradiación A/B/C por geometría adiabática',
                hostEvolution.whiteDwarfPostAgbPTypeHypothesisApplied === true
                  ? 'H5-B P-type: modelo atmosférico histórico del progenitor WD, con emisión compañera ACTUAL modelada; no reconstruye irradiación RGB/AGB de la otra estrella ni estabilidad N-body.'
                  : 'Radio gigante, XUV, eficiencias de escape y presupuesto secundario modelados mediante hipótesis explícitas. La estabilidad N-body y la trayectoria estelar no están validadas.'),
            ];
          })() : []),
          ...(hostEvolution.whiteDwarfPostAgbEnvironmentalResolution ? (() => {
            const resolution = hostEvolution.whiteDwarfPostAgbEnvironmentalResolution!;
            return [
              field('Diagnóstico ambiental integrado · H4d',
                hostEvolution.whiteDwarfPostAgbEvolvedEnvironment
                  ? 'Observación no identificable · atmósfera simulada H5 disponible'
                  : 'Solo escenarios condicionados · atmósfera actual indeterminada',
                'H4d audita inferencias SIN seleccionar un modelo. H5 ofrece por separado una trayectoria actual SIMULADA, nunca observada.'),
              field('Existencia del planeta en Ground Truth', 'Presente · canónico',
                'Objeto generado y caracterizado. La reconstrucción histórica de su supervivencia no equivale a verificar su existencia.'),
              field('Presiones de escenarios conjuntos H4b + H4 · H4d',
                `${formatAdaptive(resolution.combinedScenarioPressureRangePascal[0])}–` +
                `${formatAdaptive(resolution.combinedScenarioPressureRangePascal[1])} Pa`,
                'Extremos de escenarios ensayados con acoplamientos hipotéticos, sin reposición y WD-only. NO son límites de la presión real ni un intervalo de confianza.'),
              ...(resolution.conditionalEnvelopeHypothesisInTensionWithCanonicalPresence ? [
                field('Tensión entre hipótesis RGB/AGB y presencia canónica',
                  'El cruce hipotético exige revisar la evolución estelar',
                  'No se elimina al planeta ni se inventa una migración para justificar su existencia; la hipótesis de envoltura carece de una trayectoria estelar validada.'),
              ] : []),
              field('Dependencia del modelo de escape · H4d',
                resolution.scenariosDisagreeOnAtmosphericPresence
                  ? 'Los escenarios incluyen pérdida total y retención gaseosa'
                  : 'Los escenarios requieren interpretación condicionada',
                'No se selecciona arbitrariamente un coeficiente de escape para inventar una atmósfera presente.'),
              field('Información física pendiente · H4d',
                'Radio estelar histórico · XUV/viento · órbita multihost · reposición · transporte radiativo',
                'No pueden inferirse estados reales observados; H5 calcula una trayectoria actual simulada mediante supuestos de cierre explícitos.'),
            ];
          })() : []),
          field('Caracterización post-AGB', 'Escenario atmosférico condicionado · H4',
            'No equivale a observación ni a una atmósfera superviviente confirmada.'),
          field('Inventario gaseoso de referencia anterior',
            `${formatAdaptive(h4.progenitorReferencePressurePascal)} Pa`,
            'Solo inventario previo para calcular límites: NO es presión atmosférica actual.'),
          field('Presión gaseosa posible · escenario WD-only',
            `0 – ${formatAdaptive(h4.scenarioGasPressureCeilingPascal)} Pa`,
            'Entre pérdida completa y retención sin reposición, con cotas criogénicas aproximadas. El máximo NO limita la atmósfera real si hay calentamiento de compañeros o nueva desgasificación.'),
          field('Composición gaseosa del escenario más retenido',
            h4.scenarioGasPressureCeilingPascal <= 0
              ? 'Sin gases cuantificables en este escenario'
              : h4.gasCeilings.filter(gas => gas.gasPressureCeilingPascal > 0)
                .sort((a, b) => b.gasPressureCeilingPascal - a.gasPressureCeilingPascal)
                .slice(0, 6)
                .map(gas => `${labelGas(gas.gas)} ${formatPercent(gas.gasFractionWithinCeiling01)}`)
                .join(' · '),
            'Fracciones entre los gases potencialmente presentes en el escenario, no una medición de composición actual.'),
          field('Volátiles con condensación criogénica potencial',
            h4.volatileGasesWithCryogenicCondensation.length > 0
              ? h4.volatileGasesWithCryogenicCondensation.map(labelGas).join(' · ')
              : 'No identificados con las condiciones del escenario',
            'Aproximación de equilibrio de fase; no reconstruye el historial de hielos ni un inventario sobreviviente.'),
          field('Velocidad de escape planetaria',
            `${formatAdaptive(h4.escapeVelocityKilometersPerSecond)} km/s`,
            'Derivada de la masa y el radio canónicos. Por sí sola no prueba retención durante la fase gigante.'),
          ...(hostEvolution.whiteDwarfPostAgbAtmosphereHistory ? (() => {
            const history = hostEvolution.whiteDwarfPostAgbAtmosphereHistory!;
            const rgb = history.stages[0];
            const agb = history.stages[1];
            const wd = history.stages[2];
            const sensitivities = history.scenarios.filter(scenario =>
              scenario.effectiveBolometricToEscapeCoupling01 > 0);
            return [
              field('Historia RGB/AGB · referencia H4b',
                `RGB ${formatAdaptive(rgb.representativeDurationBillionYears * 1000)} Ma · ` +
                `AGB ${formatAdaptive(agb.representativeDurationBillionYears * 1000)} Ma`,
                'Duraciones heredadas del perfil evolutivo canónico y partición RGB/AGB del motor 14. Las luminosidades de las fases siguen siendo HIPÓTESIS; sin radio máximo ni viento estelar.'),
              field('Luminosidades gigantes supuestas · H4b',
                `RGB ${formatAdaptive(rgb.representativeLuminositySolar ?? 0)} L☉ · ` +
                `AGB ${formatAdaptive(agb.representativeLuminositySolar ?? 0)} L☉`,
                'Hipótesis para estudiar sensibilidad; no son luminosidades observadas del progenitor.'),
              field('Exposición bolométrica histórica · H4b',
                `${SCIENTIFIC_3.format(history.minimumBolometricFluenceJoulePerSquareMeter)} – ` +
                `${SCIENTIFIC_3.format(history.maximumBolometricFluenceJoulePerSquareMeter)} J/m²`,
                `Integra RGB/AGB hipotéticas y ${formatAdaptive(wd.representativeDurationBillionYears)} Gyr ` +
                'de enfriamiento H1. No equivale a XUV ni incluye los primeros 20 Ma de WD o irradiación acompañante.'),
              field('Acoplamiento necesario para perder el inventario inicial · H4b',
                `${SCIENTIFIC_3.format(history.completeLossCouplingThresholdRange01[0])} – ` +
                `${SCIENTIFIC_3.format(history.completeLossCouplingThresholdRange01[1])}`,
                'Fracción efectiva de exposición bolométrica que tendría que transformarse en trabajo de escape, bajo hipótesis de pérdida energética ideal. No es eficiencia observada ni probabilidad.'),
              ...history.scenarios.filter(scenario =>
                scenario.effectiveBolometricToEscapeCoupling01 === 1e-8).map(scenario => {
                  const pressureRange = (range: readonly [number, number]) =>
                    `${formatAdaptive(range[0])}–${formatAdaptive(range[1])} Pa`;
                  return field('Secuencia de pérdida RGB → AGB → WD · H4b (acoplamiento 1E-8)',
                    `RGB ${pressureRange(scenario.afterRgbGasInventoryPressureRangePascal)} · ` +
                    `AGB ${pressureRange(scenario.afterAgbGasInventoryPressureRangePascal)} · ` +
                    `WD ${pressureRange(scenario.afterWdCoolingGasInventoryPressureRangePascal)}`,
                    'Solo sensibilidad de erosión energética acumulativa bajo una hipótesis de acoplamiento. No simula química, viento estelar o reposición de gases.');
                }),
              ...sensitivities.map(scenario =>
                field(`Inventario restante · H4b, acoplamiento ${SCIENTIFIC_3.format(scenario.effectiveBolometricToEscapeCoupling01)}`,
                  `${formatAdaptive(scenario.afterWdCoolingGasInventoryPressureRangePascal[0])} – ` +
                  `${formatAdaptive(scenario.afterWdCoolingGasInventoryPressureRangePascal[1])} Pa`,
                  'Sensibilidad de pérdida total acumulada RGB+AGB+WD sin reposición. NO es presión atmosférica presente; se desconocen XUV, viento, engullimiento y química.')),
              field('Criocondensación después de erosión · H4b',
                sensitivities.map(scenario =>
                  `${SCIENTIFIC_3.format(scenario.effectiveBolometricToEscapeCoupling01)}: ` +
                  `${formatAdaptive(scenario.afterH4CryocondensationCeilingRangePascal[0])}–` +
                  `${formatAdaptive(scenario.afterH4CryocondensationCeilingRangePascal[1])} Pa`,
                ).join(' · '),
                'Intersección de inventario restante hipotético con límite criogénico H4 WD-only. NO hay garantía de supervivencia, ni límite físico de la presión real en sistemas múltiples.'),
            ];
          })() : []),
          ...(hostEvolution.whiteDwarfPostAgbSurvivalAssessment ? (() => {
            const assessment = hostEvolution.whiteDwarfPostAgbSurvivalAssessment!;
            const hotMobile = assessment.speciesEscapeDiagnostics
              .filter(gas => gas.thermallyMobileUnderHotExobaseHypothesis)
              .map(gas => gas.gas);
            return [
              field('Escape térmico por especies · H4c',
                hotMobile.length ? hotMobile.join(' · ') : 'Ninguna especie supera el umbral diagnóstico',
                'Especies con parámetro de Jeans < 15 a exobase HIPOTÉTICA de 5000 K. A 1000 K cambia la retención; no modela flujo XUV, escape hidrodinámico ni escape no térmico.'),
              field('Parámetro de Jeans H₂ / He · H4c',
                assessment.speciesEscapeDiagnostics
                  .filter(gas => gas.gas === 'HYDROGEN' || gas.gas === 'HELIUM')
                  .map(gas => `${gas.gas === 'HYDROGEN' ? 'H₂' : 'He'} ` +
                    `${formatAdaptive(gas.jeansParameterColdExobase)} / ${formatAdaptive(gas.jeansParameterHotExobase)}`)
                  .join(' · ') || 'No presentes en inventario de referencia',
                'Valores λ a 1000 / 5000 K SUPUESTOS en la exobase. No son tasas históricas ni probabilidades de supervivencia.'),
              field('Reposición necesaria para recuperar inventario · H4c',
                `${SCIENTIFIC_3.format(assessment.meanSupplyToRebuildPriorInventoryKilogramsPerYear)} kg/año`,
                'Flujo medio requerido desde pérdida total durante la edad WD, sin nueva erosión. NO implica que el planeta pueda suministrarlo ni que exista atmósfera actual.'),
              field('Fuentes atmosféricas posteriores', 'No cuantificadas',
                'No se infieren velocidades de desgasificación a partir de un índice volcánico ni se inventan reservorios subterráneos.'),
            ];
          })() : []),
          field('Supervivencia de la atmósfera post-AGB', 'No determinada',
            'Desconocemos el flujo XUV y viento durante RGB/AGB, envoltura gigante, erosión, aportes posteriores y geometría actual del sistema múltiple.'),
          field('Presión y composición actuales',
            hostEvolution.whiteDwarfPostAgbEvolvedEnvironment
              ? 'Sin inferencia observacional única · simulación H5 disponible'
              : 'Sin solución única',
            'H4d confirma que los escenarios RGB/AGB y WD-only no identifican un estado actual sin escape calibrado, irradiación multihost y posibles aportes de volátiles.'),
        ],
      );
    }
    return section(
      'atmosphere', 'SECCIÓN 04', 'Atmósfera',
      'La atmósfera actual no se deriva de la antigua irradiación del progenitor.',
      [
        field('Estado atmosférico post-remanente', 'No resuelto'),
        ...(hostEvolution.evolutionStateNames.includes('WHITE_DWARF') ? [
          field('Supervivencia atmosférica durante gigante / AGB', 'No determinada',
            'La evolución hacia enana blanca no es una supernova. La pérdida de masa, irradiación y escape durante la fase gigante requieren un historial específico.'),
        ] : []),
        field('Retención y composición actuales', 'Pendientes de reevaluación',
          hostEvolution.evolutionStateNames.includes('WHITE_DWARF')
            ? 'H2 resuelve parcialmente el balance radiativo, pero no demuestra supervivencia de gases, presión, escape, condensación ni química posterior a AGB.'
            : 'Escape, condensación y química deben recalcularse con el entorno radiativo actual y con la evolución previa.'),
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
      ? hostEvolution.evolutionStateNames.includes('WHITE_DWARF')
        ? 'No determinada · órbita post-AGB sin validar'
        : 'No modelada'
      : formatScientificInsolationEarth(hostEvolution.currentMeanInsolationEarth);
    return section(
      'climate', 'SECCIÓN 05', 'Clima',
      hostEvolution.whiteDwarfPostAgbEvolvedEnvironment
        ? hostEvolution.hostLabel === 'A' && hostEvolution.whiteDwarfPostAgbPTypeHypothesisApplied !== true &&
            hostEvolution.whiteDwarfPostAgbEvolvedEnvironment.modeledCompanionIrradiationEarth === null
          ? 'H5-B: clima SIMULADO de una WD SINGLE bajo evolución RGB/AGB/WD, sin otras fuentes estelares; no observado.'
          : 'H5: clima SIMULADO bajo RGB/AGB/WD y geometría multihost proyectada. No es clima observado.'
        : hostEvolution.whiteDwarfPostAgbAtmosphereScenario !== null &&
      hostEvolution.whiteDwarfPostAgbAtmosphereScenario !== undefined
        ? 'H4 combina el equilibrio WD-only post-AGB con un escenario de gases condicionados; el clima real del sistema múltiple sigue abierto.'
        : 'El clima actual requiere una nueva evolución térmica y atmosférica posterior a la formación del remanente.',
      [
        ...(hostEvolution.whiteDwarfPostAgbEvolvedEnvironment ? [
          field('Temperatura superficial actual SIMULADA · H5',
            formatTemperature(hostEvolution.whiteDwarfPostAgbEvolvedEnvironment.reference.climateTemperatureKelvin),
            hostEvolution.whiteDwarfPostAgbPTypeHypothesisApplied === true
              ? 'H5-B: WD + componente AB compañera y, si procede, C bajo promedios orbitales baricéntricos. No observado ni validado dinámicamente.'
              : 'Modelo térmico gris con aportes WD y, cuando procede, acompañantes A/B/C bajo geometría adiabática. No observado ni validado dinámicamente.'),
          field('Calentamiento invernadero SIMULADO · H5',
            `${formatAdaptive(hostEvolution.whiteDwarfPostAgbEvolvedEnvironment.reference.greenhouseWarmingKelvin)} K`,
            'Aproximación gris a partir de las presiones por especie simuladas.'),
          field('Sensibilidad térmica de los escenarios · H5',
            `${formatTemperature(hostEvolution.whiteDwarfPostAgbEvolvedEnvironment.sensitivityTemperatureRangeKelvin[0])} – ` +
            formatTemperature(hostEvolution.whiteDwarfPostAgbEvolvedEnvironment.sensitivityTemperatureRangeKelvin[1]),
            'Sensibilidad de escenarios internos H5, NO intervalo global por estrellas acompañantes.'),
          field('Agua en el estado SIMULADO · H5',
            hostEvolution.whiteDwarfPostAgbEvolvedEnvironment.waterPhaseInReference === 'ICE_IF_WATER_INVENTORY_SURVIVED'
              ? 'Hielo si sobrevivió el inventario de agua'
              : hostEvolution.whiteDwarfPostAgbEvolvedEnvironment.waterPhaseInReference === 'POSSIBLE_VAPOR'
                ? 'Posible vapor en este cierre'
                : 'Inventario inicial de agua no identificado',
            'No se inventa un inventario de agua ni se prueba su supervivencia durante RGB/AGB.'),
        ] : []),
        field('Irradiación actual del host', currentFlux,
          hostEvolution.radiativeRegime === 'QUIESCENT_BLACK_HOLE'
            ? 'Agujero negro quiescente sin acreción modelada.'
            : hostEvolution.radiativeRegime === 'WHITE_DWARF_COOLING_ESTIMATE'
              ? 'La órbita WD actual NO está determinada; H3 informa una irradiación hipotética por separado, sin predecir atmósfera.'
              : 'La luminosidad actual del remanente no está modelada.'),
        field(hostEvolution.whiteDwarfPostAgbOrbitalHypothesisApplied === true
          ? 'Equilibrio radiativo condicionado post-AGB' : 'Temperatura de equilibrio actual',
          hostEvolution.whiteDwarfThermalEnvelopeApplied === true
            ? wdConditionalTemperatureRange(hostEvolution) : 'No resuelta',
          hostEvolution.whiteDwarfThermalEnvelopeApplied === true
            ? 'H3: límite térmico inferior CONDICIONAL a la expansión adiabática, albedo anterior y calor interno. Compañeros post-AGB no reconstruidos: máximo desconocido. NO es temperatura superficial.'
            : null),
        ...(hostEvolution.whiteDwarfPostAgbAtmosphereScenario !== null &&
            hostEvolution.whiteDwarfPostAgbAtmosphereScenario !== undefined ? [
          field('Calentamiento invernadero · máximo del escenario H4',
            `${formatAdaptive(hostEvolution.whiteDwarfPostAgbAtmosphereScenario.greenhouseWarmingCeilingKelvin)} K`,
            'Límite en escenario WD-only sin reposición: opacidad gris aproximada, no efecto invernadero actual.'),
          field('Temperatura radiativa con gases del escenario H4',
            `${formatTemperature(hostEvolution.whiteDwarfPostAgbAtmosphereScenario.equilibriumTemperatureReferenceKelvin)} – ` +
              formatTemperature(hostEvolution.whiteDwarfPostAgbAtmosphereScenario.greenhouseTemperatureCeilingKelvin),
            'Escenario de pérdida total a retención limitada, solo con flujo WD inferior; estrellas acompañantes y temperatura real sin resolver.'),
        ] : []),
        field('Temperatura superficial actual',
          hostEvolution.whiteDwarfPostAgbEvolvedEnvironment
            ? `${formatTemperature(hostEvolution.whiteDwarfPostAgbEvolvedEnvironment.reference.climateTemperatureKelvin)} · SIMULADA ${hostEvolution.whiteDwarfPostAgbEvolvedEnvironment.modeledCompanionIrradiationEarth === null ? 'WD-only' : 'WD + acompañantes'}`
            : 'No resuelta',
          hostEvolution.whiteDwarfPostAgbEvolvedEnvironment
            ? 'No es una temperatura observada; geometría multihost H5 (si existe) es una proyección adiabática, no órbita N-body validada.' : null),
        field('Efecto invernadero actual',
          hostEvolution.whiteDwarfPostAgbEvolvedEnvironment
            ? 'Simulado bajo cierre H5 · no observado'
            : 'No confirmado; escenario H4 disponible'),
        ...(hostEvolution.intrinsicOnlyThermalProjectionApplied === true ? [
          field('Flujo geotérmico condicionado',
            `${formatAdaptive(hostEvolution.conditionalGeothermalHeatFluxWattsPerSquareMeter ?? 0)} W/m²`,
            'Componente radiogénica/secular estimada con parámetros intrínsecos; no mide la irradiación estelar.'),
          field('Flujo mareal condicionado',
            `${formatAdaptive(hostEvolution.conditionalTidalHeatFluxWattsPerSquareMeter ?? 0)} W/m²`,
            'Contribución estimada del proxy de mareas conservado, válida solo sin reconfiguración orbital.'),
          field('Equivalente radiativo SOLO del calor interno',
            hostEvolution.intrinsicOnlyBlackbodyEquivalentKelvin === null ||
            hostEvolution.intrinsicOnlyBlackbodyEquivalentKelvin === undefined
              ? 'Sin aporte interno cuantificable'
              : formatTemperature(hostEvolution.intrinsicOnlyBlackbodyEquivalentKelvin),
            'Temperatura efectiva de cuerpo negro del flujo intrínseco aislado: NO es temperatura superficial, ni clima actual ni luminosidad del anfitrión.'),
        ] : []),
        ...(hostEvolution.whiteDwarfPostAgbEvolvedEnvironment ? [
          field('Insolación total SIMULADA · H5',
            hostEvolution.whiteDwarfPostAgbEvolvedEnvironment.modeledCompanionIrradiationEarth === null &&
              hostEvolution.whiteDwarfPostAgbPTypeHypothesisApplied !== true && hostEvolution.hostLabel === 'A'
              ? formatScientificInsolationEarth(hostEvolution.whiteDwarfPostAgbHostInsolationEarth ?? 0)
              : hostEvolution.whiteDwarfPostAgbEvolvedEnvironment.modeledCompanionIrradiationEarth === null
                ? 'No calculable (acompañantes sin geometría proyectable)'
              : formatScientificInsolationEarth(
                  (hostEvolution.whiteDwarfPostAgbHostInsolationEarth ?? 0) +
                    hostEvolution.whiteDwarfPostAgbEvolvedEnvironment.modeledCompanionIrradiationEarth),
            hostEvolution.whiteDwarfPostAgbPTypeHypothesisApplied === true
              ? 'H5-B: WD y compañera AB (más posible C) en promedios orbitales baricéntricos, sin órbita N-body validada.'
              : hostEvolution.hostLabel === 'A' && hostEvolution.whiteDwarfPostAgbEvolvedEnvironment.modeledCompanionIrradiationEarth === null
                ? 'V2 SINGLE: irradiación WD bajo órbita adiabática simulada; no es una insolación observada.'
                : 'Suma bolométrica WD y compañeras en jerarquía ADIABÁTICA supuesta. No sustituye la insolación observada ni garantiza estabilidad.'),
        ] : []),
        ...(hostEvolution.whiteDwarfThermalEnvelopeApplied === true ? [
          field(hostEvolution.whiteDwarfPostAgbOrbitalHypothesisApplied === true
            ? 'Irradiación post-AGB condicionada' : 'Irradiación multihost acotada',
            wdConditionalFluxRange(hostEvolution),
            'H3: límite superior no resuelto por evolución de la jerarquía estelar post-AGB; no se reutilizan distancias de formación.'),
          field('Estado del agua bajo la irradiación H4',
            hostEvolution.whiteDwarfPostAgbAtmosphereScenario !== null &&
            hostEvolution.whiteDwarfPostAgbAtmosphereScenario !== undefined &&
            hostEvolution.whiteDwarfPostAgbAtmosphereScenario.greenhouseTemperatureCeilingKelvin < 273.15
              ? 'Escenario WD-only: equilibrio criogénico; agua actual no confirmada'
              : 'No determinado',
            'Las temperaturas calculadas son un escenario condicionado. Sin inventario superviviente, presión ni irradiación total del sistema no se determina agua superficial actual.'),
        ] : []),
        field('Estado climático',
          hostEvolution.whiteDwarfPostAgbEvolvedEnvironment
            ? 'Simulado bajo modelo H5 · jerarquía dinámica no validada'
            : hostEvolution.whiteDwarfPostAgbEnvironmentalResolution
            ? 'No resuelto · H4d conserva solo el límite térmico condicionado'
            : 'Pendiente de evolución post-remanente',
          hostEvolution.whiteDwarfPostAgbEnvironmentalResolution
            ? 'No se convierte la temperatura WD-only de H3/H4 en temperatura superficial; el aporte de acompañantes no está acotado por arriba.'
            : null),
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


function wdConditionalTemperatureRange(
  evolution: PlanetScientificHostEvolutionContext,
): string {
  const min = evolution.whiteDwarfEquilibriumLowerKelvin;
  const max = evolution.whiteDwarfEquilibriumUpperKelvin;
  if (min === null || min === undefined) return 'No resuelto';
  return max === null || max === undefined
    ? `${formatTemperature(min)} · solo límite inferior`
    : `${formatTemperature(min)} – ${formatTemperature(max)}`;
}

function wdConditionalFluxRange(
  evolution: PlanetScientificHostEvolutionContext,
): string {
  const min = evolution.whiteDwarfExternalFluxLowerEarth;
  const max = evolution.whiteDwarfExternalFluxUpperEarth;
  if (min === null || min === undefined) return 'No resuelta';
  return max === null || max === undefined
    ? `≥ ${formatScientificInsolationEarth(min)} · superior no resuelto`
    : `${formatScientificInsolationEarth(min)} – ${formatScientificInsolationEarth(max)}`;
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
