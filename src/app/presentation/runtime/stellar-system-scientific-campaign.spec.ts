import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

import {
  evaluateScientificCompleteness,
} from '../../domain/discovery/scientific-completeness';

import {
  ScientificEvidence,
} from '../../domain/discovery/scientific-evidence';

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
  StellarSystemScientificObservationCatalogV1,
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
                    ObservationProgressMilestone.FIRST_SYSTEM_CATALOGUED,
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
        expect(model.actions[0]?.isCompleted).toBe(false);
        expect(model.actions[0]?.pendingRequirements).toEqual([
          '250 PD adicionales',
          'Descubrir el primer sistema',
          'Catalogar el primer sistema',
        ]);
      },
    );

    it(
      'should mark an observation as already applied only when its persisted evidence qualifies for the current stage',
      () => {
        const ruleCode =
          StellarSystemScientificObservationRuleCode
            .PHYSICAL_PROPERTIES_OPTICAL;

        const catalogRule =
          StellarSystemScientificObservationCatalogV1
            .rule(
              ruleCode,
            );

        const availability =
          Object.freeze({
            ruleCode,
            dimensionCode:
              catalogRule.dimensionCode,
            instrumentType:
              ObservationInstrumentType.OPTICAL,
            selectedLevel:
              ObservationInstrumentLevel.LEVEL_4,
            minimumLevel:
              ObservationInstrumentLevel.LEVEL_4,
            isAvailable:
              true,
            missingGlobalDiscoveryPoints:
              0n,
            missingMilestones:
              Object.freeze([]),
          });

        const evidenceAt =
          (
            quality01:
              number,
            uncertainty01:
              number,
          ) =>
            new ScientificEvidence({
              dimensionCode:
                catalogRule.dimensionCode,
              evidenceCode:
                catalogRule.evidenceCode,
              sourceKey:
                `${catalogRule.sourceKey}:${ObservationInstrumentType.OPTICAL}`,
              independenceKey:
                catalogRule.independenceKey,
              quality01,
              uncertainty01,
              observedAtEpochMs:
                1,
            });

        const lowQualityEvidence =
          evidenceAt(
            0.80,
            0.20,
          );

        const lowSnapshot =
          new StellarSystemScientificProgressionSnapshot(
            DiscoveryState.CATALOGUED,
            [
              lowQualityEvidence,
            ],
            evaluateScientificCompleteness(
              STELLAR_SYSTEM_SCIENTIFIC_PROFILE_V1
                .confirmationProfile
                .confirmationRequirements,
              [
                lowQualityEvidence,
              ],
            ),
            10_000n,
            500n,
            [
              availability,
            ],
          );

        expect(
          StellarSystemScientificCampaignAssembler
            .build(
              lowSnapshot,
            )
            .actions[0]
            ?.isCompleted,
        ).toBe(false);

        const qualifyingEvidence =
          evidenceAt(
            0.90,
            0.05,
          );

        const qualifyingSnapshot =
          new StellarSystemScientificProgressionSnapshot(
            DiscoveryState.CATALOGUED,
            [
              qualifyingEvidence,
            ],
            evaluateScientificCompleteness(
              STELLAR_SYSTEM_SCIENTIFIC_PROFILE_V1
                .confirmationProfile
                .confirmationRequirements,
              [
                qualifyingEvidence,
              ],
            ),
            10_000n,
            500n,
            [
              availability,
            ],
          );

        expect(
          StellarSystemScientificCampaignAssembler
            .build(
              qualifyingSnapshot,
            )
            .actions[0]
            ?.isCompleted,
        ).toBe(true);
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
