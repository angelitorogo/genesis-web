import {
  MinorBodyScientificTargetKind,
  type MinorBodyScientificDetailSource,
  type MinorBodyScientificResolvedTarget,
} from '../../simulation/planetary/minor-body-scientific-target-resolver';

import {
  type MinorBodyScientificDynamicsSource,
  type MinorBodyScientificRiskTargetSource,
} from '../../simulation/planetary/minor-body-scientific-dynamics-projection';

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

/** Point-26.8 presentation-only formatter for asteroid/comet science and frozen phase-23 dynamics. */
export class MinorBodyScientificSectionsAssembler {

  private constructor() {}

  static build(
    target:
      MinorBodyScientificResolvedTarget,
  ): MinorBodyScientificSectionsModel {

    if (
      target.detail.kind ===
      MinorBodyScientificTargetKind.ASTEROID
    ) {
      return asteroidSections(
        target.detail,
      );
    }

    if (
      target.detail.kind ===
      MinorBodyScientificTargetKind.COMET
    ) {
      return cometSections(
        target.detail,
      );
    }

    return transNeptunianSections(
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
    dynamicsBadge(
      detail.dynamics,
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
        ...dynamicsSections(
          detail.dynamics,
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
        dynamicsBadge(
          detail.dynamics,
        ),
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
        ...dynamicsSections(
          detail.dynamics,
        ),
      ]),
  });
}

function transNeptunianSections(
  detail:
    Extract<
      MinorBodyScientificDetailSource,
      {
        kind:
          typeof MinorBodyScientificTargetKind.TRANS_NEPTUNIAN_OBJECT;
      }
    >,
): MinorBodyScientificSectionsModel {

  const general =
    detail.general;

  return Object.freeze({
    badges:
      Object.freeze([
        transNeptunianRegimeLabel(
          general.dynamicalRegime,
        ),
        general.isDwarfPlanetScaleCandidate
          ? 'Escala de planeta enano'
          : 'Cuerpo transneptuniano menor',
        detail.composition.iceFraction01 >=
          0.65
          ? 'Rico en hielo'
          : 'Mezcla hielo-roca',
        dynamicsBadge(
          detail.dynamics,
        ),
      ]),
    sections:
      Object.freeze([
        section(
          'general',
          'SECCIÓN 01',
          'General',
          'Tamaño, densidad, reflectividad y familia dinámica del objeto transneptuniano.',
          [
            field(
              'Diámetro',
              `${number(general.diameterKilometers)} km`,
            ),
            field(
              'Régimen dinámico',
              transNeptunianRegimeLabel(
                general.dynamicalRegime,
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
              'Escala de planeta enano',
              yesNo(
                general.isDwarfPlanetScaleCandidate,
              ),
              'Criterio geométrico de tamaño del generador; no implica clasificación oficial de planeta enano.',
            ),
            field(
              'Soporte del reservorio exterior',
              index01(
                general.reservoirSupportIndex01,
              ),
            ),
            field(
              'Polvo residual de formación',
              `${NUMBER_6.format(general.sourceResidualDustMassEarth)} M⊕`,
            ),
          ],
        ),
        section(
          'orbit',
          'SECCIÓN 02',
          'Órbita',
          'Elementos orbitales del objeto en el reservorio exterior del sistema.',
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
              'Periodo orbital',
              `${number(detail.orbit.orbitalPeriodYears)} años`,
            ),
          ],
        ),
        section(
          'composition',
          'SECCIÓN 03',
          'Composición',
          'Fracciones de hielo y roca del cuerpo materializado en el reservorio transneptuniano.',
          [
            field(
              'Hielo',
              percent(
                detail.composition.iceFraction01,
              ),
            ),
            field(
              'Roca',
              percent(
                detail.composition.rockFraction01,
              ),
            ),
          ],
        ),
        ...dynamicsSections(
          detail.dynamics,
          4,
          5,
        ),
      ]),
  });
}

