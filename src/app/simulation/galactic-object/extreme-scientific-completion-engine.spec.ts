import {
  ScientificEvidence,
} from '../../domain/discovery/scientific-evidence';

import {
  ExtremeType,
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

import {
  ExtremeScientificCompletionEngine,
  ExtremeScientificStudyCode,
} from './extreme-scientific-completion-engine';

function evidence(
  dimensionCode:
    string,

  evidenceCode:
    string,
): ScientificEvidence {
  return new ScientificEvidence({
    dimensionCode,
    evidenceCode,
    sourceKey:
      `${dimensionCode}:TEST`,
    independenceKey:
      `${dimensionCode}:INDEPENDENT`,
    quality01:
      1,
    uncertainty01:
      0,
    observedAtEpochMs:
      1,
  });
}

describe(
  '28.7 — extreme scientific completion policy',
  () => {
    it(
      'requires the four implemented evidence-producing studies for an active AGN/QUASAR nucleus',
      () => {
        const result =
          ExtremeScientificCompletionEngine
            .evaluate(
              ExtremeType.AGN,
              GalacticObjectScientificSubject.ACTIVE_GALACTIC_NUCLEUS,
              [
                evidence(
                  RELATIVISTIC_JET_ANALYSIS_EVIDENCE_DIMENSION,
                  RELATIVISTIC_JET_ANALYSIS_EVIDENCE_CODE,
                ),
                evidence(
                  GRAVITATIONAL_LENSING_RECONSTRUCTION_EVIDENCE_DIMENSION,
                  GRAVITATIONAL_LENSING_RECONSTRUCTION_EVIDENCE_CODE,
                ),
              ],
              [
                evidence(
                  ACCRETION_DISK_EVIDENCE_DIMENSION,
                  ACCRETION_DISK_EVIDENCE_CODE,
                ),
              ],
              true,
            );

        expect(result).not.toBeNull();
        expect(result!.complete).toBe(true);
        expect(result!.completedStudies).toBe(4);
        expect(result!.completionPercent).toBe(100);
        expect(result!.rewardDiscoveryPoints).toBe(750n);
        expect(result!.studies.map(study => study.code)).toEqual([
          ExtremeScientificStudyCode.ACCRETION_DISK,
          ExtremeScientificStudyCode.EVENT_HORIZON,
          ExtremeScientificStudyCode.RELATIVISTIC_JETS,
          ExtremeScientificStudyCode.GRAVITATIONAL_LENSING,
        ]);
      },
    );

    it(
      'counts campaign completion evidence independently of positive/negative observational outcome payloads',
      () => {
        const result =
          ExtremeScientificCompletionEngine
            .evaluate(
              ExtremeType.MICROQUASAR,
              GalacticObjectScientificSubject.DISTRIBUTED_EXTREME_OBJECT,
              [
                evidence(
                  RELATIVISTIC_JET_ANALYSIS_EVIDENCE_DIMENSION,
                  RELATIVISTIC_JET_ANALYSIS_EVIDENCE_CODE,
                ),
              ],
              [],
            );

        expect(result?.complete).toBe(true);
        expect(result?.rewardDiscoveryPoints).toBe(250n);
      },
    );

    it(
      'requires pulse timing plus magnetic monitoring for a magnetar and only timing for pulsars/XRB-NS',
      () => {
        const timing =
          evidence(
            PULSAR_TIMING_EVIDENCE_DIMENSION,
            PULSAR_TIMING_EVIDENCE_CODE,
          );

        const magnetarPartial =
          ExtremeScientificCompletionEngine
            .evaluate(
              ExtremeType.MAGNETAR,
              GalacticObjectScientificSubject.DISTRIBUTED_EXTREME_OBJECT,
              [
                timing,
              ],
              [],
            );

        expect(magnetarPartial?.completedStudies).toBe(1);
        expect(magnetarPartial?.totalStudies).toBe(2);
        expect(magnetarPartial?.complete).toBe(false);

        const magnetarComplete =
          ExtremeScientificCompletionEngine
            .evaluate(
              ExtremeType.MAGNETAR,
              GalacticObjectScientificSubject.DISTRIBUTED_EXTREME_OBJECT,
              [
                timing,
                evidence(
                  MAGNETAR_ACTIVITY_EVIDENCE_DIMENSION,
                  MAGNETAR_ACTIVITY_EVIDENCE_CODE,
                ),
              ],
              [],
            );

        expect(magnetarComplete?.complete).toBe(true);
        expect(magnetarComplete?.rewardDiscoveryPoints).toBe(350n);

        for (
          const type
          of [
            ExtremeType.PULSAR,
            ExtremeType.MILLISECOND_PULSAR,
            ExtremeType.X_RAY_BINARY_NS,
          ]
        ) {
          const result =
            ExtremeScientificCompletionEngine
              .evaluate(
                type,
                GalacticObjectScientificSubject.DISTRIBUTED_EXTREME_OBJECT,
                [
                  timing,
                ],
                [],
              );

          expect(result?.complete).toBe(true);
          expect(result?.totalStudies).toBe(1);
        }
      },
    );

    it(
      'does not manufacture a 0/0 completion dossier for extreme types without a currently implemented special study',
      () => {
        expect(
          ExtremeScientificCompletionEngine
            .evaluate(
              ExtremeType.NEUTRON_STAR,
              GalacticObjectScientificSubject.DISTRIBUTED_EXTREME_OBJECT,
              [],
              [],
            ),
        ).toBeNull();
      },
    );
  },
);
