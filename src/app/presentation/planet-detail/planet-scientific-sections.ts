import {
  type PlanetScientificDetailSource,
  type PlanetScientificResolvedTarget,
} from '../../simulation/planetary/planet-scientific-target-resolver';

export type PlanetScientificSectionId =
  | 'general'
  | 'orbit'
  | 'surface'
  | 'atmosphere'
  | 'climate'
  | 'geology'
  | 'moons';

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
 * only formats it for the seven user-facing scientific sections.
 */
export class PlanetScientificSectionsAssembler {

  private constructor() {}

  static build(
    target:
      PlanetScientificResolvedTarget,
  ): PlanetScientificSectionsModel {

    const detail =
      target.detail;

    return Object.freeze({
      sections:
        Object.freeze([
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
          ),
          climateSection(
            detail,
          ),
          geologySection(
            detail,
          ),
          moonsSection(
            detail,
          ),
        ]),
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
        `${DECIMAL_3.format(orbit.referenceMeanInsolationEarth)} S⊕`,
      ),
      field(
        'Calentamiento de marea',
        formatNormalizedIndex(
          orbit.tidalHeatingProxy,
        ),
        'Contribución de marea en escala normalizada de 0 a 1.',
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
): PlanetScientificSectionModel {

  const atmosphere =
    detail.atmosphere;

  return section(
    'atmosphere',
    'SECCIÓN 04',
    'Atmósfera',
    'Presión retenida, composición gaseosa, retención atmosférica y efecto invernadero.',
    [
      field(
        'Régimen de presión',
        labelPressureRegime(
          atmosphere.pressureRegime,
        ),
        `Retenida: ${labelPressureRegime(atmosphere.retainedPressureRegime)}`,
      ),
      field(
        'Presión superficial retenida',
        formatPressure(
          atmosphere.retainedSurfacePressurePascal,
        ),
      ),
      field(
        'Retención atmosférica',
        labelRetention(
          atmosphere.retentionRegime,
        ),
        `Inventario retenido ${formatPercent(atmosphere.atmosphericInventoryRetentionFraction01)}`,
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
    ],
  );
}

function climateSection(
  detail:
    PlanetScientificDetailSource,
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
        'Rango térmico diurno',
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
          ? 'Mundo geológicamente activo'
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
        'Índice de calentamiento de marea',
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
        geology.hasSustainedDynamo
          ? 'Dínamo sostenida'
          : 'Sin dínamo sostenida',
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
): PlanetScientificSectionModel {

  const moons =
    detail.moons;

  return section(
    'moons',
    'SECCIÓN 07',
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
