import {
  vi,
} from 'vitest';

import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

import {
  MinorBodyScientificTargetKind,
  type MinorBodyScientificResolvedTarget,
} from '../../simulation/planetary/minor-body-scientific-target-resolver';

import {
  ArchiveDiscoveryLocatorKind,
  type ArchiveDiscoveryDetailModel,
} from '../genesis-archive/archive-discovery-detail.facade';

import {
  MinorBodyScientificCardAssembler,
  MinorBodyScientificFicheResolutionKind,
  type MinorBodyScientificTargetResolutionResolver,
} from './minor-body-scientific-card';

describe(
  'MinorBodyScientificCardAssembler point 26.8',
  () => {

    it(
      'should keep the target resolver behind the host-system CONFIRMED boundary',
      () => {
        const resolveDetailed =
          vi.fn();

        const resolver:
          MinorBodyScientificTargetResolutionResolver =
          Object.freeze({
            resolveDetailed,
          });

        const result =
          MinorBodyScientificCardAssembler
            .build(
              systemModel(
                DiscoveryState.CATALOGUED,
              ),
              MinorBodyScientificTargetKind.ASTEROID,
              'A'.repeat(
                32,
              ),
              resolver,
            );

        expect(result.kind).toBe(
          MinorBodyScientificFicheResolutionKind.LOCKED,
        );
        expect(resolveDetailed).not.toHaveBeenCalled();
      },
    );

    it(
      'should build a safe asteroid fiche with encounter and orbital-risk sections without returning the procedural id',
      () => {
        const resolver:
          MinorBodyScientificTargetResolutionResolver =
          Object.freeze({
            resolveDetailed:
              vi.fn(
                () =>
                  asteroidTarget(),
              ),
          });

        const result =
          MinorBodyScientificCardAssembler
            .build(
              systemModel(
                DiscoveryState.CONFIRMED,
              ),
              MinorBodyScientificTargetKind.ASTEROID,
              'A'.repeat(
                32,
              ),
              resolver,
            );

        expect(result.kind).toBe(
          MinorBodyScientificFicheResolutionKind.AVAILABLE,
        );

        if (
          result.kind !==
          MinorBodyScientificFicheResolutionKind.AVAILABLE
        ) {
          throw new Error(
            'Expected available asteroid fiche.',
          );
        }

        expect(result.card.title).toBe(
          'AST-IN-001',
        );
        expect(
          result.card.sections.sections.map(
            section =>
              section.title,
          ),
        ).toEqual([
          'General',
          'Órbita',
          'Composición',
          'Estructura',
          'Encuentros',
          'Riesgo orbital',
        ]);

        const encounters =
          result.card.sections.sections.find(
            section =>
              section.id ===
              'encounters',
          );

        const risk =
          result.card.sections.sections.find(
            section =>
              section.id ===
              'risk',
          );

        expect(encounters?.fields.some(
          field =>
            field.label ===
              'Resultado del encuentro' &&
            field.value ===
              'Perturbación ligada',
        )).toBe(true);
        expect(risk?.fields.some(
          field =>
            field.label ===
              'Probabilidad temporal máxima (100 años)',
        )).toBe(true);
        expect(risk?.fields.some(
          field =>
            field.label ===
              'Objetivo 1 · Jotheria c',
        )).toBe(true);

        const serialized =
          JSON.stringify(
            result.card,
          );

        expect(serialized).not.toContain(
          'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
        );

        for (
          const forbidden
          of [
            'systemSeed',
            'bodySeed',
            'generationKey',
            'planetarySystem',
            'proceduralId',
            'GroundTruth',
          ]
        ) {
          expect(serialized).not.toContain(
            forbidden,
          );
        }
      },
    );

    it(
      'should build comet nucleus and apsidal activity sections from the resolved projection',
      () => {
        const resolver:
          MinorBodyScientificTargetResolutionResolver =
          Object.freeze({
            resolveDetailed:
              vi.fn(
                () =>
                  cometTarget(),
              ),
          });

        const result =
          MinorBodyScientificCardAssembler
            .build(
              systemModel(
                DiscoveryState.CONFIRMED,
              ),
              MinorBodyScientificTargetKind.COMET,
              'B'.repeat(
                32,
              ),
              resolver,
            );

        expect(result.kind).toBe(
          MinorBodyScientificFicheResolutionKind.AVAILABLE,
        );

        if (
          result.kind !==
          MinorBodyScientificFicheResolutionKind.AVAILABLE
        ) {
          throw new Error(
            'Expected available comet fiche.',
          );
        }

        expect(result.card.kindLabel).toBe(
          'Cometa',
        );
        expect(
          result.card.sections.sections.map(
            section =>
              section.title,
          ),
        ).toEqual([
          'General',
          'Órbita',
          'Núcleo',
          'Actividad',
          'Encuentros',
          'Riesgo orbital',
        ]);

        const activity =
          result.card.sections.sections.find(
            section =>
              section.id ===
              'activity',
          );

        expect(activity?.fields.some(
          field =>
            field.label ===
              'Actividad en periastro' &&
            field.value ===
              'Actividad intensa',
        )).toBe(true);
        expect(activity?.fields.some(
          field =>
            field.label ===
              'Actividad en apoastro' &&
            field.value ===
              'Inactivo',
        )).toBe(true);
      },
    );

    it(
      'should reject malformed individual ids before resolving Ground Truth',
      () => {
        const resolveDetailed =
          vi.fn();

        const result =
          MinorBodyScientificCardAssembler
            .build(
              systemModel(
                DiscoveryState.CONFIRMED,
              ),
              MinorBodyScientificTargetKind.COMET,
              'not-an-id',
              Object.freeze({
                resolveDetailed,
              }),
            );

        expect(result.kind).toBe(
          MinorBodyScientificFicheResolutionKind.NOT_FOUND,
        );
        expect(resolveDetailed).not.toHaveBeenCalled();
      },
    );
  },
);

