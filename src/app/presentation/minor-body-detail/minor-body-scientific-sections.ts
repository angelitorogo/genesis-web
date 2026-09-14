import {
  MinorBodyScientificTargetKind,
  type MinorBodyScientificDetailSource,
  type MinorBodyScientificResolvedTarget,
} from '../../simulation/planetary/minor-body-scientific-target-resolver';

export interface MinorBodyScientificFieldModel {
  readonly label:
    string;

  readonly value:
    string;

  readonly note:
    string | null;
}

export interface MinorBodyScientificSectionModel {
  readonly id:
    string;

  readonly eyebrow:
    string;

  readonly title:
    string;

  readonly summary:
    string;

  readonly fields:
    readonly MinorBodyScientificFieldModel[];
}

export interface MinorBodyScientificSectionsModel {
  readonly badges:
    readonly string[];

  readonly sections:
    readonly MinorBodyScientificSectionModel[];
}

const NUMBER_3 =
  new Intl.NumberFormat(
    'es-ES',
    {
      maximumFractionDigits:
        3,
    },
  );

const NUMBER_2 =
  new Intl.NumberFormat(
    'es-ES',
    {
      maximumFractionDigits:
        2,
    },
  );

const NUMBER_6 =
  new Intl.NumberFormat(
    'es-ES',
    {
      maximumFractionDigits:
        6,
    },
  );

/** Point-26.6 presentation-only formatter for asteroid/comet science. */
export class MinorBodyScientificSectionsAssembler {

  private constructor() {}

  static build(
    target:
      MinorBodyScientificResolvedTarget,
  ): MinorBodyScientificSectionsModel {

    return target.detail.kind ===
      MinorBodyScientificTargetKind.ASTEROID
      ? asteroidSections(
          target.detail,
        )
      : cometSections(
          target.detail,
        );
  }
}

