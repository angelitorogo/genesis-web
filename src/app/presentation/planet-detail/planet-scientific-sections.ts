import type { Vida5AtmosphericFeedback } from '../../domain/life/vida5-biogenic-atmosphere';
import { environmentalContinuityFieldsPRE3309 } from '../scientific/environmental-continuity-fields-pre33-09';
import { geoChemicalFieldsPRE3307 } from '../scientific/geochemistry-fields-pre33-07';
import { radiationFieldsPRE3308 } from '../scientific/radiation-fields-pre33-08';
import { atmosphereClosureFieldsPRE3306 } from './planet-atmosphere-closure-fields-pre33-06';
import {
  type PlanetScientificDetailSource,
  type PlanetScientificResolvedTarget,
} from '../../simulation/planetary/planet-scientific-target-resolver';

import { planetRadiusKilometers, planetOrbitAuAndKilometers, planetRotationHoursAndDays,
  planetPressurePaBarEarth, planetTemperatureKelvinCelsius, planetTemperatureDifference, planetNormalizedPercent } from './planet-scientific-display-units';
import { unifyPlanetFicheSections } from './planet-scientific-fiche-layout';
import { auditPlanetSurfaceWaterPersistenceV3 } from './planet-surface-water-persistence-audit-v3';

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

/** Display-only accordion entries, never independent physical moon records. */
export type PlanetScientificMoonListEntry = PlanetScientificMoonCardModel & Readonly<{
  kind: 'DETAILED' | 'IDENTITY_ONLY';
}>;

export interface PlanetScientificSectionsModel {
  readonly sections:
    readonly PlanetScientificSectionModel[];

  readonly comparison:
    WorldEarthComparisonModel;

  readonly relevantMoons:
    readonly PlanetScientificMoonCardModel[];

  /** Total declarado, incluso si ningún satélite tiene caracterización individual. */
  readonly totalMoonCount?: number;

