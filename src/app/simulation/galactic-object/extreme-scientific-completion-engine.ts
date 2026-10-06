import {
  type ScientificEvidence,
} from '../../domain/discovery/scientific-evidence';

import {
  ExtremeType,
  type ExtremeType as ExtremeTypeValue,
} from '../../domain/galactic-object/extreme-object-type';

import {
  GalacticObjectScientificSubject,
} from '../../domain/galactic-object/galactic-object-scientific-subject';

import {
  ACCRETION_DISK_EVIDENCE_CODE,
  ACCRETION_DISK_EVIDENCE_DIMENSION,
} from '../observation/accretion-disk-observation-engine';

import {
  GRAVITATIONAL_LENSING_RECONSTRUCTION_EVIDENCE_CODE,
  GRAVITATIONAL_LENSING_RECONSTRUCTION_EVIDENCE_DIMENSION,
} from '../observation/gravitational-lensing-reconstruction-observation-engine';

import {
  MAGNETAR_ACTIVITY_EVIDENCE_CODE,
  MAGNETAR_ACTIVITY_EVIDENCE_DIMENSION,
} from '../observation/magnetar-activity-observation-engine';

import {
  PULSAR_TIMING_EVIDENCE_CODE,
  PULSAR_TIMING_EVIDENCE_DIMENSION,
} from '../observation/pulsar-timing-observation-engine';

import {
  RELATIVISTIC_JET_ANALYSIS_EVIDENCE_CODE,
  RELATIVISTIC_JET_ANALYSIS_EVIDENCE_DIMENSION,
} from '../observation/relativistic-jet-analysis-observation-engine';

export const ExtremeScientificStudyCode =
  Object.freeze({
    ACCRETION_DISK:
      'ACCRETION_DISK_28_1',

    EVENT_HORIZON:
      'EVENT_HORIZON_28_2',

    PULSAR_TIMING:
      'PULSAR_TIMING_28_3',

    MAGNETAR_ACTIVITY:
      'MAGNETAR_ACTIVITY_28_4',

    RELATIVISTIC_JETS:
      'RELATIVISTIC_JETS_28_5',

    GRAVITATIONAL_LENSING:
      'GRAVITATIONAL_LENSING_28_6',
  } as const);

export type ExtremeScientificStudyCode =
  typeof ExtremeScientificStudyCode[
    keyof typeof ExtremeScientificStudyCode
  ];

export interface ExtremeScientificStudyStatus {
  readonly code:
    ExtremeScientificStudyCode;

  readonly phaseLabel:
    string;

  readonly label:
    string;

  readonly completed:
    boolean;

  readonly completedLabel:
    string;

  readonly pendingLabel:
    string;
}

export interface ExtremeScientificCompletionEvaluation {
  readonly studies:
    readonly ExtremeScientificStudyStatus[];

  readonly completedStudies:
    number;

  readonly totalStudies:
    number;

  readonly completionPercent:
    number;

  readonly complete:
    boolean;

  readonly rewardDiscoveryPoints:
    bigint;
}

interface StudyDefinition {
  readonly code:
    ExtremeScientificStudyCode;

  readonly phaseLabel:
    string;

  readonly label:
    string;

  readonly completedLabel:
    string;

  readonly pendingLabel:
    string;

  readonly evidenceDimension:
    string | null;

  readonly evidenceCode:
    string | null;

  readonly evidenceScope:
    'TARGET' | 'GALAXY' | 'EVENT_HORIZON_LEDGER';
}