function asteroidSections(
  detail:
    Extract<
      MinorBodyScientificDetailSource,
      {
        kind:
          typeof MinorBodyScientificTargetKind.ASTEROID;
      }
    >,
): MinorBodyScientificSectionsModel {

  const general =
    detail.general;

  const composition =
    detail.composition;

  const structure =
    detail.structure;

  const badges = [
    compositionRegimeLabel(
      general.compositionRegime,
    ),
    structureRegimeLabel(
      general.structureRegime,
    ),
    multiplicityRegimeLabel(
      general.multiplicityRegime,
    ),
    beltRegionLabel(
      general.beltRegion,
    ),
  ];

  return Object.freeze({
    badges:
      Object.freeze(
        badges,
      ),
    sections:
      Object.freeze([
        section(
          'general',
          'SECCIÓN 01',
          'General',
          'Tamaño, densidad, reflectividad y contexto del cinturón de origen.',
          [
            field(
              'Diámetro',
              `${number(general.diameterKilometers)} km`,
            ),
            field(
              'Región del cinturón',
              beltRegionLabel(
                general.beltRegion,
              ),
            ),
            field(
              'Tipo composicional',
              compositionRegimeLabel(
                general.compositionRegime,
              ),
            ),
            field(
              'Estructura',
              structureRegimeLabel(
                general.structureRegime,
              ),
            ),
            field(
              'Configuración',
              multiplicityRegimeLabel(
                general.multiplicityRegime,
              ),
            ),
            field(
              'Densidad aparente',
              `${number(general.bulkDensityGramsPerCubicCentimeter)} g/cm³`,
            ),
            field(
              'Albedo geométrico',
              number(
                general.geometricAlbedo01,
              ),
            ),
            field(
              'Índice de porosidad',
              index01(
                general.porosityIndex01,
              ),
            ),
            field(
              'Índice poblacional del cinturón',
              index01(
                general.sourceBeltPopulationIndex01,
              ),
            ),
            field(
              'Masa retenida del cinturón',
              `${NUMBER_6.format(general.sourceBeltRetainedMassEarth)} M⊕`,
            ),
          ],
        ),
        section(
          'orbit',
          'SECCIÓN 02',
          'Órbita',
          'Elementos orbitales congelados y relación radial con su cinturón de origen.',
          [
            field(
              'Semieje mayor',
              `${number(detail.orbit.semiMajorAxisAu)} UA`,
            ),
            field(
              'Excentricidad',
              number(
                detail.orbit.eccentricity,
              ),
            ),
            field(
              'Inclinación',
              `${number(detail.orbit.inclinationDegrees)}°`,
            ),
            field(
              'Periastro',
              `${number(detail.orbit.periapsisAu)} UA`,
            ),
            field(
              'Apoastro',
              `${number(detail.orbit.apoapsisAu)} UA`,
            ),
            field(
              'Longitud del nodo ascendente',
              `${number(detail.orbit.longitudeAscendingNodeDegrees)}°`,
            ),
            field(
              'Argumento del periastro',
              `${number(detail.orbit.argumentOfPeriapsisDegrees)}°`,
            ),
            field(
              'Anomalía media',
              `${number(detail.orbit.meanAnomalyDegrees)}°`,
            ),
            field(
              'Límites del cinturón',
              `${number(detail.orbit.sourceInnerEdgeAu)} – ${number(detail.orbit.sourceOuterEdgeAu)} UA`,
            ),
            field(
              'Pico poblacional',
              `${number(detail.orbit.sourcePeakAu)} UA`,
            ),
          ],
        ),
        section(
          'composition',
          'SECCIÓN 03',
          'Composición',
          'Fracciones composicionales de referencia de la taxonomía física del asteroide.',
          [
            field(
              'Carbonáceos',
              percent(
                composition.carbonaceousFraction01,
              ),
            ),
            field(
              'Silicatos',
              percent(
                composition.silicateFraction01,
              ),
            ),
            field(
              'Metales',
              percent(
                composition.metalFraction01,
              ),
            ),
            field(
              'Hielo',
              percent(
                composition.iceFraction01,
              ),
            ),
            field(
              'Presencia significativa de hielo',
              yesNo(
                composition.isIceBearing,
              ),
            ),
            field(
              'Dominio metálico',
              yesNo(
                composition.isMetalRich,
              ),
            ),
          ],
        ),
        section(
          'structure',
          'SECCIÓN 04',
          'Estructura',
          'Estado interno y posible multiplicidad del cuerpo.',
          [
            field(
              'Pila de escombros',
              yesNo(
                structure.isRubblePile,
              ),
            ),
            field(
              'Binario de contacto',
              yesNo(
                structure.isContactBinary,
              ),
            ),
            field(
              'Binario separado',
              yesNo(
                structure.isDetachedBinary,
              ),
            ),
            field(
              'Relación de masas del compañero',
              nullableIndex(
                structure.binaryMassRatio01,
              ),
              structure.binaryMassRatio01 ===
                null
                ? 'No aplica a esta configuración.'
                : null,
            ),
            field(
              'Separación del compañero',
              structure.binarySeparationPrimaryRadii ===
                null
                ? 'No aplica'
                : `${number(structure.binarySeparationPrimaryRadii)} radios primarios`,
            ),
          ],
        ),
      ]),
  });
}