  /** PRE-33.10b: merged ordered V3 list for the expandable fiches. */
  readonly allMoons: readonly PlanetScientificMoonListEntry[];

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
    atmosphericFeedbackVIDA5?: Vida5AtmosphericFeedback,
  ): PlanetScientificSectionsModel {

    const detail =
      target.detail;

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

    const relevantMoons: readonly PlanetScientificMoonCardModel[] =
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
                      field(
                        'Masa',
                        `${formatAdaptive(moon.massEarth)} M⊕`,
                      ),
                      field(
                        'Radio',
                        `${formatAdaptive(moon.radiusEarth)} R⊕`,
                      ),
                      field(
                        'Densidad media',
                        `${DECIMAL_2.format(moon.meanDensityGramsPerCubicCentimeter)} g/cm³`,
                      ),
                      field(
                        'Gravedad superficial',
                        `${DECIMAL_2.format(moon.surfaceGravityEarth)} g⊕`,
                      ),
                      field(
                        'Órbita',
                        `${DECIMAL_2.format(moon.semiMajorAxisPlanetRadii)} Rplanet · ${DECIMAL_2.format(moon.orbitalPeriodDays)} días`,
                      ),
                      field(
                        'Rotación',
                        `${DECIMAL_2.format(moon.rotationPeriodHours)} h`,
                        moon.isTidallyLocked
                          ? 'Acoplamiento de marea'
                          : 'Rotación no sincronizada',
                      ),
                      field(
                        'Temperatura estimada',
                        formatTemperature(
                          moon.estimatedSurfaceTemperatureKelvin,
                        ),
                      ),
                      field(
                        'Entorno',
                        `${labelMoonAtmosphere(moon.atmosphereRegime)} · ${labelMoonWater(moon.waterRegime)}`,
                      ),
                      field(
                        'Geología',
                        labelMoonGeology(
                          moon.geologyRegime,
                        ),
                      ),
                      field(
                        'Habitabilidad potencial',
                        labelMoonHabitability(
                          moon.habitabilityRegime,
                        ),
                        `Índice ${formatNormalizedIndex(moon.overallHabitabilityIndex01)}`,
                      ),
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
        );

    // Only V3 receives these canonical, identity-only records. Never copy a
    // phase-21 physical sample or assume that an unknown moon is sterile.
    const minorMoons: readonly PlanetScientificMoonListEntry[] =
      (detail.moons.minorMoonIdentities ?? []).map(identity => Object.freeze({
        kind: 'IDENTITY_ONLY' as const,
        designation: identity.designation,
        moonIndex: identity.moonIndex,
        ordinalLabel: `Luna ${identity.moonOrdinal}`,
        fields: Object.freeze([]) as readonly PlanetScientificFieldModel[],
        badges: Object.freeze([]) as readonly string[],
      }));

    const allMoons: readonly PlanetScientificMoonListEntry[] = Object.freeze([
      ...relevantMoons.map(moon => Object.freeze({ ...moon, kind: 'DETAILED' as const })),
      ...minorMoons,
    ].sort((a, b) => a.moonIndex - b.moonIndex));

    return Object.freeze({
      sections:
        unifyPlanetFicheSections(Object.freeze([
          generalSection(
            detail,
          ),
          orbitSection(
            detail,
          ),
          surfaceSection(
            detail,
          ),
          atmosphereSection(
            detail,
            atmosphericFeedbackVIDA5,
          ),
          climateSection(
            detail,
            atmosphericFeedbackVIDA5,
          ),
          geologySection(
            detail,
          ),
          moonsSection(
            detail,
          ),
          comparisonSection(
            comparison,
          ),
        ])),
      comparison,
      relevantMoons,
      totalMoonCount: detail.moons.moonCount,
      allMoons,
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
        planetRadiusKilometers(general.radiusEarth),
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
        planetRotationHoursAndDays(general.rotationPeriodHours),
        general.isTidallySynchronized
          ? 'Periodo de giro sobre su eje (sideral). Rotación sincronizada por marea; la duración del día solar no está determinada en este modelo.'
          : general.isRetrogradeRotation
            ? 'Periodo de giro sobre su eje (sideral), retrógrado; no equivale necesariamente a la duración del día solar.'
            : 'Periodo de giro sobre su eje (sideral), prógrado; no equivale necesariamente a la duración del día solar.',
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
): PlanetScientificSectionModel {

  const orbit =
    detail.orbit;

  return section(
    'orbit',
    'SECCIÓN 02',
    'Órbita',
    'Geometría orbital, periodo y relación con la zona habitable del sistema.',
    [
      field(
        'Semieje mayor',
        planetOrbitAuAndKilometers(orbit.semiMajorAxisAu),
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
        planetOrbitAuAndKilometers(orbit.periastronAu),
      ),
      field(
        'Apoastro',
        planetOrbitAuAndKilometers(orbit.apoastronAu),
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
        null,
      ),
    ],
  );
}

function surfaceSection(
  detail:
    PlanetScientificDetailSource,
): PlanetScientificSectionModel {

  const surface =
    detail.surface;

  const waterAudit = auditPlanetSurfaceWaterPersistenceV3({
    hasDefinedSolidSurfaceBase: surface.hasDefinedSolidSurfaceBase,
    hasPersistentSurfaceLiquidWater: surface.hasPersistentSurfaceLiquidWater,
    retainedSurfacePressurePascal: detail.atmosphere.retainedSurfacePressurePascal,
    meanSurfaceTemperatureKelvin: detail.climate.meanSurfaceTemperatureKelvin,
    retainedGasComposition: detail.atmosphere.retainedGasComposition,
  });

  const waterPersistenceNote = waterAudit.status === 'EVAPORATION_REPLENISHMENT_UNRESOLVED'
    ? `Líquido permitido por presión total y temperatura; saturación de vapor ≈ ${DECIMAL_1.format(100 * waterAudit.relativeSaturation01!)} % (escenario). Sin ciclo hidrológico ni reposición modelados, la persistencia no está acreditada.`
    : waterAudit.status === 'THERMAL_INCONSISTENCY'
      ? 'Advertencia de coherencia: la etiqueta heredada de persistencia no concuerda con la ventana de agua líquida calculada.'
      : surface.hasPersistentSurfaceLiquidWater
        ? 'Presencia estable de agua líquida en la superficie (según criterios térmicos del modelo; ciclo hidrológico no resuelto)'
        : 'No se mantiene agua líquida superficial de forma persistente';

  return section(
    'surface',
    'SECCIÓN 03',
    'Superficie',
    'Régimen superficial, inventario de agua y exposición radiativa del entorno accesible.',
    [
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
        waterPersistenceNote,
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
        'Capas profundas y envoltura (hipótesis)',
        surface.deepStructureScenario?.status === 'CONDITIONAL_GEOMETRY'
          ? `Capa H₂O equivalente: ${DECIMAL_1.format(surface.deepStructureScenario.layerMinMeters! / 1000)}–${DECIMAL_1.format(surface.deepStructureScenario.layerMaxMeters! / 1000)} km; presión basal de referencia hasta ${SCIENTIFIC_3.format(surface.deepStructureScenario.basePressureMaximumPascal!)} Pa; hielo de alta presión ${surface.deepStructureScenario.highPressureIcePossible ? 'posible' : 'sin umbral alcanzado'}`
          : surface.deepStructureScenario?.status === 'RADIAL_REFERENCE_INCOMPATIBLE'
            ? 'No evaluable: el escenario radial no cabe en el radio físico existente'
            : surface.deepStructureScenario?.status === 'UPDATED_BULK_REQUIRED'
              ? 'No evaluable: la evolución de H₂O requiere actualizar la masa y radio globales'
              : 'Sin capa H₂O cuantificada con las fuentes disponibles',
        surface.deepStructureScenario
          ? `${surface.deepStructureScenario.exposedSolidSurface ? 'Base sólida de referencia' : 'Envoltura profunda sin superficie sólida expuesta'}. Envoltura gaseosa 19.5: ${SCIENTIFIC_3.format(surface.deepStructureScenario.gaseousEnvelopeMassEarth)} M⊕, especies H/He/H₂O no resueltas. Espesor y presión son escenarios máximos de redistribución de H₂O 33.03a, NO un océano CT-0 certificado ni una observación; la fase requiere un perfil P-T independiente.`
          : 'Sin evaluación científica estructural; no se infiere un océano a partir de cobertura 20.7.',
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
      ...radiationFieldsPRE3308(detail.radiationPRE3308 ?? null),
    ],
  );
}

function atmosphereSection(
  detail:
    PlanetScientificDetailSource,
  feedback?: Vida5AtmosphericFeedback,
): PlanetScientificSectionModel {

  const atmosphere =
    detail.atmosphere;

  return section(
    'atmosphere',
    'SECCIÓN 04',
    'Atmósfera',
    'Presión gaseosa, composición, retención de volátiles y efecto invernadero.',
    [
      field(
        'Régimen potencial inicial',
        labelPressureRegime(
          atmosphere.pressureRegime,
        ),
        null,
      ),
      field(
        'Régimen gaseoso actual',
        labelPressureRegime(
          atmosphere.retainedPressureRegime,
        ),
        null,
      ),
      field(
        'Presión superficial gaseosa',
        planetPressurePaBarEarth(
          atmosphere.retainedSurfacePressurePascal,
        ),
        null,
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
        'Densidad de referencia',
        `${DECIMAL_3.format(atmosphere.retainedReferenceDensityKilogramsPerCubicMeter)} kg/m³`,
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
      ...(feedback?.status === 'APPLIED' ? [
        field('Oxígeno atmosférico (VIDA.5)',
          `${formatPercent(feedback.oxygenFraction01 ?? 0)} · presión parcial ${DECIMAL_1.format((feedback.oxygenPartialPressurePascal ?? 0)/1000)} kPa`,
          'Equilibrio biogeoquímico procedural posterior al estado físico PRE-33; no demuestra observación ni detección directa de vida.'),
        field('Reequilibrio de presión (VIDA.5)',
          `${DECIMAL_2.format(feedback.pressureBalanceFactor ?? 1)} × respecto al cierre de columna`,
          'Escenario simplificado de intercambio de volátiles con superficie y océanos; la presión física original se conserva como referencia.'),
      ] : feedback?.status === 'UNRESOLVED_PHYSICAL_BUDGET' ? [
        field('Coherencia biogeoquímica (VIDA.5)', 'Potencial ecológico sin estabilización atmosférica',
          'El escenario físico actual no permite acreditar vegetación estable, fauna aerobia avanzada ni civilización. No se inventa oxígeno ni presión.'),
      ] : []),
      ...atmosphereClosureFieldsPRE3306(atmosphere.closurePRE3306 ?? null),
    ],
  );
}

function climateSection(
  detail:
    PlanetScientificDetailSource,
  feedback?: Vida5AtmosphericFeedback,
): PlanetScientificSectionModel {

  const climate =
    detail.climate;

  return section(
    'climate',
    'SECCIÓN 05',
    'Clima',
    'Balance térmico global, efecto invernadero, variabilidad y redistribución de calor.',
    [
      field(
        'Temperatura de equilibrio',
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
          ? 'No determinado'
          : planetTemperatureDifference(climate.greenhouseSurfaceWarmingKelvin),
      ),
      ...(feedback?.status === 'APPLIED' ? [
        field('Respuesta climática estimada (VIDA.5)',
          `${feedback.climateDeltaKelvin >= 0 ? '+' : ''}${DECIMAL_2.format(feedback.climateDeltaKelvin)} K`,
          'Corrección térmica limitada por la disminución de CO₂; no es una nueva simulación radiativa completa.'),
      ] : []),
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
        'Contraste térmico día/noche',
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
      ...(detail.radiationPRE3308 != null ? environmentalContinuityFieldsPRE3309(null) : []),
    ],
  );
}

function geologySection(
  detail:
    PlanetScientificDetailSource,
): PlanetScientificSectionModel {

  const geology =
    detail.geology;

  return section(
    'geology',
    'SECCIÓN 06',
    'Geología',
    'Actividad interna, vulcanismo, tectónica y protección magnetosférica.',
    [
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
      ...geoChemicalFieldsPRE3307(detail.geochemistryPRE3307 ?? null),
    ],
  );
}

function moonsSection(
  detail:
    PlanetScientificDetailSource,
): PlanetScientificSectionModel {

  const moons =
    detail.moons;

  return section(
    'moons',
    'SECCIÓN 08',
    'Lunas',
    'Población de satélites naturales asociados al planeta y caracterización de los cuerpos más relevantes.',
    [
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


function comparisonSection(
  comparison:
    WorldEarthComparisonModel,
): PlanetScientificSectionModel {

  return section(
    'comparison',
    'SECCIÓN 09',
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

  return planetNormalizedPercent(value);
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

  return planetTemperatureKelvinCelsius(kelvin);
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
    ? 'No determinado'
    : planetTemperatureDifference(kelvin);
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
