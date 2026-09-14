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
  type ScientificBodyPreviewSceneResolver,
} from '../scientific/scientific-body-preview';

import {
  type SystemSceneSnapshot,
} from '../system/system-scene-snapshot';

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
              previewSceneResolver('ASTEROID'),
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
        expect(result.card.preview.kind).toBe(
          'ASTEROID',
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
            'presentationSeedUint32',
            'shapeSeedUint32',
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
              previewSceneResolver('COMET'),
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
        expect(result.card.preview.kind).toBe(
          'COMET',
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
      'should build a trans-Neptunian fiche with physical, orbital, composition, encounter and risk sections',
      () => {
        const resolver:
          MinorBodyScientificTargetResolutionResolver =
          Object.freeze({
            resolveDetailed:
              vi.fn(
                () =>
                  transNeptunianTarget(),
              ),
          });

        const result =
          MinorBodyScientificCardAssembler
            .build(
              systemModel(
                DiscoveryState.CONFIRMED,
              ),
              MinorBodyScientificTargetKind.TRANS_NEPTUNIAN_OBJECT,
              'C'.repeat(
                32,
              ),
              resolver,
              previewSceneResolver('TNO'),
            );

        expect(result.kind).toBe(
          MinorBodyScientificFicheResolutionKind.AVAILABLE,
        );

        if (
          result.kind !==
          MinorBodyScientificFicheResolutionKind.AVAILABLE
        ) {
          throw new Error(
            'Expected available TNO fiche.',
          );
        }

        expect(result.card.kindLabel).toBe(
          'Objeto transneptuniano',
        );
        expect(result.card.preview.kind).toBe(
          'TRANS_NEPTUNIAN_OBJECT',
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
          'Encuentros',
          'Riesgo orbital',
        ]);

        const serialized =
          JSON.stringify(
            result.card,
          );

        expect(serialized).not.toContain(
          'CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC',
        );
        expect(serialized).not.toContain(
          'proceduralId',
        );
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

function transNeptunianTarget():
  MinorBodyScientificResolvedTarget {
  return Object.freeze({
    identity:
      Object.freeze({
        kind:
          MinorBodyScientificTargetKind.TRANS_NEPTUNIAN_OBJECT,
        designation:
          'TNO-003',
        hostSystemDesignation:
          'Jotheria',
      }),
    detail:
      Object.freeze({
        kind:
          MinorBodyScientificTargetKind.TRANS_NEPTUNIAN_OBJECT,
        dynamics:
          dynamicsSource(),
        general:
          Object.freeze({
            diameterKilometers: 1180,
            dynamicalRegime: 'RESONANT',
            bulkDensityGramsPerCubicCentimeter: 1.62,
            geometricAlbedo01: 0.31,
            reservoirSupportIndex01: 0.78,
            sourceResidualDustMassEarth: 0.048,
            isDwarfPlanetScaleCandidate: true,
          }),
        orbit:
          Object.freeze({
            semiMajorAxisAu: 44.2,
            eccentricity: 0.17,
            inclinationDegrees: 12.4,
            periapsisAu: 36.686,
            apoapsisAu: 51.714,
            longitudeAscendingNodeDegrees: 74,
            argumentOfPeriapsisDegrees: 132,
            meanAnomalyDegrees: 211,
            orbitalPeriodYears: 293.8,
          }),
        composition:
          Object.freeze({
            iceFraction01: 0.72,
            rockFraction01: 0.28,
          }),
      }),
  });
}

function previewSceneResolver(
  kind:
    'ASTEROID' | 'COMET' | 'TNO',
): ScientificBodyPreviewSceneResolver {

  const proceduralId =
    kind === 'ASTEROID'
      ? 'A'.repeat(32)
      : kind === 'COMET'
        ? 'B'.repeat(32)
        : 'C'.repeat(32);

  const minorBody =
    kind === 'ASTEROID'
      ? {
          id: `minor-1-${proceduralId}`,
          minorBodyKind: { name: 'ASTEROID' },
          title: 'Asteroide AST-IN-001',
          colorHex: '#776B5B',
          radiusScene: 0.014,
          asteroidPresentation: {
            version: 1,
            source: 'PHASE_22_4_ASTEROID_TAXONOMY',
            proceduralId,
            sourceDiameterKilometers: 87.4,
            compositionRegime: 'CARBONACEOUS',
            structureRegime: 'RUBBLE_PILE',
            multiplicityRegime: 'BINARY',
            carbonaceousFraction01: 0.6,
            silicateFraction01: 0.25,
            metalFraction01: 0.1,
            iceFraction01: 0.05,
            porosityIndex01: 0.48,
            bulkDensityGramsPerCubicCentimeter: 1.6,
            geometricAlbedo01: 0.07,
            binaryMassRatio01: 0.4,
            binarySeparationPrimaryRadii: 4.2,
            shapeSeedUint32: 0x1234abcd,
            presentationColorHex: '#776B5B',
            presentationRoughness01: 0.91,
            presentationMetalness01: 0.02,
            presentationIrregularity01: 0.57,
            presentationFacetContrast01: 0.22,
            presentationAxisScaleX: 1.08,
            presentationAxisScaleY: 0.94,
            presentationAxisScaleZ: 0.98,
            presentationOrientationXRadians: 0.2,
            presentationOrientationYRadians: 1.1,
            presentationOrientationZRadians: 0.4,
            presentationContactSecondaryRadiusScale01: null,
            presentationDetachedSecondaryRadiusScale01: 0.55,
            presentationDetachedSeparation01: 0.72,
            presentationSeparationAdjusted: false,
          },
          cometPresentation: null,
        }
      : kind === 'COMET'
        ? {
            id: `minor-2-${proceduralId}`,
            minorBodyKind: { name: 'COMET' },
            title: 'Cometa COM-002',
            colorHex: '#DCC7A0',
            radiusScene: 0.014,
            asteroidPresentation: null,
            cometPresentation: {
              version: 1,
              source: 'PHASE_22_6_COMET_ACTIVITY',
              proceduralId,
              sourceDiameterKilometers: 14.2,
              iceFraction01: 0.68,
              dustFraction01: 0.32,
              porosityIndex01: 0.63,
              bulkDensityGramsPerCubicCentimeter: 0.61,
              geometricAlbedo01: 0.04,
              volatileRichnessIndex01: 0.84,
              periodRegime: 'SHORT_PERIOD',
              referenceLuminositySolar: 1,
              semiMajorAxisAu: 12.3,
              eccentricity: 0.88,
              periapsisAu: 1.476,
              apoapsisAu: 23.124,
              orbitalPeriodYears: 43.2,
              epochMeanAnomalyDegrees: 144,
              presentationTimeScale: 1,
              shapeSeedUint32: 0x89abcdef,
              presentationNucleusColorHex: '#55504A',
              presentationComaColorHex: '#D8F4E8',
              presentationDustTailColorHex: '#E8D6AA',
              presentationIonTailColorHex: '#91BEFF',
              presentationNucleusRoughness01: 0.96,
              presentationNucleusAxisScaleX: 1.1,
              presentationNucleusAxisScaleY: 0.91,
              presentationNucleusAxisScaleZ: 0.99,
              presentationNucleusIrregularity01: 0.62,
            },
          }
        : {
            id: `minor-3-${proceduralId}`,
            minorBodyKind: { name: 'TRANS_NEPTUNIAN_OBJECT' },
            title: 'Objeto transneptuniano TNO-003',
            colorHex: '#75A9D2',
            radiusScene: 0.014,
            asteroidPresentation: null,
            cometPresentation: null,
          };

  return Object.freeze({
    build: () =>
      ({
        universeSeed:
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        generatorVersionCode:
          1,
        proceduralIdentity:
          'G3/S-17/O8',
        planets: [],
        moons: [],
        minorBodies: [
          minorBody,
        ],
      } as unknown as SystemSceneSnapshot),
  });
}
