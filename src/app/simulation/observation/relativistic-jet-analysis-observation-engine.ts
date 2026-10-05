import {
  type DiscoveryStateValue,
} from '../../domain/discovery/discovery-state';

import {
  ScientificObservationEvidenceRule,
} from '../../domain/discovery/scientific-observation-evidence-rule';

import {
  GalacticObjectLocator,
} from '../../domain/generation/procedural-locator';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  ObservationActionType,
} from '../../domain/observation/observation-action';

import {
  ObservationInstrumentType,
} from '../../domain/observation/observation-instrument';

import {
  ObservationInstrumentLevel,
} from '../../domain/observation/observation-instrument-capability';

import {
  GalacticRelativisticJetAnalysisProfileEngine,
  type GalacticRelativisticJetAnalysisProfile,
} from '../galactic-object/relativistic-jet-analysis-profile-engine';

export const RELATIVISTIC_JET_ANALYSIS_INSTRUMENT =
  ObservationInstrumentType.RADIO;

export const RELATIVISTIC_JET_ANALYSIS_EVIDENCE_DIMENSION =
  'RELATIVISTIC_JET_28_5';

export const RELATIVISTIC_JET_ANALYSIS_EVIDENCE_CODE =
  'RELATIVISTIC_JET_ANALYSIS';

/**
 * 28.5 radio-interferometric jet campaign. It adds observed evidence only:
 * no DiscoveryState transition, no PD reward/cost and no renderer mutation.
 */
export class RelativisticJetAnalysisObservationEngine {

  private constructor() {}

  static physicalProfileOrNull(
    generationKey:
      UniverseGenerationKey,

    locator:
      GalacticObjectLocator,

    knowledgeState:
      DiscoveryStateValue,
  ): GalacticRelativisticJetAnalysisProfile | null {

    return GalacticRelativisticJetAnalysisProfileEngine
      .resolveConfirmed(
        generationKey,
        locator,
        knowledgeState,
      );
  }

  static evidenceRule():
    ScientificObservationEvidenceRule {

    return new ScientificObservationEvidenceRule({
      profileCode:
        'RELATIVISTIC_JET_CAPABLE_SOURCE',
      ruleCode:
        'ANALYZE_RELATIVISTIC_JETS_28_5',
      observationActionType:
        ObservationActionType.REOBSERVE,
      compatibleInstrumentTypes: [
        RELATIVISTIC_JET_ANALYSIS_INSTRUMENT,
      ],
      minimumInstrumentLevel:
        ObservationInstrumentLevel.LEVEL_4,
      dimensionCode:
        RELATIVISTIC_JET_ANALYSIS_EVIDENCE_DIMENSION,
      evidenceCode:
        RELATIVISTIC_JET_ANALYSIS_EVIDENCE_CODE,
      sourceKey:
        'RELATIVISTIC_JET_RADIO',
      independenceKey:
        'RELATIVISTIC_JET_RADIO_CAMPAIGN',
    });
  }

  static measurementFacts(
    profile:
      GalacticRelativisticJetAnalysisProfile,
  ): readonly Readonly<{
    label:
      string;

    value:
      string;
  }>[] {

    const base: Readonly<{
      label:
        string;

      value:
        string;
    }>[] = [
      Object.freeze({
        label:
          'Fuente analizada',
        value:
          sourceLabel(
            profile.sourceType,
          ),
      }),
      Object.freeze({
        label:
          'Resultado de la campaña',
        value:
          profile.jetSignatureDetected
            ? 'Firma de jet relativista colimado detectada'
            : 'Sin firma de jet relativista colimado en esta campaña',
      }),
    ];

    if (
      !profile.jetSignatureDetected
    ) {
      return Object.freeze([
        ...base,
        Object.freeze({
          label:
            'Interpretación',
          value:
            'No detección observacional; no demuestra ausencia física absoluta del flujo',
        }),
      ]);
    }

    if (
      profile.bulkLorentzFactor ===
        null ||
      profile.bulkVelocityFractionC ===
        null ||
      profile.observerAxisAngleDegrees ===
        null ||
      profile.approachingDopplerFactor ===
        null ||
      profile.recedingDopplerFactor ===
        null ||
      profile.apparentApproachingSpeedC ===
        null ||
      profile.dopplerAsymmetryRatio ===
        null
    ) {
      throw new Error(
        '28.5 detected jet profile is missing its kinematic characterization.',
      );
    }

    const facts: Readonly<{
      label:
        string;

      value:
        string;
    }>[] = [
      ...base,
      Object.freeze({
        label:
          'Factor de Lorentz bulk (modelo)',
        value:
          `Γ = ${profile.bulkLorentzFactor.toFixed(3)}`,
      }),
      Object.freeze({
        label:
          'Velocidad bulk (modelo)',
        value:
          `β = ${profile.bulkVelocityFractionC.toFixed(6)} c`,
      }),
      Object.freeze({
        label:
          'Ángulo eje-observador (modelo)',
        value:
          `${profile.observerAxisAngleDegrees.toFixed(2)}°`,
      }),
      Object.freeze({
        label:
          'Factor Doppler · aproximante',
        value:
          `δ₊ = ${formatCompact(profile.approachingDopplerFactor)}`,
      }),
      Object.freeze({
        label:
          'Factor Doppler · recedente',
        value:
          `δ₋ = ${formatCompact(profile.recedingDopplerFactor)}`,
      }),
      Object.freeze({
        label:
          'Velocidad aparente · aproximante',
        value:
          `${formatCompact(profile.apparentApproachingSpeedC)} c · aparente, no transporte superlumínico`,
      }),
      Object.freeze({
        label:
          'Asimetría Doppler cinemática',
        value:
          `${formatCompact(profile.dopplerAsymmetryRatio)} : 1`,
      }),
    ];

    if (
      profile.totalBipolarKineticPowerWatts !==
        null &&
      profile.powerPerJetWatts !==
        null
    ) {
      facts.push(
        Object.freeze({
          label:
            'Potencia cinética bipolar (modelo 27.7)',
          value:
            `${formatScientific(profile.totalBipolarKineticPowerWatts)} W`,
        }),
      );
      facts.push(
        Object.freeze({
          label:
            'Potencia por jet (modelo 27.7)',
          value:
            `${formatScientific(profile.powerPerJetWatts)} W`,
        }),
      );
    } else {
      facts.push(
        Object.freeze({
          label:
            'Potencia cinética',
          value:
            'No determinada · la fuente distribuida aún no tiene un modelo científico de tasa de acreción',
        }),
      );
    }

    return Object.freeze(
      facts,
    );
  }
}

function sourceLabel(
  sourceType:
    GalacticRelativisticJetAnalysisProfile['sourceType'],
): string {

  switch (
    sourceType
  ) {
    case 'AGN':
      return 'Núcleo galáctico activo';

    case 'QUASAR':
      return 'Quásar';

    case 'MICROQUASAR':
      return 'Microquásar';
  }
}

function formatCompact(
  value:
    number,
): string {

  if (
    value >=
      100
  ) {
    return value.toFixed(
      1,
    );
  }

  if (
    value >=
      10
  ) {
    return value.toFixed(
      2,
    );
  }

  return value.toFixed(
    3,
  );
}

function formatScientific(
  value:
    number,
): string {

  return value
    .toExponential(
      3,
    )
    .replace(
      'e+',
      'e',
    );
}
