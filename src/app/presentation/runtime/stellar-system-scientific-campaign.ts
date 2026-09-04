import {
  DiscoveryState,
  type DiscoveryStateValue,
} from '../../domain/discovery/discovery-state';

import {
  ObservationProgressMilestone,
  type ObservationProgressMilestone as ObservationProgressMilestoneValue,
} from '../../domain/observation/observation-instrument-progression';

import {
  ObservationInstrumentType,
  type ObservationInstrumentType as ObservationInstrumentTypeValue,
} from '../../domain/observation/observation-instrument';

import {
  StellarSystemScientificObservationRuleCode,
  type StellarSystemScientificObservationRuleCode as StellarSystemScientificObservationRuleCodeValue,
} from '../../simulation/observation/stellar-system-scientific-observation-catalog';

import {
  type StellarSystemScientificProgressionSnapshot,
  type StellarSystemScientificRuleAvailability,
} from './stellar-system-scientific-progression.runtime';

export interface StellarSystemScientificCampaignDimensionModel {
  readonly dimensionCode:
    string;

  readonly label:
    string;

  readonly qualifyingEvidenceCount:
    number;

  readonly requiredEvidenceCount:
    number;

  readonly independentSourceCount:
    number;

  readonly requiredIndependentSources:
    number;

  readonly isSatisfied:
    boolean;
}

export interface StellarSystemScientificCampaignActionModel {
  readonly ruleCode:
    StellarSystemScientificObservationRuleCodeValue;

  readonly label:
    string;

  readonly dimensionLabel:
    string;

  readonly instrumentLabel:
    string;

  readonly selectedLevelRank:
    number;

  readonly minimumLevelRank:
    number;

  readonly isAvailable:
    boolean;

  readonly pendingRequirements:
    readonly string[];
}

export interface StellarSystemScientificCampaignModel {
  readonly discoveryState:
    DiscoveryStateValue;

  readonly discoveryStateLabel:
    string;

  readonly stageLabel:
    string;

  readonly completionPercent:
    number;

  readonly satisfiedRequirementCount:
    number;

  readonly totalRequirementCount:
    number;

  readonly evidenceCount:
    number;

  readonly globalDiscoveryPoints:
    bigint;

  readonly galaxyDiscoveryPoints:
    bigint;

  readonly dimensions:
    readonly StellarSystemScientificCampaignDimensionModel[];

  readonly actions:
    readonly StellarSystemScientificCampaignActionModel[];
}

/**
 * Point-26.A.9 presentation projector for the shared STELLAR_SYSTEM campaign.
 *
 * Every surface receives the exact same persisted state/evidence snapshot from
 * StellarSystemScientificProgressionRuntime. The percentage is presentation-only
 * and is derived from ScientificCompleteness; it is never persisted.
 */
export class StellarSystemScientificCampaignAssembler {

  private constructor() {}

  static build(
    snapshot:
      StellarSystemScientificProgressionSnapshot,
  ): StellarSystemScientificCampaignModel {

    const completeness =
      snapshot.completeness;

    const completionPercent =
      Math.round(
        (
          completeness.satisfiedWeight /
          completeness.totalWeight
        ) *
        100,
      );

    return Object.freeze({
      discoveryState:
        snapshot.discoveryState,

      discoveryStateLabel:
        discoveryStateLabel(
          snapshot.discoveryState,
        ),

      stageLabel:
        campaignStageLabel(
          snapshot.discoveryState,
        ),

      completionPercent,

      satisfiedRequirementCount:
        completeness.satisfiedRequirementCount,

      totalRequirementCount:
        completeness.totalRequirementCount,

      evidenceCount:
        snapshot.evidence.length,

      globalDiscoveryPoints:
        snapshot.globalDiscoveryPoints,

      galaxyDiscoveryPoints:
        snapshot.galaxyDiscoveryPoints,

      dimensions:
        Object.freeze(
          completeness.requirements.map(
            result =>
              Object.freeze({
                dimensionCode:
                  result.requirement.dimensionCode,
                label:
                  dimensionLabel(
                    result.requirement.dimensionCode,
                  ),
                qualifyingEvidenceCount:
                  result.qualifyingEvidenceCount,
                requiredEvidenceCount:
                  result.requirement.minimumEvidenceCount,
                independentSourceCount:
                  result.independentSourceCount,
                requiredIndependentSources:
                  result.requirement.minimumIndependentSources,
                isSatisfied:
                  result.isSatisfied,
              }),
          ),
        ),

      actions:
        Object.freeze(
          snapshot.rules.map(
            rule =>
              buildAction(
                rule,
              ),
          ),
        ),
    });
  }
}

