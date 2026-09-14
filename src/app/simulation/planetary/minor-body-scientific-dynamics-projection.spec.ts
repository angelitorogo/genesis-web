import {
  MinorBodyApproachTargetKind,
} from '../../domain/planetary/minor-body-approach-target-kind';

import {
  type MinorBodyCloseEncounterCatalog,
} from '../../domain/planetary/minor-body-close-encounter-catalog';

import {
  type MinorBodyImpactRiskCatalog,
} from '../../domain/planetary/minor-body-impact-risk-catalog';

import {
  type MinorBodyOrbitProximityCatalog,
} from '../../domain/planetary/minor-body-orbit-proximity-catalog';

import {
  type MinorBodyTemporalImpactProbabilityCatalog,
} from '../../domain/planetary/minor-body-temporal-impact-probability-catalog';

import {
  MinorBodyScientificDynamicsProjectionAssembler,
} from './minor-body-scientific-dynamics-projection';

describe(
  'MinorBodyScientificDynamicsProjectionAssembler point 26.8',
  () => {

    it(
      'should keep encounter geometry and finite-horizon probability separate in a primitive safe projection',
      () => {
        const planet = {
          name:
            'Jotheria c',
        };

        const directRisk = {
          targetKind:
            MinorBodyApproachTargetKind.PLANET,
          targetName:
            'Jotheria c',
          regime: {
            name:
              'PLANET_COLLISION_CORRIDOR',
          },
          radialRangesOverlap:
            true,
          riskCandidate:
            true,
          directCollisionGeometryCandidate:
            true,
          orbitalRiskIndex01:
            0.64,
          orbitalExposureIndex01:
            0.53,
          minimumNodalSeparationAu:
            0.000001,
          targetCorridorRadiusAu:
            0.02,
          gravitationalFocusingFactor:
            1.8,
          characteristicRelativeSpeedKmPerSecond:
            17.4,
        };

        const radialOnlyRisk = {
          targetKind:
            MinorBodyApproachTargetKind.PLANET,
          targetName:
            'Jotheria d',
          regime: {
            name:
              'RADIAL_CROSSING_ONLY',
          },
          radialRangesOverlap:
            true,
          riskCandidate:
            false,
          directCollisionGeometryCandidate:
            false,
          orbitalRiskIndex01:
            0,
          orbitalExposureIndex01:
            0,
          minimumNodalSeparationAu:
            0.4,
          targetCorridorRadiusAu:
            0.01,
          gravitationalFocusingFactor:
            1.2,
          characteristicRelativeSpeedKmPerSecond:
            22,
        };

        const resolvedEncounter = {
          encounterOccurred:
            true,
          targetKind:
            MinorBodyApproachTargetKind.PLANET,
          targetPlanet:
            planet,
          targetMoon:
            null,
          outcomeRegime: {
            name:
              'BOUND_PERTURBATION',
          },
          closestApproachAu:
            0.004,
          relativeSpeedKmPerSecond:
            11.2,
          encounterStrengthIndex01:
            0.41,
          orbitalChangeOccurred:
            true,
          outgoingOrbitalElements: {
            conicRegime: {
              name:
                'ELLIPTIC',
            },
            semiMajorAxisAu:
              3.1,
            eccentricity:
              0.21,
            inclinationDegrees:
              7.5,
          },
        };

        const temporalDirect = {
          impactRiskAssessment:
            directRisk,
          regime: {
            name:
              'VERY_LOW',
          },
          temporalImpactProbability01:
            2e-7,
          expectedImpactCount:
            2e-7,
          isSinglePassage:
            false,
        };

        const temporalRadial = {
          impactRiskAssessment:
            radialOnlyRisk,
          regime: {
            name:
              'NONE',
          },
          temporalImpactProbability01:
            0,
          expectedImpactCount:
            0,
          isSinglePassage:
            false,
        };

        const projection =
          MinorBodyScientificDynamicsProjectionAssembler
            .build(
              {
                forMinorBody:
                  () => [
                    {
                      radialRangesOverlap:
                        true,
                      approachPossible:
                        true,
                    },
                    {
                      radialRangesOverlap:
                        true,
                      approachPossible:
                        false,
                    },
                  ],
              } as unknown as MinorBodyOrbitProximityCatalog,
              {
                forMinorBody:
                  () => [
                    resolvedEncounter,
                  ],
              } as unknown as MinorBodyCloseEncounterCatalog,
              {
                forMinorBody:
                  () => [
                    directRisk,
                    radialOnlyRisk,
                  ],
              } as unknown as MinorBodyImpactRiskCatalog,
              {
                timeWindowYears:
                  100,
                forMinorBody:
                  () => [
                    temporalDirect,
                    temporalRadial,
                  ],
              } as unknown as MinorBodyTemporalImpactProbabilityCatalog,
              'A'.repeat(
                32,
              ),
            );

        expect(
          projection.radialCrossingTargetCount,
        ).toBe(
          2,
        );
        expect(
          projection.approachCorridorTargetCount,
        ).toBe(
          1,
        );
        expect(
          projection.resolvedEncounterCount,
        ).toBe(
          1,
        );
        expect(
          projection.encounter?.targetName,
        ).toBe(
          'Jotheria c',
        );
        expect(
          projection.encounter?.outcomeRegime,
        ).toBe(
          'BOUND_PERTURBATION',
        );
        expect(
          projection.relevantTargets,
        ).toHaveLength(
          2,
        );
        expect(
          projection.relevantTargets[0]
            .directCollisionGeometryCandidate,
        ).toBe(true);
        expect(
          projection.highestTemporalImpactProbability01,
        ).toBe(
          2e-7,
        );
        expect(
          JSON.stringify(
            projection,
          ),
        ).not.toContain(
          'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
        );
      },
    );
  },
);