function dynamicsSections(
  dynamics:
    MinorBodyScientificDynamicsSource,

  encounterSectionNumber =
    5,

  riskSectionNumber =
    6,
): readonly MinorBodyScientificSectionModel[] {

  const encounterFields:
    MinorBodyScientificFieldModel[] = [
      field(
        'Objetivos evaluables',
        dynamics.assessedTargetCount.toString(),
        'Planetas y lunas relevantes con geometría individual disponible.',
      ),
      field(
        'Cruces radiales',
        dynamics.radialCrossingTargetCount.toString(),
        'Compartir distancias estelares no implica coincidir en el mismo lugar ni al mismo tiempo.',
      ),
      field(
        'Corredores de aproximación',
        dynamics.approachCorridorTargetCount.toString(),
        'Geometrías capaces de entrar en la región dinámica del objetivo.',
      ),
      field(
        'Encuentros cercanos resueltos',
        dynamics.resolvedEncounterCount.toString(),
        'La resolución temporal actual permite como máximo un encuentro ganador por cuerpo.',
      ),
    ];

  if (
    dynamics.encounter ===
      null
  ) {
    encounterFields.push(
      field(
        'Resultado dinámico',
        'Sin encuentro cercano resuelto',
        'Puede haber cruces o corredores geométricos sin coincidencia temporal.',
      ),
    );
  } else {
    const encounter =
      dynamics.encounter;

    encounterFields.push(
      field(
        'Objetivo del encuentro',
        encounter.targetName,
        targetKindLabel(
          encounter.targetKind,
        ),
      ),
      field(
        'Resultado del encuentro',
        encounterOutcomeLabel(
          encounter.outcomeRegime,
        ),
      ),
      field(
        'Aproximación mínima',
        auDistance(
          encounter.closestApproachAu,
        ),
      ),
      field(
        'Velocidad relativa',
        `${number(encounter.relativeSpeedKmPerSecond)} km/s`,
      ),
      field(
        'Intensidad del encuentro',
        index01(
          encounter.encounterStrengthIndex01,
        ),
      ),
      field(
        'Cambio orbital',
        yesNo(
          encounter.orbitalChangeOccurred,
        ),
      ),
      field(
        'Órbita posterior',
        `${conicRegimeLabel(encounter.outgoingConicRegime)} · a ${signedAu(encounter.outgoingSemiMajorAxisAu)} · e ${number(encounter.outgoingEccentricity)} · i ${number(encounter.outgoingInclinationDegrees)}°`,
      ),
    );
  }

  const riskFields:
    MinorBodyScientificFieldModel[] = [
      field(
        'Candidatos de riesgo orbital',
        dynamics.riskCandidateCount.toString(),
        'Entrada geométrica en el corredor dinámico de un planeta o en la región orbital de una luna.',
      ),
      field(
        'Corredores geométricos de colisión planetaria',
        dynamics.directCollisionGeometryTargetCount.toString(),
        'Geometría de trayectoria; no equivale a un impacto observado.',
      ),
      field(
        'Índice máximo de riesgo orbital',
        index01(
          dynamics.highestOrbitalRiskIndex01,
        ),
      ),
      field(
        `Probabilidad temporal máxima (${number(dynamics.timeWindowYears)} años)`,
        probabilityPercent(
          dynamics.highestTemporalImpactProbability01,
        ),
        'Estimación analítica de horizonte finito; no materializa un evento de impacto.',
      ),
    ];

  if (
    dynamics.relevantTargets.length ===
      0
  ) {
    riskFields.push(
      field(
        'Evaluación de objetivos',
        'Sin cruces radiales ni corredores relevantes',
      ),
    );
  } else {
    dynamics.relevantTargets.forEach(
      (
        target,
        index,
      ) => {
        riskFields.push(
          riskTargetField(
            target,
            index,
            dynamics.timeWindowYears,
          ),
        );
      },
    );
  }

  return Object.freeze([
    section(
      'encounters',
      `SECCIÓN ${String(encounterSectionNumber).padStart(2, '0')}`,
      'Encuentros',
      'Cruces orbitales, corredores de aproximación y encuentros cercanos resueltos por la dinámica del sistema.',
      encounterFields,
    ),
    section(
      'risk',
      `SECCIÓN ${String(riskSectionNumber).padStart(2, '0')}`,
      'Riesgo orbital',
      `Geometría de riesgo posterior a encuentros y estimación temporal a ${number(dynamics.timeWindowYears)} años. Un corredor de riesgo no afirma que vaya a producirse un impacto.`,
      riskFields,
    ),
  ]);
}