function buildAction(
  rule:
    StellarSystemScientificRuleAvailability,
): StellarSystemScientificCampaignActionModel {

  const pending:
    string[] =
    [];

  if (
    rule.missingGlobalDiscoveryPoints >
    0n
  ) {
    pending.push(
      `${rule.missingGlobalDiscoveryPoints.toString(10)} PD adicionales`,
    );
  }

  for (
    const milestone
    of rule.missingMilestones
  ) {
    pending.push(
      milestoneLabel(
        milestone,
      ),
    );
  }

  return Object.freeze({
    ruleCode:
      rule.ruleCode,
    label:
      observationLabel(
        rule.ruleCode,
      ),
    dimensionLabel:
      dimensionLabel(
        rule.dimensionCode,
      ),
    instrumentLabel:
      instrumentLabel(
        rule.instrumentType,
      ),
    selectedLevelRank:
      rule.selectedLevel.rank,
    minimumLevelRank:
      rule.minimumLevel.rank,
    isAvailable:
      rule.isAvailable,
    pendingRequirements:
      Object.freeze([
        ...pending,
      ]),
  });
}

export function discoveryStateLabel(
  state:
    DiscoveryStateValue,
): string {

  const canonical =
    DiscoveryState.fromCode(
      state.code,
    );

  if (
    canonical ===
    DiscoveryState.DETECTED
  ) {
    return 'Detectado';
  }

  if (
    canonical ===
    DiscoveryState.DISCOVERED
  ) {
    return 'Descubierto';
  }

  if (
    canonical ===
    DiscoveryState.VISITED
  ) {
    return 'Visitado';
  }

  if (
    canonical ===
    DiscoveryState.CATALOGUED
  ) {
    return 'Catalogado';
  }

  if (
    canonical ===
    DiscoveryState.CONFIRMED
  ) {
    return 'Confirmado';
  }

  return 'Desconocido';
}

function campaignStageLabel(
  state:
    DiscoveryStateValue,
): string {

  const canonical =
    DiscoveryState.fromCode(
      state.code,
    );

  if (
    canonical ===
    DiscoveryState.DETECTED
  ) {
    return 'Resolución del descubrimiento';
  }

  if (
    canonical ===
    DiscoveryState.DISCOVERED
  ) {
    return 'Entrada detallada pendiente';
  }

  if (
    canonical ===
    DiscoveryState.VISITED
  ) {
    return 'Catalogación científica';
  }

  if (
    canonical ===
    DiscoveryState.CATALOGUED
  ) {
    return 'Confirmación independiente';
  }

  return 'Campaña científica completada';
}

function dimensionLabel(
  dimensionCode:
    string,
): string {

  switch (
    dimensionCode
  ) {
    case 'NATURE':
      return 'Naturaleza estelar';

    case 'IDENTITY':
      return 'Identidad';

    case 'BASIC_ARCHITECTURE':
      return 'Arquitectura básica';

    case 'STELLAR_CLASSIFICATION':
      return 'Clasificación estelar';

    case 'STELLAR_PHYSICAL_PROPERTIES':
      return 'Propiedades físicas';

    case 'ORBITAL_ARCHITECTURE':
      return 'Arquitectura orbital';

    default:
      return dimensionCode;
  }
}