function systemModel(
  state:
    typeof DiscoveryState.CATALOGUED |
    typeof DiscoveryState.CONFIRMED,
): ArchiveDiscoveryDetailModel {

  return {
    universeSeed:
      '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
    generatorVersionCode:
      1,
    locatorKind:
      ArchiveDiscoveryLocatorKind.SYSTEM,
    discoveryState:
      state,
    discoveryStateLabel:
      state.name,
    galaxyIndex:
      3n,
    sectorKey:
      -17n,
    galacticObjectIndex:
      8n,
    stellarSystemCard: {
      title:
        'Jotheria',
    },
  } as unknown as ArchiveDiscoveryDetailModel;
}

function dynamicsSource() {
  return Object.freeze({
    timeWindowYears:
      100,
    assessedTargetCount:
      4,
    radialCrossingTargetCount:
      2,
    approachCorridorTargetCount:
      1,
    resolvedEncounterCount:
      1,
    riskCandidateCount:
      1,
    directCollisionGeometryTargetCount:
      1,
    highestOrbitalRiskIndex01:
      0.64,
    highestTemporalImpactProbability01:
      2e-7,
    encounter:
      Object.freeze({
        targetKind:
          'PLANET',
        targetName:
          'Jotheria c',
        outcomeRegime:
          'BOUND_PERTURBATION',
        closestApproachAu:
          0.004,
        relativeSpeedKmPerSecond:
          11.2,
        encounterStrengthIndex01:
          0.41,
        orbitalChangeOccurred:
          true,
        outgoingConicRegime:
          'ELLIPTIC',
        outgoingSemiMajorAxisAu:
          3.1,
        outgoingEccentricity:
          0.21,
        outgoingInclinationDegrees:
          7.5,
      }),
    relevantTargets:
      Object.freeze([
        Object.freeze({
          targetKind:
            'PLANET',
          targetName:
            'Jotheria c',
          regime:
            'PLANET_COLLISION_CORRIDOR',
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
          temporalRegime:
            'VERY_LOW',
          temporalImpactProbability01:
            2e-7,
          expectedImpactCount:
            2e-7,
          isSinglePassage:
            false,
        }),
      ]),
  });
}

