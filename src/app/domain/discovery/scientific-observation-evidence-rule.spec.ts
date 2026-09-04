import {
  ObservationActionType,
} from '../observation/observation-action';

import {
  ObservationInstrumentType,
} from '../observation/observation-instrument';

import {
  ObservationInstrumentLevel,
} from '../observation/observation-instrument-capability';

import {
  ScientificObservationEvidenceRule,
} from './scientific-observation-evidence-rule';

describe(
  'ScientificObservationEvidenceRule point 26.A.8',
  () => {
    it(
      'should freeze a reusable observation-to-evidence mapping without target, PD or Ground Truth payload',
      () => {
        const rule =
          new ScientificObservationEvidenceRule({
            profileCode:
              'TEST_OBJECT',
            ruleCode:
              'TEST_RULE',
            observationActionType:
              ObservationActionType.OBSERVE,
            compatibleInstrumentTypes: [
              ObservationInstrumentType.OPTICAL,
            ],
            minimumInstrumentLevel:
              ObservationInstrumentLevel.LEVEL_2,
            dimensionCode:
              'TEST_DIMENSION',
            evidenceCode:
              'TEST_EVIDENCE',
            sourceKey:
              'TEST_SOURCE',
            independenceKey:
              'TEST_METHOD',
          });

        expect(
          rule.compatibleInstrumentTypes,
        ).toEqual([
          ObservationInstrumentType.OPTICAL,
        ]);

        expect(
          Object.isFrozen(
            rule,
          ),
        ).toBe(true);

        expect(
          Object.isFrozen(
            rule.compatibleInstrumentTypes,
          ),
        ).toBe(true);

        expect(
          'targetSeed' in rule,
        ).toBe(false);
        expect(
          'discoveryPointCost' in rule,
        ).toBe(false);
        expect(
          'groundTruth' in rule,
        ).toBe(false);
      },
    );

    it(
      'should reject blank identifiers, duplicate instruments and invalid level ranks',
      () => {
        const base = {
          profileCode:
            'TEST_OBJECT',
          ruleCode:
            'TEST_RULE',
          observationActionType:
            ObservationActionType.OBSERVE,
          compatibleInstrumentTypes: [
            ObservationInstrumentType.OPTICAL,
          ],
          minimumInstrumentLevel:
            ObservationInstrumentLevel.LEVEL_1,
          dimensionCode:
            'TEST_DIMENSION',
          evidenceCode:
            'TEST_EVIDENCE',
          sourceKey:
            'TEST_SOURCE',
          independenceKey:
            'TEST_METHOD',
        } as const;

        expect(
          () =>
            new ScientificObservationEvidenceRule({
              ...base,
              profileCode:
                '   ',
            }),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new ScientificObservationEvidenceRule({
              ...base,
              compatibleInstrumentTypes: [
                ObservationInstrumentType.OPTICAL,
                ObservationInstrumentType.OPTICAL,
              ],
            }),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new ScientificObservationEvidenceRule({
              ...base,
              minimumInstrumentLevel: {
                name:
                  'LEVEL_6',
                rank:
                  6,
              } as unknown as ObservationInstrumentLevel,
            }),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