function cometSections(
  detail:
    Extract<
      MinorBodyScientificDetailSource,
      {
        kind:
          typeof MinorBodyScientificTargetKind.COMET;
      }
    >,
): MinorBodyScientificSectionsModel {

  const general =
    detail.general;

  return Object.freeze({
    badges:
      Object.freeze([
        periodRegimeLabel(
          general.periodRegime,
        ),
        activityRegimeLabel(
          detail.activity.periapsis.activityRegime,
        ),
        detail.activity.periapsis.hasComa
          ? 'Coma activa en periastro'
          : 'Sin coma en periastro',
      ]),
    sections:
      Object.freeze([
        section(
          'general',
          'SECCIÓN 01',
          'General',
          'Propiedades globales del núcleo y familia orbital del cometa.',
          [
            field(
              'Diámetro del núcleo',
              `${number(general.diameterKilometers)} km`,
            ),
            field(
              'Familia orbital',
              periodRegimeLabel(
                general.periodRegime,
              ),
            ),
            field(
              'Periodo orbital',
              `${number(general.orbitalPeriodYears)} años`,
            ),
            field(
              'Densidad aparente',
              `${number(general.bulkDensityGramsPerCubicCentimeter)} g/cm³`,
            ),
            field(
              'Albedo geométrico',
              number(
                general.geometricAlbedo01,
              ),
            ),
            field(
              'Índice de porosidad',
              index01(
                general.porosityIndex01,
              ),
            ),
            field(
              'Riqueza en volátiles',
              index01(
                general.volatileRichnessIndex01,
              ),
            ),
            field(
              'Soporte del reservorio cometario',
              index01(
                general.reservoirSupportIndex01,
              ),
            ),
          ],
        ),
        section(
          'orbit',
          'SECCIÓN 02',
          'Órbita',
          'Órbita ligada al sistema estelar y geometría de sus ápsides.',
          [
            field(
              'Semieje mayor',
              `${number(detail.orbit.semiMajorAxisAu)} UA`,
            ),
            field(
              'Excentricidad',
              number(
                detail.orbit.eccentricity,
              ),
            ),
            field(
              'Inclinación',
              `${number(detail.orbit.inclinationDegrees)}°`,
            ),
            field(
              'Periastro',
              `${number(detail.orbit.periapsisAu)} UA`,
            ),
            field(
              'Apoastro',
              `${number(detail.orbit.apoapsisAu)} UA`,
            ),
            field(
              'Periodo orbital',
              `${number(detail.orbit.orbitalPeriodYears)} años · ${number(detail.orbit.orbitalPeriodYears * 365.25)} días`,
            ),
            field(
              'Longitud del nodo ascendente',
              `${number(detail.orbit.longitudeAscendingNodeDegrees)}°`,
            ),
            field(
              'Argumento del periastro',
              `${number(detail.orbit.argumentOfPeriapsisDegrees)}°`,
            ),
            field(
              'Anomalía media',
              `${number(detail.orbit.meanAnomalyDegrees)}°`,
            ),
          ],
        ),
        section(
          'nucleus',
          'SECCIÓN 03',
          'Núcleo',
          'Composición y estructura física de referencia del núcleo cometario.',
          [
            field(
              'Hielo',
              percent(
                detail.nucleus.iceFraction01,
              ),
            ),
            field(
              'Polvo',
              percent(
                detail.nucleus.dustFraction01,
              ),
            ),
            field(
              'Índice de porosidad',
              index01(
                detail.nucleus.porosityIndex01,
              ),
            ),
            field(
              'Densidad aparente',
              `${number(detail.nucleus.bulkDensityGramsPerCubicCentimeter)} g/cm³`,
            ),
            field(
              'Albedo geométrico',
              number(
                detail.nucleus.geometricAlbedo01,
              ),
            ),
            field(
              'Riqueza en volátiles',
              index01(
                detail.nucleus.volatileRichnessIndex01,
              ),
            ),
          ],
        ),
        section(
          'activity',
          'SECCIÓN 04',
          'Actividad',
          'Respuesta cometaria calculada en los dos extremos de la órbita.',
          [
            field(
              'Actividad en periastro',
              activityRegimeLabel(
                detail.activity.periapsis.activityRegime,
              ),
              `${index01(detail.activity.periapsis.activityIndex01)} · ${number(detail.activity.periapsis.distanceAu)} UA`,
            ),
            field(
              'Temperatura de equilibrio en periastro',
              kelvinCelsius(
                detail.activity.periapsis.equilibriumTemperatureKelvin,
              ),
            ),
            field(
              'Flujo incidente en periastro',
              `${number(detail.activity.periapsis.incidentFluxEarth)} S⊕`,
            ),
            field(
              'Morfología en periastro',
              activityMorphology(
                detail.activity.periapsis,
              ),
            ),
            field(
              'Soporte hielo de agua / supervolátiles',
              `${index01(detail.activity.periapsis.waterIceActivitySupportIndex01)} / ${index01(detail.activity.periapsis.supervolatileActivitySupportIndex01)}`,
              'Valores en periastro.',
            ),
            field(
              'Actividad en apoastro',
              activityRegimeLabel(
                detail.activity.apoapsis.activityRegime,
              ),
              `${index01(detail.activity.apoapsis.activityIndex01)} · ${number(detail.activity.apoapsis.distanceAu)} UA`,
            ),
            field(
              'Temperatura de equilibrio en apoastro',
              kelvinCelsius(
                detail.activity.apoapsis.equilibriumTemperatureKelvin,
              ),
            ),
            field(
              'Flujo incidente en apoastro',
              `${number(detail.activity.apoapsis.incidentFluxEarth)} S⊕`,
            ),
            field(
              'Soporte hielo de agua / supervolátiles',
              `${index01(detail.activity.apoapsis.waterIceActivitySupportIndex01)} / ${index01(detail.activity.apoapsis.supervolatileActivitySupportIndex01)}`,
              'Valores en apoastro.',
            ),
            field(
              'Morfología en apoastro',
              activityMorphology(
                detail.activity.apoapsis,
              ),
            ),
          ],
        ),
      ]),
  });
}