const STUDIES =
  Object.freeze({
    [ExtremeScientificStudyCode.ACCRETION_DISK]:
      Object.freeze({
        code: ExtremeScientificStudyCode.ACCRETION_DISK,
        phaseLabel: '28.1',
        label: 'Observar disco de acreción',
        completedLabel: 'Evidencia científica registrada',
        pendingLabel: 'Pendiente · observar el disco en la ficha galáctica',
        evidenceDimension: ACCRETION_DISK_EVIDENCE_DIMENSION,
        evidenceCode: ACCRETION_DISK_EVIDENCE_CODE,
        evidenceScope: 'GALAXY',
      } satisfies StudyDefinition),

    [ExtremeScientificStudyCode.EVENT_HORIZON]:
      Object.freeze({
        code: ExtremeScientificStudyCode.EVENT_HORIZON,
        phaseLabel: '28.2',
        label: 'Aproximación externa al horizonte',
        completedLabel: 'Simulación exterior completada y registrada',
        pendingLabel: 'Pendiente · completar la aproximación exterior al límite seguro',
        evidenceDimension: null,
        evidenceCode: null,
        evidenceScope: 'EVENT_HORIZON_LEDGER',
      } satisfies StudyDefinition),

    [ExtremeScientificStudyCode.PULSAR_TIMING]:
      Object.freeze({
        code: ExtremeScientificStudyCode.PULSAR_TIMING,
        phaseLabel: '28.3',
        label: 'Sincronizar / medir pulsos',
        completedLabel: 'Evidencia científica registrada',
        pendingLabel: 'Pendiente · completar la campaña de temporización',
        evidenceDimension: PULSAR_TIMING_EVIDENCE_DIMENSION,
        evidenceCode: PULSAR_TIMING_EVIDENCE_CODE,
        evidenceScope: 'TARGET',
      } satisfies StudyDefinition),

    [ExtremeScientificStudyCode.MAGNETAR_ACTIVITY]:
      Object.freeze({
        code: ExtremeScientificStudyCode.MAGNETAR_ACTIVITY,
        phaseLabel: '28.4',
        label: 'Campo magnético y estallidos',
        completedLabel: 'Evidencia científica registrada',
        pendingLabel: 'Pendiente · completar la monitorización magnética',
        evidenceDimension: MAGNETAR_ACTIVITY_EVIDENCE_DIMENSION,
        evidenceCode: MAGNETAR_ACTIVITY_EVIDENCE_CODE,
        evidenceScope: 'TARGET',
      } satisfies StudyDefinition),

    [ExtremeScientificStudyCode.RELATIVISTIC_JETS]:
      Object.freeze({
        code: ExtremeScientificStudyCode.RELATIVISTIC_JETS,
        phaseLabel: '28.5',
        label: 'Analizar jets relativistas',
        completedLabel: 'Evidencia científica registrada',
        pendingLabel: 'Pendiente · completar el análisis radiointerferométrico',
        evidenceDimension: RELATIVISTIC_JET_ANALYSIS_EVIDENCE_DIMENSION,
        evidenceCode: RELATIVISTIC_JET_ANALYSIS_EVIDENCE_CODE,
        evidenceScope: 'TARGET',
      } satisfies StudyDefinition),

    [ExtremeScientificStudyCode.GRAVITATIONAL_LENSING]:
      Object.freeze({
        code: ExtremeScientificStudyCode.GRAVITATIONAL_LENSING,
        phaseLabel: '28.6',
        label: 'Lente gravitacional y reconstrucción de fuente',
        completedLabel: 'Evidencia científica registrada',
        pendingLabel: 'Pendiente · completar la reconstrucción de lente/fuente',
        evidenceDimension: GRAVITATIONAL_LENSING_RECONSTRUCTION_EVIDENCE_DIMENSION,
        evidenceCode: GRAVITATIONAL_LENSING_RECONSTRUCTION_EVIDENCE_CODE,
        evidenceScope: 'TARGET',
      } satisfies StudyDefinition),
  } as const);

/**
 * 28.7 pure completion policy.
 *
 * The engine consumes canonical persisted scientific evidence plus the
 * explicit non-physical 28.2 completion-ledger signal. It never regenerates
 * hidden physical values, never interprets renderer state and never changes a
 * DiscoveryState. A negative observational result still counts because the
 * campaign evidence code is persisted by the same action runtime.
 */
export class ExtremeScientificCompletionEngine {
  private constructor() {}

