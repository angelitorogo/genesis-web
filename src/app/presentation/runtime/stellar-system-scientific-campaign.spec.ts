import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

import {
  evaluateScientificCompleteness,
} from '../../domain/discovery/scientific-completeness';

import {
  STELLAR_SYSTEM_SCIENTIFIC_PROFILE_V1,
} from '../../domain/discovery/stellar-system-scientific-profile';

import {
  ObservationInstrumentType,
} from '../../domain/observation/observation-instrument';

import {
  ObservationInstrumentLevel,
} from '../../domain/observation/observation-instrument-capability';

import {
  ObservationProgressMilestone,
} from '../../domain/observation/observation-instrument-progression';

import {
  StellarSystemScientificObservationRuleCode,
} from '../../simulation/observation/stellar-system-scientific-observation-catalog';

import {
  StellarSystemScientificCampaignAssembler,
} from './stellar-system-scientific-campaign';

import {
  StellarSystemScientificProgressionSnapshot,
} from './stellar-system-scientific-progression.runtime';

describe(
  'StellarSystemScientificCampaignAssembler point 26.A.9',
  () => {
    it(
      'should derive one presentation-only completeness model from the shared persisted snapshot',
      () => {
        const completeness =
          evaluateScientificCompleteness(
            STELLAR_SYSTEM_SCIENTIFIC_PROFILE_V1
              .discoveryProfile
              .requirements,
            [],
          );

        const snapshot =
          new StellarSystemScientificProgressionSnapshot(
            DiscoveryState.DETECTED,
            [],
            completeness,
            500n,
            75n,
            [
              Object.freeze({
                ruleCode:
                  StellarSystemScientificObservationRuleCode.RESOLVE_NATURE_OPTICAL,
                dimensionCode:
                  'NATURE',
                instrumentType:
                  ObservationInstrumentType.OPTICAL,
                selectedLevel:
                  ObservationInstrumentLevel.LEVEL_1,
                minimumLevel:
                  ObservationInstrumentLevel.LEVEL_1,
                isAvailable:
                  false,
                missingGlobalDiscoveryPoints:
                  250n,
                missingMilestones:
                  Object.freeze([
                    ObservationProgressMilestone.FIRST_SYSTEM_DISCOVERED,
                  ]),
              }),
            ],
          );

        const model =
          StellarSystemScientificCampaignAssembler
            .build(
              snapshot,
            );

        expect(model.discoveryStateLabel).toBe('Detectado');
        expect(model.stageLabel).toContain('descubrimiento');
        expect(model.completionPercent).toBe(0);
        expect(model.evidenceCount).toBe(0);
        expect(model.globalDiscoveryPoints).toBe(500n);
        expect(model.galaxyDiscoveryPoints).toBe(75n);
        expect(model.actions).toHaveLength(1);
        expect(model.actions[0]?.instrumentLabel).toBe('Óptico');
        expect(model.actions[0]?.pendingRequirements).toEqual([
          '250 PD adicionales',
          'Descubrir el primer sistema',
        ]);
      },
    );

    it(
      'should expose no Ground Truth fields in the campaign projection',
      () => {
        const snapshot =
          new StellarSystemScientificProgressionSnapshot(
            DiscoveryState.CONFIRMED,
            [],
            evaluateScientificCompleteness(
              STELLAR_SYSTEM_SCIENTIFIC_PROFILE_V1
                .confirmationProfile
                .confirmationRequirements,
              [],
            ),
            0n,
            0n,
            [],
          );

        const serialized =
          JSON.stringify(
            StellarSystemScientificCampaignAssembler
              .build(
                snapshot,
              ),
            (_key, value) =>
              typeof value ===
                'bigint'
                ? value.toString(10)
                : value,
          );

        for (
          const forbidden
          of [
            'groundTruth',
            'exactPhysicalProperties',
            'systemSeed',
            'stellarPhysicalProperties',
            'planetarySystem',
          ]
        ) {
          expect(
            serialized,
          ).not.toContain(
            forbidden,
          );
        }
      },
    );
  },
);