function section(
  id:
    string,

  eyebrow:
    string,

  title:
    string,

  summary:
    string,

  fields:
    readonly MinorBodyScientificFieldModel[],
): MinorBodyScientificSectionModel {
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
): MinorBodyScientificFieldModel {
  return Object.freeze({
    label,
    value,
    note,
  });
}

function number(
  value:
    number,
): string {
  return NUMBER_3.format(
    value,
  );
}

function percent(
  value:
    number,
): string {
  return `${NUMBER_2.format(value * 100)} %`;
}

function index01(
  value:
    number,
): string {
  return `${NUMBER_3.format(value)} / 1`;
}

function nullableIndex(
  value:
    number | null,
): string {
  return value ===
    null
    ? 'No aplica'
    : index01(
        value,
      );
}

function yesNo(
  value:
    boolean,
): string {
  return value
    ? 'Sí'
    : 'No';
}

function kelvinCelsius(
  kelvin:
    number,
): string {
  return `${number(kelvin)} K · ${number(kelvin - 273.15)} °C`;
}

function activityMorphology(
  activity:
    Readonly<{
      hasComa: boolean;
      hasDustTail: boolean;
      hasIonTail: boolean;
    }>,
): string {
  const visible = [
    activity.hasComa
      ? 'coma'
      : null,
    activity.hasDustTail
      ? 'cola de polvo'
      : null,
    activity.hasIonTail
      ? 'cola iónica'
      : null,
  ]
    .filter(
      (
        value,
      ): value is string =>
        value !==
        null,
    );

  return visible.length ===
    0
    ? 'Sin estructuras activas'
    : visible.join(
        ' · ',
      );
}

function beltRegionLabel(
  value:
    string,
): string {
  return value ===
    'INNER'
    ? 'Cinturón interior'
    : value ===
      'OUTER'
      ? 'Cinturón exterior'
      : value;
}

function compositionRegimeLabel(
  value:
    string,
): string {
  switch (
    value
  ) {
    case 'CARBONACEOUS':
      return 'Carbonáceo';
    case 'SILICACEOUS':
      return 'Silicáceo';
    case 'METALLIC':
      return 'Metálico';
    case 'ICE_RICH':
      return 'Rico en hielo';
    case 'MIXED_ROCK_ICE':
      return 'Roca y hielo';
    default:
      return value;
  }
}

function structureRegimeLabel(
  value:
    string,
): string {
  switch (
    value
  ) {
    case 'COHERENT':
      return 'Coherente';
    case 'FRACTURED':
      return 'Fracturado';
    case 'RUBBLE_PILE':
      return 'Pila de escombros';
    default:
      return value;
  }
}

function multiplicityRegimeLabel(
  value:
    string,
): string {
  switch (
    value
  ) {
    case 'SINGLE':
      return 'Individual';
    case 'CONTACT_BINARY':
      return 'Binario de contacto';
    case 'BINARY':
      return 'Binario separado';
    default:
      return value;
  }
}

function periodRegimeLabel(
  value:
    string,
): string {
  return value ===
    'SHORT_PERIOD'
    ? 'Periodo corto'
    : value ===
      'LONG_PERIOD'
      ? 'Periodo largo'
      : value;
}

function activityRegimeLabel(
  value:
    string,
): string {
  switch (
    value
  ) {
    case 'DORMANT':
      return 'Inactivo';
    case 'WEAK':
      return 'Actividad débil';
    case 'MODERATE':
      return 'Actividad moderada';
    case 'STRONG':
      return 'Actividad intensa';
    case 'EXTREME':
      return 'Actividad extrema';
    default:
      return value;
  }
}