  static applicableStudyCodes(
    extremeType:
      ExtremeTypeValue,

    scientificSubject:
      GalacticObjectScientificSubject | null,
  ): readonly ExtremeScientificStudyCode[] {

    if (
      scientificSubject ===
        GalacticObjectScientificSubject.ACTIVE_GALACTIC_NUCLEUS &&
      (
        extremeType === ExtremeType.AGN ||
        extremeType === ExtremeType.QUASAR
      )
    ) {
      return Object.freeze([
        ExtremeScientificStudyCode.ACCRETION_DISK,
        ExtremeScientificStudyCode.EVENT_HORIZON,
        ExtremeScientificStudyCode.RELATIVISTIC_JETS,
        ExtremeScientificStudyCode.GRAVITATIONAL_LENSING,
      ]);
    }

    if (
      extremeType ===
        ExtremeType.INTERMEDIATE_MASS_BLACK_HOLE
    ) {
      return Object.freeze([
        ExtremeScientificStudyCode.EVENT_HORIZON,
        ExtremeScientificStudyCode.GRAVITATIONAL_LENSING,
      ]);
    }

    if (
      extremeType ===
        ExtremeType.MAGNETAR
    ) {
      return Object.freeze([
        ExtremeScientificStudyCode.PULSAR_TIMING,
        ExtremeScientificStudyCode.MAGNETAR_ACTIVITY,
      ]);
    }

    if (
      extremeType ===
        ExtremeType.PULSAR ||
      extremeType ===
        ExtremeType.MILLISECOND_PULSAR ||
      extremeType ===
        ExtremeType.X_RAY_BINARY_NS
    ) {
      return Object.freeze([
        ExtremeScientificStudyCode.PULSAR_TIMING,
      ]);
    }

    if (
      extremeType ===
        ExtremeType.MICROQUASAR
    ) {
      return Object.freeze([
        ExtremeScientificStudyCode.RELATIVISTIC_JETS,
      ]);
    }

    return Object.freeze([]);
  }

  static rewardFor(
    extremeType:
      ExtremeTypeValue,

    totalStudies:
      number,
  ): bigint {

    if (
      totalStudies <= 0
    ) {
      return 0n;
    }

    switch (
      extremeType
    ) {
      case ExtremeType.PULSAR:
        return 150n;

      case ExtremeType.MILLISECOND_PULSAR:
        return 200n;

      case ExtremeType.X_RAY_BINARY_NS:
        return 200n;

      case ExtremeType.MICROQUASAR:
        return 250n;

      case ExtremeType.MAGNETAR:
        return 350n;

      case ExtremeType.INTERMEDIATE_MASS_BLACK_HOLE:
        return 500n;

      case ExtremeType.AGN:
        return 750n;

      case ExtremeType.QUASAR:
        return 900n;

      default:
        return BigInt(
          100 *
          totalStudies,
        );
    }
  }

  static evaluate(
    extremeType:
      ExtremeTypeValue,

    scientificSubject:
      GalacticObjectScientificSubject | null,

    targetEvidence:
      readonly ScientificEvidence[],

    galaxyEvidence:
      readonly ScientificEvidence[],

    eventHorizonCompleted =
      false,
  ): ExtremeScientificCompletionEvaluation | null {

    const codes =
      this.applicableStudyCodes(
        extremeType,
        scientificSubject,
      );

    if (
      codes.length ===
        0
    ) {
      return null;
    }

    const studies =
      codes.map(
        code => {
          const definition =
            STUDIES[
              code
            ];

          const completed =
            definition.evidenceScope ===
              'EVENT_HORIZON_LEDGER'
              ? eventHorizonCompleted
              : (
                  definition.evidenceScope ===
                    'GALAXY'
                    ? galaxyEvidence
                    : targetEvidence
                )
                  .some(
                    item =>
                      item.dimensionCode ===
                        definition.evidenceDimension &&
                      item.evidenceCode ===
                        definition.evidenceCode,
                  );

          return Object.freeze({
            code:
              definition.code,
            phaseLabel:
              definition.phaseLabel,
            label:
              definition.label,
            completed,
            completedLabel:
              definition.completedLabel,
            pendingLabel:
              definition.pendingLabel,
          });
        },
      );

    const completedStudies =
      studies.filter(
        study =>
          study.completed,
      ).length;

    const totalStudies =
      studies.length;

    return Object.freeze({
      studies:
        Object.freeze(
          studies,
        ),
      completedStudies,
      totalStudies,
      completionPercent:
        Math.round(
          completedStudies /
          totalStudies *
          100,
        ),
      complete:
        completedStudies ===
        totalStudies,
      rewardDiscoveryPoints:
        this.rewardFor(
          extremeType,
          totalStudies,
        ),
    });
  }

}