function riskTargetField(
  target:
    MinorBodyScientificRiskTargetSource,

  index:
    number,

  timeWindowYears:
    number,
): MinorBodyScientificFieldModel {

  const geometry = [
    targetKindLabel(
      target.targetKind,
    ),
    `riesgo ${index01(target.orbitalRiskIndex01)}`,
    `exposición ${index01(target.orbitalExposureIndex01)}`,
    `P(${number(timeWindowYears)} a) ${probabilityPercent(target.temporalImpactProbability01)}`,
  ];

  if (
    target.minimumNodalSeparationAu !==
      null
  ) {
    geometry.push(
      `separación nodal ${auDistance(target.minimumNodalSeparationAu)}`,
    );
  }

  geometry.push(
    `velocidad ${number(target.characteristicRelativeSpeedKmPerSecond)} km/s`,
    `enfoque gravitatorio ×${number(target.gravitationalFocusingFactor)}`,
  );

  return field(
    `Objetivo ${index + 1} · ${target.targetName}`,
    impactRiskRegimeLabel(
      target.regime,
    ),
    `${geometry.join(' · ')} · ${temporalRiskRegimeLabel(target.temporalRegime)}${target.directCollisionGeometryCandidate ? ' · corredor físico planetario' : ''}${target.isSinglePassage ? ' · paso único' : ''}`,
  );
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

function dynamicsBadge(
  dynamics:
    MinorBodyScientificDynamicsSource,
): string {
  if (
    dynamics.directCollisionGeometryTargetCount >
    0
  ) {
    return 'Corredor geométrico de colisión';
  }

  if (
    dynamics.riskCandidateCount >
    0
  ) {
    return 'Riesgo orbital detectado';
  }

  if (
    dynamics.radialCrossingTargetCount >
    0
  ) {
    return 'Cruce orbital';
  }

  return 'Sin cruces relevantes';
}

function probabilityPercent(
  probability01:
    number,
): string {
  if (
    probability01 ===
      0
  ) {
    return '0 %';
  }

  const percentValue =
    probability01 *
    100;

  if (
    percentValue <
      0.000001
  ) {
    return `${new Intl.NumberFormat('es-ES', {
      notation: 'scientific',
      maximumSignificantDigits: 3,
    }).format(percentValue)} %`;
  }

  return `${new Intl.NumberFormat('es-ES', {
    maximumFractionDigits: 8,
  }).format(percentValue)} %`;
}

function auDistance(
  value:
    number,
): string {
  return `${NUMBER_6.format(value)} UA · ${NUMBER_2.format(value * 149_597_870.7)} km`;
}

function signedAu(
  value:
    number,
): string {
  return `${NUMBER_6.format(value)} UA`;
}

function targetKindLabel(
  value:
    string,
): string {
  return value ===
    'PLANET'
    ? 'Planeta'
    : value ===
      'MOON'
      ? 'Luna'
      : value;
}

function encounterOutcomeLabel(
  value:
    string,
): string {
  switch (
    value
  ) {
    case 'BOUND_PERTURBATION':
      return 'Perturbación ligada';
    case 'TEMPORARY_CAPTURE':
      return 'Captura temporal';
    case 'EJECTION':
      return 'Eyección';
    case 'UNBOUND_DEFLECTION':
      return 'Deflexión no ligada';
    case 'NO_ENCOUNTER':
      return 'Sin encuentro';
    default:
      return value;
  }
}

function conicRegimeLabel(
  value:
    string,
): string {
  return value ===
    'ELLIPTIC'
    ? 'Elíptica ligada'
    : value ===
      'HYPERBOLIC'
      ? 'Hiperbólica no ligada'
      : value;
}

function impactRiskRegimeLabel(
  value:
    string,
): string {
  switch (
    value
  ) {
    case 'NONE':
      return 'Sin riesgo orbital';
    case 'RADIAL_CROSSING_ONLY':
      return 'Cruce radial';
    case 'PLANET_APPROACH_CORRIDOR':
      return 'Corredor de aproximación planetaria';
    case 'PLANET_COLLISION_CORRIDOR':
      return 'Corredor geométrico de colisión planetaria';
    case 'MOON_ORBITAL_REGION':
      return 'Región orbital lunar';
    default:
      return value;
  }
}

function temporalRiskRegimeLabel(
  value:
    string,
): string {
  switch (
    value
  ) {
    case 'NONE':
      return 'Sin probabilidad temporal';
    case 'ORBITAL_RISK_ONLY':
      return 'Riesgo orbital sin corredor físico de colisión';
    case 'SINGLE_PASSAGE':
      return 'Probabilidad de paso único';
    case 'EXTREMELY_LOW':
      return 'Probabilidad extremadamente baja';
    case 'VERY_LOW':
      return 'Probabilidad muy baja';
    case 'LOW':
      return 'Probabilidad baja';
    case 'MATERIAL':
      return 'Probabilidad relevante';
    default:
      return value;
  }
}

function transNeptunianRegimeLabel(
  value:
    string,
): string {
  switch (
    value
  ) {
    case 'COLD_CLASSICAL':
      return 'Clásico frío';
    case 'HOT_CLASSICAL':
      return 'Clásico caliente';
    case 'RESONANT':
      return 'Resonante';
    case 'SCATTERED':
      return 'Dispersado';
    case 'DETACHED':
      return 'Desacoplado';
    default:
      return value;
  }
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