function asteroidTarget():
  MinorBodyScientificResolvedTarget {
  return Object.freeze({
    identity:
      Object.freeze({
        kind:
          MinorBodyScientificTargetKind.ASTEROID,
        designation:
          'AST-IN-001',
        hostSystemDesignation:
          'Jotheria',
      }),
    detail:
      Object.freeze({
        kind:
          MinorBodyScientificTargetKind.ASTEROID,
        dynamics:
          dynamicsSource(),
        general:
          Object.freeze({
            diameterKilometers: 87.4,
            beltRegion: 'INNER',
            compositionRegime: 'CARBONACEOUS',
            structureRegime: 'RUBBLE_PILE',
            multiplicityRegime: 'BINARY',
            bulkDensityGramsPerCubicCentimeter: 1.6,
            geometricAlbedo01: 0.07,
            porosityIndex01: 0.48,
            sourceBeltPopulationIndex01: 0.72,
            sourceBeltRetainedMassEarth: 0.015,
          }),
        orbit:
          Object.freeze({
            semiMajorAxisAu: 2.4,
            eccentricity: 0.08,
            inclinationDegrees: 4.2,
            periapsisAu: 2.208,
            apoapsisAu: 2.592,
            longitudeAscendingNodeDegrees: 33,
            argumentOfPeriapsisDegrees: 71,
            meanAnomalyDegrees: 122,
            sourceInnerEdgeAu: 2.1,
            sourceOuterEdgeAu: 2.8,
            sourcePeakAu: 2.45,
          }),
        composition:
          Object.freeze({
            carbonaceousFraction01: 0.62,
            silicateFraction01: 0.2,
            metalFraction01: 0.08,
            iceFraction01: 0.1,
            isIceBearing: false,
            isMetalRich: false,
          }),
        structure:
          Object.freeze({
            isRubblePile: true,
            isContactBinary: false,
            isDetachedBinary: true,
            binaryMassRatio01: 0.31,
            binarySeparationPrimaryRadii: 3.4,
          }),
      }),
  });
}

function cometTarget():
  MinorBodyScientificResolvedTarget {
  return Object.freeze({
    identity:
      Object.freeze({
        kind:
          MinorBodyScientificTargetKind.COMET,
        designation:
          'COM-002',
        hostSystemDesignation:
          'Jotheria',
      }),
    detail:
      Object.freeze({
        kind:
          MinorBodyScientificTargetKind.COMET,
        dynamics:
          dynamicsSource(),
        general:
          Object.freeze({
            diameterKilometers: 14.2,
            periodRegime: 'SHORT_PERIOD',
            orbitalPeriodYears: 43.2,
            bulkDensityGramsPerCubicCentimeter: 0.61,
            geometricAlbedo01: 0.04,
            porosityIndex01: 0.63,
            volatileRichnessIndex01: 0.84,
            reservoirSupportIndex01: 0.7,
          }),
        orbit:
          Object.freeze({
            semiMajorAxisAu: 12.3,
            eccentricity: 0.88,
            inclinationDegrees: 17,
            periapsisAu: 1.476,
            apoapsisAu: 23.124,
            longitudeAscendingNodeDegrees: 53,
            argumentOfPeriapsisDegrees: 89,
            meanAnomalyDegrees: 144,
            orbitalPeriodYears: 43.2,
          }),
        nucleus:
          Object.freeze({
            iceFraction01: 0.68,
            dustFraction01: 0.32,
            porosityIndex01: 0.63,
            bulkDensityGramsPerCubicCentimeter: 0.61,
            geometricAlbedo01: 0.04,
            volatileRichnessIndex01: 0.84,
          }),
        activity:
          Object.freeze({
            periapsis:
              Object.freeze({
                distanceAu: 1.476,
                equilibriumTemperatureKelvin: 230,
                incidentFluxEarth: 0.9,
                waterIceActivitySupportIndex01: 1,
                supervolatileActivitySupportIndex01: 1,
                activityIndex01: 0.52,
                activityRegime: 'STRONG',
                hasComa: true,
                hasDustTail: true,
                hasIonTail: true,
              }),
            apoapsis:
              Object.freeze({
                distanceAu: 23.124,
                equilibriumTemperatureKelvin: 62,
                incidentFluxEarth: 0.003,
                waterIceActivitySupportIndex01: 0,
                supervolatileActivitySupportIndex01: 0.08,
                activityIndex01: 0.02,
                activityRegime: 'DORMANT',
                hasComa: false,
                hasDustTail: false,
                hasIonTail: false,
              }),
          }),
      }),
  });
}
