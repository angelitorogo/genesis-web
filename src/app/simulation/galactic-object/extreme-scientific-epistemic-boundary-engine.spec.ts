import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  ExtremeType,
} from '../../domain/galactic-object/extreme-object-type';

import {
  GalacticObjectScientificSubject,
} from '../../domain/galactic-object/galactic-object-scientific-subject';

import {
  ExtremeScientificEpistemicBoundaryEngine,
} from './extreme-scientific-epistemic-boundary-engine';

describe(
  '28.8 — explicit boundary between verifiable science and speculation',
  () => {
    it(
      'keeps AGN observations, verifiable models and excluded inferences explicitly separated',
      () => {
        const model =
          ExtremeScientificEpistemicBoundaryEngine.build(
            ExtremeType.AGN,
            GalacticObjectScientificSubject.ACTIVE_GALACTIC_NUCLEUS,
          );

        expect(
          model.evidence.map((item) => item.code),
        ).toEqual(
          expect.arrayContaining([
            'ACCRETION_DISK_28_1',
            'RELATIVISTIC_JET_CAMPAIGN_28_5',
            'LENSING_CAMPAIGN_28_6',
          ]),
        );

        expect(
          model.verifiableModels.map((item) => item.code),
        ).toEqual(
          expect.arrayContaining([
            'SCHWARZSCHILD_EXTERIOR_28_2',
            'RELATIVISTIC_KINEMATICS_28_5',
            'POINT_LENS_28_6',
          ]),
        );

        expect(
          model.excludedSpeculation.map((item) => item.code),
        ).toEqual(
          expect.arrayContaining([
            'RENDERER_IS_NOT_EVIDENCE',
            'NO_EVENT_HORIZON_INTERIOR',
            'NO_JET_FROM_VISUALS',
            'NO_UNMODELLED_LENS_GEOMETRY',
          ]),
        );

        expect(model.completionPolicy).toContain(
          'nunca conceden completitud ni PD',
        );
      },
    );

    it(
      'keeps magnetar exterior-field inference separate from internal-field speculation',
      () => {
        const model =
          ExtremeScientificEpistemicBoundaryEngine.build(
            ExtremeType.MAGNETAR,
            null,
          );

        expect(
          model.evidence.map((item) => item.code),
        ).toEqual(
          expect.arrayContaining([
            'PULSAR_TIMING_28_3',
            'MAGNETAR_MONITORING_28_4',
          ]),
        );

        expect(
          model.verifiableModels.map((item) => item.code),
        ).toContain(
          'MAGNETAR_DIPOLE_28_4',
        );

        expect(
          model.excludedSpeculation.map((item) => item.code),
        ).toContain(
          'NO_MAGNETAR_INTERIOR',
        );
      },
    );

    it(
      'never promotes renderer appearance into evidence even for an extreme type without a special phase-28 campaign',
      () => {
        const model =
          ExtremeScientificEpistemicBoundaryEngine.build(
            ExtremeType.SUPERNOVA_REMNANT,
            null,
          );

        expect(
          model.evidence.map((item) => item.code),
        ).toEqual([
          'PERSISTED_CAMPAIGN_RESULTS',
        ]);

        expect(
          model.excludedSpeculation.map((item) => item.code),
        ).toContain(
          'RENDERER_IS_NOT_EVIDENCE',
        );

        expect(
          model.verifiableModels.map((item) => item.code),
        ).toContain(
          'NO_ADDITIONAL_SPECIAL_MODEL',
        );
      },
    );
  },
);