function observationLabel(
  ruleCode:
    StellarSystemScientificObservationRuleCodeValue,
): string {

  switch (
    ruleCode
  ) {
    case StellarSystemScientificObservationRuleCode.RESOLVE_NATURE_OPTICAL:
      return 'Resolver naturaleza estelar';

    case StellarSystemScientificObservationRuleCode.RESOLVE_IDENTITY_OPTICAL:
      return 'Localizar e identificar el sistema';

    case StellarSystemScientificObservationRuleCode.RESOLVE_BASIC_ARCHITECTURE_OPTICAL:
      return 'Resolver arquitectura básica';

    case StellarSystemScientificObservationRuleCode.CLASSIFICATION_PHOTOMETRY:
      return 'Clasificación fotométrica';

    case StellarSystemScientificObservationRuleCode.PHYSICAL_PROPERTIES_OPTICAL:
      return 'Medir propiedades por fotometría';

    case StellarSystemScientificObservationRuleCode.PHYSICAL_PROPERTIES_RADIO:
      return 'Caracterizar propiedades en radio';

    case StellarSystemScientificObservationRuleCode.ORBITAL_ARCHITECTURE_ASTROMETRY:
      return 'Medir arquitectura por astrometría';

    case StellarSystemScientificObservationRuleCode.ORBITAL_ARCHITECTURE_RADIO_TIMING:
      return 'Medir arquitectura por temporización radio';

    case StellarSystemScientificObservationRuleCode.CLASSIFICATION_SPECTROSCOPY:
      return 'Confirmar clasificación por espectroscopía';

    case StellarSystemScientificObservationRuleCode.PHYSICAL_PROPERTIES_INFRARED:
      return 'Confirmar propiedades en infrarrojo';

    case StellarSystemScientificObservationRuleCode.ORBITAL_ARCHITECTURE_SPECTROSCOPIC_DYNAMICS:
      return 'Confirmar dinámica orbital espectroscópica';
  }

  throw new RangeError(
    `Regla científica estelar no soportada: ${String(ruleCode)}.`,
  );
}

function instrumentLabel(
  instrumentType:
    ObservationInstrumentTypeValue,
): string {

  switch (
    instrumentType
  ) {
    case ObservationInstrumentType.OPTICAL:
      return 'Óptico';

    case ObservationInstrumentType.INFRARED:
      return 'Infrarrojo';

    case ObservationInstrumentType.RADIO:
      return 'Radio';

    case ObservationInstrumentType.SPECTROSCOPY:
      return 'Espectroscopía';

    case ObservationInstrumentType.X_RAY:
      return 'Rayos X';

    case ObservationInstrumentType.GAMMA_RAY:
      return 'Rayos gamma';

    case ObservationInstrumentType.GRAVITATIONAL_WAVE:
      return 'Ondas gravitacionales';

  }

  throw new RangeError(
    `Instrumento observacional no soportado: ${String(instrumentType)}.`,
  );
}

function milestoneLabel(
  milestone:
    ObservationProgressMilestoneValue,
): string {

  switch (
    milestone
  ) {
    case ObservationProgressMilestone.FIRST_SYSTEM_DISCOVERED:
      return 'Descubrir el primer sistema';

    case ObservationProgressMilestone.FIRST_BODY_DISCOVERED:
      return 'Descubrir el primer cuerpo';

    case ObservationProgressMilestone.FIRST_GALACTIC_OBJECT_CATALOGUED:
      return 'Catalogar el primer objeto galáctico';

    case ObservationProgressMilestone.FIRST_TARGET_CONFIRMED:
      return 'Confirmar el primer objetivo científico';

    case ObservationProgressMilestone.FIRST_EXTERNAL_GALAXY_DETECTED:
      return 'Detectar la primera galaxia externa';

  }

  throw new RangeError(
    `Hito observacional no soportado: ${String(milestone)}.`,
  );
}
